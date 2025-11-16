# Workflow UI Refactor - Requirements Specification

## Overview

### Project Background

Yaak is a privacy-first, cross-platform API client with a recently added workflow feature that allows users to chain HTTP/gRPC requests for end-to-end API testing. The current workflow UI is functional but lacks the polish and advanced features found in modern workflow editors like n8n.

**Current State:**
- Location: `src-web/components/Workflows/`
- Technology: React 19 + ReactFlow 11.11.4
- Layout: 2-panel (Requests sidebar + Canvas)
- Features: Basic drag-drop, node creation, sequential execution
- Limitations: Basic styling, limited interaction features, no advanced layout tools

**Target State:**
- Visual design matching n8n style (from `doc/ui-n8n.html`)
- 3-column layout with dedicated properties panel
- Advanced canvas features (undo/redo, multi-select, auto-layout, keyboard shortcuts)
- Enhanced visual feedback and modern UI polish
- Preserved backend functionality and data compatibility

### Problem Statement

The current workflow UI, while functional, lacks:

1. **Modern Visual Design**: The interface doesn't match contemporary workflow editors in polish and visual hierarchy
2. **Advanced Interaction Features**: Missing undo/redo, multi-select, keyboard shortcuts, context menus
3. **Layout Tools**: No auto-layout, alignment guides, grid snapping, or distribution tools
4. **Visual Feedback**: Limited hover states, animations, and state indicators
5. **User Efficiency**: No minimap navigation, search/filter, or node templates
6. **Professional Appearance**: Current design doesn't convey the quality expected for production workflows

### Goals and Objectives

**Primary Goals:**

1. **Visual Transformation**: Match the n8n design aesthetic with dark header, 3-column layout, and modern styling
2. **Functional Enhancement**: Add undo/redo, multi-select, auto-layout, keyboard shortcuts, and context menus
3. **Improved UX**: Enhance discoverability, reduce friction, and improve workflow editing efficiency
4. **Maintain Compatibility**: Preserve all existing backend functionality and data models
5. **Performance**: Handle 50+ nodes smoothly with responsive interactions

**Secondary Goals:**

1. Establish design patterns for future workflow features
2. Create reusable components for canvas-based editors
3. Document best practices for ReactFlow customization
4. Improve accessibility (keyboard navigation, screen reader support)

### Success Criteria

**Must Have:**

- [ ] 3-column layout matches n8n reference design
- [ ] Dark header bar with breadcrumbs and action buttons
- [ ] Node library sidebar with categorized nodes and search
- [ ] Properties panel with form controls and configuration UI
- [ ] Undo/redo functionality (Ctrl+Z, Ctrl+Shift+Z)
- [ ] Multi-select nodes (Ctrl+Click, box selection)
- [ ] Drag connections from output to input ports
- [ ] Keyboard shortcuts for common actions
- [ ] Context menus (right-click on nodes, edges, canvas)
- [ ] Auto-layout algorithm for organizing nodes
- [ ] Node state visualization (normal, selected, disabled, error)
- [ ] All existing workflows load and execute correctly
- [ ] No data migration required

**Should Have:**

- [ ] Alignment tools (left, right, center, top, bottom, distribute)
- [ ] Grid snapping with visual feedback
- [ ] Canvas minimap navigation
- [ ] Zoom controls with percentage display
- [ ] Node search/filter on canvas
- [ ] Hover animations and transitions
- [ ] Loading states during execution
- [ ] Error state visualization with tooltips
- [ ] Breadcrumb navigation
- [ ] Save/execute buttons in header

**Nice to Have:**

- [ ] Node templates/favorites
- [ ] Node grouping/containers
- [ ] Canvas position indicator
- [ ] Workflow status badge
- [ ] Last execution timestamp
- [ ] Copy/paste nodes
- [ ] Duplicate node command
- [ ] Export workflow as image
- [ ] Dark mode optimization

**Performance Criteria:**

- Canvas remains responsive with 50+ nodes
- Drag operations have < 16ms frame time (60 FPS)
- Undo/redo operations complete in < 100ms
- Initial render of 20 nodes completes in < 500ms
- Search/filter results appear in < 200ms

**Accessibility Criteria:**

- All interactive elements keyboard accessible
- Tab order follows logical flow
- Focus indicators visible and clear
- ARIA labels on canvas elements
- Screen reader announces node operations

---

## User Stories

### Visual Design Stories

#### US-1: Modern 3-Column Layout
**As a** workflow designer
**I want** a 3-column layout with sidebar, canvas, and properties panel
**So that** I can see node options and properties without switching contexts

**Acceptance Criteria:**
1. WHEN the workflow editor loads, THEN I SHALL see three distinct columns
2. WHEN viewing the interface, THEN the left sidebar SHALL be 280px wide with node library
3. WHEN viewing the interface, THEN the center canvas SHALL take remaining flex space
4. WHEN viewing the interface, THEN the right properties panel SHALL be 320px wide
5. WHEN no node is selected, THEN the properties panel SHALL show "No Node Selected" state
6. WHEN I select a node, THEN the properties panel SHALL display node configuration

#### US-2: Dark Header Bar with Navigation
**As a** workflow user
**I want** a dark header bar with breadcrumbs and action buttons
**So that** I can easily navigate and execute workflows

**Acceptance Criteria:**
1. WHEN viewing the editor, THEN the header SHALL have dark background (#1e2b3c)
2. WHEN viewing the header, THEN breadcrumbs SHALL show workspace > workflows > {name}
3. WHEN viewing the header, THEN action buttons SHALL be right-aligned
4. WHEN viewing the header, THEN buttons SHALL include Save, Execute, Export, New
5. WHEN I click breadcrumb links, THEN I SHALL navigate to parent routes
6. WHEN I hover over buttons, THEN background SHALL lighten (rgba(255,255,255,0.25))

#### US-3: Node Library Sidebar with Categories
**As a** workflow designer
**I want** categorized nodes with icons and descriptions
**So that** I can quickly find and add the nodes I need

**Acceptance Criteria:**
1. WHEN viewing sidebar, THEN nodes SHALL be grouped by Triggers, Actions, Logic Control
2. WHEN viewing categories, THEN each SHALL have expand/collapse toggle
3. WHEN viewing nodes, THEN each card SHALL show icon, name, and description
4. WHEN I search, THEN results SHALL filter across all categories
5. WHEN I hover over a node card, THEN it SHALL lift and show border highlight
6. WHEN categories are collapsed, THEN node cards SHALL be hidden

#### US-4: Professional Node Styling
**As a** workflow user
**I want** nodes styled like n8n with clear visual hierarchy
**So that** workflows look professional and polished

**Acceptance Criteria:**
1. WHEN viewing nodes, THEN they SHALL be square (100x100px) with rounded corners
2. WHEN viewing nodes, THEN they SHALL have header section with icon and title
3. WHEN viewing nodes, THEN body SHALL display main content/icon
4. WHEN viewing nodes, THEN they SHALL have subtle shadow (0 4px 20px rgba(0,0,0,0.08))
5. WHEN I hover over a node, THEN it SHALL lift with enhanced shadow
6. WHEN node is selected, THEN it SHALL have blue border (#2c77df)
7. WHEN node has error, THEN it SHALL have red border with pulsing animation

#### US-5: Visual State Indicators
**As a** workflow user
**I want** clear visual indicators for node states
**So that** I can immediately understand workflow status

**Acceptance Criteria:**
1. WHEN node is disabled, THEN it SHALL show opacity 0.6 and grayscale filter
2. WHEN node has error, THEN it SHALL show red exclamation icon in top-right
3. WHEN workflow is active, THEN header SHALL show green "Active" badge
4. WHEN viewing status, THEN header SHALL show last execution timestamp
5. WHEN node is executing, THEN it SHALL show animated loading indicator
6. WHEN hovering error node, THEN tooltip SHALL display error message

### Functional Enhancement Stories

#### US-6: Undo/Redo Functionality
**As a** workflow designer
**I want** undo and redo capabilities
**So that** I can experiment freely and recover from mistakes

**Acceptance Criteria:**
1. WHEN I create a node, THEN undo SHALL remove it
2. WHEN I delete a node, THEN undo SHALL restore it
3. WHEN I move a node, THEN undo SHALL restore previous position
4. WHEN I create an edge, THEN undo SHALL remove it
5. WHEN I press Ctrl+Z, THEN the last action SHALL be undone
6. WHEN I press Ctrl+Shift+Z, THEN the last undo SHALL be redone
7. WHEN undo is unavailable, THEN Ctrl+Z SHALL do nothing
8. WHEN redo is unavailable, THEN Ctrl+Shift+Z SHALL do nothing
9. WHEN I make 20+ changes, THEN undo stack SHALL retain all actions
10. WHEN I undo then make new change, THEN redo stack SHALL be cleared

#### US-7: Multi-Select Nodes
**As a** workflow designer
**I want** to select multiple nodes simultaneously
**So that** I can perform bulk operations efficiently

**Acceptance Criteria:**
1. WHEN I Ctrl+Click nodes, THEN they SHALL be added to selection
2. WHEN I Ctrl+Click selected node, THEN it SHALL be deselected
3. WHEN I drag on canvas, THEN box selection SHALL appear
4. WHEN box intersects nodes, THEN they SHALL be selected
5. WHEN multiple nodes selected, THEN all SHALL show selected border
6. WHEN I click canvas, THEN all selections SHALL be cleared
7. WHEN I press Delete with multi-select, THEN all SHALL be deleted
8. WHEN I drag multi-select, THEN all SHALL move together
9. WHEN multi-select active, THEN properties panel SHALL show "Multiple nodes selected"

#### US-8: Drag Connection Creation with Animation
**As a** workflow designer
**I want** to create connections by dragging from output to input ports with smooth visual feedback
**So that** connection creation feels intuitive, visual, and responsive

**Acceptance Criteria:**
1. WHEN I mousedown on output port, THEN connection mode SHALL activate
2. WHEN dragging connection, THEN temporary bezier curve line SHALL follow cursor in real-time
3. WHEN dragging connection, THEN temporary line SHALL be dashed (5px dash, 3px gap)
4. WHEN dragging connection, THEN temporary line SHALL use primary color (#2c77df)
5. WHEN dragging connection, THEN all valid input ports SHALL highlight with blue background
6. WHEN dragging connection, THEN highlighted ports SHALL scale to 1.3x size
7. WHEN dragging connection, THEN highlighted ports SHALL show glow shadow (0 0 8px rgba(44, 119, 223, 0.5))
8. WHEN hovering over valid input port while dragging, THEN port SHALL pulse/animate
9. WHEN I release on input port, THEN edge SHALL be created in database
10. WHEN I release on canvas, THEN temporary line SHALL disappear immediately
11. WHEN dragging, THEN cursor SHALL show "grabbing" effect
12. WHEN connection is invalid (same node), THEN input port SHALL not highlight
13. WHEN temporary line renders, THEN it SHALL use smooth bezier curve path
14. WHEN I cancel drag (Escape key), THEN temporary line SHALL disappear

#### US-9: Keyboard Shortcuts
**As a** power user
**I want** comprehensive keyboard shortcuts
**So that** I can work efficiently without mouse

**Acceptance Criteria:**
1. WHEN I press Delete/Backspace, THEN selected nodes SHALL be deleted
2. WHEN I press Escape, THEN selections SHALL be cleared
3. WHEN I press Ctrl+Z, THEN last action SHALL be undone
4. WHEN I press Ctrl+Shift+Z, THEN last undo SHALL be redone
5. WHEN I press Ctrl+0, THEN zoom SHALL reset to 100%
6. WHEN I press Ctrl+A, THEN all nodes SHALL be selected
7. WHEN I press F, THEN canvas SHALL fit to view
8. WHEN I press Ctrl+C, THEN selected nodes SHALL be copied (future)
9. WHEN I press Ctrl+V, THEN clipboard nodes SHALL be pasted (future)
10. WHEN shortcuts triggered, THEN actions SHALL execute in < 100ms

#### US-10: Context Menus
**As a** workflow designer
**I want** context menus with common actions
**So that** I can access features quickly with right-click

**Acceptance Criteria:**
1. WHEN I right-click node, THEN node context menu SHALL appear
2. WHEN I right-click edge, THEN edge context menu SHALL appear
3. WHEN I right-click canvas, THEN canvas context menu SHALL appear
4. WHEN node menu open, THEN it SHALL show: Copy, Delete, Execute, Rename, Disable, History
5. WHEN edge menu open, THEN it SHALL show: Delete Connection, Select Output Branch, Add Conditional Jump
6. WHEN canvas menu open, THEN it SHALL show: Paste, Create, Align Left/Right, Distribute, Run All
7. WHEN I click menu item, THEN action SHALL execute and menu SHALL close
8. WHEN I click outside menu, THEN menu SHALL close
9. WHEN menu displays, THEN keyboard shortcuts SHALL be visible
10. WHEN edge menu "Select Output Branch" clicked, THEN UI SHALL allow selecting which output branch (for nodes with multiple outputs)
11. WHEN edge menu "Add Conditional Jump" clicked, THEN UI SHALL show condition editor for logic nodes
12. WHEN "Delete Connection" selected from edge menu, THEN edge SHALL be removed from database and canvas

#### US-11: Auto-Layout Algorithm
**As a** workflow designer
**I want** automatic node layout
**So that** complex workflows remain organized and readable

**Acceptance Criteria:**
1. WHEN I click "Auto Layout" button, THEN nodes SHALL arrange hierarchically
2. WHEN auto-layout runs, THEN trigger nodes SHALL be leftmost
3. WHEN auto-layout runs, THEN downstream nodes SHALL be right of dependencies
4. WHEN auto-layout runs, THEN parallel branches SHALL be vertically distributed
5. WHEN auto-layout runs, THEN node spacing SHALL be consistent (200px horizontal, 150px vertical)
6. WHEN layout completes, THEN transitions SHALL animate smoothly (300ms)
7. WHEN nodes overlap, THEN auto-layout SHALL resolve conflicts
8. WHEN layout changes, THEN it SHALL be added to undo stack

#### US-12: Alignment Tools
**As a** workflow designer
**I want** alignment and distribution tools
**So that** I can create visually clean workflow layouts

**Acceptance Criteria:**
1. WHEN I select 2+ nodes, THEN alignment tools SHALL be enabled
2. WHEN I click "Align Left", THEN nodes SHALL align to leftmost X position
3. WHEN I click "Align Right", THEN nodes SHALL align to rightmost X position
4. WHEN I click "Align Top", THEN nodes SHALL align to topmost Y position
5. WHEN I click "Align Bottom", THEN nodes SHALL align to bottommost Y position
6. WHEN I click "Align Center Horizontal", THEN nodes SHALL align to average X
7. WHEN I click "Align Center Vertical", THEN nodes SHALL align to average Y
8. WHEN I click "Distribute Horizontal", THEN nodes SHALL space evenly horizontally
9. WHEN I click "Distribute Vertical", THEN nodes SHALL space evenly vertically
10. WHEN alignment executes, THEN changes SHALL animate and add to undo stack

### Canvas Interaction Stories

#### US-13: Enhanced Grid Snapping
**As a** workflow designer
**I want** visual grid snapping feedback
**So that** nodes align precisely during placement

**Acceptance Criteria:**
1. WHEN I drag node, THEN it SHALL snap to 20px grid
2. WHEN dragging near grid line, THEN node SHALL snap with visual feedback
3. WHEN grid snapping active, THEN dot grid SHALL be visible
4. WHEN zoomed out, THEN grid dots SHALL scale appropriately
5. WHEN I hold Shift while dragging, THEN grid snapping SHALL be disabled
6. WHEN node snaps, THEN subtle haptic feedback SHALL occur (if supported)

#### US-14: Canvas Minimap
**As a** workflow designer
**I want** a minimap for navigation
**So that** I can orient myself in large workflows

**Acceptance Criteria:**
1. WHEN viewing canvas, THEN minimap SHALL appear in bottom-left corner
2. WHEN viewing minimap, THEN nodes SHALL show as colored rectangles
3. WHEN viewing minimap, THEN trigger nodes SHALL be green (#10b981)
4. WHEN viewing minimap, THEN action nodes SHALL be purple (#8b5cf6)
5. WHEN viewing minimap, THEN logic nodes SHALL be amber (#f59e0b)
6. WHEN I click minimap, THEN canvas SHALL pan to that location
7. WHEN I drag minimap viewport, THEN canvas SHALL pan accordingly
8. WHEN canvas moves, THEN minimap viewport SHALL update

#### US-15: Zoom and Pan Controls
**As a** workflow designer
**I want** precise zoom and pan controls
**So that** I can navigate workflows of any size

**Acceptance Criteria:**
1. WHEN viewing canvas, THEN zoom controls SHALL appear in bottom-right
2. WHEN I click "+", THEN zoom SHALL increase by 10%
3. WHEN I click "-", THEN zoom SHALL decrease by 10%
4. WHEN I click "fit view", THEN canvas SHALL zoom to show all nodes
5. WHEN I scroll wheel, THEN zoom SHALL adjust smoothly
6. WHEN I pinch trackpad, THEN zoom SHALL follow gesture
7. WHEN I drag canvas, THEN viewport SHALL pan
8. WHEN zoom changes, THEN percentage SHALL display (e.g., "80%")
9. WHEN I press Ctrl+0, THEN zoom SHALL reset to 100%

#### US-16: Node Search and Filter
**As a** workflow designer
**I want** to search and filter nodes on canvas
**So that** I can find specific nodes in complex workflows

**Acceptance Criteria:**
1. WHEN I press Ctrl+F, THEN search box SHALL appear
2. WHEN I type search query, THEN matching nodes SHALL highlight
3. WHEN searching, THEN non-matching nodes SHALL dim (opacity 0.4)
4. WHEN I press Enter, THEN canvas SHALL pan to next match
5. WHEN I press Shift+Enter, THEN canvas SHALL pan to previous match
6. WHEN I press Escape, THEN search SHALL close and all nodes SHALL restore
7. WHEN search active, THEN match count SHALL display (e.g., "3 of 15")

### Properties Panel Stories

#### US-17: Dynamic Form Controls
**As a** workflow designer
**I want** intuitive form controls for node configuration
**So that** I can configure nodes without consulting documentation

**Acceptance Criteria:**
1. WHEN I select HTTP node, THEN form SHALL show Method, URL, Body fields
2. WHEN I select Conditional node, THEN form SHALL show Condition expression field
3. WHEN I select Loop node, THEN form SHALL show Loop Type and Count/Array fields
4. WHEN I select Email node, THEN form SHALL show To, Subject, Body fields
5. WHEN fields change, THEN "Save Changes" button SHALL appear
6. WHEN I click "Save Changes", THEN config SHALL persist to database
7. WHEN save succeeds, THEN button SHALL disappear
8. WHEN I switch nodes with unsaved changes, THEN I SHALL see confirmation dialog

#### US-18: Code Editor for Templates
**As a** workflow designer
**I want** syntax-highlighted code editor for expressions
**So that** I can write template expressions accurately

**Acceptance Criteria:**
1. WHEN editing code fields, THEN Monaco/CodeMirror editor SHALL be used
2. WHEN typing templates, THEN {{}} syntax SHALL be highlighted
3. WHEN typing JSON, THEN syntax SHALL be validated
4. WHEN hovering template variable, THEN autocomplete SHALL suggest available variables
5. WHEN syntax invalid, THEN error indicators SHALL show
6. WHEN I press Tab, THEN indentation SHALL increase
7. WHEN I press Ctrl+Space, THEN autocomplete SHALL trigger

### Error Handling Stories

#### US-19: Visual Error States
**As a** workflow user
**I want** clear visual indicators when nodes fail
**So that** I can quickly identify and fix issues

**Acceptance Criteria:**
1. WHEN node execution fails, THEN node SHALL show error state (red border)
2. WHEN hovering error node, THEN tooltip SHALL display error message
3. WHEN error occurs, THEN exclamation icon SHALL appear in top-right
4. WHEN edge connects to error node, THEN edge SHALL be red dashed line
5. WHEN workflow fails, THEN status badge SHALL show "Failed" in red
6. WHEN I click error node, THEN properties panel SHALL show error details
7. WHEN I fix error and re-run, THEN error state SHALL clear

#### US-20: Graceful Loading States
**As a** workflow user
**I want** loading indicators during operations
**So that** I understand when actions are processing

**Acceptance Criteria:**
1. WHEN workflow executes, THEN executing nodes SHALL show spinner
2. WHEN loading workflow, THEN canvas SHALL show skeleton state
3. WHEN saving configuration, THEN save button SHALL show spinner
4. WHEN auto-layout runs, THEN "Organizing..." message SHALL display
5. WHEN operation completes, THEN loading state SHALL disappear
6. WHEN operation takes > 2s, THEN progress indicator SHALL appear

---

## Functional Requirements

### FR-1: Layout and Structure

**FR-1.1 Three-Column Layout**
- Left sidebar: 280px fixed width, node library
- Center canvas: Flexible width, takes remaining space
- Right properties panel: 320px fixed width, node configuration
- All panels shall have border separators (#e0e6ee)
- Panels shall be non-resizable in V1 (future enhancement)

**FR-1.2 Header Bar**
- Height: 60px fixed
- Background: #1e2b3c (dark)
- Text color: white
- Breadcrumbs: workspace > workflows > {workflow.name}
- Action buttons: New, Export, Save, Execute
- User section: Notifications, Help, Avatar (right-aligned)

**FR-1.3 Sidebar Tabs**
- Two tabs: "Node Library", "My Nodes" (future)
- Active tab: Blue underline indicator (#2c77df)
- Search box: Full-width, with magnifying glass icon
- Categories: Collapsible sections (Triggers, Actions, Logic Control)

**FR-1.4 Canvas Area**
- Background: #f6f9fc (light gray)
- Dot grid pattern: 24px spacing, rgba(224,230,238,0.5)
- Controls position: bottom-right (zoom, fit view, refresh)
- Minimap position: bottom-left
- Position indicator: bottom-left, shows X/Y coordinates and zoom

**FR-1.5 Properties Panel**
- Header: Node icon + name
- Form sections: Name, Description, Configuration
- Footer: Save/Cancel buttons (only when changes pending)
- Empty state: "No Node Selected" with icon

### FR-2: Node Library

**FR-2.1 Node Categories**
- **Triggers**: Manual, Webhook, Timer
- **Actions**: HTTP Request, gRPC Request, Email, Database, WebSocket
- **Logic Control**: Conditional, Loop, Parallel

**FR-2.2 Node Card Design**
- Size: Variable height, 2-column grid (12px gap)
- Background: white with border
- Hover: Lift effect (translateY(-3px)), shadow, blue border
- Content: Icon (24px), Name (0.8rem), Description (hidden or truncated)

**FR-2.3 Search Functionality**
- Filter by name, description, or subtype
- Real-time filtering (debounced 200ms)
- Case-insensitive matching
- "No results" message when empty

**FR-2.4 Drag-and-Drop**
- Drag from node card to canvas
- Transfer data: nodeType, nodeSubtype
- Canvas drop creates node at cursor position
- Cursor shows "copy" effect during drag

### FR-3: Canvas Features

**FR-3.1 Node Rendering**
- Size: 100x100px square
- Border radius: 12px
- Shadow: 0 4px 20px rgba(0,0,0,0.08)
- Header: 30px height, light blue background
- Ports: 12px circle, white with blue border

**FR-3.2 Node States**
- **Normal**: Default styling
- **Selected**: 2px solid blue border (#2c77df)
- **Disabled**: Opacity 0.6, grayscale(0.7), "Disabled" badge
- **Error**: 2px solid red border (#f75a5a), pulsing animation, error icon
- **Executing**: Loading spinner in body

**FR-3.3 Edge Rendering**
- Default: 2px solid #94a3b8 (gray)
- Selected: 3px solid #2c77df (blue)
- Error: 2px dashed #f75a5a (red)
- Curve type: Bezier smooth curves
- End marker: Small circle

**FR-3.4 Grid and Snapping**
- Grid size: 20px × 20px
- Snap threshold: 10px (half grid)
- Visual feedback: Grid dots visible
- Toggle: Shift key disables snapping

### FR-4: Interaction Features

**FR-4.1 Selection**
- Single click: Select node, deselect others
- Ctrl+Click: Add to selection
- Box selection: Drag on empty canvas
- Click canvas: Clear all selections
- Escape key: Clear all selections

**FR-4.2 Drag Operations**
- Drag node: Move position, update database on release (debounced 500ms)
- Drag multiple: All selected nodes move together
- Drag port: Create connection preview
- Grid snapping: Apply to all drag operations

**FR-4.3 Context Menus**
- Right-click node: Node menu (Copy, Delete, Execute, Rename, Disable, History)
- Right-click edge: Edge menu (Delete Connection, Select Output Branch, Add Conditional Jump)
- Right-click canvas: Canvas menu (Paste, Create, Align, Distribute, Run)
- Menu styling: White background, rounded corners, shadow
- Menu items: Icon + label + shortcut (right-aligned)
- Edge-specific actions:
  - Delete Connection: Removes edge from database and UI
  - Select Output Branch: Shows branch selector for nodes with multiple outputs (future V2)
  - Add Conditional Jump: Opens condition editor for logic/conditional nodes (future V2)

**FR-4.4 Keyboard Shortcuts**
| Shortcut | Action |
|----------|--------|
| Delete/Backspace | Delete selected nodes |
| Escape | Clear selection |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+0 | Reset zoom to 100% |
| Ctrl+A | Select all nodes |
| Ctrl+C | Copy nodes (future) |
| Ctrl+V | Paste nodes (future) |
| F | Fit view |
| Ctrl+F | Search nodes (future) |

### FR-5: Advanced Features

**FR-5.1 Undo/Redo**
- Track operations: Create node, Delete node, Move node, Create edge, Delete edge
- Stack size: 50 actions (circular buffer)
- Clear redo stack on new action after undo
- Operations complete in < 100ms
- Visual feedback: Toolbar button states (enabled/disabled)

**FR-5.2 Auto-Layout**
- Algorithm: Dagre hierarchical layout
- Direction: Left to right
- Node spacing: 200px horizontal, 150px vertical
- Rank separation: 200px between levels
- Animation: Smooth transition (300ms ease-in-out)
- Preserve manual adjustments: Optional flag (future)

**FR-5.3 Alignment Tools**
- Enabled when: 2+ nodes selected
- Align left: Min X coordinate
- Align right: Max X + width coordinate
- Align top: Min Y coordinate
- Align bottom: Max Y + height coordinate
- Align center H: Average X + width/2
- Align center V: Average Y + height/2
- Distribute H: Even spacing between min and max X
- Distribute V: Even spacing between min and max Y

**FR-5.4 Minimap**
- Size: 200px × 150px
- Position: Bottom-left corner
- Node colors: By type (trigger=green, action=purple, logic=amber)
- Viewport indicator: Semi-transparent rectangle
- Interactions: Click to pan, drag viewport to pan

### FR-6: Properties Panel Forms

**FR-6.1 Common Fields**
- Node Name: Text input, required
- Description: Textarea, optional, 2 rows
- Configuration: Dynamic based on nodeSubtype

**FR-6.2 HTTP Request Node**
- Method: Dropdown (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- URL: Text input with template support
- Headers: Key-value pairs (future)
- Body: Code editor (JSON/XML)
- Authentication: Dropdown (future)

**FR-6.3 Conditional Node**
- Condition: Code editor with template syntax
- Hint text: Example template reference
- Validation: Syntax checking (future)

**FR-6.4 Loop Node**
- Loop Type: Dropdown (Fixed Count, Iterate Array)
- Count: Number input (if Fixed Count)
- Array Variable: Template input (if Iterate Array)
- Max Iterations: Number input (safety limit)

**FR-6.5 Form Validation**
- Required fields: Show error if empty on save
- Type validation: Number fields reject non-numeric
- Template syntax: Validate {{ }} pairs (future)
- Save button: Disabled if validation fails

---

## Non-Functional Requirements

### NFR-1: Performance

**NFR-1.1 Rendering Performance**
- Initial render (20 nodes): < 500ms
- Drag operation frame time: < 16ms (60 FPS)
- Zoom operation: < 16ms per frame
- Auto-layout (50 nodes): < 1000ms
- Undo/redo: < 100ms

**NFR-1.2 Responsiveness**
- Search filter: < 200ms after typing stops
- Context menu open: < 50ms
- Node selection: < 50ms
- Database save: < 500ms (user-perceivable feedback)

**NFR-1.3 Memory**
- Undo stack: Max 50 actions × ~2KB = ~100KB
- Canvas with 100 nodes: < 50MB total memory
- No memory leaks during prolonged use (8-hour session)

### NFR-2: Accessibility

**NFR-2.1 Keyboard Navigation**
- All interactive elements accessible via Tab
- Tab order: Header → Sidebar → Canvas → Properties
- Focus indicators: 2px blue outline
- Skip links: "Skip to canvas" from header

**NFR-2.2 Screen Reader Support**
- Nodes: aria-label with name and type
- Edges: aria-label with source → target
- Toolbar buttons: aria-label with action
- Canvas: aria-label "Workflow canvas with X nodes"
- Live regions: Announce node creation/deletion

**NFR-2.3 Visual Accessibility**
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Focus indicators: Visible in all themes
- Error states: Not relying solely on color (icons + text)
- Font size: Minimum 0.8rem (12.8px at default zoom)

### NFR-3: Browser Compatibility

**NFR-3.1 Supported Browsers**
- Chrome: 120+
- Firefox: 120+
- Safari: 17+
- Edge: 120+

**NFR-3.2 Features**
- Flexbox: Required
- CSS Grid: Required
- ES2021: Required
- ResizeObserver: Required
- IntersectionObserver: Optional (progressive enhancement)

### NFR-4: Responsive Design

**NFR-4.1 Minimum Resolution**
- Width: 1280px
- Height: 720px
- Zoom: 80% minimum, 200% maximum

**NFR-4.2 Layout Breakpoints**
- < 1440px: Hide minimap
- < 1280px: Reduce sidebar widths (240px / 280px)
- < 1024px: Not officially supported (show warning)

### NFR-5: Code Quality

**NFR-5.1 TypeScript**
- Strict mode enabled
- No `any` types without explicit reason
- All props interfaces documented
- Exported types for reusability

**NFR-5.2 React Patterns**
- Functional components only
- Custom hooks for logic extraction
- Memoization where beneficial (React.memo, useMemo, useCallback)
- Proper dependency arrays in useEffect

**NFR-5.3 Testing**
- Unit tests: All hooks (useUndo, useMultiSelect, useAutoLayout)
- Component tests: Node library, properties panel
- Integration tests: Canvas drag-drop, connection creation
- E2E tests: Full workflow creation and execution (future)

**NFR-5.4 Documentation**
- JSDoc comments on all exported functions/components
- README.md with setup instructions
- ARCHITECTURE.md explaining design decisions
- Inline comments for complex logic only

---

## Feature Comparison Table

| Feature | Current UI | Target UI | Priority |
|---------|-----------|-----------|----------|
| **Layout** |
| Number of columns | 2 (sidebar + canvas) | 3 (sidebar + canvas + properties) | High |
| Header bar | Basic with execute button | Dark header with breadcrumbs, actions, user menu | High |
| Node library position | Left sidebar | Left sidebar (enhanced) | Medium |
| Properties panel | None (uses separate route) | Right panel (inline editing) | High |
| **Visual Design** |
| Node style | Basic rectangles | Square cards with header/body | High |
| Color scheme | Default Yaak theme | n8n-inspired (blues, purples, greens) | Medium |
| Shadows | Minimal | Layered with hover effects | Medium |
| Animations | None | Hover lifts, smooth transitions | Low |
| Grid background | Dots | Enhanced dots with snap feedback | Medium |
| **Node Interaction** |
| Selection | Single click | Single + multi-select (Ctrl+Click, box) | High |
| Drag creation | Yes (basic) | Enhanced with port highlighting | High |
| Context menus | No | Yes (node, edge, canvas) | High |
| Keyboard shortcuts | Delete, Escape only | Full suite (10+ shortcuts) | High |
| Undo/Redo | No | Yes (Ctrl+Z, Ctrl+Shift+Z) | High |
| **Layout Tools** |
| Auto-layout | No | Yes (Dagre algorithm) | High |
| Alignment | No | Yes (left, right, top, bottom, center) | Medium |
| Distribution | No | Yes (horizontal, vertical) | Medium |
| Grid snapping | Yes (basic) | Enhanced with visual feedback | Medium |
| **Navigation** |
| Zoom controls | Yes (ReactFlow default) | Enhanced with percentage display | Medium |
| Minimap | Yes (basic) | Colored by node type | Low |
| Pan | Yes | Yes (unchanged) | Low |
| Fit to view | Yes | Yes (unchanged) | Low |
| Search/filter | No | Yes (Ctrl+F) | Low |
| **Configuration** |
| Properties editing | Separate panel/route | Inline right panel | High |
| Form controls | Basic inputs | Dynamic forms per node type | High |
| Code editor | Textarea | Monaco/CodeMirror with syntax highlighting | Medium |
| Save feedback | Minimal | Clear button states, loading indicators | Medium |
| **State Visualization** |
| Normal state | Basic | Enhanced with hover effects | Medium |
| Selected state | Border change | Bold border + shadow | High |
| Disabled state | Opacity | Opacity + grayscale + badge | Medium |
| Error state | None | Red border + icon + tooltip + animation | High |
| Executing state | None | Spinner animation | Medium |
| **Data Compatibility** |
| Workflow model | V1 schema | V1 schema (unchanged) | Critical |
| Node model | V1 schema | V1 schema (add positionX/Y if missing) | Critical |
| Edge model | V1 schema | V1 schema (unchanged) | Critical |
| Backward compatibility | N/A | All existing workflows load correctly | Critical |

---

## Constraints and Assumptions

### Technical Constraints

1. **ReactFlow Library**: Must use ReactFlow 11.11.4 (or compatible version). Cannot replace with custom implementation.
2. **React Version**: React 19 with concurrent features.
3. **Tailwind CSS**: All styling via Tailwind utility classes, minimal custom CSS.
4. **Jotai State**: Global state management via Jotai atoms.
5. **TypeScript**: Strict mode with no implicit any.
6. **Tauri IPC**: Backend communication limited to existing Tauri commands.

### Data Constraints

1. **No Schema Changes**: Cannot modify Workflow, WorkflowStep, WorkflowNode models (except optional position fields).
2. **No Migration**: Existing workflows must load without data migration.
3. **Backward Compatibility**: Old UI (if kept) must still function with new data.
4. **Database Writes**: All changes must use existing `patchModel` and `createModel` APIs.

### Design Constraints

1. **n8n Reference**: Visual design must closely match `doc/ui-n8n.html` reference.
2. **Yaak Theme**: Colors must align with Yaak's existing theme variables.
3. **Responsive Limits**: Minimum 1280px width, not mobile-optimized.
4. **Accessibility**: WCAG AA compliance for contrast and keyboard navigation.

### Performance Constraints

1. **Large Workflows**: Must handle 50+ nodes without lag.
2. **60 FPS**: Drag operations must maintain 60 FPS.
3. **Memory**: Undo stack limited to 50 actions to prevent unbounded growth.

### Development Constraints

1. **No New Dependencies**: Avoid adding new npm packages unless critical (justify in design).
2. **File Organization**: Follow existing structure in `src-web/components/Workflows/`.
3. **Testing**: Manual testing acceptable for V1, unit tests for hooks preferred.

### Assumptions

1. **Browser Support**: Users run modern browsers (Chrome 120+, Firefox 120+, Safari 17+).
2. **Screen Resolution**: Users have 1440px+ width displays.
3. **Mouse and Keyboard**: Users have both input methods available.
4. **Single User**: No real-time collaboration in V1.
5. **Workflow Complexity**: Most workflows have < 30 nodes.
6. **Execution**: Backend execution engine unchanged, UI is purely presentational refactor.

---

## Out of Scope (Future Enhancements)

The following features are explicitly **not included** in this refactor:

1. **Real-time Collaboration**: Multi-user editing with conflict resolution
2. **Workflow Templates**: Predefined workflow templates library
3. **Node Grouping**: Visual containers for organizing related nodes
4. **Conditional Branching**: Multiple output ports per node
5. **Loop Visualizations**: Visual indicators for loop iterations
6. **Execution History**: Timeline view of past workflow runs
7. **Variable Inspector**: Panel showing all available template variables
8. **Export Formats**: Export as PNG, SVG, JSON, YAML
9. **Import Workflows**: Import from n8n, Zapier, Make.com formats
10. **Custom Themes**: User-created color schemes
11. **Node Marketplace**: Browse and install community nodes
12. **Debugging Tools**: Breakpoints, step-through execution
13. **Performance Profiling**: Execution time visualization
14. **Workflow Versioning**: Git-like version control for workflows
15. **Responsive Mobile**: Touch-optimized interface for tablets/phones
16. **Offline Support**: Service worker for offline editing
17. **Workflow Linting**: Validation warnings for anti-patterns
18. **A/B Testing**: Multiple workflow variants with split testing
19. **Scheduled Execution**: Cron-based workflow triggers (backend feature)
20. **Webhook Management**: UI for managing webhook endpoints (backend feature)

These features may be considered for future releases after the core refactor is complete and validated.

---

## Glossary

- **Node**: A single unit in the workflow representing a trigger, action, or logic control
- **Edge**: A connection between two nodes defining execution flow
- **Port**: Input/output connection point on a node
- **Canvas**: The main work area where nodes and edges are visualized
- **ReactFlow**: Open-source library for building node-based UIs
- **Jotai**: Atomic state management library for React
- **Dagre**: Graph layout algorithm library
- **Template Syntax**: Variable interpolation using `{{variable}}` notation
- **Undo Stack**: Data structure storing reversible actions
- **Auto-layout**: Algorithmic node positioning for optimal readability
- **Multi-select**: Selecting multiple nodes simultaneously
- **Box Selection**: Drag selection by drawing a rectangle on canvas
- **Grid Snapping**: Automatic alignment to grid lines during drag
- **Minimap**: Small overview of entire canvas
- **Properties Panel**: Configuration UI for selected node
- **Context Menu**: Right-click menu with contextual actions
- **Breadcrumbs**: Navigation trail showing current location
- **WCAG**: Web Content Accessibility Guidelines
