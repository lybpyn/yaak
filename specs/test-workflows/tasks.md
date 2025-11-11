# Test Workflows - Implementation Tasks

## Progress Overview

**Total Tasks**: 20 core tasks
**Completed**: 0
**Status**: Not started

## Phase 1: Database & Models (Tasks 1-3)

### Task 1: Create Database Migration
- [ ] Create migration file: `{timestamp}_workflows.sql`
- [ ] Add workflows table with indexes
- [ ] Add workflow_steps table with indexes
- [ ] Add workflow_executions table with indexes
- [ ] Add workflow_step_executions table with indexes

**Location**: `src-tauri/yaak-models/migrations/`
**Command**: `npm run migration` from project root

### Task 2: Implement Rust Models
- [ ] Add Workflow struct with UpsertModelInfo trait
- [ ] Add WorkflowStep struct
- [ ] Add WorkflowExecution struct with WorkflowExecutionState enum
- [ ] Add WorkflowStepExecution struct with WorkflowStepExecutionState enum
- [ ] Register models in AnyModel enum
- [ ] Add deserialization cases
- [ ] Export to TypeScript via ts-rs

**Location**: `src-tauri/yaak-models/src/models.rs`

### Task 3: Implement Query Functions
- [ ] Create workflows.rs: get_workflow, list_workflows_by_workspace, delete_workflow
- [ ] Create workflow_steps.rs: get_workflow_step, list_workflow_steps, get_workflow_with_steps
- [ ] Create workflow_executions.rs: list_workflow_executions, update_execution_state
- [ ] Register query modules in mod.rs

**Location**: `src-tauri/yaak-models/src/queries/`

## Phase 2: Template System (Tasks 4-5)

### Task 4: Extend Template Context
- [ ] Add WorkflowContext struct in renderer.rs
- [ ] Add StepResponse struct
- [ ] Add workflow-aware render functions

**Location**: `src-tauri/yaak-templates/src/renderer.rs`

### Task 5: Implement Workflow Variable Resolution
- [ ] Add resolve_workflow_variable function
- [ ] Implement regex parsing for workflow.step[N].* syntax
- [ ] Add resolve_nested_field for JSON path traversal
- [ ] Add workflow error variants in error.rs
- [ ] Add regex dependency to Cargo.toml

**Location**: `src-tauri/yaak-templates/src/`

## Phase 3: Execution Engine (Tasks 6-8)

### Task 6: Create Workflow Executor
- [ ] Create workflow_execution.rs module
- [ ] Implement WorkflowExecutor struct with app_handle and cancellation tokens
- [ ] Implement execute() entry point (non-blocking)
- [ ] Implement run_workflow() sequential loop
- [ ] Implement execute_step() for individual steps
- [ ] Add cancellation support

**Location**: `src-tauri/src/workflow_execution.rs`

### Task 7: Implement State Management
- [ ] Add update_execution_state helper
- [ ] Add update_execution_elapsed helper
- [ ] Add create_step_execution helper
- [ ] Emit Tauri events for state changes

**Location**: `src-tauri/src/workflow_execution.rs`

### Task 8: Integrate with Existing Request Handlers
- [ ] Reuse send_http_request for HTTP steps
- [ ] Add render_http_request_with_workflow function
- [ ] Handle response storage

**Location**: `src-tauri/src/workflow_execution.rs`, `src-tauri/src/http_request.rs`

## Phase 4: Tauri Commands (Tasks 9-10)

### Task 9: Implement Workflow Commands
- [ ] Add cmd_execute_workflow command
- [ ] Add cmd_cancel_workflow_execution command
- [ ] Add cmd_get_workflow_with_steps command
- [ ] Add cmd_get_workflow_execution_results command
- [ ] Add cmd_list_workflow_executions command

**Location**: `src-tauri/src/commands.rs`

### Task 10: Register Commands
- [ ] Add workflow_execution module declaration in lib.rs
- [ ] Register all 5 commands in invoke_handler

**Location**: `src-tauri/src/lib.rs`

## Phase 5: Frontend State (Tasks 11-12)

### Task 11: Create Jotai Atoms
- [ ] Add workflowsAtom in atoms.ts
- [ ] Add workflowStepsAtom
- [ ] Add workflowExecutionsAtom
- [ ] Add workflowStepExecutionsAtom
- [ ] Update newStoreData() in util.ts

**Location**: `src-tauri/yaak-models/guest-js/`

### Task 12: Create React Hooks
- [ ] Create useWorkflows hook
- [ ] Create useWorkflowSteps hook
- [ ] Create useWorkflowExecution hook

**Location**: `src-web/hooks/`

## Phase 6: UI Components (Tasks 13-17)

### Task 13: Create List and Editor Components
- [ ] Create WorkflowList.tsx
- [ ] Create WorkflowDetail.tsx
- [ ] Create WorkflowStepList.tsx with drag-drop (@dnd-kit)
- [ ] Create WorkflowStepItem.tsx

**Location**: `src-web/components/Workflows/`

### Task 14: Create Execution Components
- [ ] Create ExecuteWorkflowButton.tsx with environment selector
- [ ] Create WorkflowExecutionViewer.tsx for real-time progress
- [ ] Create WorkflowExecutionResults.tsx for detailed results
- [ ] Create WorkflowExecutionHistory.tsx

**Location**: `src-web/components/Workflows/`

### Task 15: Create Utility Components
- [ ] Create AddStepDropzone.tsx
- [ ] Create BrokenStepDialog.tsx
- [ ] Create EnvironmentSelector.tsx

**Location**: `src-web/components/Workflows/`

### Task 16: Add Routes
- [ ] Create index.tsx (workflow list route)
- [ ] Create $workflowId.tsx (workflow editor route)
- [ ] Create $workflowId/executions/$executionId.tsx (results route)

**Location**: `src-web/routes/workspaces/$workspaceId/workflows/`

### Task 17: Integrate Navigation
- [ ] Add Workflows button to WorkspaceHeader
- [ ] Add Workflow option to CreateDropdown

**Location**: `src-web/components/`

## Phase 7: Testing & Documentation (Tasks 18-20)

### Task 18: Create Tests
- [ ] Create manual testing checklist (MANUAL_TESTING.md)
- [ ] Optionally create unit tests for hooks

**Location**: `specs/test-workflows/`, `src-web/hooks/__tests__/`

### Task 19: Documentation
- [ ] Create user guide (USER_GUIDE.md)
- [ ] Update CLAUDE.md with workflow architecture section

**Location**: `specs/test-workflows/`, `CLAUDE.md`

### Task 20: Final Integration Testing
- [ ] Test complete workflow creation flow
- [ ] Test execution with data passing
- [ ] Test error handling and edge cases
- [ ] Test drag-drop functionality
- [ ] Verify all 11 user stories satisfied

## Implementation Notes

### Dependencies to Install
```bash
# Frontend (if not already installed)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Backend (add to Cargo.toml if needed)
regex = "1.11"
```

### Key Patterns to Follow
- Use fractional indexing for sort_priority (allow values like 0.5, 1.0, 1.5)
- Soft references: environment_id, request_id, response_id (no FK constraints)
- All models follow Yaak conventions: id prefix, model field, timestamps, soft delete
- Cascade deletes: workflow → steps, workflow → executions
- Real-time updates: emit Tauri events after state changes

### Testing Checklist
See MANUAL_TESTING.md (to be created) for comprehensive test scenarios.

## Completion Criteria

- [ ] Database tables created and migrated
- [ ] All Rust models, queries, and commands implemented
- [ ] Template system extended for workflow variables
- [ ] Execution engine fully functional
- [ ] All frontend components created and integrated
- [ ] Navigation integrated in WorkspaceHeader
- [ ] Can create workflow with 5+ steps
- [ ] Can execute workflow and see real-time progress
- [ ] Can pass data between steps using template variables
- [ ] Can view execution results
- [ ] Documentation complete
