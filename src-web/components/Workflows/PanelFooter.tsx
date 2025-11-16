import { Button } from '../core/Button';
import { Loader } from 'lucide-react';

export interface PanelFooterProps {
  onSave: () => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

/**
 * Footer component for the Properties Panel
 * Contains Save and Cancel buttons with loading state
 *
 * @param onSave - Async function to save changes
 * @param onCancel - Function to cancel/revert changes
 * @param isSaving - Whether save operation is in progress
 */
export function PanelFooter({ onSave, onCancel, isSaving = false }: PanelFooterProps) {
  return (
    <div className="p-4 border-t border-border flex gap-2">
      <Button
        onClick={onSave}
        disabled={isSaving}
        className="flex-1 flex items-center justify-center gap-2"
      >
        {isSaving && <Loader className="w-4 h-4 animate-spin" />}
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
      <Button
        onClick={onCancel}
        disabled={isSaving}
        variant="border"
        className="flex-1"
      >
        Cancel
      </Button>
    </div>
  );
}
