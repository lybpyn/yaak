import classNames from 'classnames';
import {
  useWorkflowExecution,
  useWorkflowStepExecutions,
} from '../../hooks/useWorkflowExecution';
import { useWorkflowSteps } from '../../hooks/useWorkflowSteps';
import { Badge } from '../core/Badge';
import { Icon } from '../core/Icon';
import { LoadingIcon } from '../core/LoadingIcon';

interface Props {
  executionId: string;
  onClose: () => void;
}

export function WorkflowExecutionResults({ executionId }: Props) {
  const execution = useWorkflowExecution(executionId);
  const stepExecutions = useWorkflowStepExecutions(executionId);
  const steps = useWorkflowSteps(execution?.workflowId ?? null);

  if (!execution) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingIcon />
        <span className="ml-2">Loading execution...</span>
      </div>
    );
  }

  const isRunning = execution.state === 'running';
  const isCompleted = execution.state === 'completed';
  const isFailed = execution.state === 'failed';
  const isCancelled = execution.state === 'cancelled';

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'running':
        return <Badge color="primary">Running</Badge>;
      case 'completed':
        return <Badge color="success">Completed</Badge>;
      case 'failed':
        return <Badge color="danger">Failed</Badge>;
      case 'cancelled':
        return <Badge color="warning">Cancelled</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Execution Summary */}
      <div className="border border-border rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Execution Status</span>
          {getStateBadge(execution.state)}
        </div>
        {execution.elapsed != null && (
          <div className="text-sm text-text-subtle">
            Duration: {execution.elapsed}ms
          </div>
        )}
        {execution.error && (
          <div className="mt-2 text-sm text-danger bg-danger-subtle p-2 rounded">
            {execution.error}
          </div>
        )}
      </div>

      {/* Step Executions */}
      <div>
        <h4 className="font-semibold mb-3">Step Results</h4>
        <div className="flex flex-col gap-2">
          {steps.map((step, index) => {
            const stepExec = stepExecutions.find((se) => se.workflowStepId === step.id);
            const stepState = stepExec?.state ?? 'pending';
            const isStepRunning = stepState === 'running';
            const isStepCompleted = stepState === 'completed';
            const isStepFailed = stepState === 'failed';

            return (
              <div
                key={step.id}
                className={classNames(
                  'border border-border rounded-md p-3',
                  isStepFailed && 'border-danger bg-danger-subtle',
                  isStepCompleted && 'border-success',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-text-subtlest text-sm font-mono">{index + 1}</span>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      {getStateBadge(stepState)}
                    </div>
                    {stepExec?.elapsed != null && (
                      <div className="text-xs text-text-subtle mt-1">
                        {stepExec.elapsed}ms
                      </div>
                    )}
                    {stepExec?.error && (
                      <div className="text-xs text-danger mt-1">{stepExec.error}</div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isStepRunning && <LoadingIcon />}
                    {isStepCompleted && <Icon icon="check" className="text-success" />}
                    {isStepFailed && <Icon icon="x" className="text-danger" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isRunning && (
        <div className="text-center text-text-subtle py-4">
          <LoadingIcon className="inline mr-2" />
          Workflow is running...
        </div>
      )}
    </div>
  );
}
