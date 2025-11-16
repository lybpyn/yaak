import { DragEvent } from 'react';
import { cn } from '../../lib/cn';

interface NodeLibraryCardProps {
  nodeType: string;
  nodeSubtype: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  onClick?: () => void;
}

/**
 * Draggable node card for the node library sidebar
 * Displays node information with hover effects and drag-to-canvas functionality
 */
export function NodeLibraryCard({
  nodeType,
  nodeSubtype,
  name,
  description,
  icon,
  color,
  onClick,
}: NodeLibraryCardProps) {
  const handleDragStart = (event: DragEvent) => {
    event.dataTransfer.setData('application/nodeType', nodeType);
    event.dataTransfer.setData('application/nodeSubtype', nodeSubtype);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        'bg-white border border-border rounded-lg p-3',
        'cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-[3px] hover:border-primary',
        'flex items-center gap-3'
      )}
    >
      {/* Icon */}
      <div
        className="w-6 h-6 flex items-center justify-center flex-shrink-0"
        style={{ color }}
      >
        <span className="text-2xl leading-none">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 flex-1">
        <h4 className="font-semibold text-[0.8rem] truncate text-text">{name}</h4>
        <p className="text-xs text-text-subtle truncate">{description}</p>
      </div>
    </div>
  );
}
