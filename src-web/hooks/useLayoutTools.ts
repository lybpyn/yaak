import { useCallback } from 'react';
import { invokeCmd } from '../lib/tauri';

interface Node {
  id: string;
  positionX: number;
  positionY: number;
  [key: string]: any;
}

type AlignmentType = 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV';
type DistributionType = 'horizontal' | 'vertical';

const NODE_WIDTH = 100;
const NODE_HEIGHT = 100;

/**
 * Hook for alignment and distribution tools
 */
export function useLayoutTools() {
  /**
   * Align selected nodes
   * @param nodes - Nodes to align
   * @param alignment - Alignment type
   */
  const alignNodes = useCallback(async (nodes: Node[], alignment: AlignmentType): Promise<void> => {
    // Minimum 2 nodes required
    if (nodes.length < 2) {
      return;
    }

    let targetValue: number;
    const updates: Promise<any>[] = [];

    switch (alignment) {
      case 'left':
        // Align to leftmost node
        targetValue = Math.min(...nodes.map((n) => n.positionX));
        updates.push(
          ...nodes.map((node) =>
            invokeCmd('upsert', {
              model: { ...node, positionX: targetValue },
            }),
          ),
        );
        break;

      case 'right':
        // Align to rightmost node
        targetValue = Math.max(...nodes.map((n) => n.positionX));
        updates.push(
          ...nodes.map((node) =>
            invokeCmd('upsert', {
              model: { ...node, positionX: targetValue },
            }),
          ),
        );
        break;

      case 'top':
        // Align to topmost node
        targetValue = Math.min(...nodes.map((n) => n.positionY));
        updates.push(
          ...nodes.map((node) =>
            invokeCmd('upsert', {
              model: { ...node, positionY: targetValue },
            }),
          ),
        );
        break;

      case 'bottom':
        // Align to bottommost node
        targetValue = Math.max(...nodes.map((n) => n.positionY));
        updates.push(
          ...nodes.map((node) =>
            invokeCmd('upsert', {
              model: { ...node, positionY: targetValue },
            }),
          ),
        );
        break;

      case 'centerH':
        // Align to horizontal center
        const avgY = nodes.reduce((sum, n) => sum + n.positionY, 0) / nodes.length;
        updates.push(
          ...nodes.map((node) =>
            invokeCmd('upsert', {
              model: { ...node, positionY: Math.round(avgY) },
            }),
          ),
        );
        break;

      case 'centerV':
        // Align to vertical center
        const avgX = nodes.reduce((sum, n) => sum + n.positionX, 0) / nodes.length;
        updates.push(
          ...nodes.map((node) =>
            invokeCmd('upsert', {
              model: { ...node, positionX: Math.round(avgX) },
            }),
          ),
        );
        break;
    }

    // Batch update all nodes
    await Promise.all(updates);
  }, []);

  /**
   * Distribute nodes evenly
   * @param nodes - Nodes to distribute (minimum 3)
   * @param direction - Distribution direction
   */
  const distributeNodes = useCallback(
    async (nodes: Node[], direction: DistributionType): Promise<void> => {
      // Minimum 3 nodes required for distribution
      if (nodes.length < 3) {
        return;
      }

      const updates: Promise<any>[] = [];

      if (direction === 'horizontal') {
        // Sort by X position
        const sorted = [...nodes].sort((a, b) => a.positionX - b.positionX);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalWidth = last.positionX - first.positionX;
        const gap = totalWidth / (sorted.length - 1);

        updates.push(
          ...sorted.map((node, index) =>
            invokeCmd('upsert', {
              model: {
                ...node,
                positionX: Math.round(first.positionX + gap * index),
              },
            }),
          ),
        );
      } else {
        // Vertical distribution
        const sorted = [...nodes].sort((a, b) => a.positionY - b.positionY);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalHeight = last.positionY - first.positionY;
        const gap = totalHeight / (sorted.length - 1);

        updates.push(
          ...sorted.map((node, index) =>
            invokeCmd('upsert', {
              model: {
                ...node,
                positionY: Math.round(first.positionY + gap * index),
              },
            }),
          ),
        );
      }

      // Batch update all nodes
      await Promise.all(updates);
    },
    [],
  );

  return {
    alignNodes,
    distributeNodes,
  };
}
