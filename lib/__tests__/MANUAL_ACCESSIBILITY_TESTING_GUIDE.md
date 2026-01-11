# Manual Accessibility Testing Guide
**Feature:** UI Redesign with Dark/Light Mode  
**Purpose:** Manual validation of accessibility features

---

## Overview

This guide provides step-by-step instructions for manually testing accessibility features that complement the automated test suite. While automated tests verify technical compliance, manual testing ensures real-world usability with assistive technologies.

---

## 1. Keyboard-Only Navigation Testing

### Objective
Verify that all functionality is accessible without a mouse.

### Test Procedure

#### 1.1 Basic Navigation
1. **Start at landing page**
   - Press `Tab` to move focus forward
   - Press `Shift+Tab` to move focus backward
   - Verify focus indicator is always visible (2px accent-colored border)
   - Verify tab order is logical (top to bottom, left to right)

2. **Expected Tab Order:**
   - Skip to content link (visible on focus)
   - Sign in with GitHub button
   - Footer links (if present)

#### 1.2 Dashboard Navigation
1. **Navigate to dashboard** (after sign-in)
2. **Test Sidebar:**
   - Tab to "Repositories" link → Press `Enter` to activate
   - Tab to "Settings" link → Press `Enter` to activate
   - Tab to sidebar collapse button → Press `Enter` to toggle

3. **Test Topbar:**
   - Tab to theme toggle button → Press `Enter` or `Space` to toggle theme
   - Tab to user menu → Press `Enter` to open dropdown
   - Press `Escape` to close dropdown
   - Tab to settings link

4. **Test Mobile Menu (resize to < 768px):**
   - Tab to hamburger menu → Press `Enter` to open sidebar
   - Press `Escape` to close sidebar

#### 1.3 Repository List
1. **Navigate to repository list**
2. Tab through repository cards
3. Press `Enter` on a repository to navigate

#### 1.4 Generate Page
1. **Navigate to generate page**
2. Tab through all interactive elements:
   - Generate button
   - Copy buttons in content preview
   - Any form inputs

3. **Test Button Activation:**
   - Press `Enter` on generate button
   - Press `Space` on generate button
   - Both should trigger the same action

### Success Criteria
- ✅ All interactive elements reachable via Tab
- ✅ Focus indicator always visible
- ✅ Tab order is logical
- ✅ Enter and Space activate buttons
- ✅ Escape closes modals/dropdowns
- ✅ No keyboard traps (can always tab away)

---

## 2. Screen Reader Testing

### Recommended Tools
- **Windows:** NVDA (free) or JAWS
- **macOS:** VoiceOver (built-in)
- **Linux:** Orca
- **Mobile:** TalkBack (Android), VoiceOver (iOS)

### Test Procedure

#### 2.1 NVDA Setup (Windows)
1. Download NVDA from https://www.nvaccess.org/
2. Install and launch NVDA
3. Press `Insert+Q` to quit NVDA when done

#### 2.2 VoiceOver Setup (macOS)
1. Press `Cmd+F5` to enable VoiceOver
2. Press `Cmd+F5` again to disable when done

#### 2.3 Screen Reader Tests

**Test 1: Page Structure**
1. Navigate to landing page
2. Use heading navigation (H key in NVDA, VO+Cmd+H in VoiceOver)
3. Verify headings are announced correctly:
   - H1: "CodeToContent" (or app name)
   - H2/H3: Section headings

**Test 2: Navigation Landmarks**
1. Use landmark navigation (D key in NVDA, VO+U in VoiceOver)
2. Verify landmarks are announced:
   - Navigation (sidebar)
   - Main content area
   - Header (topbar)

**Test 3: Button Labels**
1. Navigate to theme toggle button
2. Verify announced as: "Toggle theme, button"
3. Navigate to sidebar toggle
4. Verify announced as: "Toggle sidebar, button"
5. Navigate to hamburger menu (mobile)
6. Verify announced as: "Open menu, button"

**Test 4: Form Inputs**
1. Navigate to any form input
2. Verify label is announced before input
3. Verify input type is announced (e.g., "Email, edit text")

**Test 5: Dynamic Content**
1. Click generate button
2. Verify loading state is announced: "Loading"
3. Wait for completion
4. Verify success/error is announced

**Test 6: Theme Toggle**
1. Activate theme toggle button
2. Verify theme change is announced (if live region implemented)

### Success Criteria
- ✅ All headings announced correctly
- ✅ Landmarks identified properly
- ✅ All buttons have descriptive labels
- ✅ Form inputs have associated labels
- ✅ Dynamic content changes announced
- ✅ No "unlabeled" or "button" without description

---

## 3. Contrast Ratio Verification

### Tools
- **Browser DevTools:** Chrome/Edge DevTools Accessibility Panel
- **Online Tools:** WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- **Browser Extensions:** WAVE, axe DevTools

### Test Procedure

#### 3.1 Using Chrome DevTools
1. Open DevTools (F12)
2. Go to Elements tab
3. Select an element with text
4. Look at Styles panel → Computed → Accessibility
5. Verify contrast ratio is at least 4.5:1

#### 3.2 Manual Verification
Test these color combinations in both themes:

**Dark Theme:**
- Primary text (#E6E6E6) on primary background (#121926)
- Secondary text (#A0A0A0) on primary background (#121926)
- Code text (#C7D1FF) on secondary background (#1B2236)
- Accent (#4DA1FF) on primary background (#121926)

**Light Theme:**
- Primary text (#1A1A1A) on primary background (#FFFFFF)
- Secondary text (#666666) on primary background (#FFFFFF)
- Code text (#4A5568) on secondary background (#F5F7FA)
- Accent (#2563EB) on primary background (#FFFFFF)

### Success Criteria
- ✅ All text meets 4.5:1 minimum (WCAG AA)
- ✅ Large text (18pt+) meets 3:1 minimum
- ✅ Focus indicators meet 3:1 minimum

---

## 4. Reduced Motion Testing

### Test Procedure

#### 4.1 Enable Reduced Motion

**Windows 10/11:**
1. Settings → Ease of Access → Display
2. Turn on "Show animations in Windows"

**macOS:**
1. System Preferences → Accessibility → Display
2. Check "Reduce motion"

**Browser Override (for testing):**
```css
/* Add to DevTools → Sources → Overrides */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 4.2 Test Animations
1. Enable reduced motion preference
2. Toggle theme → Verify instant change (no transition)
3. Collapse/expand sidebar → Verify instant change
4. Hover over buttons → Verify instant change
5. All animations should be instant (0ms duration)

### Success Criteria
- ✅ Theme changes instantly
- ✅ Sidebar collapse/expand is instant
- ✅ Hover effects are instant
- ✅ No motion sickness triggers

---

## 5. Mobile Touch Target Testing

### Test Procedure

#### 5.1 Resize Browser
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)

#### 5.2 Measure Touch Targets
1. Inspect interactive elements
2. Verify minimum height: 44px
3. Verify minimum width: 44px (or full width for buttons)

#### 5.3 Test Elements
- Theme toggle button
- Sidebar toggle button
- Navigation items
- Primary buttons
- Secondary buttons
- Form inputs

### Success Criteria
- ✅ All interactive elements ≥ 44px height
- ✅ Adequate spacing between touch targets
- ✅ No accidental activations

---

## 6. Cross-Browser Testing

### Browsers to Test
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Test Procedure
For each browser:
1. Test keyboard navigation
2. Test focus indicators
3. Test theme toggle
4. Test responsive layout
5. Verify no visual regressions

### Success Criteria
- ✅ Consistent behavior across browsers
- ✅ Focus indicators visible in all browsers
- ✅ No layout issues

---

## 7. Responsive Testing

### Breakpoints to Test
- **Mobile:** 375px, 414px, 768px
- **Tablet:** 768px, 1024px
- **Desktop:** 1280px, 1920px

### Test Procedure
For each breakpoint:
1. Verify layout adapts correctly
2. Verify touch targets are adequate (mobile)
3. Verify text is readable
4. Verify no horizontal scrolling
5. Verify sidebar behavior:
   - Mobile: Hidden, opens as drawer
   - Tablet: Collapsed by default
   - Desktop: Expanded by default

### Success Criteria
- ✅ Layout adapts at all breakpoints
- ✅ No content overflow
- ✅ Touch targets adequate on mobile
- ✅ Sidebar behavior correct

---

## 8. Color Blindness Testing

### Tools
- **Browser Extensions:** 
  - Colorblindly (Chrome)
  - NoCoffee Vision Simulator (Chrome/Firefox)
- **Online Tools:** Coblis Color Blindness Simulator

### Test Procedure
1. Install color blindness simulator
2. Test with different types:
   - Protanopia (red-blind)
   - Deuteranopia (green-blind)
   - Tritanopia (blue-blind)
   - Monochromacy (total color blindness)

3. Verify information is not conveyed by color alone:
   - Error states have icon + text
   - Success states have icon + text
   - Status indicators have icon + text

### Success Criteria
- ✅ All information accessible without color
- ✅ Icons supplement color coding
- ✅ Text labels present for all states

---

## 9. Zoom and Text Scaling

### Test Procedure

#### 9.1 Browser Zoom
1. Zoom to 200% (Ctrl/Cmd + +)
2. Verify layout doesn't break
3. Verify no horizontal scrolling
4. Verify all content accessible

#### 9.2 Text Scaling (Browser Settings)
1. Increase text size in browser settings
2. Verify layout adapts
3. Verify no text overlap
4. Verify buttons still functional

### Success Criteria
- ✅ Layout works at 200% zoom
- ✅ No horizontal scrolling
- ✅ Text remains readable
- ✅ No content overlap

---

## 10. Skip to Content Link

### Test Procedure
1. Navigate to any page
2. Press `Tab` once (should focus skip link)
3. Verify skip link becomes visible
4. Press `Enter` to activate
5. Verify focus moves to main content

### Success Criteria
- ✅ Skip link is first focusable element
- ✅ Skip link visible on focus
- ✅ Skip link moves focus to main content
- ✅ Skip link hidden when not focused

---

## Testing Checklist

Use this checklist to track manual testing progress:

### Keyboard Navigation
- [ ] All elements reachable via Tab
- [ ] Focus indicators visible
- [ ] Tab order logical
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals

### Screen Reader
- [ ] Headings announced correctly
- [ ] Landmarks identified
- [ ] Buttons have labels
- [ ] Form inputs have labels
- [ ] Dynamic content announced

### Contrast
- [ ] Dark theme text contrast ≥ 4.5:1
- [ ] Light theme text contrast ≥ 4.5:1
- [ ] Focus indicators contrast ≥ 3:1

### Reduced Motion
- [ ] Theme changes instant
- [ ] Sidebar toggle instant
- [ ] Hover effects instant

### Touch Targets
- [ ] All elements ≥ 44px on mobile
- [ ] Adequate spacing

### Cross-Browser
- [ ] Chrome works correctly
- [ ] Firefox works correctly
- [ ] Safari works correctly
- [ ] Edge works correctly

### Responsive
- [ ] Mobile layout correct
- [ ] Tablet layout correct
- [ ] Desktop layout correct

### Color Blindness
- [ ] Information not color-only
- [ ] Icons supplement color

### Zoom
- [ ] 200% zoom works
- [ ] Text scaling works

### Skip Link
- [ ] Skip link visible on focus
- [ ] Skip link moves to main content

---

## Reporting Issues

If you find accessibility issues during manual testing:

1. **Document the issue:**
   - What: Describe the problem
   - Where: Which page/component
   - How: Steps to reproduce
   - Impact: Which users are affected

2. **Severity levels:**
   - **Critical:** Blocks access to core functionality
   - **High:** Significantly impacts usability
   - **Medium:** Minor usability issue
   - **Low:** Enhancement opportunity

3. **Create a test case:**
   - Add to automated test suite if possible
   - Document manual test procedure

---

## Resources

### WCAG Guidelines
- WCAG 2.1 Level AA: https://www.w3.org/WAI/WCAG21/quickref/

### Testing Tools
- NVDA: https://www.nvaccess.org/
- WAVE: https://wave.webaim.org/
- axe DevTools: https://www.deque.com/axe/devtools/
- Contrast Checker: https://webaim.org/resources/contrastchecker/

### Learning Resources
- WebAIM: https://webaim.org/
- A11y Project: https://www.a11yproject.com/
- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility

---

**Last Updated:** January 11, 2026  
**Next Review:** After major UI changes
