import type { Workflow } from '@yaakapp-internal/models';
import { useWorkspace } from '../../hooks/useWorkspaces';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

interface HeaderProps {
  workflow: Workflow;
  onSave?: () => Promise<void>;
  onExecute?: () => Promise<void>;
  onExport?: () => Promise<void>;
  onNew?: () => Promise<void>;
}

export function Header({
  workflow,
  onSave,
  onExecute,
  onExport,
  onNew,
}: HeaderProps) {
  const workspace = useWorkspace(workflow.workspaceId);

  const breadcrumbItems: BreadcrumbItem[] = [
    ...(workspace
      ? [
          {
            label: workspace.name,
            href: '/workspaces/$workspaceId' as const,
            params: { workspaceId: workflow.workspaceId },
          },
        ]
      : []),
    {
      label: 'Workflows',
      href: '/workspaces/$workspaceId/workflows' as const,
      params: { workspaceId: workflow.workspaceId },
    },
    {
      label: workflow.name,
    },
  ];

  return (
    <div className="h-[60px] bg-[#1e2b3c] text-white px-6 flex items-center justify-between border-b border-border/20">
      {/* Left: Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-3">
        {onNew && (
          <button
            onClick={onNew}
            className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        )}
        {onExecute && (
          <button
            onClick={onExecute}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>Execute</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Icon components (simple SVG implementations)
function Plus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function Download({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function Save({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
      />
    </svg>
  );
}

function Play({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
