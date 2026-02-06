/** @type {import('tailwindcss').Config} */
export default {
     content: [
          "./index.html",
          "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
          screens: {
               'xs': '475px',
               'sm': '640px',
               'md': '768px',
               'lg': '1024px',
               'xl': '1280px',
               '2xl': '1536px',
               '3xl': '1920px',
               '4xl': '2560px',
          },
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
                    'dark-error-hover': '#dc2626',
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
                    '5xl': ['3rem', { lineHeight: '1' }],
                    '6xl': ['3.75rem', { lineHeight: '1' }],
                    '7xl': ['4.5rem', { lineHeight: '1' }],
                    '8xl': ['6rem', { lineHeight: '1' }],
                    '9xl': ['8rem', { lineHeight: '1' }],
               },
               spacing: {
                    '18': '4.5rem',
                    '88': '22rem',
                    '128': '32rem',
                    '144': '36rem',
               },
               borderRadius: {
                    'lg': '0.5rem',
                    'xl': '0.75rem',
                    '2xl': '1rem',
                    '3xl': '1.5rem',
               },
               maxWidth: {
                    '8xl': '88rem',
                    '9xl': '96rem',
               },
               animation: {
                    'fade-in': 'fadeIn 0.3s ease-in-out',
                    'fade-out': 'fadeOut 0.3s ease-in-out',
                    'slide-up': 'slideUp 0.3s ease-out',
                    'slide-down': 'slideDown 0.3s ease-out',
                    'scale-in': 'scaleIn 0.2s ease-out',
                    'scale-out': 'scaleOut 0.2s ease-in',
               },
               keyframes: {
                    fadeIn: {
                         '0%': { opacity: '0' },
                         '100%': { opacity: '1' },
                    },
                    fadeOut: {
                         '0%': { opacity: '1' },
                         '100%': { opacity: '0' },
                    },
                    slideUp: {
                         '0%': { transform: 'translateY(100%)', opacity: '0' },
                         '100%': { transform: 'translateY(0)', opacity: '1' },
                    },
                    slideDown: {
                         '0%': { transform: 'translateY(-100%)', opacity: '0' },
                         '100%': { transform: 'translateY(0)', opacity: '1' },
                    },
                    scaleIn: {
                         '0%': { transform: 'scale(0.95)', opacity: '0' },
                         '100%': { transform: 'scale(1)', opacity: '1' },
                    },
                    scaleOut: {
                         '0%': { transform: 'scale(1)', opacity: '1' },
                         '100%': { transform: 'scale(0.95)', opacity: '0' },
                    },
               },
          },
     },
     plugins: [],
}
