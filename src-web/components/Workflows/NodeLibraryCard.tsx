import { DragEvent } from 'react';
import classNames from 'classnames';

interface NodeLibraryCardProps {
  nodeType: string;
  nodeSubtype: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  onClick?: () => void;
}

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
    console.log('Drag started:', { nodeType, nodeSubtype });
    event.dataTransfer.setData('application/nodeType', nodeType);
    event.dataTransfer.setData('application/nodeSubtype', nodeSubtype);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={classNames(
        'flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing',
        'hover:bg-surface-highlight transition-colors border border-transparent',
        'hover:border-border-focus'
      )}
      style={{ backgroundColor: `${color}10` }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}30` }}
      >
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <h4 className="font-semibold text-sm truncate">{name}</h4>
        <p className="text-xs text-text-subtle truncate">{description}</p>
      </div>
    </div>
  );
}
