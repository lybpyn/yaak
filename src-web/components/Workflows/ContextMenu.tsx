import { useEffect, useRef } from 'react';
import type { MenuItem } from './types';
import { cn } from '../../lib/cn';

export interface ContextMenuProps {
  items: MenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * Reusable context menu component with keyboard support
 *
 * @param items - Array of menu items to display
 * @param position - Absolute position {x, y} to render the menu
 * @param onClose - Function to call when menu should close
 */
export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add slight delay to avoid immediate close on right-click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle item click
  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white border border-border rounded-lg shadow-context-menu py-1 min-w-[200px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={cn(
            'w-full px-3 py-2 flex items-center gap-3 text-left text-sm',
            'transition-colors',
            item.disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-surface-highlight cursor-pointer',
            item.danger && !item.disabled && 'text-danger hover:bg-danger/10'
          )}
        >
          {/* Icon */}
          {item.icon && <span className="text-base w-5 text-center">{item.icon}</span>}

          {/* Label */}
          <span className="flex-1">{item.label}</span>

          {/* Keyboard Shortcut */}
          {item.shortcut && (
            <span className="text-xs text-text-subtle font-mono">{item.shortcut}</span>
          )}
        </button>
      ))}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="px-3 py-2 text-sm text-text-subtle italic">No actions available</div>
      )}
    </div>
  );
}
