import type { Workflow } from '@yaakapp-internal/models';
import { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Panel,
  ConnectionLineType,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowCanvas } from '../../hooks/useWorkflowCanvas';
import { useNodeOperations } from '../../hooks/useNodeOperations';
import { useEdgeOperations } from '../../hooks/useEdgeOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { useAutoLayout } from '../../hooks/useAutoLayout';
import { useLayoutTools } from '../../hooks/useLayoutTools';
import { patchModel } from '@yaakapp-internal/models';
import { useSetAtom, useAtomValue } from 'jotai';
import { selectedNodeIdAtom, selectedNodeIdsAtom } from '@yaakapp-internal/models/guest-js/atoms';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { NodeLibrarySidebar } from './NodeLibrarySidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';
import { ContextMenu } from './ContextMenu';
import type { OnSelectionChangeParams } from 'reactflow';
import type { MenuItem } from './types';
import { useContextMenu } from '../../hooks/useContextMenu';

interface WorkflowCanvasInnerProps {
  workflow: Workflow;
}

function WorkflowCanvasInner({ workflow }: WorkflowCanvasInnerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useWorkflowCanvas(workflow.id);

  console.log('[WorkflowCanvas] Render - initialNodes:', initialNodes.length, initialNodes);

  const { createNode, deleteNode, updateNode } = useNodeOperations();
  const { createEdge, deleteEdge } = useEdgeOperations();
  const { undo, redo, canUndo, canRedo, recordAction } = useUndoRedo();
  const { autoLayout } = useAutoLayout();
  const { alignNodes, distributeNodes } = useLayoutTools();
  const { contextMenu, openNodeMenu, openEdgeMenu, openCanvasMenu, closeMenu } = useContextMenu();
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
  const selectedNodeIds = useAtomValue(selectedNodeIdsAtom);
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isLayouting, setIsLayouting] = useState(false);

  // Track node positions before drag for undo
  const nodePositionsBeforeDrag = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Use ReactFlow's built-in state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync initialNodes/initialEdges changes to ReactFlow state
  // This is needed because useNodesState/useEdgesState only use the initial value once
  useEffect(() => {
    console.log('[WorkflowCanvas] Syncing initialNodes to ReactFlow state:', initialNodes);
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    console.log('[WorkflowCanvas] Syncing initialEdges to ReactFlow state:', initialEdges);
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Debounced position update
  const positionUpdateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Handle node position changes with debouncing
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes);

    // Handle position changes (persist to database after drag ends)
    changes.forEach((change) => {
      // Track position before drag starts
      if (change.type === 'position' && change.dragging === true && change.position) {
        // Save initial position if not already saved
        if (!nodePositionsBeforeDrag.current.has(change.id)) {
          const node = nodes.find((n) => n.id === change.id);
          if (node) {
            nodePositionsBeforeDrag.current.set(change.id, {
              x: node.position.x,
              y: node.position.y,
            });
          }
        }
      }

      // Handle drag end - persist to database with undo support
      if (change.type === 'position' && change.dragging === false && change.position) {
        // Clear existing timeout for this node
        const existingTimeout = positionUpdateTimeouts.current.get(change.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const oldPosition = nodePositionsBeforeDrag.current.get(change.id);
        const newPosition = { x: change.position.x, y: change.position.y };

        // Only record action if position actually changed
        if (oldPosition && (oldPosition.x !== newPosition.x || oldPosition.y !== newPosition.y)) {
          // Record undo/redo action for position change
          recordAction({
            type: 'moveNode',
            undo: () => {
              return updateNode({
                nodeId: change.id,
                updates: { positionX: oldPosition.x, positionY: oldPosition.y },
              });
            },
            redo: () => {
              return updateNode({
                nodeId: change.id,
                updates: { positionX: newPosition.x, positionY: newPosition.y },
              });
            },
          });
        }

        // Clear the saved position
        nodePositionsBeforeDrag.current.delete(change.id);

        // Debounce the database update
        const timeout = setTimeout(() => {
          patchModel(change.id, {
            positionX: change.position!.x,
            positionY: change.position!.y,
          }).catch((error) => {
            console.error('Failed to update node position:', error);
          });
          positionUpdateTimeouts.current.delete(change.id);
        }, 500);

        positionUpdateTimeouts.current.set(change.id, timeout);
      }
    });
  }, [onNodesChange, nodes, recordAction, updateNode]);

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);

    // TODO: Handle edge deletion in database
    changes.forEach((change) => {
      if (change.type === 'remove') {
        // Delete edge from database
        // This will be implemented when we have the delete edge command
        console.log('TODO: Delete edge from database:', change.id);
      }
    });
  }, [onEdgesChange]);

  // Validate connection (prevent self-connections)
  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent connecting a node to itself
    return connection.source !== connection.target;
  }, []);

  // Handle new edge connection
  const handleConnect: OnConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const edgeParams = {
      workflowId: workflow.id,
      sourceNodeId: connection.source,
      targetNodeId: connection.target,
      sourceAnchor: connection.sourceHandle || 'output',
      targetAnchor: connection.targetHandle || 'input',
      edgeType: 'sequential' as const,
    };

    // Create edge in database
    createEdge(edgeParams).then((createdEdge) => {
      // Record undo/redo action for edge creation
      if (createdEdge && createdEdge.id) {
        recordAction({
          type: 'createEdge',
          undo: () => deleteEdge(createdEdge.id),
          redo: () => createEdge(edgeParams),
        });
      }
    });

    // OptimisticallyUpdate UI (ReactFlow will re-render when database emits event)
  }, [workflow.id, createEdge, deleteEdge, recordAction]);

  // Handle canvas pane click (deselect)
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Handle node click (select)
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  // Handle node right-click (context menu)
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      openNodeMenu(event, node);
    },
    [openNodeMenu]
  );

  // Handle edge right-click (context menu)
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.preventDefault();
      openEdgeMenu(event, edge);
    },
    [openEdgeMenu]
  );

  // Handle canvas right-click (context menu)
  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      openCanvasMenu(event);
    },
    [openCanvasMenu]
  );

  // Generate context menu items for node
  const getNodeMenuItems = useCallback((): MenuItem[] => {
    if (!contextMenu.data) return [];

    const node = contextMenu.data as Node;

    return [
      {
        icon: '📋',
        label: 'Copy',
        shortcut: 'Ctrl+C',
        onClick: () => {
          console.log('Copy node:', node.id);
          // TODO: Implement copy to clipboard
        },
      },
      {
        icon: '🗑️',
        label: 'Delete',
        shortcut: 'Del',
        onClick: () => {
          handleDeleteNode(node.id);
        },
        danger: true,
      },
      {
        icon: '▶️',
        label: 'Execute',
        onClick: () => {
          console.log('Execute node:', node.id);
          // TODO: Implement single node execution
        },
      },
      {
        icon: '✏️',
        label: 'Rename',
        onClick: () => {
          const newName = prompt('Enter new name:', node.data?.node?.name || '');
          if (newName) {
            updateNode({
              nodeId: node.id,
              updates: { name: newName },
            });
          }
        },
      },
      {
        icon: node.data?.node?.enabled === false ? '✅' : '⏸️',
        label: node.data?.node?.enabled === false ? 'Enable' : 'Disable',
        onClick: () => {
          const currentEnabled = node.data?.node?.enabled !== false;
          updateNode({
            nodeId: node.id,
            updates: { enabled: !currentEnabled },
          });
        },
      },
      {
        icon: '📜',
        label: 'History',
        onClick: () => {
          console.log('View history:', node.id);
          // TODO: Implement execution history view
        },
      },
    ];
  }, [contextMenu.data, handleDeleteNode, updateNode]);

  // Generate context menu items for edge
  const getEdgeMenuItems = useCallback((): MenuItem[] => {
    if (!contextMenu.data) return [];

    const edge = contextMenu.data;

    return [
      {
        icon: '🗑️',
        label: 'Delete Connection',
        shortcut: 'Del',
        onClick: () => {
          deleteEdge(edge.id);
        },
        danger: true,
      },
      {
        icon: '🔀',
        label: 'Select Output Branch',
        shortcut: 'Ctrl+B',
        onClick: () => {
          console.log('Select branch:', edge.id);
          // V2: Implement branch selector
        },
      },
      {
        icon: '⚡',
        label: 'Add Conditional Jump',
        onClick: () => {
          console.log('Add conditional:', edge.id);
          // V2: Implement condition editor
        },
      },
    ];
  }, [contextMenu.data, deleteEdge]);

  // Generate context menu items for canvas
  const getCanvasMenuItems = useCallback((): MenuItem[] => {
    return [
      {
        icon: '📋',
        label: 'Paste',
        shortcut: 'Ctrl+V',
        onClick: () => {
          console.log('Paste nodes');
          // TODO: Implement paste from clipboard
        },
      },
      {
        icon: '➕',
        label: 'Create Node',
        onClick: () => {
          console.log('Create node at position');
          // TODO: Show node picker
        },
      },
      ...(selectedNodeIds.length >= 2
        ? [
            {
              icon: '⊣',
              label: 'Align Left',
              onClick: () => handleAlign('left'),
            },
            {
              icon: '⊢',
              label: 'Align Right',
              onClick: () => handleAlign('right'),
            },
          ]
        : []),
      ...(selectedNodeIds.length >= 3
        ? [
            {
              icon: '⟷',
              label: 'Distribute Horizontally',
              onClick: () => handleDistribute('horizontal'),
            },
          ]
        : []),
      {
        icon: '▶️',
        label: 'Run All',
        onClick: () => {
          console.log('Run workflow');
          // TODO: Execute workflow
        },
      },
    ];
  }, [selectedNodeIds, handleAlign, handleDistribute]);

  // Handle selection change (multi-select)
  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
    const nodeIds = selectedNodes.map((n) => n.id);
    setSelectedNodeIds(nodeIds);

    // If single selection, also update single select atom for properties panel
    if (nodeIds.length === 1) {
      setSelectedNodeId(nodeIds[0]);
    } else if (nodeIds.length === 0) {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeIds, setSelectedNodeId]);

  // Handle drop from node library
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    console.log('Drop event triggered');

    if (!reactFlowInstance) {
      console.log('No reactFlowInstance available');
      return;
    }

    const nodeType = event.dataTransfer.getData('application/nodeType');
    const nodeSubtype = event.dataTransfer.getData('application/nodeSubtype');

    console.log('Drop data:', { nodeType, nodeSubtype });

    if (!nodeType || !nodeSubtype) {
      console.log('Missing node type or subtype');
      return;
    }

    // Convert screen coordinates to flow coordinates
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    console.log('Creating node at position:', position);

    const nodeParams = {
      workflowId: workflow.id,
      nodeType,
      nodeSubtype,
      position,
    };

    // Create node in database
    createNode(nodeParams).then((createdNode) => {
      console.log('Node created successfully:', createdNode);

      // Record undo/redo action for node creation
      if (createdNode && createdNode.id) {
        recordAction({
          type: 'createNode',
          undo: () => deleteNode(createdNode.id),
          redo: () => createNode(nodeParams),
        });
      }
    }).catch((error) => {
      console.error('Failed to create node:', error);
    });
  }, [reactFlowInstance, workflow.id, createNode, deleteNode, recordAction]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    console.log('[DRAGOVER] event triggered');
  }, []);

  // Zoom handlers
  const handleFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);

  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  // Track zoom level
  const handleMove = useCallback(() => {
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      setZoom(Math.round(viewport.zoom * 100));
    }
  }, [reactFlowInstance]);

  // Auto-layout handler
  const handleAutoLayout = useCallback(async () => {
    if (nodes.length === 0 || isLayouting) return;

    setIsLayouting(true);

    // Save current positions for undo
    const oldPositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      oldPositions.set(node.id, { x: node.position.x, y: node.position.y });
    });

    try {
      // Convert ReactFlow nodes/edges to format expected by autoLayout
      const layoutNodes = nodes.map((node) => ({
        id: node.id,
        positionX: node.position.x,
        positionY: node.position.y,
        ...node.data?.node,
      }));

      const layoutEdges = edges.map((edge) => ({
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
      }));

      await autoLayout(layoutNodes, layoutEdges);

      // Record undo action after layout completes
      // The new positions will be reflected after the database updates sync
      recordAction({
        type: 'autoLayout',
        undo: () => {
          // Restore old positions
          const updatePromises = Array.from(oldPositions.entries()).map(([nodeId, pos]) =>
            updateNode({
              nodeId,
              updates: { positionX: pos.x, positionY: pos.y },
            })
          );
          return Promise.all(updatePromises).then(() => {});
        },
        redo: () => autoLayout(layoutNodes, layoutEdges),
      });

      // Fit view after layout
      if (reactFlowInstance) {
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.2 });
        }, 300);
      }
    } catch (error) {
      console.error('Auto-layout failed:', error);
    } finally {
      setIsLayouting(false);
    }
  }, [nodes, edges, isLayouting, autoLayout, recordAction, updateNode, reactFlowInstance]);

  // Generic alignment handler
  const handleAlign = useCallback(
    async (alignmentType: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') => {
      if (selectedNodeIds.length < 2) return;

      // Get selected nodes
      const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
      if (selectedNodes.length < 2) return;

      // Save old positions for undo
      const oldPositions = new Map<string, { x: number; y: number }>();
      selectedNodes.forEach((node) => {
        oldPositions.set(node.id, { x: node.position.x, y: node.position.y });
      });

      // Convert to layout format
      const layoutNodes = selectedNodes.map((node) => ({
        id: node.id,
        positionX: node.position.x,
        positionY: node.position.y,
        ...node.data?.node,
      }));

      await alignNodes(layoutNodes, alignmentType);

      // Record undo action
      recordAction({
        type: `align_${alignmentType}`,
        undo: () => {
          const updatePromises = Array.from(oldPositions.entries()).map(([nodeId, pos]) =>
            updateNode({
              nodeId,
              updates: { positionX: pos.x, positionY: pos.y },
            })
          );
          return Promise.all(updatePromises).then(() => {});
        },
        redo: () => alignNodes(layoutNodes, alignmentType),
      });
    },
    [selectedNodeIds, nodes, alignNodes, recordAction, updateNode]
  );

  // Generic distribution handler
  const handleDistribute = useCallback(
    async (direction: 'horizontal' | 'vertical') => {
      if (selectedNodeIds.length < 3) return;

      // Get selected nodes
      const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
      if (selectedNodes.length < 3) return;

      // Save old positions for undo
      const oldPositions = new Map<string, { x: number; y: number }>();
      selectedNodes.forEach((node) => {
        oldPositions.set(node.id, { x: node.position.x, y: node.position.y });
      });

      // Convert to layout format
      const layoutNodes = selectedNodes.map((node) => ({
        id: node.id,
        positionX: node.position.x,
        positionY: node.position.y,
        ...node.data?.node,
      }));

      await distributeNodes(layoutNodes, direction);

      // Record undo action
      recordAction({
        type: `distribute_${direction}`,
        undo: () => {
          const updatePromises = Array.from(oldPositions.entries()).map(([nodeId, pos]) =>
            updateNode({
              nodeId,
              updates: { positionX: pos.x, positionY: pos.y },
            })
          );
          return Promise.all(updatePromises).then(() => {});
        },
        redo: () => distributeNodes(layoutNodes, direction),
      });
    },
    [selectedNodeIds, nodes, distributeNodes, recordAction, updateNode]
  );

  // Helper to delete node with undo/redo support
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Find the node to get its data for undo
    const nodeToDelete = nodes.find((n) => n.id === nodeId);
    if (!nodeToDelete) return;

    const nodeData = nodeToDelete.data?.node;
    if (!nodeData) {
      // If no node data, just delete without undo support
      deleteNode(nodeId);
      setSelectedNodeId(null);
      return;
    }

    // Create restore params for undo
    const restoreParams = {
      workflowId: workflow.id,
      nodeType: nodeData.nodeType || 'action',
      nodeSubtype: nodeData.nodeSubtype || 'custom',
      position: nodeToDelete.position,
    };

    deleteNode(nodeId).then(() => {
      // Record undo/redo action for node deletion
      recordAction({
        type: 'deleteNode',
        undo: () => createNode(restoreParams),
        redo: () => deleteNode(nodeId),
      });
    });

    setSelectedNodeId(null);
  }, [nodes, workflow.id, deleteNode, createNode, recordAction, setSelectedNodeId]);

  // Helper to delete multiple selected nodes
  const handleDeleteSelectedNodes = useCallback(() => {
    if (selectedNodeIds.length > 0) {
      // Delete all selected nodes
      selectedNodeIds.forEach((nodeId) => {
        handleDeleteNode(nodeId);
      });
      setSelectedNodeIds([]);
    } else if (selectedNodeId) {
      // Fallback to single node deletion
      handleDeleteNode(selectedNodeId);
    }
  }, [selectedNodeIds, selectedNodeId, handleDeleteNode, setSelectedNodeIds]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    // Delete selected node(s)
    {
      key: 'Delete',
      handler: () => {
        handleDeleteSelectedNodes();
      },
      description: 'Delete selected nodes',
    },
    // Backspace also deletes
    {
      key: 'Backspace',
      handler: () => {
        handleDeleteSelectedNodes();
      },
      description: 'Delete selected nodes',
    },
    // Escape to deselect
    {
      key: 'Escape',
      handler: () => {
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
      },
      description: 'Deselect all nodes',
    },
    // Ctrl+A to select all
    {
      key: 'a',
      ctrl: true,
      handler: () => {
        const allNodeIds = nodes.map((n) => n.id);
        setSelectedNodeIds(allNodeIds);
        if (allNodeIds.length === 1) {
          setSelectedNodeId(allNodeIds[0]);
        }
      },
      description: 'Select all nodes',
    },
    // Cmd/Ctrl+0 to reset zoom
    {
      key: '0',
      ctrl: true,
      handler: () => {
        if (reactFlowInstance) {
          reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
          setZoom(100);
        }
      },
      description: 'Reset zoom to 100%',
    },
    // Cmd/Ctrl+Z for undo
    {
      key: 'z',
      ctrl: true,
      handler: () => {
        if (canUndo) {
          undo();
        }
      },
      description: 'Undo last action',
    },
    // Cmd/Ctrl+Shift+Z for redo
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: () => {
        if (canRedo) {
          redo();
        }
      },
      description: 'Redo last undone action',
    },
    // F to fit view
    {
      key: 'f',
      handler: () => {
        handleFitView();
      },
      description: 'Fit view to all nodes',
    },
    // Ctrl+L for auto-layout
    {
      key: 'l',
      ctrl: true,
      handler: () => {
        handleAutoLayout();
      },
      description: 'Auto-layout workflow',
    },
    // Cmd/Ctrl+C to copy (deferred - requires clipboard)
    // Cmd/Ctrl+V to paste (deferred - requires clipboard)
    // Cmd/Ctrl+D to duplicate (deferred - requires duplicate operation)
  ], true);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <Toolbar
        workflowId={workflow.id}
        onFitView={handleFitView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={undo}
        onRedo={redo}
        onAutoLayout={handleAutoLayout}
        onAlignLeft={() => handleAlign('left')}
        onAlignRight={() => handleAlign('right')}
        onAlignTop={() => handleAlign('top')}
        onAlignBottom={() => handleAlign('bottom')}
        onAlignCenterH={() => handleAlign('centerH')}
        onAlignCenterV={() => handleAlign('centerV')}
        onDistributeH={() => handleDistribute('horizontal')}
        onDistributeV={() => handleDistribute('vertical')}
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
        selectedCount={selectedNodeIds.length}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Library Sidebar */}
        <NodeLibrarySidebar />

        {/* Canvas */}
        <div
          className="flex-1"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={(e) => {
            e.preventDefault();
            console.log('[DRAGENTER] Canvas');
          }}
        >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onSelectionChange={handleSelectionChange}
        onInit={setReactFlowInstance}
        onMove={handleMove}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={isValidConnection}
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{
          stroke: '#2c77df',
          strokeWidth: 2,
          strokeDasharray: '5,3',
        }}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'sequential',
          animated: false,
        }}
        minZoom={0.1}
        maxZoom={5}
        className="bg-surface"
        multiSelectionKeyCode="Control"
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        selectNodesOnDrag={true}
      >
        {/* Grid background */}
        <Background
          color="#64748b"
          gap={20}
          size={1}
          variant="dots"
        />

        {/* Zoom/Pan controls */}
        <Controls
          showZoom
          showFitView
          showInteractive
          position="bottom-right"
        />

        {/* Minimap (optional) */}
        <MiniMap
          nodeColor={(node) => {
            const nodeData = node.data?.node;
            if (!nodeData) return '#6366f1';

            // Color by node type
            if (nodeData.nodeType === 'trigger') return '#10b981'; // green
            if (nodeData.nodeType === 'action') return '#8b5cf6'; // purple
            if (nodeData.nodeType === 'logic') return '#f59e0b'; // amber
            return '#6366f1'; // default blue
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          position="bottom-left"
          pannable
          zoomable
        />

        {/* Empty state panel */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="pointer-events-none">
            <div className="bg-surface border border-border rounded-lg p-6 shadow-lg max-w-md">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">Create your workflow</h3>
                <p className="text-text-subtle text-sm">
                  Drag nodes from the library on the left to get started.
                  Connect them to define your workflow execution flow.
                </p>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>

        {/* Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* Context Menu */}
      {contextMenu.type && (
        <ContextMenu
          items={
            contextMenu.type === 'node'
              ? getNodeMenuItems()
              : contextMenu.type === 'edge'
                ? getEdgeMenuItems()
                : getCanvasMenuItems()
          }
          position={contextMenu.position}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export function WorkflowCanvas({ workflow }: { workflow: Workflow }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner workflow={workflow} />
    </ReactFlowProvider>
  );
}
