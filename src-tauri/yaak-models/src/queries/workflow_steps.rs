use crate::error::Result;
use crate::models::{WorkflowStep, WorkflowStepIden, HttpRequestIden, GrpcRequestIden};
use crate::query_manager::QueryManager;
use sea_query::{Expr, Query, SqliteQueryBuilder};
use sea_query::Order;

/// Get a single workflow step by ID
pub fn get_workflow_step(qm: &QueryManager, id: &str) -> Result<Option<WorkflowStep>> {
    let sql = Query::select()
        .from(WorkflowStepIden::Table)
        .columns([
            WorkflowStepIden::Id,
            WorkflowStepIden::Model,
            WorkflowStepIden::CreatedAt,
            WorkflowStepIden::UpdatedAt,
            WorkflowStepIden::DeletedAt,
            WorkflowStepIden::WorkflowId,
            WorkflowStepIden::RequestId,
            WorkflowStepIden::RequestModel,
            WorkflowStepIden::Name,
            WorkflowStepIden::Enabled,
            WorkflowStepIden::SortPriority,
        ])
        .and_where(Expr::col(WorkflowStepIden::Id).eq(id))
        .and_where(Expr::col(WorkflowStepIden::DeletedAt).is_null())
        .to_string(SqliteQueryBuilder);

    qm.query_row(&sql, [], |row| WorkflowStep::from_row(row))
}

/// List all steps in a workflow, ordered by sort_priority
pub fn list_workflow_steps(qm: &QueryManager, workflow_id: &str) -> Result<Vec<WorkflowStep>> {
    let sql = Query::select()
        .from(WorkflowStepIden::Table)
        .columns([
            WorkflowStepIden::Id,
            WorkflowStepIden::Model,
            WorkflowStepIden::CreatedAt,
            WorkflowStepIden::UpdatedAt,
            WorkflowStepIden::DeletedAt,
            WorkflowStepIden::WorkflowId,
            WorkflowStepIden::RequestId,
            WorkflowStepIden::RequestModel,
            WorkflowStepIden::Name,
            WorkflowStepIden::Enabled,
            WorkflowStepIden::SortPriority,
        ])
        .and_where(Expr::col(WorkflowStepIden::WorkflowId).eq(workflow_id))
        .and_where(Expr::col(WorkflowStepIden::DeletedAt).is_null())
        .order_by(WorkflowStepIden::SortPriority, Order::Asc)
        .to_string(SqliteQueryBuilder);

    qm.query(&sql, [], |row| WorkflowStep::from_row(row))
}

/// Validate that a request exists (HTTP or gRPC)
pub fn validate_request_exists(
    qm: &QueryManager,
    request_id: &str,
    request_model: &str,
) -> Result<bool> {
    let sql = match request_model {
        "http_request" => {
            Query::select()
                .from(HttpRequestIden::Table)
                .column(HttpRequestIden::Id)
                .and_where(Expr::col(HttpRequestIden::Id).eq(request_id))
                .and_where(Expr::col(HttpRequestIden::DeletedAt).is_null())
                .to_string(SqliteQueryBuilder)
        }
        "grpc_request" => {
            Query::select()
                .from(GrpcRequestIden::Table)
                .column(GrpcRequestIden::Id)
                .and_where(Expr::col(GrpcRequestIden::Id).eq(request_id))
                .and_where(Expr::col(GrpcRequestIden::DeletedAt).is_null())
                .to_string(SqliteQueryBuilder)
        }
        _ => return Ok(false),
    };

    let result: Result<Option<String>> = qm.query_row(&sql, [], |row| row.get(0));
    Ok(result?.is_some())
}

/// Delete a workflow step by ID (soft delete)
pub fn delete_workflow_step(qm: &QueryManager, id: &str) -> Result<()> {
    let sql = Query::update()
        .table(WorkflowStepIden::Table)
        .value(WorkflowStepIden::DeletedAt, chrono::Utc::now().naive_utc().and_utc().timestamp())
        .and_where(Expr::col(WorkflowStepIden::Id).eq(id))
        .to_string(SqliteQueryBuilder);

    qm.execute(&sql, [])?;
    Ok(())
}
