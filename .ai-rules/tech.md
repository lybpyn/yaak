---
title: Yaak Technology Stack
description: "Languages, frameworks, libraries, build tools, and infrastructure"
inclusion: always
---

# Technology Stack

## Primary Languages

### TypeScript/JavaScript
- **Frontend Application**: React 19 with TypeScript (ES2021 target)
- **Plugin Runtime**: Node.js runtime for executing plugins
- **Plugin Development**: 30+ built-in plugins written in TypeScript
- **Tooling**: Build scripts, vendoring utilities, migration generators

### Rust
- **Backend Application**: Tauri backend with 13 custom crates
- **Rust Edition**: 2024
- **Build**: Native compilation with Cargo workspaces
- **Purpose**: HTTP/gRPC execution, database operations, plugin orchestration, encryption, sync

## Frontend Stack

### Core Framework
- **React**: 19.1.0 (latest stable)
- **Bundler**: Vite 7.0.8
- **TypeScript**: 5.8.3 with strict mode and noUncheckedIndexedAccess

### Routing & Navigation
- **TanStack Router**: 1.133.13 (file-based routing)
- **Route Location**: `src-web/routes/` directory
- **Generated Routes**: Auto-generated `routeTree.gen.ts` from file structure

### State Management
- **Jotai**: 2.12.2 (atomic state management)
- **TanStack Query**: 5.90.5 (server state, data fetching, caching)
- **Pattern**: Jotai for global UI state, TanStack Query for server state synced via Tauri events

### UI & Styling
- **Tailwind CSS**: 3.4.17 with custom configuration
- **PostCSS**: 8.5.6 with nesting support
- **Icons**: Lucide React 0.525.0
- **Animations**: Motion 12.4.7 (Framer Motion successor)
- **Color Picker**: react-colorful 5.6.1

### Code Editors
- **CodeMirror**: 6.x for primary code editing
  - Languages: JavaScript, JSON, Markdown, XML
  - Extensions: Emacs, Vim, VSCode keybindings
  - Features: Search, syntax highlighting, autocomplete
- **Monaco Editor**: 4.7.0 (for workflow canvas and advanced editing)
- **GraphQL**: cm6-graphql 0.2.1 with schema validation
- **JSON Schema**: codemirror-json-schema 0.6.1

### Specialized Libraries
- **Drag & Drop**: @dnd-kit/core 6.3.1
- **Virtualization**: @tanstack/react-virtual 3.13.12 (for large lists)
- **PDF Rendering**: react-pdf 10.0.1
- **Markdown**: react-markdown 10.1.0 with remark-gfm and frontmatter support
- **Syntax Highlighting**: react-syntax-highlighter 15.6.1
- **Graph Visualization**: ReactFlow 11.11.4 (for workflow canvas), dagre 0.8.5 (graph layout)
- **JSONPath**: jsonpath-plus 10.3.0

### Tauri Integration
- **Tauri API**: @tauri-apps/api 2.9.0
- **Plugins**: clipboard-manager, dialog, fs, log, opener, os, shell
- **IPC**: Command invocations via `src-web/lib/tauri.ts` wrapper
- **Events**: Tauri event listeners for model updates

## Backend Stack

### Tauri Framework
- **Tauri**: 2.9.0 with devtools and protocol-asset features
- **Tauri Build**: 2.5.0
- **Plugins**:
  - tauri-plugin-clipboard-manager 2.3.0
  - tauri-plugin-deep-link 2.4.3
  - tauri-plugin-dialog 2.4.0
  - tauri-plugin-fs 2.4.2
  - tauri-plugin-log 2.7.0 (with colored output)
  - tauri-plugin-opener 2.5.0
  - tauri-plugin-os 2.3.1
  - tauri-plugin-shell 2.3.1
  - tauri-plugin-single-instance 2.3.4
  - tauri-plugin-updater 2.9.0
  - tauri-plugin-window-state 2.4.0

### HTTP & Networking
- **HTTP Client**: reqwest 0.12.20 with features: multipart, cookies, gzip, brotli, deflate, json, rustls-tls-manual-roots-no-provider, socks, http2
- **HTTP Types**: http 1.2.0
- **Cookie Store**: reqwest_cookie_store 0.8.0
- **TLS**: rustls 0.23.33, rustls-platform-verifier 0.6.1
- **Async Runtime**: tokio 1.48.0 with sync features
- **Async Streams**: tokio-stream 0.1.17
- **HTTP Utilities**: hyper-util 0.1.17

### gRPC Stack
- **Location**: `src-tauri/yaak-grpc/`
- **Dynamic Messages**: prost-reflect (for runtime protobuf handling)
- **Service Discovery**: gRPC reflection protocol
- **Streaming**: All modes (unary, client streaming, server streaming, bidirectional)

### Database
- **SQLite**: Embedded database (r2d2 connection pooling)
- **Location**: `~/.yaak/db.sqlite` (production), `~/.yaak/dev-db.sqlite` (development)
- **Query Builder**: sea-query for type-safe SQL generation
- **Migrations**: Manual SQL migrations in `src-tauri/yaak-models/migrations/`
- **TypeScript Export**: ts-rs 11.1.0 (auto-generates TypeScript types from Rust models)
- **Bindings Output**: `packages/plugin-runtime-types/src/bindings/`

### Specialized Crates

#### yaak-models
- Database models and schema
- Query manager with extension traits
- Tauri event emission for model changes
- 71KB `models.rs` with all entity definitions

#### yaak-plugins
- WebSocket-based plugin communication
- Plugin lifecycle management (34KB `manager.rs`)
- Routes between Rust backend and Node.js runtime
- Plugin types: Auth, Actions, Importers, Template Functions, Filters, Themes

#### yaak-templates
- Template parser for `{{variable}}` and `{{function()}}` syntax
- Renderer with environment variable resolution
- Native Rust functions (secure, keyring) and plugin-based functions
- Workflow variable resolution: `{{workflow.step[N].response.*}}`

#### yaak-crypto
- ChaCha20-Poly1305 AEAD encryption
- OS keychain integration via keyring 3.6.3
- Per-workspace key management

#### yaak-sync
- Two-way sync between SQLite and YAML files
- Diff calculation and conflict resolution
- Git integration via yaak-git

#### yaak-git
- Git operations with git2 crate
- Vendored libgit2

#### yaak-ws
- WebSocket client implementation
- Connection management with message history

#### yaak-sse
- Server-Sent Events with eventsource-client (forked version)

#### yaak-http
- HTTP utilities and helpers

#### yaak-fonts
- Font handling for the application

#### yaak-mac-window
- macOS-specific window customization

#### yaak-license
- License validation (optional feature)

### Utilities & Helpers
- **Error Handling**: thiserror 2.0.17 for custom error types
- **Serialization**: serde 1.0.228, serde_json 1.0.145
- **Hashing**: sha2 0.10.9, md5 0.8.0, hex 0.4.3
- **UUID**: uuid 1.12.1
- **Random**: rand 0.9.0
- **Time**: chrono 0.4.42
- **MIME**: mime_guess 2.0.5, charset 0.1.5
- **JSON Schema**: jsonschema 0.17

## Plugin System

### Two-Tier Architecture

#### Rust Plugin Manager
- **Location**: `src-tauri/yaak-plugins/`
- **Role**: Orchestrates plugin lifecycle, WebSocket server, event routing
- **Communication**: WebSocket server for bidirectional messaging

#### Node.js Plugin Runtime
- **Location**: `packages/plugin-runtime/`
- **Process**: Separate Node.js process spawned by Rust
- **Execution**: Worker threads for plugin isolation
- **Vendored Binary**: Custom Node.js binary (`vendored/node/yaaknode`)

### Plugin Locations
- **Built-in**: `plugins/` (30+ plugins)
- **Vendored**: `src-tauri/vendored/plugins/` (bundled with app)
- **User-installed**: `~/.yaak/installed-plugins/`

### Plugin Types & Examples
- **Authentication**: auth-oauth2, auth-jwt, auth-bearer, auth-basic, auth-apikey, auth-aws, auth-oauth1
- **Actions**: action-copy-curl, action-copy-grpcurl
- **Importers**: importer-postman, importer-insomnia, importer-openapi, importer-curl, importer-yaak
- **Template Functions**: template-function-timestamp, template-function-uuid, template-function-hash, template-function-json, template-function-xml, template-function-fs, template-function-regex, template-function-random, template-function-prompt, template-function-request, template-function-response, template-function-cookie, template-function-encode
- **Filters**: filter-jsonpath, filter-xpath
- **Themes**: themes-yaak

## Build Tools & Development

### Package Management
- **npm**: Workspace-based monorepo (root `package.json`)
- **Cargo**: Rust workspace (16 crates in `src-tauri/Cargo.toml`)

### Build Commands
```bash
npm install              # Install all npm dependencies
npm run bootstrap        # Setup vendored binaries (Node.js, protoc, plugins)
npm run build            # Build all workspace packages
npm run build-plugins    # Build plugins only
npm start                # Dev mode with hot reload (frontend only)
npm run app-build        # Production Tauri build
```

### Development Tools
- **Linting**: ESLint 9.29.0 with TypeScript, React, and Prettier plugins
- **Formatting**: Prettier 3.4.2
- **Testing**: Vitest 3.2.4 (configured but not all tests implemented)
- **Type Checking**: TypeScript strict mode with noUncheckedIndexedAccess

### Vendored Dependencies
Generated by `npm run bootstrap`:
- **Node.js binary**: `vendored/node/yaaknode` (for plugin runtime)
- **Protoc binary**: `vendored/protoc/yaakprotoc` (for gRPC compilation)
- **Plugins**: `vendored/plugins/` (pre-built plugin bundles)
- **Plugin runtime**: `vendored/plugin-runtime/` (compiled Node.js runtime)

### Configuration Files
- **TypeScript**: `tsconfig.json` (root), `src-web/tsconfig.json`, workspace-specific configs
- **Tauri**:
  - `src-tauri/tauri.conf.json` (base)
  - `src-tauri/tauri.development.conf.json` (dev overrides)
  - `src-tauri/tauri.release.conf.json` (production)
  - `src-tauri/tauri.linux.conf.json` (Linux-specific)
- **Vite**: `src-web/vite.config.ts` with React, SVGR, WASM, top-level-await plugins
- **Tailwind**: `src-web/tailwind.config.cjs` with custom theme
- **Rust**: `rustfmt.toml` for code formatting

## Infrastructure & External Services

### Local Storage
- **Database**: `~/.yaak/db.sqlite` or `~/.yaak/dev-db.sqlite`
- **Keychain**: OS-specific (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **Plugins**: `~/.yaak/installed-plugins/`
- **Sync**: Optional filesystem sync to YAML files

### No External Services
- No cloud backend
- No telemetry endpoints
- No analytics services
- Fully offline-capable

## Platform Support
- **macOS**: Primary platform with custom window controls (yaak-mac-window)
- **Linux**: Supported with OpenSSL vendored (openssl-sys 0.9.105)
- **Windows**: Supported via Tauri cross-platform capabilities

## Testing Infrastructure

### Current State
- **Vitest**: 3.2.4 configured
- **Test Files**: Some tests in `src-web/hooks/__tests__/` and `src-web/components/Workflows/__tests__/`
- **Coverage**: Partial (workflow feature has test files, but Vitest setup incomplete)
- **Manual Testing**: QA checklist in `specs/test-workflows/MANUAL_TESTING.md`

### Test Execution
```bash
npm test                 # Run all workspace tests
npm test -w src-web      # Run frontend tests
npm test -w packages/plugin-runtime  # Run plugin runtime tests
```

## Version Requirements
- **Node.js**: See `.nvmrc` for required version
- **Rust**: 2024 edition (recent stable toolchain)
- **Operating System**: macOS 10.15+, Windows 10+, or modern Linux distribution
