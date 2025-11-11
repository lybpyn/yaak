# Test Workflows - Technical Design

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  WorkflowList → WorkflowEditor → WorkflowStepList (DnD)    │
│  ExecuteButton → ExecutionViewer → ExecutionResults        │
└──────────────────┬──────────────────────────────────────────┘
                   │ Tauri IPC Commands
┌──────────────────▼──────────────────────────────────────────┐
│                 RUST BACKEND                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Workflow Execution Engine                            │  │
│  │  - Sequential execution                               │  │
│  │  - Template rendering with WorkflowContext           │  │
│  │  - State management & persistence                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Query Layer (workflows, steps, executions)          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Models (Workflow, WorkflowStep, etc.)               │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              SQLite Database                                 │
│  workflows, workflow_steps,                                 │
│  workflow_executions, workflow_step_executions             │
└─────────────────────────────────────────────────────────────┘
```

## 2. Database Schema

### 2.1 workflows
```sql
CREATE TABLE workflows (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    environment_id TEXT,  -- soft reference
    sort_priority REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_workflows_workspace_id ON workflows(workspace_id);
CREATE INDEX idx_workflows_deleted_at ON workflows(deleted_at);
```

### 2.2 workflow_steps
```sql
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
    enabled INTEGER NOT NULL DEFAULT 1,
    sort_priority REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_request_id ON workflow_steps(request_id);
CREATE INDEX idx_workflow_steps_deleted_at ON workflow_steps(deleted_at);
```

### 2.3 workflow_executions
```sql
CREATE TABLE workflow_executions (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT 'workflow_execution',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    workflow_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    environment_id TEXT,  -- soft reference
    elapsed INTEGER,
    state TEXT NOT NULL,  -- 'initialized', 'running', 'completed', 'failed', 'cancelled'
    error TEXT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_workspace_id ON workflow_executions(workspace_id);
CREATE INDEX idx_workflow_executions_created_at_desc ON workflow_executions(created_at DESC);
CREATE INDEX idx_workflow_executions_deleted_at ON workflow_executions(deleted_at);
```

### 2.4 workflow_step_executions
```sql
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
    elapsed INTEGER,
    state TEXT NOT NULL,  -- 'pending', 'running', 'completed', 'failed', 'skipped'
    error TEXT,
    FOREIGN KEY (workflow_execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_step_id) REFERENCES workflow_steps(id) ON DELETE CASCADE
);
CREATE INDEX idx_workflow_step_executions_execution_id ON workflow_step_executions(workflow_execution_id);
CREATE INDEX idx_workflow_step_executions_step_id ON workflow_step_executions(workflow_step_id);
CREATE INDEX idx_workflow_step_executions_deleted_at ON workflow_step_executions(deleted_at);
```

## 3. Rust Models

Located in `src-tauri/yaak-models/src/models.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Workflow {
    pub id: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub workspace_id: String,
    pub name: String,
    pub description: Option<String>,
    pub environment_id: Option<String>,
    pub sort_priority: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkflowStep {
    pub id: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub workflow_id: String,
    pub request_id: String,
    pub request_model: String,  // "http_request" | "grpc_request"
    pub name: String,
    pub enabled: bool,
    pub sort_priority: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkflowExecution {
    pub id: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub workflow_id: String,
    pub workspace_id: String,
    pub environment_id: Option<String>,
    pub elapsed: Option<i32>,
    pub state: WorkflowExecutionState,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, rename_all = "lowercase")]
pub enum WorkflowExecutionState {
    Initialized,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkflowStepExecution {
    pub id: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
    pub workflow_execution_id: String,
    pub workflow_step_id: String,
    pub request_id: String,
    pub response_id: Option<String>,
    pub response_model: Option<String>,  // "http_response" | "grpc_connection"
    pub elapsed: Option<i32>,
    pub state: WorkflowStepExecutionState,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, rename_all = "lowercase")]
pub enum WorkflowStepExecutionState {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
}
```

## 4. Template System Extension

### 4.1 WorkflowContext Structure

Located in `src-tauri/yaak-templates/src/renderer.rs`:

```rust
pub struct WorkflowContext {
    step_responses: Vec<StepResponse>,
}

pub struct StepResponse {
    pub response_body: serde_json::Value,
    pub response_headers: HashMap<String, String>,
    pub response_status: i32,
    pub response_elapsed: i32,
    pub response_url: String,
}
```

### 4.2 Template Variable Resolution

Syntax: `{{workflow.step[N].response.body.field}}`

Examples:
- `{{workflow.step[0].response.body.token}}`
- `{{workflow.step[0].response.headers.Authorization}}`
- `{{workflow.step[0].response.status}}`
- `{{workflow.step[0].response.elapsed}}`
- `{{workflow.step[1].response.body.user.email}}`

Implementation:
1. Parser recognizes `workflow.step[N].*` pattern using regex
2. Extract step index N
3. Validate N < current step (no forward references)
4. Get StepResponse from WorkflowContext[N]
5. Resolve nested field using dot notation
6. Return string value

## 5. Execution Engine

Located in `src-tauri/src/workflow_execution.rs`:

### 5.1 Execution Flow

```rust
pub struct WorkflowExecutor<R: Runtime> {
    app_handle: AppHandle<R>,
    cancellation_tokens: Arc<RwLock<HashMap<String, bool>>>,
}

impl<R: Runtime> WorkflowExecutor<R> {
    // Entry point: non-blocking execution
    pub async fn execute(
        &self,
        workflow_id: String,
        environment_id: Option<String>,
    ) -> Result<String> {
        // 1. Create WorkflowExecution record (state: initialized)
        // 2. Load and validate workflow steps
        // 3. Resolve environment
        // 4. Spawn async task for run_workflow()
        // 5. Return execution_id immediately
    }

    // Sequential execution loop
    async fn run_workflow(
        &self,
        execution_id: String,
    ) -> Result<()> {
        // 1. Update state to "running"
        // 2. Initialize empty WorkflowContext
        // 3. For each enabled step:
        //    a. Check cancellation
        //    b. Execute step with workflow context
        //    c. Add response to workflow context
        //    d. Emit progress event
        // 4. Update state to "completed" or "failed"
    }

    // Execute single step
    async fn execute_step(
        &self,
        step: &WorkflowStep,
        workflow_context: &WorkflowContext,
    ) -> Result<StepResponse> {
        // 1. Load request (HTTP or gRPC)
        // 2. Render request templates with workflow_context
        // 3. Execute request (reuse existing send_http_request)
        // 4. Store response in database
        // 5. Return StepResponse
    }
}
```

### 5.2 Cancellation Support

```rust
// Store cancellation token
cancellation_tokens.insert(execution_id.clone(), false);

// Check before each step
if self.is_cancelled(&execution_id) {
    self.update_execution_state(&execution_id, "cancelled")?;
    return Ok(());
}

// Cancel from command
pub async fn cancel(&self, execution_id: String) {
    self.cancellation_tokens.write().insert(execution_id, true);
}
```

## 6. Tauri Commands

Located in `src-tauri/src/commands.rs` and `src-tauri/src/lib.rs`:

```rust
#[tauri::command]
async fn cmd_execute_workflow(
    app: AppHandle,
    workflow_id: String,
    environment_id: Option<String>,
) -> Result<ExecuteWorkflowResponse, String> {
    let executor = WorkflowExecutor::new(app);
    let execution_id = executor.execute(workflow_id, environment_id).await?;
    Ok(ExecuteWorkflowResponse { execution_id })
}

#[tauri::command]
async fn cmd_cancel_workflow_execution(
    app: AppHandle,
    execution_id: String,
) -> Result<(), String> {
    let executor = WorkflowExecutor::new(app);
    executor.cancel(execution_id).await;
    Ok(())
}

#[tauri::command]
async fn cmd_get_workflow_with_steps(
    app: AppHandle,
    workflow_id: String,
) -> Result<GetWorkflowWithStepsResponse, String> {
    // Returns workflow, steps, and broken_step_ids
}

#[tauri::command]
async fn cmd_get_workflow_execution_results(
    app: AppHandle,
    execution_id: String,
) -> Result<GetWorkflowExecutionResultsResponse, String> {
    // Returns execution with all step_executions
}

#[tauri::command]
async fn cmd_list_workflow_executions(
    app: AppHandle,
    workflow_id: String,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<ListWorkflowExecutionsResponse, String> {
    // Returns paginated list of executions
}
```

## 7. Frontend Architecture

### 7.1 State Management (Jotai)

Located in `src-tauri/yaak-models/guest-js/atoms.ts`:

```typescript
export const workflowsAtom = atom<Workflow[]>((get) => {
  const data = get(storeDataAtom);
  return data.workflows
    .filter((w) => !w.deleted_at)
    .sort((a, b) => a.sort_priority - b.sort_priority);
});

export const workflowStepsAtom = atom<WorkflowStep[]>((get) => {
  const data = get(storeDataAtom);
  return data.workflow_steps
    .filter((s) => !s.deleted_at)
    .sort((a, b) => a.sort_priority - b.sort_priority);
});

export const workflowExecutionsAtom = atom<WorkflowExecution[]>((get) => {
  const data = get(storeDataAtom);
  return data.workflow_executions
    .filter((e) => !e.deleted_at)
    .sort((a, b) => b.created_at - a.created_at);  // DESC
});
```

### 7.2 React Hooks

Located in `src-web/hooks/`:

```typescript
// useWorkflows.ts
export function useWorkflows(workspaceId: string) {
  const workflows = useAtomValue(workflowsAtom);
  const filtered = workflows.filter(w => w.workspace_id === workspaceId);

  const createWorkflow = useFastMutation(async (data) => {
    await invokeCmd('upsert', { model: { ...data, model: 'workflow' }});
  });

  const deleteWorkflow = useFastMutation(async (id) => {
    await invokeCmd('delete', { model: 'workflow', id });
  });

  return { workflows: filtered, createWorkflow, deleteWorkflow };
}

// useWorkflowSteps.ts
export function useWorkflowSteps(workflowId: string) {
  const steps = useAtomValue(workflowStepsAtom);
  const filtered = steps.filter(s => s.workflow_id === workflowId);

  const addStep = useFastMutation(async (requestId, requestModel) => {
    await invokeCmd('upsert', { model: {
      ...newStep,
      workflow_id: workflowId,
      request_id: requestId,
      request_model: requestModel,
    }});
  });

  return { steps: filtered, addStep };
}

// useWorkflowExecution.ts
export function useWorkflowExecution() {
  const execute = useMutation(async ({ workflowId, environmentId }) => {
    return await invokeCmd('cmd_execute_workflow', { workflowId, environmentId });
  });

  const cancel = useMutation(async (executionId) => {
    await invokeCmd('cmd_cancel_workflow_execution', { executionId });
  });

  return { execute, cancel };
}
```

### 7.3 Components

Located in `src-web/components/Workflows/`:

- **WorkflowList.tsx**: Grid/list view of all workflows
- **WorkflowDetail.tsx**: Workflow editor with name, description, default environment
- **WorkflowStepList.tsx**: Drag-drop sortable list using @dnd-kit
- **WorkflowStepItem.tsx**: Individual step with enable toggle, delete button
- **AddStepDropzone.tsx**: Drop target for adding requests
- **ExecuteWorkflowButton.tsx**: Button with environment selector dropdown
- **WorkflowExecutionViewer.tsx**: Real-time progress during execution
- **WorkflowExecutionResults.tsx**: Detailed results after completion
- **WorkflowExecutionHistory.tsx**: List of past executions
- **BrokenStepDialog.tsx**: Handle deleted request references

### 7.4 Routes

Located in `src-web/routes/workspaces/$workspaceId/workflows/`:

```typescript
// index.tsx - List view
export const Route = createFileRoute('/workspaces/$workspaceId/workflows/')({
  component: WorkflowListPage,
});

// $workflowId.tsx - Editor view
export const Route = createFileRoute('/workspaces/$workspaceId/workflows/$workflowId')({
  component: WorkflowEditorPage,
});

// $workflowId/executions/$executionId.tsx - Results view
export const Route = createFileRoute('/workspaces/$workspaceId/workflows/$workflowId/executions/$executionId')({
  component: WorkflowExecutionResultsPage,
});
```

## 8. Real-time Updates

### 8.1 Tauri Events

```rust
// Emit from Rust
app_handle.emit_all("workflow_execution_updated", ExecutionUpdatePayload {
    execution_id: execution.id.clone(),
    state: execution.state.clone(),
    elapsed: execution.elapsed,
})?;

app_handle.emit_all("workflow_step_completed", StepCompletedPayload {
    execution_id: execution_id.clone(),
    step_id: step.id.clone(),
    state: step_execution.state.clone(),
})?;
```

### 8.2 Frontend Listeners

```typescript
// In WorkflowExecutionViewer.tsx
useListenToTauriEvent('workflow_execution_updated', (event) => {
  // Update execution state in UI
  queryClient.invalidateQueries(['workflow_execution', event.execution_id]);
});

useListenToTauriEvent('workflow_step_completed', (event) => {
  // Update step state in UI
  // Show completion animation
});
```

## 9. Implementation Order

1. **Phase 1**: Database migration + Rust models
2. **Phase 2**: Query functions
3. **Phase 3**: Template system extensions
4. **Phase 4**: Execution engine
5. **Phase 5**: Tauri commands
6. **Phase 6**: Frontend state (atoms + hooks)
7. **Phase 7**: UI components
8. **Phase 8**: Routing and integration
9. **Phase 9**: Testing and polish

## 10. Testing Strategy

### 10.1 Unit Tests
- Query functions (Rust)
- Template resolution logic
- Workflow hooks (React)

### 10.2 Integration Tests
- Full workflow execution
- Data passing between steps
- Cancellation behavior

### 10.3 Manual Testing
See `MANUAL_TESTING.md` for comprehensive test scenarios.

## 11. Performance Considerations

- Use indexes on all foreign keys
- Auto-prune old executions (keep 50 most recent)
- Lazy-load execution results (don't load all at once)
- Use fractional indexing for sort_priority (allows reordering without updating all records)
- Stream large response bodies to disk (reuse existing Yaak pattern)

## 12. Error Handling

- Database errors: Rollback transactions, show toast
- Template errors: Clear error message with step index
- Execution errors: Stop workflow, save error state
- Broken references: Detect and prompt user
- Network errors: Handled by existing HTTP/gRPC error handling

## 13. Security Considerations

- Workflows are workspace-scoped (no cross-workspace access)
- Use existing Yaak authentication/authorization
- Template rendering uses same security as existing templates
- No new attack vectors introduced
