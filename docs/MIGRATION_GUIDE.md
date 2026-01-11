# Migration Guide

Guide for migrating existing code to use the CodeToContent design system.

---

## Overview

This guide helps you migrate from:
- CSS Modules → Tailwind + Design System
- Hardcoded colors → Design tokens
- Emojis → Professional icons
- Inline styles → Component library

---

## Quick Migration Checklist

- [ ] Replace CSS modules with Tailwind classes
- [ ] Replace hardcoded colors with design tokens
- [ ] Replace emojis with icons
- [ ] Use Button component instead of custom buttons
- [ ] Use Card component for containers
- [ ] Add proper ARIA labels
- [ ] Test keyboard navigation
- [ ] Verify responsive behavior

---

## CSS Modules → Tailwind

### Before: CSS Modules

```tsx
// Component.tsx
import styles from './Component.module.css';

export function Component() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Title</h2>
        <p className={styles.text}>Content</p>
      </div>
    </div>
  );
}
```

```css
/* Component.module.css */
.container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: #1B2236;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.title {
  font-size: 22px;
  font-weight: 500;
  margin-bottom: 8px;
}

.text {
  font-size: 16px;
  color: #A0A0A0;
}
```

### After: Tailwind + Design System

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export function Component() {
  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground-secondary">Content</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Benefits:**
- No separate CSS file needed
- Automatic theme switching
- Consistent styling
- Better maintainability

---

## Hardcoded Colors → Design Tokens

### Before: Hardcoded Colors

```tsx
<div style={{
  backgroundColor: '#1B2236',
  color: '#E6E6E6',
  borderColor: '#2A2F4A'
}}>
  Content
</div>
```

### After: Design Tokens

```tsx
<div className="bg-background-secondary text-foreground border border-[var(--border)]">
  Content
</div>
```

Or with CSS variables:

```css
.my-component {
  background-color: var(--background-secondary);
  color: var(--foreground);
  border-color: var(--border);
}
```

### Color Mapping

| Old Hardcoded | New Token | Tailwind Class |
|---------------|-----------|----------------|
| `#121926` | `--background` | `bg-background` |
| `#1B2236` | `--background-secondary` | `bg-background-secondary` |
| `#2A2F4A` | `--background-tertiary` | `bg-background-tertiary` |
| `#E6E6E6` | `--foreground` | `text-foreground` |
| `#A0A0A0` | `--foreground-secondary` | `text-foreground-secondary` |
| `#4DA1FF` | `--accent` | `bg-accent` or `text-accent` |

---

## Emojis → Icons

### Before: Emojis

```tsx
<button>📚 Repositories</button>
<button>⚙️ Settings</button>
<span>⭐ {starCount}</span>
<div>🔄 Loading...</div>
```

### After: Icons

```tsx
import { Repository, Settings, Star, Spinner } from '@/components/ui/icons';

<button>
  <Repository aria-hidden="true" />
  <span>Repositories</span>
</button>

<button>
  <Settings aria-hidden="true" />
  <span>Settings</span>
</button>

<span>
  <Star aria-hidden="true" />
  <span>{starCount}</span>
</span>

<div>
  <Spinner aria-hidden="true" />
  <span>Loading...</span>
</div>
```

### Emoji → Icon Mapping

| Emoji | Icon Component | Use Case |
|-------|----------------|----------|
| 📚 | `<Repository />` | Repositories |
| ⚙️ | `<Settings />` | Settings |
| ⭐ | `<Star />` | Stars/favorites |
| 🔄 | `<Spinner />` | Loading |
| ✅ | `<Check />` | Success |
| ❌ | `<X />` | Close/error |
| 📄 | `<FileText />` | Documents |
| 💻 | `<Code />` | Code |
| 👤 | `<User />` | User profile |
| 🚪 | `<LogOut />` | Sign out |
| ☀️ | `<Sun />` | Light mode |
| 🌙 | `<Moon />` | Dark mode |

---

## Custom Buttons → Button Component

### Before: Custom Button

```tsx
<button
  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
  onClick={handleClick}
>
  Save
</button>
```

### After: Button Component

```tsx
import { Button } from '@/components/ui/Button';

<Button
  variant="primary"
  onClick={handleClick}
>
  Save
</Button>
```

### Button Variants

```tsx
// Primary action
<Button variant="primary">Save</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Subtle action
<Button variant="ghost">Learn More</Button>

// With loading state
<Button loading={isLoading}>Saving...</Button>

// With icon
import { Check } from '@/components/ui/icons';
<Button icon={<Check />} iconPosition="left">
  Saved
</Button>
```

---

## Custom Cards → Card Component

### Before: Custom Card

```tsx
<div className="bg-gray-800 rounded-lg p-4 shadow-lg">
  <h3 className="text-xl font-semibold mb-2">Title</h3>
  <p className="text-gray-400">Content</p>
</div>
```

### After: Card Component

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-foreground-secondary">Content</p>
  </CardContent>
</Card>
```

### Card Variants

```tsx
// Standard card
<Card variant="default">Content</Card>

// Clickable card
<Card variant="interactive" onClick={handleClick}>
  Clickable content
</Card>

// Outlined card
<Card variant="outlined">Content</Card>
```

---

## Typography Migration

### Before: Custom Typography

```tsx
<h1 style={{ fontSize: '36px', fontWeight: 600 }}>Title</h1>
<h2 style={{ fontSize: '28px', fontWeight: 600 }}>Heading</h2>
<p style={{ fontSize: '16px' }}>Body text</p>
<span style={{ fontSize: '14px', color: '#A0A0A0' }}>Caption</span>
```

### After: Typography Classes

```tsx
<h1 className="text-h1">Title</h1>
<h2 className="text-h2">Heading</h2>
<p className="text-body">Body text</p>
<span className="text-caption text-foreground-secondary">Caption</span>
```

---

## Responsive Design Migration

### Before: Custom Breakpoints

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  Content
</div>
```

### After: Design System Breakpoints

```tsx
// Mobile: <768px, Tablet: 768-1023px, Desktop: 1024px+

<div className="w-full md:w-1/2 lg:w-1/3">
  Content
</div>

// Grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

---

## Accessibility Migration

### Before: Missing Accessibility

```tsx
<button onClick={handleClose}>
  ❌
</button>

<input
  type="text"
  placeholder="Search..."
/>
```

### After: Proper Accessibility

```tsx
import { X } from '@/components/ui/icons';

<button onClick={handleClose} aria-label="Close dialog">
  <X aria-hidden="true" />
</button>

<input
  type="text"
  placeholder="Search..."
  aria-label="Search repositories"
/>
```

### Accessibility Checklist

- [ ] Add `aria-label` to icon-only buttons
- [ ] Add `aria-hidden="true"` to decorative icons
- [ ] Use semantic HTML (`<nav>`, `<main>`, `<aside>`)
- [ ] Ensure focus states are visible
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Add `aria-live` regions for dynamic content
- [ ] Use `.sr-only` for screen-reader-only text

---

## Theme Support Migration

### Before: Single Theme

```tsx
<div style={{ background: '#1B2236', color: '#E6E6E6' }}>
  Content
</div>
```

### After: Theme-Aware

```tsx
<div className="bg-background-secondary text-foreground">
  Content
</div>
```

The component now automatically switches colors based on the active theme (dark/light).

### Adding Theme Toggle

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  return (
    <header className="flex justify-between items-center">
      <Logo />
      <ThemeToggle />
    </header>
  );
}
```

---

## Complete Migration Example

### Before: Old Component

```tsx
// OldComponent.tsx
import styles from './OldComponent.module.css';

export function OldComponent() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>📚 Repositories</h2>
        <p className={styles.description}>Browse your repositories</p>
        <button className={styles.button} onClick={handleClick}>
          View All
        </button>
      </div>
    </div>
  );
}
```

```css
/* OldComponent.module.css */
.container {
  padding: 24px;
}

.card {
  background: #1B2236;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.title {
  font-size: 22px;
  font-weight: 500;
  margin-bottom: 8px;
}

.description {
  font-size: 16px;
  color: #A0A0A0;
  margin-bottom: 16px;
}

.button {
  background: #4DA1FF;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.button:hover {
  background: #3390FF;
}
```

### After: New Component

```tsx
// NewComponent.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Repository } from '@/components/ui/icons';

export function NewComponent() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repository aria-hidden="true" />
            <span>Repositories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground-secondary mb-4">
            Browse your repositories
          </p>
          <Button variant="primary" onClick={handleClick}>
            View All
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Improvements:**
- ✅ No CSS module needed
- ✅ Theme-aware colors
- ✅ Professional icon instead of emoji
- ✅ Consistent component styling
- ✅ Proper accessibility
- ✅ Responsive by default

---

## Common Pitfalls

### ❌ Don't Mix Old and New Patterns

```tsx
// Bad - mixing inline styles with design system
<Card style={{ background: '#1B2236' }}>
  <Button variant="primary">Click</Button>
</Card>
```

```tsx
// Good - use design system consistently
<Card className="bg-background-secondary">
  <Button variant="primary">Click</Button>
</Card>
```

### ❌ Don't Hardcode Colors

```tsx
// Bad
<div className="bg-[#1B2236] text-[#E6E6E6]">

// Good
<div className="bg-background-secondary text-foreground">
```

### ❌ Don't Use Emojis

```tsx
// Bad
<button>⚙️ Settings</button>

// Good
import { Settings } from '@/components/ui/icons';
<button>
  <Settings aria-hidden="true" />
  <span>Settings</span>
</button>
```

### ❌ Don't Skip Accessibility

```tsx
// Bad - no label
<button onClick={handleClose}>
  <X />
</button>

// Good - proper label
<button onClick={handleClose} aria-label="Close">
  <X aria-hidden="true" />
</button>
```

---

## Testing After Migration

### Visual Testing

- [ ] Check component in dark mode
- [ ] Check component in light mode
- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768-1023px)
- [ ] Test on desktop (> 1024px)

### Functional Testing

- [ ] Test all interactive elements
- [ ] Test keyboard navigation (Tab, Enter, Space, Escape)
- [ ] Test with screen reader
- [ ] Test focus states
- [ ] Test loading states
- [ ] Test error states

### Performance Testing

- [ ] Check for layout shifts
- [ ] Verify smooth theme transitions
- [ ] Test with `prefers-reduced-motion`
- [ ] Check bundle size impact

---

## Getting Help

If you encounter issues during migration:

1. **Check Documentation**
   - [Design System Guide](DESIGN_SYSTEM.md)
   - [Quick Start Guide](QUICK_START.md)
   - [Component API Reference](COMPONENT_API.md)

2. **Review Examples**
   - Check existing migrated components
   - Look at component source code in `components/ui/`

3. **Common Issues**
   - Theme not switching? Check ThemeProvider is wrapping your app
   - Colors not working? Verify you're using design tokens
   - Icons not showing? Check import paths
   - Focus states missing? Ensure proper focus classes

---

## Migration Timeline

### Phase 1: Foundation (Week 1)
- [ ] Set up ThemeProvider
- [ ] Add ThemeToggle to header
- [ ] Migrate global styles to design tokens

### Phase 2: Components (Week 2-3)
- [ ] Migrate buttons to Button component
- [ ] Migrate cards to Card component
- [ ] Replace emojis with icons
- [ ] Update typography

### Phase 3: Pages (Week 4)
- [ ] Migrate landing page
- [ ] Migrate dashboard
- [ ] Migrate repository pages
- [ ] Migrate generate page

### Phase 4: Polish (Week 5)
- [ ] Add accessibility features
- [ ] Test responsive behavior
- [ ] Optimize performance
- [ ] Update documentation

---

## Success Criteria

Your migration is complete when:

- ✅ No CSS modules remain (except globals.css)
- ✅ All colors use design tokens
- ✅ No emojis in the UI
- ✅ All buttons use Button component
- ✅ All cards use Card component
- ✅ Theme switching works everywhere
- ✅ Keyboard navigation works
- ✅ WCAG AA contrast ratios met
- ✅ Responsive on all devices
- ✅ All tests passing
