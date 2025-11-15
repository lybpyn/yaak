import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { canvasNodesAtom, canvasEdgesAtom, executionProgressAtom } from '@yaakapp-internal/models';
import type { Node, Edge } from 'reactflow';

/**
 * Load and convert canvas data for a specific workflow
 * Converts from Yaak models to ReactFlow format
 */
export function useWorkflowCanvas(workflowId: string | null) {
  const nodes = useAtomValue(canvasNodesAtom);
  const edges = useAtomValue(canvasEdgesAtom);
  const executionProgress = useAtomValue(executionProgressAtom);

  console.log('[useWorkflowCanvas] Raw nodes from atom:', nodes.length, nodes);
  console.log('[useWorkflowCanvas] Raw edges from atom:', edges.length, edges);

  // Filter and convert nodes to ReactFlow format
  const reactFlowNodes: Node[] = useMemo(() => {
    if (!workflowId) return [];

    return nodes
      .filter((n: any) => n.workflowId === workflowId)
      .map((n: any) => ({
        id: n.id,
        type: `${n.nodeType}_${n.nodeSubtype}`, // e.g., "action_http_request"
        position: { x: n.positionX, y: n.positionY },
        data: {
          node: n,
          label: n.name,
          executionStatus: executionProgress.get(n.id)?.state ?? null,
        },
        draggable: true,
        selectable: true,
      }));
  }, [nodes, workflowId, executionProgress]);

  // Filter and convert edges to ReactFlow format
  const reactFlowEdges: Edge[] = useMemo(() => {
    if (!workflowId) return [];

    return edges
      .filter((e: any) => e.workflowId === workflowId)
      .map((e: any) => {
        // Check if source node is running or completed
        const sourceStatus = executionProgress.get(e.sourceNodeId)?.state;
        const targetStatus = executionProgress.get(e.targetNodeId)?.state;

        // Animate edge if source is completed or target is running
        const animated = sourceStatus === 'completed' || targetStatus === 'running';

        return {
          id: e.id,
          source: e.sourceNodeId,
          target: e.targetNodeId,
          sourceHandle: e.sourceAnchor,
          targetHandle: e.targetAnchor,
          type: e.edgeType, // 'sequential', 'conditional', 'parallel', 'loop'
          data: {
            edge: e,
          },
          animated,
        };
      });
  }, [edges, workflowId, executionProgress]);

  return {
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
  };
}
