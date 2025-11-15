import { atom } from 'jotai';

import { selectAtom } from 'jotai/utils';
import type { AnyModel } from '../bindings/gen_models';
import { ExtractModel } from './types';
import { newStoreData } from './util';

export const modelStoreDataAtom = atom(newStoreData());

export const cookieJarsAtom = createOrderedModelAtom('cookie_jar', 'name', 'asc');
export const environmentsAtom = createOrderedModelAtom('environment', 'sortPriority', 'asc');
export const foldersAtom = createModelAtom('folder');
export const grpcConnectionsAtom = createOrderedModelAtom('grpc_connection', 'createdAt', 'desc');
export const grpcEventsAtom = createOrderedModelAtom('grpc_event', 'createdAt', 'asc');
export const grpcRequestsAtom = createModelAtom('grpc_request');
export const httpRequestsAtom = createModelAtom('http_request');
export const httpResponsesAtom = createOrderedModelAtom('http_response', 'createdAt', 'desc');
export const keyValuesAtom = createModelAtom('key_value');
export const pluginsAtom = createModelAtom('plugin');
export const settingsAtom = createSingularModelAtom('settings');
export const websocketRequestsAtom = createModelAtom('websocket_request');
export const websocketEventsAtom = createOrderedModelAtom('websocket_event', 'createdAt', 'asc');
export const websocketConnectionsAtom = createOrderedModelAtom(
  'websocket_connection',
  'createdAt',
  'desc',
);
export const workflowsAtom = createOrderedModelAtom('workflow', 'sortPriority', 'asc');
export const workflowStepsAtom = createOrderedModelAtom('workflow_step', 'sortPriority', 'asc');
export const workflowExecutionsAtom = createOrderedModelAtom('workflow_execution', 'createdAt', 'desc');
export const workflowStepExecutionsAtom = createOrderedModelAtom('workflow_step_execution', 'createdAt', 'asc');
export const workspaceMetasAtom = createModelAtom('workspace_meta');
export const workspacesAtom = createOrderedModelAtom('workspace', 'name', 'asc');

// Canvas data atoms
export const canvasNodesAtom = createModelAtom('workflow_node');
export const canvasEdgesAtom = createModelAtom('workflow_edge');
export const canvasViewportsAtom = createModelAtom('workflow_viewport');
export const canvasNodeExecutionsAtom = createOrderedModelAtom('workflow_node_execution', 'createdAt', 'asc');

// UI state atoms
export const selectedNodeIdAtom = atom<string | null>(null);
export const selectedEdgeIdAtom = atom<string | null>(null);
export const isExecutingAtom = atom<boolean>(false);

// Node execution status map
export interface NodeExecutionStatus {
  state: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  elapsed?: number;
  error?: string;
}
export const executionProgressAtom = atom<Map<string, NodeExecutionStatus>>(new Map());

// Undo/Redo state
export interface CanvasAction {
  type: string;
  payload: any;
  timestamp: number;
}
export const undoStackAtom = atom<CanvasAction[]>([]);
export const redoStackAtom = atom<CanvasAction[]>([]);

// Derived atoms
export const selectedNodeAtom = atom((get) => {
  const id = get(selectedNodeIdAtom);
  const nodes = get(canvasNodesAtom);
  return id ? nodes.find((n: any) => n.id === id) ?? null : null;
});

export const selectedEdgeAtom = atom((get) => {
  const id = get(selectedEdgeIdAtom);
  const edges = get(canvasEdgesAtom);
  return id ? edges.find((e: any) => e.id === id) ?? null : null;
});

// Workflow-specific viewport selector
export function workflowViewportAtom(workflowId: string) {
  return atom((get) => {
    const viewports = get(canvasViewportsAtom);
    const viewport = viewports.find((v: any) => v.workflowId === workflowId);
    return viewport ?? { panX: 0, panY: 0, zoom: 1.0 };
  });
}

// Node execution status selector
export const nodeExecutionStatusAtom = atom((get) => {
  const progress = get(executionProgressAtom);
  return progress;
});

export function createModelAtom<M extends AnyModel['model']>(modelType: M) {
  return selectAtom(
    modelStoreDataAtom,
    (data) => Object.values(data[modelType] ?? {}),
    shallowEqual,
  );
}

export function createSingularModelAtom<M extends AnyModel['model']>(modelType: M) {
  return selectAtom(modelStoreDataAtom, (data) => {
    const modelData = Object.values(data[modelType] ?? {});
    const item = modelData[0];
    if (item == null) throw new Error('Failed creating singular model with no data: ' + modelType);
    return item;
  });
}

export function createOrderedModelAtom<M extends AnyModel['model']>(
  modelType: M,
  field: keyof ExtractModel<AnyModel, M>,
  order: 'asc' | 'desc',
) {
  return selectAtom(
    modelStoreDataAtom,
    (data) => {
      const modelData = data[modelType] ?? {};
      return Object.values(modelData).sort(
        (a: ExtractModel<AnyModel, M>, b: ExtractModel<AnyModel, M>) => {
          const n = a[field] > b[field] ? 1 : -1;
          return order === 'desc' ? n * -1 : n;
        },
      );
    },
    shallowEqual,
  );
}

function shallowEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
