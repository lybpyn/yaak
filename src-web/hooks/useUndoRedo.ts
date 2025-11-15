import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { undoStackAtom, redoStackAtom, type CanvasAction } from '@yaakapp-internal/models';
import { invokeCmd } from '../lib/tauri';

const MAX_UNDO_STACK_SIZE = 50;

/**
 * Undo/Redo system for canvas operations
 * Maintains 50-action history
 */
export function useUndoRedo() {
  const [undoStack, setUndoStack] = useAtom(undoStackAtom);
  const [redoStack, setRedoStack] = useAtom(redoStackAtom);

  // Push new action to undo stack
  const pushAction = useCallback(
    (action: CanvasAction) => {
      setUndoStack((prev) => [...prev, action].slice(-MAX_UNDO_STACK_SIZE));
      setRedoStack([]); // Clear redo stack on new action
    },
    [setUndoStack, setRedoStack]
  );

  // Undo last action
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    if (!action) return;

    try {
      // Revert action
      switch (action.type) {
        case 'ADD_NODE':
          await invokeCmd('cmd_delete_workflow_node', {
            nodeId: action.payload.nodeId,
          });
          break;

        case 'DELETE_NODE':
          await invokeCmd('cmd_create_workflow_node', {
            req: action.payload.node,
          });
          break;

        case 'MOVE_NODE':
          await invokeCmd('cmd_update_workflow_node', {
            req: {
              id: action.payload.nodeId,
              positionX: action.payload.oldPos.x,
              positionY: action.payload.oldPos.y,
            },
          });
          break;

        case 'ADD_EDGE':
          await invokeCmd('cmd_delete_workflow_edge', {
            edgeId: action.payload.edgeId,
          });
          break;

        case 'DELETE_EDGE':
          await invokeCmd('cmd_create_workflow_edge', {
            req: action.payload.edge,
          });
          break;

        case 'UPDATE_NODE_CONFIG':
          await invokeCmd('cmd_update_workflow_node', {
            req: {
              id: action.payload.nodeId,
              config: action.payload.oldConfig,
            },
          });
          break;

        case 'PASTE_NODES':
          // Delete all pasted nodes
          for (const nodeId of action.payload.nodeIds) {
            await invokeCmd('cmd_delete_workflow_node', { nodeId });
          }
          break;

        default:
          console.warn('Unknown action type for undo:', action.type);
      }

      // Move action to redo stack
      setRedoStack((prev) => [...prev, action]);
      setUndoStack((prev) => prev.slice(0, -1));
    } catch (err) {
      console.error('Undo failed:', err);
      throw err;
    }
  }, [undoStack, setUndoStack, setRedoStack]);

  // Redo last undone action
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    if (!action) return;

    try {
      // Reapply action
      switch (action.type) {
        case 'ADD_NODE':
          await invokeCmd('cmd_create_workflow_node', {
            req: action.payload.node,
          });
          break;

        case 'DELETE_NODE':
          await invokeCmd('cmd_delete_workflow_node', {
            nodeId: action.payload.nodeId,
          });
          break;

        case 'MOVE_NODE':
          await invokeCmd('cmd_update_workflow_node', {
            req: {
              id: action.payload.nodeId,
              positionX: action.payload.newPos.x,
              positionY: action.payload.newPos.y,
            },
          });
          break;

        case 'ADD_EDGE':
          await invokeCmd('cmd_create_workflow_edge', {
            req: action.payload.edge,
          });
          break;

        case 'DELETE_EDGE':
          await invokeCmd('cmd_delete_workflow_edge', {
            edgeId: action.payload.edgeId,
          });
          break;

        case 'UPDATE_NODE_CONFIG':
          await invokeCmd('cmd_update_workflow_node', {
            req: {
              id: action.payload.nodeId,
              config: action.payload.newConfig,
            },
          });
          break;

        case 'PASTE_NODES':
          // Re-create all pasted nodes
          for (const node of action.payload.nodes) {
            await invokeCmd('cmd_create_workflow_node', { req: node });
          }
          break;

        default:
          console.warn('Unknown action type for redo:', action.type);
      }

      // Move action back to undo stack
      setUndoStack((prev) => [...prev, action]);
      setRedoStack((prev) => prev.slice(0, -1));
    } catch (err) {
      console.error('Redo failed:', err);
      throw err;
    }
  }, [redoStack, setUndoStack, setRedoStack]);

  return {
    undo,
    redo,
    pushAction,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}
