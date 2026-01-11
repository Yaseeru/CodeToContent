'use client';

import { ReactNode, useState, useCallback } from 'react';
import { CommandBar } from '@/components/ui/CommandBar';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';
import { useKeyboardShortcut } from '@/lib/hooks/useKeyboardShortcut';
import { cn } from '@/lib/utils';

interface AppShellProps {
     /**
      * Content for the list view (left panel)
      */
     listView?: ReactNode;

     /**
      * Content for the detail pane (right panel)
      */
     detailPane?: ReactNode;

     /**
      * Callback for search in command bar
      */
     onSearch?: (query: string) => void;

     /**
      * Optional className for the container
      */
     className?: string;

     /**
      * User information for display
      */
     user?: {
          name?: string | null;
          email?: string | null;
          image?: string | null;
     };
}

/**
 * AppShell Component
 * 
 * Global layout structure following the developer-focused UI redesign.
 * Single-window layout with Command Bar, List View, and Detail Pane.
 * 
 * Requirements:
 * - 1.1: No nesting beyond 2 levels
 * - 1.2: Top Command Bar as primary interaction surface
 * - 1.3: Primary List View for content
 * - 1.4: Detail Pane for viewing/editing
 * - 1.5: No sidebars
 * - 1.6: Desktop-style web app feel
 * - 14.1, 14.2, 14.4: Keyboard-first interaction with shortcuts
 * - 15.2: Logical tab order
 */
export function AppShell({
     listView,
     detailPane,
     onSearch,
     className,
     user
}: AppShellProps) {
     const [showShortcuts, setShowShortcuts] = useState(false);

     // Register keyboard shortcut for help: Shift + ?
     useKeyboardShortcut({
          key: '?',
          modifiers: { shift: true },
          description: 'Show keyboard shortcuts',
          action: useCallback(() => setShowShortcuts(true), []),
          category: 'general'
     });

     return (
          <div
               className={cn(
                    // Full viewport height
                    'h-screen',
                    // Flex column layout
                    'flex flex-col',
                    // App background color (theme-appropriate)
                    'bg-bg-app',
                    // No transitions (instant)
                    'transition-none',
                    className
               )}
          >
               {/* Skip to main content link for keyboard users (Requirements 15.2) */}
               <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-neutral focus:text-text-primary focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
               >
                    Skip to main content
               </a>

               {/* Level 0: Command Bar - Primary interaction surface */}
               <CommandBar
                    onSearch={onSearch}
                    placeholder="Search repos, commits, actions..."
               />

               {/* Level 1: Main content area with List View and Detail Pane */}
               <div
                    id="main-content"
                    className={cn(
                         // Flex-1 to fill remaining height
                         'flex-1',
                         // Flex row layout for side-by-side panels
                         'flex',
                         // Prevent overflow
                         'overflow-hidden',
                         // No transitions
                         'transition-none'
                    )}
                    tabIndex={-1}
               >
                    {/* List View - Primary content area */}
                    {listView && (
                         <div
                              className={cn(
                                   // Width: flexible but constrained
                                   'w-full md:w-[400px] lg:w-[480px]',
                                   // Panel background
                                   'bg-bg-panel',
                                   // Border right for separation
                                   'border-r border-border-subtle',
                                   // Padding: 16px (panel minimum)
                                   'p-lg',
                                   // Overflow handling
                                   'overflow-y-auto',
                                   // No transitions
                                   'transition-none'
                              )}
                              role="region"
                              aria-label="List view"
                         >
                              {listView}
                         </div>
                    )}

                    {/* Detail Pane - Secondary content area */}
                    {detailPane && (
                         <div
                              className={cn(
                                   // Flex-1 to fill remaining width
                                   'flex-1',
                                   // Panel background
                                   'bg-bg-panel',
                                   // Padding: 24px for comfortable reading/editing
                                   'p-xl',
                                   // Overflow handling
                                   'overflow-y-auto',
                                   // No transitions
                                   'transition-none'
                              )}
                              role="region"
                              aria-label="Detail pane"
                         >
                              {detailPane}
                         </div>
                    )}

                    {/* Empty state when no content is provided */}
                    {!listView && !detailPane && (
                         <div
                              className={cn(
                                   'flex-1',
                                   'flex items-center justify-center',
                                   'text-text-muted text-sm'
                              )}
                              role="status"
                         >
                              No content to display
                         </div>
                    )}
               </div>

               {/* Keyboard Shortcuts Modal */}
               <KeyboardShortcutsModal
                    open={showShortcuts}
                    onClose={() => setShowShortcuts(false)}
               />
          </div>
     );
}
