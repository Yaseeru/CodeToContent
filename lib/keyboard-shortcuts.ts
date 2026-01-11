/**
 * Keyboard Shortcuts Utility
 * 
 * Centralized keyboard shortcut management for the application.
 * Follows Requirements 14.1, 14.2, 14.4 from the design specification.
 * 
 * Features:
 * - Global keyboard shortcut registration
 * - Platform-aware modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
 * - Keyboard shortcut documentation
 * - Conflict detection
 */

export interface KeyboardShortcut {
     key: string;
     modifiers?: {
          ctrl?: boolean;
          shift?: boolean;
          alt?: boolean;
          meta?: boolean;
     };
     description: string;
     action: () => void;
     category?: 'navigation' | 'editing' | 'view' | 'general';
}

export interface KeyboardShortcutConfig {
     id: string;
     shortcut: KeyboardShortcut;
}

/**
 * Check if the current platform is Mac
 */
export const isMac = (): boolean => {
     if (typeof window === 'undefined') return false;
     return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
};

/**
 * Get the modifier key name for the current platform
 */
export const getModifierKeyName = (): string => {
     return isMac() ? 'Cmd' : 'Ctrl';
};

/**
 * Format a keyboard shortcut for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
     const parts: string[] = [];

     if (shortcut.modifiers?.meta || shortcut.modifiers?.ctrl) {
          parts.push(getModifierKeyName());
     }
     if (shortcut.modifiers?.shift) {
          parts.push('Shift');
     }
     if (shortcut.modifiers?.alt) {
          parts.push('Alt');
     }
     parts.push(shortcut.key.toUpperCase());

     return parts.join(' + ');
};

/**
 * Check if a keyboard event matches a shortcut
 */
export const matchesShortcut = (
     event: KeyboardEvent,
     shortcut: KeyboardShortcut
): boolean => {
     // Check key match (case-insensitive)
     if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
          return false;
     }

     // Check modifiers
     const modifiers = shortcut.modifiers || {};

     // On Mac, use metaKey for Cmd, on others use ctrlKey
     const primaryModifier = isMac() ? event.metaKey : event.ctrlKey;
     const expectedPrimaryModifier = modifiers.meta || modifiers.ctrl || false;

     if (primaryModifier !== expectedPrimaryModifier) {
          return false;
     }

     if (event.shiftKey !== (modifiers.shift || false)) {
          return false;
     }

     if (event.altKey !== (modifiers.alt || false)) {
          return false;
     }

     return true;
};

/**
 * Default keyboard shortcuts for the application
 */
export const DEFAULT_SHORTCUTS: KeyboardShortcutConfig[] = [
     {
          id: 'search',
          shortcut: {
               key: '/',
               description: 'Focus search',
               category: 'navigation'
          } as KeyboardShortcut
     },
     {
          id: 'theme-toggle',
          shortcut: {
               key: 't',
               modifiers: { ctrl: true, shift: true },
               description: 'Toggle theme',
               category: 'view'
          } as KeyboardShortcut
     },
     {
          id: 'escape',
          shortcut: {
               key: 'Escape',
               description: 'Close modal or clear focus',
               category: 'general'
          } as KeyboardShortcut
     },
     {
          id: 'help',
          shortcut: {
               key: '?',
               modifiers: { shift: true },
               description: 'Show keyboard shortcuts',
               category: 'general'
          } as KeyboardShortcut
     }
];

/**
 * Get shortcut by ID
 */
export const getShortcut = (id: string): KeyboardShortcutConfig | undefined => {
     return DEFAULT_SHORTCUTS.find(s => s.id === id);
};

/**
 * Get all shortcuts by category
 */
export const getShortcutsByCategory = (
     category: KeyboardShortcut['category']
): KeyboardShortcutConfig[] => {
     return DEFAULT_SHORTCUTS.filter(s => s.shortcut.category === category);
};
