import type { Workflow } from '@yaakapp-internal/models';
import { useCallback } from 'react';
import { RequestsPanel } from './RequestsPanel';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowExecutionButton } from './WorkflowExecutionButton';
import { Header } from './Header';
import { patchModel } from '@yaakapp-internal/models';

interface Props {
  workflow: Workflow;
}

export function WorkflowEditor({ workflow }: Props) {
  const handleSave = useCallback(async () => {
    // Save workflow to database (already auto-saved, but this provides user feedback)
    await patchModel(workflow.id, {
      updatedAt: Date.now(),
    });
    console.log('Workflow saved:', workflow.id);
  }, [workflow.id]);

  const handleExecute = useCallback(async () => {
    // TODO: Trigger workflow execution
    console.log('Execute workflow:', workflow.id);
  }, [workflow.id]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Breadcrumbs and Actions */}
      <Header
        workflow={workflow}
        onSave={handleSave}
        onExecute={handleExecute}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - API Requests */}
        <div className="w-80 flex-shrink-0">
          <RequestsPanel workspaceId={workflow.workspaceId} />
        </div>

        {/* Middle - Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <WorkflowCanvas workflow={workflow} />
        </div>
      </div>
    </div>
  );
}
