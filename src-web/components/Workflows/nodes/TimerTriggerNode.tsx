import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';

export function TimerTriggerNode({ data, selected }: NodeProps) {
  const scheduleType = data.node.config?.schedule_type;
  const cronExpression = data.node.config?.cron_expression;
  const intervalMinutes = data.node.config?.interval_minutes;

  let schedulePreview = 'Not configured';
  if (scheduleType === 'cron' && cronExpression) {
    schedulePreview = cronExpression;
  } else if (scheduleType === 'interval' && intervalMinutes) {
    schedulePreview = `Every ${intervalMinutes} min`;
  }

  return (
    <BaseNode
      data={data}
      selected={selected}
      icon="⏰"
      color="#3b82f6"
      title={data.node.name}
      subtitle="Execute on schedule"
      inputHandles={[]}
      outputHandles={[{ id: 'output' }]}
      executionStatus={data.executionStatus}
    >
      <div className="text-xs text-text-subtle font-mono">
        {schedulePreview}
      </div>
    </BaseNode>
  );
}
