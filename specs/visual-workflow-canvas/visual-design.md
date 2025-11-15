# Visual Workflow Canvas - Visual Design Specification

This document provides exact visual specifications for the workflow canvas UI, derived from the UI screenshot analysis.

## 1. Color System

### 1.1 Node Category Colors

```typescript
const NODE_COLORS = {
  // Triggers
  trigger: {
    primary: '#10b981',      // Green-500
    light: '#d1fae5',        // Green-100
    bg: '#ecfdf5',           // Green-50
    border: '#6ee7b7',       // Green-300
  },

  // Actions
  action: {
    primary: '#8b5cf6',      // Purple-500
    light: '#ede9fe',        // Purple-100
    bg: '#f5f3ff',           // Purple-50
    border: '#c4b5fd',       // Purple-300
  },

  // Logic Control
  logic: {
    primary: '#f59e0b',      // Amber-500
    light: '#fef3c7',        // Amber-100
    bg: '#fffbeb',           // Amber-50
    border: '#fcd34d',       // Amber-300
  },
};

const SPECIFIC_NODE_COLORS = {
  webhook_trigger: '#10b981',    // Green
  timer_trigger: '#3b82f6',      // Blue
  http_request: '#8b5cf6',       // Purple
  grpc_request: '#8b5cf6',       // Purple
  email: '#f97316',              // Orange
  database: '#06b6d4',           // Cyan
  websocket: '#06b6d4',          // Cyan
  conditional: '#f59e0b',        // Amber
  loop: '#ef4444',               // Red
  parallel: '#06b6d4',           // Cyan
};
```

### 1.2 Execution Status Colors

```typescript
const STATUS_COLORS = {
  pending: {
    border: '#94a3b8',         // Gray-400
    bg: '#f1f5f9',             // Gray-100
    text: '#64748b',           // Gray-500
  },
  running: {
    border: '#8b5cf6',         // Purple-500
    bg: '#f5f3ff',             // Purple-50
    text: '#8b5cf6',           // Purple-500
    pulse: 'animate-pulse',
  },
  completed: {
    border: '#10b981',         // Green-500
    bg: '#d1fae5',             // Green-100
    text: '#059669',           // Green-600
    icon: '✓',
  },
  failed: {
    border: '#ef4444',         // Red-500
    bg: '#fee2e2',             // Red-100
    text: '#dc2626',           // Red-600
    icon: '✗',
  },
  skipped: {
    border: '#f59e0b',         // Amber-500
    bg: '#fef3c7',             // Amber-100
    text: '#d97706',           // Amber-600
  },
};
```

### 1.3 UI Surface Colors

```typescript
const UI_COLORS = {
  canvas: {
    background: '#0f172a',     // Slate-900 (dark mode)
    gridDots: '#64748b',       // Slate-500 (subtle)
    gridLines: '#334155',      // Slate-700 (very subtle)
  },
  sidebar: {
    background: '#1e293b',     // Slate-800
    border: '#334155',         // Slate-700
  },
  node: {
    background: '#ffffff',     // White (light cards)
    border: '#e2e8f0',         // Slate-200
    borderFocus: '#8b5cf6',    // Purple-500
    shadow: 'rgba(0,0,0,0.1)',
  },
  toolbar: {
    background: '#1e293b',     // Slate-800
    border: '#334155',         // Slate-700
    button: '#3b82f6',         // Blue-500 (primary actions)
    buttonHover: '#2563eb',    // Blue-600
  },
};
```

### 1.4 Badge Colors

```typescript
const BADGE_COLORS = {
  configured: {
    bg: '#3b82f6',             // Blue-500
    text: '#ffffff',
    label: '已配置',
  },
  unconfigured: {
    bg: '#94a3b8',             // Gray-400
    text: '#ffffff',
    label: '未配置',
  },
  error: {
    bg: '#ef4444',             // Red-500
    text: '#ffffff',
    label: '错误',
  },
  disabled: {
    bg: '#f59e0b',             // Amber-500
    text: '#ffffff',
    label: '已禁用',
  },
};
```

## 2. Typography

### 2.1 Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Code/Monospace */
font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas,
  'Courier New', monospace;
```

### 2.2 Font Sizes

```typescript
const FONT_SIZES = {
  // Toolbar
  toolbarButton: '14px',       // Button labels
  toolbarIcon: '20px',         // Icon size

  // Node Library
  categoryHeader: '12px',      // Category titles (uppercase)
  nodeCardTitle: '14px',       // Node type name
  nodeCardSubtitle: '12px',    // Node description

  // Canvas Nodes
  nodeTitle: '14px',           // Node name (semibold)
  nodeSubtitle: '12px',        // Node type description
  nodeIcon: '32px',            // Emoji icon
  nodeBadge: '11px',           // Status badge

  // Properties Panel
  panelHeader: '16px',         // "Node Properties"
  panelSubheader: '13px',      // "Configure parameters"
  fieldLabel: '13px',          // Form field labels
  fieldInput: '14px',          // Input text
  fieldHelp: '12px',           // Help text

  // Misc
  toast: '14px',               // Notifications
  error: '13px',               // Error messages
};
```

### 2.3 Font Weights

```typescript
const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};
```

### 2.4 Line Heights

```typescript
const LINE_HEIGHTS = {
  tight: 1.25,     // Headings
  normal: 1.5,     // Body text
  relaxed: 1.75,   // Descriptions
};
```

## 3. Spacing System

### 3.1 Grid System

```typescript
const GRID = {
  size: 20,                    // 20x20 pixel grid
  snapToGrid: true,
  showGrid: true,
  gridStyle: 'dots',           // 'dots' | 'lines'
};
```

### 3.2 Spacing Scale

```typescript
const SPACING = {
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 12,     // 12px
  lg: 16,     // 16px
  xl: 24,     // 24px
  '2xl': 32,  // 32px
  '3xl': 48,  // 48px
  '4xl': 64,  // 64px
};
```

### 3.3 Component Spacing

```typescript
// Sidebar widths
const SIDEBAR_WIDTH = {
  nodeLibrary: 280,            // Left sidebar
  propertiesPanel: 360,        // Right sidebar (resizable: 300-600px)
};

// Toolbar height
const TOOLBAR_HEIGHT = 60;

// Node spacing
const NODE_SPACING = {
  minWidth: 200,
  maxWidth: 400,
  defaultWidth: 250,
  defaultHeight: 150,
  horizontalGap: 400,          // For auto-layout
  verticalGap: 200,
  padding: 24,                 // Internal padding
  iconSize: 48,                // Icon circle diameter
  badgeOffset: 8,              // Distance from corner
};

// Edge spacing
const EDGE_SPACING = {
  anchorSize: 16,              // Handle diameter
  anchorBorder: 2,
  strokeWidth: 2,
  strokeWidthHover: 3,
  strokeWidthSelected: 4,
};
```

## 4. Node Specifications

### 4.1 Node Card Anatomy

```
┌──────────────────────────────┐
│                      [Badge] │  ← Status badge (top-right)
│                              │
│      ┌──────────────┐       │
│      │   ●  Icon    │       │  ← Circular icon (48px)
│      └──────────────┘       │
│                              │
│    Node Name (bold)         │  ← Title (14px semibold)
│    Subtitle (gray)          │  ← Subtitle (12px)
│                              │
│    [Config Preview]         │  ← Optional config preview
│                              │
│○                            ○│  ← Connection anchors
└──────────────────────────────┘
```

### 4.2 Node Dimensions

```typescript
const NODE_DIMENSIONS = {
  minWidth: 200,
  maxWidth: 400,
  defaultWidth: 250,
  minHeight: 120,
  defaultHeight: 150,
  borderRadius: 16,            // Rounded corners
  borderWidth: 2,
  shadowBlur: 8,
  shadowOffset: { x: 0, y: 2 },
  shadowOpacity: 0.1,
};
```

### 4.3 Node States

```typescript
const NODE_STATES = {
  default: {
    border: '#e2e8f0',         // Slate-200
    background: '#ffffff',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  hover: {
    border: '#cbd5e1',         // Slate-300
    background: '#ffffff',
    shadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  selected: {
    border: '#8b5cf6',         // Purple-500
    background: '#ffffff',
    shadow: '0 4px 16px rgba(139,92,246,0.3)',
  },
  disabled: {
    border: '#e2e8f0',
    background: '#f8fafc',     // Slate-50
    opacity: 0.6,
  },
  executing: {
    border: '#8b5cf6',
    background: '#ffffff',
    animation: 'pulse 2s ease-in-out infinite',
  },
  completed: {
    border: '#10b981',         // Green-500
    background: '#ffffff',
  },
  failed: {
    border: '#ef4444',         // Red-500
    background: '#ffffff',
  },
};
```

### 4.4 Node Icons

Each node type has a circular icon background:

```typescript
const NODE_ICONS = {
  // Trigger icons
  manual_trigger: {
    emoji: '⚡',
    bgColor: '#ecfdf5',        // Green-50
    iconColor: '#10b981',      // Green-500
  },
  webhook_trigger: {
    emoji: '🌐',
    bgColor: '#ecfdf5',
    iconColor: '#10b981',
  },
  timer_trigger: {
    emoji: '⏰',
    bgColor: '#dbeafe',        // Blue-50
    iconColor: '#3b82f6',      // Blue-500
  },

  // Action icons
  http_request: {
    emoji: '🌐',
    bgColor: '#f5f3ff',        // Purple-50
    iconColor: '#8b5cf6',      // Purple-500
  },
  grpc_request: {
    emoji: '⚡',
    bgColor: '#f5f3ff',
    iconColor: '#8b5cf6',
  },
  email: {
    emoji: '✉️',
    bgColor: '#fff7ed',        // Orange-50
    iconColor: '#f97316',      // Orange-500
  },
  database: {
    emoji: '🗄️',
    bgColor: '#ecfeff',        // Cyan-50
    iconColor: '#06b6d4',      // Cyan-500
  },
  websocket: {
    emoji: '🔌',
    bgColor: '#ecfeff',
    iconColor: '#06b6d4',
  },

  // Logic icons
  conditional: {
    emoji: '❓',
    bgColor: '#fffbeb',        // Amber-50
    iconColor: '#f59e0b',      // Amber-500
  },
  loop: {
    emoji: '🔁',
    bgColor: '#fef2f2',        // Red-50
    iconColor: '#ef4444',      // Red-500
  },
  parallel: {
    emoji: '⚡',
    bgColor: '#ecfeff',
    iconColor: '#06b6d4',
  },
};
```

### 4.5 Connection Anchors

```typescript
const ANCHOR_STYLE = {
  diameter: 16,
  border: 2,
  borderColor: '#64748b',      // Slate-500
  backgroundColor: '#f8fafc',  // Slate-50
  position: {
    input: 'left center',      // Left edge, vertically centered
    output: 'right center',    // Right edge, vertically centered
  },
  hoverScale: 1.2,
  activeColor: '#8b5cf6',      // Purple when connecting
};

// Conditional nodes have labeled outputs
const CONDITIONAL_ANCHORS = {
  output_true: {
    label: 'True',
    color: '#10b981',          // Green
    position: 'right 40%',     // Upper-right
  },
  output_false: {
    label: 'False',
    color: '#ef4444',          // Red
    position: 'right 60%',     // Lower-right
  },
};

// Parallel nodes have multiple outputs
const PARALLEL_ANCHORS = {
  outputs: [
    { id: 'parallel-0', label: 'Branch 1', position: 'right 33%' },
    { id: 'parallel-1', label: 'Branch 2', position: 'right 50%' },
    { id: 'parallel-2', label: 'Branch 3', position: 'right 67%' },
    // ... up to 10 branches
  ],
};
```

## 5. Edge Specifications

### 5.1 Edge Types

```typescript
const EDGE_TYPES = {
  sequential: {
    type: 'smoothstep',        // ReactFlow edge type
    strokeWidth: 2,
    strokeColor: '#64748b',    // Slate-500
    animated: false,
    arrow: true,
    arrowSize: 12,
  },
  conditional_true: {
    type: 'smoothstep',
    strokeWidth: 2,
    strokeColor: '#10b981',    // Green
    animated: false,
    arrow: true,
    label: 'True',
    labelBgColor: '#ecfdf5',
  },
  conditional_false: {
    type: 'smoothstep',
    strokeWidth: 2,
    strokeColor: '#ef4444',    // Red
    animated: false,
    arrow: true,
    label: 'False',
    labelBgColor: '#fee2e2',
  },
  parallel: {
    type: 'smoothstep',
    strokeWidth: 2,
    strokeColor: '#06b6d4',    // Cyan
    strokeDasharray: '5, 5',   // Dashed
    animated: false,
    arrow: true,
  },
  loop: {
    type: 'smoothstep',
    strokeWidth: 2,
    strokeColor: '#ef4444',    // Red
    animated: false,
    arrow: true,
  },
};
```

### 5.2 Edge States

```typescript
const EDGE_STATES = {
  default: {
    strokeWidth: 2,
    opacity: 0.6,
  },
  hover: {
    strokeWidth: 3,
    opacity: 1,
    cursor: 'pointer',
  },
  selected: {
    strokeWidth: 4,
    opacity: 1,
    strokeColor: '#8b5cf6',    // Purple
  },
  executing: {
    animated: true,
    animationDuration: '1.5s',
    strokeColor: '#8b5cf6',    // Purple
    opacity: 1,
  },
  executed: {
    strokeWidth: 3,
    strokeColor: '#10b981',    // Green (completed path)
    opacity: 0.8,
  },
};
```

### 5.3 Edge Animations

During execution, edges animate with flowing dots:

```css
@keyframes flowingDots {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 24;
  }
}

.edge-executing {
  stroke-dasharray: 6 6;
  animation: flowingDots 1.5s linear infinite;
}
```

## 6. Sidebar Specifications

### 6.1 Node Library Sidebar

```
┌─────────────────────────────┐
│  Node Library           [ × ]│  ← Header (collapsible)
├─────────────────────────────┤
│  [Search nodes...]          │  ← Search input
├─────────────────────────────┤
│  TRIGGERS               [▼] │  ← Category (collapsible)
│  ┌───────────────────────┐  │
│  │ ● Webhook Trigger     │  │  ← Node card (draggable)
│  │   Trigger on HTTP     │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ ● Timer Trigger       │  │
│  │   Execute on schedule │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  ACTIONS                [▼] │
│  ┌───────────────────────┐  │
│  │ ● HTTP Request        │  │
│  │   Send API request    │  │
│  └───────────────────────┘  │
│  ... (more cards)           │
├─────────────────────────────┤
│  LOGIC CONTROL          [▼] │
│  ... (logic cards)          │
└─────────────────────────────┘
```

Dimensions:

```typescript
const NODE_LIBRARY_DIMENSIONS = {
  width: 280,
  padding: 16,
  categoryHeaderHeight: 36,
  categoryPadding: 8,
  searchInputHeight: 40,
  nodeCardHeight: 72,
  nodeCardMargin: 8,
  nodeCardPadding: 12,
  nodeCardBorderRadius: 8,
  iconSize: 32,
  iconMargin: 12,
};
```

Node Card Style:

```typescript
const NODE_LIBRARY_CARD = {
  background: '#f8fafc',       // Slate-50
  backgroundHover: '#f1f5f9',  // Slate-100
  border: '1px solid #e2e8f0', // Slate-200
  borderRadius: 8,
  padding: 12,
  cursor: 'grab',
  cursorDragging: 'grabbing',
  shadow: 'none',
  shadowDragging: '0 4px 12px rgba(0,0,0,0.2)',
};
```

### 6.2 Properties Panel

```
┌─────────────────────────────┐
│  ● HTTP Request         [ × ]│  ← Header (node icon + type)
│  Configure parameters       │  ← Subheader
├─────────────────────────────┤
│  Node Name                  │  ← Field label
│  [Get User Profile______]   │  ← Text input
│                             │
│  Request Method             │
│  [GET               ▼]     │  ← Dropdown
│                             │
│  URL                        │
│  [https://api.example.co... │  ← Text input (autocomplete)
│   {{env.API_URL}}/users    │  ← Suggestion
│                             │
│  Headers                    │
│  Key         Value          │
│  [Auth...] [Bearer...] [-] │  ← Key-value list
│  [+ Add Header]             │
│                             │
│  Body                       │
│  ┌─────────────────────────┤
│  │ {                       │  ← Code editor (Monaco)
│  │   "userId": "{{uuid()}}"│
│  │ }                       │
│  └─────────────────────────┤
│                             │
│  ☐ Enable Authentication    │  ← Checkbox
│                             │
├─────────────────────────────┤
│  [  Save Changes  ]         │  ← Save button (purple)
└─────────────────────────────┘
```

Dimensions:

```typescript
const PROPERTIES_PANEL_DIMENSIONS = {
  minWidth: 300,
  defaultWidth: 360,
  maxWidth: 600,
  resizable: true,
  padding: 20,
  headerHeight: 56,
  fieldMargin: 16,
  labelMargin: 6,
  inputHeight: 40,
  codeEditorMinHeight: 200,
  saveButtonHeight: 40,
  saveButtonMargin: 24,
};
```

Field Styles:

```typescript
const FIELD_STYLES = {
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#475569',          // Slate-600
    marginBottom: 6,
  },
  input: {
    fontSize: 14,
    padding: '10px 12px',
    border: '1px solid #cbd5e1',  // Slate-300
    borderRadius: 6,
    background: '#ffffff',
    focusBorder: '#8b5cf6',    // Purple-500
    focusRing: '0 0 0 3px rgba(139,92,246,0.1)',
  },
  dropdown: {
    // Same as input
    caretColor: '#64748b',
  },
  codeEditor: {
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'monospace',
    theme: 'vs-dark',          // Monaco theme
  },
  checkbox: {
    size: 18,
    accentColor: '#8b5cf6',
  },
};
```

## 7. Toolbar Specifications

```
┌──────────────────────────────────────────────────────────────┐
│  [▶ Execute]  [💾]  [↶]  [↷]  [🔍] 100% [🔍]  [⚙]       │
└──────────────────────────────────────────────────────────────┘
```

Dimensions:

```typescript
const TOOLBAR_DIMENSIONS = {
  height: 60,
  padding: 12,
  buttonHeight: 36,
  buttonPadding: '8px 16px',
  iconSize: 20,
  gap: 8,
  separatorWidth: 1,
  separatorHeight: 24,
  separatorColor: '#334155',
};
```

Button Styles:

```typescript
const TOOLBAR_BUTTONS = {
  primary: {
    background: '#8b5cf6',     // Purple-500
    backgroundHover: '#7c3aed', // Purple-600
    color: '#ffffff',
    fontWeight: 600,
    borderRadius: 8,
    padding: '8px 16px',
    shadow: '0 2px 4px rgba(139,92,246,0.2)',
  },
  secondary: {
    background: 'transparent',
    backgroundHover: '#334155', // Slate-700
    color: '#cbd5e1',          // Slate-300
    borderRadius: 6,
    padding: '8px 12px',
    border: 'none',
  },
  icon: {
    background: 'transparent',
    backgroundHover: '#334155',
    color: '#cbd5e1',
    borderRadius: 6,
    padding: '8px',
    size: 36,
  },
};
```

Zoom Controls:

```typescript
const ZOOM_CONTROLS = {
  display: '100%',
  fontSize: 13,
  padding: '6px 12px',
  background: '#334155',
  borderRadius: 6,
  minWidth: 80,
  textAlign: 'center',
};
```

## 8. Animation Specifications

### 8.1 Transition Durations

```typescript
const TRANSITIONS = {
  fast: 150,                   // Quick interactions (hover)
  normal: 250,                 // Standard transitions (modal open)
  slow: 400,                   // Smooth animations (canvas pan)
};
```

### 8.2 Easing Functions

```typescript
const EASINGS = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
```

### 8.3 Specific Animations

**Node drag:**
```css
.node-dragging {
  cursor: grabbing;
  opacity: 0.8;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Node selection:**
```css
.node-selected {
  border-color: #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Execution pulse:**
```css
@keyframes executionPulse {
  0%, 100% {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
  }
  50% {
    border-color: #a78bfa;
    box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
  }
}

.node-executing {
  animation: executionPulse 2s ease-in-out infinite;
}
```

**Badge appear:**
```css
.badge-enter {
  opacity: 0;
  transform: scale(0.8);
}

.badge-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: all 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**Edge connection:**
```css
.edge-connecting {
  stroke-dasharray: 6 6;
  animation: dashOffset 1s linear infinite;
}

@keyframes dashOffset {
  to {
    stroke-dashoffset: -12;
  }
}
```

## 9. Responsive Behavior

### 9.1 Sidebar Collapse

```typescript
const SIDEBAR_BEHAVIOR = {
  nodeLibrary: {
    collapsed: false,
    collapsedWidth: 48,        // Icon-only bar
    expandedWidth: 280,
    transition: 'width 250ms ease-in-out',
    breakpoint: 1200,          // Auto-collapse below
  },
  propertiesPanel: {
    collapsed: true,           // Hidden by default
    collapsedWidth: 0,
    expandedWidth: 360,
    transition: 'width 250ms ease-in-out',
    showWhen: 'nodeSelected',
  },
};
```

### 9.2 Canvas Scaling

```typescript
const CANVAS_SCALING = {
  minZoom: 0.1,                // 10%
  maxZoom: 5.0,                // 500%
  defaultZoom: 1.0,            // 100%
  zoomStep: 0.1,               // 10% per step
  fitViewPadding: 0.1,         // 10% padding around all nodes
};
```

## 10. Accessibility

### 10.1 Focus Indicators

```css
.focusable:focus-visible {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 10.2 Keyboard Navigation

```typescript
const KEYBOARD_FOCUS = {
  ring: '0 0 0 3px rgba(139,92,246,0.4)',
  ringOffset: 2,
  ringColor: '#8b5cf6',
};
```

### 10.3 High Contrast Mode

```css
@media (prefers-contrast: high) {
  .node {
    border-width: 3px;
  }

  .edge {
    stroke-width: 3px;
  }

  .badge {
    border: 2px solid currentColor;
  }
}
```

### 10.4 Colorblind-Friendly

All status states use BOTH color and icon:

```typescript
const STATUS_INDICATORS = {
  pending: { color: '#94a3b8', icon: '○' },
  running: { color: '#8b5cf6', icon: '⟳' },
  completed: { color: '#10b981', icon: '✓' },
  failed: { color: '#ef4444', icon: '✗' },
  skipped: { color: '#f59e0b', icon: '⊘' },
};
```

## 11. Dark Mode Support

The design shown in the screenshot is primarily dark mode. For light mode:

```typescript
const LIGHT_MODE_COLORS = {
  canvas: {
    background: '#f8fafc',     // Slate-50
    gridDots: '#cbd5e1',       // Slate-300
  },
  sidebar: {
    background: '#ffffff',
    border: '#e2e8f0',
  },
  toolbar: {
    background: '#ffffff',
    border: '#e2e8f0',
  },
  node: {
    background: '#ffffff',
    border: '#e2e8f0',
  },
  text: {
    primary: '#0f172a',        // Slate-900
    secondary: '#475569',      // Slate-600
    subtle: '#94a3b8',         // Slate-400
  },
};
```

## 12. Loading States

### 12.1 Skeleton Screens

While loading workflow canvas:

```typescript
const SKELETON_STYLES = {
  backgroundColor: '#e2e8f0',
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  borderRadius: 8,
};
```

### 12.2 Progress Indicators

During execution:

```typescript
const PROGRESS_BAR = {
  height: 4,
  backgroundColor: '#e2e8f0',
  fillColor: '#8b5cf6',
  position: 'top',
  animation: 'indeterminate 1.5s ease-in-out infinite',
};
```

## 13. Error States

### 13.1 Validation Errors

```typescript
const VALIDATION_ERROR = {
  border: '1px solid #ef4444',
  backgroundColor: '#fef2f2',
  textColor: '#dc2626',
  iconColor: '#ef4444',
  messageBackground: '#fee2e2',
  messagePadding: '8px 12px',
  messageBorderRadius: 6,
};
```

### 13.2 Node Errors

```typescript
const NODE_ERROR_OVERLAY = {
  position: 'absolute',
  top: -8,
  right: -8,
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: '#ef4444',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 'bold',
  content: '!',
  border: '2px solid #ffffff',
};
```

## 14. Empty States

### 14.1 Empty Canvas

```
┌────────────────────────────────┐
│                                │
│        📋                      │
│                                │
│    No nodes yet                │
│                                │
│    Drag nodes from the library │
│    to start building your      │
│    workflow                    │
│                                │
│    [+ Add First Node]          │
│                                │
└────────────────────────────────┘
```

Style:

```typescript
const EMPTY_STATE = {
  icon: '📋',
  iconSize: 64,
  title: 'No nodes yet',
  titleSize: 18,
  titleWeight: 600,
  titleColor: '#475569',
  description: 'Drag nodes from the library...',
  descriptionSize: 14,
  descriptionColor: '#94a3b8',
  buttonSize: 'md',
  buttonVariant: 'primary',
  maxWidth: 400,
  textAlign: 'center',
};
```

This completes the visual design specification with exact colors, dimensions, spacing, and styling details needed for pixel-perfect implementation.
