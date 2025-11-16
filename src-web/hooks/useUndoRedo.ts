import { useAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { undoStackAtom, redoStackAtom, type CanvasAction } from '@yaakapp-internal/models';

const MAX_STACK_SIZE = 50;

/**
 * Action interface for undo/redo operations
 */
export interface UndoRedoAction {
  type: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

/**
 * Hook for managing undo/redo operations with a limited action stack
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
