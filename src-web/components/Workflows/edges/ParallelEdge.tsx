import { EdgeProps } from 'reactflow';
import { BaseEdge } from './BaseEdge';

export function ParallelEdge(props: EdgeProps) {
  return (
    <BaseEdge
      {...props}
      color="#06b6d4"
      strokeWidth={2}
      dashed={true}
      animated={props.data?.isExecuting}
    />
  );
}
