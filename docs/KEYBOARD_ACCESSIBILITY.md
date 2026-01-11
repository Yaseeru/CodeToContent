# Keyboard Accessibility Guide

This document describes the keyboard accessibility features implemented in CodeToContent, following Requirements 14.1, 14.2, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4 from the design specification.

## Overview

CodeToContent is designed as a keyboard-first application where all primary actions are accessible via keyboard. Mouse interaction is optional for all core workflows.

## Global Keyboard Shortcuts

### Navigation
- **`/`** - Focus search input in Command Bar
- **`Escape`** - Close modal, clear search, or blur focused element

### View
- **`Cmd/Ctrl + Shift + T`** - Toggle between dark and light theme

### General
- **`Shift + ?`** - Show keyboard shortcuts help modal

## Component-Specific Keyboard Navigation

### Command Bar
- **Focus**: Press `/` from anywhere to focus the search input
- **Clear**: Press `Escape` to clear search and blur input
- **Navigate**: Use `Tab` to move between search and theme toggle

### List View
- **Navigate**: Use `↑` and `↓` arrow keys to move between items
- **Select**: Press `Enter` or `Space` to select/activate an item
- **Jump**: Press `Home` to jump to first item, `End` to jump to last item
- **Focus**: Items are automatically focused as you navigate with arrow keys

### Detail Pane
- **Edit**: Click or tab into the text area to start editing
- **Save**: Changes auto-save when you blur the text area (click outside or press `Tab`)
- **Actions**: Use `Tab` to navigate between utility buttons (Copy, Export, Regenerate)

### Modal Dialogs
- **Close**: Press `Escape` to close any modal
- **Navigate**: Use `Tab` to move between modal elements
- **Confirm**: Press `Enter` on focused buttons to activate

### Buttons
- **Activate**: Press `Enter` or `Space` when focused
- **Navigate**: Use `Tab` to move between buttons
- **Focus**: All buttons show a visible focus ring when focused

### Inputs
- **Focus**: Use `Tab` to focus input fields
- **Clear**: Some inputs have a clear button accessible via `Tab`
- **Submit**: Press `Enter` to submit forms (where applicable)

## Focus Management

### Focus Indicators
All focusable elements display a visible focus indicator:
- **Color**: Uses theme-appropriate border-focus color
- **Style**: 2px ring around the element
- **Visibility**: Always visible when element has keyboard focus

### Tab Order
The application follows a logical tab order:
1. Skip to main content link (visible only when focused)
2. Command Bar search input
3. Theme toggle button
4. List View items (if present)
5. Detail Pane content and actions (if present)
6. Modal elements (when modal is open)

### Skip Links
- **Skip to main content**: Press `Tab` on page load to reveal a skip link that jumps directly to the main content area

## ARIA Labels

### Interactive Elements Without Visible Text
All interactive elements without visible text include appropriate ARIA labels:
- **Icon buttons**: Include descriptive `aria-label` (e.g., "Toggle theme", "Close modal")
- **Decorative icons**: Marked with `aria-hidden="true"`
- **Loading states**: Include `aria-busy="true"` and `aria-live="polite"`

### Regions and Landmarks
- **Command Bar**: `role="search"` with `aria-label="Command bar"`
- **List View**: `role="region"` with `aria-label="List view"`
- **Detail Pane**: `role="region"` with `aria-label="Detail pane"`
- **Modals**: `role="dialog"` with `aria-modal="true"`

### Dynamic Content
- **Loading states**: Use `role="status"` with `aria-live="polite"`
- **Error messages**: Use `role="alert"` with `aria-live="assertive"`
- **Empty states**: Use `role="status"` with `aria-live="polite"`

## Keyboard Shortcuts Implementation

### Using Keyboard Shortcuts in Components

```typescript
import { useKeyboardShortcut } from '@/lib/hooks/useKeyboardShortcut';

function MyComponent() {
     useKeyboardShortcut({
          key: 's',
          modifiers: { ctrl: true },
          description: 'Save document',
          action: () => handleSave(),
          category: 'editing'
     });
     
     // Component implementation...
}
```

### Registering Multiple Shortcuts

```typescript
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcut';

function MyComponent() {
     useKeyboardShortcuts([
          {
               key: 's',
               modifiers: { ctrl: true },
               description: 'Save',
               action: () => handleSave(),
               category: 'editing'
          },
          {
               key: 'o',
               modifiers: { ctrl: true },
               description: 'Open',
               action: () => handleOpen(),
               category: 'editing'
          }
     ]);
     
     // Component implementation...
}
```

## Best Practices

### For Developers

1. **Always provide focus indicators**: Use the design system's focus ring styles
2. **Maintain logical tab order**: Ensure DOM order matches visual order
3. **Add ARIA labels to icon-only buttons**: Use descriptive labels
4. **Mark decorative icons as aria-hidden**: Prevent screen reader announcement
5. **Test with keyboard only**: Ensure all functionality is accessible without a mouse
6. **Use semantic HTML**: Prefer native elements (button, input, etc.) over divs with click handlers
7. **Handle Escape key**: Allow users to dismiss modals and clear focus
8. **Provide keyboard shortcuts**: For frequently used actions

### For Users

1. **Press `?`** to see all available keyboard shortcuts
2. **Use `Tab`** to navigate between interactive elements
3. **Use arrow keys** in lists for faster navigation
4. **Press `Escape`** to dismiss modals or clear focus
5. **Look for focus indicators** to see where you are in the interface

## Testing Keyboard Accessibility

### Manual Testing Checklist

- [ ] All interactive elements are reachable via `Tab`
- [ ] Tab order follows visual layout (top to bottom, left to right)
- [ ] Focus indicators are visible on all focusable elements
- [ ] All buttons can be activated with `Enter` or `Space`
- [ ] Modals can be closed with `Escape`
- [ ] Search can be focused with `/` and cleared with `Escape`
- [ ] Theme can be toggled with `Cmd/Ctrl + Shift + T`
- [ ] List items can be navigated with arrow keys
- [ ] Skip link appears when pressing `Tab` on page load
- [ ] No keyboard traps (can always navigate away from any element)

### Automated Testing

Property-based tests validate keyboard accessibility:
- `keyboard-navigation.property.test.ts` - Tests keyboard navigation completeness
- `aria-labels.property.test.ts` - Tests ARIA label presence

Run tests with:
```bash
npm test -- keyboard-navigation.property.test.ts
npm test -- aria-labels.property.test.ts
```

## Accessibility Standards Compliance

This implementation follows:
- **WCAG 2.1 Level AA**: All interactive elements are keyboard accessible
- **ARIA 1.2**: Proper use of ARIA roles, states, and properties
- **Keyboard Navigation**: All functionality available via keyboard
- **Focus Management**: Visible focus indicators and logical tab order

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
