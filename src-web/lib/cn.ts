import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with proper specificity
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged class string
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
