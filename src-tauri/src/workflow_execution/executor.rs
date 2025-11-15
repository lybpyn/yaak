use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Emitter, Runtime};
use yaak_models::error::Result;
use yaak_models::models::{
    WorkflowExecution, WorkflowExecutionState,
    WorkflowStep, WorkflowStepExecution, WorkflowStepExecutionState,
};
use yaak_models::query_manager::QueryManagerExt;
use yaak_models::util::UpdateSource;
use yaak_templates::renderer::{StepResponse, WorkflowContext};
use serde::{Deserialize, Serialize};

/// Workflow executor manages workflow execution lifecycle
pub struct WorkflowExecutor<R: Runtime> {
    app_handle: AppHandle<R>,
    cancellation_tokens: Arc<RwLock<HashMap<String, bool>>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteWorkflowRequest {
    pub workflow_id: String,
    pub environment_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteWorkflowResponse {
    pub execution_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowExecutionUpdate {
    pub execution_id: String,
    pub state: String,
    pub elapsed: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStepCompleted {
    pub execution_id: String,
    pub step_id: String,
    pub state: String,
}

impl<R: Runtime> WorkflowExecutor<R> {
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

        // Load workflow
        let workflow = db.get_workflow(&workflow_id)?;

        // Load and validate steps
        let steps = db.list_workflow_steps(&workflow_id)?;
        let enabled_steps: Vec<_> = steps.into_iter().filter(|s| s.enabled).collect();

        if enabled_steps.is_empty() {
            return Err(yaak_models::error::Error::GenericError(
                "No enabled steps in workflow".to_string(),
            ));
        }

        // Validate all request references exist
        for step in &enabled_steps {
            let exists = db.validate_request_exists(
                &step.request_id,
                &step.request_model,
            )?;
            if !exists {
                return Err(yaak_models::error::Error::GenericError(format!(
                    "Step '{}' references deleted request: {}",
                    step.name, step.request_id
                )));
            }
        }

        // Resolve environment
        let resolved_env_id = environment_id
            .or_else(|| workflow.environment_id.clone())
            .or_else(|| {
                // TODO: Get workspace active environment
                None
            });

        // Create WorkflowExecution record (state: initialized)
        let execution = WorkflowExecution {
            id: yaak_models::util::generate_prefixed_id("we"),
            model: "workflow_execution".to_string(),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
            deleted_at: None,
            workflow_id: workflow.id.clone(),
            workspace_id: workflow.workspace_id.clone(),
            environment_id: resolved_env_id,
            elapsed: None,
            state: WorkflowExecutionState::Initialized,
            error: None,
        };

        let execution_id = execution.id.clone();

        // Save execution to database
        db.upsert(&execution, &UpdateSource::Background)?;

        // Initialize cancellation token
        self.cancellation_tokens
            .write()
            .unwrap()
            .insert(execution_id.clone(), false);

        // Spawn async task for execution
        let executor = Self::new(self.app_handle.clone());
        let exec_id_clone = execution_id.clone();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = executor.run_workflow(exec_id_clone).await {
                log::error!("Workflow execution failed: {}", e);
            }
        });

        Ok(execution_id)
    }

    /// Sequential workflow execution loop
    async fn run_workflow(&self, execution_id: String) -> Result<()> {
        let start_time = std::time::Instant::now();

        // Update state to running
        self.update_execution_state(&execution_id, WorkflowExecutionState::Running)
            .await?;

        // Load workflow and steps
        let (environment_id, enabled_steps) = {
            let db = self.app_handle.db();
            let execution = db.get_workflow_execution(&execution_id)?;
            let steps = db.list_workflow_steps(&execution.workflow_id)?;
            let enabled_steps: Vec<_> = steps.into_iter().filter(|s| s.enabled).collect();
            (execution.environment_id, enabled_steps)
        }; // db dropped here

        // Initialize workflow context for data passing
        let mut workflow_context = WorkflowContext::new();

        // Execute each step sequentially
        for step in enabled_steps {
            // Check cancellation
            if self.is_cancelled(&execution_id) {
                self.update_execution_state(&execution_id, WorkflowExecutionState::Cancelled)
                    .await?;
                return Ok(());
            }

            // Execute step
            match self
                .execute_step(&execution_id, &step, &environment_id, &workflow_context)
                .await
            {
                Ok(step_response) => {
                    // Add response to workflow context for subsequent steps
                    workflow_context.add_step_response(step_response);
                }
                Err(e) => {
                    // Step failed - halt workflow
                    log::error!("Step '{}' failed: {}", step.name, e);
                    {
                        let db = self.app_handle.db();
                        let mut failed_execution = db.get_workflow_execution(&execution_id)?;
                        failed_execution.error = Some(e.to_string());
                        failed_execution.state = WorkflowExecutionState::Failed;
                        failed_execution.updated_at = chrono::Utc::now().naive_utc();
                        db.upsert(&failed_execution, &UpdateSource::Background)?;
                    } // db dropped here
                    self.emit_execution_update(&execution_id, WorkflowExecutionState::Failed, None)?;
                    return Err(e);
                }
            }
        }

        // All steps completed successfully
        let elapsed = start_time.elapsed().as_millis() as i32;
        {
            let db = self.app_handle.db();
            let mut completed_execution = db.get_workflow_execution(&execution_id)?;
            completed_execution.elapsed = Some(elapsed);
            completed_execution.state = WorkflowExecutionState::Completed;
            completed_execution.updated_at = chrono::Utc::now().naive_utc();
            db.upsert(&completed_execution, &UpdateSource::Background)?;
        } // db dropped here
        self.emit_execution_update(&execution_id, WorkflowExecutionState::Completed, Some(elapsed))?;

        // Cleanup cancellation token
        self.cancellation_tokens
            .write()
            .unwrap()
            .remove(&execution_id);

        Ok(())
    }

    /// Execute a single workflow step
    async fn execute_step(
        &self,
        execution_id: &str,
        step: &WorkflowStep,
        environment_id: &Option<String>,
        workflow_context: &WorkflowContext,
    ) -> Result<StepResponse> {
        let step_start_time = std::time::Instant::now();

        // Create WorkflowStepExecution record (state: running)
        let step_execution = {
            let db = self.app_handle.db();
            let step_execution = WorkflowStepExecution {
                id: yaak_models::util::generate_prefixed_id("se"),
                model: "workflow_step_execution".to_string(),
                created_at: chrono::Utc::now().naive_utc(),
                updated_at: chrono::Utc::now().naive_utc(),
                deleted_at: None,
                workflow_execution_id: execution_id.to_string(),
                workflow_step_id: step.id.clone(),
                request_id: step.request_id.clone(),
                response_id: None,
                response_model: None,
                elapsed: None,
                state: WorkflowStepExecutionState::Running,
                error: None,
            };
            db.upsert(&step_execution, &UpdateSource::Background)?;
            step_execution
        }; // db dropped here

        // Execute based on request type
        let result = match step.request_model.as_str() {
            "http_request" => {
                self.execute_http_step(&step.request_id, environment_id, workflow_context)
                    .await
            }
            "grpc_request" => {
                // TODO: Implement gRPC step execution
                Err(yaak_models::error::Error::GenericError(
                    "gRPC workflow steps not yet implemented".to_string(),
                ))
            }
            _ => Err(yaak_models::error::Error::GenericError(format!(
                "Unknown request model: {}",
                step.request_model
            ))),
        };

        let elapsed = step_start_time.elapsed().as_millis() as i32;

        match result {
            Ok((response_id, step_response)) => {
                // Update step execution with success
                {
                    let db = self.app_handle.db();
                    let mut updated_step_exec = step_execution.clone();
                    updated_step_exec.response_id = Some(response_id);
                    updated_step_exec.response_model = Some("http_response".to_string());
                    updated_step_exec.elapsed = Some(elapsed);
                    updated_step_exec.state = WorkflowStepExecutionState::Completed;
                    updated_step_exec.updated_at = chrono::Utc::now().naive_utc();
                    db.upsert(&updated_step_exec, &UpdateSource::Background)?;
                } // db dropped here

                // Emit step completed event
                let _ = self.app_handle.emit(
                    "workflow_step_completed",
                    WorkflowStepCompleted {
                        execution_id: execution_id.to_string(),
                        step_id: step.id.clone(),
                        state: "completed".to_string(),
                    },
                );

                Ok(step_response)
            }
            Err(e) => {
                // Update step execution with error
                {
                    let db = self.app_handle.db();
                    let mut updated_step_exec = step_execution;
                    updated_step_exec.elapsed = Some(elapsed);
                    updated_step_exec.state = WorkflowStepExecutionState::Failed;
                    updated_step_exec.error = Some(e.to_string());
                    updated_step_exec.updated_at = chrono::Utc::now().naive_utc();
                    db.upsert(&updated_step_exec, &UpdateSource::Background)?;
                } // db dropped here

                // Emit step failed event
                let _ = self.app_handle.emit(
                    "workflow_step_completed",
                    WorkflowStepCompleted {
                        execution_id: execution_id.to_string(),
                        step_id: step.id.clone(),
                        state: "failed".to_string(),
                    },
                );

                Err(e)
            }
        }
    }

    /// Execute HTTP request step
    async fn execute_http_step(
        &self,
        request_id: &str,
        _environment_id: &Option<String>,
        _workflow_context: &WorkflowContext,
    ) -> Result<(String, StepResponse)> {
        let db = self.app_handle.db();

        // Load HTTP request
        let _request = db.get_http_request(request_id)?;

        // TODO: Render request with workflow context
        // For now, use standard rendering without workflow context
        // This would need integration with http_request.rs::render_http_request

        // Execute request using existing send_http_request logic
        // This is a placeholder - actual implementation would call:
        // crate::http_request::send_http_request(app_handle, request, environment_id, workflow_context)

        // For MVP, return error indicating this needs proper integration
        Err(yaak_models::error::Error::GenericError(
            "HTTP workflow step execution requires integration with http_request.rs".to_string(),
        ))
    }

    /// Update execution state and emit event
    async fn update_execution_state(
        &self,
        execution_id: &str,
        state: WorkflowExecutionState,
    ) -> Result<()> {
        let db = self.app_handle.db();
        let mut execution = db.get_workflow_execution(execution_id)?;
        execution.state = state.clone();
        execution.updated_at = chrono::Utc::now().naive_utc();
        db.upsert(&execution, &UpdateSource::Background)?;

        // Emit state update event
        self.emit_execution_update(execution_id, state, None)?;

        Ok(())
    }

    /// Emit execution update event
    fn emit_execution_update(
        &self,
        execution_id: &str,
        state: WorkflowExecutionState,
        elapsed: Option<i32>,
    ) -> Result<()> {
        let _ = self.app_handle.emit(
            "workflow_execution_updated",
            WorkflowExecutionUpdate {
                execution_id: execution_id.to_string(),
                state: state.to_string(),
                elapsed,
            },
        );
        Ok(())
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

    /// Cancel workflow execution
    pub fn cancel(&self, execution_id: String) {
        self.cancellation_tokens
            .write()
            .unwrap()
            .insert(execution_id, true);
    }
}
