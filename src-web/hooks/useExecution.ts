import { useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { isExecutingAtom, executionProgressAtom, type NodeExecutionStatus } from '@yaakapp-internal/models';
import { invokeCmd } from '../lib/tauri';
import { useListenToTauriEvent } from './useListenToTauriEvent';
import { useFastMutation } from './useFastMutation';

interface ExecuteWorkflowParams {
  workflowId: string;
  environmentId?: string;
}

interface ExecuteWorkflowResponse {
  executionId: string;
}

interface WorkflowExecutionUpdate {
  executionId: string;
  state: 'initialized' | 'running' | 'completed' | 'failed' | 'cancelled';
  elapsed?: number;
  error?: string;
}

interface WorkflowNodeExecutionUpdate {
  executionId: string;
  nodeId: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  elapsed?: number;
  error?: string;
}

/**
 * Execute and cancel workflow canvas
 * Listen to real-time execution events
 */
export function useExecution() {
  const [isExecuting, setIsExecuting] = useAtom(isExecutingAtom);
  const setExecutionProgress = useSetAtom(executionProgressAtom);

  // Execute workflow
  const executeWorkflow = useFastMutation<ExecuteWorkflowResponse, Error, ExecuteWorkflowParams>({
    mutationKey: ['execute_workflow_canvas'],
    mutationFn: async (params) => {
      setIsExecuting(true);
      setExecutionProgress(new Map()); // Reset progress

      return await invokeCmd<ExecuteWorkflowResponse>('cmd_execute_workflow_canvas', {
        workflowId: params.workflowId,
        environmentId: params.environmentId,
      });
    },
  });

  // Cancel workflow execution
  const cancelExecution = useFastMutation<void, Error, string>({
    mutationKey: ['cancel_workflow_execution_canvas'],
    mutationFn: async (executionId) => {
      await invokeCmd('cmd_cancel_workflow_execution_canvas', { executionId });
    },
  });

  // Listen to workflow execution updates
  useListenToTauriEvent<WorkflowExecutionUpdate>('workflow_execution_updated', (event) => {
    const payload = event.payload;
    console.log('Workflow execution update:', payload);

    // Update execution state
    if (payload.state === 'completed' || payload.state === 'failed' || payload.state === 'cancelled') {
      setIsExecuting(false);
    }
  });

  // Listen to node execution updates
  useListenToTauriEvent<WorkflowNodeExecutionUpdate>('workflow_node_execution_updated', (event) => {
    const payload = event.payload;
    console.log('Node execution update:', payload);

    // Update node execution status
    setExecutionProgress((prev) => {
      const newMap = new Map(prev);
      const status: NodeExecutionStatus = {
        state: payload.state,
        elapsed: payload.elapsed,
        error: payload.error,
      };
      newMap.set(payload.nodeId, status);
      return newMap;
    });
  });

  // Clear execution progress when unmounting
  useEffect(() => {
    return () => {
      setExecutionProgress(new Map());
      setIsExecuting(false);
    };
  }, [setExecutionProgress, setIsExecuting]);

  return {
    executeWorkflow: executeWorkflow.mutateAsync,
    cancelExecution: cancelExecution.mutateAsync,
    isExecuting,
  };
}
