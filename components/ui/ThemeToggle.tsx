'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';
import { Sun } from './icons/Sun';
import { Moon } from './icons/Moon';
import { useKeyboardShortcut } from '@/lib/hooks/useKeyboardShortcut';
import { cn } from '@/lib/utils';

/**
 * ThemeToggle Component
 * 
 * Instant theme toggle button with keyboard shortcut support.
 * Follows Requirements 6.1, 6.4, 14.4 from the design specification.
 * 
 * Features:
 * - Instant theme switching (0ms transition)
 * - Keyboard shortcut: Cmd/Ctrl + Shift + T
 * - Accessible with proper ARIA labels
 * - Visible focus indicator
 */
export function ThemeToggle() {
     const { theme, setTheme } = useTheme();
     const [mounted, setMounted] = useState(false);

     // Prevent hydration mismatch by only rendering after mount
     useEffect(() => {
          setMounted(true);
     }, []);

     const isDark = theme === 'dark';

     const handleToggle = useCallback(() => {
          setTheme(isDark ? 'light' : 'dark');
     }, [isDark, setTheme]);

     // Register keyboard shortcut: Cmd/Ctrl + Shift + T
     useKeyboardShortcut({
          key: 't',
          modifiers: { ctrl: true, shift: true },
          description: 'Toggle theme',
          action: handleToggle,
          category: 'view'
     }, {
          enabled: mounted
     });

     if (!mounted) {
          return (
               <button
                    className={cn(
                         'w-10 h-10',
                         'rounded-button',
                         'flex items-center justify-center',
                         'transition-none'
                    )}
                    aria-label="Toggle theme"
                    disabled
               >
                    <div className="w-6 h-6" />
               </button>
          );
     }

     return (
          <button
               onClick={handleToggle}
               className={cn(
                    // Size
                    'w-10 h-10',
                    // Border radius: 4px
                    'rounded-button',
                    // Layout
                    'flex items-center justify-center',
                    // Hover state: subtle background
                    'hover:bg-[rgba(110,110,128,0.05)]',
                    // Focus state: visible outline (Requirements 14.5, 15.1)
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                    // No transitions (instant)
                    'transition-none'
               )}
               aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode. Keyboard shortcut: ${typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? 'Cmd' : 'Ctrl'} + Shift + T`}
               type="button"
               title={`Toggle theme (${typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? 'Cmd' : 'Ctrl'}+Shift+T)`}
          >
               {isDark ? (
                    <Sun size="md" aria-hidden="true" />
               ) : (
                    <Moon size="md" aria-hidden="true" />
               )}
          </button>
     );
}
