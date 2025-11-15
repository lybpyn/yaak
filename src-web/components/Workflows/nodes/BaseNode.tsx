import { ReactNode } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import classNames from 'classnames';
import { WorkflowNode } from '@yaakapp-internal/models';

interface BaseNodeProps {
  data: NodeProps['data'];
  selected: boolean;
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
  inputHandles?: string[];
  outputHandles?: { id: string; label?: string }[];
  executionStatus?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

export function BaseNode({
  data,
  selected,
  icon,
  color,
  title,
  subtitle,
  children,
  inputHandles = ['input'],
  outputHandles = [{ id: 'output' }],
  executionStatus,
}: BaseNodeProps) {
  const node = data.node as WorkflowNode;
  const isConfigured = data.isConfigured ?? true;

  return (
    <div
      className={classNames(
        'relative bg-surface border-2 rounded-2xl p-6 min-w-[250px] shadow-sm transition-all',
        'hover:shadow-md',
        {
          'border-purple-500': selected,
          'border-border-focus': !selected && node.enabled && !executionStatus,
          'border-border opacity-60': !node.enabled,
          'border-green-500': executionStatus === 'completed',
          'border-red-500': executionStatus === 'failed',
          'border-yellow-500 animate-pulse': executionStatus === 'running',
          'border-gray-500': executionStatus === 'pending',
          'border-amber-500': executionStatus === 'skipped',
        }
      )}
      style={{ width: `${node.width}px` }}
    >
      {/* Status Badge */}
      <div className="absolute -top-2 -right-2">
        {!node.enabled ? (
          <span className="px-2 py-1 text-xs bg-orange-500 text-white rounded-full">
            Disabled
          </span>
        ) : isConfigured ? (
          <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
            Configured
          </span>
        ) : (
          <span className="px-2 py-1 text-xs bg-gray-500 text-white rounded-full">
            Unconfigured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <span className="text-2xl">{icon}</span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-text-subtle">{subtitle}</p>
        </div>

        {/* Custom Content */}
        {children}
      </div>

      {/* Input Handles */}
      {inputHandles.map((handleId) => (
        <Handle
          key={handleId}
          type="target"
          position={Position.Left}
          id={handleId}
          className="w-4 h-4 bg-border-focus border-2 border-surface"
        />
      ))}

      {/* Output Handles */}
      {outputHandles.length === 1 ? (
        <Handle
          type="source"
          position={Position.Right}
          id={outputHandles[0].id}
          className="w-4 h-4 bg-border-focus border-2 border-surface"
        />
      ) : (
        outputHandles.map((handle, index) => (
          <Handle
            key={handle.id}
            type="source"
            position={Position.Right}
            id={handle.id}
            className="w-4 h-4 bg-border-focus border-2 border-surface"
            style={{
              top: `${((index + 1) / (outputHandles.length + 1)) * 100}%`,
            }}
          >
            {handle.label && (
              <div className="absolute left-full ml-2 text-xs whitespace-nowrap">
                {handle.label}
              </div>
            )}
          </Handle>
        ))
      )}

      {/* Execution Status Overlay */}
      {executionStatus === 'completed' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xl">✓</span>
          </div>
        </div>
      )}
      {executionStatus === 'failed' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-xl">✗</span>
          </div>
        </div>
      )}
      {executionStatus === 'running' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center animate-spin">
            <span className="text-white text-xl">⟳</span>
          </div>
        </div>
      )}
    </div>
  );
}
