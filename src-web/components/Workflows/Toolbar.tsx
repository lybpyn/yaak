import { Button } from '../core/Button';
import { useAtomValue } from 'jotai';
import { isExecutingAtom } from '@yaakapp-internal/models/guest-js/atoms';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import { IconButton } from './IconButton';
import { Divider } from './Divider';

interface ToolbarProps {
  workflowId: string;
  onExecute?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFitView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAutoLayout?: () => void;
  onAlignLeft?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignBottom?: () => void;
  onAlignCenterH?: () => void;
  onAlignCenterV?: () => void;
  onDistributeH?: () => void;
  onDistributeV?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasUnsavedChanges?: boolean;
  zoom?: number;
  selectedCount?: number;
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
  onAutoLayout,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  onAlignCenterH,
  onAlignCenterV,
  onDistributeH,
  onDistributeV,
  canUndo = false,
  canRedo = false,
  hasUnsavedChanges = false,
  zoom = 100,
  selectedCount = 0,
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

  const canAlign = selectedCount >= 2;
  const canDistribute = selectedCount >= 3;

  return (
    <div className="h-12 bg-surface border-b border-border flex items-center px-4 gap-3">
      {/* Undo/Redo */}
      <div className="flex gap-1">
        <IconButton
          onClick={onUndo}
          disabled={!canUndo}
          tooltip="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          ↶
        </IconButton>
        <IconButton
          onClick={onRedo}
          disabled={!canRedo}
          tooltip="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          ↷
        </IconButton>
      </div>

      <Divider />

      {/* Layout Tools */}
      {onAutoLayout && (
        <IconButton
          onClick={onAutoLayout}
          tooltip="Auto Layout (Ctrl+L)"
          aria-label="Auto Layout"
        >
          ⚡
        </IconButton>
      )}

      {/* Alignment Tools (enabled when 2+ selected) */}
      {canAlign && (
        <>
          <Divider />
          <div className="flex gap-1">
            {onAlignLeft && (
              <IconButton
                onClick={onAlignLeft}
                tooltip="Align Left"
                aria-label="Align Left"
              >
                ⊣
              </IconButton>
            )}
            {onAlignRight && (
              <IconButton
                onClick={onAlignRight}
                tooltip="Align Right"
                aria-label="Align Right"
              >
                ⊢
              </IconButton>
            )}
            {onAlignTop && (
              <IconButton
                onClick={onAlignTop}
                tooltip="Align Top"
                aria-label="Align Top"
              >
                ⊤
              </IconButton>
            )}
            {onAlignBottom && (
              <IconButton
                onClick={onAlignBottom}
                tooltip="Align Bottom"
                aria-label="Align Bottom"
              >
                ⊥
              </IconButton>
            )}
          </div>
        </>
      )}

      {/* Distribution Tools (enabled when 3+ selected) */}
      {canDistribute && (
        <>
          <Divider />
          <div className="flex gap-1">
            {onDistributeH && (
              <IconButton
                onClick={onDistributeH}
                tooltip="Distribute Horizontally"
                aria-label="Distribute Horizontally"
              >
                ⟷
              </IconButton>
            )}
            {onDistributeV && (
              <IconButton
                onClick={onDistributeV}
                tooltip="Distribute Vertically"
                aria-label="Distribute Vertically"
              >
                ⟺
              </IconButton>
            )}
          </div>
        </>
      )}

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-3">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <IconButton
            onClick={onZoomOut}
            tooltip="Zoom Out"
            aria-label="Zoom Out"
          >
            −
          </IconButton>
          <span className="text-sm text-text-subtle min-w-[4rem] text-center">
            {Math.round(zoom)}%
          </span>
          <IconButton
            onClick={onZoomIn}
            tooltip="Zoom In"
            aria-label="Zoom In"
          >
            +
          </IconButton>
          <IconButton
            onClick={onFitView}
            tooltip="Fit to Screen (F)"
            aria-label="Fit to Screen"
          >
            ⊡
          </IconButton>
        </div>

        {/* Selection Count */}
        {selectedCount > 0 && (
          <span className="text-sm text-primary font-medium">
            {selectedCount} selected
          </span>
        )}
      </div>
    </div>
  );
}
