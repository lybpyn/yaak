import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { executionProgressAtom, type NodeExecutionStatus } from '@yaakapp-internal/models';

/**
 * Get execution status for a specific node
 * Used for visual indicators on nodes during execution
 */
export function useNodeStatus(nodeId: string | null): NodeExecutionStatus['state'] | null {
  const executionProgress = useAtomValue(executionProgressAtom);

  const status = useMemo(() => {
    if (!nodeId) return null;
    const nodeStatus = executionProgress.get(nodeId);
    return nodeStatus?.state ?? null;
  }, [executionProgress, nodeId]);

  return status;
}

/**
 * Get detailed execution status for a node
 */
export function useNodeExecutionDetails(nodeId: string | null): NodeExecutionStatus | null {
  const executionProgress = useAtomValue(executionProgressAtom);

  const details = useMemo(() => {
    if (!nodeId) return null;
    return executionProgress.get(nodeId) ?? null;
  }, [executionProgress, nodeId]);

  return details;
}
