# Workflow Editor User Guide

Welcome to the visual workflow editor! This guide will help you create, manage, and execute API test workflows using the new node-based canvas interface.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Creating Your First Workflow](#creating-your-first-workflow)
4. [Working with Nodes](#working-with-nodes)
5. [Connecting Nodes](#connecting-nodes)
6. [Layout and Organization](#layout-and-organization)
7. [Undo and Redo](#undo-and-redo)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Context Menus](#context-menus)
10. [Executing Workflows](#executing-workflows)
11. [Tips and Tricks](#tips-and-tricks)
12. [Troubleshooting](#troubleshooting)

## Introduction

The workflow editor provides a visual canvas where you can:
- Drag and drop API request nodes onto the canvas
- Connect nodes to define execution order
- Configure node properties
- Execute entire workflows or individual nodes
- Undo and redo your changes

The interface is designed to be intuitive, inspired by visual programming tools like n8n and Node-RED.

## Getting Started

When you open the workflow editor, you'll see:

1. **Header** (top) - Breadcrumbs navigation and action buttons (Save, Execute)
2. **Node Library** (left sidebar) - Draggable node templates
3. **Canvas** (center) - Main editing area where you build your workflow
4. **Properties Panel** (right sidebar) - Configure selected node
5. **Toolbar** (above canvas) - Undo/redo, layout tools, zoom controls

## Creating Your First Workflow

### Step 1: Add Your First Node

1. Look at the **Node Library** on the left
2. Find a node type you want (e.g., "HTTP Request")
3. Click and drag the node onto the canvas
4. Release the mouse button to drop the node

You'll see the node appear on the canvas with a default name.

### Step 2: Configure the Node

1. Click on the node to select it
2. The **Properties Panel** on the right will show the node's configuration
3. Fill in the required fields:
   - Name: Give your node a descriptive name
   - Description: Optional explanation of what this node does
   - Other fields specific to the node type

4. Click **Save** to apply your changes

### Step 3: Add More Nodes

Repeat Step 1 to add more nodes to your workflow. Common patterns:
- **Sequential flow**: Node A → Node B → Node C
- **Multiple paths**: One node connecting to multiple downstream nodes
- **Convergence**: Multiple nodes connecting to one downstream node

### Step 4: Connect Nodes

1. Hover over a node's **output port** (right side, circular handle)
2. Click and drag from the output port
3. Drag to another node's **input port** (left side)
4. Release to create the connection

The connection line indicates the execution order: data flows from source to target.

## Working with Nodes

### Selecting Nodes

- **Single select**: Click on a node
- **Multi-select with Ctrl**: Hold Ctrl and click multiple nodes
- **Box selection**: Click and drag on empty canvas to draw a selection box
- **Select all**: Press Ctrl+A

### Moving Nodes

- Click and drag any node to reposition it
- Selected nodes can be moved together
- Nodes snap to a 20px grid for alignment

### Deleting Nodes

- Select the node(s) you want to delete
- Press **Delete** or **Backspace** key
- Or right-click and select "Delete" from the context menu

### Node Status Indicators

- **Green border**: Node is enabled and ready
- **Red border**: Node has validation errors
- **Gray border**: Node is disabled
- **Pulsing animation**: Node is currently executing

## Connecting Nodes

### Creating Connections

1. Hover over the source node's output port (right side)
2. The port will highlight to indicate it's active
3. Click and drag to the target node's input port
4. Release when the target port highlights

A smooth curved line (Bezier curve) will connect the nodes.

### Removing Connections

- Right-click on the connection line
- Select "Delete Connection" from the menu
- Or select the edge and press Delete

### Connection Rules

- A node cannot connect to itself
- Connections flow left-to-right (output to input)
- Multiple connections from one output are allowed
- Multiple connections to one input are allowed

## Layout and Organization

### Auto-Layout

The editor can automatically organize your nodes:

1. Click the **Auto-Layout** button in the toolbar (or press Ctrl+L)
2. Nodes will be arranged left-to-right based on their connections
3. The algorithm optimizes for clarity and minimal edge crossings

### Manual Alignment

When you have 2 or more nodes selected:

1. **Align Left**: Moves all selected nodes to the same X position
2. **Align Right**: Aligns to the rightmost node's X position
3. **Align Top**: Moves all to the same Y position
4. **Align Bottom**: Aligns to the bottommost node's Y position

When you have 3 or more nodes selected:

5. **Distribute Horizontally**: Spaces nodes evenly in the X direction
6. **Distribute Vertically**: Spaces nodes evenly in the Y direction

### Zoom and Pan

- **Zoom in**: Click + button or scroll up
- **Zoom out**: Click - button or scroll down
- **Reset zoom**: Press Ctrl+0
- **Fit view**: Press F to fit all nodes in view
- **Pan**: Click and drag on empty canvas

The current zoom level is displayed in the toolbar (e.g., "100%").

## Undo and Redo

The editor tracks your last 50 actions, allowing you to undo and redo:

### Undo (Ctrl+Z)
Reverses your last action:
- Creating a node
- Deleting a node
- Moving a node
- Creating a connection
- Deleting a connection
- Auto-layout
- Alignment operations

### Redo (Ctrl+Shift+Z)
Reapplies an action you just undid.

**Note**: When you perform a new action, the redo history is cleared.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Delete** or **Backspace** | Delete selected nodes/edges |
| **Escape** | Clear selection |
| **Ctrl+Z** | Undo last action |
| **Ctrl+Shift+Z** | Redo last undone action |
| **Ctrl+0** | Reset zoom to 100% |
| **Ctrl+A** | Select all nodes |
| **F** | Fit view to show all nodes |
| **Ctrl+L** | Auto-layout workflow |

## Context Menus

Right-click on different elements to see contextual actions:

### Node Context Menu
- **Copy**: Copy node to clipboard (coming soon)
- **Delete**: Remove the node
- **Execute**: Run this single node
- **Rename**: Change the node's name
- **Enable/Disable**: Toggle node's active state
- **History**: View execution history (coming soon)

### Edge Context Menu
- **Delete Connection**: Remove the connection
- **Select Output Branch**: Choose output path (V2)
- **Add Conditional Jump**: Add conditions (V2)

### Canvas Context Menu
- **Paste**: Paste copied nodes (coming soon)
- **Create Node**: Add a new node
- **Align Left/Right**: Align selected nodes
- **Distribute Horizontally**: Space selected nodes evenly
- **Run All**: Execute entire workflow

## Executing Workflows

### Execute Entire Workflow

1. Click the **Execute** button in the header
2. Select an environment (if prompted)
3. Watch as nodes execute sequentially
4. Results appear in the response panel

### Execute Single Node

1. Right-click on the node
2. Select "Execute" from the context menu
3. The node runs independently

### Execution States

- **Idle**: Waiting to run
- **Running**: Currently executing (shows spinner)
- **Success**: Completed successfully (green indicator)
- **Failed**: Encountered an error (red indicator)
- **Skipped**: Disabled or bypassed

## Tips and Tricks

### Organizing Large Workflows

1. **Group related nodes**: Keep nodes that work together close to each other
2. **Use descriptive names**: Make node names clear (e.g., "Create User" not "Step 1")
3. **Add descriptions**: Document what each node does
4. **Use auto-layout**: Let the algorithm organize after adding multiple nodes
5. **Fine-tune manually**: Adjust positions after auto-layout for clarity

### Efficient Editing

1. **Use keyboard shortcuts**: Much faster than clicking buttons
2. **Multi-select for bulk operations**: Align or delete multiple nodes at once
3. **Undo freely**: Don't worry about mistakes, just Ctrl+Z
4. **Zoom out for overview**: See your entire workflow structure
5. **Use minimap**: Navigate large workflows quickly

### Debugging Workflows

1. **Check node configuration**: Ensure all required fields are filled
2. **Verify connections**: Make sure nodes are connected correctly
3. **Test incrementally**: Execute nodes one at a time to isolate issues
4. **Check execution history**: Review past runs for error patterns
5. **Disable problematic nodes**: Temporarily skip nodes to test others

## Troubleshooting

### Node won't drag from library

- Ensure you're clicking and holding on the node card
- Check that you're dragging to the canvas area (not the sidebar)
- Try refreshing the page

### Connection won't create

- Verify you're dragging from output (right) to input (left)
- Check that you're not trying to connect a node to itself
- Make sure the target port is highlighted before releasing

### Undo not working

- Check if you have any undoable actions (canUndo indicator in toolbar)
- Maximum history is 50 actions
- Some operations may not be undoable

### Canvas is slow or laggy

- Reduce the number of nodes (try with < 50 nodes)
- Close other browser tabs
- Ensure your browser is up to date
- Try disabling browser extensions

### Node configuration not saving

- Check for validation errors (red borders)
- Ensure all required fields are filled
- Click the "Save" button in the properties panel
- Check browser console for errors

### Workflow won't execute

- Verify all nodes are properly connected
- Check that no nodes have validation errors
- Ensure you have an environment selected
- Check network connectivity

---

## Need More Help?

- Check the component documentation: `src-web/components/Workflows/README.md`
- Review the technical design: `specs/workflow-ui-refactor/design.md`
- See the requirements: `specs/workflow-ui-refactor/requirements.md`
- Report issues in the project repository

Happy workflow building!
