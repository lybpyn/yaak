use crate::db_context::DbContext;
use crate::error::Result;
use crate::models::{Workflow, WorkflowIden, WorkflowStep, WorkflowStepIden};
use crate::util::UpdateSource;

impl<'a> DbContext<'a> {
    /// Get a single workflow by ID
    pub fn get_workflow(&self, id: &str) -> Result<Workflow> {
        self.find_one(WorkflowIden::Id, id)
    }

    /// List all workflows in a workspace
    pub fn list_workflows_by_workspace(&self, workspace_id: &str) -> Result<Vec<Workflow>> {
        self.find_many(WorkflowIden::WorkspaceId, workspace_id, None)
    }

    /// Get workflow with its steps and broken step IDs
    pub fn get_workflow_with_steps(
        &self,
        workflow_id: &str,
    ) -> Result<(Workflow, Vec<WorkflowStep>, Vec<String>)> {
        // Get workflow
        let workflow = self.get_workflow(workflow_id)?;

        // Get steps
        let steps = self.list_workflow_steps(workflow_id)?;

        // Check for broken references
        let mut broken_step_ids = Vec::new();
        for step in &steps {
            let exists = self.validate_request_exists(
                &step.request_id,
                &step.request_model,
            )?;
            if !exists {
                broken_step_ids.push(step.id.clone());
            }
        }

        Ok((workflow, steps, broken_step_ids))
    }

    /// Delete a workflow and all its steps
    pub fn delete_workflow(&self, workflow: &Workflow, source: &UpdateSource) -> Result<Workflow> {
        // Delete all workflow steps
        let steps: Vec<WorkflowStep> = self.find_many(WorkflowStepIden::WorkflowId, &workflow.id, None)?;
        for step in steps {
            self.delete(&step, source)?;
        }

        // Delete the workflow
        self.delete(workflow, source)
    }

    /// Delete a workflow step
    pub fn delete_workflow_step(&self, step: &WorkflowStep, source: &UpdateSource) -> Result<WorkflowStep> {
        self.delete(step, source)
    }
}
