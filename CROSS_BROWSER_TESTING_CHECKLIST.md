# Cross-Browser Testing Checklist

## Overview

This document provides a comprehensive checklist for manually testing the UI redesign across different browsers. Complete this checklist in Chrome, Firefox, Safari, and Edge.

## Test Environment Setup

### Browsers to Test
- [ ] Chrome (latest stable version)
- [ ] Firefox (latest stable version)
- [ ] Safari (latest stable version - macOS/iOS)
- [ ] Edge (latest stable version)

### Screen Sizes to Test
- [ ] Desktop: 1920x1080
- [ ] Tablet: 768x1024
- [ ] Mobile: 375x667

---

## 1. Theme System Testing

### Chrome
- [ ] Theme toggle switches between dark and light
- [ ] Theme persists after page reload
- [ ] System preference detection works on first load
- [ ] No flash of unstyled content (FOUC)
- [ ] Theme transitions smoothly (200ms)
- [ ] All colors render correctly in both themes

### Firefox
- [ ] Theme toggle switches between dark and light
- [ ] Theme persists after page reload
- [ ] System preference detection works on first load
- [ ] No flash of unstyled content (FOUC)
- [ ] Theme transitions smoothly (200ms)
- [ ] All colors render correctly in both themes

### Safari
- [ ] Theme toggle switches between dark and light
- [ ] Theme persists after page reload
- [ ] System preference detection works on first load
- [ ] No flash of unstyled content (FOUC)
- [ ] Theme transitions smoothly (200ms)
- [ ] All colors render correctly in both themes

### Edge
- [ ] Theme toggle switches between dark and light
- [ ] Theme persists after page reload
- [ ] System preference detection works on first load
- [ ] No flash of unstyled content (FOUC)
- [ ] Theme transitions smoothly (200ms)
- [ ] All colors render correctly in both themes

---

## 2. Icon Rendering

### Chrome
- [ ] All icons render as SVG (no emojis)
- [ ] Icons inherit color from parent (currentColor)
- [ ] Icons scale correctly at different sizes
- [ ] Icons are crisp and not pixelated
- [ ] Animated spinner rotates smoothly

### Firefox
- [ ] All icons render as SVG (no emojis)
- [ ] Icons inherit color from parent (currentColor)
- [ ] Icons scale correctly at different sizes
- [ ] Icons are crisp and not pixelated
- [ ] Animated spinner rotates smoothly

### Safari
- [ ] All icons render as SVG (no emojis)
- [ ] Icons inherit color from parent (currentColor)
- [ ] Icons scale correctly at different sizes
- [ ] Icons are crisp and not pixelated
- [ ] Animated spinner rotates smoothly

### Edge
- [ ] All icons render as SVG (no emojis)
- [ ] Icons inherit color from parent (currentColor)
- [ ] Icons scale correctly at different sizes
- [ ] Icons are crisp and not pixelated
- [ ] Animated spinner rotates smoothly

---

## 3. Typography

### Chrome
- [ ] Inter font loads correctly for UI text
- [ ] JetBrains Mono loads correctly for code
- [ ] All font sizes match specification (H1: 36px, H2: 28px, H3: 22px, Body: 16px, Caption: 14px)
- [ ] Line height is 1.5 for all text
- [ ] Font weights are correct (600 for H1/H2, 500 for H3)

### Firefox
- [ ] Inter font loads correctly for UI text
- [ ] JetBrains Mono loads correctly for code
- [ ] All font sizes match specification
- [ ] Line height is 1.5 for all text
- [ ] Font weights are correct

### Safari
- [ ] Inter font loads correctly for UI text
- [ ] JetBrains Mono loads correctly for code
- [ ] All font sizes match specification
- [ ] Line height is 1.5 for all text
- [ ] Font weights are correct

### Edge
- [ ] Inter font loads correctly for UI text
- [ ] JetBrains Mono loads correctly for code
- [ ] All font sizes match specification
- [ ] Line height is 1.5 for all text
- [ ] Font weights are correct

---

## 4. Layout and Responsiveness

### Chrome
- [ ] Sidebar collapses/expands smoothly
- [ ] Sidebar width is 240px expanded, 64px collapsed
- [ ] Topbar is 64px height and sticky
- [ ] Mobile hamburger menu works (<768px)
- [ ] Repository grid shows 3/2/1 columns at desktop/tablet/mobile
- [ ] No horizontal scrolling on mobile
- [ ] All touch targets are minimum 44px on mobile

### Firefox
- [ ] Sidebar collapses/expands smoothly
- [ ] Sidebar width is 240px expanded, 64px collapsed
- [ ] Topbar is 64px height and sticky
- [ ] Mobile hamburger menu works (<768px)
- [ ] Repository grid shows 3/2/1 columns at desktop/tablet/mobile
- [ ] No horizontal scrolling on mobile
- [ ] All touch targets are minimum 44px on mobile

### Safari
- [ ] Sidebar collapses/expands smoothly
- [ ] Sidebar width is 240px expanded, 64px collapsed
- [ ] Topbar is 64px height and sticky
- [ ] Mobile hamburger menu works (<768px)
- [ ] Repository grid shows 3/2/1 columns at desktop/tablet/mobile
- [ ] No horizontal scrolling on mobile
- [ ] All touch targets are minimum 44px on mobile

### Edge
- [ ] Sidebar collapses/expands smoothly
- [ ] Sidebar width is 240px expanded, 64px collapsed
- [ ] Topbar is 64px height and sticky
- [ ] Mobile hamburger menu works (<768px)
- [ ] Repository grid shows 3/2/1 columns at desktop/tablet/mobile
- [ ] No horizontal scrolling on mobile
- [ ] All touch targets are minimum 44px on mobile

---

## 5. Interactive Elements

### Chrome
- [ ] All buttons have hover states
- [ ] All buttons have visible focus states (2px accent border)
- [ ] Button loading states show spinner
- [ ] Disabled buttons have 50% opacity
- [ ] Input fields have focus states (2px accent border)
- [ ] Card hover effects work (border-accent/50)
- [ ] Dropdown menus open/close correctly

### Firefox
- [ ] All buttons have hover states
- [ ] All buttons have visible focus states (2px accent border)
- [ ] Button loading states show spinner
- [ ] Disabled buttons have 50% opacity
- [ ] Input fields have focus states (2px accent border)
- [ ] Card hover effects work (border-accent/50)
- [ ] Dropdown menus open/close correctly

### Safari
- [ ] All buttons have hover states
- [ ] All buttons have visible focus states (2px accent border)
- [ ] Button loading states show spinner
- [ ] Disabled buttons have 50% opacity
- [ ] Input fields have focus states (2px accent border)
- [ ] Card hover effects work (border-accent/50)
- [ ] Dropdown menus open/close correctly

### Edge
- [ ] All buttons have hover states
- [ ] All buttons have visible focus states (2px accent border)
- [ ] Button loading states show spinner
- [ ] Disabled buttons have 50% opacity
- [ ] Input fields have focus states (2px accent border)
- [ ] Card hover effects work (border-accent/50)
- [ ] Dropdown menus open/close correctly

---

## 6. Transitions and Animations

### Chrome
- [ ] Theme transitions are smooth (200ms)
- [ ] Sidebar collapse/expand animates smoothly (200ms)
- [ ] Hover transitions are smooth (200ms)
- [ ] Spinner animation rotates continuously
- [ ] No janky animations or layout shifts
- [ ] Prefers-reduced-motion disables animations

### Firefox
- [ ] Theme transitions are smooth (200ms)
- [ ] Sidebar collapse/expand animates smoothly (200ms)
- [ ] Hover transitions are smooth (200ms)
- [ ] Spinner animation rotates continuously
- [ ] No janky animations or layout shifts
- [ ] Prefers-reduced-motion disables animations

### Safari
- [ ] Theme transitions are smooth (200ms)
- [ ] Sidebar collapse/expand animates smoothly (200ms)
- [ ] Hover transitions are smooth (200ms)
- [ ] Spinner animation rotates continuously
- [ ] No janky animations or layout shifts
- [ ] Prefers-reduced-motion disables animations

### Edge
- [ ] Theme transitions are smooth (200ms)
- [ ] Sidebar collapse/expand animates smoothly (200ms)
- [ ] Hover transitions are smooth (200ms)
- [ ] Spinner animation rotates continuously
- [ ] No janky animations or layout shifts
- [ ] Prefers-reduced-motion disables animations

---

## 7. Code Diff Viewer

### Chrome
- [ ] JetBrains Mono font renders correctly
- [ ] Line numbers display correctly (48px width)
- [ ] Addition lines have correct background color
- [ ] Deletion lines have correct background color
- [ ] Horizontal scrolling works for long lines
- [ ] Syntax highlighting works (if applicable)

### Firefox
- [ ] JetBrains Mono font renders correctly
- [ ] Line numbers display correctly (48px width)
- [ ] Addition lines have correct background color
- [ ] Deletion lines have correct background color
- [ ] Horizontal scrolling works for long lines
- [ ] Syntax highlighting works (if applicable)

### Safari
- [ ] JetBrains Mono font renders correctly
- [ ] Line numbers display correctly (48px width)
- [ ] Addition lines have correct background color
- [ ] Deletion lines have correct background color
- [ ] Horizontal scrolling works for long lines
- [ ] Syntax highlighting works (if applicable)

### Edge
- [ ] JetBrains Mono font renders correctly
- [ ] Line numbers display correctly (48px width)
- [ ] Addition lines have correct background color
- [ ] Deletion lines have correct background color
- [ ] Horizontal scrolling works for long lines
- [ ] Syntax highlighting works (if applicable)

---

## 8. Accessibility

### Chrome
- [ ] Tab navigation works through all interactive elements
- [ ] Focus indicators are visible (2px accent border)
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] ARIA labels are present on icon-only buttons
- [ ] Screen reader announces dynamic content (test with ChromeVox)
- [ ] Color contrast meets WCAG AA (4.5:1)

### Firefox
- [ ] Tab navigation works through all interactive elements
- [ ] Focus indicators are visible (2px accent border)
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] ARIA labels are present on icon-only buttons
- [ ] Screen reader announces dynamic content (test with NVDA)
- [ ] Color contrast meets WCAG AA (4.5:1)

### Safari
- [ ] Tab navigation works through all interactive elements
- [ ] Focus indicators are visible (2px accent border)
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] ARIA labels are present on icon-only buttons
- [ ] Screen reader announces dynamic content (test with VoiceOver)
- [ ] Color contrast meets WCAG AA (4.5:1)

### Edge
- [ ] Tab navigation works through all interactive elements
- [ ] Focus indicators are visible (2px accent border)
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] ARIA labels are present on icon-only buttons
- [ ] Screen reader announces dynamic content (test with Narrator)
- [ ] Color contrast meets WCAG AA (4.5:1)

---

## 9. Performance

### Chrome
- [ ] Page loads in under 3 seconds
- [ ] Theme switching is instant (no lag)
- [ ] Scrolling is smooth (60fps)
- [ ] No memory leaks (check DevTools)
- [ ] No console errors or warnings

### Firefox
- [ ] Page loads in under 3 seconds
- [ ] Theme switching is instant (no lag)
- [ ] Scrolling is smooth (60fps)
- [ ] No memory leaks (check DevTools)
- [ ] No console errors or warnings

### Safari
- [ ] Page loads in under 3 seconds
- [ ] Theme switching is instant (no lag)
- [ ] Scrolling is smooth (60fps)
- [ ] No memory leaks (check Web Inspector)
- [ ] No console errors or warnings

### Edge
- [ ] Page loads in under 3 seconds
- [ ] Theme switching is instant (no lag)
- [ ] Scrolling is smooth (60fps)
- [ ] No memory leaks (check DevTools)
- [ ] No console errors or warnings

---

## 10. Edge Cases

### Chrome
- [ ] Empty states display correctly (no emojis)
- [ ] Loading states display correctly (spinner, no emojis)
- [ ] Error states display correctly (icon, no emojis)
- [ ] Very long repository names don't break layout
- [ ] Very long code lines scroll horizontally
- [ ] Rapid theme toggling doesn't break UI

### Firefox
- [ ] Empty states display correctly (no emojis)
- [ ] Loading states display correctly (spinner, no emojis)
- [ ] Error states display correctly (icon, no emojis)
- [ ] Very long repository names don't break layout
- [ ] Very long code lines scroll horizontally
- [ ] Rapid theme toggling doesn't break UI

### Safari
- [ ] Empty states display correctly (no emojis)
- [ ] Loading states display correctly (spinner, no emojis)
- [ ] Error states display correctly (icon, no emojis)
- [ ] Very long repository names don't break layout
- [ ] Very long code lines scroll horizontally
- [ ] Rapid theme toggling doesn't break UI

### Edge
- [ ] Empty states display correctly (no emojis)
- [ ] Loading states display correctly (spinner, no emojis)
- [ ] Error states display correctly (icon, no emojis)
- [ ] Very long repository names don't break layout
- [ ] Very long code lines scroll horizontally
- [ ] Rapid theme toggling doesn't break UI

---

## Known Browser-Specific Issues

### Chrome
- None identified

### Firefox
- None identified

### Safari
- None identified

### Edge
- None identified

---

## Testing Notes

### Chrome
[Add any observations or issues found during testing]

### Firefox
[Add any observations or issues found during testing]

### Safari
[Add any observations or issues found during testing]

### Edge
[Add any observations or issues found during testing]

---

## Sign-off

- [ ] Chrome testing complete - Tester: __________ Date: __________
- [ ] Firefox testing complete - Tester: __________ Date: __________
- [ ] Safari testing complete - Tester: __________ Date: __________
- [ ] Edge testing complete - Tester: __________ Date: __________

---

## Automated Test Results

Run the automated cross-browser compatibility tests:

```bash
npm test -- cross-browser.test.ts --run
```

All automated tests should pass before manual testing begins.
