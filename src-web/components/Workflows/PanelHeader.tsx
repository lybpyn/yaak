import { getNodeIcon, getNodeLabel } from '../../lib/workflow-icons';
import type { WorkflowNode } from '@yaakapp-internal/models';

export interface PanelHeaderProps {
  node: WorkflowNode;
}

/**
 * Header component for the Properties Panel
 * Displays node icon, formatted name, and subtitle
 *
 * @param node - The workflow node to display header for
 */
export function PanelHeader({ node }: PanelHeaderProps) {
  const icon = getNodeIcon(node.nodeSubtype);
  const formattedName = getNodeLabel(node.nodeSubtype);

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-sm text-text">{formattedName}</h3>
          <p className="text-xs text-text-subtle">Configure parameters</p>
        </div>
      </div>
    </div>
  );
}
