import type { Workflow } from '@yaakapp-internal/models';
import { useCallback, useState } from 'react';
import { useActiveEnvironment } from '../../hooks/useActiveEnvironment';
import {
  useCancelWorkflowExecution,
  useExecuteWorkflow,
  useWorkflowExecution,
  useWorkflowExecutionStatus,
} from '../../hooks/useWorkflowExecution';
import { showToast } from '../../lib/toast';
import { Button } from '../core/Button';
import { Dialog } from '../core/Dialog';
import { LoadingIcon } from '../core/LoadingIcon';
import { WorkflowExecutionResults } from './WorkflowExecutionResults';

interface Props {
  workflow: Workflow;
}

export function WorkflowExecutionButton({ workflow }: Props) {
  const activeEnvironment = useActiveEnvironment();
  const { mutateAsync: executeWorkflow } = useExecuteWorkflow();
  const { mutateAsync: cancelExecution } = useCancelWorkflowExecution();
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const execution = useWorkflowExecution(currentExecutionId);
  const status = useWorkflowExecutionStatus(currentExecutionId);

  const isRunning = execution?.state === 'running';
  const isCompleted = execution?.state === 'completed';
  const isFailed = execution?.state === 'failed';

  const handleExecute = useCallback(async () => {
    try {
      const result = await executeWorkflow({
        workflowId: workflow.id,
        environmentId: activeEnvironment?.id ?? null,
      });
      setCurrentExecutionId(result.executionId);
      setShowResults(true);
      showToast({
        message: 'Workflow execution started',
        color: 'success',
      });
    } catch (err) {
      showToast({
        message: `Failed to start workflow: ${err}`,
        color: 'danger',
      });
    }
  }, [executeWorkflow, workflow.id, activeEnvironment?.id]);

  const handleCancel = useCallback(async () => {
    if (!currentExecutionId) return;
    try {
      await cancelExecution({ executionId: currentExecutionId });
      showToast({
        message: 'Workflow execution cancelled',
        color: 'info',
      });
    } catch (err) {
      showToast({
        message: `Failed to cancel workflow: ${err}`,
        color: 'danger',
      });
    }
  }, [cancelExecution, currentExecutionId]);

  return (
    <>
      <Button
        size="sm"
        color={isRunning ? 'danger' : isCompleted ? 'success' : isFailed ? 'danger' : 'primary'}
        onClick={isRunning ? handleCancel : handleExecute}
        disabled={isRunning && !currentExecutionId}
      >
        {isRunning && <LoadingIcon />}
        {isRunning ? 'Cancel' : 'Run Workflow'}
      </Button>

      {currentExecutionId && (
        <Button
          size="sm"
          variant="border"
          onClick={() => setShowResults(true)}
        >
          View Results
        </Button>
      )}

      <Dialog
        open={showResults}
        onClose={() => setShowResults(false)}
        title="Workflow Execution Results"
        size="lg"
      >
        {currentExecutionId && (
          <WorkflowExecutionResults
            executionId={currentExecutionId}
            onClose={() => setShowResults(false)}
          />
        )}
      </Dialog>
    </>
  );
}
