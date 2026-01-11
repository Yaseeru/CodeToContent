/** @type {import('tailwindcss').Config} */
export default {
     content: [
          "./index.html",
          "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
          extend: {
               colors: {
                    // Raycast-inspired dark theme colors
                    'dark-bg': '#1a1a1a',
                    'dark-surface': '#242424',
                    'dark-surface-hover': '#2d2d2d',
                    'dark-border': '#3a3a3a',
                    'dark-text': '#e5e5e5',
                    'dark-text-secondary': '#9ca3af',
                    'dark-text-tertiary': '#6b7280',
                    'dark-accent': '#5b8def',
                    'dark-accent-hover': '#4a7dd9',
                    'dark-error': '#ef4444',
                    'dark-error-bg': '#2d1f1f',
                    'dark-success': '#10b981',
               },
               fontFamily: {
                    sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
               },
               fontSize: {
                    'xs': ['0.75rem', { lineHeight: '1rem' }],
                    'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                    'base': ['1rem', { lineHeight: '1.5rem' }],
                    'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                    'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                    '2xl': ['1.5rem', { lineHeight: '2rem' }],
                    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
               },
               spacing: {
                    '18': '4.5rem',
                    '88': '22rem',
               },
               borderRadius: {
                    'lg': '0.5rem',
                    'xl': '0.75rem',
               },
          },
     },
     plugins: [],
}
