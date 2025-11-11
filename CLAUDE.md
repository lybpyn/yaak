# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yaak is a privacy-first, cross-platform API client for REST, GraphQL, gRPC, WebSocket, and SSE. Built with Tauri, Rust, and React.

**Architecture**: Tauri desktop app with React frontend (src-web) communicating via IPC with Rust backend (src-tauri). Plugin system runs Node.js runtime for extensibility. SQLite database with optional filesystem sync.

**Contribution Policy**: Only accepting bug fixes, not new features.

## Development Commands

### Setup
```bash
npm install              # Install Node dependencies
npm run bootstrap        # Setup vendored binaries (Node.js, protoc, plugins)
```

### Development
```bash
npm start               # Start app in dev mode (uses tauri.development.conf.json)
npm run build           # Build all workspace packages
npm run build-plugins   # Build plugins only
npm test                # Run tests across all workspaces
npm run lint            # Lint all workspaces
```

### Building
```bash
npm run app-build       # Build production app with Tauri
```

### Database Migrations
```bash
npm run migration       # Create new SQLite migration (from src-tauri/)
```

### Other
```bash
npm run icons           # Regenerate app icons
```

**Running Single Tests**: Navigate to specific workspace and run `npm test` there, or use workspace filtering:
```bash
npm test -w packages/plugin-runtime
npm test -w src-web
```

## Architecture Overview

### Frontend (React + TypeScript)
- **Location**: `src-web/`
- **Stack**: React 19, TanStack Router (file-based routing), Jotai (state), TanStack Query (data fetching), Tailwind CSS
- **Entry**: `src-web/main.tsx`
- **Routes**: `src-web/routes/` (TanStack Router)
- **Components**: `src-web/components/` (80+ React components)
- **Tauri Invocation**: `src-web/lib/tauri.ts` wraps Tauri invoke API

### Backend (Rust + Tauri)
- **Location**: `src-tauri/`
- **Entry**: `src-tauri/src/lib.rs` (1663 lines - main command handlers)
- **Commands**: 36 Tauri commands exposed to frontend (marked with `#[tauri::command]`)
- **Key Files**:
  - `src/http_request.rs` - HTTP execution flow
  - `src/grpc.rs` - gRPC request handling
  - `src/render.rs` - Template rendering
  - `src/plugin_events.rs` - Plugin communication

### Database & Models
- **Location**: `src-tauri/yaak-models/`
- **Database**: SQLite with r2d2 connection pooling
- **Models**: Defined in `yaak-models/src/models.rs` (71KB), exported to TypeScript via ts-rs
- **Key Models**: Workspace, Folder, Environment, HttpRequest, HttpResponse, GrpcRequest, WebsocketRequest
- **Events**: Model changes emit Tauri events (`upserted_model`, `deleted_model`) that drive frontend updates and sync

### Plugin System (Two-Tier)
1. **Rust Plugin Manager** (`src-tauri/yaak-plugins/src/manager.rs`)
   - Orchestrates plugin lifecycle
   - Manages WebSocket server for plugin communication
   - Routes events between app and plugins

2. **Node.js Plugin Runtime** (`packages/plugin-runtime/`)
   - Separate Node.js process spawned by Rust
   - Executes plugin code in worker threads
   - Communicates via WebSocket

**Plugin Types**: Auth, Actions, Importers, Template Functions, Filters, Themes
**Plugin Locations**:
- Built-in: `plugins/` (30+ plugins)
- Vendored: `src-tauri/vendored/plugins/`
- User-installed: `~/.yaak/installed-plugins/`

**Communication Flow**:
```
Frontend → Tauri Command → Rust Backend → WebSocket → Node.js Runtime → Plugin Worker
```

### Request Handlers

**HTTP** (`src-tauri/src/http_request.rs`):
- Environment resolution → Template rendering → Auth → TLS config → Execution → Response streaming → Database save

**gRPC** (`src-tauri/yaak-grpc/`):
- Dynamic message handling with prost-reflect
- Service discovery via reflection
- Supports unary, client streaming, server streaming, bidirectional

**WebSocket** (`src-tauri/yaak-ws/`):
- Connection management with message history
- Template rendering for connection URLs

**SSE** (`src-tauri/yaak-sse/`):
- Event streaming with eventsource-client crate

### Sync & Git
**Sync** (`src-tauri/yaak-sync/`):
- Two-way sync between SQLite database and YAML files
- Workspace can be mirrored to filesystem for Git versioning
- Frontend debounces model changes and triggers sync (`src-web/init/sync.ts`)

**Git** (`src-tauri/yaak-git/`):
- Git operations on synced workspace directories
- Uses git2 crate with vendored libgit2

### Template System
**Location**: `src-tauri/yaak-templates/`
- **Parser** (`parser.rs`): Parses `{{variable}}` and `{{ function(arg) }}` syntax
- **Renderer** (`renderer.rs`): Evaluates templates with environment variables and function calls
- **Functions**: Both Rust native (secure, keyring) and plugin-based (timestamp, uuid, hash, etc.)

### Encryption
**Location**: `src-tauri/yaak-crypto/`
- Algorithm: ChaCha20-Poly1305 AEAD
- Per-workspace keys stored in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Encrypts sensitive environment variables and template values

## Key Workflows

### HTTP Request Execution
1. User clicks "Send" in `HttpRequestPane.tsx`
2. Frontend calls `cmd_send_http_request(requestId, environmentId)`
3. Rust backend:
   - Loads HttpRequest from database
   - Resolves environment inheritance chain
   - Calls authentication plugin if configured
   - Renders templates ({{uuid}}, {{env.VAR}}, etc.)
   - Builds reqwest client with TLS/proxy settings
   - Executes request, streams response body to disk
   - Saves HttpResponse to database
   - Emits `upserted_model` event
4. Frontend hears event via Tauri listener
5. React Query invalidates, component re-renders with response

### Plugin Template Function Call
1. User types `{{timestamp()}}` in request
2. Frontend calls `cmd_render_template()`
3. Rust parses template, identifies function call
4. PluginManager sends WebSocket message to Node.js runtime
5. Runtime routes to `template-function-timestamp` plugin worker
6. Plugin executes function, returns result via WebSocket
7. Rust inserts result into rendered template
8. Frontend receives fully rendered string

### File-based Sync
1. User modifies model (e.g., environment variable)
2. Database emits `upserted_model` event
3. Frontend sync listener (debounced) calls sync
4. Sync calculates diff between database and filesystem
5. Shows confirmation if changes detected
6. Applies sync operations (create/update/delete YAML files)
7. Files can be committed to Git

## Important File Paths

### Frontend
- `src-web/main.tsx` - React entry point
- `src-web/components/HttpRequestPane.tsx` - HTTP editor
- `src-web/components/HttpResponsePane.tsx` - Response viewer
- `src-web/init/sync.ts` - Sync initialization

### Backend
- `src-tauri/src/lib.rs` - Main backend with all command handlers
- `src-tauri/src/http_request.rs` - HTTP execution logic
- `src-tauri/src/grpc.rs` - gRPC execution
- `src-tauri/Cargo.toml` - Rust workspace definition

### Models
- `src-tauri/yaak-models/src/models.rs` - All model definitions
- `src-tauri/yaak-models/src/lib.rs` - Database initialization
- `src-tauri/yaak-models/src/query_manager.rs` - Database query extensions

### Plugins
- `src-tauri/yaak-plugins/src/manager.rs` - Plugin orchestration (34KB)
- `packages/plugin-runtime/src/index.ts` - Node.js runtime
- `packages/plugin-runtime-types/src/plugins/` - Plugin API types

### Other Systems
- `src-tauri/yaak-sync/src/sync.rs` - Sync algorithm
- `src-tauri/yaak-templates/src/parser.rs` - Template parsing
- `src-tauri/yaak-crypto/src/` - Encryption

## Monorepo Structure

This is a **multi-language monorepo** with both npm workspaces and Rust Cargo workspaces.

### NPM Workspaces (package.json)
- `packages/common-lib` - Shared utilities
- `packages/plugin-runtime` - Node.js plugin runtime
- `packages/plugin-runtime-types` - TypeScript types for plugins
- `plugins/*` - 30+ built-in plugins
- `src-tauri` - Rust backend (has own package.json for build scripts)
- `src-tauri/yaak-*` - Rust crates (each has package.json for compatibility)
- `src-web` - React frontend

### Rust Workspaces (src-tauri/Cargo.toml)
- `yaak-crypto` - Encryption
- `yaak-fonts` - Font handling
- `yaak-git` - Git operations
- `yaak-grpc` - gRPC client
- `yaak-http` - HTTP utilities
- `yaak-license` - License validation
- `yaak-mac-window` - macOS window customization
- `yaak-models` - Database models
- `yaak-plugins` - Plugin system
- `yaak-sse` - Server-Sent Events
- `yaak-sync` - Filesystem sync
- `yaak-templates` - Template engine
- `yaak-ws` - WebSocket client

## Common Extension Traits

When working with Rust code, these traits provide convenient database and window access:

### QueryManagerExt (for AppHandle/WebviewWindow)
```rust
// Access database queries
let workspace = window.db().get_workspace(id)?;
let environments = window.db().resolve_environments(...)?;
let models = window.db().workspace_models(workspace_id)?;
```

### WorkspaceWindowTrait (for WebviewWindow)
```rust
// Access window utilities
let db = window.db();              // Database handle
let crypto = window.crypto();      // Encryption manager
```

## Frontend-Backend Communication

### Frontend → Backend (Tauri Commands)
```typescript
import { invoke } from '@tauri-apps/api/core';

const response = await invoke('cmd_send_http_request', {
    requestId: '123',
    environmentId: 'env-456'
});
```

### Backend → Frontend (Tauri Events)
```rust
app_handle.emit("upserted_model", ModelPayload {
    change: ModelChangeEvent::Upsert,
    payload: AnyModel::HttpResponse(response),
})?;
```

Frontend listens via `useListenToTauriEvent` hook.

## Key Tauri Commands (36 total)

**HTTP**: `cmd_send_http_request`, `cmd_send_ephemeral_request`, `cmd_send_folder`, `cmd_http_request_actions`, `cmd_http_response_body`

**gRPC**: `cmd_grpc_reflect`, `cmd_grpc_go`, `cmd_create_grpc_request`, `cmd_grpc_request_actions`

**Templates**: `cmd_render_template`, `cmd_template_function_summaries`, `cmd_template_function_config`, `cmd_format_json`

**Auth**: `cmd_get_http_authentication_summaries`, `cmd_get_http_authentication_config`, `cmd_call_http_authentication_action`

**Plugins**: `cmd_reload_plugins`, `cmd_plugin_info`, `cmd_install_plugin`, `cmd_get_themes`

**Data**: `cmd_import_data`, `cmd_export_data`, `cmd_curl_to_request`, `cmd_save_response`

**Encryption**: `cmd_secure_template`, `cmd_decrypt_template`, `cmd_show_workspace_key`

**Core**: `cmd_metadata`, `cmd_restart`, `cmd_new_main_window`, `cmd_new_child_window`, `cmd_check_for_updates`

All commands defined in `src-tauri/src/lib.rs`.

## Database Schema

SQLite database at `~/.yaak/db.sqlite` (development uses separate database).

Models use sea-query for type-safe SQL generation. Migrations in `src-tauri/yaak-models/migrations/`.

All models have:
- `id` (String, primary key)
- `created_at` (i64, timestamp)
- `updated_at` (i64, timestamp)

Key models: Workspace, Folder, HttpRequest, HttpResponse, Environment, CookieJar, GrpcRequest, WebsocketRequest, Plugin, Settings.

## Type Generation

Rust models are automatically exported to TypeScript using ts-rs:
- Rust: `#[derive(TS)]` on structs
- TypeScript: Generated in `packages/plugin-runtime-types/src/bindings/`

This ensures type safety across the IPC boundary.

## Vendored Dependencies

The app bundles:
- **Node.js binary** (`vendored/node/yaaknode`) - For plugin runtime
- **Protoc binary** (`vendored/protoc/yaakprotoc`) - For gRPC proto compilation
- **Plugins** (`vendored/plugins/`) - Pre-built plugin bundles
- **Plugin runtime** (`vendored/plugin-runtime/`) - Compiled Node.js runtime

These are generated by `npm run bootstrap`.

## Development Tips

1. **Hot Reload**: `npm start` enables hot reload for frontend changes. Rust changes require restart.

2. **Database Location**: Development builds use `~/.yaak/dev-db.sqlite` to avoid corrupting production data.

3. **Plugin Development**: Changes to plugins require `npm run build-plugins` and app restart.

4. **Database Changes**: After modifying models:
   - Run `npm run migration` to create migration
   - Update queries in `yaak-models/src/queries/`
   - Ensure ts-rs exports are updated

5. **Frontend State**: Use Jotai atoms for global state, TanStack Query for server state. Model changes sync automatically via Tauri events.

6. **Error Handling**: Rust errors use thiserror, serialized to JSON for frontend. Frontend displays via toast notifications.

7. **Testing**: Each workspace can have its own tests. Run `npm test` from root to run all.

## Test Workflows Feature

**Location**: `specs/test-workflows/`, `src-web/components/Workflows/`, `src-web/hooks/useWorkflow*.ts`

Test Workflows allow users to chain multiple HTTP/gRPC requests together for end-to-end API testing.

### Architecture

**Backend**:
- **Models**: `Workflow`, `WorkflowStep`, `WorkflowExecution`, `WorkflowStepExecution` (in `yaak-models/src/models.rs`)
- **Migration**: `20250109084200_workflows.sql` adds 4 tables with foreign key relationships
- **Execution Engine**: `src-tauri/src/workflow_execution.rs` orchestrates sequential step execution
- **Template Extensions**: `yaak-templates` supports `{{workflow.step[N].response.*}}` syntax for data passing

**Frontend**:
- **Routes**:
  - `/workspaces/$workspaceId/workflows` - List view
  - `/workspaces/$workspaceId/workflows/$workflowId` - Detail/editor
  - `/workspaces/$workspaceId/workflows/$workflowId/executions/$executionId` - Results
- **Components**: `WorkflowList`, `WorkflowDetail`, `WorkflowStepList`, `WorkflowExecutionButton`, `WorkflowExecutionResults` (11 total)
- **Hooks**: `useWorkflows`, `useWorkflowSteps`, `useWorkflowExecution`
- **State**: Jotai atoms in `yaak-models/guest-js/atoms.ts`

### Key Concepts

**Workflow**: Container for ordered list of requests to execute sequentially
**WorkflowStep**: Reference to an HTTP or gRPC request within a workflow
**WorkflowExecution**: Record of a single workflow run with state (initialized, running, completed, failed, cancelled)
**WorkflowStepExecution**: Record of each step's execution within a workflow run

### Data Flow

1. User creates workflow and adds steps (references to existing requests)
2. User clicks "Run Workflow", selects environment
3. Backend:
   - Creates `WorkflowExecution` record (state: initialized)
   - Loads enabled workflow steps ordered by `sort_priority`
   - Validates request references exist
   - Spawns async task that:
     - Updates state to "running"
     - Executes each step sequentially
     - Renders templates with `WorkflowContext` containing previous step responses
     - Stores response and creates `WorkflowStepExecution` record
     - Halts on error (state: failed) or continues to completion (state: completed)
     - Emits `workflow_execution_updated` events
4. Frontend displays real-time updates and final results

### Template Variable Resolution

Steps can reference previous step data using workflow template syntax:

```
{{workflow.step[N].response.body.fieldName}}       - JSON response field
{{workflow.step[N].response.headers['Header']}}    - Response header
{{workflow.step[N].response.status}}               - HTTP status code
{{workflow.step[N].response.elapsed}}              - Duration in ms
{{workflow.step[N].response.url}}                  - Final URL after redirects
```

**Implementation**: `yaak-templates/src/renderer.rs` contains `resolve_workflow_variable()` which:
- Parses template syntax with regex `workflow\.step\[(\d+)\]\.(.+)`
- Validates step index is < current step (no forward references)
- Extracts field from `StepResponse` in `WorkflowContext`
- Supports nested JSON via dot notation: `response.body.user.profile.email`

### Broken Reference Handling

When a request referenced by a workflow step is deleted:
- Step remains in workflow but marked as "broken"
- UI shows warning indicator
- User can choose to "Remove Step" or "Replace Request"
- Execution skips broken steps with error state

### Environment Resolution

Workflows use environments for variable resolution:
1. **Manual selection** at execution time (highest priority)
2. **Workflow default** environment (stored when workflow created)
3. **Workspace active** environment (fallback)

### Execution Control

- **Sequential execution**: Steps run one at a time in `sort_priority` order
- **Error handling**: First failure halts workflow, subsequent steps not executed
- **Cancellation**: Graceful cancellation allows current step to complete before stopping
- **Disabled steps**: Skipped during execution (state: skipped)

### Database Schema

```sql
workflows
  ├─ id, workspace_id, name, description, environment_id, sort_priority
  └─ CASCADE → workflow_steps, workflow_executions

workflow_steps
  ├─ id, workflow_id, request_id (soft), request_model, name, enabled, sort_priority
  └─ Soft reference to http_requests or grpc_requests

workflow_executions
  ├─ id, workflow_id, workspace_id, environment_id, elapsed, state, error
  └─ CASCADE → workflow_step_executions

workflow_step_executions
  ├─ id, workflow_execution_id, workflow_step_id, request_id, response_id (soft), elapsed, state, error
  └─ Soft reference to http_responses or grpc_connections
```

### Tauri Commands

**Workflow CRUD**: Uses existing `upsert` and `delete` commands (models registered in workspace_models)

**Execution**:
- `cmd_execute_workflow(workflowId, environmentId?)` → Returns `executionId` immediately
- `cmd_cancel_workflow_execution(executionId)` → Triggers graceful cancellation

**Queries**:
- `cmd_get_workflow_with_steps(workflowId)` → Returns workflow, steps, and broken step IDs
- `cmd_get_workflow_execution_results(executionId)` → Returns execution with step results
- `cmd_list_workflow_executions(workflowId, limit, offset)` → Paginated history

### Testing

**Unit Tests**: `src-web/hooks/__tests__/useWorkflow*.test.ts` (3 files)
**Component Tests**: `src-web/components/Workflows/__tests__/*.test.tsx` (4 files)
**Manual Tests**: `specs/test-workflows/MANUAL_TESTING.md` (24 test scenarios)

Tests require Vitest setup in src-web (not yet configured).

### Documentation

**User Guide**: `specs/test-workflows/USER_GUIDE.md` - End-user documentation with examples
**Technical Design**: `specs/test-workflows/design.md` - Complete architecture and implementation details
**Requirements**: `specs/test-workflows/requirements.md` - Feature requirements and user stories
**Manual Testing**: `specs/test-workflows/MANUAL_TESTING.md` - QA test scenarios

### Known Limitations (V1)

- No parallel step execution (sequential only)
- No conditional branching (no if/else logic)
- No loops or retries
- No automated assertions (manual verification required)
- Cross-context drag-and-drop not wired (manual step addition works)

### Adding Workflow Models

When modifying workflow models:
1. Update model structs in `yaak-models/src/models.rs`
2. Create migration in `yaak-models/migrations/`
3. Update queries in `yaak-models/src/queries/workflow*.rs`
4. Ensure TypeScript types are exported via ts-rs
5. Update frontend hooks in `src-web/hooks/`
6. Update components in `src-web/components/Workflows/`
7. Run tests: Unit tests (when configured), manual QA checklist
