import { EdgeProps } from 'reactflow';
import { BaseEdge } from './BaseEdge';

export function SequentialEdge(props: EdgeProps) {
  return (
    <BaseEdge
      {...props}
      color="#64748b"
      strokeWidth={2}
      animated={props.data?.isExecuting}
    />
  );
}
