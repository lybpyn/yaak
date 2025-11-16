import { useAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { undoStackAtom, redoStackAtom, type CanvasAction } from '@yaakapp-internal/models';

const MAX_STACK_SIZE = 50;

/**
 * Interface for an undo/redo action
 * @property type - Descriptive name of the action (e.g., 'createNode', 'moveNode')
 * @property undo - Function to reverse the action
 * @property redo - Function to reapply the action
 *
 * @example
 * ```typescript
 * const action: UndoRedoAction = {
 *   type: 'moveNode',
 *   undo: () => updateNode({ nodeId, updates: { positionX: oldX, positionY: oldY } }),
 *   redo: () => updateNode({ nodeId, updates: { positionX: newX, positionY: newY } }),
 * };
 * ```
 */
export interface UndoRedoAction {
  type: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

/**
 * Hook for managing undo/redo operations with a circular buffer action stack
 *
 * Features:
 * - Stores up to 50 actions (configurable)
 * - Supports async undo/redo operations
 * - Automatically clears redo stack when new action is recorded
 * - Uses Jotai atoms for global state management
 *
 * @returns Object containing undo/redo functions and state
 *
 * @example
 * ```typescript
 * const { undo, redo, recordAction, canUndo, canRedo } = useUndoRedo();
 *
 * // Record an action
 * recordAction({
 *   type: 'createNode',
 *   undo: () => deleteNode(nodeId),
 *   redo: () => createNode(nodeParams),
 * });
 *
 * // Undo the last action
 * if (canUndo) await undo();
 *
 * // Redo the last undone action
 * if (canRedo) await redo();
 * ```
 */
export function useUndoRedo() {
  const [undoStack, setUndoStack] = useAtom(undoStackAtom);
  const [redoStack, setRedoStack] = useAtom(redoStackAtom);

  /**
   * Record a new action to the undo stack
   * Clears the redo stack when a new action is recorded
   */
  const recordAction = useCallback(
    (action: UndoRedoAction) => {
      const canvasAction: CanvasAction = {
        type: action.type,
        payload: action,
        timestamp: Date.now(),
      };

      setUndoStack((prev) => {
        const newStack = [...prev, canvasAction];
        // Limit stack to MAX_STACK_SIZE (circular buffer)
        if (newStack.length > MAX_STACK_SIZE) {
          return newStack.slice(newStack.length - MAX_STACK_SIZE);
        }
        return newStack;
      });

      // Clear redo stack when new action is recorded
      setRedoStack([]);
    },
    [setUndoStack, setRedoStack],
  );

  /**
   * Undo the last action from the undo stack
   */
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    const action = lastAction.payload as UndoRedoAction;

    // Execute undo function
    await action.undo();

    // Move action from undo to redo stack
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);
  }, [undoStack, setUndoStack, setRedoStack]);

  /**
   * Redo the last undone action from the redo stack
   */
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const lastAction = redoStack[redoStack.length - 1];
    const action = lastAction.payload as UndoRedoAction;

    // Execute redo function
    await action.redo();

    // Move action from redo to undo stack
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => {
      const newStack = [...prev, lastAction];
      // Maintain stack size limit
      if (newStack.length > MAX_STACK_SIZE) {
        return newStack.slice(newStack.length - MAX_STACK_SIZE);
      }
      return newStack;
    });
  }, [redoStack, setRedoStack, setUndoStack]);

  /**
   * Check if undo is available
   */
  const canUndo = useMemo(() => undoStack.length > 0, [undoStack]);

  /**
   * Check if redo is available
   */
  const canRedo = useMemo(() => redoStack.length > 0, [redoStack]);

  return {
    undo,
    redo,
    recordAction,
    canUndo,
    canRedo,
    undoStackSize: undoStack.length,
    redoStackSize: redoStack.length,
  };
}
