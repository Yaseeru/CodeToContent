import type { Config } from "tailwindcss";
import { designTokens } from "./lib/design-tokens";

const config: Config = {
     darkMode: 'class',
     content: [
          "./pages/**/*.{js,ts,jsx,tsx,mdx}",
          "./components/**/*.{js,ts,jsx,tsx,mdx}",
          "./app/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: {
          extend: {
               // Spacing scale from design tokens
               spacing: {
                    xs: designTokens.spacing.xs,
                    sm: designTokens.spacing.sm,
                    md: designTokens.spacing.md,
                    lg: designTokens.spacing.lg,
                    xl: designTokens.spacing.xl,
                    xxl: designTokens.spacing.xxl,
               },
               // Typography from design tokens
               fontSize: {
                    xs: [designTokens.typography.fontSize.xs, { lineHeight: String(designTokens.typography.lineHeight.tight) }],
                    sm: [designTokens.typography.fontSize.sm, { lineHeight: String(designTokens.typography.lineHeight.normal) }],
                    base: [designTokens.typography.fontSize.base, { lineHeight: String(designTokens.typography.lineHeight.normal) }],
                    md: [designTokens.typography.fontSize.md, { lineHeight: String(designTokens.typography.lineHeight.normal) }],
                    lg: [designTokens.typography.fontSize.lg, { lineHeight: String(designTokens.typography.lineHeight.relaxed) }],
               },
               fontWeight: {
                    regular: designTokens.typography.fontWeight.regular,
                    medium: designTokens.typography.fontWeight.medium,
                    semibold: designTokens.typography.fontWeight.semibold,
               },
               fontFamily: {
                    sans: designTokens.typography.fontFamily.primary.split(', '),
                    mono: designTokens.typography.fontFamily.mono.split(', '),
               },
               // Colors from design tokens (using CSS variables for theme switching)
               colors: {
                    // Background colors
                    'bg-app': 'var(--bg-app)',
                    'bg-panel': 'var(--bg-panel)',
                    'bg-elevated': 'var(--bg-elevated)',

                    // Border colors
                    'border-subtle': 'var(--border-subtle)',
                    'border-focus': 'var(--border-focus)',

                    // Text colors
                    'text-primary': 'var(--text-primary)',
                    'text-secondary': 'var(--text-secondary)',
                    'text-muted': 'var(--text-muted)',
                    'text-disabled': 'var(--text-disabled)',

                    // Accent colors
                    'accent-neutral': 'var(--accent-neutral)',
                    'accent-hover': 'var(--accent-hover)',

                    // Status colors
                    'status-success': 'var(--status-success)',
                    'status-warning': 'var(--status-warning)',
                    'status-error': 'var(--status-error)',

                    // Legacy colors (for backward compatibility)
                    background: "var(--background)",
                    "background-secondary": "var(--background-secondary)",
                    "background-tertiary": "var(--background-tertiary)",
                    foreground: "var(--foreground)",
                    "foreground-secondary": "var(--foreground-secondary)",
                    "foreground-code": "var(--foreground-code)",
                    accent: "var(--accent)",
                    border: "var(--border)",
               },
               // Border radius from design tokens
               borderRadius: {
                    button: designTokens.button.borderRadius,
                    input: designTokens.input.borderRadius,
                    panel: designTokens.panel.borderRadius,
                    list: designTokens.list.itemBorderRadius,
                    modal: designTokens.modal.borderRadius,
               },
          },
     },
     plugins: [],
};

export default config;
