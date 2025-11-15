import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function DatabaseNode({ data, selected }: NodeProps) {
  const query = data.node.config?.query || '';
  const queryType = query.trim().split(/\s+/)[0]?.toUpperCase() || 'SQL';

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="🗄️"
      color="#06b6d4"
      title={data.node.name}
      subtitle="Execute database query"
      executionStatus={data.executionStatus}
    >
      {queryType && (
        <div className="text-xs">
          <span className="font-mono bg-surface-highlight px-2 py-1 rounded">
            {queryType}
          </span>
        </div>
      )}
    </BaseNode>
  );
}
