/**
 * Design Tokens for Developer-Focused UI Redesign
 * 
 * This file contains the centralized design token system following strict
 * design principles: functional > aesthetic, minimal > expressive, calm > exciting.
 * 
 * All spacing, typography, and color values should be sourced from these tokens
 * to ensure consistency across the application.
 */

// ============================================================================
// SPACING SYSTEM
// ============================================================================

/**
 * Strict 4px-based spacing scale
 * All spacing in the application must use these values
 */
export const spacing = {
     xs: '4px',   // Tight spacing, icon gaps
     sm: '8px',   // List item gaps, button vertical padding
     md: '12px',  // Button horizontal padding, input horizontal padding
     lg: '16px',  // Panel padding minimum
     xl: '24px',  // Section spacing
     xxl: '32px'  // Major section breaks
} as const;

/**
 * Spacing scale as numeric values (in pixels) for calculations
 */
export const spacingNumeric = {
     xs: 4,
     sm: 8,
     md: 12,
     lg: 16,
     xl: 24,
     xxl: 32
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

/**
 * Font family definitions
 */
export const fontFamily = {
     primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
     mono: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", monospace'
} as const;

/**
 * Font size scale
 * Headings are intentionally small (max 18px) for a calm, dense interface
 */
export const fontSize = {
     xs: '12px',    // Section labels (uppercase)
     sm: '13px',    // Base text, code
     base: '14px',  // Primary text
     md: '16px',    // Small headings
     lg: '18px'     // Max heading size
} as const;

/**
 * Font weight scale
 * Limited to 3 weights for consistency
 */
export const fontWeight = {
     regular: 400,
     medium: 500,
     semibold: 600
} as const;

/**
 * Line height scale
 */
export const lineHeight = {
     tight: 1.4,
     normal: 1.5,
     relaxed: 1.6
} as const;

/**
 * Complete typography configuration
 */
export const typography = {
     fontFamily,
     fontSize,
     fontWeight,
     lineHeight
} as const;

// ============================================================================
// COLOR SYSTEM - DARK MODE (PRIMARY)
// ============================================================================

/**
 * Dark mode color palette
 * Low-contrast, optimized for long work sessions
 * All colors meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
 */
export const darkMode = {
     background: {
          app: '#0E0E11',        // Main app background
          panel: '#13131A',      // Panel backgrounds
          elevated: '#181820'    // Elevated surfaces (modals, popovers)
     },
     border: {
          subtle: '#23232D',     // Dividers, borders
          focus: '#2F2F3A'       // Focus outlines
     },
     text: {
          primary: '#E6E6EB',    // Main text - 15.49:1 contrast (AAA)
          secondary: '#B3B3C2',  // Supporting text - 9.31:1 contrast (AAA)
          muted: '#8A8A9B',      // Placeholder, labels - 5.68:1 contrast (AA)
          disabled: '#808090'    // Disabled state - 5.01:1 contrast (AA) - adjusted for WCAG AA compliance on all backgrounds
     },
     accent: {
          neutral: '#6E6E80',    // Default accent
          hover: '#7C7C8F'       // Hover state
     },
     status: {
          success: '#5F7F6A',    // Success states
          warning: '#8A7A5A',    // Warning states
          error: '#8A5A5A'       // Error states
     }
} as const;

// ============================================================================
// COLOR SYSTEM - LIGHT MODE (SECONDARY)
// ============================================================================

/**
 * Light mode color palette
 * Clean, high-contrast for well-lit environments
 * All colors meet WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
 */
export const lightMode = {
     background: {
          app: '#FAFAFB',        // Main app background
          panel: '#FFFFFF',      // Panel backgrounds
          elevated: '#F3F3F6'    // Elevated surfaces
     },
     border: {
          subtle: '#E4E4EA',     // Dividers, borders
          focus: '#D0D0DA'       // Focus outlines
     },
     text: {
          primary: '#1C1C22',    // Main text - 16.25:1 contrast (AAA)
          secondary: '#4A4A55',  // Supporting text - 8.38:1 contrast (AAA)
          muted: '#6A6A78',      // Placeholder, labels - 5.02:1 contrast (AA) - adjusted from #7A7A88
          disabled: '#6A6A78'    // Disabled state - 5.02:1 contrast (AA) - same as muted for WCAG AA compliance
     },
     accent: {
          neutral: '#6B6B78',    // Default accent
          hover: '#5F5F6B'       // Hover state
     },
     status: {
          success: '#5F7F6A',    // Success states (same hue, desaturated)
          warning: '#8A7A5A',    // Warning states
          error: '#8A5A5A'       // Error states
     }
} as const;

/**
 * Combined color system
 */
export const colors = {
     dark: darkMode,
     light: lightMode
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

/**
 * Button component tokens
 */
export const button = {
     padding: {
          vertical: spacing.sm,    // 8px
          horizontal: spacing.md   // 12px
     },
     borderRadius: '4px',
     maxBorderRadius: 4
} as const;

/**
 * Input component tokens
 */
export const input = {
     padding: {
          vertical: '10px',
          horizontal: spacing.md   // 12px
     },
     borderRadius: '4px',
     maxBorderRadius: 4
} as const;

/**
 * Panel component tokens
 */
export const panel = {
     minPadding: spacing.lg,    // 16px
     borderRadius: '8px'
} as const;

/**
 * List component tokens
 */
export const list = {
     gap: spacing.sm,           // 8px
     itemPadding: {
          vertical: spacing.sm,    // 8px
          horizontal: spacing.md   // 12px
     },
     itemBorderRadius: '4px'
} as const;

/**
 * Command bar tokens
 */
export const commandBar = {
     height: '48px',
     padding: {
          vertical: spacing.sm,    // 8px
          horizontal: spacing.lg   // 16px
     }
} as const;

/**
 * Modal component tokens
 */
export const modal = {
     maxWidth: '480px',
     padding: spacing.xl,       // 24px
     borderRadius: '8px'
} as const;

/**
 * Icon tokens
 */
export const icon = {
     sizes: {
          sm: '16px',
          md: '20px',
          lg: '24px'
     },
     strokeWidth: {
          default: '1.5px',
          thick: '2px'
     }
} as const;

// ============================================================================
// COMPLETE DESIGN TOKEN EXPORT
// ============================================================================

/**
 * Complete design token system
 * Import this object to access all design tokens
 */
export const designTokens = {
     spacing,
     spacingNumeric,
     typography,
     colors,
     button,
     input,
     panel,
     list,
     commandBar,
     modal,
     icon
} as const;

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Type definitions for design tokens
 */
export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
export type SpacingValue = Spacing[SpacingKey];

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type Typography = typeof typography;

export type DarkMode = typeof darkMode;
export type LightMode = typeof lightMode;
export type ColorSystem = typeof colors;
export type Theme = 'dark' | 'light';

export type ButtonTokens = typeof button;
export type InputTokens = typeof input;
export type PanelTokens = typeof panel;
export type ListTokens = typeof list;
export type CommandBarTokens = typeof commandBar;
export type ModalTokens = typeof modal;
export type IconTokens = typeof icon;

export type DesignTokens = typeof designTokens;

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
     current: Theme;
     colors: DarkMode | LightMode;
     spacing: Spacing;
     typography: Typography;
}

/**
 * Helper type to get color values for current theme
 */
export type ThemeColors<T extends Theme> = T extends 'dark' ? DarkMode : LightMode;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get colors for a specific theme
 */
export function getThemeColors(theme: Theme): DarkMode | LightMode {
     return theme === 'dark' ? darkMode : lightMode;
}

/**
 * Check if a spacing value is valid
 */
export function isValidSpacing(value: string | number): boolean {
     const validValues = Object.values(spacing);
     if (typeof value === 'string') {
          return validValues.includes(value as SpacingValue) || value === '0' || value === '0px';
     }
     const numericValues = Object.values(spacingNumeric) as number[];
     return numericValues.includes(value) || value === 0;
}

/**
 * Check if a font weight is valid
 */
export function isValidFontWeight(weight: number): boolean {
     const validWeights = Object.values(fontWeight) as number[];
     return validWeights.includes(weight);
}

/**
 * Check if a font size is valid
 */
export function isValidFontSize(size: string): boolean {
     return Object.values(fontSize).includes(size as any);
}

/**
 * Default export for convenience
 */
export default designTokens;
