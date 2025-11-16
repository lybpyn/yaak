/**
 * Shared TypeScript interfaces for Workflow UI components
 */

/**
 * Context menu types
 */
export type ContextMenuType = 'node' | 'edge' | 'canvas';

/**
 * Menu item configuration for context menus
 */
export interface MenuItem {
  icon?: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * Form field props shared across all form components
 */
export interface FormFieldProps {
  label: string;
  value: string | number | boolean;
  onChange: (value: any) => void;
  hint?: string;
  required?: boolean;
  icon?: string;
}

/**
 * Node state data for visual feedback
 */
export interface NodeStateData {
  isSelected: boolean;
  isExecuting: boolean;
  hasError: boolean;
  errorMessage?: string;
}
