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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowCanvas } from '../../hooks/useWorkflowCanvas';
import { useNodeOperations } from '../../hooks/useNodeOperations';
import { useEdgeOperations } from '../../hooks/useEdgeOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { patchModel } from '@yaakapp-internal/models';
import { useSetAtom, useAtomValue } from 'jotai';
import { selectedNodeIdAtom } from '@yaakapp-internal/models/guest-js/atoms';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { NodeLibrarySidebar } from './NodeLibrarySidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { Toolbar } from './Toolbar';

interface WorkflowCanvasInnerProps {
  workflow: Workflow;
}

function WorkflowCanvasInner({ workflow }: WorkflowCanvasInnerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useWorkflowCanvas(workflow.id);

  console.log('[WorkflowCanvas] Render - initialNodes:', initialNodes.length, initialNodes);

  const { createNode, deleteNode } = useNodeOperations();
  const { createEdge } = useEdgeOperations();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [zoom, setZoom] = useState(100);

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
      if (change.type === 'position' && change.dragging === false && change.position) {
        // Clear existing timeout for this node
        const existingTimeout = positionUpdateTimeouts.current.get(change.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

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
  }, [onNodesChange]);

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

    // Create edge in database
    createEdge({
      workflowId: workflow.id,
      sourceNodeId: connection.source,
      targetNodeId: connection.target,
      sourceAnchor: connection.sourceHandle || 'output',
      targetAnchor: connection.targetHandle || 'input',
      edgeType: 'sequential',
    });

    // OptimisticallyUpdate UI (ReactFlow will re-render when database emits event)
  }, [workflow.id, createEdge]);

  // Handle canvas pane click (deselect)
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Handle node click (select)
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

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

    // Create node in database
    createNode({
      workflowId: workflow.id,
      nodeType,
      nodeSubtype,
      position,
    }).then(() => {
      console.log('Node created successfully');
    }).catch((error) => {
      console.error('Failed to create node:', error);
    });
  }, [reactFlowInstance, workflow.id, createNode]);

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

  // Keyboard shortcuts
  useKeyboardShortcuts([
    // Delete selected node
    {
      key: 'Delete',
      handler: () => {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
          setSelectedNodeId(null);
        }
      },
      description: 'Delete selected node',
    },
    // Backspace also deletes
    {
      key: 'Backspace',
      handler: () => {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
          setSelectedNodeId(null);
        }
      },
      description: 'Delete selected node',
    },
    // Escape to deselect
    {
      key: 'Escape',
      handler: () => {
        setSelectedNodeId(null);
      },
      description: 'Deselect node',
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
    // Cmd/Ctrl+A to select all (deferred - requires multi-select)
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
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
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
