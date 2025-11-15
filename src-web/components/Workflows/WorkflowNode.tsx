import type { WorkflowStep } from '@yaakapp-internal/models';
import { patchModel, deleteModel } from '@yaakapp-internal/models';
import classNames from 'classnames';
import { useCallback } from 'react';
import { Button } from '../core/Button';
import { Icon } from '../core/Icon';

interface Props {
  step: WorkflowStep;
  stepNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function WorkflowNode({ step, stepNumber, isFirst, isLast, onMoveUp, onMoveDown }: Props) {
  const handleToggleEnabled = useCallback(async () => {
    await patchModel(step.id, { enabled: !step.enabled });
  }, [step.id, step.enabled]);

  const handleDelete = useCallback(async () => {
    alert('Delete function temporarily disabled due to backend crash. Please use the + button dialog to manage steps.');
    // FIXME: Deleting workflow_step causes backend panic
    // if (confirm(`Remove step "${step.name}"?`)) {
    //   await deleteModel(step.id);
    // }
  }, [step.name]);

  const getRequestIcon = () => {
    if (step.requestModel === 'http_request') {
      return '🌐';
    } else if (step.requestModel === 'grpc_request') {
      return '⚡';
    } else if (step.requestModel === 'websocket_request') {
      return '🔌';
    }
    return '📡';
  };

  return (
    <div className="relative group">
      {/* Node Card - Flowchart Style */}
      <div
        className={classNames(
          'relative bg-surface border-2 rounded-2xl p-6 transition-all min-w-[200px] shadow-sm',
          'hover:shadow-md',
          step.enabled ? 'border-border-focus' : 'border-border opacity-60'
        )}
      >
        {/* Error indicator for broken references */}
        {!step.requestId && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
        )}

        {/* Content - Centered */}
        <div className="flex flex-col items-center text-center gap-3">
          {/* Icon */}
          <div className="text-4xl">
            {getRequestIcon()}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <h4 className="font-semibold text-sm">{step.name}</h4>
            <p className="text-xs text-text-subtle">
              {step.requestModel === 'http_request' && 'HTTP Request'}
              {step.requestModel === 'grpc_request' && 'gRPC Request'}
              {step.requestModel === 'websocket_request' && 'WebSocket'}
            </p>
          </div>
        </div>

        {/* Hover Actions - Top Right */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="xs"
            variant="text"
            onClick={handleToggleEnabled}
            title={step.enabled ? 'Disable step' : 'Enable step'}
            className="bg-surface-highlight"
          >
            <Icon icon={step.enabled ? 'check_circle' : 'circle_dashed'} />
          </Button>
          <Button
            size="xs"
            variant="text"
            onClick={handleDelete}
            title="Remove step"
            className="bg-surface-highlight text-red-400 hover:text-red-300"
          >
            <Icon icon="trash" />
          </Button>
        </div>

        {/* Connection point - Right side */}
        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-4 bg-border-focus rounded-full border-2 border-surface" />

        {/* Connection point - Left side */}
        {!isFirst && (
          <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-4 bg-border-focus rounded-full border-2 border-surface" />
        )}
      </div>
    </div>
  );
}
