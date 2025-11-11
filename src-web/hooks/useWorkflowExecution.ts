import { useQuery } from '@tanstack/react-query';
import type {
  WorkflowExecution,
  WorkflowStepExecution,
} from '@yaakapp-internal/models';
import {
  workflowExecutionsAtom,
  workflowStepExecutionsAtom,
} from '@yaakapp-internal/models';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { invokeCmd } from '../lib/tauri';
import { useFastMutation } from './useFastMutation';
import { useListenToTauriEvent } from './useListenToTauriEvent';

interface ExecuteWorkflowRequest {
  workflowId: string;
  environmentId: string | null;
}

interface ExecuteWorkflowResponse {
  executionId: string;
}

interface CancelWorkflowExecutionRequest {
  executionId: string;
}

interface GetWorkflowExecutionResultsResponse {
  execution: WorkflowExecution;
  stepExecutions: WorkflowStepExecution[];
}

interface ListWorkflowExecutionsResponse {
  executions: WorkflowExecution[];
}

interface WorkflowExecutionUpdate {
  executionId: string;
  state: string;
  elapsed: number | null;
}

interface WorkflowStepCompleted {
  executionId: string;
  stepId: string;
  state: string;
}

export function useExecuteWorkflow() {
  return useFastMutation<ExecuteWorkflowResponse, unknown, ExecuteWorkflowRequest>({
    mutationKey: ['execute_workflow'],
    mutationFn: async (req: ExecuteWorkflowRequest) => {
      return invokeCmd<ExecuteWorkflowResponse>('cmd_execute_workflow', { req });
    },
  });
}

export function useCancelWorkflowExecution() {
  return useFastMutation<void, unknown, CancelWorkflowExecutionRequest>({
    mutationKey: ['cancel_workflow_execution'],
    mutationFn: async (req: CancelWorkflowExecutionRequest) => {
      return invokeCmd<void>('cmd_cancel_workflow_execution', { req });
    },
  });
}

export function useWorkflowExecutions(workflowId: string | null): WorkflowExecution[] {
  const executions = useAtomValue(workflowExecutionsAtom);
  return useMemo(() => {
    if (!workflowId) return [];
    return executions.filter((e) => e.workflowId === workflowId);
  }, [executions, workflowId]);
}

export function useWorkflowExecution(executionId: string | null): WorkflowExecution | null {
  const executions = useAtomValue(workflowExecutionsAtom);
  return useMemo(() => {
    if (!executionId) return null;
    return executions.find((e) => e.id === executionId) ?? null;
  }, [executions, executionId]);
}

export function useWorkflowStepExecutions(
  executionId: string | null,
): WorkflowStepExecution[] {
  const stepExecutions = useAtomValue(workflowStepExecutionsAtom);
  return useMemo(() => {
    if (!executionId) return [];
    return stepExecutions.filter((se) => se.workflowExecutionId === executionId);
  }, [stepExecutions, executionId]);
}

export function useWorkflowExecutionResults(executionId: string | null) {
  return useQuery<GetWorkflowExecutionResultsResponse>({
    queryKey: ['workflow_execution_results', executionId],
    queryFn: async () => {
      if (!executionId) {
        throw new Error('Execution ID is required');
      }
      return invokeCmd<GetWorkflowExecutionResultsResponse>(
        'cmd_get_workflow_execution_results',
        { executionId },
      );
    },
    enabled: executionId != null,
  });
}

export function useListWorkflowExecutions(
  workflowId: string | null,
  limit?: number,
  offset?: number,
) {
  return useQuery<ListWorkflowExecutionsResponse>({
    queryKey: ['workflow_executions', workflowId, limit, offset],
    queryFn: async () => {
      if (!workflowId) {
        throw new Error('Workflow ID is required');
      }
      return invokeCmd<ListWorkflowExecutionsResponse>('cmd_list_workflow_executions', {
        workflowId,
        limit,
        offset,
      });
    },
    enabled: workflowId != null,
  });
}

export function useWorkflowExecutionUpdates(
  onUpdate?: (update: WorkflowExecutionUpdate) => void,
) {
  useListenToTauriEvent<WorkflowExecutionUpdate>('workflow_execution_updated', (event) => {
    onUpdate?.(event.payload);
  });
}

export function useWorkflowStepCompletedEvents(
  onStepCompleted?: (completed: WorkflowStepCompleted) => void,
) {
  useListenToTauriEvent<WorkflowStepCompleted>('workflow_step_completed', (event) => {
    onStepCompleted?.(event.payload);
  });
}

// Convenience hook that tracks active execution state
export function useWorkflowExecutionStatus(executionId: string | null) {
  const [status, setStatus] = useState<{
    state: string;
    elapsed: number | null;
    completedSteps: Set<string>;
  }>({
    state: 'initialized',
    elapsed: null,
    completedSteps: new Set(),
  });

  const execution = useWorkflowExecution(executionId);

  // Initialize status from execution
  useEffect(() => {
    if (execution) {
      setStatus({
        state: execution.state,
        elapsed: execution.elapsed,
        completedSteps: new Set(),
      });
    }
  }, [execution]);

  // Listen to execution updates
  const handleUpdate = useCallback(
    (update: WorkflowExecutionUpdate) => {
      if (update.executionId === executionId) {
        setStatus((prev) => ({
          ...prev,
          state: update.state,
          elapsed: update.elapsed ?? prev.elapsed,
        }));
      }
    },
    [executionId],
  );

  // Listen to step completion
  const handleStepCompleted = useCallback(
    (completed: WorkflowStepCompleted) => {
      if (completed.executionId === executionId) {
        setStatus((prev) => ({
          ...prev,
          completedSteps: new Set([...prev.completedSteps, completed.stepId]),
        }));
      }
    },
    [executionId],
  );

  useWorkflowExecutionUpdates(handleUpdate);
  useWorkflowStepCompletedEvents(handleStepCompleted);

  return status;
}
