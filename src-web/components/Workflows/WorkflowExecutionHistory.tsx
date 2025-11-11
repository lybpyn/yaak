import { useState } from 'react';
import { useWorkflowExecutions } from '../../hooks/useWorkflowExecution';
import { Badge } from '../core/Badge';
import { Button } from '../core/Button';
import { Dialog } from '../core/Dialog';
import { EmptyStateText } from '../EmptyStateText';
import { WorkflowExecutionResults } from './WorkflowExecutionResults';

interface Props {
  workflowId: string;
}

export function WorkflowExecutionHistory({ workflowId }: Props) {
  const executions = useWorkflowExecutions(workflowId);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'running':
        return <Badge color="primary" size="sm">Running</Badge>;
      case 'completed':
        return <Badge color="success" size="sm">Completed</Badge>;
      case 'failed':
        return <Badge color="danger" size="sm">Failed</Badge>;
      case 'cancelled':
        return <Badge color="warning" size="sm">Cancelled</Badge>;
      default:
        return <Badge size="sm">{state}</Badge>;
    }
  };

  if (executions.length === 0) {
    return (
      <EmptyStateText>
        No execution history yet. Run the workflow to see results here.
      </EmptyStateText>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {executions.map((execution) => (
          <div
            key={execution.id}
            className="border border-border rounded-md p-3 hover:bg-surface-highlight cursor-pointer"
            onClick={() => setSelectedExecutionId(execution.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {new Date(execution.createdAt).toLocaleString()}
              </span>
              {getStateBadge(execution.state)}
            </div>

            {execution.elapsed != null && (
              <div className="text-xs text-text-subtle">
                Duration: {execution.elapsed}ms
              </div>
            )}

            {execution.error && (
              <div className="text-xs text-danger mt-1 truncate">{execution.error}</div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={selectedExecutionId != null}
        onClose={() => setSelectedExecutionId(null)}
        title="Execution Results"
        size="lg"
      >
        {selectedExecutionId && (
          <WorkflowExecutionResults
            executionId={selectedExecutionId}
            onClose={() => setSelectedExecutionId(null)}
          />
        )}
      </Dialog>
    </>
  );
}
