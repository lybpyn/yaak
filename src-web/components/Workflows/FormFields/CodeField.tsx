import { cn } from '../../../lib/cn';

export interface CodeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  language?: 'json' | 'javascript' | 'text';
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  height?: string;
  className?: string;
}

/**
 * Code editor field using textarea with syntax support
 * Future: Replace with Monaco/CodeMirror for full syntax highlighting
 *
 * @param label - Field label text
 * @param value - Current code value
 * @param onChange - Change handler
 * @param language - Code language (for future syntax highlighting)
 * @param hint - Helper text below input
 * @param required - Whether field is required (shows asterisk)
 * @param icon - Optional icon to display with label
 * @param disabled - Whether input is disabled
 * @param error - Error message to display
 * @param height - CSS height value (default: 200px)
 * @param className - Additional CSS classes
 */
export function CodeField({
  label,
  value,
  onChange,
  language = 'text',
  hint,
  required,
  icon,
  disabled,
  error,
  height = '200px',
  className,
}: CodeFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      <label className="flex items-center gap-2 text-sm font-medium text-text">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-danger">*</span>}
        {language && (
          <span className="text-xs text-text-subtle ml-auto">{language}</span>
        )}
      </label>

      {/* Code Editor (Textarea for now) */}
      <div className="border border-border rounded-lg overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          className={cn(
            'w-full px-3 py-2 bg-white',
            'text-sm text-text font-mono',
            'transition-colors resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface',
            error && 'border-danger focus:ring-danger/20'
          )}
          style={{ height }}
        />
      </div>

      {/* Hint or Error */}
      {(hint || error) && (
        <p className={cn('text-xs', error ? 'text-danger' : 'text-text-subtle')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
