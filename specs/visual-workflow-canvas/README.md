# Visual Workflow Canvas - Comprehensive Strategic Plan

## Overview

This directory contains the complete strategic plan for transforming Yaak's existing test-workflows feature into a full-featured visual workflow canvas. This represents a massive expansion from the current basic horizontal flowchart into a professional visual workflow builder with drag-and-drop node placement, diverse node types, properties panel, and enhanced execution capabilities.

## Project Status

- **Phase**: Planning Complete
- **Start Date**: TBD
- **Estimated Duration**: 3-6 months
- **Complexity**: High
- **Team Size**: 1-3 developers

## Documentation Structure

### 1. [requirements.md](./requirements.md)
**Complete functional and non-functional requirements**

Contains:
- 20 detailed user stories (US-VC-1 through US-VC-20)
- 10 functional requirement sections (FR-VC-1 through FR-VC-10)
- 5 non-functional requirement sections (NFR-VC-1 through NFR-VC-5)
- Success criteria (12 measurable goals)
- Out of scope items (V1 limitations)
- Backward compatibility strategy

**Key Features Specified**:
- Visual node placement on 2D canvas
- Pan and zoom with minimap
- Node library with 11 node types (Triggers, Actions, Logic Control)
- Properties panel with dynamic forms
- Bezier curve connections
- Conditional branching (IF/ELSE)
- Loop execution (count and array-based)
- Parallel execution
- Undo/redo with 50-action history
- Box selection and multi-select
- Comprehensive keyboard shortcuts
- Real-time execution progress visualization
- Workflow validation
- Export/import as JSON
- Migration from existing workflows

**Read This First**: Understanding requirements is essential for all team members.

---

### 2. [design.md](./design.md)
**Complete technical architecture and implementation design**

Contains:
- Detailed architecture diagrams
- Complete database schema (4 new tables)
- Rust data models with TypeScript exports
- Execution engine design (graph builder, orchestrator)
- Enhanced template system with new syntax
- 15 new Tauri commands with signatures
- Frontend component hierarchy
- State management architecture (Jotai atoms)
- ReactFlow integration patterns
- Undo/redo system design
- Migration strategy from old workflows

**Sections**:
1. Architecture Overview
2. Database Schema (SQL + indexes)
3. Rust Models (11 structs with enums)
4. Graph Builder & Validator
5. Execution Orchestrator (sequential, parallel, conditional, loop)
6. Frontend Architecture (React + ReactFlow)
7. State Management (Jotai)
8. Undo/Redo System
9. Template System Extensions
10. Tauri Commands (15 new commands)
11. Migration from Old Workflow Steps

**Read This**: Developers implementing backend or frontend should study this deeply.

---

### 3. [visual-design.md](./visual-design.md)
**Pixel-perfect visual specifications**

Contains:
- Complete color system (hex codes for all colors)
- Typography specifications (font sizes, weights, line heights)
- Spacing system (grid, margins, paddings)
- Detailed node specifications (dimensions, states, icons)
- Edge specifications (types, colors, animations)
- Sidebar specifications (node library, properties panel)
- Toolbar specifications (buttons, controls)
- Animation specifications (transitions, easing, keyframes)
- Responsive behavior rules
- Accessibility guidelines (focus, contrast, keyboard)
- Dark/light mode support
- Loading and error states

**Sections**:
1. Color System (50+ colors defined)
2. Typography (font stacks, sizes, weights)
3. Spacing System (grid, spacing scale)
4. Node Specifications (anatomy, dimensions, states, icons)
5. Edge Specifications (types, states, animations)
6. Sidebar Specifications (dimensions, layouts)
7. Toolbar Specifications (buttons, controls)
8. Animation Specifications (timing, easing)
9. Responsive Behavior
10. Accessibility
11. Dark Mode Support
12. Loading States
13. Error States
14. Empty States

**Read This**: UI/UX designers and frontend developers implementing components.

---

### 4. [tasks.md](./tasks.md)
**Complete implementation roadmap with 400+ tasks**

Contains:
- 23 implementation phases
- 400+ individual tasks organized hierarchically
- Dependency relationships between tasks
- Testing requirements for each phase
- Estimated complexity markers

**Phases Overview**:
1. Foundation & Setup (DB migration, models, dependencies)
2. Graph Builder & Validator
3. Enhanced Execution Engine
4. Template System Extensions
5. Tauri Commands (15 new commands)
6. Frontend State Management (Jotai atoms)
7. ReactFlow Canvas Integration
8. Custom Node Components (11 types)
9. Custom Edge Components (4 types)
10. Node Library Sidebar
11. Properties Panel (dynamic forms)
12. Toolbar
13. Execution Progress Visualization
14. Keyboard Shortcuts (15+ shortcuts)
15. Undo/Redo System
16. Box Selection & Multi-Select
17. Context Menus (node, edge, canvas)
18. Validation UI
19. Export/Import UI
20. Migration Tool
21. Testing & Polish (unit, integration, manual QA)
22. Documentation (user guide, API docs)
23. Deployment

**Read This**: Project managers for planning, developers for task breakdown.

---

### 5. [risks-and-mitigation.md](./risks-and-mitigation.md)
**Comprehensive risk analysis with mitigation strategies**

Contains:
- 30+ identified risks across 8 categories
- Impact/probability/severity ratings
- Detailed mitigation strategies for each risk
- Testing approaches for validation
- Fallback plans for critical risks
- Risk priority matrix

**Risk Categories**:
1. **Technical Risks** (5 risks)
   - ReactFlow performance with large graphs
   - Graph cycle detection false positives
   - Parallel execution race conditions
   - Template variable resolution performance
   - Monaco Editor bundle size

2. **UX Risks** (4 risks)
   - Learning curve too steep
   - Accidental node deletion
   - Viewport disorientation
   - Unclear execution order

3. **Integration Risks** (3 risks)
   - Breaking changes to existing workflows
   - Template system incompatibility
   - Environment variable resolution conflicts

4. **Performance Risks** (2 risks)
   - Database slow with many nodes/edges
   - Execution performance degradation

5. **Reliability Risks** (2 risks)
   - Execution state corruption
   - Tauri IPC communication failures

6. **Security Risks** (2 risks)
   - Template injection attacks
   - SQL injection in database nodes

7. **Compatibility Risks** (2 risks)
   - Browser compatibility issues
   - OS-specific issues

8. **Maintenance Risks** (2 risks)
   - Technical debt accumulation
   - Breaking changes from dependencies

**Read This**: All team members should review risks relevant to their work. Project lead should monitor risk matrix throughout development.

---

## Quick Start Guide

### For Project Managers
1. Read: `README.md` (this file)
2. Read: `requirements.md` (understand scope)
3. Read: `tasks.md` (plan sprints)
4. Review: `risks-and-mitigation.md` (priority 1-2 risks)

### For Backend Developers (Rust)
1. Read: `requirements.md` (FR-VC sections)
2. Study: `design.md` (sections 1-5, 9-10)
3. Review: `tasks.md` (Phases 1-5)
4. Check: `risks-and-mitigation.md` (Technical risks)

**Focus Areas**:
- Database migration
- Graph builder & validator
- Execution orchestrator
- Template system extensions
- Tauri commands

### For Frontend Developers (React)
1. Read: `requirements.md` (US-VC stories)
2. Study: `design.md` (sections 6-8)
3. Study: `visual-design.md` (all sections)
4. Review: `tasks.md` (Phases 6-20)
5. Check: `risks-and-mitigation.md` (UX risks)

**Focus Areas**:
- ReactFlow integration
- Custom node components
- Properties panel
- State management
- Keyboard shortcuts

### For UI/UX Designers
1. Read: `requirements.md` (US-VC stories)
2. Study: `visual-design.md` (all sections)
3. Review: `tasks.md` (Phase 21.5 - UI Polish)
4. Check: `risks-and-mitigation.md` (UX risks)

**Focus Areas**:
- Visual consistency
- Interaction design
- Accessibility
- User testing

### For QA Engineers
1. Read: `requirements.md` (success criteria)
2. Review: `tasks.md` (Phase 21 - Testing)
3. Study: `risks-and-mitigation.md` (all testing sections)

**Focus Areas**:
- Manual testing scenarios
- Integration testing
- Performance testing
- Migration testing

---

## Key Decisions

### 1. Library Choice: ReactFlow
**Decision**: Use ReactFlow for canvas rendering
**Rationale**:
- Mature, well-maintained library
- Built-in pan/zoom/minimap
- Customizable nodes/edges
- Performance optimized (tested with 1000+ nodes)
- MIT license (compatible with Yaak)

**Alternative Considered**: Custom implementation
**Rejected Because**: Too much effort for features ReactFlow provides out-of-box

---

### 2. Parallel Data Systems
**Decision**: Keep old `workflow_steps` and new `workflow_nodes` systems coexisting
**Rationale**:
- Zero risk of breaking existing workflows
- Gradual migration path
- Users can choose preferred UI
- Easy rollback if issues

**Migration Path**:
- V1: Both systems available, opt-in to canvas per workflow
- V2: Canvas default, old UI opt-in
- V3: Remove old UI (12+ months later)

---

### 3. Execution Model: Graph-Based
**Decision**: Use graph traversal instead of simple sequential execution
**Rationale**:
- Supports conditional branching
- Supports loops
- Supports parallel execution
- More flexible for future enhancements

**Trade-off**: More complex implementation, but necessary for advanced features

---

### 4. State Management: Jotai
**Decision**: Continue using Jotai (already in Yaak)
**Rationale**:
- Consistent with existing codebase
- Atomic state updates
- Derived atoms for computed values
- Good TypeScript support

**Alternative Considered**: Zustand, Redux
**Rejected Because**: Jotai already works well in Yaak

---

### 5. Code Editor: Monaco
**Decision**: Use Monaco Editor for code fields
**Rationale**:
- Industry-standard (VSCode uses it)
- Excellent syntax highlighting
- Autocomplete support
- Good TypeScript integration

**Trade-off**: Large bundle size (~2-3 MB), mitigated by lazy loading

---

## Implementation Strategy

### Phase 1: Backend First (Phases 1-5)
**Duration**: 3-4 weeks
**Goal**: Complete backend infrastructure before frontend work

**Deliverables**:
- Database migrated
- Rust models defined
- Graph builder working
- Execution engine enhanced
- Tauri commands implemented

**Why Backend First**:
- Frontend depends on backend APIs
- Easier to test backend in isolation
- Can demo with simple UI

---

### Phase 2: Core Canvas (Phases 6-9)
**Duration**: 3-4 weeks
**Goal**: Basic canvas functionality working

**Deliverables**:
- ReactFlow integrated
- Node components rendering
- Edge components rendering
- Drag-drop working
- State management in place

**Demo Goal**: Can create and visualize workflows

---

### Phase 3: Properties & Execution (Phases 10-13)
**Duration**: 3-4 weeks
**Goal**: Full workflow configuration and execution

**Deliverables**:
- Properties panel working
- All node types configurable
- Toolbar functional
- Execution visualization working

**Demo Goal**: Can configure and execute complex workflows

---

### Phase 4: Polish & Launch (Phases 14-23)
**Duration**: 4-6 weeks
**Goal**: Production-ready feature

**Deliverables**:
- Keyboard shortcuts
- Undo/redo
- Context menus
- Validation
- Export/import
- Migration tool
- Testing complete
- Documentation complete

**Launch Goal**: Public release with migration path for existing workflows

---

## Success Metrics

### User Adoption
- **Target**: 80% of workflow users migrate to canvas within 3 months
- **Measure**: Track workflow.canvas_enabled flag

### User Satisfaction
- **Target**: NPS score > 8/10
- **Measure**: In-app survey after first workflow execution

### Performance
- **Target**: 60 FPS pan/zoom with 100+ nodes
- **Measure**: Chrome DevTools FPS counter

### Reliability
- **Target**: <0.1% execution failures (non-user-error)
- **Measure**: Track execution_state = failed with error analysis

### Completeness
- **Target**: All 12 success criteria from requirements.md met
- **Measure**: Manual checklist verification

---

## Dependencies

### External Libraries (npm)
- `reactflow` (^11.0.0) - Canvas rendering
- `@monaco-editor/react` (^4.0.0) - Code editor
- `jsonpath-plus` (^7.0.0) - JSONPath template function
- `dagre` (optional) - Auto-layout algorithm

### Existing Yaak Systems
- Tauri IPC framework
- SQLite database
- Template rendering system
- HTTP/gRPC execution engines
- Plugin system (for Email, Database actions)
- Environment variable system

### Development Tools
- Rust toolchain (already installed)
- Node.js & npm (already installed)
- ts-rs for TypeScript generation
- Tauri CLI

---

## Testing Strategy

### Unit Tests (Rust)
- Graph builder validation logic
- Execution orchestrator
- Template rendering
- Query functions

**Coverage Target**: >80%

### Integration Tests (Rust + Frontend)
- Full workflow creation flow
- Execution with conditionals
- Execution with loops
- Execution with parallel
- Migration from old workflows
- Export/import round-trip

**Coverage Target**: Critical paths tested

### Manual QA
- Test all node types
- Test all interactions (drag, click, keyboard)
- Test on all 3 OS (macOS, Windows, Linux)
- Test with 100+ node workflows
- Test migration with real user data

**Checklist**: 50+ test scenarios documented in tasks.md

### Performance Testing
- Benchmark with 100, 500, 1000 node workflows
- Measure FPS during pan/zoom
- Profile memory usage
- Measure execution times

**Benchmarks**: Documented in risks-and-mitigation.md

---

## Rollout Plan

### Beta (Week 1-2)
- Release to 10-20 beta users
- Monitor for critical bugs
- Gather qualitative feedback
- Fix high-priority issues

### Soft Launch (Week 3-4)
- Release to all users, opt-in per workflow
- Migration tool available
- Documentation published
- Monitor error rates

### Full Launch (Week 5+)
- Canvas enabled by default for new workflows
- Encourage migration via in-app prompts
- Deprecation notice for old UI (12 months)
- Monitor adoption metrics

---

## Communication Plan

### Internal
- Weekly standup: Share progress on phases
- Bi-weekly demo: Show working features
- Slack channel: #workflow-canvas for async discussion
- Documentation: Keep design docs updated

### External (Users)
- Beta announcement: Invite testers
- Release notes: Detailed changelog
- User guide: Comprehensive tutorial
- Video walkthrough: Screen recording demo
- Blog post: Feature announcement
- Discord announcement: Community engagement

---

## Maintenance Plan

### Post-Launch Support (First 3 Months)
- **Bug Fixes**: Weekly releases for critical bugs
- **Feature Tweaks**: Monthly releases for UX improvements
- **Migration Support**: Help users migrate complex workflows
- **Performance Tuning**: Monitor and optimize slow operations

### Long-Term (3+ Months)
- **Feature Enhancements**: Based on user feedback
  - Workflow templates marketplace
  - Nested subflows
  - Debugging tools (breakpoints)
  - AI-assisted workflow creation
- **Deprecation of Old UI**: Remove after 12 months if adoption high
- **Plugin System**: Allow custom node types

---

## Open Questions

1. **Pricing/Licensing**: Is this feature available to all users or premium only?
   - **Decision Needed**: Product manager
   - **Impact**: May affect rollout strategy

2. **Cloud Sync**: Should workflows sync across devices?
   - **Current**: Local only
   - **Future**: Potential cloud sync feature
   - **Impact**: Database schema may need user_id field

3. **Collaboration**: Multi-user editing?
   - **V1**: Single-user only
   - **Future**: Real-time collaboration (like Figma)
   - **Impact**: Significant architecture changes

4. **Versioning**: Workflow version history?
   - **V1**: No versioning, just current state
   - **Future**: Git-like version control
   - **Impact**: Database schema changes

---

## Contact & Ownership

- **Feature Owner**: [TBD - assign product manager]
- **Tech Lead**: [TBD - assign senior developer]
- **Designer**: [TBD - assign UI/UX designer]
- **QA Lead**: [TBD - assign QA engineer]

---

## References

### Internal Documentation
- `CLAUDE.md` - Yaak project overview
- `specs/test-workflows/` - Existing workflows implementation
- `src-tauri/yaak-models/` - Database models
- `src-web/components/Workflows/` - Current workflow UI

### External Resources
- [ReactFlow Documentation](https://reactflow.dev/)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [JSONPath Specification](https://goessner.net/articles/JsonPath/)
- [Dagre Layout Algorithm](https://github.com/dagrejs/dagre)

---

## Changelog

- **2025-01-15**: Initial planning complete, all specification documents created
- **TBD**: Development started
- **TBD**: Beta launch
- **TBD**: Full launch

---

## Appendix: Estimated Effort

### By Role

**Backend Developer (Rust)**:
- Phases 1-5: 80-120 hours (3-4 weeks)

**Frontend Developer (React)**:
- Phases 6-20: 200-300 hours (8-12 weeks)

**UI/UX Designer**:
- Visual design refinement: 20-30 hours (1 week)
- User testing: 10-20 hours (ongoing)

**QA Engineer**:
- Phase 21: 40-60 hours (2-3 weeks)

**Project Manager**:
- Planning, coordination, rollout: 20-30 hours (ongoing)

### Total Effort
- **Minimum**: 370 hours (~2.5 months for 1 person)
- **Realistic**: 550 hours (~3.5 months for 1 person)
- **With Team**: 2-3 months with 2-3 developers

---

This comprehensive strategic plan provides everything needed to implement the visual workflow canvas feature successfully. All stakeholders should review relevant sections and provide feedback before development begins.

**Next Steps**:
1. Review all documents
2. Assign team members
3. Confirm timeline
4. Begin Phase 1 implementation
