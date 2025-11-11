use crate::error::Result;
use crate::models::{
    WorkflowExecution, WorkflowExecutionIden, WorkflowExecutionState,
    WorkflowStepExecution, WorkflowStepExecutionIden,
};
use crate::query_manager::QueryManager;
use sea_query::{Expr, Query, SqliteQueryBuilder};
use sea_query::Order;

/// Get a single workflow execution by ID
pub fn get_workflow_execution(qm: &QueryManager, id: &str) -> Result<Option<WorkflowExecution>> {
    let sql = Query::select()
        .from(WorkflowExecutionIden::Table)
        .columns([
            WorkflowExecutionIden::Id,
            WorkflowExecutionIden::Model,
            WorkflowExecutionIden::CreatedAt,
            WorkflowExecutionIden::UpdatedAt,
            WorkflowExecutionIden::DeletedAt,
            WorkflowExecutionIden::WorkflowId,
            WorkflowExecutionIden::WorkspaceId,
            WorkflowExecutionIden::EnvironmentId,
            WorkflowExecutionIden::Elapsed,
            WorkflowExecutionIden::State,
            WorkflowExecutionIden::Error,
        ])
        .and_where(Expr::col(WorkflowExecutionIden::Id).eq(id))
        .and_where(Expr::col(WorkflowExecutionIden::DeletedAt).is_null())
        .to_string(SqliteQueryBuilder);

    qm.query_row(&sql, [], |row| WorkflowExecution::from_row(row))
}

/// List workflow executions with pagination (newest first)
pub fn list_workflow_executions(
    qm: &QueryManager,
    workflow_id: &str,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<WorkflowExecution>> {
    let mut query = Query::select();
    query
        .from(WorkflowExecutionIden::Table)
        .columns([
            WorkflowExecutionIden::Id,
            WorkflowExecutionIden::Model,
            WorkflowExecutionIden::CreatedAt,
            WorkflowExecutionIden::UpdatedAt,
            WorkflowExecutionIden::DeletedAt,
            WorkflowExecutionIden::WorkflowId,
            WorkflowExecutionIden::WorkspaceId,
            WorkflowExecutionIden::EnvironmentId,
            WorkflowExecutionIden::Elapsed,
            WorkflowExecutionIden::State,
            WorkflowExecutionIden::Error,
        ])
        .and_where(Expr::col(WorkflowExecutionIden::WorkflowId).eq(workflow_id))
        .and_where(Expr::col(WorkflowExecutionIden::DeletedAt).is_null())
        .order_by(WorkflowExecutionIden::CreatedAt, Order::Desc);

    if let Some(limit) = limit {
        query.limit(limit as u64);
    }
    if let Some(offset) = offset {
        query.offset(offset as u64);
    }

    let sql = query.to_string(SqliteQueryBuilder);
    qm.query(&sql, [], |row| WorkflowExecution::from_row(row))
}

/// Get all step executions for a workflow execution
pub fn get_workflow_step_executions(
    qm: &QueryManager,
    execution_id: &str,
) -> Result<Vec<WorkflowStepExecution>> {
    let sql = Query::select()
        .from(WorkflowStepExecutionIden::Table)
        .columns([
            WorkflowStepExecutionIden::Id,
            WorkflowStepExecutionIden::Model,
            WorkflowStepExecutionIden::CreatedAt,
            WorkflowStepExecutionIden::UpdatedAt,
            WorkflowStepExecutionIden::DeletedAt,
            WorkflowStepExecutionIden::WorkflowExecutionId,
            WorkflowStepExecutionIden::WorkflowStepId,
            WorkflowStepExecutionIden::RequestId,
            WorkflowStepExecutionIden::ResponseId,
            WorkflowStepExecutionIden::ResponseModel,
            WorkflowStepExecutionIden::Elapsed,
            WorkflowStepExecutionIden::State,
            WorkflowStepExecutionIden::Error,
        ])
        .and_where(Expr::col(WorkflowStepExecutionIden::WorkflowExecutionId).eq(execution_id))
        .and_where(Expr::col(WorkflowStepExecutionIden::DeletedAt).is_null())
        .order_by(WorkflowStepExecutionIden::CreatedAt, Order::Asc)
        .to_string(SqliteQueryBuilder);

    qm.query(&sql, [], |row| WorkflowStepExecution::from_row(row))
}

/// Update execution state
pub fn update_execution_state(
    qm: &QueryManager,
    execution_id: &str,
    state: WorkflowExecutionState,
) -> Result<()> {
    let sql = Query::update()
        .table(WorkflowExecutionIden::Table)
        .value(WorkflowExecutionIden::State, state.to_string())
        .value(WorkflowExecutionIden::UpdatedAt, chrono::Utc::now().naive_utc())
        .and_where(Expr::col(WorkflowExecutionIden::Id).eq(execution_id))
        .to_string(SqliteQueryBuilder);

    qm.execute(&sql, [])?;
    Ok(())
}

/// Update execution elapsed time
pub fn update_execution_elapsed(
    qm: &QueryManager,
    execution_id: &str,
    elapsed: i32,
) -> Result<()> {
    let sql = Query::update()
        .table(WorkflowExecutionIden::Table)
        .value(WorkflowExecutionIden::Elapsed, elapsed)
        .value(WorkflowExecutionIden::UpdatedAt, chrono::Utc::now().naive_utc())
        .and_where(Expr::col(WorkflowExecutionIden::Id).eq(execution_id))
        .to_string(SqliteQueryBuilder);

    qm.execute(&sql, [])?;
    Ok(())
}

/// Update execution error message
pub fn update_execution_error(
    qm: &QueryManager,
    execution_id: &str,
    error: &str,
) -> Result<()> {
    let sql = Query::update()
        .table(WorkflowExecutionIden::Table)
        .value(WorkflowExecutionIden::Error, error)
        .value(WorkflowExecutionIden::State, WorkflowExecutionState::Failed.to_string())
        .value(WorkflowExecutionIden::UpdatedAt, chrono::Utc::now().naive_utc())
        .and_where(Expr::col(WorkflowExecutionIden::Id).eq(execution_id))
        .to_string(SqliteQueryBuilder);

    qm.execute(&sql, [])?;
    Ok(())
}

/// Prune old workflow executions (keep only the 50 most recent)
pub fn prune_old_executions(
    qm: &QueryManager,
    workflow_id: &str,
) -> Result<()> {
    // Get IDs of executions to keep (50 most recent)
    let keep_sql = Query::select()
        .from(WorkflowExecutionIden::Table)
        .column(WorkflowExecutionIden::Id)
        .and_where(Expr::col(WorkflowExecutionIden::WorkflowId).eq(workflow_id))
        .and_where(Expr::col(WorkflowExecutionIden::DeletedAt).is_null())
        .order_by(WorkflowExecutionIden::CreatedAt, Order::Desc)
        .limit(50)
        .to_string(SqliteQueryBuilder);

    let keep_ids: Vec<String> = qm.query(&keep_sql, [], |row| row.get(0))?;

    if keep_ids.is_empty() {
        return Ok(());
    }

    // Soft delete executions not in the keep list
    let delete_sql = Query::update()
        .table(WorkflowExecutionIden::Table)
        .value(WorkflowExecutionIden::DeletedAt, chrono::Utc::now().naive_utc().and_utc().timestamp())
        .and_where(Expr::col(WorkflowExecutionIden::WorkflowId).eq(workflow_id))
        .and_where(Expr::col(WorkflowExecutionIden::DeletedAt).is_null())
        .and_where(Expr::col(WorkflowExecutionIden::Id).is_not_in(keep_ids))
        .to_string(SqliteQueryBuilder);

    qm.execute(&delete_sql, [])?;
    Ok(())
}
