use crate::db_context::DbContext;
use crate::error::Result;
use crate::models::{WorkflowViewport, WorkflowViewportIden};
use crate::util::UpdateSource;

impl<'a> DbContext<'a> {
    /// Get the workflow viewport for a specific workflow
    /// There should only be one viewport per workflow
    pub fn get_workflow_viewport(&self, workflow_id: &str) -> Result<WorkflowViewport> {
        self.find_one(WorkflowViewportIden::WorkflowId, workflow_id)
    }

    /// Upsert a workflow viewport
    pub fn upsert_workflow_viewport(
        &self,
        viewport: &WorkflowViewport,
        source: &UpdateSource,
    ) -> Result<WorkflowViewport> {
        self.upsert(viewport, source)
    }

    /// List all workflow viewports for a workspace (across all workflows)
    pub fn list_workflow_viewports_by_workspace(&self, workspace_id: &str) -> Result<Vec<WorkflowViewport>> {
        use sea_query::{Expr, Query, SqliteQueryBuilder};
        use sea_query_rusqlite::RusqliteBinder;
        use crate::models::{WorkflowIden, UpsertModelInfo};

        let (sql, params) = Query::select()
            .columns([
                (WorkflowViewportIden::Table, WorkflowViewportIden::Id),
                (WorkflowViewportIden::Table, WorkflowViewportIden::Model),
                (WorkflowViewportIden::Table, WorkflowViewportIden::WorkflowId),
                (WorkflowViewportIden::Table, WorkflowViewportIden::PanX),
                (WorkflowViewportIden::Table, WorkflowViewportIden::PanY),
                (WorkflowViewportIden::Table, WorkflowViewportIden::Zoom),
                (WorkflowViewportIden::Table, WorkflowViewportIden::CreatedAt),
                (WorkflowViewportIden::Table, WorkflowViewportIden::UpdatedAt),
            ])
            .from(WorkflowViewportIden::Table)
            .inner_join(
                WorkflowIden::Table,
                Expr::col((WorkflowViewportIden::Table, WorkflowViewportIden::WorkflowId))
                    .equals((WorkflowIden::Table, WorkflowIden::Id))
            )
            .and_where(Expr::col((WorkflowIden::Table, WorkflowIden::WorkspaceId)).eq(workspace_id))
            .build_rusqlite(SqliteQueryBuilder);

        let mut stmt = self.conn.resolve().prepare(sql.as_str())?;
        let rows = stmt.query_map(&*params.as_params(), |row| WorkflowViewport::from_row(row))?;
        rows.collect::<std::result::Result<Vec<_>, _>>().map_err(Into::into)
    }
}
