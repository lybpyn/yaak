import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import classNames from 'classnames';

interface BaseEdgeProps extends EdgeProps {
  color?: string;
  strokeWidth?: number;
  label?: string;
  animated?: boolean;
  dashed?: boolean;
}

export function BaseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  color = '#64748b',
  strokeWidth = 2,
  label,
  animated = false,
  dashed = false,
}: BaseEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className={classNames('react-flow__edge-path', {
          'animate-dash': animated,
        })}
        d={edgePath}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        stroke={color}
        strokeDasharray={dashed ? '5,5' : undefined}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-1 text-xs bg-surface border border-border rounded shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
