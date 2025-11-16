import { cn } from '../../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Dropdown select input field
 *
 * @param label - Field label text
 * @param value - Current selected value
 * @param onChange - Change handler
 * @param options - Array of {value, label} options
 * @param hint - Helper text below input
 * @param required - Whether field is required (shows asterisk)
 * @param icon - Optional icon to display with label
 * @param disabled - Whether input is disabled
 * @param error - Error message to display
 * @param className - Additional CSS classes
 * @param placeholder - Placeholder option text
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  required,
  icon,
  disabled,
  error,
  className,
  placeholder,
}: SelectFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      <label className="flex items-center gap-2 text-sm font-medium text-text">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-danger">*</span>}
      </label>

      {/* Select */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 bg-white border rounded-lg',
          'text-sm text-text',
          'transition-colors cursor-pointer',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-border'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Hint or Error */}
      {(hint || error) && (
        <p className={cn('text-xs', error ? 'text-danger' : 'text-text-subtle')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
