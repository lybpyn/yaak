use crate::db_context::DbContext;
use crate::error::Result;
use crate::models::{WorkflowNode, WorkflowNodeIden};
use crate::util::UpdateSource;

impl<'a> DbContext<'a> {
    /// Get a single workflow node by ID
    pub fn get_workflow_node(&self, id: &str) -> Result<WorkflowNode> {
        self.find_one(WorkflowNodeIden::Id, id)
    }

    /// List all workflow nodes for a specific workflow
    pub fn get_workflow_nodes(&self, workflow_id: &str) -> Result<Vec<WorkflowNode>> {
        self.find_many(WorkflowNodeIden::WorkflowId, workflow_id, None)
    }

    /// Upsert a workflow node
    pub fn upsert_workflow_node(
        &self,
        node: &WorkflowNode,
        source: &UpdateSource,
    ) -> Result<WorkflowNode> {
        self.upsert(node, source)
    }

    /// Delete a workflow node
    pub fn delete_workflow_node(
        &self,
        node: &WorkflowNode,
        source: &UpdateSource,
    ) -> Result<WorkflowNode> {
        self.delete(node, source)
    }

    /// List all workflow nodes for a workspace (across all workflows)
    pub fn list_workflow_nodes_by_workspace(&self, workspace_id: &str) -> Result<Vec<WorkflowNode>> {
        use sea_query::{Expr, Query, SqliteQueryBuilder};
        use sea_query_rusqlite::RusqliteBinder;
        use crate::models::{WorkflowIden, UpsertModelInfo};

        let (sql, params) = Query::select()
            .columns([
                (WorkflowNodeIden::Table, WorkflowNodeIden::Id),
                (WorkflowNodeIden::Table, WorkflowNodeIden::Model),
                (WorkflowNodeIden::Table, WorkflowNodeIden::WorkflowId),
                (WorkflowNodeIden::Table, WorkflowNodeIden::NodeType),
                (WorkflowNodeIden::Table, WorkflowNodeIden::NodeSubtype),
                (WorkflowNodeIden::Table, WorkflowNodeIden::Name),
                (WorkflowNodeIden::Table, WorkflowNodeIden::Description),
                (WorkflowNodeIden::Table, WorkflowNodeIden::PositionX),
                (WorkflowNodeIden::Table, WorkflowNodeIden::PositionY),
                (WorkflowNodeIden::Table, WorkflowNodeIden::Width),
                (WorkflowNodeIden::Table, WorkflowNodeIden::Height),
                (WorkflowNodeIden::Table, WorkflowNodeIden::Config),
                (WorkflowNodeIden::Table, WorkflowNodeIden::Enabled),
                (WorkflowNodeIden::Table, WorkflowNodeIden::LegacyStepId),
                (WorkflowNodeIden::Table, WorkflowNodeIden::CreatedAt),
                (WorkflowNodeIden::Table, WorkflowNodeIden::UpdatedAt),
                (WorkflowNodeIden::Table, WorkflowNodeIden::DeletedAt),
            ])
            .from(WorkflowNodeIden::Table)
            .inner_join(
                WorkflowIden::Table,
                Expr::col((WorkflowNodeIden::Table, WorkflowNodeIden::WorkflowId))
                    .equals((WorkflowIden::Table, WorkflowIden::Id))
            )
            .and_where(Expr::col((WorkflowIden::Table, WorkflowIden::WorkspaceId)).eq(workspace_id))
            .build_rusqlite(SqliteQueryBuilder);

        let mut stmt = self.conn.resolve().prepare(sql.as_str())?;
        let rows = stmt.query_map(&*params.as_params(), |row| WorkflowNode::from_row(row))?;
        rows.collect::<std::result::Result<Vec<_>, _>>().map_err(Into::into)
    }
}
