import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function GrpcRequestNode({ data, selected }: NodeProps) {
  const service = data.node.config?.service;
  const method = data.node.config?.method;
  const serviceMethod = service && method ? `${service}/${method}` : 'Not configured';

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="⚡"
      color="#8b5cf6"
      title={data.node.name}
      subtitle="Send gRPC request"
      executionStatus={data.executionStatus}
    >
      <div className="text-xs text-text-subtle font-mono truncate max-w-full">
        {serviceMethod}
      </div>
    </BaseNode>
  );
}
