import { ModelStoreData } from './types';

export function newStoreData(): ModelStoreData {
  return {
    cookie_jar: {},
    environment: {},
    folder: {},
    graphql_introspection: {},
    grpc_connection: {},
    grpc_event: {},
    grpc_request: {},
    http_request: {},
    http_response: {},
    key_value: {},
    plugin: {},
    settings: {},
    sync_state: {},
    websocket_connection: {},
    websocket_event: {},
    websocket_request: {},
    workflow: {},
    workflow_execution: {},
    workflow_step: {},
    workflow_step_execution: {},
    workflow_node: {},
    workflow_edge: {},
    workflow_viewport: {},
    workflow_node_execution: {},
    workspace: {},
    workspace_meta: {},
  };
}
