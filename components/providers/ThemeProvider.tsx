'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

interface ThemeProviderProps {
     children: ReactNode;
     defaultTheme?: 'dark' | 'light' | 'system';
     storageKey?: string;
}

export function ThemeProvider({
     children,
     defaultTheme = 'system',
     storageKey = 'theme-preference'
}: ThemeProviderProps) {
     return (
          <NextThemesProvider
               attribute="class"
               defaultTheme={defaultTheme}
               enableSystem
               storageKey={storageKey}
               disableTransitionOnChange={true}
          >
               {children}
          </NextThemesProvider>
     );
}
