# Test Workflows - Requirements Specification

## Overview

Test Workflows allow users to create automated test sequences by chaining multiple API requests together. This feature enables end-to-end API testing, data passing between requests, and workflow execution tracking.

## User Stories

### US-1: Create Workflow
**As a** developer
**I want to** create a test workflow in my workspace
**So that** I can organize and execute multiple API requests as a sequence

**Acceptance Criteria:**
- User can create a new workflow with a name and optional description
- Workflow is associated with a specific workspace
- Workflow can store a default environment for execution
- Workflow appears in the workspace's workflow list
- User can set sort priority for workflow ordering

### US-2: Add Requests to Workflow via Drag-Drop
**As a** developer
**I want to** drag HTTP/gRPC requests into a workflow
**So that** I can quickly build test sequences from existing requests

**Acceptance Criteria:**
- User can drag HTTP requests from request list to workflow
- User can drag gRPC requests from request list to workflow
- Dropped request creates a new workflow step
- Step references the original request (not a copy)
- Step inherits request name by default
- Multiple requests can be added to the same workflow

### US-3: Reorder Workflow Steps
**As a** developer
**I want to** reorder steps in a workflow by dragging
**So that** I can control the execution sequence

**Acceptance Criteria:**
- User can drag steps to reorder them within the workflow
- Visual feedback shows drop target position
- Order is persisted using sort_priority field
- Execution follows the displayed order

### US-4: Execute Workflow Sequentially
**As a** developer
**I want to** execute all steps in a workflow sequentially
**So that** I can test complete API flows

**Acceptance Criteria:**
- User clicks "Run Workflow" button
- User can select environment before execution
- Steps execute one at a time in order
- Execution state updates in real-time (running, completed, failed, cancelled)
- User sees progress indicator during execution
- Execution stops on first error (subsequent steps not executed)
- Execution completes successfully if all steps succeed
- Execution results are saved to database

### US-5: Pass Data Between Steps
**As a** developer
**I want to** reference response data from previous steps in later steps
**So that** I can chain API calls (e.g., use auth token from step 1 in step 2)

**Acceptance Criteria:**
- User can use template syntax: `{{workflow.step[0].response.body.token}}`
- User can reference response headers: `{{workflow.step[0].response.headers.Authorization}}`
- User can reference status code: `{{workflow.step[0].response.status}}`
- User can reference elapsed time: `{{workflow.step[0].response.elapsed}}`
- User can reference final URL: `{{workflow.step[0].response.url}}`
- Nested JSON fields supported: `{{workflow.step[0].response.body.user.profile.email}}`
- Template variables resolve during step execution
- Clear error message if referencing non-existent step or field
- Cannot reference future steps (only previous ones)

### US-6: Delete Workflow
**As a** developer
**I want to** delete a workflow I no longer need
**So that** I can keep my workspace organized

**Acceptance Criteria:**
- User can delete workflow from workflow list
- Confirmation dialog appears before deletion
- Deleting workflow also deletes all associated steps (cascade delete)
- Deleting workflow deletes all execution history
- Original requests referenced by steps are NOT deleted

### US-7: Delete Workflow Step
**As a** developer
**I want to** remove a step from a workflow
**So that** I can modify test sequences

**Acceptance Criteria:**
- User can delete individual steps from workflow
- Confirmation dialog appears
- Step is removed from workflow
- Remaining steps maintain their order
- Original request is NOT deleted

### US-8: Enable/Disable Steps
**As a** developer
**I want to** temporarily disable steps without deleting them
**So that** I can test partial workflows

**Acceptance Criteria:**
- User can toggle step enabled/disabled state
- Disabled steps are visually distinct (grayed out)
- Disabled steps are skipped during execution (state: skipped)
- Disabled steps don't break data passing (subsequent steps can still reference earlier enabled steps)

### US-9: View Execution Results
**As a** developer
**I want to** view detailed results of workflow executions
**So that** I can debug test failures

**Acceptance Criteria:**
- User sees list of all step executions
- Each step shows: status (pending/running/completed/failed/skipped), elapsed time, error message (if failed)
- User can expand step to see full request and response
- User can see response body, headers, status code
- User can copy response data
- Execution results persist in database

### US-10: Handle Broken References
**As a** developer
**I want to** be notified when a workflow step references a deleted request
**So that** I can fix or remove broken steps

**Acceptance Criteria:**
- System detects when request referenced by step is deleted
- Workflow editor shows warning indicator on broken steps
- User sees dialog: "This step references a deleted request. Remove step or replace request?"
- User can choose to remove the broken step
- User can choose to replace with a different request
- Workflow execution skips broken steps with error state

### US-11: Select Environment for Execution
**As a** developer
**I want to** choose which environment to use when executing a workflow
**So that** I can test against different backends (dev/staging/prod)

**Acceptance Criteria:**
- Workflow stores default environment from creation time
- User can manually select different environment before execution
- Environment selector shows all environments in workspace
- Environment resolution order: Manual selection > Workflow default > Workspace active
- Selected environment is used for all variable resolution in all steps

## Functional Requirements

### FR-1: Data Model
- Workflow: id, workspace_id, name, description, environment_id, sort_priority, created_at, updated_at, deleted_at
- WorkflowStep: id, workflow_id, request_id, request_model, name, enabled, sort_priority, created_at, updated_at, deleted_at
- WorkflowExecution: id, workflow_id, workspace_id, environment_id, elapsed, state, error, created_at, updated_at, deleted_at
- WorkflowStepExecution: id, workflow_execution_id, workflow_step_id, request_id, response_id, response_model, elapsed, state, error, created_at, updated_at, deleted_at

### FR-2: Execution States
- Workflow Execution: initialized, running, completed, failed, cancelled
- Step Execution: pending, running, completed, failed, skipped

### FR-3: Data Relationships
- Workflow belongs to Workspace (CASCADE DELETE)
- WorkflowStep belongs to Workflow (CASCADE DELETE)
- WorkflowStep references HttpRequest or GrpcRequest (SOFT REFERENCE - no FK constraint)
- WorkflowExecution belongs to Workflow (CASCADE DELETE)
- WorkflowStepExecution belongs to WorkflowExecution (CASCADE DELETE)
- WorkflowStepExecution references HttpResponse or GrpcConnection (SOFT REFERENCE)

### FR-4: Template System Extension
- Extend yaak-templates parser to recognize `workflow.step[N].*` syntax
- Add WorkflowContext struct to store previous step responses
- Add StepResponse struct: response_body, response_headers, response_status, response_elapsed, response_url
- Support nested JSON field access via dot notation
- Validation: step index must be < current step index

### FR-5: Execution Engine
- Non-blocking execution (returns execution_id immediately)
- Sequential step processing
- Cancellation support (graceful shutdown)
- Real-time progress updates via Tauri events
- State persistence after each step
- Error handling: halt on first failure

### FR-6: API Commands
- execute_workflow(workflow_id, environment_id?) -> execution_id
- cancel_workflow_execution(execution_id)
- get_workflow_with_steps(workflow_id) -> (workflow, steps, broken_step_ids)
- get_workflow_execution_results(execution_id) -> (execution, step_executions)
- list_workflow_executions(workflow_id, limit, offset) -> paginated list

### FR-7: Frontend Components
- WorkflowList: displays all workflows in workspace
- WorkflowEditor: edit workflow name, description, default environment
- WorkflowStepList: drag-drop reorderable list of steps
- WorkflowStepEditor: edit step name, toggle enabled
- ExecuteWorkflowButton: environment selector + execute action
- WorkflowExecutionViewer: real-time execution progress
- WorkflowExecutionResults: detailed step results
- WorkflowExecutionHistory: past executions list
- BrokenReferenceDialog: handle deleted request references

### FR-8: Routing
- /workspaces/:workspaceId/workflows - list view
- /workspaces/:workspaceId/workflows/:workflowId - editor view
- /workspaces/:workspaceId/workflows/:workflowId/executions/:executionId - results view

### FR-9: Real-time Updates
- Emit `workflow_execution_updated` event on state changes
- Emit `workflow_step_completed` event after each step
- Frontend listens and updates UI in real-time

### FR-10: Broken Reference Detection
- Query function: validate_request_exists(request_id, request_model)
- Query function: get_workflow_with_steps returns broken_step_ids
- UI highlights broken steps with warning icon

### FR-11: Environment Resolution
- Default environment stored in workflow.environment_id
- Manual override available in execution UI
- Fallback to workspace active environment if neither specified

## Non-Functional Requirements

### NFR-1: Performance
- Workflow execution should handle 50+ steps efficiently
- Step execution latency should match individual request execution
- Database queries should use indexes for fast lookup
- Execution history should auto-prune (keep 50 most recent per workflow)

### NFR-2: Reliability
- Execution state must be persisted before each step
- Cancellation must be graceful (current step completes)
- Errors must not corrupt workflow or step data
- Database transactions used for atomic operations

### NFR-3: Usability
- Drag-drop interface should feel responsive
- Execution progress should be visible in real-time
- Error messages should be clear and actionable
- Template syntax should follow existing Yaak patterns

### NFR-4: Maintainability
- Code should follow Yaak's existing patterns
- Models should use ts-rs for TypeScript export
- Components should match existing Yaak UI style
- Documentation should be comprehensive

## Out of Scope (V1)

- Parallel step execution
- Conditional branching (if/else)
- Loops and retries
- Assertions/validations
- Mock data generation
- Scheduled execution
- Workflow templates/sharing
- Workflow variables (separate from environment variables)

## Success Criteria

1. User can create workflow with 10+ steps
2. User can execute workflow and see real-time progress
3. User can pass authentication token from step 1 to step 2
4. User can reorder steps via drag-drop
5. User can view detailed execution results
6. System handles deleted request references gracefully
7. Execution state persists across app restarts
8. All 11 user stories are satisfied
