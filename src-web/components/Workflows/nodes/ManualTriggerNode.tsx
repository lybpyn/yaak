import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function ManualTriggerNode({ data, selected }: NodeProps) {
  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="⚡"
      color="#10b981"
      title={data.node.name}
      subtitle="Start workflow manually"
      inputHandles={[]}
      outputHandles={[{ id: 'output' }]}
      executionStatus={data.executionStatus}
    />
  );
}
