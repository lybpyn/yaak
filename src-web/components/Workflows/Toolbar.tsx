import { Button } from '../core/Button';
import { useAtomValue } from 'jotai';
import { isExecutingAtom } from '@yaakapp-internal/models/guest-js/atoms';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

interface ToolbarProps {
  workflowId: string;
  onExecute?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFitView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasUnsavedChanges?: boolean;
  zoom?: number;
}

export function Toolbar({
  workflowId,
  onExecute,
  onSave,
  onUndo,
  onRedo,
  onFitView,
  onZoomIn,
  onZoomOut,
  canUndo = false,
  canRedo = false,
  hasUnsavedChanges = false,
  zoom = 100,
}: ToolbarProps) {
  const isExecuting = useAtomValue(isExecutingAtom);
  const [showEnvironmentSelector, setShowEnvironmentSelector] = useState(false);

  const handleExecute = async () => {
    if (onExecute) {
      onExecute();
    } else {
      // Default execution logic
      try {
        await invoke('cmd_execute_workflow_canvas', {
          workflowId,
          environmentId: null,
        });
      } catch (error) {
        console.error('Failed to execute workflow:', error);
      }
    }
  };

  return (
    <div className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 gap-4">
      {/* Left Section - Workflow Name */}
      <div className="flex items-center gap-3">
        <h2 className="font-semibold">Workflow Canvas</h2>
      </div>

      {/* Center Section - Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleExecute}
          disabled={isExecuting}
          className="bg-purple-500 hover:bg-purple-600 text-white"
        >
          {isExecuting ? 'Executing...' : 'Execute Workflow'}
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          className="px-3 py-1.5 text-sm rounded hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save (Cmd/Ctrl+S)"
        >
          💾
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-1.5 text-sm rounded hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Cmd/Ctrl+Z)"
        >
          ↶
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 py-1.5 text-sm rounded hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Cmd/Ctrl+Shift+Z)"
        >
          ↷
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={onFitView}
          className="px-3 py-1.5 text-sm rounded hover:bg-surface-highlight"
          title="Fit to Screen"
        >
          ⊡
        </button>

        <button
          onClick={onZoomOut}
          className="px-3 py-1.5 text-sm rounded hover:bg-surface-highlight"
          title="Zoom Out"
        >
          −
        </button>

        <span className="text-sm text-text-subtle min-w-[4rem] text-center">
          {Math.round(zoom)}%
        </span>

        <button
          onClick={onZoomIn}
          className="px-3 py-1.5 text-sm rounded hover:bg-surface-highlight"
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Right Section - Settings */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-sm rounded hover:bg-surface-highlight"
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}
