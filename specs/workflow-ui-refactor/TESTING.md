# Workflow UI Refactor - Manual Testing Checklist

## Overview

This document provides a comprehensive manual testing checklist for the Workflow UI refactor feature. Each section includes specific test cases that must be verified before release.

**Testing Environment Setup:**
1. Start development server: `npm start`
2. Open Yaak application
3. Navigate to a workspace with workflows

---

## 1. Visual Design Verification

### 1.1 Header Component
- [ ] Header height is 60px with dark background (#1e2b3c)
- [ ] Breadcrumbs display: workspace > workflows > {workflow.name}
- [ ] All breadcrumb links navigate correctly
- [ ] Action buttons (New, Export, Save, Execute) have proper hover states
- [ ] User section displays notification and help icons
- [ ] Header is responsive and elements don't overlap

### 1.2 Toolbar Component
- [ ] Toolbar height is 48px with bottom border
- [ ] Undo/Redo buttons show correct disabled states
- [ ] Auto-layout button is visible and properly styled
- [ ] Alignment buttons appear when 2+ nodes selected
- [ ] Zoom percentage displays accurately (matches actual zoom)
- [ ] Selection count updates in real-time
- [ ] All buttons have tooltips on hover (500ms delay)
- [ ] Icon buttons are 32x32px

### 1.3 Node Library Sidebar
- [ ] Sidebar width is 280px
- [ ] Background color is #f0f4f9
- [ ] Tabs have active underline animation (blue, 3px height)
- [ ] Search box has visible focus ring
- [ ] Category headers are collapsible
- [ ] Collapse state persists after page reload (localStorage)
- [ ] "No results" message appears for empty search
- [ ] Node cards have 12px gap in 2-column grid

### 1.4 Node Cards (Library)
- [ ] Cards lift on hover (-translateY(-3px))
- [ ] Shadow increases on hover (shadow to shadow-lg)
- [ ] Border changes to primary color on hover
- [ ] Transition is smooth (200ms ease-out)
- [ ] Cursor changes to grabbing during drag
- [ ] Icons are 24px and centered

### 1.5 Canvas Nodes
- [ ] Node size is 100x100px with rounded-xl corners
- [ ] Header is 30px with colored background per node type
- [ ] Selected nodes have primary border and shadow-lg
- [ ] Error nodes have danger border with pulse animation
- [ ] Disabled nodes have opacity-60 and grayscale with "Disabled" badge
- [ ] Executing nodes show loading spinner
- [ ] Hover effect lifts node (-translateY(5px))

### 1.6 Properties Panel
- [ ] Panel shows "No Node Selected" state when empty
- [ ] Panel header displays node icon and name
- [ ] Form fields have proper labels and hints
- [ ] Required fields show red asterisk
- [ ] Focus rings are visible on inputs
- [ ] Save button appears when form is dirty
- [ ] "Saved!" message shows briefly after successful save

### 1.7 Context Menus
- [ ] Menus appear at cursor position
- [ ] Menus have proper shadow and border
- [ ] Items show icons, labels, and shortcuts
- [ ] Disabled items have opacity-50
- [ ] Danger items have red text
- [ ] Menus close on click outside

### 1.8 Skeleton Loading
- [ ] Skeleton appears on initial page load
- [ ] Skeleton nodes are arranged in grid pattern
- [ ] Pulsing animation is smooth
- [ ] Skeleton disappears when data loads
- [ ] Loading spinner with "Loading workflow..." text is visible

---

## 2. Interaction Testing

### 2.1 Node Selection
- [ ] Click node to select (shows border and shadow)
- [ ] Click empty canvas to deselect
- [ ] Ctrl+Click adds to selection (multi-select)
- [ ] Shift+Click selects range (if implemented)
- [ ] Box selection works with drag on empty canvas
- [ ] Selection highlights all selected nodes
- [ ] ESC key clears selection
- [ ] Ctrl+A selects all nodes

### 2.2 Node Drag & Drop
- [ ] Drag node from library to canvas
- [ ] Node appears at drop position
- [ ] Cursor shows "copy" effect during drag over canvas
- [ ] Dragging existing nodes on canvas works smoothly
- [ ] Node position persists after drag (saved to database)
- [ ] Multiple selected nodes can be dragged together
- [ ] Snap to grid works (20px intervals)

### 2.3 Edge Connections
- [ ] Drag from output port to input port creates edge
- [ ] Connection line follows cursor during drag
- [ ] Connection line is bezier curve (smooth)
- [ ] Self-connections are prevented (validation)
- [ ] Valid connection targets highlight on drag
- [ ] Ports scale up on hover (1.3x)
- [ ] ESC cancels connection drag
- [ ] Edge appears after successful connection

### 2.4 Keyboard Shortcuts
- [ ] Delete/Backspace: Deletes selected node(s)
- [ ] ESC: Clears selection
- [ ] Ctrl+Z: Undo last action
- [ ] Ctrl+Shift+Z: Redo last undone action
- [ ] Ctrl+0: Reset zoom to 100%
- [ ] Ctrl+A: Select all nodes
- [ ] F: Fit view to all nodes
- [ ] Ctrl+L: Auto-layout workflow
- [ ] All shortcuts prevent default browser behavior

### 2.5 Context Menu Interactions
- [ ] Right-click node opens node context menu
- [ ] Right-click edge opens edge context menu
- [ ] Right-click empty canvas opens canvas context menu
- [ ] Only one menu open at a time
- [ ] Click menu item executes action
- [ ] Menu closes after action executes
- [ ] ESC closes context menu

### 2.6 Zoom and Pan
- [ ] Mouse wheel zooms in/out
- [ ] Zoom buttons in controls work
- [ ] Pan by dragging empty canvas
- [ ] Fit view button centers all nodes
- [ ] Minimap shows overview
- [ ] Minimap is pannable
- [ ] Minimap is zoomable
- [ ] Zoom percentage updates in toolbar

---

## 3. Feature Functionality Testing

### 3.1 Undo/Redo System
- [ ] Undo create node: Node disappears
- [ ] Redo create node: Node reappears
- [ ] Undo delete node: Node is restored
- [ ] Redo delete node: Node is removed again
- [ ] Undo move node: Position reverts
- [ ] Redo move node: Position moves forward
- [ ] Undo create edge: Edge is removed
- [ ] Redo create edge: Edge is restored
- [ ] Undo auto-layout: Positions revert
- [ ] Redo auto-layout: Layout reapplied
- [ ] Undo alignment: Positions revert
- [ ] Redo stack clears on new action after undo
- [ ] Stack limited to 50 actions (oldest removed)

### 3.2 Multi-Select Operations
- [ ] Delete removes all selected nodes at once
- [ ] Alignment works on all selected nodes
- [ ] Distribution works with 3+ selected nodes
- [ ] Properties panel shows "Multiple nodes selected" message
- [ ] Context menu applies to first selected node
- [ ] All operations record in undo stack

### 3.3 Auto-Layout
- [ ] Auto-layout button triggers layout
- [ ] Nodes arrange left-to-right (LR direction)
- [ ] Spacing between nodes is consistent (150px horizontal, 200px vertical)
- [ ] Layout completes without freezing UI
- [ ] Toast notification: "Organizing workflow..."
- [ ] Success message: "Layout complete!"
- [ ] Fit view triggered after layout
- [ ] Operation is undoable

### 3.4 Alignment Tools
- [ ] Align Left: All selected nodes have same X position (leftmost)
- [ ] Align Right: All selected nodes have same X position (rightmost)
- [ ] Align Top: All selected nodes have same Y position (topmost)
- [ ] Align Bottom: All selected nodes have same Y position (bottommost)
- [ ] Align Center H: Nodes centered horizontally
- [ ] Align Center V: Nodes centered vertically
- [ ] Buttons disabled when < 2 nodes selected

### 3.5 Distribution Tools
- [ ] Distribute Horizontal: Evenly spaces nodes horizontally
- [ ] Distribute Vertical: Evenly spaces nodes vertically
- [ ] Buttons disabled when < 3 nodes selected
- [ ] Operations are undoable

### 3.6 Node Configuration
- [ ] Select node opens properties panel
- [ ] Form fields populate with current values
- [ ] Changes to form mark it as "dirty"
- [ ] Save button appears when dirty
- [ ] Save persists changes to database
- [ ] "Saved!" confirmation appears
- [ ] Cancel reverts unsaved changes
- [ ] Validation errors prevent save

### 3.7 Context Menu Actions
**Node Menu:**
- [ ] Copy: (Logs to console - future feature)
- [ ] Delete: Removes node from canvas
- [ ] Execute: (Logs to console - future feature)
- [ ] Rename: Prompts for new name, updates database
- [ ] Disable/Enable: Toggles node enabled state
- [ ] History: (Logs to console - future feature)

**Edge Menu:**
- [ ] Delete Connection: Removes edge
- [ ] Select Output Branch: (V2 feature - logs to console)
- [ ] Add Conditional Jump: (V2 feature - logs to console)

**Canvas Menu:**
- [ ] Paste: (Logs to console - future feature)
- [ ] Create Node: (Opens node picker - future feature)
- [ ] Align options (when 2+ selected)
- [ ] Run All: (Executes workflow - future feature)

---

## 4. Edge Cases and Error Handling

### 4.1 Empty States
- [ ] Empty workflow shows "Create your workflow" message
- [ ] Empty message has icon and instructions
- [ ] No node selected shows "No Node Selected" in properties
- [ ] Search with no results shows "No results" message

### 4.2 Error States
- [ ] Error node shows red border and icon
- [ ] Error tooltip appears on hover
- [ ] Error message is readable (max 200px width)
- [ ] Error animation (pulse) is noticeable but not distracting

### 4.3 Disabled States
- [ ] Disabled nodes have grayscale effect
- [ ] Disabled badge is visible
- [ ] Disabled nodes can still be selected
- [ ] Disabled nodes can be deleted
- [ ] Toggle enable/disable works

### 4.4 Data Persistence
- [ ] Node positions save to database
- [ ] Node configurations save correctly
- [ ] Edge connections persist after refresh
- [ ] Changes sync across app state
- [ ] Database updates emit proper events

### 4.5 Boundary Conditions
- [ ] Can create workflow with 0 nodes
- [ ] Can create workflow with 1 node
- [ ] Can handle workflow with 50+ nodes
- [ ] Long node names truncate properly
- [ ] Very long workflow names handled in breadcrumbs
- [ ] Context menu repositions if near screen edge

---

## 5. Performance Testing

### 5.1 Large Workflow (50+ nodes)
- [ ] Canvas renders without significant delay
- [ ] Dragging nodes maintains 60 FPS
- [ ] Zoom/pan is smooth without lag
- [ ] Auto-layout completes in < 2 seconds
- [ ] Undo/redo completes in < 100ms
- [ ] Selection changes are instant
- [ ] No visible jitter during interactions

### 5.2 Memory and Resource Usage
- [ ] No memory leaks during 30-minute session
- [ ] No excessive CPU usage during idle
- [ ] Smooth performance after multiple undo/redo cycles
- [ ] No degradation after repeated node creation/deletion

### 5.3 Animation Performance
- [ ] Hover animations are smooth
- [ ] Selection animations don't stutter
- [ ] Skeleton loading animation is fluid
- [ ] Error pulse animation runs smoothly
- [ ] Transition effects complete without dropping frames

---

## 6. Browser Compatibility

### 6.1 Chrome (Primary)
- [ ] All features work correctly
- [ ] No console errors
- [ ] Performance is optimal

### 6.2 Firefox
- [ ] All features work correctly
- [ ] CSS animations render properly
- [ ] Keyboard shortcuts work

### 6.3 Safari (if applicable)
- [ ] All features work correctly
- [ ] Drag and drop works
- [ ] Context menus appear correctly

### 6.4 Edge
- [ ] All features work correctly
- [ ] No rendering issues

---

## 7. Accessibility Testing

### 7.1 Keyboard Navigation
- [ ] All interactive elements are focusable
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Keyboard shortcuts don't conflict with assistive tech
- [ ] Context menus accessible via keyboard

### 7.2 Screen Reader Compatibility
- [ ] ARIA labels present on buttons
- [ ] Form fields have proper labels
- [ ] Status messages announced
- [ ] Node states communicated (selected, error, disabled)

### 7.3 Visual Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Not relying solely on color to convey information
- [ ] Icons have tooltips/labels
- [ ] Text is readable (minimum 12px)
- [ ] Focus states are clearly visible

---

## 8. Integration Testing

### 8.1 Component Integration
- [ ] Header callbacks (Save, Execute) fire correctly
- [ ] Toolbar actions update canvas state
- [ ] Properties panel syncs with selected node
- [ ] Context menu actions affect canvas
- [ ] All hooks communicate properly

### 8.2 State Synchronization
- [ ] Jotai atoms update correctly
- [ ] ReactFlow state syncs with atoms
- [ ] Database changes emit events
- [ ] UI updates on database events
- [ ] No stale state issues

### 8.3 Error Recovery
- [ ] App recovers from failed database operations
- [ ] Network errors handled gracefully
- [ ] Invalid data doesn't crash UI
- [ ] Error boundaries catch render errors

---

## 9. Regression Testing

### 9.1 Existing Functionality
- [ ] Existing workflows load correctly
- [ ] No breaking changes to data models
- [ ] API compatibility maintained
- [ ] Theme system still works
- [ ] Plugin system unaffected

### 9.2 Previous Bug Fixes
- [ ] No reintroduction of fixed bugs
- [ ] Edge cases still handled
- [ ] Error handling improvements preserved

---

## 10. Final Checklist

### Before Release:
- [ ] All critical bugs fixed
- [ ] All high-priority features working
- [ ] Documentation complete (User Guide, Migration Guide)
- [ ] Performance criteria met
- [ ] Accessibility requirements satisfied
- [ ] Code reviewed and cleaned up
- [ ] Production build successful
- [ ] No console errors in production

### Sign-off:
- [ ] Developer testing complete
- [ ] QA testing complete (if applicable)
- [ ] User acceptance testing complete (if applicable)
- [ ] Release notes prepared

---

## Bug Tracking

### Critical Bugs Found:
_(Document any critical bugs found during testing)_

1.
2.
3.

### Major Bugs Found:
_(Document major bugs that need fixing)_

1.
2.
3.

### Minor Bugs Found:
_(Document minor bugs for future fixes)_

1.
2.
3.

---

## Testing Notes

**Tester:**
**Date:**
**Environment:**
**Build Version:**

**General Observations:**

_(Add any notes about the testing process, unexpected behaviors, or recommendations)_

---

**End of Manual Testing Checklist**
