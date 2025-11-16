import { cn } from '../../../lib/cn';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Text input field with label, icon, and hint support
 *
 * @param label - Field label text
 * @param value - Current input value
 * @param onChange - Change handler
 * @param placeholder - Placeholder text
 * @param hint - Helper text below input
 * @param required - Whether field is required (shows asterisk)
 * @param icon - Optional icon to display with label
 * @param disabled - Whether input is disabled
 * @param error - Error message to display
 * @param className - Additional CSS classes
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  icon,
  disabled,
  error,
  className,
}: TextFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      <label className="flex items-center gap-2 text-sm font-medium text-text">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-danger">*</span>}
      </label>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 bg-white border rounded-lg',
          'text-sm text-text',
          'transition-colors',
          'placeholder:text-text-subtle',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-border'
        )}
      />

      {/* Hint or Error */}
      {(hint || error) && (
        <p className={cn('text-xs', error ? 'text-danger' : 'text-text-subtle')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
