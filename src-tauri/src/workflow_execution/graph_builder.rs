use std::collections::{HashMap, HashSet};
use yaak_models::db_context::DbContext;
use yaak_models::error::{Error, Result};
use yaak_models::models::{
    get_node_type_definitions, EdgeType, NodeType, ValidationError, ValidationResult,
    WorkflowEdge, WorkflowNode,
};
use jsonschema::JSONSchema;

/// Execution graph representation
#[derive(Debug, Clone)]
pub struct ExecutionGraph {
    pub nodes: HashMap<String, WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    pub start_node_id: String,
    pub execution_order: Vec<ExecutionStep>,
}

/// Execution step types
#[derive(Debug, Clone)]
pub enum ExecutionStep {
    Sequential {
        node_id: String,
    },
    Parallel {
        node_ids: Vec<String>,
    },
    Conditional {
        node_id: String,
        true_branch: Box<Vec<ExecutionStep>>,
        false_branch: Box<Vec<ExecutionStep>>,
    },
    Loop {
        node_id: String,
        body: Box<Vec<ExecutionStep>>,
    },
}

/// Graph builder and validator
pub struct GraphBuilder;

impl GraphBuilder {
    /// Build execution graph from workflow nodes and edges
    pub fn build(workflow_id: &str, db: &DbContext) -> Result<ExecutionGraph> {
        // 1. Load all nodes and edges for workflow
        let nodes = db.get_workflow_nodes(workflow_id)?;
        let edges = db.get_workflow_edges(workflow_id)?;

        // 2. Validate graph structure
        let validation_result = Self::validate_graph(&nodes, &edges);
        if !validation_result.is_valid() {
            let error_messages: Vec<String> = validation_result
                .errors
                .iter()
                .map(|e| {
                    if let Some(node_id) = &e.node_id {
                        if let Some(field) = &e.field {
                            format!("Node {}, field '{}': {}", node_id, field, e.message)
                        } else {
                            format!("Node {}: {}", node_id, e.message)
                        }
                    } else {
                        e.message.clone()
                    }
                })
                .collect();
            return Err(Error::GenericError(format!(
                "Workflow validation failed:\n  - {}",
                error_messages.join("\n  - ")
            )));
        }

        // 3. Find start node (trigger with no incoming edges)
        let start_node_id = Self::find_start_node(&nodes, &edges)?;

        // 4. Build execution order via topological sort
        let nodes_map: HashMap<String, WorkflowNode> =
            nodes.into_iter().map(|n| (n.id.clone(), n)).collect();
        let execution_order = Self::build_execution_order(&start_node_id, &nodes_map, &edges)?;

        // 5. Return graph
        Ok(ExecutionGraph {
            nodes: nodes_map,
            edges,
            start_node_id,
            execution_order,
        })
    }

    /// Validate graph structure and return all errors
    fn validate_graph(nodes: &[WorkflowNode], edges: &[WorkflowEdge]) -> ValidationResult {
        let mut result = ValidationResult::new();

        // Check 1: At least one node
        if nodes.is_empty() {
            result.add_error(ValidationError::new("Workflow has no nodes".to_string()));
            return result; // Can't continue without nodes
        }

        // Check 2: At least one enabled node
        let enabled_count = nodes.iter().filter(|n| n.enabled).count();
        if enabled_count == 0 {
            result.add_error(ValidationError::new(
                "No enabled nodes in workflow".to_string(),
            ));
        }

        // Check 3: Exactly one start trigger (no incoming edges)
        let start_triggers: Vec<_> = nodes
            .iter()
            .filter(|n| n.node_type == NodeType::Trigger)
            .filter(|n| !Self::has_incoming_edge(n, edges))
            .collect();

        if start_triggers.is_empty() {
            result.add_error(ValidationError::new(
                "No start trigger found (trigger with no incoming edges)".to_string(),
            ));
        } else if start_triggers.len() > 1 {
            result.add_error(ValidationError::new(format!(
                "Multiple start triggers found (ambiguous start point): {}",
                start_triggers
                    .iter()
                    .map(|t| t.id.as_str())
                    .collect::<Vec<_>>()
                    .join(", ")
            )));
        }

        // Check 4: All edges reference valid nodes
        for edge in edges {
            let source_exists = nodes.iter().any(|n| n.id == edge.source_node_id);
            let target_exists = nodes.iter().any(|n| n.id == edge.target_node_id);
            if !source_exists {
                result.add_error(ValidationError::new(format!(
                    "Edge {} references non-existent source node: {}",
                    edge.id, edge.source_node_id
                )));
            }
            if !target_exists {
                result.add_error(ValidationError::new(format!(
                    "Edge {} references non-existent target node: {}",
                    edge.id, edge.target_node_id
                )));
            }
        }

        // Check 5: No cycles (except for loops)
        if let Err(e) = Self::detect_cycles(nodes, edges) {
            result.add_error(ValidationError::new(e.to_string()));
        }

        // Check 6: All required node configs filled
        for node in nodes {
            Self::validate_node_config(node, &mut result);
        }

        result
    }

    /// Detect cycles using DFS
    fn detect_cycles(nodes: &[WorkflowNode], edges: &[WorkflowEdge]) -> Result<()> {
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();

        for node in nodes {
            if !visited.contains(&node.id) {
                if Self::dfs_cycle_detect(&node.id, nodes, edges, &mut visited, &mut rec_stack)? {
                    return Err(Error::GenericError(
                        "Cycle detected in workflow graph".to_string(),
                    ));
                }
            }
        }

        Ok(())
    }

    fn dfs_cycle_detect(
        node_id: &str,
        nodes: &[WorkflowNode],
        edges: &[WorkflowEdge],
        visited: &mut HashSet<String>,
        rec_stack: &mut HashSet<String>,
    ) -> Result<bool> {
        visited.insert(node_id.to_string());
        rec_stack.insert(node_id.to_string());

        // Get outgoing edges (skip loop edges to allow loop structures)
        let outgoing = edges
            .iter()
            .filter(|e| e.source_node_id == node_id)
            .filter(|e| e.edge_type != EdgeType::Loop);

        for edge in outgoing {
            let target_id = &edge.target_node_id;

            if !visited.contains(target_id) {
                if Self::dfs_cycle_detect(target_id, nodes, edges, visited, rec_stack)? {
                    return Ok(true);
                }
            } else if rec_stack.contains(target_id) {
                return Ok(true); // Cycle found
            }
        }

        rec_stack.remove(node_id);
        Ok(false)
    }

    /// Build execution order via topological sort
    fn build_execution_order(
        start_node_id: &str,
        nodes: &HashMap<String, WorkflowNode>,
        edges: &[WorkflowEdge],
    ) -> Result<Vec<ExecutionStep>> {
        let mut execution_steps = Vec::new();
        let mut visited = HashSet::new();

        Self::traverse_node(
            start_node_id,
            nodes,
            edges,
            &mut visited,
            &mut execution_steps,
        )?;

        Ok(execution_steps)
    }

    fn traverse_node(
        node_id: &str,
        nodes: &HashMap<String, WorkflowNode>,
        edges: &[WorkflowEdge],
        visited: &mut HashSet<String>,
        execution_steps: &mut Vec<ExecutionStep>,
    ) -> Result<()> {
        if visited.contains(node_id) {
            return Ok(());
        }
        visited.insert(node_id.to_string());

        let node = nodes
            .get(node_id)
            .ok_or_else(|| Error::GenericError("Node not found".to_string()))?;

        // Determine step type based on node subtype
        match node.node_subtype.as_str() {
            "conditional" => {
                let (true_branch, false_branch) =
                    Self::build_conditional_branches(node_id, nodes, edges, visited)?;

                execution_steps.push(ExecutionStep::Conditional {
                    node_id: node_id.to_string(),
                    true_branch: Box::new(true_branch),
                    false_branch: Box::new(false_branch),
                });
            }
            "loop" => {
                let body = Self::build_loop_body(node_id, nodes, edges, visited)?;

                execution_steps.push(ExecutionStep::Loop {
                    node_id: node_id.to_string(),
                    body: Box::new(body),
                });
            }
            "parallel" => {
                let parallel_branches = Self::get_parallel_targets(node_id, edges);

                execution_steps.push(ExecutionStep::Parallel {
                    node_ids: parallel_branches,
                });
            }
            _ => {
                // Sequential node
                execution_steps.push(ExecutionStep::Sequential {
                    node_id: node_id.to_string(),
                });

                // Continue to next node(s)
                let next_nodes = Self::get_sequential_targets(node_id, edges);
                for next_id in next_nodes {
                    Self::traverse_node(&next_id, nodes, edges, visited, execution_steps)?;
                }
            }
        }

        Ok(())
    }

    /// Build conditional branches (true and false paths)
    fn build_conditional_branches(
        node_id: &str,
        nodes: &HashMap<String, WorkflowNode>,
        edges: &[WorkflowEdge],
        visited: &mut HashSet<String>,
    ) -> Result<(Vec<ExecutionStep>, Vec<ExecutionStep>)> {
        let mut true_branch = Vec::new();
        let mut false_branch = Vec::new();

        // Find true and false branch edges
        let true_targets: Vec<_> = edges
            .iter()
            .filter(|e| e.source_node_id == node_id)
            .filter(|e| e.source_anchor == "true" || e.edge_type == EdgeType::Conditional)
            .map(|e| e.target_node_id.clone())
            .collect();

        let false_targets: Vec<_> = edges
            .iter()
            .filter(|e| e.source_node_id == node_id)
            .filter(|e| e.source_anchor == "false")
            .map(|e| e.target_node_id.clone())
            .collect();

        // Build true branch
        for target_id in true_targets {
            Self::traverse_node(&target_id, nodes, edges, visited, &mut true_branch)?;
        }

        // Build false branch
        for target_id in false_targets {
            Self::traverse_node(&target_id, nodes, edges, visited, &mut false_branch)?;
        }

        Ok((true_branch, false_branch))
    }

    /// Build loop body (steps to repeat)
    fn build_loop_body(
        node_id: &str,
        nodes: &HashMap<String, WorkflowNode>,
        edges: &[WorkflowEdge],
        visited: &mut HashSet<String>,
    ) -> Result<Vec<ExecutionStep>> {
        let mut body = Vec::new();

        // Find loop body edges
        let loop_targets: Vec<_> = edges
            .iter()
            .filter(|e| e.source_node_id == node_id)
            .filter(|e| e.edge_type == EdgeType::Loop)
            .map(|e| e.target_node_id.clone())
            .collect();

        // Build loop body
        for target_id in loop_targets {
            Self::traverse_node(&target_id, nodes, edges, visited, &mut body)?;
        }

        Ok(body)
    }

    /// Get parallel execution targets
    fn get_parallel_targets(node_id: &str, edges: &[WorkflowEdge]) -> Vec<String> {
        edges
            .iter()
            .filter(|e| e.source_node_id == node_id)
            .filter(|e| e.edge_type == EdgeType::Parallel)
            .map(|e| e.target_node_id.clone())
            .collect()
    }

    /// Get sequential execution targets
    fn get_sequential_targets(node_id: &str, edges: &[WorkflowEdge]) -> Vec<String> {
        edges
            .iter()
            .filter(|e| e.source_node_id == node_id)
            .filter(|e| e.edge_type == EdgeType::Sequential)
            .map(|e| e.target_node_id.clone())
            .collect()
    }

    /// Check if node has any incoming edges
    fn has_incoming_edge(node: &WorkflowNode, edges: &[WorkflowEdge]) -> bool {
        edges.iter().any(|e| e.target_node_id == node.id)
    }

    /// Find start node (trigger with no incoming edges)
    fn find_start_node(nodes: &[WorkflowNode], edges: &[WorkflowEdge]) -> Result<String> {
        let start_node = nodes
            .iter()
            .filter(|n| n.node_type == NodeType::Trigger)
            .find(|n| !Self::has_incoming_edge(n, edges))
            .ok_or_else(|| Error::GenericError("No start trigger found".to_string()))?;

        Ok(start_node.id.clone())
    }

    /// Validate node configuration against JSON schema
    fn validate_node_config(node: &WorkflowNode, result: &mut ValidationResult) {
        // Basic validation: ensure required fields are present
        if node.node_subtype.is_empty() {
            result.add_error(ValidationError::with_node(
                "Node has empty subtype".to_string(),
                node.id.clone(),
            ));
            return;
        }

        // Find the node type definition for this node
        let node_type_definitions = get_node_type_definitions();
        let node_def = node_type_definitions.iter().find(|def| {
            def.category == node.node_type && def.subtype == node.node_subtype
        });

        let Some(node_def) = node_def else {
            result.add_error(ValidationError::with_node(
                format!(
                    "Unknown node type: {:?}/{}",
                    node.node_type, node.node_subtype
                ),
                node.id.clone(),
            ));
            return;
        };

        // Skip validation if schema is empty (manual_trigger has no config)
        if node_def.schema.as_object().map_or(false, |o| o.is_empty()) {
            return;
        }

        // Compile JSON schema
        let schema = match JSONSchema::compile(&node_def.schema) {
            Ok(s) => s,
            Err(e) => {
                result.add_error(ValidationError::with_node(
                    format!("Invalid JSON schema for node type: {}", e),
                    node.id.clone(),
                ));
                return;
            }
        };

        // Validate node config against schema
        if let Err(validation_errors) = schema.validate(&node.config) {
            for error in validation_errors {
                // Extract field path from error instance path
                let field = error.instance_path.to_string();
                let field = if field.is_empty() {
                    None
                } else {
                    Some(field.trim_start_matches('/').to_string())
                };

                let message = if let Some(field) = &field {
                    format!("Field '{}': {}", field, error)
                } else {
                    error.to_string()
                };

                result.add_error(ValidationError {
                    node_id: Some(node.id.clone()),
                    field,
                    message,
                });
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use serde_json::json;

    fn create_test_node(id: &str, node_type: NodeType, node_subtype: &str) -> WorkflowNode {
        // Get default config from node type definitions
        let node_type_definitions = get_node_type_definitions();
        let default_config = node_type_definitions
            .iter()
            .find(|def| def.category == node_type && def.subtype == node_subtype)
            .map(|def| def.default_config.clone())
            .unwrap_or(json!({}));

        WorkflowNode {
            model: "workflow_node".to_string(),
            id: id.to_string(),
            created_at: Utc::now().naive_utc(),
            updated_at: Utc::now().naive_utc(),
            deleted_at: None,
            workflow_id: "test_workflow".to_string(),
            node_type,
            node_subtype: node_subtype.to_string(),
            position_x: 0.0,
            position_y: 0.0,
            width: 200.0,
            height: 100.0,
            name: id.to_string(),
            description: None,
            config: default_config,
            enabled: true,
            legacy_step_id: None,
        }
    }

    fn create_test_edge(
        id: &str,
        source: &str,
        target: &str,
        edge_type: EdgeType,
    ) -> WorkflowEdge {
        WorkflowEdge {
            model: "workflow_edge".to_string(),
            id: id.to_string(),
            created_at: Utc::now().naive_utc(),
            updated_at: Utc::now().naive_utc(),
            deleted_at: None,
            workflow_id: "test_workflow".to_string(),
            source_node_id: source.to_string(),
            target_node_id: target.to_string(),
            source_anchor: "default".to_string(),
            target_anchor: "default".to_string(),
            edge_type,
        }
    }

    #[test]
    fn test_valid_linear_graph() {
        let nodes = vec![
            create_test_node("trigger1", NodeType::Trigger, "manual_trigger"),
            create_test_node("action1", NodeType::Action, "http_request"),
            create_test_node("action2", NodeType::Action, "http_request"),
        ];

        let edges = vec![
            create_test_edge("edge1", "trigger1", "action1", EdgeType::Sequential),
            create_test_edge("edge2", "action1", "action2", EdgeType::Sequential),
        ];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(result.is_valid(), "Linear graph should be valid. Errors: {:?}", result.errors);
    }

    #[test]
    fn test_no_nodes() {
        let nodes = vec![];
        let edges = vec![];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("Workflow has no nodes")));
    }

    #[test]
    fn test_no_start_trigger() {
        let nodes = vec![
            create_test_node("action1", NodeType::Action, "http_request"),
            create_test_node("action2", NodeType::Action, "http_request"),
        ];

        let edges = vec![create_test_edge(
            "edge1",
            "action1",
            "action2",
            EdgeType::Sequential,
        )];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("No start trigger")));
    }

    #[test]
    fn test_multiple_start_triggers() {
        let nodes = vec![
            create_test_node("trigger1", NodeType::Trigger, "manual_trigger"),
            create_test_node("trigger2", NodeType::Trigger, "webhook_trigger"),
            create_test_node("action1", NodeType::Action, "http_request"),
        ];

        let edges = vec![
            create_test_edge("edge1", "trigger1", "action1", EdgeType::Sequential),
            create_test_edge("edge2", "trigger2", "action1", EdgeType::Sequential),
        ];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("Multiple start triggers")));
    }

    #[test]
    fn test_cycle_detection() {
        let nodes = vec![
            create_test_node("trigger1", NodeType::Trigger, "manual_trigger"),
            create_test_node("action1", NodeType::Action, "http_request"),
            create_test_node("action2", NodeType::Action, "http_request"),
        ];

        // Create a cycle: trigger -> action1 -> action2 -> action1
        let edges = vec![
            create_test_edge("edge1", "trigger1", "action1", EdgeType::Sequential),
            create_test_edge("edge2", "action1", "action2", EdgeType::Sequential),
            create_test_edge("edge3", "action2", "action1", EdgeType::Sequential), // Creates cycle
        ];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("Cycle detected")));
    }

    #[test]
    fn test_loop_edge_allowed() {
        let nodes = vec![
            create_test_node("trigger1", NodeType::Trigger, "manual_trigger"),
            create_test_node("loop1", NodeType::Logic, "loop"),
            create_test_node("action1", NodeType::Action, "http_request"),
        ];

        // Loop edge should not be detected as a cycle
        let edges = vec![
            create_test_edge("edge1", "trigger1", "loop1", EdgeType::Sequential),
            create_test_edge("edge2", "loop1", "action1", EdgeType::Loop),
            create_test_edge("edge3", "action1", "loop1", EdgeType::Loop), // Back to loop - OK
        ];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(result.is_valid(), "Loop edges should not create cycle error. Errors: {:?}", result.errors);
    }

    #[test]
    fn test_conditional_graph() {
        let nodes = vec![
            create_test_node("trigger1", NodeType::Trigger, "manual_trigger"),
            create_test_node("conditional1", NodeType::Logic, "conditional"),
            create_test_node("action1", NodeType::Action, "http_request"),
            create_test_node("action2", NodeType::Action, "http_request"),
        ];

        let edges = vec![
            create_test_edge("edge1", "trigger1", "conditional1", EdgeType::Sequential),
            create_test_edge("edge2", "conditional1", "action1", EdgeType::Conditional),
            create_test_edge("edge3", "conditional1", "action2", EdgeType::Conditional),
        ];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(result.is_valid(), "Conditional graph should be valid. Errors: {:?}", result.errors);
    }

    #[test]
    fn test_parallel_graph() {
        let nodes = vec![
            create_test_node("trigger1", NodeType::Trigger, "manual_trigger"),
            create_test_node("parallel1", NodeType::Logic, "parallel"),
            create_test_node("action1", NodeType::Action, "http_request"),
            create_test_node("action2", NodeType::Action, "http_request"),
        ];

        let edges = vec![
            create_test_edge("edge1", "trigger1", "parallel1", EdgeType::Sequential),
            create_test_edge("edge2", "parallel1", "action1", EdgeType::Parallel),
            create_test_edge("edge3", "parallel1", "action2", EdgeType::Parallel),
        ];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(result.is_valid(), "Parallel graph should be valid. Errors: {:?}", result.errors);
    }

    #[test]
    fn test_invalid_edge_reference() {
        let nodes = vec![
            create_test_node("trigger1", NodeType::Trigger, "manual_trigger"),
            create_test_node("action1", NodeType::Action, "http_request"),
        ];

        let edges = vec![
            create_test_edge("edge1", "trigger1", "action1", EdgeType::Sequential),
            create_test_edge("edge2", "action1", "nonexistent", EdgeType::Sequential),
        ];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("non-existent")));
    }

    #[test]
    fn test_no_enabled_nodes() {
        let mut node = create_test_node("trigger1", NodeType::Trigger, "manual_trigger");
        node.enabled = false;
        let nodes = vec![node];
        let edges = vec![];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("No enabled nodes")));
    }

    #[test]
    fn test_empty_node_subtype() {
        let mut node = create_test_node("trigger1", NodeType::Trigger, "manual_trigger");
        node.node_subtype = "".to_string();
        let nodes = vec![node];

        let mut result = ValidationResult::new();
        GraphBuilder::validate_node_config(&nodes[0], &mut result);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("empty subtype")));
    }

    #[test]
    fn test_json_schema_validation_success() {
        // Create HTTP request node with valid config
        let mut node = create_test_node("http1", NodeType::Action, "http_request");
        node.config = json!({
            "method": "GET",
            "url": "https://api.example.com",
            "headers": [],
            "body": "",
            "auth_enabled": false
        });

        let mut result = ValidationResult::new();
        GraphBuilder::validate_node_config(&node, &mut result);
        assert!(result.is_valid(), "Valid HTTP request config should pass. Errors: {:?}", result.errors);
    }

    #[test]
    fn test_json_schema_validation_missing_required() {
        // Create HTTP request node with missing required field (url)
        let mut node = create_test_node("http1", NodeType::Action, "http_request");
        node.config = json!({
            "method": "GET",
            "headers": [],
            "body": ""
        });

        let mut result = ValidationResult::new();
        GraphBuilder::validate_node_config(&node, &mut result);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("url")), "Should report missing 'url' field");
    }

    #[test]
    fn test_json_schema_validation_invalid_enum() {
        // Create HTTP request node with invalid method
        let mut node = create_test_node("http1", NodeType::Action, "http_request");
        node.config = json!({
            "method": "INVALID",
            "url": "https://api.example.com",
            "headers": [],
            "body": ""
        });

        let mut result = ValidationResult::new();
        GraphBuilder::validate_node_config(&node, &mut result);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("method") || e.message.contains("INVALID")),
            "Should report invalid enum value. Errors: {:?}", result.errors);
    }

    #[test]
    fn test_json_schema_validation_webhook_trigger() {
        // Create webhook trigger with valid config
        let mut node = create_test_node("webhook1", NodeType::Trigger, "webhook_trigger");
        node.config = json!({
            "url": "https://webhook.yaak.app/test",
            "method": "POST",
            "auth_token": "secret123"
        });

        let mut result = ValidationResult::new();
        GraphBuilder::validate_node_config(&node, &mut result);
        assert!(result.is_valid(), "Valid webhook config should pass. Errors: {:?}", result.errors);
    }

    #[test]
    fn test_validation_collects_multiple_errors() {
        // Create nodes with multiple validation errors
        let mut node1 = create_test_node("trigger1", NodeType::Trigger, "manual_trigger");
        let mut node2 = create_test_node("http1", NodeType::Action, "http_request");
        node2.config = json!({}); // Missing required fields

        let mut node3 = create_test_node("unknown", NodeType::Action, "unknown_type");

        let nodes = vec![node1, node2, node3];
        let edges = vec![];

        let result = GraphBuilder::validate_graph(&nodes, &edges);
        assert!(!result.is_valid());
        // Should have errors for missing http fields and unknown node type
        assert!(result.errors.len() >= 2, "Should collect multiple errors. Got: {:?}", result.errors);
    }

    #[test]
    fn test_unknown_node_type() {
        let mut node = create_test_node("unknown1", NodeType::Action, "unknown_action");
        let nodes = vec![node];

        let mut result = ValidationResult::new();
        GraphBuilder::validate_node_config(&nodes[0], &mut result);
        assert!(!result.is_valid());
        assert!(result.errors.iter().any(|e| e.message.contains("Unknown node type")));
    }
}
