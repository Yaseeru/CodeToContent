# Color Contrast Compliance

## Overview

All text colors in CodeToContent meet WCAG AA contrast ratio requirements:
- **4.5:1** for normal text (< 18pt or < 14pt bold)
- **3:1** for large text (>= 18pt or >= 14pt bold)

This ensures the interface is accessible and readable for all users, including those with visual impairments.

## Verification

Run the contrast verification script to check all color combinations:

```bash
npx tsx scripts/verify-contrast.ts
```

This script tests all text/background combinations in both dark and light modes.

## Dark Mode Contrast Ratios

All combinations meet or exceed WCAG AA standards:

| Text Color | Background | Contrast Ratio | Grade |
|------------|------------|----------------|-------|
| Primary (#E6E6EB) | App (#0E0E11) | 15.49:1 | AAA |
| Primary (#E6E6EB) | Panel (#13131A) | 14.86:1 | AAA |
| Primary (#E6E6EB) | Elevated (#181820) | 14.18:1 | AAA |
| Secondary (#B3B3C2) | App (#0E0E11) | 9.31:1 | AAA |
| Secondary (#B3B3C2) | Panel (#13131A) | 8.93:1 | AAA |
| Secondary (#B3B3C2) | Elevated (#181820) | 8.52:1 | AAA |
| Muted (#8A8A9B) | App (#0E0E11) | 5.68:1 | AA |
| Muted (#8A8A9B) | Panel (#13131A) | 5.45:1 | AA |
| Muted (#8A8A9B) | Elevated (#181820) | 5.20:1 | AA |
| Disabled (#808090) | App (#0E0E11) | 4.96:1 | AA |
| Disabled (#808090) | Panel (#13131A) | 4.76:1 | AA |
| Disabled (#808090) | Elevated (#181820) | 4.54:1 | AA |

## Light Mode Contrast Ratios

All combinations meet or exceed WCAG AA standards:

| Text Color | Background | Contrast Ratio | Grade |
|------------|------------|----------------|-------|
| Primary (#1C1C22) | App (#FAFAFB) | 16.25:1 | AAA |
| Primary (#1C1C22) | Panel (#FFFFFF) | 16.95:1 | AAA |
| Primary (#1C1C22) | Elevated (#F3F3F6) | 15.31:1 | AAA |
| Secondary (#4A4A55) | App (#FAFAFB) | 8.38:1 | AAA |
| Secondary (#4A4A55) | Panel (#FFFFFF) | 8.74:1 | AAA |
| Secondary (#4A4A55) | Elevated (#F3F3F6) | 7.89:1 | AAA |
| Muted (#6A6A78) | App (#FAFAFB) | 5.10:1 | AA |
| Muted (#6A6A78) | Panel (#FFFFFF) | 5.32:1 | AA |
| Muted (#6A6A78) | Elevated (#F3F3F6) | 4.81:1 | AA |
| Disabled (#6A6A78) | App (#FAFAFB) | 5.10:1 | AA |
| Disabled (#6A6A78) | Panel (#FFFFFF) | 5.32:1 | AA |
| Disabled (#6A6A78) | Elevated (#F3F3F6) | 4.81:1 | AA |

## Color Adjustments Made

### Dark Mode
- **Disabled text**: Adjusted from `#5C5C6A` to `#808090` to meet 4.5:1 contrast ratio on all backgrounds

### Light Mode
- **Muted text**: Adjusted from `#7A7A88` to `#6A6A78` to meet 4.5:1 contrast ratio
- **Disabled text**: Adjusted from `#A0A0AE` to `#6A6A78` (same as muted) to meet 4.5:1 contrast ratio

## Design Considerations

### Disabled State
In light mode, disabled text uses the same color as muted text (`#6A6A78`). This is intentional:
- Maintains WCAG AA compliance
- Disabled elements should rely on other visual cues (opacity, cursor, etc.) rather than color alone
- Keeps the color palette minimal and consistent

### Primary and Secondary Text
Both primary and secondary text colors achieve AAA contrast ratios (7:1+), providing excellent readability for extended work sessions.

### Muted Text
Muted text (used for placeholders and labels) meets AA standards (4.5:1+) while remaining visually distinct from primary content.

## Utilities

The `lib/color-contrast.ts` module provides utilities for:
- Calculating contrast ratios between any two colors
- Checking WCAG AA/AAA compliance
- Verifying entire theme color palettes

### Example Usage

```typescript
import { getContrastRatio, meetsWCAGAA } from '@/lib/color-contrast';

// Calculate contrast ratio
const ratio = getContrastRatio('#E6E6EB', '#0E0E11');
console.log(ratio); // 15.49

// Check WCAG AA compliance
const passes = meetsWCAGAA('#E6E6EB', '#0E0E11', false);
console.log(passes); // true
```

## References

- [WCAG 2.0 Contrast Requirements](https://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Understanding WCAG 2.0 Success Criterion 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
