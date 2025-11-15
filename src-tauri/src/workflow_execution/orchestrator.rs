use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::Instant;
use std::pin::Pin;
use std::future::Future;
use serde_json::{json, Value as JsonValue};
use tauri::{AppHandle, Emitter, Runtime};
use yaak_models::error::{Error, Result};
use yaak_models::models::{
    NodeExecutionState, WorkflowExecution, WorkflowExecutionState,
    WorkflowNode, WorkflowNodeExecution,
};
use yaak_models::query_manager::QueryManagerExt;
use yaak_models::util::{generate_prefixed_id, UpdateSource};

use super::context::{ExecutionContext, LoopContext, NodeResult};
use super::graph_builder::{ExecutionGraph, ExecutionStep, GraphBuilder};

/// Workflow orchestrator manages canvas-based workflow execution
pub struct WorkflowOrchestrator<R: Runtime> {
    app_handle: AppHandle<R>,
    cancellation_tokens: Arc<RwLock<HashMap<String, bool>>>,
}

impl<R: Runtime> Clone for WorkflowOrchestrator<R> {
    fn clone(&self) -> Self {
        Self {
            app_handle: self.app_handle.clone(),
            cancellation_tokens: Arc::clone(&self.cancellation_tokens),
        }
    }
}

impl<R: Runtime> WorkflowOrchestrator<R> {
    pub fn new(app_handle: AppHandle<R>) -> Self {
        Self {
            app_handle,
            cancellation_tokens: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Execute workflow (non-blocking)
    /// Returns execution_id immediately and spawns async task
    pub async fn execute(
        &self,
        workflow_id: String,
        environment_id: Option<String>,
    ) -> Result<String> {
        let db = self.app_handle.db();

        // 1. Build execution graph (validates workflow)
        let graph = GraphBuilder::build(&workflow_id, &db)?;

        // 2. Load workflow
        let workflow = db.get_workflow(&workflow_id)?;

        // 3. Create WorkflowExecution record
        let execution = WorkflowExecution {
            id: generate_prefixed_id("we"),
            model: "workflow_execution".to_string(),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
            deleted_at: None,
            workflow_id: workflow.id.clone(),
            workspace_id: workflow.workspace_id.clone(),
            environment_id: environment_id.clone(),
            elapsed: None,
            state: WorkflowExecutionState::Initialized,
            error: None,
        };

        let execution_id = execution.id.clone();
        db.upsert(&execution, &UpdateSource::Background)?;

        // 4. Register cancellation token
        self.cancellation_tokens
            .write()
            .unwrap()
            .insert(execution_id.clone(), false);

        // 5. Spawn async execution task
        let orchestrator = self.clone();
        let exec_id_for_spawn = execution_id.clone();
        let workflow_id_for_spawn = workflow_id.clone();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = orchestrator.run_workflow(exec_id_for_spawn.clone(), workflow_id_for_spawn, graph, environment_id).await {
                eprintln!("Workflow execution failed: {}", e);
                let _ = orchestrator.update_execution_state(
                    &exec_id_for_spawn,
                    WorkflowExecutionState::Failed,
                    Some(e.to_string()),
                    None,
                ).await;
            }
        });

        // 6. Return execution ID immediately
        Ok(execution_id)
    }

    /// Main execution loop
    async fn run_workflow(
        &self,
        execution_id: String,
        workflow_id: String,
        graph: ExecutionGraph,
        environment_id: Option<String>,
    ) -> Result<()> {
        let start_time = Instant::now();

        // Update state to Running
        self.update_execution_state(
            &execution_id,
            WorkflowExecutionState::Running,
            None,
            None,
        ).await?;

        // Initialize execution context
        let mut context = ExecutionContext::new(
            workflow_id.clone(),
            execution_id.clone(),
            environment_id,
        );

        // Execute steps in order
        for step in &graph.execution_order {
            // Check cancellation
            if self.is_cancelled(&execution_id) {
                self.update_execution_state(
                    &execution_id,
                    WorkflowExecutionState::Cancelled,
                    None,
                    None,
                ).await?;
                return Ok(());
            }

            // Execute step
            if let Err(e) = self.execute_step(step, &graph, &mut context).await {
                let elapsed = start_time.elapsed().as_millis() as i32;
                self.update_execution_state(
                    &execution_id,
                    WorkflowExecutionState::Failed,
                    Some(e.to_string()),
                    Some(elapsed),
                ).await?;
                return Err(e);
            }
        }

        // Mark as completed
        let elapsed = start_time.elapsed().as_millis() as i32;
        self.update_execution_state(
            &execution_id,
            WorkflowExecutionState::Completed,
            None,
            Some(elapsed),
        ).await?;

        Ok(())
    }

    /// Execute single step based on type
    fn execute_step<'a>(
        &'a self,
        step: &'a ExecutionStep,
        graph: &'a ExecutionGraph,
        context: &'a mut ExecutionContext,
    ) -> Pin<Box<dyn Future<Output = Result<()>> + Send + 'a>> {
        Box::pin(async move {
            match step {
                ExecutionStep::Sequential { node_id } => {
                    self.execute_node(node_id, graph, context).await
                }
                ExecutionStep::Parallel { node_ids } => {
                    self.execute_parallel(node_ids, graph, context).await
                }
                ExecutionStep::Conditional { node_id, true_branch, false_branch } => {
                    self.execute_conditional(node_id, true_branch, false_branch, graph, context).await
                }
                ExecutionStep::Loop { node_id, body } => {
                    self.execute_loop(node_id, body, graph, context).await
                }
            }
        })
    }

    /// Execute single node
    async fn execute_node(
        &self,
        node_id: &str,
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        let node = graph.nodes.get(node_id)
            .ok_or_else(|| Error::GenericError(format!("Node not found: {}", node_id)))?;

        // Skip disabled nodes
        if !node.enabled {
            return Ok(());
        }

        // Create node execution record
        let node_execution = WorkflowNodeExecution {
            id: generate_prefixed_id("wne"),
            model: "workflow_node_execution".to_string(),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
            deleted_at: None,
            workflow_execution_id: context.execution_id.clone(),
            workflow_node_id: node.id.clone(),
            elapsed: None,
            state: NodeExecutionState::Running,
            error: None,
            result: None,
            loop_iteration: context.loop_stack.last().map(|l| l.index as i32),
        };

        self.app_handle.db().upsert(&node_execution, &UpdateSource::Background)?;

        // Emit event
        let _ = self.app_handle.emit("workflow_node_started", json!({
            "executionId": context.execution_id,
            "nodeId": node.id,
        }));

        let start_time = Instant::now();

        // Execute based on node subtype
        let result = match node.node_subtype.as_str() {
            "manual_trigger" | "webhook_trigger" | "timer_trigger" => {
                // Triggers just pass through
                Ok(json!({}))
            }
            "http_request" => {
                self.execute_http_request(node, context).await
            }
            "grpc_request" => {
                self.execute_grpc_request(node, context).await
            }
            "email" => {
                self.execute_email(node, context).await
            }
            "database" => {
                self.execute_database(node, context).await
            }
            "websocket" => {
                self.execute_websocket(node, context).await
            }
            _ => {
                Err(Error::GenericError(format!("Unknown node subtype: {}", node.node_subtype)))
            }
        };

        let elapsed = start_time.elapsed().as_millis() as i32;

        // Update node execution with result
        match result {
            Ok(output) => {
                let updated_execution = WorkflowNodeExecution {
                    elapsed: Some(elapsed),
                    state: NodeExecutionState::Completed,
                    result: Some(output.clone()),
                    ..node_execution
                };
                self.app_handle.db().upsert(&updated_execution, &UpdateSource::Background)?;

                // Store result in context
                context.node_results.insert(node.id.clone(), NodeResult {
                    node_id: node.id.clone(),
                    output: output.clone(),
                    elapsed,
                    loop_results: None,
                    parallel_results: None,
                });

                let _ = self.app_handle.emit("workflow_node_completed", json!({
                    "executionId": context.execution_id,
                    "nodeId": node.id,
                    "state": "completed",
                }));

                Ok(())
            }
            Err(e) => {
                let updated_execution = WorkflowNodeExecution {
                    elapsed: Some(elapsed),
                    state: NodeExecutionState::Failed,
                    error: Some(e.to_string()),
                    ..node_execution
                };
                self.app_handle.db().upsert(&updated_execution, &UpdateSource::Background)?;

                let _ = self.app_handle.emit("workflow_node_failed", json!({
                    "executionId": context.execution_id,
                    "nodeId": node.id,
                    "error": e.to_string(),
                }));

                Err(e)
            }
        }
    }

    /// Execute HTTP request node
    async fn execute_http_request(
        &self,
        node: &WorkflowNode,
        context: &ExecutionContext,
    ) -> Result<JsonValue> {
        // 1. Render template variables in config
        let rendered_config = self.render_node_config(&node.config, context)?;

        // 2. Extract HTTP request params
        let method = rendered_config.get("method")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::GenericError("Missing 'method' in HTTP request config".to_string()))?;

        let url = rendered_config.get("url")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::GenericError("Missing 'url' in HTTP request config".to_string()))?;

        // 3. Build basic response (placeholder - integrate with existing HTTP logic later)
        // TODO: Integrate with existing send_http_request logic from http_request.rs
        Ok(json!({
            "status": 200,
            "statusText": "OK",
            "headers": {},
            "body": format!("HTTP {} {} - Integration pending", method, url),
            "elapsed": 0,
            "url": url,
        }))
    }

    /// Execute gRPC request node
    async fn execute_grpc_request(
        &self,
        node: &WorkflowNode,
        context: &ExecutionContext,
    ) -> Result<JsonValue> {
        let rendered_config = self.render_node_config(&node.config, context)?;

        let service = rendered_config.get("service")
            .and_then(|v| v.as_str())
            .unwrap_or("UnknownService");

        // TODO: Integrate with existing gRPC execution logic
        Ok(json!({
            "service": service,
            "response": "gRPC integration pending",
        }))
    }

    /// Execute email node
    async fn execute_email(
        &self,
        node: &WorkflowNode,
        context: &ExecutionContext,
    ) -> Result<JsonValue> {
        let rendered_config = self.render_node_config(&node.config, context)?;

        let to = rendered_config.get("to")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        let subject = rendered_config.get("subject")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        // TODO: Use plugin system for SMTP
        Ok(json!({
            "to": to,
            "subject": subject,
            "sent": false,
            "message": "Email integration pending - requires plugin",
        }))
    }

    /// Execute database node
    async fn execute_database(
        &self,
        node: &WorkflowNode,
        context: &ExecutionContext,
    ) -> Result<JsonValue> {
        let rendered_config = self.render_node_config(&node.config, context)?;

        let query = rendered_config.get("query")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        // TODO: Parse connection string from environment and execute SQL
        Ok(json!({
            "query": query,
            "rows": [],
            "message": "Database integration pending",
        }))
    }

    /// Execute WebSocket node
    async fn execute_websocket(
        &self,
        node: &WorkflowNode,
        context: &ExecutionContext,
    ) -> Result<JsonValue> {
        let rendered_config = self.render_node_config(&node.config, context)?;

        let url = rendered_config.get("url")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        // TODO: Integrate with existing WebSocket logic
        Ok(json!({
            "url": url,
            "messages": [],
            "message": "WebSocket integration pending",
        }))
    }

    /// Execute parallel branches
    async fn execute_parallel(
        &self,
        node_ids: &[String],
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        // Spawn all branches concurrently
        let mut handles = Vec::new();

        for node_id in node_ids {
            let node_id_str = node_id.clone();
            let graph = graph.clone();
            let mut branch_context = context.clone();
            let orchestrator = self.clone();

            let handle = tauri::async_runtime::spawn(async move {
                orchestrator.execute_node(&node_id_str, &graph, &mut branch_context).await
            });

            handles.push((node_id.clone(), handle));
        }

        // Wait for all to complete
        let mut parallel_results = Vec::new();
        for (node_id, handle) in handles {
            match handle.await {
                Ok(Ok(())) => {
                    // Success - collect result if available
                    if let Some(result) = context.node_results.get(&node_id) {
                        parallel_results.push(result.output.clone());
                    }
                }
                Ok(Err(e)) => {
                    return Err(Error::GenericError(format!("Parallel branch {} failed: {}", node_id, e)));
                }
                Err(e) => {
                    return Err(Error::GenericError(format!("Parallel branch {} panicked: {}", node_id, e)));
                }
            }
        }

        Ok(())
    }

    /// Execute conditional branch
    async fn execute_conditional(
        &self,
        node_id: &str,
        true_branch: &[ExecutionStep],
        false_branch: &[ExecutionStep],
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        let node = graph.nodes.get(node_id)
            .ok_or_else(|| Error::GenericError(format!("Node not found: {}", node_id)))?;

        // 1. Evaluate condition
        let condition_expr = node.config.get("condition")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::GenericError("Missing 'condition' in conditional node config".to_string()))?;

        let rendered_condition = self.render_template(condition_expr, context)?;
        let condition_result = self.evaluate_boolean(&rendered_condition)?;

        // 2. Execute appropriate branch
        let branch = if condition_result { true_branch } else { false_branch };

        for step in branch {
            self.execute_step(step, graph, context).await?;
        }

        Ok(())
    }

    /// Execute loop
    async fn execute_loop(
        &self,
        node_id: &str,
        body: &[ExecutionStep],
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        let node = graph.nodes.get(node_id)
            .ok_or_else(|| Error::GenericError(format!("Node not found: {}", node_id)))?;

        let loop_type = node.config.get("loop_type")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::GenericError("Missing 'loop_type' in loop node config".to_string()))?;

        let iterations: Vec<(usize, Option<JsonValue>)> = match loop_type {
            "count" => {
                let count = node.config.get("count")
                    .and_then(|v| v.as_i64())
                    .ok_or_else(|| Error::GenericError("Missing 'count' in count-based loop".to_string()))? as usize;
                (0..count).map(|i| (i, None)).collect()
            }
            "array" => {
                let array_var = node.config.get("array_variable")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| Error::GenericError("Missing 'array_variable' in array-based loop".to_string()))?;

                let rendered = self.render_template(array_var, context)?;
                let array: Vec<JsonValue> = serde_json::from_str(&rendered)
                    .map_err(|e| Error::GenericError(format!("Failed to parse array: {}", e)))?;

                array.into_iter().enumerate().map(|(i, item)| (i, Some(item))).collect()
            }
            _ => {
                return Err(Error::GenericError(format!("Unknown loop_type: {}", loop_type)));
            }
        };

        let total = iterations.len();
        let mut loop_results = Vec::new();

        for (index, item) in iterations {
            // Push loop context
            context.loop_stack.push(LoopContext {
                node_id: node.id.clone(),
                index,
                total,
                item: item.clone(),
            });

            // Execute body
            for step in body {
                self.execute_step(step, graph, context).await?;
            }

            // Collect results (last node result in this iteration)
            if let Some(last_result) = context.node_results.values().last() {
                loop_results.push(last_result.output.clone());
            }

            // Pop loop context
            context.loop_stack.pop();
        }

        // Store loop results
        context.node_results.insert(node.id.clone(), NodeResult {
            node_id: node.id.clone(),
            output: json!(loop_results),
            elapsed: 0,
            loop_results: Some(loop_results),
            parallel_results: None,
        });

        Ok(())
    }

    /// Render node config with template variables
    fn render_node_config(&self, config: &JsonValue, _context: &ExecutionContext) -> Result<JsonValue> {
        // TODO: Implement full template rendering with context
        // For now, just return config as-is
        Ok(config.clone())
    }

    /// Render a template string
    fn render_template(&self, template: &str, _context: &ExecutionContext) -> Result<String> {
        // TODO: Implement template rendering with ExecutionContext
        // This should integrate with yaak-templates and support:
        // - step[N].response.* variables
        // - loop.index, loop.item variables
        // - env.* variables
        Ok(template.to_string())
    }

    /// Evaluate a rendered condition as boolean
    fn evaluate_boolean(&self, value: &str) -> Result<bool> {
        // Simple boolean evaluation
        match value.trim().to_lowercase().as_str() {
            "true" | "1" | "yes" => Ok(true),
            "false" | "0" | "no" | "" => Ok(false),
            _ => {
                // Try parsing as number (0 = false, non-zero = true)
                if let Ok(num) = value.parse::<i64>() {
                    Ok(num != 0)
                } else {
                    // Non-empty string = true
                    Ok(!value.is_empty())
                }
            }
        }
    }

    /// Check if execution is cancelled
    fn is_cancelled(&self, execution_id: &str) -> bool {
        self.cancellation_tokens
            .read()
            .unwrap()
            .get(execution_id)
            .copied()
            .unwrap_or(false)
    }

    /// Cancel an execution
    pub fn cancel(&self, execution_id: &str) {
        self.cancellation_tokens
            .write()
            .unwrap()
            .insert(execution_id.to_string(), true);
    }

    /// Update execution state
    async fn update_execution_state(
        &self,
        execution_id: &str,
        state: WorkflowExecutionState,
        error: Option<String>,
        elapsed: Option<i32>,
    ) -> Result<()> {
        let db = self.app_handle.db();

        if let Ok(mut execution) = db.get_workflow_execution(execution_id) {
            execution.state = state.clone();
            execution.error = error.clone();
            execution.elapsed = elapsed;
            execution.updated_at = chrono::Utc::now().naive_utc();

            db.upsert(&execution, &UpdateSource::Background)?;

            // Emit event
            let _ = self.app_handle.emit("workflow_execution_updated", json!({
                "executionId": execution_id,
                "state": format!("{:?}", state).to_lowercase(),
                "elapsed": elapsed,
                "error": error,
            }));
        }

        Ok(())
    }
}
