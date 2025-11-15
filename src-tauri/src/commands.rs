use crate::error::Result;
use tauri::{command, AppHandle, Manager, Runtime, State, WebviewWindow};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use yaak_crypto::manager::EncryptionManagerExt;
use yaak_plugins::events::{GetThemesResponse, PluginWindowContext};
use yaak_plugins::manager::PluginManager;
use yaak_plugins::native_template_functions::{
    decrypt_secure_template_function, encrypt_secure_template_function,
};

#[command]
pub(crate) async fn cmd_show_workspace_key<R: Runtime>(
    window: WebviewWindow<R>,
    workspace_id: &str,
) -> Result<()> {
    let key = window.crypto().reveal_workspace_key(workspace_id)?;
    window
        .dialog()
        .message(format!("Your workspace key is \n\n{}", key))
        .kind(MessageDialogKind::Info)
        .show(|_v| {});
    Ok(())
}

#[command]
pub(crate) async fn cmd_decrypt_template<R: Runtime>(
    window: WebviewWindow<R>,
    template: &str,
) -> Result<String> {
    let app_handle = window.app_handle();
    let window_context = &PluginWindowContext::new(&window);
    Ok(decrypt_secure_template_function(&app_handle, window_context, template)?)
}

#[command]
pub(crate) async fn cmd_secure_template<R: Runtime>(
    app_handle: AppHandle<R>,
    window: WebviewWindow<R>,
    template: &str,
) -> Result<String> {
    let window_context = &PluginWindowContext::new(&window);
    Ok(encrypt_secure_template_function(&app_handle, window_context, template)?)
}

#[command]
pub(crate) async fn cmd_get_themes<R: Runtime>(
    window: WebviewWindow<R>,
    plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<GetThemesResponse>> {
    Ok(plugin_manager.get_themes(&window).await?)
}

// ============================================================================
// Workflow Commands
// ============================================================================

use crate::workflow_execution::{WorkflowExecutor, ExecuteWorkflowRequest, ExecuteWorkflowResponse};
use serde::{Deserialize, Serialize};
use yaak_models::models::{Workflow, WorkflowStep, WorkflowExecution, WorkflowStepExecution};
use yaak_models::query_manager::QueryManagerExt;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWorkflowWithStepsResponse {
    pub workflow: Workflow,
    pub steps: Vec<WorkflowStep>,
    pub broken_step_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWorkflowExecutionResultsResponse {
    pub execution: WorkflowExecution,
    pub step_executions: Vec<WorkflowStepExecution>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListWorkflowExecutionsResponse {
    pub executions: Vec<WorkflowExecution>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelWorkflowExecutionRequest {
    pub execution_id: String,
}

#[command]
pub(crate) async fn cmd_execute_workflow<R: Runtime>(
    app_handle: AppHandle<R>,
    req: ExecuteWorkflowRequest,
) -> Result<ExecuteWorkflowResponse> {
    let executor = WorkflowExecutor::new(app_handle);
    let execution_id = executor.execute(req.workflow_id, req.environment_id).await?;
    Ok(ExecuteWorkflowResponse { execution_id })
}

#[command]
pub(crate) async fn cmd_cancel_workflow_execution<R: Runtime>(
    app_handle: AppHandle<R>,
    req: CancelWorkflowExecutionRequest,
) -> Result<()> {
    let executor = WorkflowExecutor::new(app_handle);
    executor.cancel(req.execution_id);
    Ok(())
}

#[command]
pub(crate) async fn cmd_get_workflow_with_steps<R: Runtime>(
    app_handle: AppHandle<R>,
    workflow_id: String,
) -> Result<GetWorkflowWithStepsResponse> {
    let db = app_handle.db();
    let (workflow, steps, broken_step_ids) = db.get_workflow_with_steps(&workflow_id)?;
    Ok(GetWorkflowWithStepsResponse {
        workflow,
        steps,
        broken_step_ids,
    })
}

#[command]
pub(crate) async fn cmd_get_workflow_execution_results<R: Runtime>(
    app_handle: AppHandle<R>,
    execution_id: String,
) -> Result<GetWorkflowExecutionResultsResponse> {
    let db = app_handle.db();
    let execution = db.get_workflow_execution(&execution_id)?;
    let step_executions = db.get_workflow_step_executions(&execution_id)?;
    Ok(GetWorkflowExecutionResultsResponse {
        execution,
        step_executions,
    })
}

#[command]
pub(crate) async fn cmd_list_workflow_executions<R: Runtime>(
    app_handle: AppHandle<R>,
    workflow_id: String,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<ListWorkflowExecutionsResponse> {
    let db = app_handle.db();
    let mut executions = db.list_workflow_executions(&workflow_id)?;

    // Apply pagination
    let offset = offset.unwrap_or(0);
    if offset > 0 && offset < executions.len() {
        executions = executions[offset..].to_vec();
    } else if offset >= executions.len() {
        executions = vec![];
    }

    if let Some(limit) = limit {
        executions.truncate(limit);
    }

    Ok(ListWorkflowExecutionsResponse { executions })
}

// ============================================================================
// Workflow Canvas Commands
// ============================================================================

use crate::workflow_execution::{WorkflowOrchestrator, GraphBuilder};
use yaak_models::models::{WorkflowNode, WorkflowEdge, WorkflowViewport, NodeType, EdgeType};
use yaak_models::util::{UpdateSource, generate_prefixed_id};
use chrono::Utc;
use std::str::FromStr;

// 5.1 Node CRUD Commands

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkflowNodeRequest {
    pub workflow_id: String,
    pub node_type: String,
    pub node_subtype: String,
    pub position_x: f64,
    pub position_y: f64,
}

#[command]
pub(crate) async fn cmd_create_workflow_node<R: Runtime>(
    app_handle: AppHandle<R>,
    req: CreateWorkflowNodeRequest,
) -> Result<WorkflowNode> {
    let db = app_handle.db();

    // Parse node type
    let node_type = NodeType::from_str(&req.node_type)?;

    // Create node with default config
    let node = WorkflowNode {
        id: generate_prefixed_id("wn"),
        model: "workflow_node".to_string(),
        workflow_id: req.workflow_id,
        node_type,
        node_subtype: req.node_subtype,
        name: String::new(),
        description: None,
        position_x: req.position_x,
        position_y: req.position_y,
        width: 200.0,
        height: 100.0,
        config: serde_json::json!({}),
        enabled: true,
        legacy_step_id: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
        deleted_at: None,
    };

    let created_node = db.upsert(&node, &UpdateSource::Background)?;
    Ok(created_node)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkflowNodeRequest {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub position_x: Option<f64>,
    pub position_y: Option<f64>,
    pub config: Option<serde_json::Value>,
    pub enabled: Option<bool>,
}

#[command]
pub(crate) async fn cmd_update_workflow_node<R: Runtime>(
    app_handle: AppHandle<R>,
    req: UpdateWorkflowNodeRequest,
) -> Result<WorkflowNode> {
    let db = app_handle.db();

    // Load existing node
    let mut node = db.get_workflow_node(&req.id)?;

    // Apply updates
    if let Some(name) = req.name {
        node.name = name;
    }
    if let Some(description) = req.description {
        node.description = Some(description);
    }
    if let Some(position_x) = req.position_x {
        node.position_x = position_x;
    }
    if let Some(position_y) = req.position_y {
        node.position_y = position_y;
    }
    if let Some(config) = req.config {
        node.config = config;
    }
    if let Some(enabled) = req.enabled {
        node.enabled = enabled;
    }

    node.updated_at = Utc::now().naive_utc();

    let updated_node = db.upsert(&node, &UpdateSource::Background)?;
    Ok(updated_node)
}

#[command]
pub(crate) async fn cmd_delete_workflow_node<R: Runtime>(
    app_handle: AppHandle<R>,
    node_id: String,
) -> Result<()> {
    let db = app_handle.db();

    // Load node
    let node = db.get_workflow_node(&node_id)?;

    // Delete connected edges
    let incoming_edges = db.get_incoming_edges(&node_id)?;
    let outgoing_edges = db.get_outgoing_edges(&node_id)?;

    for edge in incoming_edges.iter().chain(outgoing_edges.iter()) {
        let mut edge = edge.clone();
        edge.deleted_at = Some(Utc::now().naive_utc());
        db.upsert(&edge, &UpdateSource::Background)?;
    }

    // Delete node
    let mut node = node;
    node.deleted_at = Some(Utc::now().naive_utc());
    db.upsert(&node, &UpdateSource::Background)?;

    Ok(())
}

// 5.2 Edge CRUD Commands

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkflowEdgeRequest {
    pub workflow_id: String,
    pub source_node_id: String,
    pub source_anchor: String,
    pub target_node_id: String,
    pub target_anchor: String,
    pub edge_type: String,
    pub label: Option<String>,
}

#[command]
pub(crate) async fn cmd_create_workflow_edge<R: Runtime>(
    app_handle: AppHandle<R>,
    req: CreateWorkflowEdgeRequest,
) -> Result<WorkflowEdge> {
    let db = app_handle.db();

    // Parse edge type
    let edge_type = EdgeType::from_str(&req.edge_type)?;

    // Create edge
    let edge = WorkflowEdge {
        id: generate_prefixed_id("we"),
        model: "workflow_edge".to_string(),
        workflow_id: req.workflow_id,
        source_node_id: req.source_node_id,
        source_anchor: req.source_anchor,
        target_node_id: req.target_node_id,
        target_anchor: req.target_anchor,
        edge_type,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
        deleted_at: None,
    };

    let created_edge = db.upsert(&edge, &UpdateSource::Background)?;
    Ok(created_edge)
}

#[command]
pub(crate) async fn cmd_delete_workflow_edge<R: Runtime>(
    app_handle: AppHandle<R>,
    edge_id: String,
) -> Result<()> {
    let db = app_handle.db();

    // Load and delete edge
    let mut edge = db.get_workflow_edge(&edge_id)?;
    edge.deleted_at = Some(Utc::now().naive_utc());
    db.upsert(&edge, &UpdateSource::Background)?;

    Ok(())
}

// 5.3 Canvas Commands

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWorkflowCanvasResponse {
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    pub viewport: Option<WorkflowViewport>,
}

#[command]
pub(crate) async fn cmd_get_workflow_canvas<R: Runtime>(
    app_handle: AppHandle<R>,
    workflow_id: String,
) -> Result<GetWorkflowCanvasResponse> {
    let db = app_handle.db();

    let nodes = db.get_workflow_nodes(&workflow_id)?;
    let edges = db.get_workflow_edges(&workflow_id)?;
    let viewport = db.get_workflow_viewport(&workflow_id).ok();

    Ok(GetWorkflowCanvasResponse {
        nodes,
        edges,
        viewport,
    })
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateViewportRequest {
    pub workflow_id: String,
    pub pan_x: f64,
    pub pan_y: f64,
    pub zoom: f64,
}

#[command]
pub(crate) async fn cmd_update_viewport<R: Runtime>(
    app_handle: AppHandle<R>,
    req: UpdateViewportRequest,
) -> Result<WorkflowViewport> {
    let db = app_handle.db();

    // Try to load existing viewport, or create new one
    let mut viewport = db.get_workflow_viewport(&req.workflow_id).unwrap_or_else(|_| {
        WorkflowViewport {
            id: generate_prefixed_id("wv"),
            model: "workflow_viewport".to_string(),
            workflow_id: req.workflow_id.clone(),
            pan_x: 0.0,
            pan_y: 0.0,
            zoom: 1.0,
            created_at: Utc::now().naive_utc(),
            updated_at: Utc::now().naive_utc(),
        }
    });

    viewport.pan_x = req.pan_x;
    viewport.pan_y = req.pan_y;
    viewport.zoom = req.zoom;
    viewport.updated_at = Utc::now().naive_utc();

    let updated_viewport = db.upsert(&viewport, &UpdateSource::Background)?;
    Ok(updated_viewport)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationError {
    pub node_id: Option<String>,
    pub field: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateWorkflowGraphResponse {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
}

#[command]
pub(crate) async fn cmd_validate_workflow_graph<R: Runtime>(
    app_handle: AppHandle<R>,
    workflow_id: String,
) -> Result<ValidateWorkflowGraphResponse> {
    let db = app_handle.db();

    // Use GraphBuilder to validate
    match GraphBuilder::build(&workflow_id, &db) {
        Ok(_graph) => Ok(ValidateWorkflowGraphResponse {
            valid: true,
            errors: vec![],
        }),
        Err(e) => Ok(ValidateWorkflowGraphResponse {
            valid: false,
            errors: vec![ValidationError {
                node_id: None,
                field: None,
                message: format!("{}", e),
            }],
        }),
    }
}

// 5.4 Execution Commands

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteWorkflowCanvasRequest {
    pub workflow_id: String,
    pub environment_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteWorkflowCanvasResponse {
    pub execution_id: String,
}

#[command]
pub(crate) async fn cmd_execute_workflow_canvas<R: Runtime>(
    app_handle: AppHandle<R>,
    req: ExecuteWorkflowCanvasRequest,
) -> Result<ExecuteWorkflowCanvasResponse> {
    let orchestrator = WorkflowOrchestrator::new(app_handle);
    let execution_id = orchestrator.execute(req.workflow_id, req.environment_id).await?;

    Ok(ExecuteWorkflowCanvasResponse { execution_id })
}

#[command]
pub(crate) async fn cmd_cancel_workflow_execution_canvas<R: Runtime>(
    app_handle: AppHandle<R>,
    execution_id: String,
) -> Result<()> {
    let orchestrator = WorkflowOrchestrator::new(app_handle);
    orchestrator.cancel(&execution_id);
    Ok(())
}

// 5.5 Import/Export Commands

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportWorkflowJsonResponse {
    pub json: String,
}

#[command]
pub(crate) async fn cmd_export_workflow_json<R: Runtime>(
    app_handle: AppHandle<R>,
    workflow_id: String,
) -> Result<ExportWorkflowJsonResponse> {
    let db = app_handle.db();

    let workflow = db.get_workflow(&workflow_id)?;
    let nodes = db.get_workflow_nodes(&workflow_id)?;
    let edges = db.get_workflow_edges(&workflow_id)?;
    let viewport = db.get_workflow_viewport(&workflow_id).ok();

    let export_data = serde_json::json!({
        "version": "1.0",
        "workflow": workflow,
        "nodes": nodes,
        "edges": edges,
        "viewport": viewport,
    });

    let json = serde_json::to_string_pretty(&export_data)?;
    Ok(ExportWorkflowJsonResponse { json })
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportWorkflowJsonRequest {
    pub workspace_id: String,
    pub json: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportWorkflowJsonResponse {
    pub workflow_id: String,
}

#[command]
pub(crate) async fn cmd_import_workflow_json<R: Runtime>(
    app_handle: AppHandle<R>,
    req: ImportWorkflowJsonRequest,
) -> Result<ImportWorkflowJsonResponse> {
    let db = app_handle.db();

    // Parse JSON
    let import_data: serde_json::Value = serde_json::from_str(&req.json)?;

    // Validate version
    let version = import_data.get("version")
        .and_then(|v| v.as_str())
        .ok_or_else(|| crate::error::Error::GenericError("Missing version field".to_string()))?;

    if version != "1.0" {
        return Err(crate::error::Error::GenericError(format!("Unsupported version: {}", version)));
    }

    // Extract data
    let mut workflow: Workflow = serde_json::from_value(
        import_data.get("workflow")
            .ok_or_else(|| crate::error::Error::GenericError("Missing workflow field".to_string()))?
            .clone()
    )?;

    let nodes: Vec<WorkflowNode> = serde_json::from_value(
        import_data.get("nodes")
            .ok_or_else(|| crate::error::Error::GenericError("Missing nodes field".to_string()))?
            .clone()
    )?;

    let edges: Vec<WorkflowEdge> = serde_json::from_value(
        import_data.get("edges")
            .ok_or_else(|| crate::error::Error::GenericError("Missing edges field".to_string()))?
            .clone()
    )?;

    let viewport: Option<WorkflowViewport> = import_data.get("viewport")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    // Generate new IDs and create ID mapping
    let new_workflow_id = generate_prefixed_id("wk");
    workflow.id = new_workflow_id.clone();
    workflow.workspace_id = req.workspace_id;
    workflow.created_at = Utc::now().naive_utc();
    workflow.updated_at = Utc::now().naive_utc();

    // Create workflow
    db.upsert(&workflow, &UpdateSource::Background)?;

    // Map old node IDs to new ones
    let mut node_id_map = std::collections::HashMap::new();

    // Create nodes with new IDs
    for mut node in nodes {
        let old_node_id = node.id.clone();
        let new_node_id = generate_prefixed_id("wn");
        node.id = new_node_id.clone();
        node.workflow_id = new_workflow_id.clone();
        node.created_at = Utc::now().naive_utc();
        node.updated_at = Utc::now().naive_utc();

        db.upsert(&node, &UpdateSource::Background)?;
        node_id_map.insert(old_node_id, new_node_id);
    }

    // Create edges with remapped node IDs
    for mut edge in edges {
        edge.id = generate_prefixed_id("we");
        edge.workflow_id = new_workflow_id.clone();
        edge.source_node_id = node_id_map.get(&edge.source_node_id)
            .cloned()
            .unwrap_or(edge.source_node_id);
        edge.target_node_id = node_id_map.get(&edge.target_node_id)
            .cloned()
            .unwrap_or(edge.target_node_id);
        edge.created_at = Utc::now().naive_utc();
        edge.updated_at = Utc::now().naive_utc();

        db.upsert(&edge, &UpdateSource::Background)?;
    }

    // Create viewport if present
    if let Some(mut vp) = viewport {
        vp.id = generate_prefixed_id("wv");
        vp.workflow_id = new_workflow_id.clone();
        vp.created_at = Utc::now().naive_utc();
        vp.updated_at = Utc::now().naive_utc();

        db.upsert(&vp, &UpdateSource::Background)?;
    }

    Ok(ImportWorkflowJsonResponse {
        workflow_id: new_workflow_id,
    })
}

// 5.6 Migration Command

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrateWorkflowToCanvasResponse {
    pub success: bool,
    pub nodes_created: usize,
    pub edges_created: usize,
}

#[command]
pub(crate) async fn cmd_migrate_workflow_to_canvas<R: Runtime>(
    app_handle: AppHandle<R>,
    workflow_id: String,
) -> Result<MigrateWorkflowToCanvasResponse> {
    let db = app_handle.db();

    // Load workflow and steps
    let mut workflow = db.get_workflow(&workflow_id)?;
    let steps = db.list_workflow_steps(&workflow_id)?;

    if steps.is_empty() {
        return Ok(MigrateWorkflowToCanvasResponse {
            success: true,
            nodes_created: 0,
            edges_created: 0,
        });
    }

    let mut nodes_created = 0;
    let mut edges_created = 0;
    let horizontal_spacing = 300.0;
    let start_x = 100.0;
    let start_y = 200.0;

    // Create manual trigger node
    let trigger_node = WorkflowNode {
        id: generate_prefixed_id("wn"),
        model: "workflow_node".to_string(),
        workflow_id: workflow_id.clone(),
        node_type: NodeType::Trigger,
        node_subtype: "manual".to_string(),
        name: "Start".to_string(),
        description: Some("Manual trigger".to_string()),
        position_x: start_x,
        position_y: start_y,
        width: 200.0,
        height: 100.0,
        config: serde_json::json!({}),
        enabled: true,
        legacy_step_id: None,
        created_at: Utc::now().naive_utc(),
        updated_at: Utc::now().naive_utc(),
        deleted_at: None,
    };

    db.upsert(&trigger_node, &UpdateSource::Background)?;
    nodes_created += 1;

    let mut prev_node_id = trigger_node.id.clone();

    // Convert each step to action node
    for (idx, step) in steps.iter().enumerate() {
        let node_subtype = match step.request_model.as_str() {
            "http_request" => "http_request",
            "grpc_request" => "grpc_request",
            _ => "http_request",
        };

        let action_node = WorkflowNode {
            id: generate_prefixed_id("wn"),
            model: "workflow_node".to_string(),
            workflow_id: workflow_id.clone(),
            node_type: NodeType::Action,
            node_subtype: node_subtype.to_string(),
            name: step.name.clone(),
            description: None,
            position_x: start_x + (idx as f64 + 1.0) * horizontal_spacing,
            position_y: start_y,
            width: 200.0,
            height: 100.0,
            config: serde_json::json!({
                "request_id": step.request_id,
                "request_model": step.request_model,
            }),
            enabled: step.enabled,
            legacy_step_id: Some(step.id.clone()),
            created_at: Utc::now().naive_utc(),
            updated_at: Utc::now().naive_utc(),
            deleted_at: None,
        };

        db.upsert(&action_node, &UpdateSource::Background)?;
        nodes_created += 1;

        // Create sequential edge
        let edge = WorkflowEdge {
            id: generate_prefixed_id("we"),
            model: "workflow_edge".to_string(),
            workflow_id: workflow_id.clone(),
            source_node_id: prev_node_id.clone(),
            source_anchor: "output".to_string(),
            target_node_id: action_node.id.clone(),
            target_anchor: "input".to_string(),
            edge_type: EdgeType::Sequential,
            created_at: Utc::now().naive_utc(),
            updated_at: Utc::now().naive_utc(),
            deleted_at: None,
        };

        db.upsert(&edge, &UpdateSource::Background)?;
        edges_created += 1;

        prev_node_id = action_node.id.clone();
    }

    // Update workflow timestamp (no canvas_enabled field needed)
    workflow.updated_at = Utc::now().naive_utc();
    db.upsert(&workflow, &UpdateSource::Background)?;

    Ok(MigrateWorkflowToCanvasResponse {
        success: true,
        nodes_created,
        edges_created,
    })
}
