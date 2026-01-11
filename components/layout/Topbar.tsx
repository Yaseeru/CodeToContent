'use client';

import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Menu } from '@/components/ui/icons/Menu';
import { User } from '@/components/ui/icons/User';
import { Settings } from '@/components/ui/icons/Settings';
import { LogOut } from '@/components/ui/icons/LogOut';

interface TopbarProps {
     user?: {
          name?: string | null;
          email?: string | null;
          image?: string | null;
     };
     onMenuClick?: () => void;
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
     const dropdownRef = useRef<HTMLDivElement>(null);

     // Handle Escape key to close dropdown
     useEffect(() => {
          const handleEscape = (e: KeyboardEvent) => {
               if (e.key === 'Escape' && isDropdownOpen) {
                    setIsDropdownOpen(false);
               }
          };

          document.addEventListener('keydown', handleEscape);
          return () => document.removeEventListener('keydown', handleEscape);
     }, [isDropdownOpen]);

     // Handle click outside to close dropdown
     useEffect(() => {
          const handleClickOutside = (e: MouseEvent) => {
               if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                    setIsDropdownOpen(false);
               }
          };

          if (isDropdownOpen) {
               document.addEventListener('mousedown', handleClickOutside);
               return () => document.removeEventListener('mousedown', handleClickOutside);
          }
     }, [isDropdownOpen]);

     return (
          <header
               className="sticky top-0 z-40 h-16 w-full bg-[var(--background-secondary)] border-b border-[var(--border)]"
               style={{ minHeight: '64px' }}
          >
               <div className="h-full flex items-center justify-between px-4 md:px-6">
                    {/* Left section - Mobile hamburger menu */}
                    <div className="md:hidden">
                         <button
                              onClick={onMenuClick}
                              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-[var(--background-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                              aria-label="Open navigation menu"
                              type="button"
                         >
                              <Menu size="md" aria-hidden="true" />
                         </button>
                    </div>

                    {/* Center section - Could be used for breadcrumbs or page title */}
                    <div className="flex-1 md:flex-none" />

                    {/* Right section - Theme toggle and user dropdown */}
                    <div className="flex items-center gap-2">
                         <ThemeToggle />

                         {user && (
                              <div className="relative" ref={dropdownRef}>
                                   <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center gap-2 h-10 px-3 rounded-lg transition-colors duration-200 hover:bg-[var(--background-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                        aria-label="User menu"
                                        aria-expanded={isDropdownOpen}
                                        aria-haspopup="true"
                                        type="button"
                                   >
                                        {user.image ? (
                                             <img
                                                  src={user.image}
                                                  alt={user.name || 'User avatar'}
                                                  className="w-6 h-6 rounded-full"
                                             />
                                        ) : (
                                             <User size="md" aria-hidden="true" />
                                        )}
                                        <span className="hidden sm:inline text-sm text-[var(--foreground)]">
                                             {user.name || user.email}
                                        </span>
                                   </button>

                                   {/* Dropdown menu */}
                                   {isDropdownOpen && (
                                        <div
                                             className="absolute right-0 mt-2 w-56 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-lg z-50"
                                             role="menu"
                                             aria-orientation="vertical"
                                             aria-labelledby="user-menu-button"
                                        >
                                             <div className="p-3 border-b border-[var(--border)]">
                                                  <p className="text-sm font-medium text-[var(--foreground)]">
                                                       {user.name}
                                                  </p>
                                                  <p className="text-xs text-[var(--foreground-secondary)] truncate">
                                                       {user.email}
                                                  </p>
                                             </div>

                                             <div className="py-1" role="none">
                                                  <a
                                                       href="/dashboard/settings"
                                                       className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--background-tertiary)] focus:outline-none focus:bg-[var(--background-tertiary)]"
                                                       role="menuitem"
                                                  >
                                                       <Settings size="sm" aria-hidden="true" />
                                                       Settings
                                                  </a>

                                                  <button
                                                       onClick={() => {
                                                            window.location.href = '/api/auth/signout';
                                                       }}
                                                       className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--background-tertiary)] focus:outline-none focus:bg-[var(--background-tertiary)]"
                                                       type="button"
                                                       role="menuitem"
                                                  >
                                                       <LogOut size="sm" aria-hidden="true" />
                                                       Sign Out
                                                  </button>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         )}
                    </div>
               </div>
          </header>
     );
}
