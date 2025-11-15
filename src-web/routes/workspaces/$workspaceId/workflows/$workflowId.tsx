import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useWorkflow } from '../../../../hooks/useWorkflows';
import { WorkflowEditor } from '../../../../components/Workflows';
import { EmptyStateText } from '../../../../components/EmptyStateText';
import { IconButton } from '../../../../components/core/IconButton';
import { workspacesAtom } from '@yaakapp-internal/models';
import { useAtomValue } from 'jotai';

export const Route = createFileRoute('/workspaces/$workspaceId/workflows/$workflowId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId, workflowId } = useParams({ from: '/workspaces/$workspaceId/workflows/$workflowId' });
  const navigate = useNavigate();
  const workflow = useWorkflow(workflowId);
  const workspaces = useAtomValue(workspacesAtom);
  const workspace = workspaces.find(w => w.id === workspaceId);

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyStateText>Workflow not found</EmptyStateText>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Navigation Bar */}
      <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-surface">
        {/* Left: Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <IconButton
            icon="folder"
            size="sm"
            variant="text"
            title="Workspace"
            onClick={() => navigate({ to: '/workspaces/$workspaceId', params: { workspaceId } })}
          />
          <IconButton
            icon="refresh"
            size="sm"
            variant="text"
            title="Refresh"
          />
          <IconButton
            icon="clock"
            size="sm"
            variant="text"
            title="History"
          />

          <span className="text-text-subtle mx-1">|</span>

          <button
            onClick={() => navigate({ to: '/workspaces/$workspaceId/workflows', params: { workspaceId } })}
            className="text-text hover:text-text-subtle transition-colors"
          >
            {workspace?.name || 'Workspace'}
          </button>
          <span className="text-text-subtle">›</span>
          <button
            onClick={() => navigate({ to: '/workspaces/$workspaceId/workflows', params: { workspaceId } })}
            className="text-text hover:text-text-subtle transition-colors"
          >
            Workflows
          </button>
          <span className="text-text-subtle">›</span>
          <span className="text-text font-medium">{workflow.name}</span>
        </div>

        {/* Right: Action Icons */}
        <div className="flex items-center gap-1">
          <IconButton
            icon="layout_sidebar"
            size="sm"
            variant="text"
            title="Toggle sidebar"
          />
          <IconButton
            icon="search"
            size="sm"
            variant="text"
            title="Search"
          />
          <IconButton
            icon="settings"
            size="sm"
            variant="text"
            title="Settings"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <WorkflowEditor workflow={workflow} />
      </div>
    </div>
  );
}
