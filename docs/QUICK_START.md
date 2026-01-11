# Design System Quick Start

A quick reference guide for using the CodeToContent design system.

## 🎨 Theme System

### Add Theme Toggle
```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

<ThemeToggle />
```

### Access Theme State
```tsx
'use client';
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
```

## 🎯 Colors

Use CSS variables or Tailwind classes:

```tsx
// CSS Variables
<div style={{ backgroundColor: 'var(--background-secondary)' }} />

// Tailwind
<div className="bg-background-secondary text-foreground" />
```

**Available Colors:**
- `--background`, `--background-secondary`, `--background-tertiary`
- `--foreground`, `--foreground-secondary`, `--foreground-code`
- `--accent`, `--accent-hover`
- `--border`, `--border-focus`

## 📝 Typography

```tsx
<h1 className="text-h1">Page Title (36px)</h1>
<h2 className="text-h2">Section (28px)</h2>
<h3 className="text-h3">Subsection (22px)</h3>
<p className="text-body">Body text (16px)</p>
<span className="text-caption">Metadata (14px)</span>
```

## 🔘 Buttons

```tsx
import { Button } from '@/components/ui/Button';
import { Check } from '@/components/ui/icons';

// Basic
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Learn More</Button>

// With states
<Button loading>Saving...</Button>
<Button disabled>Disabled</Button>

// With icon
<Button icon={<Check />} iconPosition="left">
  Saved
</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

## 🃏 Cards

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

<Card variant="default" padding="default">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Variants
<Card variant="interactive" onClick={handleClick}>Clickable</Card>
<Card variant="outlined">Outlined</Card>
```

## 🎨 Icons

```tsx
import { Repository, Settings, Sun, Moon, Check, Copy } from '@/components/ui/icons';

// Basic usage
<Repository size="md" />

// Sizes
<Icon size="sm" />  {/* 16px */}
<Icon size="md" />  {/* 24px */}
<Icon size="lg" />  {/* 32px */}
<Icon size={20} />  {/* Custom */}

// With styling
<Settings className="text-accent hover:text-accent-hover" />

// Accessibility
<button aria-label="Close">
  <X aria-hidden="true" />
</button>
```

## 📏 Spacing

```tsx
// Global padding (24px desktop, 16px mobile)
<div className="px-6 md:px-4">

// Component spacing (16px)
<div className="space-y-4">

// Internal spacing (8px)
<div className="gap-2">

// Grid gap (24px)
<div className="grid gap-6">
```

## 📱 Responsive

```tsx
// Breakpoints: mobile (<768px), tablet (768-1023px), desktop (1024px+)

// Stack on mobile, row on desktop
<div className="flex flex-col lg:flex-row">

// Grid columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Hide/show
<div className="hidden lg:block">Desktop only</div>
<div className="block lg:hidden">Mobile only</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

## ♿ Accessibility

```tsx
// Focus states (automatic on Button, Input)
<button className="focus:ring-2 focus:ring-accent">

// ARIA labels
<button aria-label="Close dialog">
  <X aria-hidden="true" />
</button>

// Form labels
<input aria-label="Search" aria-describedby="help-text" />
<span id="help-text">Enter search term</span>

// Live regions
<div aria-live="polite">{message}</div>

// Screen reader only
<span className="sr-only">Hidden text</span>

// Semantic HTML
<nav>...</nav>
<main>...</main>
<aside>...</aside>
```

## 🎭 Complete Example

```tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Check, X } from '@/components/ui/icons';

export function MyComponent() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle className="text-h3">Form Title</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter text..."
            aria-label="Form input"
          />
          
          <div className="flex gap-2">
            <Button
              variant="primary"
              loading={loading}
              icon={<Check />}
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

## 📚 Full Documentation

For complete documentation, see [Design System Guide](DESIGN_SYSTEM.md).

## 🚫 Don'ts

- ❌ Don't use inline styles
- ❌ Don't hardcode colors (use design tokens)
- ❌ Don't use emojis (use icons)
- ❌ Don't skip ARIA labels on icon-only buttons
- ❌ Don't create custom icons without following the template

## ✅ Do's

- ✅ Use design tokens for colors
- ✅ Use typography scale classes
- ✅ Use the Icon system
- ✅ Include ARIA labels
- ✅ Test keyboard navigation
- ✅ Respect `prefers-reduced-motion`
