import { EdgeTypes } from 'reactflow';
import { SequentialEdge } from './SequentialEdge';
import { ConditionalEdge } from './ConditionalEdge';
import { ParallelEdge } from './ParallelEdge';
import { LoopEdge } from './LoopEdge';

export const edgeTypes: EdgeTypes = {
  sequential: SequentialEdge,
  conditional: ConditionalEdge,
  parallel: ParallelEdge,
  loop: LoopEdge,
};

export {
  SequentialEdge,
  ConditionalEdge,
  ParallelEdge,
  LoopEdge,
};
