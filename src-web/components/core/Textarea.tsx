import classNames from 'classnames';
import { useRef } from 'react';
import { generateId } from '../../lib/generateId';
import { Label } from './Label';

export interface TextareaProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  help?: string;
}

export function Textarea({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  required,
  rows = 3,
  className,
  help,
}: TextareaProps) {
  const id = useRef(`textarea-${generateId()}`);

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={id.current} required={required} help={help} className="mb-1.5">
          {label}
        </Label>
      )}
      <textarea
        id={id.current}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={classNames(
          className,
          'w-full px-3 py-2 text-sm',
          'border border-border-subtle rounded-md',
          'focus:outline-none focus:border-border-focus',
          'bg-surface placeholder:text-placeholder',
          'resize-y',
        )}
      />
    </div>
  );
}
