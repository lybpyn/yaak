# Visual Workflow Canvas - Technical Design Specification

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      Workflow Canvas Page                            ││
│  │  ┌────────────┬──────────────────────────────┬──────────────────┐  ││
│  │  │            │                               │                  │  ││
│  │  │   Node     │      ReactFlow Canvas         │   Properties     │  ││
│  │  │  Library   │      - Custom Nodes           │     Panel        │  ││
│  │  │  Sidebar   │      - Bezier Edges           │   (Dynamic Form) │  ││
│  │  │            │      - Background Grid        │                  │  ││
│  │  │            │      - Controls/Minimap       │                  │  ││
│  │  │            │                               │                  │  ││
│  │  └────────────┴──────────────────────────────┴──────────────────┘  ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │  Toolbar (Execute, Save, Undo/Redo, Zoom)                      │ ││
│  │  └────────────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              State Management (Jotai)                                ││
│  │  - canvasNodesAtom, canvasEdgesAtom, viewportAtom                   ││
│  │  - selectedNodeAtom, undoStackAtom, executionProgressAtom           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              Hooks & Business Logic                                  ││
│  │  - useWorkflowCanvas(), useNodeOperations(), useEdgeOperations()    ││
│  │  - useUndoRedo(), useValidation(), useExecution()                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ Tauri IPC
┌──────────────────────────────▼──────────────────────────────────────────┐
│                        RUST BACKEND                                      │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              Enhanced Execution Engine                               ││
│  │  - Graph Builder & Validator                                         ││
│  │  - Execution Orchestrator (Sequential, Parallel, Conditional, Loop)  ││
│  │  - Template Renderer with Extended Syntax                            ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              Query Layer                                             ││
│  │  - workflow_nodes queries                                            ││
│  │  - workflow_edges queries                                            ││
│  │  - graph traversal & validation                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              Models                                                   ││
│  │  - WorkflowNode, WorkflowEdge, WorkflowViewport                      ││
│  │  - NodeTypeDefinition, ExecutionGraph                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                       SQLite Database                                    │
│  workflows, workflow_nodes, workflow_edges, workflow_viewport,           │
│  workflow_executions, workflow_node_executions                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2. Database Schema

### 2.1 workflow_nodes

```sql
CREATE TABLE workflow_nodes (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_node',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,

    workflow_id TEXT NOT NULL,
    node_type TEXT NOT NULL,  -- 'trigger' | 'action' | 'logic'
    node_subtype TEXT NOT NULL,  -- 'manual_trigger' | 'http_request' | 'conditional' | etc.

    -- Canvas position
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0,
    width REAL NOT NULL DEFAULT 250,
    height REAL NOT NULL DEFAULT 150,

    -- Configuration
    name TEXT NOT NULL,
    description TEXT,
    config TEXT NOT NULL,  -- JSON blob, node-specific
    enabled INTEGER NOT NULL DEFAULT 1,

    -- Legacy compatibility
    legacy_step_id TEXT,  -- Reference to old workflow_step if migrated

    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_nodes_deleted_at ON workflow_nodes(deleted_at);
CREATE INDEX idx_workflow_nodes_node_type ON workflow_nodes(node_type);
```

### 2.2 workflow_edges

```sql
CREATE TABLE workflow_edges (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_edge',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,

    workflow_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,

    -- Anchor points
    source_anchor TEXT NOT NULL DEFAULT 'output',  -- 'output' | 'true' | 'false' | 'parallel-0' | etc.
    target_anchor TEXT NOT NULL DEFAULT 'input',   -- 'input'

    -- Visual & semantic properties
    edge_type TEXT NOT NULL DEFAULT 'sequential',  -- 'sequential' | 'conditional' | 'parallel' | 'loop'

    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX idx_workflow_edges_source_node_id ON workflow_edges(source_node_id);
CREATE INDEX idx_workflow_edges_target_node_id ON workflow_edges(target_node_id);
CREATE INDEX idx_workflow_edges_deleted_at ON workflow_edges(deleted_at);

-- Unique constraint: one edge per input anchor
CREATE UNIQUE INDEX idx_workflow_edges_target_unique
  ON workflow_edges(target_node_id, target_anchor)
  WHERE deleted_at IS NULL;
```

### 2.3 workflow_viewport

```sql
CREATE TABLE workflow_viewport (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_viewport',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    workflow_id TEXT NOT NULL UNIQUE,
    pan_x REAL NOT NULL DEFAULT 0,
    pan_y REAL NOT NULL DEFAULT 0,
    zoom REAL NOT NULL DEFAULT 1.0,

    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_workflow_viewport_workflow_id ON workflow_viewport(workflow_id);
```

### 2.4 workflows (enhanced)

```sql
-- Add new column to existing workflows table
ALTER TABLE workflows ADD COLUMN canvas_enabled INTEGER NOT NULL DEFAULT 0;

-- Migration: Existing workflows default to old step-based UI (0)
-- New workflows default to canvas UI (1)
```

### 2.5 workflow_node_executions (replaces workflow_step_executions)

```sql
CREATE TABLE workflow_node_executions (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_node_execution',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,

    workflow_execution_id TEXT NOT NULL,
    workflow_node_id TEXT NOT NULL,

    -- Execution results
    elapsed INTEGER,
    state TEXT NOT NULL,  -- 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    error TEXT,
    result TEXT,  -- JSON blob, node-specific output

    -- For loop iterations
    loop_iteration INTEGER,  -- NULL for non-loop nodes, 0-N for loop iterations

    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_node_executions_execution_id ON workflow_node_executions(workflow_execution_id);
CREATE INDEX idx_workflow_node_executions_node_id ON workflow_node_executions(workflow_node_id);
CREATE INDEX idx_workflow_node_executions_deleted_at ON workflow_node_executions(deleted_at);
```

## 3. Rust Data Models

### 3.1 Core Models

Located in `src-tauri/yaak-models/src/models.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkflowNode {
    pub id: String,
    pub model: String,  // "workflow_node"
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,

    pub workflow_id: String,
    pub node_type: NodeType,
    pub node_subtype: String,

    pub position_x: f64,
    pub position_y: f64,
    pub width: f64,
    pub height: f64,

    pub name: String,
    pub description: Option<String>,
    pub config: serde_json::Value,  // Node-specific JSON
    pub enabled: bool,

    pub legacy_step_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, rename_all = "lowercase")]
pub enum NodeType {
    Trigger,
    Action,
    Logic,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkflowEdge {
    pub id: String,
    pub model: String,  // "workflow_edge"
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,

    pub workflow_id: String,
    pub source_node_id: String,
    pub target_node_id: String,
    pub source_anchor: String,
    pub target_anchor: String,
    pub edge_type: EdgeType,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, rename_all = "lowercase")]
pub enum EdgeType {
    Sequential,
    Conditional,
    Parallel,
    Loop,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkflowViewport {
    pub id: String,
    pub model: String,  // "workflow_viewport"
    pub created_at: i64,
    pub updated_at: i64,

    pub workflow_id: String,
    pub pan_x: f64,
    pub pan_y: f64,
    pub zoom: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkflowNodeExecution {
    pub id: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,

    pub workflow_execution_id: String,
    pub workflow_node_id: String,

    pub elapsed: Option<i32>,
    pub state: NodeExecutionState,
    pub error: Option<String>,
    pub result: Option<serde_json::Value>,

    pub loop_iteration: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, rename_all = "lowercase")]
pub enum NodeExecutionState {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
}
```

### 3.2 Node Type Definitions

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeTypeDefinition {
    pub category: NodeType,
    pub subtype: String,
    pub name: String,
    pub description: String,
    pub icon: String,  // Emoji or icon identifier
    pub color: String,  // Hex color
    pub schema: serde_json::Value,  // JSON Schema for validation
    pub default_config: serde_json::Value,
}

// Built-in node type registry
pub fn get_node_type_definitions() -> Vec<NodeTypeDefinition> {
    vec![
        // Triggers
        NodeTypeDefinition {
            category: NodeType::Trigger,
            subtype: "manual_trigger".to_string(),
            name: "Manual Trigger".to_string(),
            description: "Start workflow manually".to_string(),
            icon: "⚡".to_string(),
            color: "#10b981".to_string(),  // Green
            schema: json!({}),
            default_config: json!({}),
        },
        NodeTypeDefinition {
            category: NodeType::Trigger,
            subtype: "webhook_trigger".to_string(),
            name: "Webhook Trigger".to_string(),
            description: "Trigger on HTTP webhook".to_string(),
            icon: "🌐".to_string(),
            color: "#10b981".to_string(),
            schema: json!({
                "type": "object",
                "required": ["url", "method"],
                "properties": {
                    "url": { "type": "string", "format": "uri" },
                    "method": { "type": "string", "enum": ["GET", "POST", "PUT", "DELETE"] },
                    "auth_token": { "type": "string" }
                }
            }),
            default_config: json!({
                "url": "https://webhook.yaak.app/{{uuid()}}",
                "method": "POST",
                "auth_token": ""
            }),
        },
        NodeTypeDefinition {
            category: NodeType::Trigger,
            subtype: "timer_trigger".to_string(),
            name: "Timer Trigger".to_string(),
            description: "Execute on schedule".to_string(),
            icon: "⏰".to_string(),
            color: "#3b82f6".to_string(),  // Blue
            schema: json!({
                "type": "object",
                "required": ["schedule_type"],
                "properties": {
                    "schedule_type": { "type": "string", "enum": ["cron", "interval"] },
                    "cron_expression": { "type": "string" },
                    "interval_minutes": { "type": "integer", "minimum": 1 }
                }
            }),
            default_config: json!({
                "schedule_type": "interval",
                "interval_minutes": 60
            }),
        },

        // Actions
        NodeTypeDefinition {
            category: NodeType::Action,
            subtype: "http_request".to_string(),
            name: "HTTP Request".to_string(),
            description: "Send HTTP API request".to_string(),
            icon: "🌐".to_string(),
            color: "#8b5cf6".to_string(),  // Purple
            schema: json!({
                "type": "object",
                "required": ["method", "url"],
                "properties": {
                    "method": { "type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] },
                    "url": { "type": "string" },
                    "headers": { "type": "array", "items": { "type": "object" } },
                    "body": { "type": "string" },
                    "auth_enabled": { "type": "boolean" }
                }
            }),
            default_config: json!({
                "method": "GET",
                "url": "",
                "headers": [],
                "body": "",
                "auth_enabled": false
            }),
        },
        // ... more action types (grpc_request, email, database, websocket)

        // Logic Control
        NodeTypeDefinition {
            category: NodeType::Logic,
            subtype: "conditional".to_string(),
            name: "Conditional (IF/ELSE)".to_string(),
            description: "Branch based on condition".to_string(),
            icon: "❓".to_string(),
            color: "#f59e0b".to_string(),  // Amber/Yellow
            schema: json!({
                "type": "object",
                "required": ["condition"],
                "properties": {
                    "condition": { "type": "string" }
                }
            }),
            default_config: json!({
                "condition": "{{step[0].response.status}} == 200"
            }),
        },
        NodeTypeDefinition {
            category: NodeType::Logic,
            subtype: "loop".to_string(),
            name: "Loop".to_string(),
            description: "Iterate over items".to_string(),
            icon: "🔁".to_string(),
            color: "#ef4444".to_string(),  // Red
            schema: json!({
                "type": "object",
                "required": ["loop_type"],
                "properties": {
                    "loop_type": { "type": "string", "enum": ["count", "array"] },
                    "count": { "type": "integer", "minimum": 1, "maximum": 1000 },
                    "array_variable": { "type": "string" }
                }
            }),
            default_config: json!({
                "loop_type": "count",
                "count": 5
            }),
        },
        NodeTypeDefinition {
            category: NodeType::Logic,
            subtype: "parallel".to_string(),
            name: "Parallel Execution".to_string(),
            description: "Execute branches concurrently".to_string(),
            icon: "⚡".to_string(),
            color: "#06b6d4".to_string(),  // Cyan
            schema: json!({
                "type": "object",
                "required": ["branch_count"],
                "properties": {
                    "branch_count": { "type": "integer", "minimum": 2, "maximum": 10 },
                    "fail_fast": { "type": "boolean" }
                }
            }),
            default_config: json!({
                "branch_count": 2,
                "fail_fast": true
            }),
        },
    ]
}
```

### 3.3 Execution Graph Models

```rust
#[derive(Debug, Clone)]
pub struct ExecutionGraph {
    pub nodes: HashMap<String, WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    pub start_node_id: String,
    pub execution_order: Vec<ExecutionStep>,
}

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

#[derive(Debug, Clone)]
pub struct ExecutionContext {
    pub workflow_id: String,
    pub execution_id: String,
    pub environment_id: Option<String>,
    pub variables: HashMap<String, serde_json::Value>,
    pub node_results: HashMap<String, NodeResult>,
    pub loop_stack: Vec<LoopContext>,
}

#[derive(Debug, Clone)]
pub struct LoopContext {
    pub node_id: String,
    pub index: usize,
    pub total: usize,
    pub item: Option<serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct NodeResult {
    pub node_id: String,
    pub output: serde_json::Value,
    pub elapsed: i32,
    pub loop_results: Option<Vec<serde_json::Value>>,
    pub parallel_results: Option<Vec<serde_json::Value>>,
}
```

## 4. Enhanced Execution Engine

### 4.1 Graph Builder & Validator

Located in `src-tauri/src/workflow_execution/graph_builder.rs`:

```rust
pub struct GraphBuilder;

impl GraphBuilder {
    /// Build execution graph from workflow nodes and edges
    pub fn build(
        workflow_id: &str,
        db: &Database,
    ) -> Result<ExecutionGraph> {
        // 1. Load all nodes and edges for workflow
        let nodes = db.get_workflow_nodes(workflow_id)?;
        let edges = db.get_workflow_edges(workflow_id)?;

        // 2. Validate graph structure
        Self::validate_graph(&nodes, &edges)?;

        // 3. Find start node (trigger with no incoming edges)
        let start_node_id = Self::find_start_node(&nodes, &edges)?;

        // 4. Build execution order via topological sort
        let execution_order = Self::build_execution_order(
            &start_node_id,
            &nodes,
            &edges,
        )?;

        // 5. Return graph
        Ok(ExecutionGraph {
            nodes: nodes.into_iter().map(|n| (n.id.clone(), n)).collect(),
            edges,
            start_node_id,
            execution_order,
        })
    }

    /// Validate graph structure
    fn validate_graph(
        nodes: &[WorkflowNode],
        edges: &[WorkflowEdge],
    ) -> Result<()> {
        // Check 1: At least one node
        if nodes.is_empty() {
            return Err("Workflow has no nodes".into());
        }

        // Check 2: All nodes enabled (or at least one trigger)
        let enabled_count = nodes.iter().filter(|n| n.enabled).count();
        if enabled_count == 0 {
            return Err("No enabled nodes in workflow".into());
        }

        // Check 3: Exactly one start trigger (no incoming edges)
        let start_triggers: Vec<_> = nodes.iter()
            .filter(|n| n.node_type == NodeType::Trigger)
            .filter(|n| !Self::has_incoming_edge(n, edges))
            .collect();

        if start_triggers.is_empty() {
            return Err("No start trigger found (trigger with no incoming edges)".into());
        }
        if start_triggers.len() > 1 {
            return Err("Multiple start triggers found (ambiguous start point)".into());
        }

        // Check 4: All edges reference valid nodes
        for edge in edges {
            let source_exists = nodes.iter().any(|n| n.id == edge.source_node_id);
            let target_exists = nodes.iter().any(|n| n.id == edge.target_node_id);
            if !source_exists || !target_exists {
                return Err(format!("Edge references non-existent node: {}", edge.id).into());
            }
        }

        // Check 5: No cycles (except for loops)
        Self::detect_cycles(nodes, edges)?;

        // Check 6: All required node configs filled
        for node in nodes {
            Self::validate_node_config(node)?;
        }

        Ok(())
    }

    /// Detect cycles using DFS
    fn detect_cycles(
        nodes: &[WorkflowNode],
        edges: &[WorkflowEdge],
    ) -> Result<()> {
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();

        for node in nodes {
            if !visited.contains(&node.id) {
                if Self::dfs_cycle_detect(
                    &node.id,
                    nodes,
                    edges,
                    &mut visited,
                    &mut rec_stack,
                )? {
                    return Err("Cycle detected in workflow graph".into());
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

        // Get outgoing edges (skip loop edges)
        let outgoing = edges.iter()
            .filter(|e| e.source_node_id == node_id)
            .filter(|e| e.edge_type != EdgeType::Loop);

        for edge in outgoing {
            let target_id = &edge.target_node_id;

            if !visited.contains(target_id) {
                if Self::dfs_cycle_detect(target_id, nodes, edges, visited, rec_stack)? {
                    return Ok(true);
                }
            } else if rec_stack.contains(target_id) {
                return Ok(true);  // Cycle found
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

        let node = nodes.get(node_id).ok_or("Node not found")?;

        // Determine step type based on node subtype
        match node.node_subtype.as_str() {
            "conditional" => {
                let (true_branch, false_branch) = Self::build_conditional_branches(
                    node_id,
                    nodes,
                    edges,
                    visited,
                )?;

                execution_steps.push(ExecutionStep::Conditional {
                    node_id: node_id.to_string(),
                    true_branch: Box::new(true_branch),
                    false_branch: Box::new(false_branch),
                });
            },
            "loop" => {
                let body = Self::build_loop_body(
                    node_id,
                    nodes,
                    edges,
                    visited,
                )?;

                execution_steps.push(ExecutionStep::Loop {
                    node_id: node_id.to_string(),
                    body: Box::new(body),
                });
            },
            "parallel" => {
                let parallel_branches = Self::get_parallel_targets(node_id, edges);

                execution_steps.push(ExecutionStep::Parallel {
                    node_ids: parallel_branches,
                });
            },
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
}
```

### 4.2 Execution Orchestrator

Located in `src-tauri/src/workflow_execution/orchestrator.rs`:

```rust
pub struct WorkflowOrchestrator<R: Runtime> {
    app_handle: AppHandle<R>,
    cancellation_tokens: Arc<RwLock<HashMap<String, bool>>>,
}

impl<R: Runtime> WorkflowOrchestrator<R> {
    /// Execute workflow (non-blocking)
    pub async fn execute(
        &self,
        workflow_id: String,
        environment_id: Option<String>,
    ) -> Result<String> {
        // 1. Build execution graph
        let db = self.app_handle.db();
        let graph = GraphBuilder::build(&workflow_id, &db)?;

        // 2. Create WorkflowExecution record
        let execution = WorkflowExecution {
            id: uuid(),
            model: "workflow_execution".to_string(),
            created_at: now(),
            updated_at: now(),
            deleted_at: None,
            workflow_id: workflow_id.clone(),
            workspace_id: db.get_workflow(&workflow_id)?.workspace_id,
            environment_id,
            elapsed: None,
            state: WorkflowExecutionState::Initialized,
            error: None,
        };
        db.upsert_workflow_execution(&execution)?;

        // 3. Spawn async execution task
        let app_handle = self.app_handle.clone();
        let execution_id = execution.id.clone();

        tauri::async_runtime::spawn(async move {
            let orchestrator = Self { app_handle, cancellation_tokens: Default::default() };
            if let Err(e) = orchestrator.run_workflow(execution_id.clone(), graph).await {
                eprintln!("Workflow execution failed: {}", e);
                orchestrator.update_execution_state(&execution_id, WorkflowExecutionState::Failed, Some(e.to_string())).await;
            }
        });

        // 4. Return execution ID immediately
        Ok(execution.id)
    }

    /// Main execution loop
    async fn run_workflow(
        &self,
        execution_id: String,
        graph: ExecutionGraph,
    ) -> Result<()> {
        let start_time = Instant::now();

        // Update state to Running
        self.update_execution_state(&execution_id, WorkflowExecutionState::Running, None).await?;

        // Initialize execution context
        let mut context = ExecutionContext {
            workflow_id: graph.start_node_id.clone(),
            execution_id: execution_id.clone(),
            environment_id: None,  // TODO: Get from execution record
            variables: HashMap::new(),
            node_results: HashMap::new(),
            loop_stack: Vec::new(),
        };

        // Execute steps
        for step in &graph.execution_order {
            // Check cancellation
            if self.is_cancelled(&execution_id).await {
                self.update_execution_state(&execution_id, WorkflowExecutionState::Cancelled, None).await?;
                return Ok(());
            }

            // Execute step
            self.execute_step(step, &graph, &mut context).await?;
        }

        // Mark as completed
        let elapsed = start_time.elapsed().as_millis() as i32;
        self.update_execution_state_with_elapsed(&execution_id, WorkflowExecutionState::Completed, None, elapsed).await?;

        Ok(())
    }

    /// Execute single step
    async fn execute_step(
        &self,
        step: &ExecutionStep,
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        match step {
            ExecutionStep::Sequential { node_id } => {
                self.execute_node(node_id, graph, context).await?;
            },
            ExecutionStep::Parallel { node_ids } => {
                self.execute_parallel(node_ids, graph, context).await?;
            },
            ExecutionStep::Conditional { node_id, true_branch, false_branch } => {
                self.execute_conditional(node_id, true_branch, false_branch, graph, context).await?;
            },
            ExecutionStep::Loop { node_id, body } => {
                self.execute_loop(node_id, body, graph, context).await?;
            },
        }

        Ok(())
    }

    /// Execute single node
    async fn execute_node(
        &self,
        node_id: &str,
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        let node = graph.nodes.get(node_id).ok_or("Node not found")?;

        // Create node execution record
        let node_execution = WorkflowNodeExecution {
            id: uuid(),
            model: "workflow_node_execution".to_string(),
            created_at: now(),
            updated_at: now(),
            deleted_at: None,
            workflow_execution_id: context.execution_id.clone(),
            workflow_node_id: node.id.clone(),
            elapsed: None,
            state: NodeExecutionState::Running,
            error: None,
            result: None,
            loop_iteration: context.loop_stack.last().map(|l| l.index as i32),
        };
        self.app_handle.db().upsert_workflow_node_execution(&node_execution)?;

        // Emit event
        self.emit_node_started(node.id.clone()).await;

        let start_time = Instant::now();

        // Execute based on node subtype
        let result = match node.node_subtype.as_str() {
            "manual_trigger" | "webhook_trigger" | "timer_trigger" => {
                // Triggers just pass through
                Ok(json!({}))
            },
            "http_request" => {
                self.execute_http_request(node, context).await
            },
            "grpc_request" => {
                self.execute_grpc_request(node, context).await
            },
            "email" => {
                self.execute_email(node, context).await
            },
            "database" => {
                self.execute_database(node, context).await
            },
            _ => {
                Err("Unknown node subtype".into())
            }
        };

        let elapsed = start_time.elapsed().as_millis() as i32;

        // Update node execution with result
        match result {
            Ok(output) => {
                let updated_execution = WorkflowNodeExecution {
                    elapsed: Some(elapsed),
                    state: NodeExecutionState::Completed,
                    result: Some(output.clone()),
                    ..node_execution
                };
                self.app_handle.db().upsert_workflow_node_execution(&updated_execution)?;

                // Store result in context
                context.node_results.insert(node.id.clone(), NodeResult {
                    node_id: node.id.clone(),
                    output,
                    elapsed,
                    loop_results: None,
                    parallel_results: None,
                });

                self.emit_node_completed(node.id.clone()).await;
                Ok(())
            },
            Err(e) => {
                let updated_execution = WorkflowNodeExecution {
                    elapsed: Some(elapsed),
                    state: NodeExecutionState::Failed,
                    error: Some(e.to_string()),
                    ..node_execution
                };
                self.app_handle.db().upsert_workflow_node_execution(&updated_execution)?;

                self.emit_node_failed(node.id.clone(), e.to_string()).await;
                Err(e)
            }
        }
    }

    /// Execute HTTP request node
    async fn execute_http_request(
        &self,
        node: &WorkflowNode,
        context: &ExecutionContext,
    ) -> Result<serde_json::Value> {
        // 1. Render template variables in config
        let rendered_config = self.render_node_config(&node.config, context)?;

        // 2. Extract HTTP request params
        let method = rendered_config["method"].as_str().ok_or("Missing method")?;
        let url = rendered_config["url"].as_str().ok_or("Missing URL")?;
        let headers = rendered_config["headers"].as_array().unwrap_or(&vec![]);
        let body = rendered_config["body"].as_str().unwrap_or("");

        // 3. Use existing HTTP execution logic
        // (Reuse send_http_request from src-tauri/src/http_request.rs)
        let response = self.app_handle.send_http_request_internal(
            method,
            url,
            headers,
            body,
            context.environment_id.as_ref(),
        ).await?;

        // 4. Return response as JSON
        Ok(json!({
            "status": response.status,
            "statusText": response.status_text,
            "headers": response.headers,
            "body": response.body,
            "elapsed": response.elapsed,
            "url": response.url,
        }))
    }

    /// Execute parallel branches
    async fn execute_parallel(
        &self,
        node_ids: &[String],
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        // Spawn all branches concurrently
        let mut handles = Vec::new();

        for node_id in node_ids {
            let node_id = node_id.clone();
            let graph = graph.clone();
            let mut branch_context = context.clone();
            let orchestrator = self.clone();

            let handle = tauri::async_runtime::spawn(async move {
                orchestrator.execute_node(&node_id, &graph, &mut branch_context).await
            });

            handles.push(handle);
        }

        // Wait for all to complete
        let results = futures::future::join_all(handles).await;

        // Check for errors
        for (i, result) in results.iter().enumerate() {
            if let Err(e) = result {
                return Err(format!("Parallel branch {} failed: {}", i, e).into());
            }
        }

        Ok(())
    }

    /// Execute conditional branch
    async fn execute_conditional(
        &self,
        node_id: &str,
        true_branch: &[ExecutionStep],
        false_branch: &[ExecutionStep],
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        let node = graph.nodes.get(node_id).ok_or("Node not found")?;

        // 1. Evaluate condition
        let condition_expr = node.config["condition"].as_str().ok_or("Missing condition")?;
        let rendered_condition = self.render_template(condition_expr, context)?;
        let condition_result = self.evaluate_boolean(&rendered_condition)?;

        // 2. Execute appropriate branch
        let branch = if condition_result { true_branch } else { false_branch };

        for step in branch {
            self.execute_step(step, graph, context).await?;
        }

        Ok(())
    }

    /// Execute loop
    async fn execute_loop(
        &self,
        node_id: &str,
        body: &[ExecutionStep],
        graph: &ExecutionGraph,
        context: &mut ExecutionContext,
    ) -> Result<()> {
        let node = graph.nodes.get(node_id).ok_or("Node not found")?;

        let loop_type = node.config["loop_type"].as_str().ok_or("Missing loop_type")?;

        let iterations: Vec<(usize, Option<serde_json::Value>)> = match loop_type {
            "count" => {
                let count = node.config["count"].as_i64().ok_or("Missing count")? as usize;
                (0..count).map(|i| (i, None)).collect()
            },
            "array" => {
                let array_var = node.config["array_variable"].as_str().ok_or("Missing array_variable")?;
                let rendered = self.render_template(array_var, context)?;
                let array: Vec<serde_json::Value> = serde_json::from_str(&rendered)?;
                array.into_iter().enumerate().map(|(i, item)| (i, Some(item))).collect()
            },
            _ => return Err("Unknown loop_type".into()),
        };

        let mut loop_results = Vec::new();

        for (index, item) in iterations {
            // Push loop context
            context.loop_stack.push(LoopContext {
                node_id: node.id.clone(),
                index,
                total: context.loop_stack.len(),
                item: item.clone(),
            });

            // Execute body
            for step in body {
                self.execute_step(step, graph, context).await?;
            }

            // Collect results (last node in body)
            if let Some(last_result) = context.node_results.values().last() {
                loop_results.push(last_result.output.clone());
            }

            // Pop loop context
            context.loop_stack.pop();
        }

        // Store loop results
        context.node_results.insert(node.id.clone(), NodeResult {
            node_id: node.id.clone(),
            output: json!(loop_results),
            elapsed: 0,
            loop_results: Some(loop_results),
            parallel_results: None,
        });

        Ok(())
    }
}
```

## 5. Frontend Architecture

### 5.1 Component Hierarchy

```
WorkflowCanvasPage
├── Toolbar
│   ├── ExecuteButton (with environment selector)
│   ├── SaveButton
│   ├── UndoButton
│   ├── RedoButton
│   ├── ZoomControls (fit, in, out, percentage)
│   └── SettingsButton (grid, autosave)
├── WorkflowCanvas
│   ├── ReactFlow
│   │   ├── Background (grid)
│   │   ├── Controls (zoom, minimap)
│   │   ├── CustomNodes (11 node types)
│   │   │   ├── ManualTriggerNode
│   │   │   ├── WebhookTriggerNode
│   │   │   ├── TimerTriggerNode
│   │   │   ├── HttpRequestNode
│   │   │   ├── GrpcRequestNode
│   │   │   ├── EmailNode
│   │   │   ├── DatabaseNode
│   │   │   ├── WebSocketNode
│   │   │   ├── ConditionalNode
│   │   │   ├── LoopNode
│   │   │   └── ParallelNode
│   │   └── CustomEdges
│   │       ├── SequentialEdge (Bezier)
│   │       ├── ConditionalEdge (Bezier, colored)
│   │       ├── ParallelEdge (Bezier, dashed)
│   │       └── LoopEdge (Bezier, curved back)
│   ├── NodeLibrarySidebar
│   │   ├── SearchInput
│   │   └── NodeLibraryCategories
│   │       ├── TriggerCategory (collapsible)
│   │       │   ├── WebhookTriggerCard (draggable)
│   │       │   └── TimerTriggerCard (draggable)
│   │       ├── ActionCategory
│   │       │   ├── HttpRequestCard
│   │       │   ├── GrpcRequestCard
│   │       │   ├── EmailCard
│   │       │   └── DatabaseCard
│   │       └── LogicCategory
│   │           ├── ConditionalCard
│   │           ├── LoopCard
│   │           └── ParallelCard
│   └── PropertiesPanel
│       ├── NodePropertiesHeader
│       │   ├── NodeIcon
│       │   ├── NodeTypeName
│       │   └── CloseButton
│       ├── DynamicForm (based on selected node)
│       │   ├── NodeNameInput
│       │   ├── NodeDescriptionTextarea
│       │   └── NodeTypeSpecificFields
│       │       ├── HttpRequestForm
│       │       │   ├── MethodDropdown
│       │       │   ├── UrlInput (with autocomplete)
│       │       │   ├── HeadersKeyValueList
│       │       │   ├── BodyCodeEditor (Monaco)
│       │       │   └── AuthCheckbox
│       │       ├── ConditionalForm
│       │       │   └── ConditionCodeEditor (Monaco, with autocomplete)
│       │       └── LoopForm
│       │           ├── LoopTypeRadio (count | array)
│       │           ├── CountNumberInput
│       │           └── ArrayVariableInput (with autocomplete)
│       └── SaveButton (if unsaved changes)
└── ExecutionProgressOverlay (during execution)
    ├── ProgressBar
    ├── CurrentStepIndicator
    └── CancelButton
```

### 5.2 ReactFlow Integration

Located in `src-web/components/Workflows/WorkflowCanvas.tsx`:

```typescript
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes: NodeTypes = {
  manual_trigger: ManualTriggerNode,
  webhook_trigger: WebhookTriggerNode,
  timer_trigger: TimerTriggerNode,
  http_request: HttpRequestNode,
  grpc_request: GrpcRequestNode,
  email: EmailNode,
  database: DatabaseNode,
  websocket: WebSocketNode,
  conditional: ConditionalNode,
  loop: LoopNode,
  parallel: ParallelNode,
};

const edgeTypes: EdgeTypes = {
  sequential: SequentialEdge,
  conditional: ConditionalEdge,
  parallel: ParallelEdge,
  loop: LoopEdge,
};

export function WorkflowCanvas({ workflow }: { workflow: Workflow }) {
  // Load nodes and edges from Jotai atoms
  const canvasNodes = useAtomValue(canvasNodesAtom);
  const canvasEdges = useAtomValue(canvasEdgesAtom);

  // Convert to ReactFlow format
  const rfNodes = useMemo(() =>
    canvasNodes
      .filter(n => n.workflow_id === workflow.id)
      .map(toReactFlowNode),
    [canvasNodes, workflow.id]
  );

  const rfEdges = useMemo(() =>
    canvasEdges
      .filter(e => e.workflow_id === workflow.id)
      .map(toReactFlowEdge),
    [canvasEdges, workflow.id]
  );

  // Use ReactFlow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Handle node position change (persist to database)
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);

    // Extract position changes and persist
    const positionChanges = changes.filter(c => c.type === 'position' && c.dragging === false);
    for (const change of positionChanges) {
      const node = nodes.find(n => n.id === change.id);
      if (node?.position) {
        patchModel(change.id, {
          position_x: node.position.x,
          position_y: node.position.y,
        });
      }
    }
  }, [nodes, onNodesChange]);

  // Handle edge connection
  const handleConnect = useCallback((connection: Connection) => {
    createWorkflowEdge({
      workflow_id: workflow.id,
      source_node_id: connection.source,
      target_node_id: connection.target,
      source_anchor: connection.sourceHandle || 'output',
      target_anchor: connection.targetHandle || 'input',
      edge_type: 'sequential',
    });
  }, [workflow.id]);

  // Handle node selection
  const handleNodeClick = useCallback((event, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Handle canvas click (deselect)
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Handle drag from node library
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const nodeSubtype = event.dataTransfer.getData('application/nodeSubtype');
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    createWorkflowNode({
      workflow_id: workflow.id,
      node_subtype: nodeSubtype,
      position_x: position.x,
      position_y: position.y,
    });
  }, [workflow.id]);

  return (
    <div className="h-full flex">
      {/* Node Library Sidebar */}
      <NodeLibrarySidebar />

      {/* Canvas */}
      <div className="flex-1 relative" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            type: 'sequential',
            animated: false,
          }}
        >
          <Background color="#64748b" gap={20} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
```

### 5.3 Custom Node Component Example

Located in `src-web/components/Workflows/nodes/HttpRequestNode.tsx`:

```typescript
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNode } from '@yaakapp-internal/models';
import classNames from 'classnames';
import { useNodeStatus } from '../../../hooks/useNodeStatus';

export function HttpRequestNode({ data, selected }: NodeProps) {
  const node = data.node as WorkflowNode;
  const status = useNodeStatus(node.id);

  const isConfigured = node.config.method && node.config.url;

  return (
    <div
      className={classNames(
        'relative bg-surface border-2 rounded-2xl p-6 min-w-[250px] shadow-sm transition-all',
        'hover:shadow-md',
        {
          'border-purple-500': selected,
          'border-border-focus': !selected && node.enabled,
          'border-border opacity-60': !node.enabled,
          'border-green-500': status === 'completed',
          'border-red-500': status === 'failed',
          'border-yellow-500 animate-pulse': status === 'running',
        }
      )}
    >
      {/* Status Badge */}
      <div className="absolute -top-2 -right-2">
        {isConfigured ? (
          <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
            已配置
          </span>
        ) : (
          <span className="px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
            未配置
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
          <span className="text-2xl">🌐</span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-sm">{node.name}</h4>
          <p className="text-xs text-text-subtle">Send HTTP request</p>
        </div>

        {/* Method & URL Preview */}
        {node.config.method && (
          <div className="text-xs text-text-subtle">
            <span className="font-mono bg-surface-highlight px-2 py-1 rounded">
              {node.config.method}
            </span>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-4 h-4 bg-border-focus border-2 border-surface"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-4 h-4 bg-border-focus border-2 border-surface"
      />

      {/* Execution Status Overlay */}
      {status === 'completed' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xl">✓</span>
          </div>
        </div>
      )}
      {status === 'failed' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-xl">✗</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 6. State Management (Jotai)

Located in `src-tauri/yaak-models/guest-js/atoms.ts`:

```typescript
import { atom } from 'jotai';
import type { WorkflowNode, WorkflowEdge, WorkflowViewport } from './bindings';

// Canvas data atoms
export const canvasNodesAtom = atom<WorkflowNode[]>((get) => {
  const data = get(storeDataAtom);
  return data.workflow_nodes?.filter(n => !n.deleted_at) || [];
});

export const canvasEdgesAtom = atom<WorkflowEdge[]>((get) => {
  const data = get(storeDataAtom);
  return data.workflow_edges?.filter(e => !e.deleted_at) || [];
});

export const canvasViewportAtom = atom<Record<string, WorkflowViewport>>((get) => {
  const data = get(storeDataAtom);
  const viewports = data.workflow_viewport || [];
  return Object.fromEntries(viewports.map(v => [v.workflow_id, v]));
});

// UI state atoms
export const selectedNodeIdAtom = atom<string | null>(null);
export const selectedEdgeIdAtom = atom<string | null>(null);
export const isExecutingAtom = atom<boolean>(false);
export const executionProgressAtom = atom<Map<string, NodeExecutionStatus>>(new Map());

// Undo/Redo state
export interface CanvasAction {
  type: string;
  payload: any;
  timestamp: number;
}

export const undoStackAtom = atom<CanvasAction[]>([]);
export const redoStackAtom = atom<CanvasAction[]>([]);

// Derived atoms
export const selectedNodeAtom = atom((get) => {
  const id = get(selectedNodeIdAtom);
  const nodes = get(canvasNodesAtom);
  return id ? nodes.find(n => n.id === id) : null;
});

export const selectedEdgeAtom = atom((get) => {
  const id = get(selectedEdgeIdAtom);
  const edges = get(canvasEdgesAtom);
  return id ? edges.find(e => e.id === id) : null;
});

// Viewport for specific workflow
export const workflowViewportAtom = (workflowId: string) => atom((get) => {
  const viewports = get(canvasViewportAtom);
  return viewports[workflowId] || {
    pan_x: 0,
    pan_y: 0,
    zoom: 1,
  };
});

// Node execution status map
export interface NodeExecutionStatus {
  state: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  elapsed?: number;
  error?: string;
}

export const nodeExecutionStatusAtom = atom<Map<string, NodeExecutionStatus>>((get) => {
  const progress = get(executionProgressAtom);
  return progress;
});
```

## 7. Undo/Redo System

Located in `src-web/hooks/useUndoRedo.ts`:

```typescript
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { undoStackAtom, redoStackAtom, CanvasAction } from '../atoms';
import { patchModel, deleteModel, createWorkspaceModel } from '@yaakapp-internal/models';

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useAtom(undoStackAtom);
  const [redoStack, setRedoStack] = useAtom(redoStackAtom);

  const pushAction = useCallback((action: CanvasAction) => {
    setUndoStack(prev => [...prev, action].slice(-50)); // Keep last 50
    setRedoStack([]); // Clear redo stack on new action
  }, [setUndoStack, setRedoStack]);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];

    // Revert action
    switch (action.type) {
      case 'ADD_NODE':
        await deleteModel(action.payload.node.id);
        break;
      case 'DELETE_NODE':
        await createWorkspaceModel(action.payload.node);
        break;
      case 'MOVE_NODE':
        await patchModel(action.payload.nodeId, {
          position_x: action.payload.oldPos.x,
          position_y: action.payload.oldPos.y,
        });
        break;
      case 'ADD_EDGE':
        await deleteModel(action.payload.edge.id);
        break;
      case 'DELETE_EDGE':
        await createWorkspaceModel(action.payload.edge);
        break;
      case 'UPDATE_NODE_CONFIG':
        await patchModel(action.payload.nodeId, {
          config: action.payload.oldConfig,
        });
        break;
    }

    // Move action to redo stack
    setRedoStack(prev => [...prev, action]);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, setUndoStack, setRedoStack]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];

    // Reapply action
    switch (action.type) {
      case 'ADD_NODE':
        await createWorkspaceModel(action.payload.node);
        break;
      case 'DELETE_NODE':
        await deleteModel(action.payload.node.id);
        break;
      case 'MOVE_NODE':
        await patchModel(action.payload.nodeId, {
          position_x: action.payload.newPos.x,
          position_y: action.payload.newPos.y,
        });
        break;
      case 'ADD_EDGE':
        await createWorkspaceModel(action.payload.edge);
        break;
      case 'DELETE_EDGE':
        await deleteModel(action.payload.edge.id);
        break;
      case 'UPDATE_NODE_CONFIG':
        await patchModel(action.payload.nodeId, {
          config: action.payload.newConfig,
        });
        break;
    }

    // Move action back to undo stack
    setUndoStack(prev => [...prev, action]);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, setUndoStack, setRedoStack]);

  return {
    undo,
    redo,
    pushAction,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
```

## 8. Template System Extensions

### 8.1 New Template Syntax

Located in `src-tauri/yaak-templates/src/renderer.rs`:

```rust
// Existing: {{workflow.step[N].response.body.field}}
// New:
// - {{step[N].loopResults[i].body.field}}   // Loop results
// - {{step[N].parallelResults[i].status}}   // Parallel results
// - {{loop.index}}                           // Inside loop
// - {{loop.item.id}}                         // Iterating over objects
// - {{conditional.branch}}                   // Which branch was taken

pub fn resolve_workflow_variable(
    var_path: &str,
    context: &ExecutionContext,
) -> Result<String> {
    // Parse variable path
    let parts: Vec<&str> = var_path.split('.').collect();

    match parts.get(0) {
        Some(&"step") => {
            // Extract step index: step[N]
            let index_regex = Regex::new(r"step\[(\d+)\]")?;
            let caps = index_regex.captures(var_path).ok_or("Invalid step reference")?;
            let index: usize = caps.get(1).unwrap().as_str().parse()?;

            // Get node result
            let result = context.node_results.get(&format!("node_{}", index))
                .ok_or("Step not executed yet")?;

            // Navigate nested path
            let remaining_path = &parts[1..];
            resolve_nested_json(&result.output, remaining_path)
        },
        Some(&"loop") => {
            let loop_ctx = context.loop_stack.last().ok_or("Not in loop context")?;

            match parts.get(1) {
                Some(&"index") => Ok(loop_ctx.index.to_string()),
                Some(&"total") => Ok(loop_ctx.total.to_string()),
                Some(&"first") => Ok((loop_ctx.index == 0).to_string()),
                Some(&"last") => Ok((loop_ctx.index == loop_ctx.total - 1).to_string()),
                Some(&"item") => {
                    let item = loop_ctx.item.as_ref().ok_or("No loop item")?;
                    let remaining_path = &parts[2..];
                    resolve_nested_json(item, remaining_path)
                },
                _ => Err("Unknown loop variable".into()),
            }
        },
        Some(&"conditional") => {
            // Return which branch was taken
            // (Stored in context after conditional execution)
            let branch = context.variables.get("conditional.branch")
                .ok_or("Not in conditional context")?;
            Ok(branch.as_str().unwrap_or("").to_string())
        },
        _ => Err("Unknown variable prefix".into()),
    }
}

fn resolve_nested_json(
    value: &serde_json::Value,
    path: &[&str],
) -> Result<String> {
    if path.is_empty() {
        return Ok(value.to_string());
    }

    let key = path[0];
    let next_value = match value {
        serde_json::Value::Object(map) => map.get(key).ok_or("Key not found")?,
        serde_json::Value::Array(arr) => {
            let index: usize = key.parse().map_err(|_| "Invalid array index")?;
            arr.get(index).ok_or("Index out of bounds")?
        },
        _ => return Err("Cannot navigate non-object/array".into()),
    };

    resolve_nested_json(next_value, &path[1..])
}
```

### 8.2 Template Functions

```rust
// Add new template functions
pub fn get_template_functions() -> Vec<TemplateFunction> {
    vec![
        // Existing functions...

        // New comparison functions
        TemplateFunction {
            name: "equals".to_string(),
            description: "Compare two values for equality".to_string(),
            signature: "equals(a, b)".to_string(),
            handler: Box::new(|args| {
                if args.len() != 2 {
                    return Err("equals() requires 2 arguments".into());
                }
                Ok((args[0] == args[1]).to_string())
            }),
        },
        TemplateFunction {
            name: "contains".to_string(),
            description: "Check if array contains value".to_string(),
            signature: "contains(array, value)".to_string(),
            handler: Box::new(|args| {
                if args.len() != 2 {
                    return Err("contains() requires 2 arguments".into());
                }
                let arr: Vec<serde_json::Value> = serde_json::from_str(&args[0])?;
                let val: serde_json::Value = serde_json::from_str(&args[1])?;
                Ok(arr.contains(&val).to_string())
            }),
        },
        TemplateFunction {
            name: "length".to_string(),
            description: "Get length of array or string".to_string(),
            signature: "length(value)".to_string(),
            handler: Box::new(|args| {
                if args.len() != 1 {
                    return Err("length() requires 1 argument".into());
                }

                // Try as array first
                if let Ok(arr) = serde_json::from_str::<Vec<serde_json::Value>>(&args[0]) {
                    return Ok(arr.len().to_string());
                }

                // Otherwise treat as string
                Ok(args[0].len().to_string())
            }),
        },
        TemplateFunction {
            name: "jsonPath".to_string(),
            description: "Extract value using JSONPath".to_string(),
            signature: "jsonPath(json, path)".to_string(),
            handler: Box::new(|args| {
                if args.len() != 2 {
                    return Err("jsonPath() requires 2 arguments".into());
                }

                let json: serde_json::Value = serde_json::from_str(&args[0])?;
                let path = &args[1];

                // Use jsonpath crate
                let result = jsonpath::select(&json, path)?;
                Ok(serde_json::to_string(&result)?)
            }),
        },
        TemplateFunction {
            name: "regex".to_string(),
            description: "Test string against regex pattern".to_string(),
            signature: "regex(string, pattern)".to_string(),
            handler: Box::new(|args| {
                if args.len() != 2 {
                    return Err("regex() requires 2 arguments".into());
                }

                let string = &args[0];
                let pattern = &args[1];
                let re = Regex::new(pattern)?;
                Ok(re.is_match(string).to_string())
            }),
        },
    ]
}
```

## 9. Tauri Commands

Located in `src-tauri/src/commands.rs`:

```rust
// Node CRUD
#[tauri::command]
async fn cmd_create_workflow_node(
    app: AppHandle,
    workflow_id: String,
    node_type: String,
    node_subtype: String,
    position_x: f64,
    position_y: f64,
) -> Result<WorkflowNode, String> {
    let db = app.db();

    // Get node type definition
    let node_def = get_node_type_definitions()
        .into_iter()
        .find(|d| d.subtype == node_subtype)
        .ok_or("Unknown node subtype")?;

    // Create node with default config
    let node = WorkflowNode {
        id: uuid(),
        model: "workflow_node".to_string(),
        created_at: now(),
        updated_at: now(),
        deleted_at: None,
        workflow_id,
        node_type: node_def.category,
        node_subtype: node_subtype.clone(),
        position_x,
        position_y,
        width: 250.0,
        height: 150.0,
        name: node_def.name.clone(),
        description: None,
        config: node_def.default_config,
        enabled: true,
        legacy_step_id: None,
    };

    db.upsert_workflow_node(&node)?;

    // Emit event
    app.emit_all("upserted_model", ModelPayload {
        change: ModelChangeEvent::Upsert,
        payload: AnyModel::WorkflowNode(node.clone()),
    })?;

    Ok(node)
}

#[tauri::command]
async fn cmd_update_workflow_node(
    app: AppHandle,
    node_id: String,
    updates: serde_json::Value,
) -> Result<WorkflowNode, String> {
    let db = app.db();

    let mut node = db.get_workflow_node(&node_id)?;

    // Apply updates
    if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
        node.name = name.to_string();
    }
    if let Some(config) = updates.get("config") {
        node.config = config.clone();
    }
    if let Some(position_x) = updates.get("position_x").and_then(|v| v.as_f64()) {
        node.position_x = position_x;
    }
    if let Some(position_y) = updates.get("position_y").and_then(|v| v.as_f64()) {
        node.position_y = position_y;
    }
    if let Some(enabled) = updates.get("enabled").and_then(|v| v.as_bool()) {
        node.enabled = enabled;
    }

    node.updated_at = now();

    db.upsert_workflow_node(&node)?;

    app.emit_all("upserted_model", ModelPayload {
        change: ModelChangeEvent::Upsert,
        payload: AnyModel::WorkflowNode(node.clone()),
    })?;

    Ok(node)
}

#[tauri::command]
async fn cmd_delete_workflow_node(
    app: AppHandle,
    node_id: String,
) -> Result<(), String> {
    let db = app.db();

    db.delete_workflow_node(&node_id)?;

    app.emit_all("deleted_model", ModelPayload {
        change: ModelChangeEvent::Delete,
        payload: AnyModel::WorkflowNode(/* ... */),
    })?;

    Ok(())
}

// Edge CRUD
#[tauri::command]
async fn cmd_create_workflow_edge(
    app: AppHandle,
    workflow_id: String,
    source_node_id: String,
    target_node_id: String,
    source_anchor: String,
    target_anchor: String,
    edge_type: String,
) -> Result<WorkflowEdge, String> {
    let db = app.db();

    let edge = WorkflowEdge {
        id: uuid(),
        model: "workflow_edge".to_string(),
        created_at: now(),
        updated_at: now(),
        deleted_at: None,
        workflow_id,
        source_node_id,
        target_node_id,
        source_anchor,
        target_anchor,
        edge_type: edge_type.parse()?,
    };

    db.upsert_workflow_edge(&edge)?;

    app.emit_all("upserted_model", ModelPayload {
        change: ModelChangeEvent::Upsert,
        payload: AnyModel::WorkflowEdge(edge.clone()),
    })?;

    Ok(edge)
}

// Canvas
#[tauri::command]
async fn cmd_get_workflow_canvas(
    app: AppHandle,
    workflow_id: String,
) -> Result<WorkflowCanvasResponse, String> {
    let db = app.db();

    let nodes = db.get_workflow_nodes(&workflow_id)?;
    let edges = db.get_workflow_edges(&workflow_id)?;
    let viewport = db.get_workflow_viewport(&workflow_id).ok();

    Ok(WorkflowCanvasResponse {
        nodes,
        edges,
        viewport,
    })
}

#[tauri::command]
async fn cmd_update_viewport(
    app: AppHandle,
    workflow_id: String,
    pan_x: f64,
    pan_y: f64,
    zoom: f64,
) -> Result<(), String> {
    let db = app.db();

    let viewport = WorkflowViewport {
        id: uuid(),
        model: "workflow_viewport".to_string(),
        created_at: now(),
        updated_at: now(),
        workflow_id,
        pan_x,
        pan_y,
        zoom,
    };

    db.upsert_workflow_viewport(&viewport)?;

    Ok(())
}

// Validation
#[tauri::command]
async fn cmd_validate_workflow_graph(
    app: AppHandle,
    workflow_id: String,
) -> Result<ValidationResult, String> {
    let db = app.db();

    let nodes = db.get_workflow_nodes(&workflow_id)?;
    let edges = db.get_workflow_edges(&workflow_id)?;

    match GraphBuilder::validate_graph(&nodes, &edges) {
        Ok(()) => Ok(ValidationResult {
            valid: true,
            errors: vec![],
        }),
        Err(e) => Ok(ValidationResult {
            valid: false,
            errors: vec![e.to_string()],
        }),
    }
}

// Execution
#[tauri::command]
async fn cmd_execute_workflow_canvas(
    app: AppHandle,
    workflow_id: String,
    environment_id: Option<String>,
) -> Result<String, String> {
    let orchestrator = WorkflowOrchestrator::new(app);
    let execution_id = orchestrator.execute(workflow_id, environment_id).await?;
    Ok(execution_id)
}

// Export/Import
#[tauri::command]
async fn cmd_export_workflow_json(
    app: AppHandle,
    workflow_id: String,
) -> Result<String, String> {
    let db = app.db();

    let workflow = db.get_workflow(&workflow_id)?;
    let nodes = db.get_workflow_nodes(&workflow_id)?;
    let edges = db.get_workflow_edges(&workflow_id)?;

    let export_data = json!({
        "version": "1.0",
        "workflow": workflow,
        "nodes": nodes,
        "edges": edges,
    });

    Ok(serde_json::to_string_pretty(&export_data)?)
}

#[tauri::command]
async fn cmd_import_workflow_json(
    app: AppHandle,
    workspace_id: String,
    json: String,
) -> Result<Workflow, String> {
    let db = app.db();

    let import_data: serde_json::Value = serde_json::from_str(&json)?;

    // Validate version
    let version = import_data["version"].as_str().ok_or("Missing version")?;
    if version != "1.0" {
        return Err("Unsupported version".to_string());
    }

    // Import workflow
    let mut workflow: Workflow = serde_json::from_value(import_data["workflow"].clone())?;
    workflow.id = uuid();  // New ID
    workflow.workspace_id = workspace_id;
    workflow.created_at = now();
    workflow.updated_at = now();

    db.upsert_workflow(&workflow)?;

    // Import nodes (with new IDs)
    let nodes: Vec<WorkflowNode> = serde_json::from_value(import_data["nodes"].clone())?;
    let mut id_mapping = HashMap::new();

    for mut node in nodes {
        let old_id = node.id.clone();
        node.id = uuid();
        node.workflow_id = workflow.id.clone();
        node.created_at = now();
        node.updated_at = now();

        id_mapping.insert(old_id, node.id.clone());
        db.upsert_workflow_node(&node)?;
    }

    // Import edges (update node IDs)
    let edges: Vec<WorkflowEdge> = serde_json::from_value(import_data["edges"].clone())?;
    for mut edge in edges {
        edge.id = uuid();
        edge.workflow_id = workflow.id.clone();
        edge.source_node_id = id_mapping.get(&edge.source_node_id).unwrap().clone();
        edge.target_node_id = id_mapping.get(&edge.target_node_id).unwrap().clone();
        edge.created_at = now();
        edge.updated_at = now();

        db.upsert_workflow_edge(&edge)?;
    }

    Ok(workflow)
}
```

## 10. Migration from Old Workflow Steps

Located in `src-tauri/yaak-models/migrations/20250115000000_workflow_canvas.sql`:

```sql
-- Migration: Add visual workflow canvas support

-- 1. Create new tables
CREATE TABLE workflow_nodes (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_node',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workflow_id TEXT NOT NULL,
    node_type TEXT NOT NULL,
    node_subtype TEXT NOT NULL,
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0,
    width REAL NOT NULL DEFAULT 250,
    height REAL NOT NULL DEFAULT 150,
    name TEXT NOT NULL,
    description TEXT,
    config TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    legacy_step_id TEXT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TABLE workflow_edges (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_edge',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workflow_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    source_anchor TEXT NOT NULL DEFAULT 'output',
    target_anchor TEXT NOT NULL DEFAULT 'input',
    edge_type TEXT NOT NULL DEFAULT 'sequential',
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

CREATE TABLE workflow_viewport (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_viewport',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    workflow_id TEXT NOT NULL UNIQUE,
    pan_x REAL NOT NULL DEFAULT 0,
    pan_y REAL NOT NULL DEFAULT 0,
    zoom REAL NOT NULL DEFAULT 1.0,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TABLE workflow_node_executions (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_node_execution',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workflow_execution_id TEXT NOT NULL,
    workflow_node_id TEXT NOT NULL,
    elapsed INTEGER,
    state TEXT NOT NULL,
    error TEXT,
    result TEXT,
    loop_iteration INTEGER,
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

-- 2. Add indexes
CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_nodes_deleted_at ON workflow_nodes(deleted_at);
CREATE INDEX idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX idx_workflow_edges_source_node_id ON workflow_edges(source_node_id);
CREATE INDEX idx_workflow_edges_target_node_id ON workflow_edges(target_node_id);
CREATE INDEX idx_workflow_edges_deleted_at ON workflow_edges(deleted_at);
CREATE UNIQUE INDEX idx_workflow_edges_target_unique
  ON workflow_edges(target_node_id, target_anchor)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_workflow_viewport_workflow_id ON workflow_viewport(workflow_id);
CREATE INDEX idx_workflow_node_executions_execution_id ON workflow_node_executions(workflow_execution_id);
CREATE INDEX idx_workflow_node_executions_node_id ON workflow_node_executions(workflow_node_id);
CREATE INDEX idx_workflow_node_executions_deleted_at ON workflow_node_executions(deleted_at);

-- 3. Add canvas_enabled flag to workflows
ALTER TABLE workflows ADD COLUMN canvas_enabled INTEGER NOT NULL DEFAULT 0;
```

Migration script (Rust):

```rust
// Located in src-tauri/src/commands.rs

#[tauri::command]
async fn cmd_migrate_workflow_to_canvas(
    app: AppHandle,
    workflow_id: String,
) -> Result<(), String> {
    let db = app.db();

    // 1. Get existing workflow and steps
    let workflow = db.get_workflow(&workflow_id)?;
    let steps = db.get_workflow_steps(&workflow_id)?;

    if steps.is_empty() {
        return Err("No steps to migrate".to_string());
    }

    // 2. Create manual trigger as start node
    let trigger_node = WorkflowNode {
        id: uuid(),
        model: "workflow_node".to_string(),
        created_at: now(),
        updated_at: now(),
        deleted_at: None,
        workflow_id: workflow_id.clone(),
        node_type: NodeType::Trigger,
        node_subtype: "manual_trigger".to_string(),
        position_x: 100.0,
        position_y: 300.0,
        width: 200.0,
        height: 150.0,
        name: "Start".to_string(),
        description: None,
        config: json!({}),
        enabled: true,
        legacy_step_id: None,
    };
    db.upsert_workflow_node(&trigger_node)?;

    // 3. Convert each step to a node
    let mut prev_node_id = trigger_node.id.clone();
    let x_spacing = 400.0;

    for (index, step) in steps.iter().enumerate() {
        let node_subtype = match step.request_model.as_str() {
            "http_request" => "http_request",
            "grpc_request" => "grpc_request",
            _ => "http_request",  // Default
        };

        let node = WorkflowNode {
            id: uuid(),
            model: "workflow_node".to_string(),
            created_at: now(),
            updated_at: now(),
            deleted_at: None,
            workflow_id: workflow_id.clone(),
            node_type: NodeType::Action,
            node_subtype: node_subtype.to_string(),
            position_x: 100.0 + (index as f64 + 1.0) * x_spacing,
            position_y: 300.0,
            width: 250.0,
            height: 150.0,
            name: step.name.clone(),
            description: None,
            config: json!({
                // Load config from referenced request
                "request_id": step.request_id,
            }),
            enabled: step.enabled,
            legacy_step_id: Some(step.id.clone()),
        };
        db.upsert_workflow_node(&node)?;

        // 4. Create edge from previous node
        let edge = WorkflowEdge {
            id: uuid(),
            model: "workflow_edge".to_string(),
            created_at: now(),
            updated_at: now(),
            deleted_at: None,
            workflow_id: workflow_id.clone(),
            source_node_id: prev_node_id.clone(),
            target_node_id: node.id.clone(),
            source_anchor: "output".to_string(),
            target_anchor: "input".to_string(),
            edge_type: EdgeType::Sequential,
        };
        db.upsert_workflow_edge(&edge)?;

        prev_node_id = node.id.clone();
    }

    // 5. Enable canvas mode for workflow
    db.update_workflow(&workflow_id, json!({ "canvas_enabled": true }))?;

    Ok(())
}
```

## 11. Visual Design Specification

(Continuing in next response due to length...)
