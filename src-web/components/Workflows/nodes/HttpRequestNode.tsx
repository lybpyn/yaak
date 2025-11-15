import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function HttpRequestNode({ data, selected }: NodeProps) {
  const method = data.node.config?.method || 'GET';
  const url = data.node.config?.url;
  const urlPreview = url ? (url.length > 30 ? url.substring(0, 30) + '...' : url) : '';

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="🌐"
      color="#8b5cf6"
      title={data.node.name}
      subtitle="Send HTTP API request"
      executionStatus={data.executionStatus}
    >
      {method && (
        <div className="text-xs">
          <span className="font-mono bg-surface-highlight px-2 py-1 rounded">
            {method}
          </span>
        </div>
      )}
      {urlPreview && (
        <div className="text-xs text-text-subtle font-mono truncate max-w-full">
          {urlPreview}
        </div>
      )}
    </BaseNode>
  );
}
