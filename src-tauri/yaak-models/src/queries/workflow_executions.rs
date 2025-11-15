use crate::db_context::DbContext;
use crate::error::Result;
use crate::models::{
    WorkflowExecution, WorkflowExecutionIden,
    WorkflowStepExecution, WorkflowStepExecutionIden,
};
use crate::util::UpdateSource;

impl<'a> DbContext<'a> {
    /// Get a single workflow execution by ID
    pub fn get_workflow_execution(&self, id: &str) -> Result<WorkflowExecution> {
        self.find_one(WorkflowExecutionIden::Id, id)
    }

    /// List workflow executions (newest first)
    pub fn list_workflow_executions(&self, workflow_id: &str) -> Result<Vec<WorkflowExecution>> {
        let mut executions: Vec<WorkflowExecution> = self.find_many(WorkflowExecutionIden::WorkflowId, workflow_id, None)?;
        // Sort by created_at descending (newest first)
        executions.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(executions)
    }

    /// Get all step executions for a workflow execution
    pub fn get_workflow_step_executions(
        &self,
        execution_id: &str,
    ) -> Result<Vec<WorkflowStepExecution>> {
        let mut step_executions: Vec<WorkflowStepExecution> = self.find_many(WorkflowStepExecutionIden::WorkflowExecutionId, execution_id, None)?;
        // Sort by created_at ascending (execution order)
        step_executions.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        Ok(step_executions)
    }

    /// Update execution (for state, elapsed, error changes)
    pub fn update_workflow_execution(
        &self,
        execution: &WorkflowExecution,
        source: &UpdateSource,
    ) -> Result<WorkflowExecution> {
        self.upsert(execution, source)
    }
}
