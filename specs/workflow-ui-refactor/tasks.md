# Workflow UI Refactor - Implementation Tasks

## Overview

This document provides a comprehensive, ordered task list for implementing the Workflow UI refactor. Tasks are organized by logical phases and numbered in dependency order.

**Legend:**
- **Complexity**: S (Simple: 1-2h), M (Medium: 2-4h), C (Complex: 4-8h)
- **Priority**: H (High: Must have), M (Medium: Should have), L (Low: Nice to have)
- **Status**: ⏳ Pending | 🏗️ In Progress | ✅ Complete

---

## Phase 1: Setup & Infrastructure (Week 1)

### 1.1 Tailwind and Theme Configuration

#### Task 1: Update Tailwind Config with n8n Colors
- **Files**: `src-web/tailwind.config.cjs`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: None
- **Description**: Add n8n-inspired color palette to Tailwind theme
- **Acceptance Criteria**:
  - [x] Colors added: n8n-primary, n8n-dark, n8n-canvas, n8n-success, n8n-error, n8n-warning
  - [x] Node type colors added: node-trigger, node-action, node-logic
  - [x] Box shadows added: shadow-node, shadow-node-hover, shadow-context-menu
  - [x] Animation keyframes added: pulse-error
  - [x] Config validated with `npm run build`

#### Task 2: Create CSS Variables and Global Styles
- **Files**: `src-web/main.css`, `src-web/components/Workflows/reactflow-theme.css`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: Task 1
- **Description**: Define CSS custom properties and ReactFlow overrides
- **Acceptance Criteria**:
  - [x] CSS variables defined in :root selector
  - [x] ReactFlow classes customized (.react-flow__node, .react-flow__edge, etc.)
  - [x] Selection box styling applied
  - [x] Handle styling (ports) customized
  - [x] Import in main.tsx verified

#### Task 3: Create Utility Functions
- **Files**: `src-web/lib/cn.ts`, `src-web/lib/workflow-icons.ts`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: None
- **Description**: Create classname utility and icon mapping helpers
- **Acceptance Criteria**:
  - [x] cn() function created using clsx and tailwind-merge
  - [x] getNodeIcon() function returns emoji for each node subtype
  - [x] getNodeColor() function returns color for each node type
  - [x] Functions exported and typed

### 1.2 TypeScript Types and Atoms

#### Task 4: Extend Jotai Atoms
- **Files**: `src-tauri/yaak-models/guest-js/atoms.ts`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: None
- **Description**: Add new atoms for multi-select, viewport, and context menus
- **Acceptance Criteria**:
  - [x] selectedNodeIdsAtom created (array of strings)
  - [x] canvasViewportAtom created (x, y, zoom)
  - [x] contextMenuAtom created (type, position, data)
  - [x] Derived atom selectedNodeAtom works correctly
  - [x] All atoms properly typed

#### Task 5: Create TypeScript Interfaces
- **Files**: `src-web/components/Workflows/types.ts`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: None
- **Description**: Define shared interfaces for components
- **Acceptance Criteria**:
  - [x] MenuItem interface (icon, label, shortcut, onClick, disabled, danger)
  - [x] ContextMenuType type ('node' | 'edge' | 'canvas')
  - [x] FormFieldProps interface (label, value, onChange, hint, required, icon)
  - [x] NodeStateData interface (isSelected, isExecuting, hasError, errorMessage)
  - [x] All interfaces exported

---

## Phase 2: Core Hooks Implementation (Week 1-2)

### 2.1 Undo/Redo System

#### Task 6: Implement useUndoRedo Hook
- **Files**: `src-web/hooks/useUndoRedo.ts`
- **Complexity**: C
- **Priority**: H
- **Dependencies**: None
- **Description**: Create undo/redo state management with action stack
- **Acceptance Criteria**:
  - [x] undo() function implemented
  - [x] redo() function implemented
  - [x] recordAction() function implemented
  - [x] Action interface defined (type, undo, redo)
  - [x] Stack limited to 50 actions (circular buffer)
  - [x] Redo stack clears on new action after undo
  - [x] canUndo and canRedo computed correctly

#### Task 7: Unit Tests for useUndoRedo
- **Files**: `src-web/hooks/__tests__/useUndoRedo.test.ts`
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 6
- **Description**: Write comprehensive tests for undo/redo functionality
- **Acceptance Criteria**:
  - [ ] Test: Record action and undo
  - [ ] Test: Redo after undo
  - [ ] Test: Redo stack clears on new action
  - [ ] Test: Stack limited to 50 actions
  - [ ] Test: Async undo/redo operations
  - [ ] All tests pass

### 2.2 Multi-Select System

#### Task 8: Implement useMultiSelect Hook
- **Files**: `src-web/hooks/useMultiSelect.ts`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 4
- **Description**: Create multi-select state management
- **Acceptance Criteria**:
  - [x] toggleSelect() with Ctrl key support
  - [x] selectMultiple() for box selection
  - [x] clearSelection() function
  - [x] selectAll() function
  - [x] Uses selectedNodeIdsAtom
  - [x] Properly typed

#### Task 9: Unit Tests for useMultiSelect
- **Files**: `src-web/hooks/__tests__/useMultiSelect.test.ts`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 8
- **Description**: Test multi-select behavior
- **Acceptance Criteria**:
  - [ ] Test: Toggle select adds/removes nodes
  - [ ] Test: Ctrl+Click accumulates selection
  - [ ] Test: Click without Ctrl replaces selection
  - [ ] Test: Clear selection empties array
  - [ ] All tests pass

### 2.3 Layout Algorithms

#### Task 10: Implement useAutoLayout Hook
- **Files**: `src-web/hooks/useAutoLayout.ts`
- **Complexity**: C
- **Priority**: H
- **Dependencies**: None (verify dagre is installed)
- **Description**: Create auto-layout using Dagre algorithm
- **Acceptance Criteria**:
  - [x] autoLayout() function accepts nodes and edges
  - [x] Creates dagre graph with correct config (rankdir: LR, nodesep: 150, ranksep: 200)
  - [x] Calculates positions for all nodes
  - [x] Batch updates to database with Promise.all
  - [x] Returns promise that resolves when complete
  - [x] Handles empty workflow gracefully

#### Task 11: Implement useLayoutTools Hook
- **Files**: `src-web/hooks/useLayoutTools.ts`
- **Complexity**: C
- **Priority**: M
- **Dependencies**: None
- **Description**: Create alignment and distribution tools
- **Acceptance Criteria**:
  - [x] alignNodes() supports: left, right, top, bottom, centerH, centerV
  - [x] distributeNodes() supports: horizontal, vertical
  - [x] Minimum 2 nodes required for alignment
  - [x] Minimum 3 nodes required for distribution
  - [x] Batch database updates
  - [x] All operations properly typed

#### Task 12: Unit Tests for Layout Hooks
- **Files**: `src-web/hooks/__tests__/useAutoLayout.test.ts`, `src-web/hooks/__tests__/useLayoutTools.test.ts`
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 10, Task 11
- **Description**: Test layout algorithms
- **Acceptance Criteria**:
  - [ ] Test: Auto-layout positions nodes left-to-right
  - [ ] Test: Align left moves all nodes to same X
  - [ ] Test: Distribute horizontal spaces evenly
  - [ ] Test: Edge cases (empty, single node, two nodes)
  - [ ] All tests pass

### 2.4 Additional Hooks

#### Task 13: Implement useContextMenu Hook
- **Files**: `src-web/hooks/useContextMenu.ts`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 4
- **Description**: Manage context menu state
- **Acceptance Criteria**:
  - [x] openNodeMenu() function
  - [x] openEdgeMenu() function
  - [x] openCanvasMenu() function
  - [x] closeMenu() function
  - [x] Uses contextMenuAtom
  - [x] Position calculated from mouse event
  - [x] Menu data includes relevant context (node, edge)

#### Task 14: Implement useKeyboardShortcuts Hook
- **Files**: `src-web/hooks/useKeyboardShortcuts.ts`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: None
- **Description**: Enhance existing keyboard shortcuts hook
- **Acceptance Criteria**:
  - [x] Supports Ctrl, Shift, Alt modifiers
  - [x] Prevents default browser behavior
  - [x] Handles key combos (Ctrl+Shift+Z)
  - [x] Cleanup on unmount
  - [x] Configurable enable/disable
  - [x] Already exists, just verify/enhance

---

## Phase 3: Layout & Structure Components (Week 2)

### 3.1 Header Component

#### Task 15: Create Header Component
- **Files**: `src-web/components/Workflows/Header.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 1, Task 2
- **Description**: Build dark header bar with breadcrumbs and actions
- **Acceptance Criteria**:
  - [x] Height: 60px, background: #1e2b3c
  - [x] Breadcrumbs: workspace > workflows > {workflow.name}
  - [x] Action buttons: New, Export, Save, Execute
  - [x] User section: Notifications, Help, Avatar
  - [x] Buttons have hover state (bg-white/25)
  - [x] Links navigate correctly
  - [x] Save and Execute call provided callbacks

#### Task 16: Create Breadcrumbs Subcomponent
- **Files**: `src-web/components/Workflows/Breadcrumbs.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 15
- **Description**: Extract breadcrumbs for reusability
- **Acceptance Criteria**:
  - [x] Renders link chain with separators
  - [x] Uses TanStack Router Link
  - [x] Hover state on links
  - [x] Current page (last item) not clickable
  - [x] Proper spacing and typography

### 3.2 Toolbar Component

#### Task 17: Create Toolbar Component
- **Files**: `src-web/components/Workflows/Toolbar.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 1, Task 6, Task 8, Task 10, Task 11
- **Description**: Build toolbar with undo/redo, layout tools, zoom display
- **Acceptance Criteria**:
  - [x] Height: 48px, border-bottom
  - [x] Undo/Redo buttons with disabled states
  - [x] Auto-layout button
  - [x] Alignment buttons (enabled when 2+ selected)
  - [x] Zoom percentage display
  - [x] Selection count display
  - [x] Tooltips on all buttons
  - [x] Icon buttons properly styled

#### Task 18: Create IconButton Subcomponent
- **Files**: `src-web/components/Workflows/IconButton.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 17
- **Description**: Reusable icon button with tooltip
- **Acceptance Criteria**:
  - [x] Props: icon, onClick, disabled, tooltip
  - [x] Size: 32px × 32px
  - [x] Hover state
  - [x] Disabled state (opacity 0.5, cursor not-allowed)
  - [x] Tooltip on hover (after 500ms delay)
  - [x] Accessible (aria-label)

#### Task 19: Create Divider Component
- **Files**: `src-web/components/Workflows/Divider.tsx`
- **Complexity**: S
- **Priority**: L
- **Dependencies**: None
- **Description**: Vertical divider for toolbar
- **Acceptance Criteria**:
  - [x] Width: 1px, height: 24px
  - [x] Background: border color
  - [x] Margin: 0 8px

---

## Phase 4: Node Library Enhancement (Week 2)

### 4.1 Sidebar Styling

#### Task 20: Enhance NodeLibrarySidebar Styling
- **Files**: `src-web/components/Workflows/NodeLibrarySidebar.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 1, Task 2
- **Description**: Update existing sidebar to match n8n design
- **Acceptance Criteria**:
  - [x] Width: 280px
  - [x] Background: #f0f4f9
  - [x] Tabs have active underline animation
  - [x] Search box has focus ring
  - [x] Category headers are collapsible
  - [x] Collapse state persists in localStorage
  - [x] "No results" message for empty search

#### Task 21: Enhance NodeLibraryCard Styling
- **Files**: `src-web/components/Workflows/NodeLibraryCard.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 20
- **Description**: Add hover lift effect and improved styling
- **Acceptance Criteria**:
  - [x] Card: 2-column grid, 12px gap
  - [x] Hover: -translateY(-3px), shadow-lg, border-primary
  - [x] Icon: 24px, centered
  - [x] Name: 0.8rem, font-semibold
  - [x] Description: Truncated or hidden
  - [x] Active cursor: grabbing during drag
  - [x] Drag data: nodeType, nodeSubtype

### 4.2 Tab System

#### Task 22: Implement Tab Animation
- **Files**: `src-web/components/Workflows/NodeLibrarySidebar.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 20
- **Description**: Add smooth underline animation to active tab
- **Acceptance Criteria**:
  - [x] Active tab: blue underline (3px height)
  - [x] Underline: 60% width, centered
  - [x] Transition: 200ms ease
  - [x] Click switches tabs smoothly
  - [x] Content switches without flash

---

## Phase 5: Properties Panel Refactor (Week 2-3)

### 5.1 Form Field Components

#### Task 23: Create TextField Component
- **Files**: `src-web/components/Workflows/FormFields/TextField.tsx`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: Task 1
- **Description**: Reusable text input with label and hint
- **Acceptance Criteria**:
  - [x] Props: label, value, onChange, placeholder, hint, required, icon
  - [x] Label with icon support
  - [x] Required indicator (red asterisk)
  - [x] Focus ring (border-primary, ring-primary/20)
  - [x] Hint text below input
  - [x] Proper TypeScript types

#### Task 24: Create TextAreaField Component
- **Files**: `src-web/components/Workflows/FormFields/TextAreaField.tsx`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: Task 23
- **Description**: Multi-line text input
- **Acceptance Criteria**:
  - [x] Similar to TextField but textarea element
  - [x] Rows prop for height
  - [x] Auto-resize option (future)
  - [x] Monospace font for code

#### Task 25: Create SelectField Component
- **Files**: `src-web/components/Workflows/FormFields/SelectField.tsx`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: Task 23
- **Description**: Dropdown select input
- **Acceptance Criteria**:
  - [x] Props: label, value, onChange, options, hint
  - [x] Options array: { value, label }[]
  - [x] Styled select element
  - [x] Focus state
  - [x] Disabled state

#### Task 26: Create NumberField Component
- **Files**: `src-web/components/Workflows/FormFields/NumberField.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 23
- **Description**: Number input with min/max
- **Acceptance Criteria**:
  - [x] Props: min, max, step
  - [x] Validation on blur
  - [x] Increment/decrement buttons (optional)
  - [x] Integer or float support

#### Task 27: Create CheckboxField Component
- **Files**: `src-web/components/Workflows/FormFields/CheckboxField.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 23
- **Description**: Checkbox with label
- **Acceptance Criteria**:
  - [x] Props: label, checked, onChange, hint
  - [x] Checkmark icon when checked
  - [x] Focus ring on keyboard nav
  - [x] Label is clickable

#### Task 28: Create CodeField Component
- **Files**: `src-web/components/Workflows/FormFields/CodeField.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 23
- **Description**: Code editor using CodeMirror or Monaco
- **Acceptance Criteria**:
  - [x] Props: value, onChange, language, height
  - [x] Syntax highlighting for JSON, JavaScript
  - [x] Line numbers
  - [x] Minimal UI (no minimap)
  - [x] Focus state
  - [x] Template variable autocomplete (future)

### 5.2 Properties Panel Enhancement

#### Task 29: Refactor PropertiesPanel Component
- **Files**: `src-web/components/Workflows/PropertiesPanel.tsx`
- **Complexity**: C
- **Priority**: H
- **Dependencies**: Task 23-28, Task 4
- **Description**: Rebuild properties panel with new form components
- **Acceptance Criteria**:
  - [x] Uses new FormField components
  - [x] Dynamic config based on nodeSubtype
  - [x] Unsaved changes detection
  - [x] "Save Changes" button appears when dirty
  - [x] Form validation before save
  - [x] Empty state when no node selected
  - [ ] Loading state during save

#### Task 30: Create PanelHeader Subcomponent
- **Files**: `src-web/components/Workflows/PanelHeader.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 3
- **Description**: Header with node icon and name
- **Acceptance Criteria**:
  - [x] Icon from getNodeIcon()
  - [x] Node name (formatted)
  - [x] Subtitle: "Configure parameters"
  - [x] Border-bottom separator

#### Task 31: Create PanelFooter Subcomponent
- **Files**: `src-web/components/Workflows/PanelFooter.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: None
- **Description**: Footer with Save/Cancel buttons
- **Acceptance Criteria**:
  - [x] Two buttons: Save (primary), Cancel (secondary)
  - [x] Save button disabled when saving
  - [x] Loading spinner during save
  - [x] Border-top separator

#### Task 32: Implement Form Validation
- **Files**: `src-web/lib/workflow-validation.ts`, `src-web/components/Workflows/PropertiesPanel.tsx`
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 29
- **Description**: Add validation rules for node configurations
- **Acceptance Criteria**:
  - [x] Required field validation
  - [x] URL format validation
  - [x] Number range validation
  - [x] Template syntax validation (basic)
  - [x] Error messages display below fields
  - [x] Save disabled when validation fails

---

## Phase 6: Canvas and Node Enhancements (Week 3)

### 6.1 Custom Node Components

#### Task 33: Enhance BaseNode Component
- **Files**: `src-web/components/Workflows/nodes/BaseNode.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 1, Task 2, Task 3
- **Description**: Rebuild base node with modern styling and states
- **Acceptance Criteria**:
  - [x] Size: 100×100px, rounded-xl
  - [x] Header: 30px, colored background (per node type)
  - [x] Body: Centered icon/content
  - [x] States: normal, selected, disabled, error, executing
  - [x] Selected: border-primary, shadow-lg
  - [x] Error: border-danger, pulse animation, error icon
  - [x] Disabled: opacity-60, grayscale, "Disabled" badge
  - [x] Executing: Loading spinner
  - [x] Hover: lift effect (-translateY-1)

#### Task 34: Add Error Tooltip to Node
- **Files**: `src-web/components/Workflows/nodes/BaseNode.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 33
- **Description**: Show error message on hover
- **Acceptance Criteria**:
  - [x] Tooltip appears on mouseenter when hasError
  - [x] Tooltip hides on mouseleave
  - [x] Tooltip: red background, white text, arrow pointer
  - [x] Max width: 200px
  - [x] Position: below node, centered
  - [x] Z-index: 50

#### Task 35: Add Port Styling and Highlighting
- **Files**: `src-web/components/Workflows/nodes/BaseNode.tsx`, `src-web/components/Workflows/reactflow-theme.css`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 33
- **Description**: Style input/output ports (handles) with connection drag states
- **Acceptance Criteria**:
  - [x] Size: 12px circle
  - [x] Background: white, border: 2px primary
  - [x] Hover: scale(1.3), blue background, glow shadow (0 0 8px rgba(44, 119, 223, 0.5))
  - [x] Connecting state: blue background, scale(1.3), pulsing animation
  - [x] Valid connection hover: pulse animation (portPulse keyframes)
  - [x] Position: Left (input), Right (output)
  - [x] Transition: all 0.2s for smooth animation
  - [x] CSS class .react-flow__handle-connecting for active connection drag
  - [x] CSS class .react-flow__handle-valid for valid target hover

### 6.2 Custom Edge Components

#### Task 36: Enhance SequentialEdge Component
- **Files**: `src-web/components/Workflows/edges/SequentialEdge.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 1
- **Description**: Style edge with error and selected states
- **Acceptance Criteria**:
  - [x] Normal: 2px solid gray (#94a3b8)
  - [x] Selected: 3px solid blue (#2c77df)
  - [x] Error: 2px dashed red (#f75a5a)
  - [x] Smooth bezier curves
  - [x] End marker: small circle
  - [x] Optional: Execution time label

#### Task 37: Create Edge Type Registry
- **Files**: `src-web/components/Workflows/edges/index.ts`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 36
- **Description**: Export edge types for ReactFlow
- **Acceptance Criteria**:
  - [x] edgeTypes object with 'sequential', 'parallel', 'conditional', 'loop'
  - [x] All map to appropriate edge components
  - [x] Properly typed

### 6.3 WorkflowCanvas Integration

#### Task 37.5: Implement Drag Connection Animation
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`, `src-web/components/Workflows/reactflow-theme.css`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 35, Task 36
- **Description**: Implement real-time bezier curve animation during connection drag
- **Acceptance Criteria**:
  - [x] ReactFlow config includes connectionLineType: ConnectionLineType.Bezier
  - [x] connectionLineStyle sets stroke: #2c77df, strokeWidth: 2, strokeDasharray: '5,3'
  - [x] Temporary connection line follows cursor in real-time as bezier curve
  - [x] Connection line renders as smooth curve from output port to cursor position
  - [x] isValidConnection function prevents self-connections (source !== target)
  - [x] All valid input ports highlight when connection drag starts
  - [x] Cursor shows "grabbing" effect during drag
  - [x] Temporary line disappears immediately on release
  - [x] Escape key cancels connection and removes temporary line
  - [x] Connection line has pointer-events: none (doesn't block mouse)
  - [x] Port highlighting removed when drag ends
  - [x] Smooth animation (no lag or jitter during mouse movement)

#### Task 38: Integrate Undo/Redo into Canvas
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 6, Task 17
- **Description**: Wire undo/redo hook to canvas operations
- **Acceptance Criteria**:
  - [ ] recordAction() called on: createNode, deleteNode, moveNode, createEdge, deleteEdge
  - [ ] Each action has undo and redo functions
  - [ ] Undo/redo buttons in toolbar trigger actions
  - [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z) work
  - [ ] Stack size limited to 50

#### Task 39: Integrate Multi-Select into Canvas
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 8, Task 17
- **Description**: Enable multi-select with Ctrl+Click and box selection
- **Acceptance Criteria**:
  - [ ] ReactFlow props: multiSelectionKeyCode='Control', selectionOnDrag=true, selectionMode='partial'
  - [ ] onSelectionChange updates selectedNodeIdsAtom
  - [ ] Toolbar shows selection count
  - [ ] Delete key deletes all selected nodes
  - [ ] Properties panel shows "Multiple nodes selected" state

#### Task 40: Integrate Auto-Layout into Canvas
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: Task 10, Task 17
- **Description**: Wire auto-layout button to algorithm
- **Acceptance Criteria**:
  - [ ] Toolbar auto-layout button calls useAutoLayout hook
  - [ ] Nodes animate to new positions (300ms transition)
  - [ ] Operation recorded in undo stack
  - [ ] Loading state during layout calculation
  - [ ] Works with empty workflow (no-op)

#### Task 41: Integrate Alignment Tools into Canvas
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 11, Task 17
- **Description**: Wire alignment buttons to functions
- **Acceptance Criteria**:
  - [ ] Alignment buttons enabled when 2+ nodes selected
  - [ ] Each button calls correct alignment function
  - [ ] Nodes animate to aligned positions
  - [ ] Operations recorded in undo stack

#### Task 42: Add Enhanced Keyboard Shortcuts
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 14, Task 6, Task 8, Task 10
- **Description**: Wire all keyboard shortcuts
- **Acceptance Criteria**:
  - [ ] Delete/Backspace: Delete selected nodes
  - [ ] Escape: Clear selection
  - [ ] Ctrl+Z: Undo
  - [ ] Ctrl+Shift+Z: Redo
  - [ ] Ctrl+0: Reset zoom
  - [ ] Ctrl+A: Select all
  - [ ] F: Fit view
  - [ ] Ctrl+L: Auto-layout
  - [ ] All shortcuts prevent default browser behavior

---

## Phase 7: Context Menus (Week 3)

### 7.1 Context Menu Component

#### Task 43: Create ContextMenu Component
- **Files**: `src-web/components/Workflows/ContextMenu.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 1, Task 13
- **Description**: Build reusable context menu with keyboard support
- **Acceptance Criteria**:
  - [ ] Props: items (MenuItem[]), position ({x, y}), onClose
  - [ ] Renders at absolute position
  - [ ] Click outside closes menu
  - [ ] Escape key closes menu
  - [ ] Click item executes action and closes
  - [ ] Items show icon, label, shortcut
  - [ ] Disabled items have opacity-50, not clickable
  - [ ] Danger items have text-danger

#### Task 44: Create MenuItem Interface
- **Files**: `src-web/components/Workflows/types.ts`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: None
- **Description**: Define MenuItem type
- **Acceptance Criteria**:
  - [ ] Fields: icon, label, shortcut?, onClick, disabled?, danger?
  - [ ] Exported from types.ts
  - [ ] Used by ContextMenu component

### 7.2 Context Menu Hooks and Integration

#### Task 45: Wire Node Context Menu
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 43, Task 13
- **Description**: Add right-click menu to nodes
- **Acceptance Criteria**:
  - [ ] Right-click node opens menu
  - [ ] Menu items: Copy, Delete, Execute, Rename, Disable, History
  - [ ] Copy node to clipboard (future: just log for now)
  - [ ] Delete calls deleteNode()
  - [ ] Execute runs single node (future: just log)
  - [ ] Rename prompts for new name, updates database
  - [ ] Disable toggles node.disabled
  - [ ] History shows execution history (future: just log)
  - [ ] Menu positioned at cursor

#### Task 46: Wire Edge Context Menu
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 43, Task 13
- **Description**: Add right-click menu to edges with all n8n features
- **Acceptance Criteria**:
  - [ ] Right-click edge opens menu
  - [ ] Menu items: Delete Connection, Select Output Branch, Add Conditional Jump
  - [ ] Delete Connection calls deleteEdge() and removes from UI
  - [ ] Select Output Branch shows branch selector (V2: log for now)
  - [ ] Add Conditional Jump opens condition editor (V2: log for now)
  - [ ] Menu positioned at cursor (click position)
  - [ ] Edge visually selected when menu open
  - [ ] Keyboard shortcut shown: "Del" for Delete Connection
  - [ ] Keyboard shortcut shown: "Ctrl+B" for Select Branch

#### Task 47: Wire Canvas Context Menu
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 43, Task 13
- **Description**: Add right-click menu to empty canvas
- **Acceptance Criteria**:
  - [ ] Right-click empty canvas opens menu
  - [ ] Menu items: Paste, Create, Align Left, Align Right, Distribute, Run All
  - [ ] Paste pastes clipboard nodes (future: just log)
  - [ ] Create node (future: show node picker)
  - [ ] Alignment items (if 2+ selected)
  - [ ] Run All executes workflow
  - [ ] Menu positioned at cursor

---

## Phase 8: Visual Polish & Animations (Week 3-4)

### 8.1 Hover and Transition Effects

#### Task 48: Add Node Hover Animations
- **Files**: `src-web/components/Workflows/nodes/BaseNode.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 33
- **Description**: Enhance hover effects with smooth transitions
- **Acceptance Criteria**:
  - [ ] Hover: -translateY(-5px) in 200ms
  - [ ] Shadow: shadow-md → shadow-xl transition
  - [ ] Border: transparent → primary (if not selected)
  - [ ] Cursor: pointer
  - [ ] Smooth transition-all

#### Task 49: Add Card Hover Effects
- **Files**: `src-web/components/Workflows/NodeLibraryCard.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 21
- **Description**: Enhance node card hover
- **Acceptance Criteria**:
  - [ ] Hover: -translateY(-3px)
  - [ ] Shadow: shadow → shadow-lg
  - [ ] Border: border → border-primary
  - [ ] Transition: 200ms ease-out
  - [ ] Active (drag): cursor-grabbing

#### Task 50: Add Button Hover States
- **Files**: `src-web/components/Workflows/Header.tsx`, `src-web/components/Workflows/Toolbar.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 15, Task 17
- **Description**: Add smooth hover transitions to all buttons
- **Acceptance Criteria**:
  - [ ] Header buttons: bg-white/15 → bg-white/25
  - [ ] Toolbar buttons: bg-transparent → bg-primary-light
  - [ ] Transition: 200ms
  - [ ] Scale: 1 → 1.05 on hover (subtle)

### 8.2 Loading States

#### Task 51: Add Loading States to Properties Panel
- **Files**: `src-web/components/Workflows/PropertiesPanel.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 29
- **Description**: Show spinner during save
- **Acceptance Criteria**:
  - [ ] Save button shows spinner when saving
  - [ ] Save button disabled during save
  - [ ] Text changes: "Save" → "Saving..."
  - [ ] Success feedback: Brief "Saved!" message (2s)

#### Task 52: Add Loading State to Auto-Layout
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 40
- **Description**: Show feedback during layout calculation
- **Acceptance Criteria**:
  - [ ] Auto-layout button shows spinner when running
  - [ ] Button disabled during layout
  - [ ] Toast notification: "Organizing workflow..." → "Layout complete!"
  - [ ] Nodes animate to new positions smoothly

#### Task 53: Add Skeleton Loading for Canvas
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: L
- **Dependencies**: None
- **Description**: Show skeleton state while workflow loads
- **Acceptance Criteria**:
  - [ ] Skeleton nodes in grid pattern
  - [ ] Pulsing animation
  - [ ] Replaces empty state during load
  - [ ] Disappears when nodes load

### 8.3 Empty States

#### Task 54: Enhance Canvas Empty State
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: None
- **Description**: Improve empty state message and styling
- **Acceptance Criteria**:
  - [ ] Large icon (emoji or SVG)
  - [ ] Headline: "Create your workflow"
  - [ ] Instructions: "Drag nodes from the library..."
  - [ ] Centered in canvas
  - [ ] Friendly, approachable tone

#### Task 55: Enhance Properties Panel Empty State
- **Files**: `src-web/components/Workflows/PropertiesPanel.tsx`
- **Complexity**: S
- **Priority**: M
- **Dependencies**: Task 29
- **Description**: Improve empty state when no node selected
- **Acceptance Criteria**:
  - [ ] Icon: 📝 or similar
  - [ ] Headline: "No Node Selected"
  - [ ] Message: "Select a node to configure..."
  - [ ] Centered vertically and horizontally
  - [ ] Subtle text color

---

## Phase 9: Integration and Testing (Week 4)

### 9.1 End-to-End Integration

#### Task 56: Integrate Header into WorkflowEditor
- **Files**: `src-web/components/Workflows/WorkflowEditor.tsx`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: Task 15
- **Description**: Add Header component to editor layout
- **Acceptance Criteria**:
  - [ ] Header at top of editor
  - [ ] Receives workflow prop
  - [ ] Save/Execute callbacks wired to existing functions
  - [ ] Breadcrumbs navigate correctly
  - [ ] User menu functional (if applicable)

#### Task 57: Integrate Toolbar into WorkflowCanvas
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: S
- **Priority**: H
- **Dependencies**: Task 17, Task 38-42
- **Description**: Add Toolbar to canvas layout
- **Acceptance Criteria**:
  - [ ] Toolbar below Header (or at top of canvas section)
  - [ ] All buttons wired to hooks
  - [ ] Disabled states reflect hook state (canUndo, canRedo)
  - [ ] Zoom display updates on canvas zoom
  - [ ] Selection count updates on selection change

#### Task 58: Wire All Context Menus
- **Files**: `src-web/components/Workflows/WorkflowCanvas.tsx`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 45-47
- **Description**: Ensure all context menus work together
- **Acceptance Criteria**:
  - [ ] Right-click node, edge, canvas shows correct menu
  - [ ] Only one menu open at a time
  - [ ] All menu actions execute correctly
  - [ ] Menus close on click outside, Escape, action
  - [ ] Menu positioning handles edge of screen

#### Task 59: Test Multi-Select with All Features
- **Files**: N/A (integration testing)
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 39, Task 41, Task 45
- **Description**: Verify multi-select works with all operations
- **Acceptance Criteria**:
  - [ ] Ctrl+Click adds nodes to selection
  - [ ] Box selection works
  - [ ] Delete removes all selected
  - [ ] Alignment works on selection
  - [ ] Undo/redo works with multi-select operations
  - [ ] Context menu shows on multi-select (first selected node)

#### Task 60: Test Undo/Redo with All Operations
- **Files**: N/A (integration testing)
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 38, Task 6
- **Description**: Verify undo/redo works for all canvas operations
- **Acceptance Criteria**:
  - [ ] Undo create node removes it
  - [ ] Undo delete node restores it
  - [ ] Undo move node restores position
  - [ ] Undo create edge removes it
  - [ ] Undo auto-layout restores positions
  - [ ] Undo alignment restores positions
  - [ ] Redo reverses undo for all operations
  - [ ] Stack limited to 50 actions

### 9.2 Manual Testing

#### Task 61: Create Manual Testing Checklist
- **Files**: `specs/workflow-ui-refactor/TESTING.md`
- **Complexity**: M
- **Priority**: H
- **Dependencies**: All previous tasks
- **Description**: Comprehensive manual testing checklist
- **Acceptance Criteria**:
  - [ ] Checklist covers all user stories
  - [ ] Includes visual verification (screenshots)
  - [ ] Includes interaction testing (clicks, drags, keyboard)
  - [ ] Includes edge cases (empty workflow, 50+ nodes, error states)
  - [ ] Includes browser compatibility (Chrome, Firefox, Safari)
  - [ ] Includes accessibility testing (keyboard nav, screen reader)

#### Task 62: Execute Manual Testing
- **Files**: N/A (testing activity)
- **Complexity**: C
- **Priority**: H
- **Dependencies**: Task 61
- **Description**: Run through manual testing checklist
- **Acceptance Criteria**:
  - [ ] All visual design checks pass
  - [ ] All interaction checks pass
  - [ ] All feature checks pass
  - [ ] All edge case checks pass
  - [ ] All browser compatibility checks pass
  - [ ] All accessibility checks pass
  - [ ] Document all bugs found

#### Task 63: Fix Critical Bugs
- **Files**: Various
- **Complexity**: Variable
- **Priority**: H
- **Dependencies**: Task 62
- **Description**: Fix bugs found during manual testing
- **Acceptance Criteria**:
  - [ ] All "blocker" bugs fixed
  - [ ] All "critical" bugs fixed
  - [ ] "Major" bugs fixed or documented for future
  - [ ] Re-test after fixes

### 9.3 Performance Testing

#### Task 64: Test with 50+ Nodes
- **Files**: N/A (testing activity)
- **Complexity**: M
- **Priority**: H
- **Dependencies**: Task 62
- **Description**: Create large workflow and test performance
- **Acceptance Criteria**:
  - [ ] Create workflow with 50 nodes
  - [ ] Drag nodes: maintains 60 FPS
  - [ ] Zoom/pan: smooth, no lag
  - [ ] Auto-layout: completes in < 2s
  - [ ] Undo/redo: completes in < 100ms
  - [ ] No memory leaks during 30-minute session

#### Task 65: Optimize Performance Issues
- **Files**: Various
- **Complexity**: Variable
- **Priority**: M
- **Dependencies**: Task 64
- **Description**: Fix performance issues found
- **Acceptance Criteria**:
  - [ ] Add React.memo to expensive components
  - [ ] Add useMemo to heavy calculations
  - [ ] Add useCallback to event handlers
  - [ ] Debounce expensive operations
  - [ ] All performance criteria met (from requirements)

---

## Phase 10: Documentation and Cleanup (Week 4)

### 10.1 Code Documentation

#### Task 66: Add JSDoc Comments
- **Files**: All component and hook files
- **Complexity**: M
- **Priority**: M
- **Dependencies**: All previous tasks
- **Description**: Document all exported functions and components
- **Acceptance Criteria**:
  - [ ] All components have JSDoc with description, params, returns
  - [ ] All hooks have JSDoc with usage examples
  - [ ] All complex functions have inline comments
  - [ ] All types/interfaces documented
  - [ ] No auto-generated "TODO" comments remain

#### Task 67: Create Component README
- **Files**: `src-web/components/Workflows/README.md`
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 66
- **Description**: Document component architecture and usage
- **Acceptance Criteria**:
  - [ ] Overview of workflow UI architecture
  - [ ] Component hierarchy diagram
  - [ ] Props documentation for major components
  - [ ] Hook usage examples
  - [ ] Common patterns and gotchas
  - [ ] Link to feature specs

### 10.2 User Documentation

#### Task 68: Create User Guide
- **Files**: `specs/workflow-ui-refactor/USER_GUIDE.md`
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 62
- **Description**: End-user documentation for new UI
- **Acceptance Criteria**:
  - [ ] Introduction to workflow editor
  - [ ] Annotated screenshots of UI sections
  - [ ] Step-by-step tutorials (create workflow, use auto-layout, etc.)
  - [ ] Keyboard shortcuts reference table
  - [ ] Context menu reference
  - [ ] Tips and tricks
  - [ ] Troubleshooting common issues

#### Task 69: Create Migration Guide
- **Files**: `specs/workflow-ui-refactor/MIGRATION.md`
- **Complexity**: S
- **Priority**: L
- **Dependencies**: Task 62
- **Description**: Guide for users upgrading from old UI
- **Acceptance Criteria**:
  - [ ] What's new summary
  - [ ] Feature comparison (old vs. new)
  - [ ] How to migrate workflows (should be automatic)
  - [ ] New features to try
  - [ ] Breaking changes (if any)

### 10.3 Code Cleanup

#### Task 70: Remove Unused Code
- **Files**: Various
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 62
- **Description**: Clean up old/unused components and code
- **Acceptance Criteria**:
  - [ ] Identify components no longer used
  - [ ] Safely remove or archive old components
  - [ ] Remove commented-out code
  - [ ] Remove console.log debugging statements
  - [ ] Remove unused imports
  - [ ] Run linter and fix all warnings

#### Task 71: Code Review and Refactoring
- **Files**: Various
- **Complexity**: M
- **Priority**: M
- **Dependencies**: Task 70
- **Description**: Review all code for quality and consistency
- **Acceptance Criteria**:
  - [ ] All functions have clear, descriptive names
  - [ ] No duplicate code (DRY principle)
  - [ ] Consistent code style (Prettier/ESLint)
  - [ ] No TypeScript `any` types without justification
  - [ ] All error cases handled
  - [ ] All edge cases handled

#### Task 72: Final Build and Verification
- **Files**: N/A (build process)
- **Complexity**: M
- **Priority**: H
- **Dependencies**: All previous tasks
- **Description**: Build production version and verify
- **Acceptance Criteria**:
  - [ ] `npm run build` succeeds with no errors
  - [ ] No TypeScript errors
  - [ ] No ESLint warnings (or justified ignores)
  - [ ] Bundle size reasonable (check with `npm run build` output)
  - [ ] Production build loads and runs correctly
  - [ ] All features work in production build

---

## Summary and Progress Tracking

### Task Summary by Phase

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Setup & Infrastructure | 5 tasks | 10-14 hours |
| Phase 2: Core Hooks | 9 tasks | 24-36 hours |
| Phase 3: Layout & Structure | 7 tasks | 14-20 hours |
| Phase 4: Node Library | 3 tasks | 6-10 hours |
| Phase 5: Properties Panel | 11 tasks | 22-32 hours |
| Phase 6: Canvas & Nodes | 11 tasks (added Task 37.5) | 23-34 hours |
| Phase 7: Context Menus | 5 tasks | 10-16 hours |
| Phase 8: Visual Polish | 8 tasks | 12-18 hours |
| Phase 9: Integration & Testing | 10 tasks | 24-36 hours |
| Phase 10: Documentation | 7 tasks | 14-20 hours |
| **Total** | **73 tasks** | **159-236 hours** |

### Priority Breakdown

- **High Priority (Must Have)**: 46 tasks
- **Medium Priority (Should Have)**: 22 tasks
- **Low Priority (Nice to Have)**: 5 tasks

### Complexity Breakdown

- **Simple (1-2h)**: 28 tasks
- **Medium (2-4h)**: 31 tasks
- **Complex (4-8h)**: 14 tasks

### Critical Path

The following tasks form the critical path and must be completed in order:

1. Task 1: Update Tailwind Config
2. Task 4: Extend Jotai Atoms
3. Task 6: Implement useUndoRedo Hook
4. Task 8: Implement useMultiSelect Hook
5. Task 10: Implement useAutoLayout Hook
6. Task 15: Create Header Component
7. Task 17: Create Toolbar Component
8. Task 23-28: Create Form Field Components
9. Task 29: Refactor PropertiesPanel
10. Task 33: Enhance BaseNode Component
11. Task 38-42: Integrate all features into Canvas
12. Task 43-47: Context Menu system
13. Task 56-60: End-to-end integration
14. Task 62: Execute Manual Testing
15. Task 72: Final Build and Verification

### Recommended Work Order

**Week 1**: Tasks 1-14 (Setup + Core Hooks)
**Week 2**: Tasks 15-32 (Layout Components + Properties Panel)
**Week 3**: Tasks 33-55 (Canvas Enhancements + Polish)
**Week 4**: Tasks 56-72 (Integration + Testing + Documentation)

---

## Notes

### Dependencies to Verify

Before starting, verify these packages are installed:
- `reactflow` (v11.11.4 or compatible)
- `dagre` (for auto-layout)
- `@types/dagre` (TypeScript definitions)
- `clsx` (for classname utility)
- `tailwind-merge` (for Tailwind class merging)
- `@monaco-editor/react` or `@uiw/react-codemirror` (for code editor)

Install if missing:
```bash
npm install dagre @types/dagre clsx tailwind-merge @monaco-editor/react
```

### Testing Strategy

- **Unit Tests**: Write for all hooks (Tasks 7, 9, 12)
- **Component Tests**: Write for major components (as time permits)
- **Integration Tests**: Manual testing with comprehensive checklist (Task 61-62)
- **Performance Tests**: Large workflow testing (Task 64)
- **Accessibility Tests**: Keyboard navigation and screen reader (Task 61)

### Risk Mitigation

**Risk**: ReactFlow performance with 50+ nodes
**Mitigation**: Use React.memo, useMemo, useCallback liberally (Task 65)

**Risk**: Undo/redo memory growth
**Mitigation**: Limit stack to 50 actions, clear old actions (Task 6)

**Risk**: Complex dependencies breaking build
**Mitigation**: Lock dependency versions, test incrementally (Task 72)

**Risk**: Browser compatibility issues
**Mitigation**: Test in all target browsers during Task 62

---

## Completion Criteria

The refactor is **complete** when:

✅ All High Priority tasks are complete
✅ All Must-Have acceptance criteria met
✅ Manual testing checklist passed
✅ Performance criteria met (50+ nodes, 60 FPS, < 100ms operations)
✅ No critical or blocker bugs
✅ Production build succeeds
✅ User guide and migration guide written
✅ Code documented and cleaned up

The refactor is **ready for release** when:

✅ All completion criteria met
✅ Code reviewed by at least one other developer (if applicable)
✅ All Medium Priority tasks complete (or deferred with justification)
✅ Accessibility checklist passed
✅ Cross-browser testing passed
✅ No known regressions in existing functionality

---

**End of Task List**

Ready to begin implementation! Start with Task 1 and work sequentially through dependencies.
