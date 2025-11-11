use crate::error::Result;
use crate::models::{Workflow, WorkflowIden, WorkflowStep};
use crate::query_manager::QueryManager;
use sea_query::{Expr, Query, SqliteQueryBuilder};
use sea_query::Order;

/// Get a single workflow by ID
pub fn get_workflow(qm: &QueryManager, id: &str) -> Result<Option<Workflow>> {
    let sql = Query::select()
        .from(WorkflowIden::Table)
        .columns([
            WorkflowIden::Id,
            WorkflowIden::Model,
            WorkflowIden::CreatedAt,
            WorkflowIden::UpdatedAt,
            WorkflowIden::DeletedAt,
            WorkflowIden::WorkspaceId,
            WorkflowIden::Name,
            WorkflowIden::Description,
            WorkflowIden::EnvironmentId,
            WorkflowIden::SortPriority,
        ])
        .and_where(Expr::col(WorkflowIden::Id).eq(id))
        .and_where(Expr::col(WorkflowIden::DeletedAt).is_null())
        .to_string(SqliteQueryBuilder);

    qm.query_row(&sql, [], |row| Workflow::from_row(row))
}

/// List all workflows in a workspace
pub fn list_workflows_by_workspace(qm: &QueryManager, workspace_id: &str) -> Result<Vec<Workflow>> {
    let sql = Query::select()
        .from(WorkflowIden::Table)
        .columns([
            WorkflowIden::Id,
            WorkflowIden::Model,
            WorkflowIden::CreatedAt,
            WorkflowIden::UpdatedAt,
            WorkflowIden::DeletedAt,
            WorkflowIden::WorkspaceId,
            WorkflowIden::Name,
            WorkflowIden::Description,
            WorkflowIden::EnvironmentId,
            WorkflowIden::SortPriority,
        ])
        .and_where(Expr::col(WorkflowIden::WorkspaceId).eq(workspace_id))
        .and_where(Expr::col(WorkflowIden::DeletedAt).is_null())
        .order_by(WorkflowIden::SortPriority, Order::Asc)
        .to_string(SqliteQueryBuilder);

    qm.query(&sql, [], |row| Workflow::from_row(row))
}

/// Get workflow with its steps and broken step IDs
pub fn get_workflow_with_steps(
    qm: &QueryManager,
    workflow_id: &str,
) -> Result<(Workflow, Vec<WorkflowStep>, Vec<String>)> {
    // Get workflow
    let workflow = get_workflow(qm, workflow_id)?
        .ok_or_else(|| crate::error::Error::Message(format!("Workflow not found: {}", workflow_id)))?;

    // Get steps
    let steps = crate::queries::workflow_steps::list_workflow_steps(qm, workflow_id)?;

    // Check for broken references
    let mut broken_step_ids = Vec::new();
    for step in &steps {
        let exists = crate::queries::workflow_steps::validate_request_exists(
            qm,
            &step.request_id,
            &step.request_model,
        )?;
        if !exists {
            broken_step_ids.push(step.id.clone());
        }
    }

    Ok((workflow, steps, broken_step_ids))
}

/// Delete a workflow by ID (soft delete)
pub fn delete_workflow(qm: &QueryManager, id: &str) -> Result<()> {
    use crate::models::UpsertModelInfo;

    let sql = Query::update()
        .table(WorkflowIden::Table)
        .value(WorkflowIden::DeletedAt, chrono::Utc::now().naive_utc().and_utc().timestamp())
        .and_where(Expr::col(WorkflowIden::Id).eq(id))
        .to_string(SqliteQueryBuilder);

    qm.execute(&sql, [])?;
    Ok(())
}
