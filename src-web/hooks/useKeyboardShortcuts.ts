import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

/**
 * Register keyboard shortcuts
 * Handles platform differences (Cmd on Mac, Ctrl on Windows/Linux)
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = !shortcut.ctrl || event.ctrlKey;
        const matchesShift = !shortcut.shift || event.shiftKey;
        const matchesAlt = !shortcut.alt || event.altKey;
        const matchesMeta = !shortcut.meta || event.metaKey;

        // On Mac, Cmd is the primary modifier, on Windows/Linux it's Ctrl
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const primaryModifier = isMac ? event.metaKey : event.ctrlKey;
        const requiresPrimaryModifier = shortcut.ctrl || shortcut.meta;

        if (
          matchesKey &&
          matchesShift &&
          matchesAlt &&
          (!requiresPrimaryModifier || primaryModifier) &&
          (shortcut.ctrl ? matchesCtrl : true) &&
          (shortcut.meta ? matchesMeta : true)
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}
