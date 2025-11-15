import { EdgeProps } from 'reactflow';
import { BaseEdge } from './BaseEdge';

export function ConditionalEdge(props: EdgeProps) {
  const isTrue = props.sourceHandle === 'true';
  const color = isTrue ? '#10b981' : '#ef4444';
  const label = isTrue ? 'True' : 'False';

  return (
    <BaseEdge
      {...props}
      color={color}
      strokeWidth={2}
      label={label}
      animated={props.data?.isExecuting}
    />
  );
}
