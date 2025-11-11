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
use yaak_models::queries::{workflows, workflow_executions};

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
    let (workflow, steps, broken_step_ids) = workflows::get_workflow_with_steps(&db, &workflow_id)?;
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
    let execution = workflow_executions::get_workflow_execution(&db, &execution_id)?
        .ok_or_else(|| yaak_models::error::Error::Message("Execution not found".to_string()))?;
    let step_executions = workflow_executions::get_workflow_step_executions(&db, &execution_id)?;
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
    let executions = workflow_executions::list_workflow_executions(&db, &workflow_id, limit, offset)?;
    Ok(ListWorkflowExecutionsResponse { executions })
}
