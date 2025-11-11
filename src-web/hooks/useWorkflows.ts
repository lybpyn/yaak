import type { Workflow } from '@yaakapp-internal/models';
import { workflowsAtom } from '@yaakapp-internal/models';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

export function useWorkflows(workspaceId: string | null): Workflow[] {
  const workflows = useAtomValue(workflowsAtom);
  return useMemo(() => {
    if (!workspaceId) return [];
    return workflows.filter((w) => w.workspaceId === workspaceId);
  }, [workflows, workspaceId]);
}

export function useWorkflow(workflowId: string | null): Workflow | null {
  const workflows = useAtomValue(workflowsAtom);
  return useMemo(() => {
    if (!workflowId) return null;
    return workflows.find((w) => w.id === workflowId) ?? null;
  }, [workflows, workflowId]);
}
