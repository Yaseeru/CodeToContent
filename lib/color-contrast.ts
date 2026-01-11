/**
 * Color Contrast Utilities
 * 
 * Utilities for calculating and verifying WCAG AA color contrast ratios.
 * WCAG AA requires:
 * - 4.5:1 for normal text (< 18pt or < 14pt bold)
 * - 3:1 for large text (>= 18pt or >= 14pt bold)
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
     return result
          ? {
               r: parseInt(result[1], 16),
               g: parseInt(result[2], 16),
               b: parseInt(result[3], 16)
          }
          : null;
}

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
     const [rs, gs, bs] = [r, g, b].map(c => {
          const sRGB = c / 255;
          return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
     });
     return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
     const rgb1 = hexToRgb(color1);
     const rgb2 = hexToRgb(color2);

     if (!rgb1 || !rgb2) {
          throw new Error(`Invalid color format: ${color1} or ${color2}`);
     }

     const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
     const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

     const lighter = Math.max(l1, l2);
     const darker = Math.min(l1, l2);

     return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(
     foreground: string,
     background: string,
     isLargeText: boolean = false
): boolean {
     const ratio = getContrastRatio(foreground, background);
     const requiredRatio = isLargeText ? 3.0 : 4.5;
     return ratio >= requiredRatio;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(
     foreground: string,
     background: string,
     isLargeText: boolean = false
): boolean {
     const ratio = getContrastRatio(foreground, background);
     const requiredRatio = isLargeText ? 4.5 : 7.0;
     return ratio >= requiredRatio;
}

/**
 * Get contrast ratio grade (AA, AAA, or Fail)
 */
export function getContrastGrade(
     foreground: string,
     background: string,
     isLargeText: boolean = false
): 'AAA' | 'AA' | 'Fail' {
     if (meetsWCAGAAA(foreground, background, isLargeText)) {
          return 'AAA';
     }
     if (meetsWCAGAA(foreground, background, isLargeText)) {
          return 'AA';
     }
     return 'Fail';
}

/**
 * Verify all color combinations in a theme meet WCAG AA standards
 */
export interface ColorCombination {
     name: string;
     foreground: string;
     background: string;
     isLargeText: boolean;
     ratio: number;
     passes: boolean;
     grade: 'AAA' | 'AA' | 'Fail';
}

export function verifyThemeContrast(theme: {
     background: { app: string; panel: string; elevated: string };
     text: { primary: string; secondary: string; muted: string; disabled: string };
}): ColorCombination[] {
     const combinations: ColorCombination[] = [];

     // Test all text colors against all background colors
     const textColors = [
          { name: 'primary', color: theme.text.primary, isLarge: false },
          { name: 'secondary', color: theme.text.secondary, isLarge: false },
          { name: 'muted', color: theme.text.muted, isLarge: false },
          { name: 'disabled', color: theme.text.disabled, isLarge: false }
     ];

     const backgrounds = [
          { name: 'app', color: theme.background.app },
          { name: 'panel', color: theme.background.panel },
          { name: 'elevated', color: theme.background.elevated }
     ];

     for (const text of textColors) {
          for (const bg of backgrounds) {
               const ratio = getContrastRatio(text.color, bg.color);
               const passes = meetsWCAGAA(text.color, bg.color, text.isLarge);
               const grade = getContrastGrade(text.color, bg.color, text.isLarge);

               combinations.push({
                    name: `${text.name} on ${bg.name}`,
                    foreground: text.color,
                    background: bg.color,
                    isLargeText: text.isLarge,
                    ratio,
                    passes,
                    grade
               });
          }
     }

     return combinations;
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
     return `${ratio.toFixed(2)}:1`;
}
