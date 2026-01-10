import type { Config } from "tailwindcss";

const config: Config = {
     content: [
          "./pages/**/*.{js,ts,jsx,tsx,mdx}",
          "./components/**/*.{js,ts,jsx,tsx,mdx}",
          "./app/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: {
          extend: {
               colors: {
                    background: "var(--background)",
                    "background-secondary": "var(--background-secondary)",
                    "background-tertiary": "var(--background-tertiary)",
                    foreground: "var(--foreground)",
                    "foreground-secondary": "var(--foreground-secondary)",
                    "foreground-code": "var(--foreground-code)",
                    accent: "var(--accent)",
                    "accent-hover": "var(--accent-hover)",
                    border: "var(--border)",
                    "border-focus": "var(--border-focus)",
               },
               fontFamily: {
                    sans: ["var(--font-sans)"],
                    mono: ["var(--font-mono)"],
               },
          },
     },
     plugins: [],
};

export default config;
