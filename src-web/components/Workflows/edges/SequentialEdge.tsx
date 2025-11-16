import { EdgeProps, getBezierPath, EdgeLabelRenderer, MarkerType } from 'reactflow';
import { cn } from '../../../lib/cn';

interface SequentialEdgeData {
  isExecuting?: boolean;
  hasError?: boolean;
  executionTimeMs?: number;
}

export function SequentialEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  data,
}: EdgeProps<SequentialEdgeData>) {
  const { isExecuting = false, hasError = false, executionTimeMs } = data || {};

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine stroke color and style based on state
  const strokeColor = hasError ? '#f75a5a' : selected ? '#2c77df' : '#94a3b8';
  const strokeWidth = selected ? 3 : 2;
  const strokeDasharray = hasError ? '5,5' : undefined;

  // Format execution time for label
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className={cn('react-flow__edge-path transition-colors', {
          'animate-dash': isExecuting,
        })}
        d={edgePath}
        strokeWidth={strokeWidth}
        stroke={strokeColor}
        strokeDasharray={strokeDasharray}
        markerEnd={`url(#${id}-marker)`}
        fill="none"
      />

      {/* End marker definition - small circle */}
      <defs>
        <marker
          id={`${id}-marker`}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <circle cx="5" cy="5" r="4" fill={strokeColor} />
        </marker>
      </defs>

      {/* Execution time label */}
      {executionTimeMs !== undefined && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-1 text-xs bg-white border border-border rounded shadow-sm font-mono"
          >
            {formatExecutionTime(executionTimeMs)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
