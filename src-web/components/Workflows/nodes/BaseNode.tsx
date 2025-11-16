import { ReactNode, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNode } from '@yaakapp-internal/models';
import { cn } from '../../../lib/cn';
import { getNodeIcon, getNodeColor } from '../../../lib/workflow-icons';
import { Loader, AlertCircle } from 'lucide-react';

interface BaseNodeData {
  node: WorkflowNode;
  isSelected?: boolean;
  isExecuting?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

interface BaseNodeProps {
  data: BaseNodeData;
  selected?: boolean;
}

/**
 * Enhanced base node component with n8n-style design
 * Size: 100x100px square with rounded corners
 * States: normal, selected, disabled, error, executing
 */
export function BaseNode({ data, selected = false }: BaseNodeProps) {
  const { node, isExecuting = false, hasError = false, errorMessage } = data;
  const [showTooltip, setShowTooltip] = useState(false);

  const nodeIcon = getNodeIcon(node.nodeSubtype);
  const nodeColor = getNodeColor(node.nodeType);

  return (
    <div
      className={cn(
        // Base styles - 100x100px square
        'w-[100px] h-[100px] rounded-xl bg-white',
        // Shadow
        'shadow-node',
        // Border based on state
        'border-2 transition-all duration-200',
        // Normal state
        !selected && !hasError && !node.disabled && 'border-transparent',
        // Selected state
        selected && !hasError && 'border-primary shadow-lg',
        // Error state with pulse animation
        hasError && 'border-danger animate-pulse-error',
        // Disabled state
        node.disabled && 'opacity-60 grayscale',
        // Hover effect (lift)
        !node.disabled && 'hover:-translate-y-1 hover:shadow-node-hover cursor-pointer'
      )}
      onMouseEnter={() => hasError && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Header - 30px colored section */}
      <div
        className="h-[30px] px-2 flex items-center gap-1 rounded-t-xl"
        style={{ backgroundColor: `${nodeColor}20` }}
      >
        <span className="text-sm">{nodeIcon}</span>
        <span className="text-xs font-semibold truncate flex-1">{node.name}</span>
      </div>

      {/* Body - centered content */}
      <div className="h-[70px] flex items-center justify-center relative">
        {isExecuting ? (
          <Loader className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <span className="text-2xl">{nodeIcon}</span>
        )}

        {/* Error icon */}
        {hasError && (
          <AlertCircle className="absolute top-1 right-1 w-4 h-4 text-danger" />
        )}

        {/* Disabled badge */}
        {node.disabled && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-secondary text-white text-[9px] font-medium rounded rotate-12">
            Disabled
          </div>
        )}
      </div>

      {/* Input Port (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-white !border-2 !border-primary"
      />

      {/* Output Port (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-white !border-2 !border-primary"
      />

      {/* Error Tooltip */}
      {showTooltip && hasError && errorMessage && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-danger/90 text-white rounded-lg text-xs max-w-[200px] z-50 shadow-lg">
          {errorMessage}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-danger/90 rotate-45" />
        </div>
      )}
    </div>
  );
}
