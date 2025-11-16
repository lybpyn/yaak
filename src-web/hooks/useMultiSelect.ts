import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { selectedNodeIdsAtom, canvasNodesAtom } from '@yaakapp-internal/models';
import { useAtomValue } from 'jotai';

/**
 * Hook for managing multi-select state of canvas nodes
 */
export function useMultiSelect() {
  const [selectedIds, setSelectedIds] = useAtom(selectedNodeIdsAtom);
  const nodes = useAtomValue(canvasNodesAtom);

  /**
   * Toggle selection of a single node
   * If ctrlKey is true, adds/removes from existing selection
   * If ctrlKey is false, replaces selection with single node
   */
  const toggleSelect = useCallback(
    (nodeId: string, ctrlKey: boolean = false) => {
      setSelectedIds((prev) => {
        if (ctrlKey) {
          // Ctrl+Click: accumulate selection
          if (prev.includes(nodeId)) {
            // Remove if already selected
            return prev.filter((id) => id !== nodeId);
          } else {
            // Add to selection
            return [...prev, nodeId];
          }
        } else {
          // Normal click: replace selection
          return [nodeId];
        }
      });
    },
    [setSelectedIds],
  );

  /**
   * Select multiple nodes (for box selection)
   */
  const selectMultiple = useCallback(
    (nodeIds: string[]) => {
      setSelectedIds(nodeIds);
    },
    [setSelectedIds],
  );

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, [setSelectedIds]);

  /**
   * Select all nodes in the canvas
   */
  const selectAll = useCallback(() => {
    const allNodeIds = nodes.map((node: any) => node.id);
    setSelectedIds(allNodeIds);
  }, [nodes, setSelectedIds]);

  return {
    selectedIds,
    toggleSelect,
    selectMultiple,
    clearSelection,
    selectAll,
    selectedCount: selectedIds.length,
  };
}
