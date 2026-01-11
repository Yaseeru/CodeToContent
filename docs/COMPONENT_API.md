# Component API Reference

Complete API documentation for all UI components in the CodeToContent design system.

---

## ThemeProvider

Wraps the application to provide theme management.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | Child components |
| `defaultTheme` | `'dark' \| 'light' \| 'system'` | `'system'` | Initial theme |
| `storageKey` | `string` | `'theme-preference'` | localStorage key |

### Example

```tsx
<ThemeProvider defaultTheme="system" storageKey="theme-preference">
  <App />
</ThemeProvider>
```

---

## ThemeToggle

Button component for switching between dark and light themes.

### Props

No props. Uses internal theme state from `useTheme()`.

### Features

- Displays sun icon in dark mode
- Displays moon icon in light mode
- Includes ARIA label
- Hover and focus states
- Persists preference automatically

### Example

```tsx
<ThemeToggle />
```

---

## Button

Versatile button component with multiple variants, sizes, and states.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Button size |
| `loading` | `boolean` | `false` | Shows spinner, disables interaction |
| `disabled` | `boolean` | `false` | Disables button |
| `icon` | `ReactNode` | `undefined` | Icon to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon placement |
| `children` | `ReactNode` | Required | Button content |
| `className` | `string` | `undefined` | Additional CSS classes |
| `onClick` | `() => void` | `undefined` | Click handler |

Plus all standard HTML button attributes.

### Variants

**Primary**
- Background: `var(--accent)`
- Text: White
- Hover: `var(--accent-hover)`
- Use for: Main actions (Save, Submit, Create)

**Secondary**
- Background: `var(--background-tertiary)`
- Text: `var(--foreground)`
- Hover: Darker background
- Use for: Secondary actions (Cancel, Back)

**Ghost**
- Background: Transparent
- Text: `var(--foreground)`
- Hover: `var(--background-secondary)`
- Use for: Subtle actions (Learn More, View Details)

### Sizes

| Size | Height | Padding |
|------|--------|---------|
| `sm` | 36px | 12px horizontal |
| `default` | 40px | 16px horizontal |
| `lg` | 44px | 24px horizontal |

### States

**Loading**
- Displays spinner icon
- Disables interaction
- Sets `aria-busy="true"`

**Disabled**
- 50% opacity
- No pointer events
- Grayed out appearance

**Focus**
- 2px accent color ring
- Visible keyboard focus indicator

### Examples

```tsx
// Basic variants
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Learn More</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Saving...</Button>
<Button disabled>Disabled</Button>

// With icon
<Button icon={<Check />} iconPosition="left">
  Saved
</Button>

<Button icon={<ChevronRight />} iconPosition="right">
  Next
</Button>

// Full example
<Button
  variant="primary"
  size="lg"
  loading={isSubmitting}
  disabled={!isValid}
  onClick={handleSubmit}
  icon={<Check />}
  iconPosition="left"
>
  Submit Form
</Button>
```

---

## Card

Container component for grouping related content.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'interactive' \| 'outlined'` | `'default'` | Visual style |
| `padding` | `'none' \| 'sm' \| 'default' \| 'lg'` | `'default'` | Internal padding |
| `children` | `ReactNode` | Required | Card content |
| `className` | `string` | `undefined` | Additional CSS classes |
| `onClick` | `() => void` | `undefined` | Click handler (for interactive) |

Plus all standard HTML div attributes.

### Variants

**Default**
- Background: `var(--background-secondary)`
- Shadow: Subtle elevation
- Use for: Standard containers

**Interactive**
- Hover: Accent border, enhanced shadow
- Cursor: Pointer
- Use for: Clickable cards (repo cards, navigation)

**Outlined**
- Border: 1px solid `var(--border)`
- No shadow
- Use for: Subtle containers

### Padding Variants

| Padding | Value |
|---------|-------|
| `none` | 0 |
| `sm` | 8px |
| `default` | 16px |
| `lg` | 24px |

### Sub-components

**CardHeader**
- Padding: 24px
- Flex layout
- Use for: Card title section

**CardTitle**
- Typography: H3 (22px)
- Font weight: 600
- Use for: Card heading

**CardContent**
- Padding: 24px (top: 0)
- Use for: Main card content

### Examples

```tsx
// Basic card
<Card>
  <CardContent>
    Simple content
  </CardContent>
</Card>

// Full structure
<Card variant="default" padding="default">
  <CardHeader>
    <CardTitle>Repository Name</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-body">Description text</p>
    <span className="text-caption">Last updated: 2 days ago</span>
  </CardContent>
</Card>

// Interactive card
<Card variant="interactive" onClick={() => navigate('/repo/123')}>
  <CardContent>
    Clickable repository card
  </CardContent>
</Card>

// Outlined card
<Card variant="outlined" padding="lg">
  <CardContent>
    Outlined container
  </CardContent>
</Card>
```

---

## Input

Text input component with focus states and accessibility.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type |
| `value` | `string` | `undefined` | Controlled value |
| `onChange` | `(e) => void` | `undefined` | Change handler |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `disabled` | `boolean` | `false` | Disables input |
| `className` | `string` | `undefined` | Additional CSS classes |
| `aria-label` | `string` | Required | Accessibility label |

Plus all standard HTML input attributes.

### Features

- Height: 40px
- Border radius: 8px
- Background: `var(--background-tertiary)`
- Focus: 2px accent border
- Disabled: 50% opacity

### Examples

```tsx
// Basic input
<Input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  aria-label="Search repositories"
/>

// Email input
<Input
  type="email"
  placeholder="email@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  aria-label="Email address"
/>

// Disabled input
<Input
  type="text"
  value={value}
  disabled
  aria-label="Disabled input"
/>

// With description
<div>
  <Input
    type="text"
    aria-label="Username"
    aria-describedby="username-help"
  />
  <span id="username-help" className="text-caption">
    Choose a unique username
  </span>
</div>
```

---

## Icon

Base icon component. All specific icons extend this.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| number` | `'md'` | Icon size |
| `className` | `string` | `undefined` | Additional CSS classes |
| `aria-label` | `string` | `undefined` | Accessibility label |
| `aria-hidden` | `boolean` | `undefined` | Hide from screen readers |

Plus all standard SVG attributes.

### Size Mapping

| Size | Pixels |
|------|--------|
| `sm` | 16px |
| `md` | 24px |
| `lg` | 32px |
| Custom | Any number |

### Available Icons

- `Repository` - Folder with code
- `Settings` - Gear/cog
- `Sun` - Light mode indicator
- `Moon` - Dark mode indicator
- `ChevronLeft` - Left arrow
- `ChevronRight` - Right arrow
- `Copy` - Copy action
- `Check` - Success/checkmark
- `User` - User profile
- `LogOut` - Sign out
- `Menu` - Hamburger menu
- `X` - Close/cancel
- `Code` - Code content
- `FileText` - Text document
- `Spinner` - Loading (animated)
- `Star` - Favorites
- `AlertTriangle` - Warning/error

### Examples

```tsx
import { Repository, Settings, Check } from '@/components/ui/icons';

// Basic usage
<Repository size="md" />

// Custom size
<Settings size={20} />

// With styling
<Check className="text-accent" />

// Decorative (hidden from screen readers)
<Sun aria-hidden="true" />

// Standalone (needs label)
<button aria-label="Open settings">
  <Settings aria-hidden="true" />
</button>

// With visible text (icon is decorative)
<button>
  <Settings aria-hidden="true" />
  <span>Settings</span>
</button>
```

---

## Logo

Application logo component.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Logo size |
| `className` | `string` | `undefined` | Additional CSS classes |

### Features

- Minimal line-based design
- Uses accent color
- Scales appropriately
- SVG for crisp rendering

### Examples

```tsx
import { Logo } from '@/components/ui/Logo';

// In sidebar
<Logo size="md" />

// In landing page
<Logo size="lg" />

// Collapsed sidebar
<Logo size="sm" />
```

---

## useTheme Hook

Access and control theme state.

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `'dark' \| 'light' \| 'system'` | Current theme |
| `setTheme` | `(theme) => void` | Set theme |
| `systemTheme` | `'dark' \| 'light'` | System preference |
| `resolvedTheme` | `'dark' \| 'light'` | Actual applied theme |

### Example

```tsx
'use client';

import { useTheme } from 'next-themes';

export function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

---

## Typography Classes

Utility classes for consistent typography.

### Classes

| Class | Size | Weight | Line Height | Use Case |
|-------|------|--------|-------------|----------|
| `.text-h1` | 36px | 600 | 1.5 | Page titles |
| `.text-h2` | 28px | 600 | 1.5 | Section headings |
| `.text-h3` | 22px | 500 | 1.5 | Subsections |
| `.text-body` | 16px | 400 | 1.5 | Body text |
| `.text-caption` | 14px | 400 | 1.5 | Captions, metadata |

### Examples

```tsx
<h1 className="text-h1">Page Title</h1>
<h2 className="text-h2">Section Heading</h2>
<h3 className="text-h3">Subsection</h3>
<p className="text-body">Body text content</p>
<span className="text-caption">Metadata</span>
```

---

## Utility Classes

Additional utility classes for common patterns.

### Transitions

```tsx
// Color transitions (200ms)
<div className="transition-colors">

// All properties (200ms)
<div className="transition-all">

// Transform (200ms)
<div className="transition-transform">

// Opacity (200ms)
<div className="transition-opacity">
```

### Screen Reader Only

```tsx
// Hidden visually, visible to screen readers
<span className="sr-only">
  Hidden text for screen readers
</span>
```

### Container

```tsx
// Max width 1200px, centered, 24px padding
<div className="container">
  Content
</div>
```

---

## Best Practices

### Component Composition

```tsx
// ✅ Good - Compose components
<Card variant="interactive">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="primary">Action</Button>
  </CardContent>
</Card>

// ❌ Bad - Inline styles
<div style={{ background: '#1B2236', padding: '16px' }}>
  <button style={{ background: '#4DA1FF' }}>Action</button>
</div>
```

### Accessibility

```tsx
// ✅ Good - Proper ARIA labels
<button aria-label="Close dialog">
  <X aria-hidden="true" />
</button>

// ❌ Bad - No label
<button>
  <X />
</button>
```

### Responsive Design

```tsx
// ✅ Good - Mobile-first responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ Bad - Desktop-only
<div className="grid grid-cols-3">
```

### Theme-Aware Styling

```tsx
// ✅ Good - Use design tokens
<div className="bg-background-secondary text-foreground">

// ❌ Bad - Hardcoded colors
<div className="bg-[#1B2236] text-[#E6E6E6]">
```

---

## Migration Guide

### From CSS Modules to Design System

**Before:**
```tsx
import styles from './Component.module.css';

<div className={styles.card}>
  <button className={styles.button}>Click</button>
</div>
```

**After:**
```tsx
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

<Card>
  <CardContent>
    <Button variant="primary">Click</Button>
  </CardContent>
</Card>
```

### From Emojis to Icons

**Before:**
```tsx
<button>📚 Repositories</button>
<span>⚙️ Settings</span>
```

**After:**
```tsx
import { Repository, Settings } from '@/components/ui/icons';

<button>
  <Repository aria-hidden="true" />
  <span>Repositories</span>
</button>

<span>
  <Settings aria-hidden="true" />
  <span>Settings</span>
</span>
```

---

## Support

For questions or issues:
1. Check this API reference
2. Review [Design System Guide](DESIGN_SYSTEM.md)
3. Check [Quick Start Guide](QUICK_START.md)
4. Review component source code in `components/ui/`
