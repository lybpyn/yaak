import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { contextMenuAtom } from '@yaakapp-internal/models';

/**
 * Hook for managing context menu state
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);

  /**
   * Open context menu for a node
   * @param event - Mouse event for position
   * @param nodeData - Node data to pass to menu
   */
  const openNodeMenu = useCallback(
    (event: React.MouseEvent, nodeData: any) => {
      event.preventDefault();
      setContextMenu({
        type: 'node',
        position: { x: event.clientX, y: event.clientY },
        data: nodeData,
      });
    },
    [setContextMenu],
  );

  /**
   * Open context menu for an edge
   * @param event - Mouse event for position
   * @param edgeData - Edge data to pass to menu
   */
  const openEdgeMenu = useCallback(
    (event: React.MouseEvent, edgeData: any) => {
      event.preventDefault();
      setContextMenu({
        type: 'edge',
        position: { x: event.clientX, y: event.clientY },
        data: edgeData,
      });
    },
    [setContextMenu],
  );

  /**
   * Open context menu for canvas
   * @param event - Mouse event for position
   */
  const openCanvasMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        type: 'canvas',
        position: { x: event.clientX, y: event.clientY },
        data: null,
      });
    },
    [setContextMenu],
  );

  /**
   * Close context menu
   */
  const closeMenu = useCallback(() => {
    setContextMenu({
      type: null,
      position: { x: 0, y: 0 },
      data: null,
    });
  }, [setContextMenu]);

  return {
    contextMenu,
    openNodeMenu,
    openEdgeMenu,
    openCanvasMenu,
    closeMenu,
    isOpen: contextMenu.type !== null,
  };
}
