import classNames from 'classnames';
import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function Badge({ children, color, size = 'md', className }: BadgeProps) {
  return (
    <span
      className={classNames(
        className,
        'inline-flex items-center rounded px-2 py-0.5 font-medium',
        size === 'xs' && 'text-2xs',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        color === 'primary' && 'bg-primary-subtle text-primary',
        color === 'secondary' && 'bg-surface-highlight text-text',
        color === 'success' && 'bg-success-subtle text-success',
        color === 'danger' && 'bg-danger-subtle text-danger',
        color === 'warning' && 'bg-warning-subtle text-warning',
        color === 'info' && 'bg-info-subtle text-info',
        !color && 'bg-surface-highlight text-text-subtle',
      )}
    >
      {children}
    </span>
  );
}
