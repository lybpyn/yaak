import { createFileRoute, useParams } from '@tanstack/react-router';
import { useWorkflow } from '../../../../hooks/useWorkflows';
import { WorkflowEditor } from '../../../../components/Workflows';
import { EmptyStateText } from '../../../../components/EmptyStateText';

export const Route = createFileRoute('/workspaces/$workspaceId/workflows/$workflowId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { workflowId } = useParams({ from: '/workspaces/$workspaceId/workflows/$workflowId' });
  const workflow = useWorkflow(workflowId);

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyStateText>Workflow not found</EmptyStateText>
      </div>
    );
  }

  return <WorkflowEditor workflow={workflow} />;
}
