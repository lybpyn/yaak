import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function ConditionalNode({ data, selected }: NodeProps) {
  const condition = data.node.config?.condition || '';
  const conditionPreview = condition.length > 40 ? condition.substring(0, 40) + '...' : condition;

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="❓"
      color="#f59e0b"
      title={data.node.name}
      subtitle="Branch based on condition"
      outputHandles={[
        { id: 'true', label: 'True' },
        { id: 'false', label: 'False' },
      ]}
      executionStatus={data.executionStatus}
    >
      {conditionPreview && (
        <div className="text-xs text-text-subtle font-mono truncate max-w-full">
          {conditionPreview}
        </div>
      )}
    </BaseNode>
  );
}
