import { useCallback } from 'react';
import { invokeCmd } from '../lib/tauri';
import { useFastMutation } from './useFastMutation';
import { generateId } from '../lib/generateId';

interface CreateNodeParams {
  workflowId: string;
  nodeType: string;
  nodeSubtype: string;
  position: { x: number; y: number };
  name?: string;
}

interface UpdateNodeParams {
  nodeId: string;
  updates: {
    positionX?: number;
    positionY?: number;
    name?: string;
    description?: string;
    config?: any;
    enabled?: boolean;
  };
}

/**
 * Node CRUD operations for workflow canvas
 */
export function useNodeOperations() {
  // Create node
  const createNode = useFastMutation<any, Error, CreateNodeParams>({
    mutationKey: ['create_workflow_node'],
    mutationFn: async (params) => {
      return await invokeCmd('cmd_create_workflow_node', {
        req: {
          workflowId: params.workflowId,
          nodeType: params.nodeType,
          nodeSubtype: params.nodeSubtype,
          positionX: params.position.x,
          positionY: params.position.y,
        },
      });
    },
  });

  // Update node
  const updateNode = useFastMutation<any, Error, UpdateNodeParams>({
    mutationKey: ['update_workflow_node'],
    mutationFn: async (params) => {
      return await invokeCmd('cmd_update_workflow_node', {
        req: {
          id: params.nodeId,
          name: params.updates.name,
          description: params.updates.description,
          positionX: params.updates.positionX,
          positionY: params.updates.positionY,
          config: params.updates.config,
          enabled: params.updates.enabled,
        },
      });
    },
  });

  // Delete node
  const deleteNode = useFastMutation<any, Error, string>({
    mutationKey: ['delete_workflow_node'],
    mutationFn: async (nodeId) => {
      return await invokeCmd('cmd_delete_workflow_node', { nodeId });
    },
  });

  // Duplicate node
  const duplicateNode = useCallback(
    async (nodeId: string, offset: { x: number; y: number } = { x: 50, y: 50 }) => {
      // Load node details, create copy with new ID and offset position
      // This would require fetching the node first
      // Placeholder implementation
      throw new Error('Duplicate node not yet implemented');
    },
    []
  );

  return {
    createNode: createNode.mutateAsync,
    updateNode: updateNode.mutateAsync,
    deleteNode: deleteNode.mutateAsync,
    duplicateNode,
  };
}
