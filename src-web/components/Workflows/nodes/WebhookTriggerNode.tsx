import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function WebhookTriggerNode({ data, selected }: NodeProps) {
  const url = data.node.config?.url;
  const urlPreview = url ? new URL(url).pathname : 'Not configured';

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="🌐"
      color="#10b981"
      title={data.node.name}
      subtitle="Trigger on HTTP webhook"
      inputHandles={[]}
      outputHandles={[{ id: 'output' }]}
      executionStatus={data.executionStatus}
    >
      {url && (
        <div className="text-xs text-text-subtle font-mono truncate max-w-full">
          {urlPreview}
        </div>
      )}
    </BaseNode>
  );
}
