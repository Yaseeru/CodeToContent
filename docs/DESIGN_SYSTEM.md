# Design System Documentation

## Overview

CodeToContent uses a comprehensive design system built on Tailwind CSS v4, featuring a dual-theme system (dark/light), professional line icons, consistent typography, and accessible components. This document provides complete guidance for using and extending the design system.

---

## Table of Contents

1. [Theme System](#theme-system)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Icon System](#icon-system)
5. [Component Library](#component-library)
6. [Spacing System](#spacing-system)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)

---

## Theme System

### Overview

The theme system provides seamless switching between dark and light modes with automatic persistence and system preference detection.

### Usage

#### Setting Up the Theme Provider

The `ThemeProvider` wraps your entire application and manages theme state:

```tsx
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="theme-preference">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Props:**
- `defaultTheme`: `'dark' | 'light' | 'system'` (default: `'system'`)
- `storageKey`: String for localStorage key (default: `'theme-preference'`)
- `children`: React nodes to wrap

#### Using the Theme Toggle

Add the `ThemeToggle` component to your UI:

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

The toggle automatically:
- Shows a sun icon in dark mode
- Shows a moon icon in light mode
- Includes proper ARIA labels
- Persists preference to localStorage

#### Accessing Theme State

Use the `useTheme` hook from `next-themes`:

```tsx
'use client';

import { useTheme } from 'next-themes';

export function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      Current theme: {theme}
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
    </div>
  );
}
```

### How It Works

1. **Initial Load**: Checks localStorage for saved preference
2. **No Preference**: Detects browser's `prefers-color-scheme`
3. **Theme Change**: Updates HTML class (`dark` or `light`)
4. **Persistence**: Saves preference to localStorage
5. **CSS Variables**: Automatically switches design tokens

### Preventing Flash of Unstyled Content (FOUC)

The system prevents FOUC by:
- Using `suppressHydrationWarning` on the HTML element
- Checking theme before first paint
- Disabling transitions during initial load

---

## Design Tokens

### Overview

Design tokens are CSS variables that define colors, spacing, and typography. They automatically switch based on the active theme.

### Color Tokens

#### Dark Theme (Default)

```css
--background: #121926;           /* Primary background */
--background-secondary: #1B2236; /* Cards, panels */
--background-tertiary: #2A2F4A;  /* Inputs, borders */

--foreground: #E6E6E6;           /* Primary text */
--foreground-secondary: #A0A0A0; /* Secondary text */
--foreground-code: #C7D1FF;      /* Code text */

--accent: #4DA1FF;               /* Buttons, links */
--accent-hover: #3390FF;         /* Hover states */

--border: #2A2F4A;               /* Default borders */
--border-focus: #4DA1FF;         /* Focus outlines */

--diff-add-bg: #29414D;          /* Added lines */
--diff-del-bg: #4D2C2C;          /* Deleted lines */
--diff-line-number: #666C87;     /* Line numbers */
```

#### Light Theme

```css
--background: #FFFFFF;           /* Primary background */
--background-secondary: #F5F7FA; /* Cards, panels */
--background-tertiary: #E8ECF1;  /* Inputs, borders */

--foreground: #1A1A1A;           /* Primary text */
--foreground-secondary: #666666; /* Secondary text */
--foreground-code: #4A5568;      /* Code text */

--accent: #2563EB;               /* Buttons, links */
--accent-hover: #1D4ED8;         /* Hover states */

--border: #E8ECF1;               /* Default borders */
--border-focus: #2563EB;         /* Focus outlines */

--diff-add-bg: #DBEAFE;          /* Added lines */
--diff-del-bg: #FEE2E2;          /* Deleted lines */
--diff-line-number: #94A3B8;     /* Line numbers */
```

### Using Design Tokens

#### In CSS

```css
.my-component {
  background-color: var(--background-secondary);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.my-button:hover {
  background-color: var(--accent-hover);
}
```

#### In Tailwind

Use the custom color names:

```tsx
<div className="bg-background-secondary text-foreground border border-[var(--border)]">
  Content
</div>
```

### Typography Tokens

```css
--font-sans: 'Inter', sans-serif;         /* UI text */
--font-mono: 'JetBrains Mono', monospace; /* Code */
```

---

## Typography

### Typography Scale

The system uses a consistent 5-level scale:

| Class | Size | Weight | Use Case |
|-------|------|--------|----------|
| `.text-h1` | 36px | 600 | Page titles |
| `.text-h2` | 28px | 600 | Section headings |
| `.text-h3` | 22px | 500 | Subsection headings |
| `.text-body` | 16px | 400 | Body text |
| `.text-caption` | 14px | 400 | Captions, metadata |

All typography has `line-height: 1.5` for readability.

### Usage

```tsx
<h1 className="text-h1">Page Title</h1>
<h2 className="text-h2">Section Heading</h2>
<h3 className="text-h3">Subsection</h3>
<p className="text-body">Body text content</p>
<span className="text-caption">Metadata</span>
```

### Font Families

- **UI Text**: Inter (sans-serif)
- **Code**: JetBrains Mono (monospace)

```tsx
<p className="font-sans">UI text</p>
<code className="font-mono">Code text</code>
```

---

## Icon System

### Overview

The icon system provides professional, mono-line SVG icons with consistent styling and accessibility features.

### Icon Specifications

- **ViewBox**: 24×24
- **Stroke Width**: 2px
- **Stroke Color**: `currentColor` (inherits from parent)
- **Fill**: None
- **Size Variants**: sm (16px), md (24px), lg (32px)

### Available Icons

| Icon | Component | Use Case |
|------|-----------|----------|
| Repository | `<Repository />` | Repo navigation |
| Settings | `<Settings />` | Settings menu |
| Sun | `<Sun />` | Light mode indicator |
| Moon | `<Moon />` | Dark mode indicator |
| ChevronLeft | `<ChevronLeft />` | Previous/collapse |
| ChevronRight | `<ChevronRight />` | Next/expand |
| Copy | `<Copy />` | Copy action |
| Check | `<Check />` | Success/copied |
| User | `<User />` | User profile |
| LogOut | `<LogOut />` | Sign out |
| Menu | `<Menu />` | Mobile menu |
| X | `<X />` | Close/cancel |
| Code | `<Code />` | Code content |
| FileText | `<FileText />` | Text content |
| Spinner | `<Spinner />` | Loading state |
| Star | `<Star />` | Favorites/stars |
| AlertTriangle | `<AlertTriangle />` | Warnings/errors |

### Usage

#### Basic Usage

```tsx
import { Repository, Settings, Sun } from '@/components/ui/icons';

<Repository size="md" />
<Settings size="lg" />
<Sun size="sm" />
```

#### Size Variants

```tsx
// Predefined sizes
<Icon size="sm" />  {/* 16px */}
<Icon size="md" />  {/* 24px (default) */}
<Icon size="lg" />  {/* 32px */}

// Custom size
<Icon size={20} />  {/* 20px */}
```

#### With Custom Styling

```tsx
<Repository 
  size="md" 
  className="text-accent hover:text-accent-hover"
/>
```

#### Accessibility

Icons automatically inherit color from their parent:

```tsx
{/* Decorative icon */}
<Sun aria-hidden="true" />

{/* Standalone icon with label */}
<button>
  <Settings aria-label="Open settings" />
</button>

{/* Icon with visible text */}
<button>
  <Settings aria-hidden="true" />
  <span>Settings</span>
</button>
```

### Creating Custom Icons

Follow this template:

```tsx
import { Icon, IconProps } from './Icon';

export function MyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      {/* Your SVG paths here */}
      <path d="M..." />
    </Icon>
  );
}
```

**Requirements:**
- Use the `Icon` base component
- Keep stroke-width at 2px
- Use `currentColor` for stroke
- No fill colors
- ViewBox must be 24×24

---

## Component Library

### Button

#### Variants

```tsx
import { Button } from '@/components/ui/Button';

{/* Primary - main actions */}
<Button variant="primary">Save</Button>

{/* Secondary - secondary actions */}
<Button variant="secondary">Cancel</Button>

{/* Ghost - subtle actions */}
<Button variant="ghost">Learn More</Button>
```

#### Sizes

```tsx
<Button size="sm">Small (36px)</Button>
<Button size="default">Default (40px)</Button>
<Button size="lg">Large (44px)</Button>
```

#### States

```tsx
{/* Loading state */}
<Button loading>Saving...</Button>

{/* Disabled state */}
<Button disabled>Disabled</Button>

{/* With icon */}
<Button icon={<Check />} iconPosition="left">
  Saved
</Button>
```

#### Full Example

```tsx
<Button
  variant="primary"
  size="lg"
  loading={isLoading}
  disabled={!isValid}
  onClick={handleSubmit}
  icon={<Check />}
  iconPosition="right"
>
  Submit
</Button>
```

### Card

#### Variants

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

{/* Default - standard card */}
<Card variant="default">
  <CardContent>Content</CardContent>
</Card>

{/* Interactive - clickable card */}
<Card variant="interactive" onClick={handleClick}>
  <CardContent>Clickable content</CardContent>
</Card>

{/* Outlined - border instead of shadow */}
<Card variant="outlined">
  <CardContent>Outlined content</CardContent>
</Card>
```

#### Padding Variants

```tsx
<Card padding="none">No padding</Card>
<Card padding="sm">Small padding (8px)</Card>
<Card padding="default">Default padding (16px)</Card>
<Card padding="lg">Large padding (24px)</Card>
```

#### Full Example

```tsx
<Card variant="interactive" padding="default">
  <CardHeader>
    <CardTitle>Repository Name</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-body">Description</p>
    <span className="text-caption">Last updated: 2 days ago</span>
  </CardContent>
</Card>
```

### Input

```tsx
import { Input } from '@/components/ui/Input';

<Input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  disabled={false}
  aria-label="Search repositories"
/>
```

**Features:**
- 40px height
- 8px border radius
- Focus state with 2px accent border
- Disabled state with 50% opacity
- Proper ARIA labels

---

## Spacing System

### Overview

The spacing system ensures consistent gaps and padding throughout the application.

### Spacing Scale

| Token | Desktop | Mobile | Use Case |
|-------|---------|--------|----------|
| Global Padding | 24px | 16px | Page margins |
| Component Spacing | 16px | 16px | Between sections |
| Internal Spacing | 8px | 8px | Within components |
| Grid Gap | 24px | 24px | Between grid items |

### Usage

```tsx
{/* Global padding */}
<div className="px-6 md:px-4">Content</div>

{/* Component spacing */}
<div className="space-y-4">
  <Section />
  <Section />
</div>

{/* Internal spacing */}
<div className="gap-2">
  <Item />
  <Item />
</div>

{/* Grid gap */}
<div className="grid gap-6">
  <Card />
  <Card />
</div>
```

---

## Responsive Design

### Breakpoints

| Name | Range | Tailwind Prefix |
|------|-------|-----------------|
| Mobile | 0-767px | (default) |
| Tablet | 768-1023px | `md:` |
| Desktop | 1024px+ | `lg:` |

### Responsive Patterns

#### Layout

```tsx
{/* Stack on mobile, side-by-side on desktop */}
<div className="flex flex-col lg:flex-row gap-4">
  <div className="w-full lg:w-1/2">Left</div>
  <div className="w-full lg:w-1/2">Right</div>
</div>
```

#### Grid

```tsx
{/* 1 column mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

#### Typography

```tsx
{/* Smaller on mobile, larger on desktop */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

#### Visibility

```tsx
{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">Desktop only</div>

{/* Show on mobile, hide on desktop */}
<div className="block lg:hidden">Mobile only</div>
```

---

## Accessibility

### WCAG AA Compliance

All text meets WCAG AA contrast requirements:
- **Minimum ratio**: 4.5:1 for normal text
- **Large text**: 3:1 for text ≥18px or ≥14px bold

### Keyboard Navigation

All interactive elements are keyboard accessible:

```tsx
{/* Proper focus states */}
<button className="focus:outline-none focus:ring-2 focus:ring-accent">
  Accessible Button
</button>

{/* Tab order */}
<div tabIndex={0}>Focusable div</div>
```

### ARIA Labels

```tsx
{/* Icon-only buttons */}
<button aria-label="Close dialog">
  <X aria-hidden="true" />
</button>

{/* Form inputs */}
<input
  type="text"
  aria-label="Search repositories"
  aria-describedby="search-help"
/>
<span id="search-help">Enter repository name</span>

{/* Live regions */}
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Semantic HTML

Use semantic elements for better screen reader support:

```tsx
<nav>Navigation</nav>
<main>Main content</main>
<aside>Sidebar</aside>
<article>Article content</article>
<section>Section content</section>
```

### Reduced Motion

The system respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}
```

### Screen Reader Only Content

```tsx
<span className="sr-only">
  This text is only visible to screen readers
</span>
```

---

## Best Practices

### Do's ✅

- Use design tokens instead of hardcoded colors
- Use typography scale classes for consistent sizing
- Use semantic HTML elements
- Include ARIA labels for icon-only buttons
- Test keyboard navigation
- Respect `prefers-reduced-motion`
- Use the Icon system (no emojis)

### Don'ts ❌

- Don't use inline styles
- Don't hardcode colors or sizes
- Don't use emojis in the UI
- Don't skip ARIA labels
- Don't create custom icons without following the template
- Don't override design tokens without good reason

---

## Examples

### Complete Component Example

```tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Check, X } from '@/components/ui/icons';

export function ExampleForm() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Submit logic
    setLoading(false);
  };

  return (
    <Card variant="default" padding="default">
      <CardHeader>
        <CardTitle>Example Form</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter value..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Form input"
          />
          
          <div className="flex gap-2">
            <Button
              variant="primary"
              loading={loading}
              onClick={handleSubmit}
              icon={<Check />}
              iconPosition="left"
            >
              Submit
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setValue('')}
              icon={<X />}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Support

For questions or issues with the design system:
1. Check this documentation
2. Review component source code in `components/ui/`
3. Check the design spec at `.kiro/specs/ui-redesign-dark-light-mode/design.md`
