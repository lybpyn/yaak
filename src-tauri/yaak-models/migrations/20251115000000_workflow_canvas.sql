-- Visual Workflow Canvas Feature
-- Adds tables for graph-based workflow visualization and execution
-- Extends existing workflows table with canvas_enabled flag

-- 1. workflow_nodes table: Nodes on the visual canvas
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

-- 2. workflow_edges table: Connections between nodes
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

-- 3. workflow_viewport table: Stores canvas pan/zoom state
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

-- 4. workflow_node_executions table: Execution results for canvas nodes
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

-- 5. Add canvas_enabled column to existing workflows table
ALTER TABLE workflows ADD COLUMN canvas_enabled INTEGER NOT NULL DEFAULT 0;

-- Migration note: Existing workflows default to old step-based UI (0)
-- New workflows can use canvas UI (1)
