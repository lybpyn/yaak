import { NodeTypes } from 'reactflow';
import { ManualTriggerNode } from './ManualTriggerNode';
import { WebhookTriggerNode } from './WebhookTriggerNode';
import { TimerTriggerNode } from './TimerTriggerNode';
import { HttpRequestNode } from './HttpRequestNode';
import { GrpcRequestNode } from './GrpcRequestNode';
import { EmailNode } from './EmailNode';
import { DatabaseNode } from './DatabaseNode';
import { WebSocketNode } from './WebSocketNode';
import { ConditionalNode } from './ConditionalNode';
import { LoopNode } from './LoopNode';
import { ParallelNode } from './ParallelNode';

export const nodeTypes: NodeTypes = {
  manual_trigger: ManualTriggerNode,
  webhook_trigger: WebhookTriggerNode,
  timer_trigger: TimerTriggerNode,
  http_request: HttpRequestNode,
  grpc_request: GrpcRequestNode,
  email: EmailNode,
  database: DatabaseNode,
  websocket: WebSocketNode,
  conditional: ConditionalNode,
  loop: LoopNode,
  parallel: ParallelNode,
};

export {
  ManualTriggerNode,
  WebhookTriggerNode,
  TimerTriggerNode,
  HttpRequestNode,
  GrpcRequestNode,
  EmailNode,
  DatabaseNode,
  WebSocketNode,
  ConditionalNode,
  LoopNode,
  ParallelNode,
};
