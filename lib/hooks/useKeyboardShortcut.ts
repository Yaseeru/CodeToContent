/**
 * useKeyboardShortcut Hook
 * 
 * React hook for registering keyboard shortcuts.
 * Follows Requirements 14.1, 14.2, 14.4 from the design specification.
 */

import { useEffect, useCallback } from 'react';
import { KeyboardShortcut, matchesShortcut } from '@/lib/keyboard-shortcuts';

export interface UseKeyboardShortcutOptions {
     /**
      * Whether the shortcut is enabled
      */
     enabled?: boolean;

     /**
      * Whether to prevent default browser behavior
      */
     preventDefault?: boolean;

     /**
      * Whether to stop event propagation
      */
     stopPropagation?: boolean;

     /**
      * Element to attach the listener to (defaults to window)
      */
     target?: HTMLElement | Window | null;
}

/**
 * Register a keyboard shortcut
 */
export function useKeyboardShortcut(
     shortcut: KeyboardShortcut,
     options: UseKeyboardShortcutOptions = {}
): void {
     const {
          enabled = true,
          preventDefault = true,
          stopPropagation = false,
          target = typeof window !== 'undefined' ? window : null
     } = options;

     const handleKeyDown = useCallback((event: KeyboardEvent) => {
          if (!enabled) return;

          // Don't trigger shortcuts when typing in inputs (unless it's Escape)
          const activeElement = document.activeElement;
          const isTyping = activeElement?.tagName === 'INPUT' ||
               activeElement?.tagName === 'TEXTAREA' ||
               activeElement?.getAttribute('contenteditable') === 'true';

          if (isTyping && event.key !== 'Escape') {
               return;
          }

          if (matchesShortcut(event, shortcut)) {
               if (preventDefault) {
                    event.preventDefault();
               }
               if (stopPropagation) {
                    event.stopPropagation();
               }
               shortcut.action();
          }
     }, [enabled, preventDefault, stopPropagation, shortcut]);

     useEffect(() => {
          if (!target || !enabled) return;

          target.addEventListener('keydown', handleKeyDown as EventListener);

          return () => {
               target.removeEventListener('keydown', handleKeyDown as EventListener);
          };
     }, [target, enabled, handleKeyDown]);
}

/**
 * Register multiple keyboard shortcuts
 */
export function useKeyboardShortcuts(
     shortcuts: KeyboardShortcut[],
     options: UseKeyboardShortcutOptions = {}
): void {
     const {
          enabled = true,
          preventDefault = true,
          stopPropagation = false,
          target = typeof window !== 'undefined' ? window : null
     } = options;

     const handleKeyDown = useCallback((event: KeyboardEvent) => {
          if (!enabled) return;

          // Don't trigger shortcuts when typing in inputs (unless it's Escape)
          const activeElement = document.activeElement;
          const isTyping = activeElement?.tagName === 'INPUT' ||
               activeElement?.tagName === 'TEXTAREA' ||
               activeElement?.getAttribute('contenteditable') === 'true';

          if (isTyping && event.key !== 'Escape') {
               return;
          }

          for (const shortcut of shortcuts) {
               if (matchesShortcut(event, shortcut)) {
                    if (preventDefault) {
                         event.preventDefault();
                    }
                    if (stopPropagation) {
                         event.stopPropagation();
                    }
                    shortcut.action();
                    break; // Only trigger the first matching shortcut
               }
          }
     }, [enabled, preventDefault, stopPropagation, shortcuts]);

     useEffect(() => {
          if (!target || !enabled) return;

          target.addEventListener('keydown', handleKeyDown as EventListener);

          return () => {
               target.removeEventListener('keydown', handleKeyDown as EventListener);
          };
     }, [target, enabled, handleKeyDown]);
}
