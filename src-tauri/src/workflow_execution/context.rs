use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashMap;

/// Execution context that flows through workflow execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionContext {
    pub workflow_id: String,
    pub execution_id: String,
    pub environment_id: Option<String>,

    /// Runtime variables (from environment and workflow execution)
    pub variables: HashMap<String, String>,

    /// Results from executed nodes, keyed by node_id
    pub node_results: HashMap<String, NodeResult>,

    /// Stack of loop contexts (for nested loops)
    pub loop_stack: Vec<LoopContext>,
}

impl ExecutionContext {
    pub fn new(workflow_id: String, execution_id: String, environment_id: Option<String>) -> Self {
        Self {
            workflow_id,
            execution_id,
            environment_id,
            variables: HashMap::new(),
            node_results: HashMap::new(),
            loop_stack: Vec::new(),
        }
    }
}

/// Result from executing a node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResult {
    pub node_id: String,

    /// JSON output from the node execution
    pub output: JsonValue,

    /// Elapsed time in milliseconds
    pub elapsed: i32,

    /// For loop nodes: results from each iteration
    pub loop_results: Option<Vec<JsonValue>>,

    /// For parallel nodes: results from each branch
    pub parallel_results: Option<Vec<JsonValue>>,
}

/// Context for loop execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoopContext {
    /// ID of the loop node
    pub node_id: String,

    /// Current iteration index (0-based)
    pub index: usize,

    /// Total number of iterations
    pub total: usize,

    /// Current item (for array-based loops)
    pub item: Option<JsonValue>,
}
