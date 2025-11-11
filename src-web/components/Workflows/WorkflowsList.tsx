import type { Workflow } from '@yaakapp-internal/models';
import { deleteModel } from '@yaakapp-internal/models';
import classNames from 'classnames';
import { useCallback } from 'react';
import { Badge } from '../core/Badge';
import { Icon } from '../core/Icon';
import { IconButton } from '../core/IconButton';

interface Props {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  onSelect: (workflowId: string) => void;
  onCreate: () => void;
}

export function WorkflowsList({ workflows, activeWorkflowId, onSelect, onCreate }: Props) {
  const handleDelete = useCallback(async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow?')) {
      await deleteModel(workflowId);
    }
  }, []);

  if (workflows.length === 0) {
    return (
      <div className="p-4 text-center text-text-subtle">
        <p className="mb-4">No workflows yet</p>
        <button
          onClick={onCreate}
          className="text-primary hover:underline"
        >
          Create your first workflow
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {workflows.map((workflow) => {
        const isActive = workflow.id === activeWorkflowId;

        return (
          <div
            key={workflow.id}
            onClick={() => onSelect(workflow.id)}
            className={classNames(
              'flex items-center gap-2 px-3 py-2 rounded cursor-pointer',
              'hover:bg-surface-highlight',
              isActive && 'bg-surface-active',
            )}
          >
            <Icon icon="workflow" className="flex-shrink-0 text-text-subtle" />

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{workflow.name}</div>
              {workflow.description && (
                <div className="text-xs text-text-subtle truncate">
                  {workflow.description}
                </div>
              )}
            </div>

            <IconButton
              icon="trash"
              size="xs"
              title="Delete workflow"
              onClick={(e) => handleDelete(workflow.id, e)}
              className="opacity-0 group-hover:opacity-60 hover:opacity-100"
            />
          </div>
        );
      })}
    </div>
  );
}
