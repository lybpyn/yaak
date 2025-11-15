import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function WebSocketNode({ data, selected }: NodeProps) {
  const url = data.node.config?.url;
  const urlPreview = url ? (url.length > 30 ? url.substring(0, 30) + '...' : url) : 'Not configured';

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="🔌"
      color="#06b6d4"
      title={data.node.name}
      subtitle="WebSocket connection"
      executionStatus={data.executionStatus}
    >
      <div className="text-xs text-text-subtle font-mono truncate max-w-full">
        {urlPreview}
      </div>
    </BaseNode>
  );
}
