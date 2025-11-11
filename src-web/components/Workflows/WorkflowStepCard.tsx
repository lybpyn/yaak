import type { WorkflowStep } from '@yaakapp-internal/models';
import { deleteModel, patchModel } from '@yaakapp-internal/models';
import classNames from 'classnames';
import { useCallback } from 'react';
import { useAllRequests } from '../../hooks/useAllRequests';
import { Badge } from '../core/Badge';
import { Button } from '../core/Button';
import { Checkbox } from '../core/Checkbox';
import { Icon } from '../core/Icon';
import { IconButton } from '../core/IconButton';

interface Props {
  step: WorkflowStep;
  stepNumber: number;
  onDelete?: () => void;
}

export function WorkflowStepCard({ step, stepNumber, onDelete }: Props) {
  const allRequests = useAllRequests();
  const request = allRequests.find((r) => r.id === step.requestId);

  const toggleEnabled = useCallback(async () => {
    await patchModel(step.id, { enabled: !step.enabled });
  }, [step.id, step.enabled]);

  const handleDelete = useCallback(async () => {
    await deleteModel(step.id);
    onDelete?.();
  }, [step.id, onDelete]);

  const requestMethod = request?.model === 'http_request' ? request.method : 'gRPC';
  const requestName = request?.name ?? '<deleted>';
  const isBroken = !request;

  return (
    <div
      className={classNames(
        'border border-border rounded-md p-3',
        'flex items-start gap-3',
        !step.enabled && 'opacity-50',
        isBroken && 'border-danger',
      )}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-text-subtlest text-sm font-mono">{stepNumber}</span>
        <Checkbox
          checked={step.enabled}
          onChange={toggleEnabled}
          title="Enable/disable step"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{step.name}</span>
          {request?.model === 'http_request' && (
            <Badge size="sm" color="primary">
              {requestMethod}
            </Badge>
          )}
          {request?.model === 'grpc_request' && (
            <Badge size="sm" color="secondary">
              gRPC
            </Badge>
          )}
        </div>

        <div className="text-sm text-text-subtle flex items-center gap-1">
          <Icon icon="arrow-right" />
          <span className={classNames('truncate', isBroken && 'text-danger')}>
            {requestName}
          </span>
        </div>

        {isBroken && (
          <div className="text-xs text-danger mt-1">Request has been deleted</div>
        )}
      </div>

      <div className="flex-shrink-0">
        <IconButton
          icon="trash"
          size="sm"
          title="Delete step"
          onClick={handleDelete}
          className="opacity-60 hover:opacity-100"
        />
      </div>
    </div>
  );
}
