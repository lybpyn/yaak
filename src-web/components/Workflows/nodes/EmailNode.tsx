import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function EmailNode({ data, selected }: NodeProps) {
  const to = data.node.config?.to || [];
  const cc = data.node.config?.cc || [];
  const bcc = data.node.config?.bcc || [];
  const recipientCount = (Array.isArray(to) ? to.length : 0) +
                         (Array.isArray(cc) ? cc.length : 0) +
                         (Array.isArray(bcc) ? bcc.length : 0);

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="✉️"
      color="#f97316"
      title={data.node.name}
      subtitle="Send email"
      executionStatus={data.executionStatus}
    >
      {recipientCount > 0 && (
        <div className="text-xs text-text-subtle">
          {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
        </div>
      )}
    </BaseNode>
  );
}
