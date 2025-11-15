import type { Workflow } from '@yaakapp-internal/models';
import { RequestsPanel } from './RequestsPanel';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowExecutionButton } from './WorkflowExecutionButton';

interface Props {
  workflow: Workflow;
}

export function WorkflowEditor({ workflow }: Props) {
  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel - API Requests */}
      <div className="w-80 flex-shrink-0">
        <RequestsPanel workspaceId={workflow.workspaceId} />
      </div>

      {/* Middle - Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Action Bar */}
        <div className="border-b border-border px-6 py-3 flex items-center justify-end bg-surface">
          <WorkflowExecutionButton workflow={workflow} />
        </div>

        {/* Canvas */}
        <WorkflowCanvas workflow={workflow} />
      </div>
    </div>
  );
}
