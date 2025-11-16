---
title: Yaak Product Vision
description: "Product overview, target users, core features, and project goals"
inclusion: always
---

# Product Vision

## Project Overview

**Yaak** is a privacy-first, cross-platform desktop API client for testing and developing APIs. It supports REST, GraphQL, gRPC, WebSocket, and Server-Sent Events (SSE).

**Value Proposition**: An offline-first, lightweight, and fast API client built with Tauri, Rust, and React. No telemetry, no VC funding, no cloud lock-in. Designed to stay out of your way while providing everything you need.

**Development Philosophy**: Community-funded through license purchases and GitHub sponsors. Open source but only accepting bug fixes, not new features.

## Target Users

### Primary Users
- **API Developers**: Backend and full-stack developers building and testing REST, GraphQL, and gRPC APIs
- **QA Engineers**: Testing API endpoints across different environments (dev, staging, production)
- **DevOps Engineers**: Testing and debugging service-to-service communication

### User Needs
- Fast, reliable API testing without cloud dependencies
- Privacy-focused tool with no telemetry or data collection
- Offline-first capabilities for secure environments
- Version control integration for team collaboration
- Extensibility through plugins for custom workflows

## Core Features

### API Protocol Support
- **REST/HTTP**: Full HTTP client with support for all methods, headers, request bodies, and response handling
- **GraphQL**: Query editor with syntax highlighting, introspection, and schema validation
- **gRPC**: Dynamic message handling with reflection, supports all streaming modes (unary, client streaming, server streaming, bidirectional)
- **WebSocket**: Connection management with message history and template rendering
- **SSE (Server-Sent Events)**: Real-time event streaming

### Data Organization
- **Workspaces**: Top-level containers for organizing API collections
- **Folders**: Hierarchical organization with nested folder support
- **Environments**: Variable management with inheritance chains for switching between dev/staging/prod
- **Collections**: Import/export from Postman, Insomnia, OpenAPI, Swagger, or cURL

### Security & Privacy
- **Encrypted Secrets**: ChaCha20-Poly1305 encryption for sensitive values
- **OS Keychain Integration**: Secrets stored in macOS Keychain, Windows Credential Manager, Linux Secret Service
- **Authentication Plugins**: OAuth 2.0, JWT, Basic Auth, Bearer Token, API Key, AWS Signature, OAuth 1.0
- **Offline-First**: No cloud synchronization required, all data stored locally
- **No Telemetry**: Zero data collection or external tracking

### Collaboration & Version Control
- **Git Sync**: Two-way sync between SQLite database and YAML files on filesystem
- **Version Control**: Mirror workspaces to filesystem for Git versioning
- **File-Based Sync**: Alternative to Dropbox/cloud sync using local filesystem

### Template System
- **Dynamic Variables**: Insert UUIDs, timestamps, random values, hashes, etc.
- **Environment Variables**: Reference environment values with `{{env.VARIABLE}}`
- **Template Functions**: Extensible function system (encode, hash, JSON path, XML path, regex, etc.)
- **Workflow Variables**: Reference previous workflow step data with `{{workflow.step[N].response.*}}`

### Test Workflows (Sequential Request Chains)
- **Multi-Step Testing**: Chain HTTP/gRPC requests for end-to-end API testing
- **Data Passing**: Use response data from previous steps in subsequent requests
- **Environment Integration**: Select environments at execution time
- **Execution History**: Track workflow runs with detailed step results
- **Error Handling**: Automatic halt on first failure with detailed error reporting

### Extensibility
- **Plugin System**: Two-tier architecture (Rust manager + Node.js runtime)
- **Plugin Types**: Authentication, Actions (copy cURL/grpcurl), Importers, Template Functions, Filters, Themes
- **30+ Built-in Plugins**: Including OAuth, JWT, timestamp, UUID, hash, JSONPath, XPath, and more
- **Custom Themes**: Built-in themes or create your own

### Developer Experience
- **Response Inspection**: Syntax highlighting, filtering, JSONPath/XPath querying
- **Code Generation**: Export requests as cURL commands
- **Cookie Management**: Automatic cookie jar with persistence
- **Proxy Support**: HTTP/HTTPS/SOCKS proxy configuration
- **TLS Configuration**: Custom certificates, skip verification options

## Key Problems Solved

1. **Privacy Concerns**: Unlike cloud-based alternatives (Postman, Insomnia), Yaak keeps all data local with no telemetry
2. **Performance**: Native Rust backend provides fast request execution and low memory footprint
3. **Vendor Lock-in**: File-based sync and open formats prevent lock-in to proprietary cloud platforms
4. **Complex Authentication**: Plugin-based auth system supports OAuth 2.0, JWT, AWS Signature, and custom flows
5. **Team Collaboration**: Git sync enables version control and code review workflows for API collections
6. **API Testing Workflows**: Sequential workflow execution for end-to-end testing scenarios
7. **Protocol Diversity**: Single tool for REST, GraphQL, gRPC, WebSocket, and SSE (no need for multiple clients)

## Product Goals

### Current State
- Stable desktop application for macOS, Linux, and Windows
- Comprehensive API protocol support (REST, GraphQL, gRPC, WebSocket, SSE)
- Extensible plugin system with 30+ built-in plugins
- File-based sync for version control integration
- Test workflow feature for sequential request execution

### Maintenance Focus
- **Bug Fixes Only**: No new features being accepted (per contribution policy)
- **Stability**: Focus on reliability and performance optimization
- **Security**: Keep dependencies updated, maintain encryption standards
- **Documentation**: Improve user guides and technical documentation

### Long-Term Vision
- Community-driven bug fixes and stability improvements
- Sustainable development through license sales and sponsorships
- Maintain privacy-first, offline-first principles
- Keep the application lightweight and performant
