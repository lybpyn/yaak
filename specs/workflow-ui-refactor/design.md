# Workflow UI Refactor - Technical Design

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Workflow Editor                          │
├─────────────────────────────────────────────────────────────────┤
│  Header Bar (Dark #1e2b3c)                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Breadcrumbs │ Actions │ User Menu                        │   │
│  └──────────────────────────────────────────────────────────┘   │
├────────────┬─────────────────────────────────┬─────────────────┤
│            │                                 │                 │
│  Sidebar   │         Canvas                  │   Properties    │
│  280px     │         flex-1                  │   Panel 320px   │
│            │                                 │                 │
│  ┌───────┐│  ┌─────────────────────────┐    │  ┌────────────┐ │
│  │Tabs   ││  │  Toolbar                │    │  │ Node Info  │ │
│  ├───────┤│  ├─────────────────────────┤    │  ├────────────┤ │
│  │Search ││  │                         │    │  │            │ │
│  ├───────┤│  │     ReactFlow Canvas    │    │  │  Form      │ │
│  │       ││  │                         │    │  │  Controls  │ │
│  │ Node  ││  │  ┌────┐    ┌────┐      │    │  │            │ │
│  │ Cards ││  │  │Node│───▶│Node│      │    │  │            │ │
│  │       ││  │  └────┘    └────┘      │    │  ├────────────┤ │
│  │       ││  │                         │    │  │   Actions  │ │
│  └───────┘│  │  Minimap   Controls     │    │  └────────────┘ │
│            │  └─────────────────────────┘    │                 │
└────────────┴─────────────────────────────────┴─────────────────┘
```

### Component Hierarchy

```
WorkflowEditor
├── Header
│   ├── Breadcrumbs
│   ├── ActionButtons
│   │   ├── NewButton
│   │   ├── ExportButton
│   │   ├── SaveButton
│   │   └── ExecuteButton
│   └── UserSection
│       ├── NotificationButton
│       ├── HelpButton
│       └── UserAvatar
├── WorkflowCanvas (ReactFlowProvider wrapper)
    ├── Toolbar
    │   ├── UndoButton
    │   ├── RedoButton
    │   ├── ZoomDisplay
    │   └── AutoLayoutButton
    ├── NodeLibrarySidebar
    │   ├── SidebarTabs
    │   ├── SearchBox
    │   └── NodeCategoryList
    │       ├── CategoryHeader (collapsible)
    │       └── NodeLibraryCard[] (draggable)
    ├── ReactFlow
    │   ├── Background (grid)
    │   ├── Controls (zoom/pan)
    │   ├── MiniMap
    │   ├── CustomNode[] (WorkflowNode components)
    │   ├── CustomEdge[] (SequentialEdge, etc.)
    │   └── ContextMenus
    │       ├── NodeContextMenu
    │       ├── EdgeContextMenu
    │       └── CanvasContextMenu
    └── PropertiesPanel
        ├── PanelHeader (node info)
        ├── PanelBody (form fields)
        │   ├── CommonFields (name, description)
        │   └── DynamicConfig (per node type)
        └── PanelFooter (save/cancel)
```

### Data Flow Diagram

```
┌──────────────────┐
│  User Interaction│
└────────┬─────────┘
         │
         ├──▶ Drag Node from Library
         │         │
         │         ├─▶ handleDrop()
         │         ├─▶ createNode() hook
         │         ├─▶ Tauri: createModel()
         │         ├─▶ DB: Insert WorkflowNode
         │         ├─▶ Emit: upserted_model event
         │         ├─▶ TanStack Query: Invalidate
         │         └─▶ UI: Re-render with new node
         │
         ├──▶ Move Node
         │         │
         │         ├─▶ handleNodesChange()
         │         ├─▶ ReactFlow: Update position
         │         ├─▶ Debounced patchModel()
         │         └─▶ DB: Update positionX/Y
         │
         ├──▶ Create Edge
         │         │
         │         ├─▶ handleConnect()
         │         ├─▶ createEdge() hook
         │         ├─▶ Tauri: createModel()
         │         └─▶ DB: Insert WorkflowEdge
         │
         ├──▶ Edit Node Config
         │         │
         │         ├─▶ PropertiesPanel form change
         │         ├─▶ Local state update
         │         ├─▶ Click "Save"
         │         ├─▶ patchModel()
         │         └─▶ DB: Update node.config
         │
         ├──▶ Undo/Redo
         │         │
         │         ├─▶ Ctrl+Z / Ctrl+Shift+Z
         │         ├─▶ useUndoRedo hook
         │         ├─▶ Pop from undo/redo stack
         │         ├─▶ Execute reverse operation
         │         └─▶ DB: Restore state
         │
         └──▶ Auto-Layout
                   │
                   ├─▶ Click "Auto Layout"
                   ├─▶ useAutoLayout hook
                   ├─▶ Dagre: Calculate positions
                   ├─▶ Batch patchModel() calls
                   └─▶ Animate transitions

┌──────────────────┐
│   State Flow     │
└──────────────────┘

Database (SQLite)
    ↓ (Tauri Events)
TanStack Query Cache
    ↓ (useQuery hooks)
Jotai Atoms (global UI state)
    ↓ (useAtomValue/useSetAtom)
Component Local State
    ↓ (useState)
ReactFlow State (nodes/edges)
    ↓
Rendered UI
```

### State Management Architecture

**Three-Layer State Model:**

1. **Server State (TanStack Query)**
   - Source of truth: SQLite database
   - Cached in TanStack Query
   - Auto-invalidated on Tauri events
   - Used for: Workflow, WorkflowNode, WorkflowEdge data

2. **Global UI State (Jotai)**
   - selectedNodeId: Currently selected node
   - selectedNodeIds: Multi-select array
   - canvasViewport: Zoom and pan position
   - Used for: Cross-component coordination

3. **Local Component State (React useState)**
   - Form field values (before save)
   - Hover states
   - Menu open/close
   - Used for: Ephemeral UI state

---

## Component Design

### 1. Header Component

**File**: `src-web/components/Workflows/Header.tsx`

```typescript
interface HeaderProps {
  workflow: Workflow;
  onSave: () => Promise<void>;
  onExecute: () => Promise<void>;
  onExport: () => Promise<void>;
  onNew: () => Promise<void>;
}

export function Header({
  workflow,
  onSave,
  onExecute,
  onExport,
  onNew
}: HeaderProps) {
  // Component implementation
}
```

**Styling**:
- Height: `60px`
- Background: `bg-[#1e2b3c]`
- Text: `text-white`
- Padding: `px-6`
- Flexbox: `flex items-center justify-between`

**Sub-components**:

#### Breadcrumbs
```typescript
<div className="flex items-center gap-2 text-sm">
  <Link to="/workspaces/$workspaceId" className="hover:text-blue-300">
    {workspace.name}
  </Link>
  <ChevronRight className="w-4 h-4 text-white/50" />
  <Link to="/workspaces/$workspaceId/workflows" className="hover:text-blue-300">
    Workflows
  </Link>
  <ChevronRight className="w-4 h-4 text-white/50" />
  <span className="text-white/90">{workflow.name}</span>
</div>
```

#### Action Buttons
```typescript
<div className="flex gap-3">
  <button className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition">
    <Plus className="w-4 h-4 mr-2" />
    New
  </button>
  {/* Similar for Export, Save, Execute */}
</div>
```

---

### 2. NodeLibrarySidebar Component

**File**: `src-web/components/Workflows/NodeLibrarySidebar.tsx`

**Current Implementation**: Already exists, needs enhancement

**Required Changes**:
1. Update styling to match n8n design
2. Add tab animation (blue underline slide)
3. Enhance node card hover effects
4. Improve search debouncing

**Enhanced Styling**:

```typescript
// Tab active indicator
className={cn(
  "relative px-4 py-3 cursor-pointer transition",
  isActive && "text-primary",
  "after:absolute after:bottom-0 after:left-[20%] after:w-[60%] after:h-[3px]",
  isActive && "after:bg-primary after:rounded-t"
)}
```

```typescript
// Node card with lift effect
className={cn(
  "bg-white border border-border rounded-lg p-3",
  "cursor-grab transition-all duration-200",
  "hover:shadow-lg hover:-translate-y-1 hover:border-primary",
  "active:cursor-grabbing"
)}
```

**New Features**:
- Category collapse state persistence (localStorage)
- Search result count display
- Keyboard navigation (arrow keys to navigate cards)

---

### 3. PropertiesPanel Component

**File**: `src-web/components/Workflows/PropertiesPanel.tsx`

**Current Implementation**: Exists, needs major enhancements

**Required Changes**:
1. Add Monaco/CodeMirror for code fields
2. Enhance form validation
3. Add unsaved changes detection
4. Improve empty state styling

**Enhanced Structure**:

```typescript
export function PropertiesPanel() {
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);
  const selectedNode = useAtomValue(selectedNodeAtom);
  const [formState, setFormState] = useState<FormState>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Unsaved changes warning
  useEffect(() => {
    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasChanges]);

  // Auto-save on blur (optional)
  const handleBlur = useCallback(() => {
    if (hasChanges) {
      handleSave();
    }
  }, [hasChanges]);

  return (
    <div className="w-80 bg-surface border-l border-border flex flex-col">
      {selectedNode ? (
        <>
          <PanelHeader node={selectedNode} />
          <PanelBody
            node={selectedNode}
            formState={formState}
            onChange={setFormState}
          />
          {hasChanges && (
            <PanelFooter onSave={handleSave} onCancel={handleCancel} />
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
```

**Form Field Components**:

Create reusable field components:

```typescript
// src-web/components/Workflows/FormFields/TextField.tsx
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export function TextField({ label, value, onChange, ...props }: TextFieldProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium">
        {props.icon}
        <span>{label}</span>
        {props.required && <span className="text-danger">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full px-3 py-2 bg-white border border-border rounded-lg
                   focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {props.hint && (
        <p className="text-xs text-text-subtle">{props.hint}</p>
      )}
    </div>
  );
}
```

**Code Editor Integration**:

```typescript
// src-web/components/Workflows/FormFields/CodeField.tsx
import { Editor } from '@monaco-editor/react';

export function CodeField({ value, onChange, language = 'json', ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{props.label}</label>
      <div className="border border-border rounded-lg overflow-hidden">
        <Editor
          height="200px"
          language={language}
          value={value}
          onChange={onChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
```

---

### 4. WorkflowCanvas Component

**File**: `src-web/components/Workflows/WorkflowCanvas.tsx`

**Current Implementation**: Exists, needs enhancements

**Required Changes**:
1. Add multi-select state management
2. Integrate undo/redo system
3. Add context menu handlers
4. Enhance keyboard shortcuts

**Enhanced Implementation**:

```typescript
function WorkflowCanvasInner({ workflow }: WorkflowCanvasInnerProps) {
  const { nodes, edges } = useWorkflowCanvas(workflow.id);
  const { createNode, deleteNode, duplicateNode } = useNodeOperations();
  const { createEdge, deleteEdge } = useEdgeOperations();
  const { undo, redo, canUndo, canRedo, recordAction } = useUndoRedo();
  const { selectedNodeIds, toggleSelect, clearSelection } = useMultiSelect();
  const { autoLayout, alignNodes, distributeNodes } = useLayoutTools();

  // Enhanced drag-drop with multi-select support
  const handleDrop = useCallback((event: React.DragEvent) => {
    // ... existing drop logic
    recordAction({
      type: 'CREATE_NODE',
      nodeId: newNode.id,
      undo: () => deleteNode(newNode.id),
      redo: () => createNode({ ...nodeData }),
    });
  }, []);

  // Multi-select box selection
  const handleSelectionChange = useCallback((params) => {
    if (params.nodes) {
      setSelectedNodeIds(params.nodes.map(n => n.id));
    }
  }, []);

  // Enhanced keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'a',
      ctrl: true,
      handler: () => {
        setSelectedNodeIds(nodes.map(n => n.id));
      },
    },
    {
      key: 'l',
      ctrl: true,
      handler: () => {
        autoLayout();
      },
    },
    // ... more shortcuts
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Toolbar
        onAutoLayout={autoLayout}
        onAlignLeft={() => alignNodes('left')}
        // ... other toolbar actions
      />
      <div className="flex-1 flex">
        <NodeLibrarySidebar />
        <div className="flex-1" onDrop={handleDrop} onDragOver={handleDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onSelectionChange={handleSelectionChange}
            multiSelectionKeyCode="Control"
            selectionOnDrag
            selectionMode="partial"
            // ... other props
          />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}
```

---

### 5. Toolbar Component

**File**: `src-web/components/Workflows/Toolbar.tsx`

**New Component** (currently minimal)

**Full Implementation**:

```typescript
interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onAutoLayout: () => void;
  onAlignLeft: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  onDistributeH: () => void;
  onDistributeV: () => void;
  zoom: number;
  selectedCount: number;
}

export function Toolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAutoLayout,
  selectedCount,
  zoom,
  ...alignmentProps
}: ToolbarProps) {
  return (
    <div className="h-12 border-b border-border bg-surface px-4 flex items-center gap-3">
      {/* Undo/Redo */}
      <div className="flex gap-1">
        <IconButton
          icon={<Undo className="w-4 h-4" />}
          onClick={onUndo}
          disabled={!canUndo}
          tooltip="Undo (Ctrl+Z)"
        />
        <IconButton
          icon={<Redo className="w-4 h-4" />}
          onClick={onRedo}
          disabled={!canRedo}
          tooltip="Redo (Ctrl+Shift+Z)"
        />
      </div>

      <Divider />

      {/* Layout Tools */}
      <IconButton
        icon={<Layout className="w-4 h-4" />}
        onClick={onAutoLayout}
        tooltip="Auto Layout (Ctrl+L)"
      />

      {/* Alignment (enabled when 2+ selected) */}
      {selectedCount >= 2 && (
        <>
          <Divider />
          <div className="flex gap-1">
            <IconButton
              icon={<AlignLeft className="w-4 h-4" />}
              onClick={alignmentProps.onAlignLeft}
              tooltip="Align Left"
            />
            <IconButton
              icon={<AlignRight className="w-4 h-4" />}
              onClick={alignmentProps.onAlignRight}
              tooltip="Align Right"
            />
            {/* More alignment buttons */}
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* Zoom display */}
        <span className="text-sm text-text-subtle">{zoom}%</span>

        {/* Selection count */}
        {selectedCount > 0 && (
          <span className="text-sm text-primary">
            {selectedCount} selected
          </span>
        )}
      </div>
    </div>
  );
}
```

---

### 6. Custom Node Components

**File**: `src-web/components/Workflows/nodes/BaseNode.tsx`

**Enhanced Base Node**:

```typescript
interface BaseNodeProps {
  data: {
    node: WorkflowNode;
    isSelected: boolean;
    isExecuting: boolean;
    hasError: boolean;
    errorMessage?: string;
  };
}

export function BaseNode({ data }: BaseNodeProps) {
  const { node, isSelected, isExecuting, hasError, errorMessage } = data;
  const [showTooltip, setShowTooltip] = useState(false);

  const nodeIcon = getNodeIcon(node.nodeSubtype);
  const nodeColor = getNodeColor(node.nodeType);

  return (
    <div
      className={cn(
        "w-[100px] h-[100px] rounded-xl bg-white shadow-md",
        "border-2 transition-all duration-200",
        isSelected ? "border-primary shadow-lg" : "border-transparent",
        hasError && "border-danger animate-pulse-error",
        node.disabled && "opacity-60 grayscale",
        "hover:-translate-y-1 hover:shadow-xl"
      )}
      onMouseEnter={() => hasError && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Header */}
      <div
        className="h-8 px-2 flex items-center gap-1 rounded-t-xl"
        style={{ backgroundColor: `${nodeColor}20` }}
      >
        <span className="text-base">{nodeIcon}</span>
        <span className="text-xs font-semibold truncate">{node.name}</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center relative">
        {isExecuting ? (
          <Loader className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <span className="text-2xl">{nodeIcon}</span>
        )}

        {hasError && (
          <AlertCircle className="absolute top-1 right-1 w-4 h-4 text-danger" />
        )}

        {node.disabled && (
          <div className="absolute top-1 right-1 px-2 py-0.5 bg-secondary text-white text-[10px] rounded rotate-12">
            Disabled
          </div>
        )}
      </div>

      {/* Ports */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-white !border-2 !border-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white !border-2 !border-primary"
      />

      {/* Error Tooltip */}
      {showTooltip && hasError && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2
                        px-3 py-2 bg-danger/90 text-white rounded-lg text-xs
                        max-w-[200px] z-50 shadow-lg">
          {errorMessage}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2
                          w-2 h-2 bg-danger/90 rotate-45" />
        </div>
      )}
    </div>
  );
}
```

**Node Type Mapping**:

```typescript
// src-web/components/Workflows/nodes/index.ts
import { BaseNode } from './BaseNode';

export const nodeTypes = {
  trigger: BaseNode,
  action: BaseNode,
  logic: BaseNode,
};

// Helper functions
export function getNodeIcon(subtype: string): string {
  const icons: Record<string, string> = {
    manual_trigger: '⚡',
    webhook_trigger: '🌐',
    timer_trigger: '⏰',
    http_request: '🌐',
    grpc_request: '⚡',
    email: '✉️',
    database: '🗄️',
    websocket: '🔌',
    conditional: '❓',
    loop: '🔁',
    parallel: '⚡',
  };
  return icons[subtype] || '📦';
}

export function getNodeColor(nodeType: string): string {
  const colors: Record<string, string> = {
    trigger: '#10b981',   // green
    action: '#8b5cf6',    // purple
    logic: '#f59e0b',     // amber
  };
  return colors[nodeType] || '#6366f1';
}
```

---

### 7. Custom Edge Components

**File**: `src-web/components/Workflows/edges/SequentialEdge.tsx`

**Enhanced Edge**:

```typescript
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';

export function SequentialEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const hasError = data?.hasError;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: hasError ? '#f75a5a' : selected ? '#2c77df' : '#94a3b8',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: hasError ? '5,3' : undefined,
        }}
      />
      {/* Optional: Add label or execution indicator */}
      {data?.executionTime && (
        <text
          x={labelX}
          y={labelY}
          className="text-xs fill-text-subtle"
          textAnchor="middle"
        >
          {data.executionTime}ms
        </text>
      )}
    </>
  );
}
```

---

### 8. Context Menu Components

**File**: `src-web/components/Workflows/ContextMenu.tsx`

**New Component**:

```typescript
interface MenuItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-white rounded-lg shadow-xl border border-border overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          disabled={item.disabled}
          className={cn(
            "w-full px-4 py-2 flex items-center gap-3 transition",
            "hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed",
            item.danger && "text-danger hover:bg-danger/10",
            index < items.length - 1 && "border-b border-border/50"
          )}
        >
          <div className="w-4">{item.icon}</div>
          <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
          {item.shortcut && (
            <span className="text-xs text-text-subtle">{item.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

**Context Menu Hooks**:

```typescript
// src-web/hooks/useContextMenu.ts
export function useContextMenu() {
  const [menu, setMenu] = useState<{
    type: 'node' | 'edge' | 'canvas';
    position: { x: number; y: number };
    data: any;
  } | null>(null);

  const openNodeMenu = useCallback((e: React.MouseEvent, node: WorkflowNode) => {
    e.preventDefault();
    setMenu({
      type: 'node',
      position: { x: e.clientX, y: e.clientY },
      data: node,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  return { menu, openNodeMenu, closeMenu };
}
```

---

## ReactFlow Customization

### Custom Styling

**File**: `src-web/components/Workflows/reactflow-theme.css`

```css
/* Override ReactFlow defaults */
.react-flow__node {
  cursor: pointer;
  user-select: none;
}

.react-flow__node.selected {
  box-shadow: 0 0 0 3px rgba(44, 119, 223, 0.2);
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: #2c77df;
  stroke-width: 3px;
}

.react-flow__controls {
  bottom: 20px;
  right: 20px;
}

.react-flow__controls-button {
  background: white;
  border: 1px solid #e0e6ee;
  width: 44px;
  height: 44px;
  border-radius: 50%;
}

.react-flow__controls-button:hover {
  background: #2c77df;
  color: white;
}

.react-flow__minimap {
  bottom: 20px;
  left: 20px;
  background: white;
  border: 1px solid #e0e6ee;
  border-radius: 8px;
}

.react-flow__background {
  background-color: #f6f9fc;
}

/* Selection box */
.react-flow__selection {
  background: rgba(44, 119, 223, 0.1);
  border: 2px dashed #2c77df;
}

/* Connection line (while dragging) - Temporary bezier curve */
.react-flow__connection-path {
  stroke: #2c77df;
  stroke-width: 2;
  stroke-dasharray: 5, 3;
  fill: none;
  pointer-events: none;
}

/* Handles (Ports) */
.react-flow__handle {
  width: 12px;
  height: 12px;
  background: white;
  border: 2px solid #2c77df;
  transition: all 0.2s;
}

.react-flow__handle:hover {
  background: #2c77df;
  transform: scale(1.3);
  box-shadow: 0 0 8px rgba(44, 119, 223, 0.5);
}

/* Port highlighting during connection drag */
.react-flow__handle-connecting {
  background: #2c77df;
  transform: scale(1.3);
  box-shadow: 0 0 8px rgba(44, 119, 223, 0.5);
  animation: portPulse 1s infinite;
}

.react-flow__handle-valid {
  background: #2c77df;
  transform: scale(1.3);
  box-shadow: 0 0 8px rgba(44, 119, 223, 0.5);
}

/* Port pulse animation during connection drag */
@keyframes portPulse {
  0% {
    box-shadow: 0 0 8px rgba(44, 119, 223, 0.5);
  }
  50% {
    box-shadow: 0 0 12px rgba(44, 119, 223, 0.8);
  }
  100% {
    box-shadow: 0 0 8px rgba(44, 119, 223, 0.5);
  }
}

/* Cursor during connection drag */
.react-flow__pane.dragging {
  cursor: grabbing !important;
}
```

### Configuration Options

```typescript
const reactFlowConfig = {
  // Multi-select
  multiSelectionKeyCode: 'Control',
  selectionOnDrag: true,
  selectionMode: SelectionMode.Partial,

  // Grid
  snapToGrid: true,
  snapGrid: [20, 20] as [number, number],

  // Zoom
  minZoom: 0.1,
  maxZoom: 5,
  defaultZoom: 1,

  // Viewport
  fitView: true,
  fitViewOptions: {
    padding: 0.2,
    includeHiddenNodes: false,
  },

  // Edge options
  defaultEdgeOptions: {
    type: 'sequential',
    animated: false,
    style: { strokeWidth: 2 },
  },

  // Node drag
  nodesDraggable: true,
  nodesConnectable: true,
  elementsSelectable: true,

  // Delete key
  deleteKeyCode: ['Delete', 'Backspace'],

  // Connection line (temporary edge during drag)
  connectionLineType: ConnectionLineType.Bezier,
  connectionLineStyle: {
    stroke: '#2c77df',
    strokeWidth: 2,
    strokeDasharray: '5,3',
  },

  // Connection validation
  isValidConnection: (connection: Connection) => {
    // Prevent self-connections
    return connection.source !== connection.target;
  },
};
```

---

## State Management

### Jotai Atoms

**File**: `src-tauri/yaak-models/guest-js/atoms.ts` (extend existing)

```typescript
// Existing atoms
export const selectedNodeIdAtom = atom<string | null>(null);

// New atoms
export const selectedNodeIdsAtom = atom<string[]>([]);
export const selectedNodeAtom = atom((get) => {
  const selectedId = get(selectedNodeIdAtom);
  if (!selectedId) return null;
  const nodes = get(workflowNodesAtom);
  return nodes.find(n => n.id === selectedId) || null;
});

export const canvasViewportAtom = atom({
  x: 0,
  y: 0,
  zoom: 1,
});

export const contextMenuAtom = atom<{
  type: 'node' | 'edge' | 'canvas' | null;
  position: { x: number; y: number } | null;
  data: any;
}>({
  type: null,
  position: null,
  data: null,
});
```

### Custom Hooks

#### useUndoRedo Hook

**File**: `src-web/hooks/useUndoRedo.ts`

```typescript
interface Action {
  type: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    await action.undo();

    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);
  }, [undoStack]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    await action.redo();

    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
  }, [redoStack]);

  const recordAction = useCallback((action: Action) => {
    setUndoStack(prev => {
      const newStack = [...prev, action];
      return newStack.slice(-50); // Keep last 50 actions
    });
    setRedoStack([]); // Clear redo stack on new action
  }, []);

  return {
    undo,
    redo,
    recordAction,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
```

#### useMultiSelect Hook

**File**: `src-web/hooks/useMultiSelect.ts`

```typescript
export function useMultiSelect() {
  const [selectedIds, setSelectedIds] = useAtom(selectedNodeIdsAtom);

  const toggleSelect = useCallback((nodeId: string, isCtrl: boolean) => {
    if (isCtrl) {
      setSelectedIds(prev =>
        prev.includes(nodeId)
          ? prev.filter(id => id !== nodeId)
          : [...prev, nodeId]
      );
    } else {
      setSelectedIds([nodeId]);
    }
  }, [setSelectedIds]);

  const selectMultiple = useCallback((nodeIds: string[]) => {
    setSelectedIds(nodeIds);
  }, [setSelectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, [setSelectedIds]);

  const selectAll = useCallback((allNodeIds: string[]) => {
    setSelectedIds(allNodeIds);
  }, [setSelectedIds]);

  return {
    selectedIds,
    toggleSelect,
    selectMultiple,
    clearSelection,
    selectAll,
  };
}
```

#### useAutoLayout Hook

**File**: `src-web/hooks/useAutoLayout.ts`

```typescript
import dagre from 'dagre';
import type { WorkflowNode, WorkflowEdge } from '@yaakapp-internal/models';

export function useAutoLayout() {
  const autoLayout = useCallback(async (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ) => {
    // Create dagre graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'LR',     // Left to right
      nodesep: 150,      // Vertical spacing
      ranksep: 200,      // Horizontal spacing
      marginx: 50,
      marginy: 50,
    });

    // Add nodes
    nodes.forEach(node => {
      dagreGraph.setNode(node.id, {
        width: 100,   // Node width
        height: 100,  // Node height
      });
    });

    // Add edges
    edges.forEach(edge => {
      dagreGraph.setEdge(edge.sourceNodeId, edge.targetNodeId);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Update positions in database
    const updates = nodes.map(node => {
      const position = dagreGraph.node(node.id);
      return patchModel(node.id, {
        positionX: position.x - 50, // Center node
        positionY: position.y - 50,
      });
    });

    await Promise.all(updates);
  }, []);

  return { autoLayout };
}
```

#### useLayoutTools Hook

**File**: `src-web/hooks/useLayoutTools.ts`

```typescript
export function useLayoutTools() {
  const alignNodes = useCallback(async (
    nodeIds: string[],
    direction: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV'
  ) => {
    if (nodeIds.length < 2) return;

    // Get current node positions
    const nodes = await Promise.all(
      nodeIds.map(id => getModel(id))
    );

    let targetValue: number;

    switch (direction) {
      case 'left':
        targetValue = Math.min(...nodes.map(n => n.positionX));
        await Promise.all(
          nodes.map(n => patchModel(n.id, { positionX: targetValue }))
        );
        break;

      case 'right':
        targetValue = Math.max(...nodes.map(n => n.positionX + 100));
        await Promise.all(
          nodes.map(n => patchModel(n.id, { positionX: targetValue - 100 }))
        );
        break;

      case 'top':
        targetValue = Math.min(...nodes.map(n => n.positionY));
        await Promise.all(
          nodes.map(n => patchModel(n.id, { positionY: targetValue }))
        );
        break;

      case 'bottom':
        targetValue = Math.max(...nodes.map(n => n.positionY + 100));
        await Promise.all(
          nodes.map(n => patchModel(n.id, { positionY: targetValue - 100 }))
        );
        break;

      case 'centerH':
        targetValue = nodes.reduce((sum, n) => sum + n.positionX, 0) / nodes.length;
        await Promise.all(
          nodes.map(n => patchModel(n.id, { positionX: targetValue }))
        );
        break;

      case 'centerV':
        targetValue = nodes.reduce((sum, n) => sum + n.positionY, 0) / nodes.length;
        await Promise.all(
          nodes.map(n => patchModel(n.id, { positionY: targetValue }))
        );
        break;
    }
  }, []);

  const distributeNodes = useCallback(async (
    nodeIds: string[],
    direction: 'horizontal' | 'vertical'
  ) => {
    if (nodeIds.length < 3) return;

    const nodes = await Promise.all(nodeIds.map(id => getModel(id)));

    if (direction === 'horizontal') {
      const sorted = nodes.sort((a, b) => a.positionX - b.positionX);
      const minX = sorted[0].positionX;
      const maxX = sorted[sorted.length - 1].positionX;
      const spacing = (maxX - minX) / (sorted.length - 1);

      await Promise.all(
        sorted.map((node, i) =>
          patchModel(node.id, { positionX: minX + i * spacing })
        )
      );
    } else {
      const sorted = nodes.sort((a, b) => a.positionY - b.positionY);
      const minY = sorted[0].positionY;
      const maxY = sorted[sorted.length - 1].positionY;
      const spacing = (maxY - minY) / (sorted.length - 1);

      await Promise.all(
        sorted.map((node, i) =>
          patchModel(node.id, { positionY: minY + i * spacing })
        )
      );
    }
  }, []);

  return { alignNodes, distributeNodes };
}
```

---

## Styling System

### Tailwind Configuration Updates

**File**: `src-web/tailwind.config.cjs`

**Add to theme.extend**:

```javascript
extend: {
  colors: {
    // n8n-inspired colors
    'n8n-primary': '#2c77df',
    'n8n-primary-light': '#e6f0ff',
    'n8n-dark': '#1e2b3c',
    'n8n-canvas': '#f6f9fc',
    'n8n-sidebar': '#f0f4f9',
    'n8n-panel': '#f8fafd',
    'n8n-success': '#38b153',
    'n8n-warning': '#ff9f29',
    'n8n-error': '#f75a5a',
  },
  boxShadow: {
    'node': '0 4px 20px rgba(0, 0, 0, 0.08)',
    'node-hover': '0 12px 25px rgba(44, 119, 223, 0.2)',
    'context-menu': '0 6px 20px rgba(0, 0, 0, 0.15)',
  },
  animation: {
    'pulse-error': 'pulseError 1.5s infinite',
  },
  keyframes: {
    pulseError: {
      '0%': { boxShadow: '0 0 0 0 rgba(247, 90, 90, 0.5)' },
      '50%': { boxShadow: '0 0 0 8px rgba(247, 90, 90, 0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(247, 90, 90, 0)' },
    },
  },
}
```

### CSS Variables

**File**: `src-web/main.css`

**Add**:

```css
:root {
  /* n8n theme colors */
  --n8n-primary: #2c77df;
  --n8n-primary-light: #e6f0ff;
  --n8n-dark: #1e2b3c;
  --n8n-canvas-bg: #f6f9fc;
  --n8n-sidebar-bg: #f0f4f9;
  --n8n-panel-bg: #f8fafd;
  --n8n-success: #38b153;
  --n8n-warning: #ff9f29;
  --n8n-error: #f75a5a;
  --n8n-border: #e0e6ee;

  /* Node type colors */
  --node-trigger: #10b981;
  --node-action: #8b5cf6;
  --node-logic: #f59e0b;
}
```

### Reusable Component Styles

**Create utility classes**:

```typescript
// src-web/lib/cn.ts (classnames utility)
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Common style patterns**:

```typescript
// Button variants
const buttonStyles = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-surface border border-border hover:bg-surface-highlight',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

// Card variants
const cardStyles = {
  base: 'bg-white rounded-lg border border-border shadow',
  hover: 'hover:shadow-lg hover:-translate-y-1 transition-all',
  interactive: 'cursor-pointer hover:border-primary',
};

// Input variants
const inputStyles = {
  base: 'w-full px-3 py-2 bg-white border border-border rounded-lg',
  focus: 'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
};
```

---

## Data Model Changes

### Optional Position Fields

**Note**: Current `WorkflowNode` model should already have `positionX` and `positionY`. Verify in `yaak-models/src/models.rs`.

**If missing, add**:

```rust
#[derive(Serialize, Deserialize, TS, Clone)]
#[ts(export)]
pub struct WorkflowNode {
    pub id: String,
    pub workflow_id: String,
    pub node_type: String,
    pub node_subtype: String,
    pub name: String,
    pub description: Option<String>,
    pub config: Option<serde_json::Value>,
    pub position_x: Option<f64>,  // Add if missing
    pub position_y: Option<f64>,  // Add if missing
    pub disabled: bool,
    pub sort_priority: i32,
    pub created_at: i64,
    pub updated_at: i64,
}
```

**Migration** (if needed):

```sql
-- Add columns if not present
ALTER TABLE workflow_nodes ADD COLUMN position_x REAL;
ALTER TABLE workflow_nodes ADD COLUMN position_y REAL;
```

### No Other Schema Changes

All other models remain unchanged:
- `Workflow`
- `WorkflowEdge`
- `WorkflowExecution`
- `WorkflowStepExecution`

---

## File Organization

### New Files to Create

```
src-web/components/Workflows/
├── Header.tsx                      # New: Dark header bar
├── Toolbar.tsx                     # Enhanced: Full toolbar
├── ContextMenu.tsx                 # New: Context menu component
├── FormFields/                     # New: Reusable form components
│   ├── TextField.tsx
│   ├── TextAreaField.tsx
│   ├── CodeField.tsx
│   ├── SelectField.tsx
│   ├── CheckboxField.tsx
│   └── NumberField.tsx
├── reactflow-theme.css             # New: ReactFlow custom styles

src-web/hooks/
├── useUndoRedo.ts                  # New: Undo/redo hook
├── useMultiSelect.ts               # New: Multi-select hook
├── useAutoLayout.ts                # New: Auto-layout hook
├── useLayoutTools.ts               # New: Alignment/distribution hook
├── useContextMenu.ts               # New: Context menu hook

src-web/lib/
├── workflow-layout.ts              # New: Layout algorithm utilities
└── workflow-validation.ts          # New: Form validation utilities
```

### Existing Files to Modify

```
src-web/components/Workflows/
├── WorkflowEditor.tsx              # Modify: Add Header
├── WorkflowCanvas.tsx              # Modify: Add Toolbar, enhance interactions
├── NodeLibrarySidebar.tsx          # Modify: Enhance styling
├── PropertiesPanel.tsx             # Modify: Dynamic forms, code editor
├── nodes/BaseNode.tsx              # Modify: Enhanced styling, states
├── edges/SequentialEdge.tsx        # Modify: Enhanced styling

src-tauri/yaak-models/guest-js/atoms.ts
                                    # Modify: Add new atoms
```

---

## Testing Strategy

### Unit Tests

**Test Files to Create**:

```
src-web/hooks/__tests__/
├── useUndoRedo.test.ts
├── useMultiSelect.test.ts
├── useAutoLayout.test.ts
└── useLayoutTools.test.ts
```

**Example Test**:

```typescript
// useUndoRedo.test.ts
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';

describe('useUndoRedo', () => {
  it('should undo action', async () => {
    const { result } = renderHook(() => useUndoRedo());

    let value = 0;
    const action = {
      type: 'TEST',
      undo: async () => { value = 0; },
      redo: async () => { value = 1; },
    };

    act(() => {
      result.current.recordAction(action);
      value = 1;
    });

    expect(result.current.canUndo).toBe(true);

    await act(async () => {
      await result.current.undo();
    });

    expect(value).toBe(0);
    expect(result.current.canRedo).toBe(true);
  });
});
```

### Component Tests

**Test Files**:

```
src-web/components/Workflows/__tests__/
├── NodeLibrarySidebar.test.tsx
├── PropertiesPanel.test.tsx
├── Toolbar.test.tsx
└── ContextMenu.test.tsx
```

### Integration Tests

**Test Scenarios**:

1. **Full Workflow Creation**
   - Open editor
   - Drag node to canvas
   - Connect nodes
   - Configure node
   - Execute workflow
   - Verify results

2. **Undo/Redo Flow**
   - Create node
   - Undo
   - Verify node removed
   - Redo
   - Verify node restored

3. **Multi-Select Operations**
   - Select multiple nodes (Ctrl+Click)
   - Align left
   - Verify positions updated

### Manual Testing Checklist

Create comprehensive QA document:

```markdown
# Manual Testing Checklist

## Visual Design
- [ ] Header bar matches n8n reference
- [ ] 3-column layout proportions correct
- [ ] Node cards have hover lift effect
- [ ] Selected nodes show blue border
- [ ] Error nodes show red border with pulse

## Interactions
- [ ] Drag node from library to canvas
- [ ] Drag connection from output to input port
- [ ] Multi-select with Ctrl+Click
- [ ] Box selection by dragging
- [ ] Right-click shows context menu
- [ ] All keyboard shortcuts work

## Features
- [ ] Undo/Redo works for all operations
- [ ] Auto-layout arranges nodes correctly
- [ ] Alignment tools align selected nodes
- [ ] Properties panel updates on selection
- [ ] Form changes save to database
- [ ] Workflow executes correctly

## Edge Cases
- [ ] Empty workflow shows empty state
- [ ] 50+ nodes perform smoothly
- [ ] Undo stack doesn't grow unbounded
- [ ] Unsaved changes warning works
- [ ] Error states display correctly
```

---

## Performance Optimizations

### React.memo for Expensive Components

```typescript
export const NodeLibraryCard = React.memo(({ nodeType, nodeSubtype, name, icon }: Props) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.nodeSubtype === nextProps.nodeSubtype;
});
```

### useMemo for Heavy Calculations

```typescript
const filteredNodes = useMemo(() => {
  if (!searchQuery) return NODE_TYPE_DEFINITIONS;
  return NODE_TYPE_DEFINITIONS.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [searchQuery]);
```

### useCallback for Event Handlers

```typescript
const handleDrop = useCallback((event: React.DragEvent) => {
  // Handler implementation
}, [reactFlowInstance, workflow.id, createNode]);
```

### Debouncing

```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setFilteredResults(filterNodes(query));
  }, 200),
  []
);
```

### Virtualization (if needed for large node lists)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: nodeList.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 80,
});
```

---

## Accessibility Implementation

### Keyboard Navigation

```typescript
// Focus management
const firstFocusableElement = containerRef.current?.querySelector(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);

// Trap focus in modal
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
};
```

### ARIA Labels

```typescript
<button
  aria-label="Create new workflow node"
  aria-describedby="tooltip-create-node"
>
  <Plus />
</button>

<div
  role="region"
  aria-label={`Workflow canvas with ${nodes.length} nodes`}
  aria-live="polite"
>
  {/* Canvas content */}
</div>
```

### Screen Reader Announcements

```typescript
const [announcement, setAnnouncement] = useState('');

useEffect(() => {
  if (announcement) {
    const timer = setTimeout(() => setAnnouncement(''), 1000);
    return () => clearTimeout(timer);
  }
}, [announcement]);

// Usage
setAnnouncement(`Node created: ${node.name}`);

// In render
<div role="status" aria-live="polite" className="sr-only">
  {announcement}
</div>
```

---

## Migration and Backward Compatibility

### No Data Migration Required

All existing workflows will load correctly because:
1. No schema changes to existing fields
2. Optional position fields default to null
3. ReactFlow handles null positions gracefully (places nodes at origin)

### Handling Missing Position Data

```typescript
// In useWorkflowCanvas hook
const nodes = useMemo(() => {
  return workflowNodes.map((node, index) => ({
    id: node.id,
    type: node.node_type,
    position: {
      x: node.position_x ?? index * 200,  // Auto-position if null
      y: node.position_y ?? 100,
    },
    data: { node },
  }));
}, [workflowNodes]);
```

### First-Time Auto-Layout

```typescript
// Detect workflows without positions and offer auto-layout
useEffect(() => {
  const hasNoPositions = nodes.every(n =>
    n.data.node.position_x === null && n.data.node.position_y === null
  );

  if (hasNoPositions && nodes.length > 0) {
    // Show tooltip: "Click 'Auto Layout' to organize your workflow"
    setShowAutoLayoutHint(true);
  }
}, [nodes]);
```

---

## Development Workflow

### Step-by-Step Implementation Order

1. **Foundation** (Week 1)
   - Set up Tailwind config with n8n colors
   - Create Header component
   - Create Toolbar component
   - Add CSS variables

2. **Core Hooks** (Week 1-2)
   - Implement useUndoRedo
   - Implement useMultiSelect
   - Implement useAutoLayout
   - Implement useLayoutTools
   - Add unit tests

3. **Visual Enhancements** (Week 2)
   - Enhance NodeLibrarySidebar styling
   - Enhance BaseNode component
   - Enhance SequentialEdge component
   - Add ReactFlow custom CSS

4. **Properties Panel** (Week 2-3)
   - Create FormField components
   - Integrate Monaco/CodeMirror
   - Add dynamic config forms
   - Add validation

5. **Context Menus** (Week 3)
   - Create ContextMenu component
   - Implement useContextMenu hook
   - Wire up node/edge/canvas menus

6. **Integration** (Week 3)
   - Wire all components together
   - Test undo/redo with all operations
   - Test multi-select
   - Test auto-layout

7. **Polish** (Week 4)
   - Add animations
   - Add loading states
   - Add error states
   - Add accessibility features

8. **Testing** (Week 4)
   - Manual QA testing
   - Fix bugs
   - Performance optimization
   - Documentation

---

## Open Questions and Decisions

### Decision Log

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Use Monaco or CodeMirror for code editor? | CodeMirror | Already used in Yaak, smaller bundle |
| 2 | Add dagre as dependency? | Yes | Industry standard for graph layout |
| 3 | Resizable panels? | No (V1) | Added complexity, future enhancement |
| 4 | Dark mode support? | Use existing theme | Yaak already has dark mode system |
| 5 | Undo stack size? | 50 actions | Balance memory vs. usability |
| 6 | Animation duration? | 200-300ms | Feels responsive but not jarring |
| 7 | Position data storage? | WorkflowNode.position_x/y | Simple, no join table needed |
| 8 | Multi-select UI feedback? | Border + count in toolbar | Clear without cluttering canvas |

### Remaining Questions

1. **Auto-save vs. Manual Save**: Should properties panel auto-save on blur or require explicit save?
   - **Recommendation**: Manual save for V1 to prevent accidental changes

2. **Keyboard Shortcut Conflicts**: How to handle conflicts with browser/OS shortcuts?
   - **Recommendation**: Document conflicts, add customization in future

3. **Node Templates**: Should we add "favorite nodes" feature in V1?
   - **Recommendation**: Defer to V2, focus on core refactor

4. **Export Format**: What format for workflow export (JSON, YAML, PNG)?
   - **Recommendation**: JSON in V1, PNG in V2

---

## Appendix

### Color Palette Reference

```typescript
export const n8nColors = {
  primary: '#2c77df',
  primaryLight: '#e6f0ff',
  secondary: '#5a6673',
  dark: '#1e2b3c',
  light: '#f8f9fa',
  success: '#38b153',
  warning: '#ff9f29',
  error: '#f75a5a',
  border: '#e0e6ee',
  canvasBg: '#f6f9fc',
  sidebarBg: '#f0f4f9',
  panelBg: '#f8fafd',
  nodeHover: '#2c77df20',
  nodeActive: '#2c77df0d',
};

export const nodeTypeColors = {
  trigger: '#10b981',
  action: '#8b5cf6',
  logic: '#f59e0b',
};
```

### Typography Scale

```typescript
export const fontSize = {
  '4xs': '0.6rem',    // 9.6px
  '3xs': '0.675rem',  // 10.8px
  '2xs': '0.75rem',   // 12px
  xs: '0.8rem',       // 12.8px
  sm: '0.9rem',       // 14.4px
  base: '1rem',       // 16px
  lg: '1.12rem',      // 17.92px
  xl: '1.25rem',      // 20px
};
```

### Spacing System

```typescript
export const spacing = {
  grid: 20,           // Grid snap size
  nodeWidth: 100,
  nodeHeight: 100,
  sidebarWidth: 280,
  propertiesPanelWidth: 320,
  headerHeight: 60,
  toolbarHeight: 48,
  nodeGapH: 200,      // Horizontal spacing
  nodeGapV: 150,      // Vertical spacing
};
```

### Animation Timings

```typescript
export const animations = {
  fast: 150,          // Instant feedback (hover, click)
  normal: 200,        // Standard transitions
  slow: 300,          // Layout changes, auto-layout
  verySlow: 500,      // Dramatic effects (page transitions)
};
```

---

This completes the comprehensive technical design document for the Workflow UI Refactor.
