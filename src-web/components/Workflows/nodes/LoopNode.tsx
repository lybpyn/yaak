import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function LoopNode({ data, selected }: NodeProps) {
  const loopType = data.node.config?.loop_type;
  const count = data.node.config?.count;
  const arrayVariable = data.node.config?.array_variable;

  let loopPreview = 'Not configured';
  if (loopType === 'count' && count) {
    loopPreview = `${count} iterations`;
  } else if (loopType === 'array' && arrayVariable) {
    loopPreview = arrayVariable.length > 30 ? arrayVariable.substring(0, 30) + '...' : arrayVariable;
  }

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="🔁"
      color="#ef4444"
      title={data.node.name}
      subtitle="Iterate over items"
      executionStatus={data.executionStatus}
    >
      <div className="text-xs text-text-subtle font-mono truncate max-w-full">
        {loopPreview}
      </div>
    </BaseNode>
  );
}
