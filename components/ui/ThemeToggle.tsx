'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun } from './icons/Sun';
import { Moon } from './icons/Moon';

export function ThemeToggle() {
     const { theme, setTheme } = useTheme();
     const [mounted, setMounted] = useState(false);

     // Prevent hydration mismatch by only rendering after mount
     useEffect(() => {
          setMounted(true);
     }, []);

     if (!mounted) {
          return (
               <button
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    aria-label="Toggle theme"
                    disabled
               >
                    <div className="w-6 h-6" />
               </button>
          );
     }

     const isDark = theme === 'dark';

     const handleToggle = () => {
          setTheme(isDark ? 'light' : 'dark');
     };

     return (
          <button
               onClick={handleToggle}
               className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-[var(--background-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
               aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
               type="button"
          >
               {isDark ? (
                    <Sun size="md" aria-hidden="true" />
               ) : (
                    <Moon size="md" aria-hidden="true" />
               )}
          </button>
     );
}
