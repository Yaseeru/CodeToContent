'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search } from './icons/Search';
import { X } from './icons/X';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export interface CommandBarProps {
     onSearch?: (query: string) => void;
     placeholder?: string;
     className?: string;
}

/**
 * CommandBar Component
 * 
 * Primary interaction surface for search, navigation, and actions.
 * Follows developer-focused UI redesign principles:
 * - 48px height with flat styling
 * - Keyboard-first interaction (/ key to focus)
 * - Instant theme toggle
 * - Subtle border bottom
 * 
 * Requirements: 1.2, 6.4, 14.3
 */
export function CommandBar({
     onSearch,
     placeholder = 'Search repos, commits, actions...',
     className
}: CommandBarProps) {
     const [query, setQuery] = useState('');
     const [isFocused, setIsFocused] = useState(false);
     const inputRef = useRef<HTMLInputElement>(null);

     // Handle / key to focus search input
     useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
               // Focus search on / key (unless already in an input)
               if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    inputRef.current?.focus();
               }

               // Escape to blur search
               if (e.key === 'Escape' && document.activeElement === inputRef.current) {
                    inputRef.current?.blur();
                    setQuery('');
               }
          };

          window.addEventListener('keydown', handleKeyDown);
          return () => window.removeEventListener('keydown', handleKeyDown);
     }, []);

     // Handle search input changes
     const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setQuery(value);
          onSearch?.(value);
     }, [onSearch]);

     // Clear search
     const handleClear = useCallback(() => {
          setQuery('');
          onSearch?.('');
          inputRef.current?.focus();
     }, [onSearch]);

     return (
          <div
               className={cn(
                    // Height: 48px from design tokens
                    'h-[48px]',
                    // Padding: 8px vertical, 16px horizontal from design tokens
                    'px-lg py-sm',
                    // Background: panel color
                    'bg-bg-panel',
                    // Subtle border bottom
                    'border-b border-border-subtle',
                    // Flex layout
                    'flex items-center gap-md',
                    // No transitions (instant)
                    'transition-none',
                    className
               )}
               role="search"
               aria-label="Command bar"
          >
               {/* Search Input Container */}
               <div className="flex-1 relative flex items-center">
                    {/* Search Icon */}
                    <Search
                         size="sm"
                         className="absolute left-0 text-text-muted pointer-events-none"
                         aria-hidden="true"
                    />

                    {/* Search Input */}
                    <input
                         ref={inputRef}
                         type="text"
                         value={query}
                         onChange={handleChange}
                         onFocus={() => setIsFocused(true)}
                         onBlur={() => setIsFocused(false)}
                         placeholder={placeholder}
                         className={cn(
                              // Full width with left padding for icon
                              'w-full pl-[28px] pr-[28px]',
                              // Padding: 10px vertical, 12px horizontal (input tokens)
                              'py-[10px]',
                              // Background: transparent (inherits from parent)
                              'bg-transparent',
                              // Border: none (parent has border)
                              'border-none',
                              // Typography: 13px base text
                              'text-sm font-regular text-text-primary',
                              // Placeholder styling
                              'placeholder:text-text-muted',
                              // Focus: clear outline with theme-appropriate colors
                              'focus:outline-none focus:ring-0',
                              // No transitions
                              'transition-none'
                         )}
                         aria-label="Search"
                         aria-describedby="search-shortcut"
                    />

                    {/* Clear Button (shown when there's text) */}
                    {query && (
                         <button
                              onClick={handleClear}
                              className={cn(
                                   'absolute right-0',
                                   'p-xs',
                                   'text-text-muted hover:text-text-secondary',
                                   'rounded-button',
                                   'focus:outline-none focus:ring-2 focus:ring-border-focus',
                                   'transition-none'
                              )}
                              aria-label="Clear search"
                              type="button"
                         >
                              <X size="sm" aria-hidden="true" />
                         </button>
                    )}

                    {/* Keyboard Shortcut Hint (shown when not focused and no text) */}
                    {!isFocused && !query && (
                         <div
                              id="search-shortcut"
                              className={cn(
                                   'absolute right-0',
                                   'px-sm py-xs',
                                   'text-xs text-text-muted',
                                   'border border-border-subtle rounded-button',
                                   'pointer-events-none',
                                   'transition-none'
                              )}
                              aria-hidden="true"
                         >
                              /
                         </div>
                    )}
               </div>

               {/* Theme Toggle */}
               <ThemeToggle />
          </div>
     );
}
