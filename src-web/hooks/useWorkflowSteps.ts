import type { WorkflowStep } from '@yaakapp-internal/models';
import { workflowStepsAtom } from '@yaakapp-internal/models';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

export function useWorkflowSteps(workflowId: string | null): WorkflowStep[] {
  const steps = useAtomValue(workflowStepsAtom);
  return useMemo(() => {
    if (!workflowId) return [];
    return steps.filter((s) => s.workflowId === workflowId);
  }, [steps, workflowId]);
}

export function useWorkflowStep(stepId: string | null): WorkflowStep | null {
  const steps = useAtomValue(workflowStepsAtom);
  return useMemo(() => {
    if (!stepId) return null;
    return steps.find((s) => s.id === stepId) ?? null;
  }, [steps, stepId]);
}
