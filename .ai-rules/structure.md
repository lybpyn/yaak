---
title: Yaak Project Structure
description: "Directory organization, naming conventions, architectural patterns, and code placement rules"
inclusion: always
---

# Project Structure

## Architecture Pattern

**Multi-Language Monorepo** with dual workspace systems:
- **npm workspaces**: JavaScript/TypeScript packages and plugins
- **Cargo workspaces**: Rust crates

**Application Architecture**: Tauri desktop app
- **Frontend**: React SPA in `src-web/` (runs in WebView)
- **Backend**: Rust in `src-tauri/` (native Tauri runtime)
- **Communication**: IPC via Tauri commands and events

## Directory Organization

```
yaak/
├── .ai-rules/              # AI assistant guidance files
├── .claude/                # Claude-specific configuration
├── .github/                # GitHub workflows and issue templates
├── doc/                    # Documentation
├── packages/               # Shared npm packages
│   ├── common-lib/         # Shared utilities
│   ├── plugin-runtime/     # Node.js plugin runtime
│   └── plugin-runtime-types/ # TypeScript types for plugins
├── plugins/                # Built-in plugins (30+ subdirectories)
│   ├── action-*/           # Action plugins (copy curl, grpcurl)
│   ├── auth-*/             # Authentication plugins
│   ├── filter-*/           # Response filter plugins
│   ├── importer-*/         # Import plugins (Postman, Insomnia, etc.)
│   ├── template-function-*/ # Template function plugins
│   └── themes-*/           # Theme plugins
├── scripts/                # Build and utility scripts
│   ├── create-migration.cjs
│   ├── vendor-node.cjs
│   ├── vendor-plugins.cjs
│   └── vendor-protoc.cjs
├── specs/                  # Feature specifications
│   └── test-workflows/     # Workflow feature docs
├── src-tauri/              # Rust backend (Tauri app)
│   ├── bindings/           # Generated TypeScript bindings
│   ├── capabilities/       # Tauri capability configs
│   ├── icons/              # Application icons
│   ├── macos/              # macOS-specific resources
│   ├── src/                # Main application code
│   │   ├── lib.rs          # Entry point, command handlers (1663 lines)
│   │   ├── commands.rs     # Shared command implementations
│   │   ├── error.rs        # Error types
│   │   ├── http_request.rs # HTTP execution logic
│   │   ├── grpc.rs         # gRPC execution logic
│   │   ├── render.rs       # Template rendering
│   │   ├── plugin_events.rs # Plugin communication
│   │   ├── import.rs       # Data import handling
│   │   ├── encoding.rs     # Encoding utilities
│   │   └── workflow_execution/ # Workflow execution engine
│   ├── static/             # Static assets
│   ├── vendored/           # Vendored binaries (generated)
│   │   ├── node/           # Node.js binary
│   │   ├── plugins/        # Pre-built plugins
│   │   ├── plugin-runtime/ # Compiled runtime
│   │   └── protoc/         # Protoc binary
│   ├── yaak-common/        # Common Rust utilities
│   ├── yaak-crypto/        # Encryption (ChaCha20-Poly1305)
│   ├── yaak-fonts/         # Font handling
│   ├── yaak-git/           # Git operations
│   ├── yaak-grpc/          # gRPC client
│   ├── yaak-http/          # HTTP utilities
│   ├── yaak-license/       # License validation
│   ├── yaak-mac-window/    # macOS window customization
│   ├── yaak-models/        # Database models and queries
│   │   ├── guest-js/       # Guest JS bindings
│   │   ├── migrations/     # SQL migrations
│   │   ├── src/
│   │   │   ├── models.rs   # All model definitions (71KB)
│   │   │   ├── lib.rs      # Database initialization
│   │   │   ├── query_manager.rs # Query extensions
│   │   │   └── queries/    # Model-specific queries
│   │   └── package.json
│   ├── yaak-plugins/       # Plugin system
│   │   └── src/
│   │       └── manager.rs  # Plugin orchestration (34KB)
│   ├── yaak-sse/           # Server-Sent Events
│   ├── yaak-sync/          # Filesystem sync
│   │   └── src/sync.rs     # Sync algorithm
│   ├── yaak-templates/     # Template engine
│   │   └── src/
│   │       ├── parser.rs   # Template parsing
│   │       └── renderer.rs # Template rendering
│   ├── yaak-ws/            # WebSocket client
│   ├── Cargo.toml          # Rust workspace definition
│   ├── tauri.conf.json     # Base Tauri config
│   ├── tauri.development.conf.json
│   ├── tauri.release.conf.json
│   └── tauri.linux.conf.json
├── src-web/                # React frontend
│   ├── commands/           # Command utilities
│   ├── components/         # React components (80+)
│   │   ├── Workflows/      # Workflow feature components
│   │   ├── HttpRequestPane.tsx
│   │   ├── HttpResponsePane.tsx
│   │   └── [many more].tsx
│   ├── hooks/              # React hooks
│   │   ├── useWorkflow*.ts # Workflow-related hooks
│   │   └── [others].ts
│   ├── init/               # Initialization logic
│   │   └── sync.ts         # Sync initialization
│   ├── lib/                # Utility libraries
│   │   ├── tauri.ts        # Tauri invoke wrapper
│   │   └── [others].ts
│   ├── routes/             # TanStack Router (file-based)
│   │   └── [route files]   # Auto-generates routeTree.gen.ts
│   ├── main.tsx            # React entry point
│   ├── main.css            # Global styles
│   ├── theme.ts            # Theme configuration
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.cjs # Tailwind configuration
│   ├── tsconfig.json       # TypeScript config
│   └── package.json
├── CLAUDE.md               # Comprehensive project documentation
├── DEVELOPMENT.md          # Development setup guide
├── README.md               # Project overview
├── package.json            # Root npm workspace config
├── tsconfig.json           # Root TypeScript config
└── rustfmt.toml            # Rust formatting config
```

## Naming Conventions

### Files & Directories

#### TypeScript/React
- **Components**: PascalCase (e.g., `HttpRequestPane.tsx`, `WorkflowDetail.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useWorkflows.ts`, `useWorkflowExecution.ts`)
- **Utilities**: camelCase (e.g., `tauri.ts`, `sync.ts`)
- **Types**: PascalCase (e.g., `WorkflowExecution`, `HttpRequest`)
- **Constants**: SCREAMING_SNAKE_CASE or camelCase depending on context

#### Rust
- **Files**: snake_case (e.g., `http_request.rs`, `plugin_events.rs`, `query_manager.rs`)
- **Modules**: snake_case directories with `mod.rs` or single files
- **Structs/Enums**: PascalCase (e.g., `HttpRequest`, `WorkflowExecution`)
- **Functions**: snake_case (e.g., `send_http_request`, `resolve_environments`)
- **Traits**: PascalCase (e.g., `QueryManagerExt`, `WorkspaceWindowTrait`)
- **Commands**: snake_case with `cmd_` prefix (e.g., `cmd_send_http_request`)

#### Plugins
- **Directory naming**: `{type}-{name}` (e.g., `auth-oauth2`, `template-function-uuid`)
- **Plugin types**: `auth`, `action`, `importer`, `template-function`, `filter`, `themes`

### Crate Naming
- **Pattern**: `yaak-{subsystem}` (e.g., `yaak-models`, `yaak-crypto`, `yaak-templates`)
- **Common crate**: `yaak-common` for shared utilities
- **Platform-specific**: `yaak-mac-window` for macOS-only code

### Database Models
- **Table names**: snake_case plural (e.g., `http_requests`, `workflow_steps`)
- **Model structs**: PascalCase singular (e.g., `HttpRequest`, `WorkflowStep`)
- **Fields**: snake_case (e.g., `workspace_id`, `sort_priority`, `created_at`)

## Architectural Patterns

### Frontend Patterns

#### Component Organization
- **Feature-based**: Components grouped by feature when complex (e.g., `Workflows/`)
- **Flat structure**: Most components in `src-web/components/` root
- **Naming**: Component name matches filename exactly

#### State Management
- **Jotai Atoms**: Global UI state (selected workspace, active environment)
  - Located in: `yaak-models/guest-js/atoms.ts`
- **TanStack Query**: Server state (API data, caching, invalidation)
  - Query keys: Array-based with entity type and ID (e.g., `['workspace', workspaceId]`)
- **React State**: Local component state with `useState`

#### Routing
- **File-based routing**: Routes defined by file structure in `src-web/routes/`
- **Route parameters**: `$paramName` notation (e.g., `$workspaceId`, `$workflowId`)
- **Generated tree**: Auto-generated `routeTree.gen.ts` from route files
- **Example routes**:
  - `/workspaces/$workspaceId/workflows` - Workflow list
  - `/workspaces/$workspaceId/workflows/$workflowId` - Workflow detail
  - `/workspaces/$workspaceId/workflows/$workflowId/executions/$executionId` - Execution results

#### Hooks Pattern
- **Custom hooks**: Start with `use` prefix, encapsulate logic
- **TanStack Query hooks**: Wrap queries and mutations for specific entities
- **Tauri event hooks**: Listen to backend events and invalidate queries

### Backend Patterns

#### Tauri Commands
- **Location**: All commands in `src-tauri/src/lib.rs`
- **Naming**: `cmd_{action}_{entity}` (e.g., `cmd_send_http_request`, `cmd_execute_workflow`)
- **Attribute**: `#[tauri::command]` macro
- **Error handling**: Return `Result<T, Error>` where Error is serialized to JSON
- **Parameters**: Accept `AppHandle` or `WebviewWindow` for context access

#### Extension Traits
- **QueryManagerExt**: Adds `.db()` method to `AppHandle` and `WebviewWindow`
  - Usage: `window.db().get_workspace(id)?`
- **WorkspaceWindowTrait**: Adds window utilities
  - Methods: `.db()`, `.crypto()`
  - Provides convenient access to shared resources

#### Database Layer
- **Models**: Defined in `yaak-models/src/models.rs`
- **Queries**: Organized in `yaak-models/src/queries/{entity}.rs`
- **Migrations**: SQL files in `yaak-models/migrations/` with timestamp prefix
- **Query Manager**: Extension trait providing database operations
- **Events**: Model changes emit `upserted_model` or `deleted_model` events

#### Plugin Communication Flow
```
Frontend Component
    ↓ invoke()
Tauri Command (lib.rs)
    ↓
Plugin Manager (yaak-plugins)
    ↓ WebSocket
Node.js Runtime (plugin-runtime)
    ↓ Worker Thread
Plugin Code (plugins/*)
```

### Module Organization

#### Rust Crate Structure
- **lib.rs**: Public API, re-exports
- **mod.rs**: Module definition (for multi-file modules)
- **{feature}.rs**: Single-file modules for specific features
- **Visibility**: Use `pub` sparingly, prefer private implementation

#### TypeScript Package Structure
- **src/**: Source files
- **dist/**: Built output (git-ignored)
- **package.json**: Dependencies, scripts, exports
- **tsconfig.json**: TypeScript configuration

## Code Placement Rules

### When to Create a New File

#### Frontend
- **New component**: Create `{ComponentName}.tsx` in `src-web/components/`
- **Complex feature**: Create subdirectory in components (e.g., `Workflows/`)
- **New hook**: Create `use{Name}.ts` in `src-web/hooks/`
- **New utility**: Create in `src-web/lib/`
- **New route**: Create in `src-web/routes/` following file-based routing convention

#### Backend
- **New Tauri command**: Add to `src-tauri/src/lib.rs` with `#[tauri::command]`
- **Complex logic**: Extract to separate file in `src-tauri/src/{feature}.rs`
- **New subsystem**: Create new crate in `src-tauri/yaak-{name}/`
- **Database model**: Add to `yaak-models/src/models.rs`
- **Database queries**: Add to `yaak-models/src/queries/{entity}.rs`

#### Plugins
- **New plugin**: Create `plugins/{type}-{name}/` with package.json and src/
- **Plugin types**: Follow existing patterns (auth, action, importer, template-function, filter, themes)

### When to Modify Existing Files

#### Database Changes
1. Update model in `yaak-models/src/models.rs`
2. Create migration: `npm run migration` (from root)
3. Update queries in `yaak-models/src/queries/`
4. Ensure ts-rs exports are correct (check `#[derive(TS)]`)
5. Run `npm run build` to regenerate TypeScript bindings

#### Adding Tauri Commands
1. Define function in `src-tauri/src/lib.rs` or extract to module
2. Add `#[tauri::command]` attribute
3. Register in `.invoke_handler()` call in `lib.rs`
4. Use in frontend via `invoke('cmd_name', { params })`

#### Frontend-Backend Communication
1. **Frontend → Backend**: Use `invoke()` from `@tauri-apps/api/core`
2. **Backend → Frontend**: Emit Tauri events via `app_handle.emit()`
3. **Frontend listening**: Use `useListenToTauriEvent` hook

## Important File Paths

### Entry Points
- **Frontend**: `/home/ll/develop/yaak/src-web/main.tsx`
- **Backend**: `/home/ll/develop/yaak/src-tauri/src/lib.rs`
- **Plugin Runtime**: `/home/ll/develop/yaak/packages/plugin-runtime/src/index.ts`

### Configuration
- **Root package.json**: `/home/ll/develop/yaak/package.json` (npm workspaces)
- **Rust workspace**: `/home/ll/develop/yaak/src-tauri/Cargo.toml`
- **Tauri configs**: `/home/ll/develop/yaak/src-tauri/tauri.*.conf.json`
- **TypeScript**: `/home/ll/develop/yaak/tsconfig.json`, `/home/ll/develop/yaak/src-web/tsconfig.json`

### Key Source Files
- **HTTP execution**: `/home/ll/develop/yaak/src-tauri/src/http_request.rs`
- **gRPC execution**: `/home/ll/develop/yaak/src-tauri/src/grpc.rs`
- **Template rendering**: `/home/ll/develop/yaak/src-tauri/yaak-templates/src/renderer.rs`
- **Plugin manager**: `/home/ll/develop/yaak/src-tauri/yaak-plugins/src/manager.rs`
- **Sync algorithm**: `/home/ll/develop/yaak/src-tauri/yaak-sync/src/sync.rs`
- **Database models**: `/home/ll/develop/yaak/src-tauri/yaak-models/src/models.rs`
- **Workflow execution**: `/home/ll/develop/yaak/src-tauri/src/workflow_execution/`

### Documentation
- **Project guide**: `/home/ll/develop/yaak/CLAUDE.md`
- **Development setup**: `/home/ll/develop/yaak/DEVELOPMENT.md`
- **README**: `/home/ll/develop/yaak/README.md`
- **Feature specs**: `/home/ll/develop/yaak/specs/`

## Workspace Structure

### npm Workspaces (17 total)
All defined in root `package.json`:
- Core packages: `packages/common-lib`, `packages/plugin-runtime`, `packages/plugin-runtime-types`
- Frontend: `src-web`
- Backend: `src-tauri` + all `src-tauri/yaak-*` crates (have package.json for tooling compatibility)
- Plugins: 30+ in `plugins/` directory

### Cargo Workspaces (16 crates)
All defined in `src-tauri/Cargo.toml`:
- Main app: `yaak-app` (in `src-tauri/`)
- Subsystems: `yaak-crypto`, `yaak-fonts`, `yaak-git`, `yaak-grpc`, `yaak-http`, `yaak-license`, `yaak-mac-window`, `yaak-models`, `yaak-plugins`, `yaak-sse`, `yaak-sync`, `yaak-templates`, `yaak-ws`, `yaak-common`

### Workspace Commands
```bash
# Run command in specific workspace
npm test -w src-web
npm test -w packages/plugin-runtime

# Build all workspaces
npm run build  # runs build in all workspaces with build script

# Parallel builds (uses workspaces-run package)
npm run bootstrap  # runs in parallel
```

## Build Output Locations

### Development
- **Frontend**: Served by Vite dev server (no build output)
- **Backend**: `src-tauri/target/debug/`
- **Plugins**: Individual `dist/` directories in each plugin

### Production
- **App bundle**: Platform-specific in `src-tauri/target/release/bundle/`
- **Frontend bundle**: Embedded in Tauri app
- **Vendored assets**: `src-tauri/vendored/` (generated, not in git)

## Git Ignore Patterns
- `node_modules/` in all workspaces
- `target/` for Rust builds
- `dist/` for built packages
- `src-tauri/vendored/` (regenerated by bootstrap)
- `.tanstack/` (TanStack Router cache)
- IDE-specific files (`.vscode/`, `.idea/`)
