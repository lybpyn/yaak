# Workflow UI Refactor - Migration Guide

## Overview

This guide helps users transition from the original workflow editor to the new refactored UI with enhanced features and improved user experience. The migration is designed to be seamless with automatic data compatibility.

---

## What's New

### Visual Enhancements
- **Modern Design**: n8n-inspired color palette with professional aesthetics
- **Improved Node Styling**: 100x100px nodes with colored headers, better state indicators
- **Enhanced Animations**: Smooth hover effects, transitions, and feedback animations
- **Skeleton Loading**: Professional loading state while workflows initialize
- **Better Empty States**: Friendly guidance when starting new workflows

### New Features

#### 1. Undo/Redo System
The most requested feature! Now you can:
- **Undo** any action with `Ctrl+Z`
- **Redo** with `Ctrl+Shift+Z`
- Track up to 50 actions in history
- Undo/redo node creation, deletion, movement, connections, and layout changes

#### 2. Multi-Select Operations
Work with multiple nodes at once:
- **Ctrl+Click** to add nodes to selection
- **Box Selection**: Drag on empty canvas to select multiple nodes
- **Select All**: `Ctrl+A` to select every node
- **Batch Delete**: Remove all selected nodes at once
- **Batch Alignment**: Align multiple nodes together

#### 3. Auto-Layout
Automatically organize messy workflows:
- **One-Click Layout**: Arranges nodes in logical left-to-right flow
- Uses Dagre algorithm for optimal positioning
- Triggered via toolbar button or `Ctrl+L`
- Fully undoable

#### 4. Alignment & Distribution Tools
Precision tools for perfect layouts:
- **Align Left/Right/Top/Bottom**: Snap nodes to same edge
- **Center Alignment**: Horizontally or vertically center nodes
- **Distribute**: Evenly space 3+ nodes
- Available when 2+ nodes selected

#### 5. Enhanced Context Menus
Right-click power features:
- **Node Menu**: Copy, Delete, Execute, Rename, Disable, History
- **Edge Menu**: Delete Connection, Branch Selection, Conditional Jumps
- **Canvas Menu**: Paste, Create Node, Align, Distribute, Run All

#### 6. Improved Keyboard Shortcuts
Work faster with:
- `Delete/Backspace` - Remove selected nodes
- `Escape` - Clear selection
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `Ctrl+A` - Select all
- `Ctrl+0` - Reset zoom
- `F` - Fit view
- `Ctrl+L` - Auto-layout

#### 7. Better Connection Creation
Creating edges is now smoother:
- Bezier curve preview while dragging
- Visual port highlighting
- Self-connection prevention
- Animated connection lines

#### 8. Properties Panel Improvements
- New form field components with better styling
- Unsaved changes detection
- Form validation before save
- Clear save confirmation feedback

#### 9. Toolbar Enhancements
- Real-time zoom percentage display
- Selection count indicator
- Grouped action buttons with tooltips
- Visual feedback for disabled states

---

## Feature Comparison

| Feature | Old UI | New UI |
|---------|--------|--------|
| Node Selection | Single click only | Multi-select with Ctrl+Click and box selection |
| Undo/Redo | Not available | Full history tracking (50 actions) |
| Layout | Manual positioning only | Auto-layout with Dagre algorithm |
| Alignment | Not available | 6 alignment options + distribution |
| Context Menus | Basic right-click | Rich menus for nodes, edges, canvas |
| Keyboard Shortcuts | Limited | 10+ shortcuts for common actions |
| Node Styling | Basic boxes | Modern cards with states and animations |
| Loading States | Blank screen | Skeleton placeholder animation |
| Empty States | Generic message | Friendly guidance with icons |
| Connection Preview | Basic line | Smooth bezier curve with highlighting |
| Zoom Controls | Basic zoom | Percentage display, reset shortcut |
| Error Indication | Text only | Visual border, icon, pulse animation |
| Disabled Nodes | No indicator | Grayscale with badge |

---

## Migration Process

### Automatic Migration

**Good news!** Your existing workflows migrate automatically:

1. **Data Compatibility**: All existing workflow data remains unchanged
2. **No Manual Steps**: Simply update to the new version
3. **Backward Compatible**: Same database schema, same models
4. **Instant Availability**: New features work immediately with existing data

### What Migrates Automatically

- All workflow definitions
- Node configurations
- Edge connections
- Node positions (enhanced with new styling)
- Execution history
- Environment associations

### What Changes

- **Visual Appearance**: Nodes and edges render with new styling
- **Interaction Behavior**: New selection, drag, and connection behaviors
- **UI Layout**: New toolbar, enhanced sidebar, improved properties panel
- **Keyboard Behavior**: New shortcuts active by default

---

## Getting Started with New Features

### Try Auto-Layout First

If your workflow looks cluttered:
1. Open any workflow
2. Click the **Auto-Layout** button in toolbar (or press `Ctrl+L`)
3. Watch as nodes organize themselves
4. Use **Undo** (`Ctrl+Z`) if you prefer the old layout

### Experiment with Multi-Select

1. Hold `Ctrl` and click multiple nodes
2. Try the alignment buttons in toolbar
3. Drag one node to move all selected
4. Press `Delete` to remove all selected

### Explore Context Menus

1. Right-click on a node for node-specific actions
2. Right-click on an edge for connection options
3. Right-click on empty canvas for canvas actions

### Master Keyboard Shortcuts

Start with these essential shortcuts:
- `Ctrl+Z` for undo (you'll use this a lot!)
- `Ctrl+A` to select all
- `F` to fit view after zooming
- `Escape` to clear selection

---

## Breaking Changes

### None!

The refactor maintains full backward compatibility:
- No API changes
- No database schema changes
- No configuration changes required
- Existing integrations continue to work

### Behavioral Differences to Note

While not breaking, be aware of:

1. **Selection Behavior**: Clicking empty canvas now clears selection (not toggle)
2. **Delete Confirmation**: Deleting nodes is immediate (use undo if accidental)
3. **Context Menu**: Right-click behavior enhanced with more options
4. **Keyboard Shortcuts**: New shortcuts active by default (check for conflicts)

---

## Troubleshooting

### Workflow Not Loading

If you see the skeleton loader for too long:
1. Check browser console for errors
2. Verify workflow exists in database
3. Try refreshing the page
4. Clear browser cache

### Undo Not Working

If undo doesn't restore expected state:
1. Undo stack limited to 50 actions
2. Some operations may not be recorded yet
3. Database sync might be delayed

### Nodes Not Aligning

If alignment tools don't work:
1. Ensure 2+ nodes are selected (check toolbar count)
2. For distribution, need 3+ nodes
3. Try selecting nodes again with `Ctrl+Click`

### Context Menu Not Appearing

If right-click menu doesn't show:
1. Ensure you're right-clicking directly on node/edge/canvas
2. Check if another menu is already open
3. Try clicking elsewhere first, then right-click again

### Performance Issues

If canvas feels slow:
1. Too many nodes? Consider splitting workflow
2. Check browser memory usage
3. Disable browser extensions temporarily
4. Try different browser (Chrome recommended)

---

## Tips for Power Users

### Workflow Organization

1. **Start with Auto-Layout**: Get a clean baseline
2. **Group by Function**: Use alignment to create visual groups
3. **Distribute for Clarity**: Even spacing improves readability
4. **Save Position After Layout**: Positions persist to database

### Efficient Editing

1. **Multi-Select + Delete**: Clean up multiple nodes at once
2. **Undo Chain**: Make experimental changes, undo if wrong
3. **Context Menu Shortcuts**: Learn shortcuts shown in menus
4. **Keyboard-First**: Faster than clicking toolbar buttons

### Best Practices

1. **Save Frequently**: Properties panel has unsaved indicator
2. **Test Connections**: Use bezier preview to verify paths
3. **Monitor Selection Count**: Toolbar shows how many selected
4. **Use Fit View**: Press `F` after layout changes

---

## Future Features

The following features are planned but not yet implemented:

1. **Copy/Paste Nodes**: Copy nodes within and across workflows
2. **Duplicate Nodes**: Quick duplicate with `Ctrl+D`
3. **Conditional Branching**: Visual condition editor on edges
4. **Branch Selection**: Choose output paths for parallel execution
5. **Execution Visualization**: Real-time execution progress on canvas
6. **Node Templates**: Save and reuse node configurations
7. **Workflow Versioning**: Track changes over time

---

## Feedback and Support

### Reporting Issues

If you encounter problems:
1. Check the troubleshooting section above
2. Note the exact steps to reproduce
3. Capture browser console errors
4. Report via GitHub issues

### Feature Requests

Have ideas for improvements?
- Document your use case
- Describe expected behavior
- Submit as feature request

### Getting Help

- Review the User Guide: `specs/workflow-ui-refactor/USER_GUIDE.md`
- Check testing documentation: `specs/workflow-ui-refactor/TESTING.md`
- Consult technical design: `specs/workflow-ui-refactor/design.md`

---

## Summary

The Workflow UI refactor brings significant improvements to the workflow editing experience:

- **Productivity**: Undo/redo, multi-select, auto-layout save time
- **Usability**: Better visual feedback, keyboard shortcuts, context menus
- **Polish**: Modern design, smooth animations, professional aesthetics
- **Reliability**: Same robust backend, improved frontend

Migration is automatic and seamless. Your workflows work immediately with all new features available. Start exploring the new capabilities and enjoy the enhanced workflow editing experience!

---

**Last Updated**: 2025-11-16
**Version**: 1.0.0
