# Workflow UI Components

This directory contains the React components for the visual workflow canvas editor, providing a node-based interface for creating and managing API test workflows.

## Architecture Overview

```
WorkflowEditor (root container)
├── Header (breadcrumbs + actions)
│   └── Breadcrumbs
├── RequestsPanel (left sidebar)
└── WorkflowCanvas (main editor area)
    ├── Toolbar (undo/redo, layout, zoom)
    │   ├── IconButton
    │   └── Divider
    ├── NodeLibrarySidebar (node picker)
    │   └── NodeLibraryCard
    ├── ReactFlow Canvas
    │   ├── BaseNode (custom nodes)
    │   └── SequentialEdge (custom edges)
    ├── PropertiesPanel (right sidebar)
    │   ├── PanelHeader
    │   ├── Form Fields (TextField, SelectField, etc.)
    │   └── PanelFooter
    └── ContextMenu (right-click menus)
```

## Key Components

### WorkflowCanvas.tsx
The main canvas component that orchestrates the entire workflow editing experience.

**Features:**
- ReactFlow integration for node-based editing
- Drag-and-drop node creation from library
- Multi-select support (Ctrl+Click, box selection)
- Undo/redo with 50-action history
- Auto-layout using Dagre algorithm
- Context menus for nodes, edges, and canvas
- Keyboard shortcuts

**Key Hooks Used:**
- `useNodesState`, `useEdgesState` from ReactFlow
- `useUndoRedo` for undo/redo stack
- `useAutoLayout` for Dagre-based layout
- `useLayoutTools` for alignment and distribution
- `useContextMenu` for context menu state
- `useKeyboardShortcuts` for keyboard handling

**Example Usage:**
```tsx
import { WorkflowCanvas } from './WorkflowCanvas';

function App() {
  return <WorkflowCanvas workflow={workflow} />;
}
```

### Header.tsx
Top header with breadcrumbs and action buttons.

**Props:**
- `workflow` - Current workflow object
- `onSave` - Save callback
- `onExecute` - Execute workflow callback
- `onExport` - Export callback (optional)
- `onNew` - Create new workflow callback (optional)

### Toolbar.tsx
Horizontal toolbar with canvas control buttons.

**Props:**
- `workflowId` - Current workflow ID
- `onUndo`, `onRedo` - Undo/redo callbacks
- `onFitView`, `onZoomIn`, `onZoomOut` - Zoom controls
- `onAutoLayout` - Auto-layout callback
- `onAlign*`, `onDistribute*` - Alignment callbacks
- `canUndo`, `canRedo` - Enable/disable state
- `zoom` - Current zoom level (%)
- `selectedCount` - Number of selected nodes

### ContextMenu.tsx
Reusable context menu component.

**Props:**
- `items` - Array of MenuItem objects
- `position` - `{ x, y }` in viewport coordinates
- `onClose` - Close callback

**MenuItem Interface:**
```typescript
interface MenuItem {
  icon?: string;      // Emoji or icon character
  label: string;      // Display text
  shortcut?: string;  // Keyboard shortcut hint
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;   // Red styling for destructive actions
}
```

### NodeLibrarySidebar.tsx
Left sidebar with draggable node templates.

**Features:**
- Categorized node list (triggers, actions, logic)
- Search/filter functionality
- Drag-and-drop to canvas
- Visual feedback during drag

### PropertiesPanel.tsx
Right sidebar for configuring selected node.

**Features:**
- Auto-loads node configuration
- Form fields for each property
- Validation and error display
- Save/reset buttons
- Empty state when no node selected

## Hooks

### useUndoRedo
Manages undo/redo stack with circular buffer.

```typescript
const { undo, redo, recordAction, canUndo, canRedo } = useUndoRedo();

// Record an action
recordAction({
  type: 'createNode',
  undo: () => deleteNode(nodeId),
  redo: () => createNode(params),
});
```

### useAutoLayout
Auto-layouts nodes using Dagre algorithm.

```typescript
const { autoLayout } = useAutoLayout();
await autoLayout(nodes, edges);
```

### useLayoutTools
Provides alignment and distribution functions.

```typescript
const { alignNodes, distributeNodes } = useLayoutTools();
await alignNodes(selectedNodes, 'left');
await distributeNodes(selectedNodes, 'horizontal');
```

### useContextMenu
Manages context menu state.

```typescript
const { openNodeMenu, openEdgeMenu, openCanvasMenu, closeMenu, contextMenu } = useContextMenu();
openNodeMenu(event, nodeData);
```

### useKeyboardShortcuts
Registers keyboard shortcut handlers.

```typescript
useKeyboardShortcuts([
  { key: 'Delete', handler: handleDelete, description: 'Delete selected' },
  { key: 'z', ctrl: true, handler: undo, description: 'Undo' },
]);
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Delete/Backspace | Delete selected nodes |
| Escape | Clear selection |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+0 | Reset zoom to 100% |
| Ctrl+A | Select all nodes |
| F | Fit view to all nodes |
| Ctrl+L | Auto-layout workflow |

## State Management

The workflow editor uses a combination of:

1. **Jotai Atoms** for global state:
   - `selectedNodeIdAtom` - Currently selected node
   - `selectedNodeIdsAtom` - Multi-selected nodes
   - `undoStackAtom`, `redoStackAtom` - Undo/redo history
   - `contextMenuAtom` - Context menu state

2. **ReactFlow State** for canvas:
   - `useNodesState` - Node positions and data
   - `useEdgesState` - Edge connections

3. **Tauri Commands** for persistence:
   - `cmd_create_workflow_node`
   - `cmd_delete_workflow_node`
   - `cmd_update_workflow_node`
   - `cmd_create_workflow_edge`
   - `cmd_delete_workflow_edge`

## Common Patterns

### Recording Undoable Actions

```typescript
// After performing an action, record it for undo/redo
const nodeId = await createNode(params);
recordAction({
  type: 'createNode',
  undo: () => deleteNode(nodeId),
  redo: () => createNode(params),
});
```

### Context Menu Integration

```typescript
// In ReactFlow component
<ReactFlow
  onNodeContextMenu={(event, node) => {
    event.preventDefault();
    openNodeMenu(event, node);
  }}
/>

// Render context menu
{contextMenu.type === 'node' && (
  <ContextMenu
    items={getNodeMenuItems()}
    position={contextMenu.position}
    onClose={closeMenu}
  />
)}
```

### Multi-Select Operations

```typescript
// Get selected nodes from atom
const selectedNodeIds = useAtomValue(selectedNodeIdsAtom);

// Perform operation on all selected
const handleAlign = async () => {
  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
  await alignNodes(selectedNodes, 'left');
};
```

## Known Limitations (V1)

1. No parallel step execution (sequential only)
2. No conditional branching (no if/else logic)
3. No loops or retries
4. No automated assertions
5. Clipboard operations (copy/paste) not fully implemented
6. Node duplication not implemented

## Future Enhancements (V2)

- Conditional branching edges
- Loop constructs
- Parallel execution paths
- Copy/paste nodes
- Node templates/snippets
- Collaborative editing
- Version history

## Testing

Components are tested using:
- Vitest for unit tests (hooks)
- React Testing Library for component tests
- Manual testing for integration and visual verification

See `specs/workflow-ui-refactor/TESTING.md` for manual testing checklist.

## Related Files

- **Models**: `src-tauri/yaak-models/src/models.rs` (Workflow, WorkflowNode, WorkflowEdge)
- **Atoms**: `src-tauri/yaak-models/guest-js/atoms.ts`
- **Types**: `./types.ts`
- **Specs**: `specs/workflow-ui-refactor/`
