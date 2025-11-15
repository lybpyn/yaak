import { invokeCmd } from '../lib/tauri';
import { useFastMutation } from './useFastMutation';
import { generateId } from '../lib/generateId';

interface CreateEdgeParams {
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceAnchor?: string;
  targetAnchor?: string;
  edgeType?: 'sequential' | 'conditional' | 'parallel' | 'loop';
}

/**
 * Edge CRUD operations for workflow canvas
 */
export function useEdgeOperations() {
  // Create edge
  const createEdge = useFastMutation<any, Error, CreateEdgeParams>({
    mutationKey: ['create_workflow_edge'],
    mutationFn: async (params) => {
      return await invokeCmd('cmd_create_workflow_edge', {
        req: {
          workflowId: params.workflowId,
          sourceNodeId: params.sourceNodeId,
          targetNodeId: params.targetNodeId,
          sourceAnchor: params.sourceAnchor || 'output',
          targetAnchor: params.targetAnchor || 'input',
          edgeType: params.edgeType || 'sequential',
          label: null,
        }
      });
    },
  });

  // Delete edge
  const deleteEdge = useFastMutation<any, Error, string>({
    mutationKey: ['delete_workflow_edge'],
    mutationFn: async (edgeId) => {
      return await invokeCmd('cmd_delete_workflow_edge', { edgeId });
    },
  });

  return {
    createEdge: createEdge.mutateAsync,
    deleteEdge: deleteEdge.mutateAsync,
  };
}
