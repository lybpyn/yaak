import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useWorkflows } from '../../../../hooks/useWorkflows';
import { Button } from '../../../../components/core/Button';
import { Dialog } from '../../../../components/core/Dialog';
import { CreateWorkflowDialog, WorkflowsList } from '../../../../components/Workflows';

export const Route = createFileRoute('/workspaces/$workspaceId/workflows/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId } = useParams({ from: '/workspaces/$workspaceId/workflows/' });
  const navigate = useNavigate();
  const workflows = useWorkflows(workspaceId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleSelectWorkflow = (id: string) => {
    navigate({
      to: '/workspaces/$workspaceId/workflows/$workflowId',
      params: { workspaceId, workflowId: id },
    });
  };

  const handleCreateWorkflow = (id: string) => {
    setShowCreateDialog(false);
    handleSelectWorkflow(id);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate({ to: '/workspaces/$workspaceId', params: { workspaceId } })}
              variant="text"
              size="sm"
            >
              ← Back to Workspace
            </Button>
            <h2 className="text-xl font-semibold">Workflows</h2>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>Create Workflow</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <WorkflowsList
          workflows={workflows}
          activeWorkflowId={null}
          onSelect={handleSelectWorkflow}
          onCreate={() => setShowCreateDialog(true)}
        />
      </div>

      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="Create Workflow"
        size="md"
      >
        <CreateWorkflowDialog
          workspaceId={workspaceId}
          onCreate={handleCreateWorkflow}
          hide={() => setShowCreateDialog(false)}
        />
      </Dialog>
    </div>
  );
}
