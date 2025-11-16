import { cn } from '../../../lib/cn';

export interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Checkbox input field with label
 *
 * @param label - Field label text (clickable)
 * @param checked - Whether checkbox is checked
 * @param onChange - Change handler
 * @param hint - Helper text below checkbox
 * @param disabled - Whether input is disabled
 * @param className - Additional CSS classes
 */
export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
  disabled,
  className,
}: CheckboxFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Checkbox + Label */}
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className={cn(
              'w-4 h-4 rounded border cursor-pointer',
              'text-primary bg-white',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'border-border checked:border-primary checked:bg-primary'
            )}
          />
          {checked && (
            <svg
              className="absolute w-4 h-4 text-white pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span className="text-sm font-medium text-text select-none">{label}</span>
      </label>

      {/* Hint */}
      {hint && <p className="text-xs text-text-subtle ml-6">{hint}</p>}
    </div>
  );
}
