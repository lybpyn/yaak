import { cn } from '../../lib/cn';

interface DividerProps {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Divider component for visual separation
 *
 * @param className - Additional CSS classes
 * @param orientation - Divider orientation (default: vertical)
 */
export function Divider({ className, orientation = 'vertical' }: DividerProps) {
  return (
    <div
      className={cn(
        'bg-border',
        orientation === 'vertical' ? 'w-px h-6 mx-2' : 'h-px w-full my-2',
        className
      )}
    />
  );
}
