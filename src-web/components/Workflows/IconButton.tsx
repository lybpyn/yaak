import { cn } from '../../lib/cn';

interface IconButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  className?: string;
}

/**
 * Reusable icon button component with tooltip support
 *
 * @param onClick - Click handler function
 * @param disabled - Whether the button is disabled
 * @param tooltip - Tooltip text to show on hover
 * @param children - Icon or content to display
 * @param aria-label - Accessibility label
 * @param className - Additional CSS classes
 */
export function IconButton({
  onClick,
  disabled,
  tooltip,
  children,
  'aria-label': ariaLabel,
  className,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={ariaLabel}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded',
        'text-sm transition-colors',
        'hover:bg-surface-highlight',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}
