# Visual Workflow Canvas - Requirements Specification

## Overview

This specification defines the comprehensive expansion of Yaak's existing test-workflows feature into a full-featured visual workflow canvas. This transforms the current basic horizontal flowchart into a professional visual workflow builder with drag-and-drop node placement, diverse node types (triggers, actions, logic control), a properties panel, and enhanced execution capabilities (parallel, conditional, loops).

## User Stories

### US-VC-1: Visual Node Placement
**As a** developer
**I want to** freely position workflow nodes on a 2D canvas
**So that** I can organize complex workflows visually in a way that makes sense to me

**Acceptance Criteria:**
- User can drag nodes anywhere on the canvas
- Canvas has a subtle grid background for alignment
- Node positions persist in the database
- Nodes can overlap (z-index handled automatically)
- Canvas is infinite scroll (no boundaries)
- Position coordinates are stored as (x, y) in pixels from origin

### US-VC-2: Pan and Zoom Canvas
**As a** developer
**I want to** pan and zoom the canvas view
**So that** I can navigate large workflows efficiently

**Acceptance Criteria:**
- User can pan by middle-mouse drag or spacebar + drag
- User can zoom with mouse wheel or zoom controls (10%-500%)
- Zoom level displayed in toolbar (e.g., "100%")
- Zoom centers on mouse cursor position
- Pan and zoom state persists during session (not across app restarts)
- Minimap shows overview of entire workflow (optional Phase 2)

### US-VC-3: Node Library Sidebar
**As a** developer
**I want to** browse available node types in a categorized library
**So that** I can quickly find and add the nodes I need

**Acceptance Criteria:**
- Left sidebar shows node library with 3 categories:
  - **Triggers**: Webhook Trigger, Timer Trigger, Manual Trigger (default)
  - **Actions**: HTTP Request, gRPC Request, Email, Database Operation, WebSocket
  - **Logic Control**: Conditional (IF/ELSE), Loop, Parallel Execution
- Each node type has:
  - Colored circular icon
  - Name (bold)
  - Subtitle description
  - Light background tint matching icon color
- User can collapse/expand categories
- User can search/filter nodes by name
- Dragging from library creates new node on canvas

### US-VC-4: Properties Panel
**As a** developer
**I want to** configure node settings in a properties panel
**So that** I can edit node parameters without leaving the canvas

**Acceptance Criteria:**
- Right sidebar shows properties panel (300px width, resizable)
- Panel displays when a node is selected (single selection only)
- Panel shows node-specific fields:
  - **All nodes**: Node Name (text input), Description (textarea)
  - **HTTP Request**: Method (dropdown), URL (text), Headers (key-value), Body (code editor), Auth (checkbox + config)
  - **Conditional**: Condition expression (code editor), True/False branches
  - **Loop**: Iteration count or array variable
- Changes auto-save on blur or Cmd/Ctrl+S
- Unsaved changes indicator (purple "Save Changes" button)
- Validation errors shown inline
- Panel header shows node icon and type

### US-VC-5: Connect Nodes with Edges
**As a** developer
**I want to** visually connect nodes with directional edges
**So that** I can define the execution flow

**Acceptance Criteria:**
- Each node has anchor points:
  - **Trigger nodes**: 1 output anchor (right side)
  - **Action nodes**: 1 input (left), 1 output (right)
  - **Logic nodes**: 1 input (left), 2+ outputs (right side, labeled)
- User creates edge by dragging from output anchor to input anchor
- Edge is a smooth Bezier curve with arrow indicator
- Edge color matches source node category color
- User can click edge to select it (highlight)
- User can delete selected edge (Delete key or context menu)
- Maximum 1 edge per input anchor (overwrite if reconnected)
- Multiple edges allowed from one output anchor (fanout)

### US-VC-6: Toolbar Actions
**As a** developer
**I want to** quick access to common workflow operations
**So that** I can efficiently manage workflows

**Acceptance Criteria:**
- Toolbar at top of canvas with buttons:
  - **Execute Workflow** (purple, prominent): Opens environment selector, starts execution
  - **Save** (Cmd/Ctrl+S): Saves all unsaved changes
  - **Undo** (Cmd/Ctrl+Z): Reverts last change
  - **Redo** (Cmd/Ctrl+Shift+Z): Reapplies undone change
  - **Zoom Controls**: Fit to screen, Zoom in, Zoom out, Zoom percentage dropdown
  - **Settings**: Canvas grid on/off, Auto-save on/off, Execution speed
- All actions have keyboard shortcuts
- Disabled state when action unavailable

### US-VC-7: Diverse Node Types
**As a** developer
**I want to** use different node types for different purposes
**So that** I can build comprehensive workflows beyond simple request chains

**Acceptance Criteria:**
- **Manual Trigger** (default): Always present as start node, cannot be deleted
- **Webhook Trigger**: Configurable webhook URL, HTTP method filter, payload schema
- **Timer Trigger**: Cron expression or interval, timezone setting
- **HTTP Request**: Full HTTP configuration (existing Yaak request integration)
- **gRPC Request**: Full gRPC configuration (existing Yaak request integration)
- **Email Action**: SMTP server, recipients, subject, body template
- **Database Action**: SQL query execution (read-only or write)
- **Conditional Node**: Boolean expression, True/False output branches
- **Loop Node**: Iterate over array or count, nested execution
- **Parallel Execution**: Multiple branches execute simultaneously

### US-VC-8: Conditional Branching
**As a** developer
**I want to** execute different paths based on runtime conditions
**So that** I can handle different scenarios in a single workflow

**Acceptance Criteria:**
- Conditional node evaluates boolean expression
- Expression can reference:
  - Previous step responses: `{{step[N].response.status}} == 200`
  - Environment variables: `{{env.ENVIRONMENT}} == "production"`
  - Template functions: `{{equals(step[0].response.body.role, "admin")}}`
- Two output branches labeled "True" (green edge) and "False" (red edge)
- Only one branch executes based on result
- Branches can merge back together downstream
- Visual indicator on edge showing which path was taken during execution

### US-VC-9: Loop Execution
**As a** developer
**I want to** repeat workflow steps multiple times
**So that** I can process arrays or perform batch operations

**Acceptance Criteria:**
- Loop node accepts:
  - **Fixed count**: `{{5}}` (iterate 5 times)
  - **Array variable**: `{{step[0].response.body.users}}` (iterate over array)
- Loop creates inner scope with variables:
  - `{{loop.index}}`: Current iteration (0-based)
  - `{{loop.item}}`: Current array element (if iterating array)
  - `{{loop.first}}`: Boolean, true on first iteration
  - `{{loop.last}}`: Boolean, true on last iteration
- Steps inside loop execute sequentially for each iteration
- Loop can contain nested nodes (sub-workflow)
- Max iterations limit: 1000 (configurable in settings)
- Loop results collected in array: `{{step[N].loopResults[]}}`

### US-VC-10: Parallel Execution
**As a** developer
**I want to** execute multiple independent requests simultaneously
**So that** I can reduce total workflow execution time

**Acceptance Criteria:**
- Parallel execution node has multiple output branches
- All branches execute concurrently (not sequentially)
- Workflow waits for ALL branches to complete before continuing
- If any branch fails, entire parallel section fails (configurable: fail-fast or wait-all)
- Parallel results available as: `{{step[N].parallelResults[0]}}`, `{{step[N].parallelResults[1]}}`, etc.
- Visual indicator shows parallel branches (dashed edges or special styling)
- Max parallel branches: 10 (configurable)

### US-VC-11: Box Selection
**As a** developer
**I want to** select multiple nodes at once
**So that** I can perform bulk operations

**Acceptance Criteria:**
- User can drag on empty canvas to create selection rectangle
- All nodes fully inside rectangle are selected
- Selected nodes show visual highlight (border color change)
- User can delete all selected nodes (Delete key)
- User can copy/paste selected nodes (Cmd/Ctrl+C, Cmd/Ctrl+V)
- User can drag selected nodes together to move them
- Click on empty canvas deselects all

### US-VC-12: Keyboard Shortcuts
**As a** developer
**I want to** use keyboard shortcuts for common actions
**So that** I can work efficiently without constant mouse usage

**Acceptance Criteria:**
- **Cmd/Ctrl+S**: Save workflow
- **Cmd/Ctrl+Z**: Undo
- **Cmd/Ctrl+Shift+Z**: Redo
- **Delete/Backspace**: Delete selected nodes/edges
- **Cmd/Ctrl+C**: Copy selected nodes
- **Cmd/Ctrl+V**: Paste copied nodes
- **Cmd/Ctrl+A**: Select all nodes
- **Spacebar+Drag**: Pan canvas
- **Cmd/Ctrl+Scroll**: Zoom
- **Cmd/Ctrl+0**: Reset zoom to 100%
- **Escape**: Deselect all

### US-VC-13: Visual Execution Progress
**As a** developer
**I want to** see real-time execution progress on the canvas
**So that** I can monitor workflow execution visually

**Acceptance Criteria:**
- During execution, nodes show status:
  - **Pending**: Gray border, faded icon
  - **Running**: Animated purple pulsing border, spinning icon
  - **Completed**: Green border, green checkmark overlay
  - **Failed**: Red border, red X overlay
  - **Skipped**: Yellow border, strikethrough text
- Edges animate with flowing dots from source to target
- Execution path highlights (traveled edges are brighter)
- Failed nodes show error tooltip on hover
- Execution can be paused/resumed/cancelled from toolbar
- After completion, node status badges persist until next run

### US-VC-14: Undo/Redo History
**As a** developer
**I want to** undo and redo my workflow changes
**So that** I can experiment without fear of breaking things

**Acceptance Criteria:**
- All canvas operations are recorded in history:
  - Add/delete node
  - Move node
  - Add/delete edge
  - Edit node properties
  - Paste nodes
- Undo/redo stack persists during session (max 50 actions)
- Undo reverts to previous state exactly
- Redo reapplies undone action
- History cleared on workflow save (optional behavior)
- Visual indicator shows undo/redo availability (button disabled when empty)

### US-VC-15: Node Status Badges
**As a** developer
**I want to** see configuration status at a glance
**So that** I know which nodes need attention

**Acceptance Criteria:**
- Each node shows status badge in top-right corner:
  - **Configured** (blue): "已配置" - All required fields filled
  - **Unconfigured** (gray): "未配置" - Missing required fields
  - **Error** (red): "错误" - Validation errors present
  - **Disabled** (orange): "已禁用" - Node is disabled
- Badge updates immediately when properties change
- Clicking badge opens properties panel
- Unconfigured nodes cannot execute (workflow validation fails)

### US-VC-16: Context Menus
**As a** developer
**I want to** right-click on nodes and canvas
**So that** I can access contextual actions quickly

**Acceptance Criteria:**
- **Node context menu**:
  - Edit (opens properties panel)
  - Duplicate
  - Enable/Disable
  - Delete
  - Copy
  - View execution results (if executed)
- **Edge context menu**:
  - Delete
  - Change color (optional)
- **Canvas context menu**:
  - Paste (if clipboard has nodes)
  - Select All
  - Fit to Screen
  - Reset Zoom
- Menu positioned near cursor
- Menu closes on click outside or Escape

### US-VC-17: Grid Snapping
**As a** developer
**I want to** snap nodes to grid when moving them
**So that** my workflows look organized and aligned

**Acceptance Criteria:**
- Canvas grid visible (subtle dots or lines, configurable)
- Grid size: 20x20 pixels (configurable in settings)
- Nodes snap to grid when:
  - Dragging (optional toggle: Shift to disable snap)
  - Pasting
  - Creating from library
- Snapping feels smooth (no jitter)
- Snap-to-grid can be toggled on/off in toolbar settings

### US-VC-18: Workflow Validation
**As a** developer
**I want to** validate workflow before execution
**So that** I catch errors early

**Acceptance Criteria:**
- Validation runs:
  - On manual request (Validate button)
  - Before execution
  - On save (warning only)
- Validation checks:
  - At least one start trigger
  - All nodes connected (no orphans)
  - No cycles in graph (for sequential sections)
  - All required node fields filled
  - All conditional branches connected
  - All loop nodes have valid iteration config
- Validation errors shown in panel with list of issues
- Clicking error navigates to problem node
- Warning/error icons on invalid nodes

### US-VC-19: Template Variable Autocomplete
**As a** developer
**I want to** autocomplete suggestions when typing template variables
**So that** I can reference previous steps easily

**Acceptance Criteria:**
- In any text field supporting templates, typing `{{` triggers autocomplete
- Suggestions include:
  - `step[N].response.*` - All previous step data
  - `env.*` - All environment variables
  - `loop.*` - Loop variables (if inside loop)
  - `workflow.*` - Workflow metadata
  - Template functions with signatures
- Arrow keys navigate suggestions
- Enter/Tab inserts suggestion
- Autocomplete shows field types and descriptions
- Works in code editor fields (Monaco integration)

### US-VC-20: Export/Import Workflow
**As a** developer
**I want to** export and import workflows as JSON
**So that** I can share or version control them

**Acceptance Criteria:**
- Export button in toolbar downloads JSON file
- JSON contains:
  - Workflow metadata (name, description)
  - All nodes with positions and configurations
  - All edges with connections
  - Version identifier for compatibility
- Import button accepts JSON file upload
- Import validates schema before creating workflow
- Import warns if name conflicts exist
- Import supports partial merge (add nodes to existing workflow)

## Functional Requirements

### FR-VC-1: Enhanced Data Model

**New Models:**
```typescript
WorkflowNode {
  id: string;
  model: 'workflow_node';
  workflow_id: string;
  node_type: NodeType;  // 'trigger' | 'action' | 'logic'
  node_subtype: string; // 'webhook_trigger' | 'http_request' | 'conditional' | etc.
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config: JSON;  // Node-specific configuration
  enabled: boolean;
  sort_priority: number;  // For execution order (replaced by edges)
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

WorkflowEdge {
  id: string;
  model: 'workflow_edge';
  workflow_id: string;
  source_node_id: string;
  source_anchor: string;  // 'output' | 'true' | 'false' | 'parallel-0' | etc.
  target_node_id: string;
  target_anchor: string;  // 'input'
  edge_type: EdgeType;  // 'sequential' | 'conditional-true' | 'conditional-false' | 'parallel'
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

WorkflowViewport {
  id: string;
  model: 'workflow_viewport';
  workflow_id: string;
  pan_x: number;
  pan_y: number;
  zoom: number;
  created_at: number;
  updated_at: number;
}

NodeTypeDefinition {
  id: string;
  category: 'trigger' | 'action' | 'logic';
  subtype: string;
  name: string;
  description: string;
  icon: string;  // Emoji or icon identifier
  color: string;  // Hex color for icon
  schema: JSON;  // JSON Schema for config validation
  default_config: JSON;
}
```

**Migration from existing WorkflowStep:**
- Existing `workflow_steps` table remains for backward compatibility
- New `workflow_nodes` and `workflow_edges` tables created
- Migration script converts WorkflowSteps to WorkflowNodes:
  - Each step becomes an "action" node
  - Sequential edges created based on sort_priority
  - Positions calculated horizontally (400px spacing)
- Both systems coexist temporarily, flagged by `workflow.canvas_enabled`

### FR-VC-2: Node Type System

**Built-in Node Types:**

1. **Manual Trigger** (default start):
   - Always present, cannot be deleted
   - Single output anchor
   - No configuration needed

2. **Webhook Trigger**:
   - Config: URL endpoint, allowed methods, auth token
   - Executes when webhook receives request
   - Output: Webhook payload as JSON

3. **Timer Trigger**:
   - Config: Cron expression or interval (minutes/hours)
   - Executes on schedule
   - Output: Timestamp

4. **HTTP Request**:
   - References existing HttpRequest OR inline config
   - Config: Method, URL, headers, body, auth
   - Output: HttpResponse

5. **gRPC Request**:
   - References existing GrpcRequest OR inline config
   - Config: Service, method, message
   - Output: GrpcResponse

6. **Email Action**:
   - Config: SMTP server, from/to/cc/bcc, subject, body template
   - Uses plugin system for SMTP integration
   - Output: Delivery status

7. **Database Action**:
   - Config: Connection string (from environment), SQL query
   - Read-only by default (write requires explicit permission)
   - Output: Query results as JSON array

8. **WebSocket Action**:
   - Config: URL, messages to send
   - Output: Received messages

9. **Conditional Node**:
   - Config: Boolean expression
   - Two output anchors: "true" and "false"
   - Evaluates expression at runtime

10. **Loop Node**:
    - Config: Iteration count or array variable
    - Single output anchor (loops back to self internally)
    - Output: Array of all iteration results

11. **Parallel Execution Node**:
    - Config: Number of parallel branches
    - Multiple output anchors (parallel-0, parallel-1, etc.)
    - All branches execute concurrently

### FR-VC-3: Enhanced Execution Engine

**Graph Traversal Algorithm:**
```rust
// Topological sort with cycle detection
fn build_execution_graph(workflow_id: String) -> Result<ExecutionGraph> {
  // 1. Load all nodes and edges
  // 2. Validate: one start node, all nodes reachable, no cycles (except loops)
  // 3. Build adjacency list
  // 4. Topological sort for execution order
  // 5. Identify parallel sections
  // 6. Return ExecutionGraph
}

struct ExecutionGraph {
  nodes: Vec<WorkflowNode>,
  execution_order: Vec<ExecutionStep>,
}

enum ExecutionStep {
  Sequential(node_id),
  Parallel(Vec<node_id>),
  Conditional { node_id, true_branch: Vec<ExecutionStep>, false_branch: Vec<ExecutionStep> },
  Loop { node_id, body: Vec<ExecutionStep> },
}
```

**Execution Context:**
```rust
struct ExecutionContext {
  workflow_id: String,
  execution_id: String,
  environment_id: Option<String>,
  variables: HashMap<String, serde_json::Value>,
  step_results: HashMap<String, StepResult>,
  loop_stack: Vec<LoopContext>,
}

struct LoopContext {
  index: usize,
  total: usize,
  item: Option<serde_json::Value>,
}
```

**Execution Flow:**
1. Parse workflow graph into ExecutionGraph
2. Validate graph (connectivity, cycles, required configs)
3. Initialize ExecutionContext
4. Execute steps according to ExecutionGraph:
   - **Sequential**: Execute node, wait for completion, add result to context
   - **Parallel**: Spawn concurrent tasks, wait for all to complete
   - **Conditional**: Evaluate expression, execute true OR false branch
   - **Loop**: Iterate count/array, execute body steps for each iteration
5. Emit real-time events for UI updates
6. Save final execution results

### FR-VC-4: Canvas Rendering Library

**Library Choice: ReactFlow (recommended)**
- Mature, well-maintained React library
- Built-in features: pan, zoom, minimap, drag-drop, edge routing
- Customizable node/edge components
- TypeScript support
- Performance optimized for large graphs (1000+ nodes)
- MIT license (compatible with Yaak)

**Alternative: Custom Implementation**
- Full control over rendering
- Lighter weight
- More work to implement pan/zoom/drag
- Consider only if ReactFlow licensing or bundle size is concern

**ReactFlow Integration:**
```typescript
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';

// Convert Yaak WorkflowNode to ReactFlow Node
function toReactFlowNode(node: WorkflowNode): Node {
  return {
    id: node.id,
    type: node.node_subtype,  // Custom node component
    position: { x: node.position_x, y: node.position_y },
    data: {
      config: node.config,
      enabled: node.enabled,
      status: getNodeStatus(node),
    },
  };
}
```

### FR-VC-5: Properties Panel Form System

**Dynamic Forms Based on Node Type:**
- Each node type defines JSON Schema for its config
- Form auto-generated from schema
- Field types: text, textarea, dropdown, number, toggle, code editor, key-value list
- Validation: required fields, regex patterns, min/max values
- Real-time validation feedback
- Unsaved changes tracking

**Form Component Library:**
- Use existing Yaak form components (PlainInput, Button, etc.)
- Add CodeEditor integration (Monaco) for expressions
- Add JsonEditor for complex nested configs

### FR-VC-6: State Management

**Jotai Atoms:**
```typescript
// Canvas state
export const canvasNodesAtom = atom<WorkflowNode[]>([]);
export const canvasEdgesAtom = atom<WorkflowEdge[]>([]);
export const canvasViewportAtom = atom<WorkflowViewport | null>(null);
export const selectedNodeIdAtom = atom<string | null>(null);
export const selectedEdgeIdAtom = atom<string | null>(null);

// UI state
export const isExecutingAtom = atom<boolean>(false);
export const executionProgressAtom = atom<Map<string, NodeExecutionStatus>>(new Map());
export const undoStackAtom = atom<CanvasAction[]>([]);
export const redoStackAtom = atom<CanvasAction[]>([]);

// Derived atoms
export const selectedNodeAtom = atom((get) => {
  const id = get(selectedNodeIdAtom);
  const nodes = get(canvasNodesAtom);
  return nodes.find(n => n.id === id);
});
```

### FR-VC-7: Undo/Redo System

**Action Types:**
```typescript
type CanvasAction =
  | { type: 'ADD_NODE', node: WorkflowNode }
  | { type: 'DELETE_NODE', node: WorkflowNode }
  | { type: 'MOVE_NODE', nodeId: string, oldPos: Point, newPos: Point }
  | { type: 'ADD_EDGE', edge: WorkflowEdge }
  | { type: 'DELETE_EDGE', edge: WorkflowEdge }
  | { type: 'UPDATE_NODE_CONFIG', nodeId: string, oldConfig: JSON, newConfig: JSON }
  | { type: 'PASTE_NODES', nodes: WorkflowNode[], edges: WorkflowEdge[] };
```

**Undo/Redo Logic:**
- Every canvas mutation pushes action to undo stack
- Undo: pop from undo stack, revert action, push to redo stack
- Redo: pop from redo stack, apply action, push to undo stack
- Clear redo stack when new action performed (branching)
- Serialize actions to JSON for persistence (optional)

### FR-VC-8: Template System Extensions

**New Template Syntax:**
```
{{step[N].response.body.field}}         # Existing
{{step[N].loopResults[i].body.field}}   # Loop results
{{step[N].parallelResults[i].status}}   # Parallel results
{{loop.index}}                           # Inside loop
{{loop.item.id}}                         # Iterating over objects
{{conditional.branch}}                   # Which branch was taken ("true" | "false")
```

**Template Functions:**
- `equals(a, b)` → boolean
- `contains(array, item)` → boolean
- `length(array)` → number
- `jsonPath(obj, "$.path.to.field")` → any
- `regex(str, pattern)` → boolean

### FR-VC-9: Tauri Commands

**New Commands:**
```rust
// Node CRUD
cmd_create_workflow_node(workflow_id, node_type, position) -> WorkflowNode
cmd_update_workflow_node(node_id, updates) -> WorkflowNode
cmd_delete_workflow_node(node_id) -> Result<()>

// Edge CRUD
cmd_create_workflow_edge(source_id, target_id, source_anchor, target_anchor) -> WorkflowEdge
cmd_delete_workflow_edge(edge_id) -> Result<()>

// Canvas
cmd_get_workflow_canvas(workflow_id) -> { nodes: Vec<WorkflowNode>, edges: Vec<WorkflowEdge> }
cmd_update_viewport(workflow_id, pan_x, pan_y, zoom) -> Result<()>

// Validation
cmd_validate_workflow_graph(workflow_id) -> ValidationResult

// Execution
cmd_execute_workflow_canvas(workflow_id, environment_id) -> execution_id
// (Replaces cmd_execute_workflow for canvas-enabled workflows)

// Export/Import
cmd_export_workflow_json(workflow_id) -> String (JSON)
cmd_import_workflow_json(workspace_id, json) -> Workflow
```

### FR-VC-10: Node Type Plugin System (Future)

**Extensibility:**
- Allow users to define custom node types via plugins
- Plugin defines:
  - Node category, name, icon, color
  - Config schema (JSON Schema)
  - Execution handler (JavaScript function)
- Custom nodes stored in `~/.yaak/custom-nodes/`
- Loaded at startup, registered in node library

## Non-Functional Requirements

### NFR-VC-1: Performance

- Canvas renders smoothly with 500+ nodes (target: 60 FPS)
- Zoom/pan feels instant (no lag)
- Node drag has no perceptible delay
- Execution progress updates < 100ms latency
- Undo/redo instant (< 50ms)
- Initial canvas load < 500ms for typical workflow (50 nodes)

### NFR-VC-2: Usability

- Keyboard shortcuts for all major actions
- Context menus for discoverability
- Tooltips on hover for all icons/buttons
- Drag-drop feels natural (smooth animations)
- Undo/redo works intuitively
- Error messages are clear and actionable
- Empty states guide user to next action

### NFR-VC-3: Accessibility

- Keyboard navigation for entire canvas
- Screen reader support for node library
- High contrast mode compatible
- Zoom up to 500% without breaking layout
- Colorblind-friendly status colors (use icons + colors)

### NFR-VC-4: Reliability

- Auto-save every 30 seconds (configurable)
- Recover from crashes (persist draft state)
- Validation prevents invalid execution
- Graceful degradation if canvas fails (fallback to list view)
- No data loss on browser refresh

### NFR-VC-5: Maintainability

- Modular component architecture
- Shared state via Jotai atoms
- Type-safe with TypeScript
- Documented node type registration system
- Unit tests for graph algorithms
- E2E tests for critical flows

## Out of Scope (V1)

- **Commenting/annotations** on canvas
- **Version control/diffing** workflows
- **Real-time collaboration** (multi-user editing)
- **Workflow templates marketplace**
- **AI-assisted workflow creation**
- **Custom node UI rendering** (all nodes use standard card layout)
- **Nested subflows** (workflows within workflows)
- **Workflow debugging** (breakpoints, step-through)
- **Performance profiling** of workflows
- **Workflow scheduling UI** (use Timer Trigger instead)

## Success Criteria

1. User can create workflow with 10+ nodes and diverse types (HTTP, Conditional, Loop)
2. User can drag nodes freely, connect them visually with edges
3. User can execute workflow with parallel branches and see visual progress
4. User can configure nodes via properties panel with validation
5. Undo/redo works for all canvas operations
6. Workflow executes correctly with conditional branching
7. Loop node iterates over array and collects results
8. Parallel execution runs branches concurrently
9. All existing test-workflows features still work (backward compatibility)
10. Canvas performance is smooth with 100+ nodes
11. Export/import workflows as JSON
12. Template autocomplete suggests step references

## Backward Compatibility

- Existing workflows using `workflow_steps` continue to work
- Migration tool converts old workflows to new canvas format
- Users can opt-in per workflow (toggle "Enable Visual Canvas")
- Both UIs coexist during transition period
- Eventually deprecate old step-list UI (Phase 2)
