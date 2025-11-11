-- Test Workflows Feature
-- Creates tables for workflow management, execution tracking, and step results

-- 1. workflows table: Container for test sequences
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    environment_id TEXT,  -- soft reference to environments
    sort_priority REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflows_workspace_id ON workflows(workspace_id);
CREATE INDEX idx_workflows_deleted_at ON workflows(deleted_at);

-- 2. workflow_steps table: Individual requests in execution order
CREATE TABLE workflow_steps (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_step',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workflow_id TEXT NOT NULL,
    request_id TEXT NOT NULL,  -- soft reference to http_requests or grpc_requests
    request_model TEXT NOT NULL,  -- 'http_request' or 'grpc_request'
    name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,  -- 1 = true, 0 = false
    sort_priority REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_request_id ON workflow_steps(request_id);
CREATE INDEX idx_workflow_steps_deleted_at ON workflow_steps(deleted_at);

-- 3. workflow_executions table: Results of workflow runs
CREATE TABLE workflow_executions (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_execution',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workflow_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    environment_id TEXT,  -- soft reference
    elapsed INTEGER,  -- total execution time in ms
    state TEXT NOT NULL,  -- 'initialized', 'running', 'completed', 'failed', 'cancelled'
    error TEXT,  -- error message if state is 'failed'
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_workspace_id ON workflow_executions(workspace_id);
CREATE INDEX idx_workflow_executions_created_at_desc ON workflow_executions(created_at DESC);
CREATE INDEX idx_workflow_executions_deleted_at ON workflow_executions(deleted_at);

-- 4. workflow_step_executions table: Results of individual step execution
CREATE TABLE workflow_step_executions (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_step_execution',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workflow_execution_id TEXT NOT NULL,
    workflow_step_id TEXT NOT NULL,
    request_id TEXT NOT NULL,  -- snapshot of request at execution time
    response_id TEXT,  -- soft reference to http_responses or grpc_connections
    response_model TEXT,  -- 'http_response' or 'grpc_connection'
    elapsed INTEGER,  -- step execution time in ms
    state TEXT NOT NULL,  -- 'pending', 'running', 'completed', 'failed', 'skipped'
    error TEXT,  -- error message if state is 'failed'
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_step_executions_execution_id ON workflow_step_executions(workflow_execution_id);
CREATE INDEX idx_workflow_step_executions_step_id ON workflow_step_executions(workflow_step_id);
CREATE INDEX idx_workflow_step_executions_deleted_at ON workflow_step_executions(deleted_at);
