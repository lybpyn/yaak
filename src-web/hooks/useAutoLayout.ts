import { useCallback } from 'react';
import dagre from 'dagre';
import { invokeCmd } from '../lib/tauri';

interface Node {
  id: string;
  positionX: number;
  positionY: number;
  [key: string]: any;
}

interface Edge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  [key: string]: any;
}

/**
 * Hook for auto-layout using Dagre algorithm
 */
export function useAutoLayout() {
  /**
   * Auto-layout nodes using Dagre algorithm
   * @param nodes - Array of nodes to layout
   * @param edges - Array of edges defining connections
   * @returns Promise that resolves when layout is complete
   */
  const autoLayout = useCallback(async (nodes: Node[], edges: Edge[]): Promise<void> => {
    // Handle empty workflow
    if (nodes.length === 0) {
      return;
    }

    // Create new dagre graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure graph layout
    dagreGraph.setGraph({
      rankdir: 'LR', // Left to right
      nodesep: 150,  // Space between nodes on same rank
      ranksep: 200,  // Space between ranks
    });

    // Add nodes to graph (using default node size)
    const nodeWidth = 100;
    const nodeHeight = 100;
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        width: nodeWidth,
        height: nodeHeight,
      });
    });

    // Add edges to graph
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.sourceNodeId, edge.targetNodeId);
    });

    // Run dagre layout algorithm
    dagre.layout(dagreGraph);

    // Extract new positions and batch update to database
    const updatePromises = nodes.map((node) => {
      const dagreNode = dagreGraph.node(node.id);
      if (!dagreNode) return Promise.resolve();

      // Dagre returns center position, calculate top-left corner
      const newX = dagreNode.x - nodeWidth / 2;
      const newY = dagreNode.y - nodeHeight / 2;

      // Update node position in database
      return invokeCmd('upsert', {
        model: {
          ...node,
          positionX: Math.round(newX),
          positionY: Math.round(newY),
        },
      });
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);
  }, []);

  return {
    autoLayout,
  };
}
