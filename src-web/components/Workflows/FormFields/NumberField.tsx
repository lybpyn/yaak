import { cn } from '../../../lib/cn';

export interface NumberFieldProps {
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Number input field with min/max validation
 *
 * @param label - Field label text
 * @param value - Current number value
 * @param onChange - Change handler
 * @param placeholder - Placeholder text
 * @param hint - Helper text below input
 * @param required - Whether field is required (shows asterisk)
 * @param icon - Optional icon to display with label
 * @param disabled - Whether input is disabled
 * @param error - Error message to display
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param step - Step increment value
 * @param className - Additional CSS classes
 */
export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  icon,
  disabled,
  error,
  min,
  max,
  step = 1,
  className,
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

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
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
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
