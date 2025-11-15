import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function ParallelNode({ data, selected }: NodeProps) {
  const branchCount = data.node.config?.branch_count || 2;
  const failFast = data.node.config?.fail_fast ?? true;

  const outputHandles = Array.from({ length: branchCount }, (_, i) => ({
    id: `parallel-${i}`,
    label: `Branch ${i + 1}`,
  }));

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="⚡"
      color="#06b6d4"
      title={data.node.name}
      subtitle="Execute branches concurrently"
      outputHandles={outputHandles}
      executionStatus={data.executionStatus}
    >
      <div className="text-xs text-text-subtle">
        {branchCount} parallel branches
      </div>
      {failFast && (
        <div className="text-xs text-text-subtle">
          (Fail-fast mode)
        </div>
      )}
    </BaseNode>
  );
}
