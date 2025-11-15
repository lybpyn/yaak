use crate::db_context::DbContext;
use crate::error::Result;
use crate::models::{WorkflowEdge, WorkflowEdgeIden};
use crate::util::UpdateSource;

impl<'a> DbContext<'a> {
    /// Get a single workflow edge by ID
    pub fn get_workflow_edge(&self, id: &str) -> Result<WorkflowEdge> {
        self.find_one(WorkflowEdgeIden::Id, id)
    }

    /// List all workflow edges for a specific workflow
    pub fn get_workflow_edges(&self, workflow_id: &str) -> Result<Vec<WorkflowEdge>> {
        self.find_many(WorkflowEdgeIden::WorkflowId, workflow_id, None)
    }

    /// Get all incoming edges for a specific node
    pub fn get_incoming_edges(&self, node_id: &str) -> Result<Vec<WorkflowEdge>> {
        self.find_many(WorkflowEdgeIden::TargetNodeId, node_id, None)
    }

    /// Get all outgoing edges for a specific node
    pub fn get_outgoing_edges(&self, node_id: &str) -> Result<Vec<WorkflowEdge>> {
        self.find_many(WorkflowEdgeIden::SourceNodeId, node_id, None)
    }

    /// Upsert a workflow edge
    pub fn upsert_workflow_edge(
        &self,
        edge: &WorkflowEdge,
        source: &UpdateSource,
    ) -> Result<WorkflowEdge> {
        self.upsert(edge, source)
    }

    /// Delete a workflow edge
    pub fn delete_workflow_edge(
        &self,
        edge: &WorkflowEdge,
        source: &UpdateSource,
    ) -> Result<WorkflowEdge> {
        self.delete(edge, source)
    }

    /// List all workflow edges for a workspace (across all workflows)
    pub fn list_workflow_edges_by_workspace(&self, workspace_id: &str) -> Result<Vec<WorkflowEdge>> {
        use sea_query::{Expr, Query, SqliteQueryBuilder};
        use sea_query_rusqlite::RusqliteBinder;
        use crate::models::{WorkflowIden, UpsertModelInfo};

        let (sql, params) = Query::select()
            .columns([
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::Id),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::Model),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::WorkflowId),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::SourceNodeId),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::TargetNodeId),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::SourceAnchor),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::TargetAnchor),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::EdgeType),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::CreatedAt),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::UpdatedAt),
                (WorkflowEdgeIden::Table, WorkflowEdgeIden::DeletedAt),
            ])
            .from(WorkflowEdgeIden::Table)
            .inner_join(
                WorkflowIden::Table,
                Expr::col((WorkflowEdgeIden::Table, WorkflowEdgeIden::WorkflowId))
                    .equals((WorkflowIden::Table, WorkflowIden::Id))
            )
            .and_where(Expr::col((WorkflowIden::Table, WorkflowIden::WorkspaceId)).eq(workspace_id))
            .build_rusqlite(SqliteQueryBuilder);

        let mut stmt = self.conn.resolve().prepare(sql.as_str())?;
        let rows = stmt.query_map(&*params.as_params(), |row| WorkflowEdge::from_row(row))?;
        rows.collect::<std::result::Result<Vec<_>, _>>().map_err(Into::into)
    }
}
