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
                    'dark-surface': '#2a2a2a',
                    'dark-border': '#3a3a3a',
                    'dark-text': '#e0e0e0',
                    'dark-text-secondary': '#a0a0a0',
                    'dark-accent': '#4a9eff',
               }
          },
     },
     plugins: [],
     darkMode: 'class',
}
