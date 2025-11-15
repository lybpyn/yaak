use crate::db_context::DbContext;
use crate::error::Result;
use crate::models::{WorkflowStep, WorkflowStepIden, HttpRequestIden, GrpcRequestIden};

impl<'a> DbContext<'a> {
    /// Get a single workflow step by ID
    pub fn get_workflow_step(&self, id: &str) -> Result<WorkflowStep> {
        self.find_one(WorkflowStepIden::Id, id)
    }

    /// List all steps in a workflow, ordered by sort_priority
    pub fn list_workflow_steps(&self, workflow_id: &str) -> Result<Vec<WorkflowStep>> {
        self.find_many(WorkflowStepIden::WorkflowId, workflow_id, None)
    }

    /// Validate that a request exists (HTTP or gRPC)
    pub fn validate_request_exists(
        &self,
        request_id: &str,
        request_model: &str,
    ) -> Result<bool> {
        let exists = match request_model {
            "http_request" => {
                self.find_one::<crate::models::HttpRequest>(HttpRequestIden::Id, request_id).is_ok()
            }
            "grpc_request" => {
                self.find_one::<crate::models::GrpcRequest>(GrpcRequestIden::Id, request_id).is_ok()
            }
            _ => false,
        };
        Ok(exists)
    }
}
