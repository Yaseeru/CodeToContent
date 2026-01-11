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
     defaultTheme = 'dark',
     storageKey = 'theme-preference'
}: ThemeProviderProps) {
     return (
          <NextThemesProvider
               attribute="class"
               defaultTheme={defaultTheme}
               enableSystem={false}
               storageKey={storageKey}
               disableTransitionOnChange={true}
          >
               {children}
          </NextThemesProvider>
     );
}
