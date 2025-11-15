import { EdgeProps } from 'reactflow';
import { BaseEdge } from './BaseEdge';

export function LoopEdge(props: EdgeProps) {
  return (
    <BaseEdge
      {...props}
      color="#ef4444"
      strokeWidth={2}
      animated={props.data?.isExecuting}
    />
  );
}
