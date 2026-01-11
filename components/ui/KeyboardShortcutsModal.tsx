'use client';

import * as React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
     DEFAULT_SHORTCUTS,
     formatShortcut,
     KeyboardShortcut
} from '@/lib/keyboard-shortcuts';
import { cn } from '@/lib/utils';

export interface KeyboardShortcutsModalProps {
     open: boolean;
     onClose: () => void;
}

/**
 * Keyboard Shortcuts Modal
 * 
 * Displays all available keyboard shortcuts organized by category.
 * Follows Requirements 14.4 from the design specification.
 * 
 * Features:
 * - Organized by category (navigation, editing, view, general)
 * - Platform-aware modifier key display (Cmd on Mac, Ctrl on Windows/Linux)
 * - Accessible with proper ARIA labels
 * - Keyboard dismissible (Escape key)
 */
export function KeyboardShortcutsModal({
     open,
     onClose
}: KeyboardShortcutsModalProps) {
     // Group shortcuts by category
     const shortcutsByCategory = React.useMemo(() => {
          const categories: Record<string, typeof DEFAULT_SHORTCUTS> = {
               navigation: [],
               editing: [],
               view: [],
               general: []
          };

          DEFAULT_SHORTCUTS.forEach(config => {
               const category = config.shortcut.category || 'general';
               if (categories[category]) {
                    categories[category].push(config);
               }
          });

          return categories;
     }, []);

     const categoryLabels: Record<string, string> = {
          navigation: 'Navigation',
          editing: 'Editing',
          view: 'View',
          general: 'General'
     };

     return (
          <Modal
               open={open}
               onClose={onClose}
               title="Keyboard Shortcuts"
               maxWidth="600px"
               actions={
                    <Button variant="primary" onClick={onClose}>
                         Close
                    </Button>
               }
          >
               <div className="space-y-xl">
                    {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => {
                         if (shortcuts.length === 0) return null;

                         return (
                              <div key={category}>
                                   {/* Category heading */}
                                   <h3 className="text-xs uppercase font-medium text-text-muted mb-md">
                                        {categoryLabels[category]}
                                   </h3>

                                   {/* Shortcuts list */}
                                   <div className="space-y-sm">
                                        {shortcuts.map(config => (
                                             <div
                                                  key={config.id}
                                                  className={cn(
                                                       'flex items-center justify-between',
                                                       'py-sm px-md',
                                                       'rounded-button',
                                                       'hover:bg-[rgba(110,110,128,0.05)]',
                                                       'transition-none'
                                                  )}
                                             >
                                                  {/* Description */}
                                                  <span className="text-sm text-text-primary">
                                                       {config.shortcut.description}
                                                  </span>

                                                  {/* Shortcut keys */}
                                                  <kbd
                                                       className={cn(
                                                            'px-sm py-xs',
                                                            'text-xs font-mono',
                                                            'text-text-secondary',
                                                            'bg-bg-elevated',
                                                            'border border-border-subtle',
                                                            'rounded-button',
                                                            'transition-none'
                                                       )}
                                                       aria-label={`Keyboard shortcut: ${formatShortcut(config.shortcut)}`}
                                                  >
                                                       {formatShortcut(config.shortcut)}
                                                  </kbd>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         );
                    })}
               </div>

               {/* Help text */}
               <div className="mt-xl pt-lg border-t border-border-subtle">
                    <p className="text-sm text-text-muted">
                         Press <kbd className="px-sm py-xs text-xs font-mono bg-bg-elevated border border-border-subtle rounded-button">?</kbd> to show this dialog anytime.
                    </p>
               </div>
          </Modal>
     );
}
