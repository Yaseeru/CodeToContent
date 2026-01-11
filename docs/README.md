# CodeToContent Design System Documentation

Welcome to the CodeToContent design system documentation. This directory contains comprehensive guides for using and extending the design system.

---

## 📚 Documentation Index

### [Design System Guide](DESIGN_SYSTEM.md)
**Complete design system documentation**

The comprehensive guide covering all aspects of the design system:
- Theme system setup and usage
- Design tokens (colors, typography, spacing)
- Icon system with all available icons
- Component library with full examples
- Responsive design patterns
- Accessibility guidelines
- Best practices and examples

**Start here if:** You're new to the design system or need detailed information about any component.

---

### [Quick Start Guide](QUICK_START.md)
**Quick reference for common patterns**

A condensed reference guide with code snippets for:
- Theme system basics
- Color usage
- Typography classes
- Button variants
- Card components
- Icon usage
- Spacing patterns
- Responsive layouts
- Accessibility patterns

**Start here if:** You need a quick reminder of syntax or common patterns.

---

### [Component API Reference](COMPONENT_API.md)
**Detailed API documentation for all components**

Complete API documentation including:
- All component props and types
- Variant descriptions
- Size specifications
- State behaviors
- Usage examples
- Sub-component APIs
- Hook documentation
- Utility class reference

**Start here if:** You need detailed information about a specific component's API.

---

### [Migration Guide](MIGRATION_GUIDE.md)
**Guide for migrating existing code**

Step-by-step migration instructions for:
- CSS Modules → Tailwind
- Hardcoded colors → Design tokens
- Emojis → Professional icons
- Custom components → Design system components
- Accessibility improvements
- Complete migration examples
- Common pitfalls
- Testing checklist

**Start here if:** You're updating existing code to use the design system.

---

## 🚀 Quick Links

### Getting Started
1. Read the [Design System Guide](DESIGN_SYSTEM.md) overview
2. Set up the [Theme System](DESIGN_SYSTEM.md#theme-system)
3. Review [Design Tokens](DESIGN_SYSTEM.md#design-tokens)
4. Explore the [Component Library](DESIGN_SYSTEM.md#component-library)

### Common Tasks
- **Add a button**: [Button Component](COMPONENT_API.md#button)
- **Create a card**: [Card Component](COMPONENT_API.md#card)
- **Use an icon**: [Icon System](DESIGN_SYSTEM.md#icon-system)
- **Apply typography**: [Typography](DESIGN_SYSTEM.md#typography)
- **Make it responsive**: [Responsive Design](DESIGN_SYSTEM.md#responsive-design)
- **Ensure accessibility**: [Accessibility](DESIGN_SYSTEM.md#accessibility)

### Reference
- **All components**: [Component API Reference](COMPONENT_API.md)
- **Quick syntax**: [Quick Start Guide](QUICK_START.md)
- **Design tokens**: [Design System Guide - Design Tokens](DESIGN_SYSTEM.md#design-tokens)
- **Icons list**: [Design System Guide - Icon System](DESIGN_SYSTEM.md#icon-system)

---

## 🎨 Design System Overview

### Theme System
- **Dark/Light Mode**: Automatic theme switching with persistence
- **System Detection**: Respects browser preference
- **Smooth Transitions**: 200ms color transitions
- **No FOUC**: Prevents flash of unstyled content

### Design Tokens
All colors, spacing, and typography defined as CSS variables:
- **Colors**: Background, foreground, accent, borders
- **Typography**: 5-level scale (H1-H3, body, caption)
- **Spacing**: Consistent padding and gaps
- **Responsive**: Mobile, tablet, desktop breakpoints

### Component Library
Professional, accessible components:
- **Button**: 3 variants, 3 sizes, loading states
- **Card**: Interactive, outlined, default variants
- **Input**: Focus states, disabled states
- **Icons**: 17+ professional line icons
- **Typography**: Consistent text styles

### Accessibility
WCAG AA compliant:
- Contrast ratios ≥ 4.5:1
- Keyboard navigation
- Screen reader support
- ARIA labels
- Semantic HTML
- Reduced motion support

---

## 📖 Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── DESIGN_SYSTEM.md       # Complete design system guide
├── QUICK_START.md         # Quick reference guide
├── COMPONENT_API.md       # Component API reference
└── MIGRATION_GUIDE.md     # Migration guide
```

---

## 🎯 Best Practices

### Do's ✅
- Use design tokens for colors
- Use typography scale classes
- Use the Icon system (no emojis)
- Include ARIA labels
- Test keyboard navigation
- Respect `prefers-reduced-motion`
- Use semantic HTML

### Don'ts ❌
- Don't use inline styles
- Don't hardcode colors
- Don't use emojis
- Don't skip ARIA labels
- Don't create custom icons without following the template
- Don't override design tokens without good reason

---

## 🔍 Finding What You Need

### "How do I...?"

**...add a theme toggle?**
→ [Design System Guide - Theme System](DESIGN_SYSTEM.md#theme-system)

**...use the right colors?**
→ [Design System Guide - Design Tokens](DESIGN_SYSTEM.md#design-tokens)

**...create a button?**
→ [Quick Start Guide - Buttons](QUICK_START.md#buttons)

**...add an icon?**
→ [Quick Start Guide - Icons](QUICK_START.md#icons)

**...make it responsive?**
→ [Quick Start Guide - Responsive](QUICK_START.md#responsive)

**...ensure accessibility?**
→ [Design System Guide - Accessibility](DESIGN_SYSTEM.md#accessibility)

**...migrate old code?**
→ [Migration Guide](MIGRATION_GUIDE.md)

### "What are the props for...?"

**...Button component?**
→ [Component API - Button](COMPONENT_API.md#button)

**...Card component?**
→ [Component API - Card](COMPONENT_API.md#card)

**...Icon component?**
→ [Component API - Icon](COMPONENT_API.md#icon)

**...Input component?**
→ [Component API - Input](COMPONENT_API.md#input)

---

## 💡 Examples

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

More examples in each guide!

---

## 🆘 Support

### Getting Help

1. **Check the documentation** - Most questions are answered here
2. **Review component source** - Check `components/ui/` for implementation details
3. **Check the spec** - See `.kiro/specs/ui-redesign-dark-light-mode/` for requirements and design

### Common Issues

**Theme not switching?**
→ Ensure ThemeProvider wraps your app in `app/layout.tsx`

**Colors not working?**
→ Verify you're using design tokens, not hardcoded colors

**Icons not showing?**
→ Check import paths: `@/components/ui/icons`

**Focus states missing?**
→ Ensure proper focus classes on interactive elements

---

## 📝 Contributing

When adding new components or patterns:

1. Follow existing component structure
2. Use design tokens for all colors
3. Include all size/variant options
4. Add proper TypeScript types
5. Include ARIA labels
6. Test keyboard navigation
7. Document in this guide
8. Add examples

---

## 🎓 Learning Path

### Beginner
1. Read [Design System Guide - Overview](DESIGN_SYSTEM.md#overview)
2. Set up [Theme System](DESIGN_SYSTEM.md#theme-system)
3. Learn [Design Tokens](DESIGN_SYSTEM.md#design-tokens)
4. Try [Quick Start Examples](QUICK_START.md)

### Intermediate
1. Explore [Component Library](DESIGN_SYSTEM.md#component-library)
2. Study [Responsive Design](DESIGN_SYSTEM.md#responsive-design)
3. Review [Component API Reference](COMPONENT_API.md)
4. Practice with real components

### Advanced
1. Master [Accessibility](DESIGN_SYSTEM.md#accessibility)
2. Create custom components
3. Extend the design system
4. Help others migrate code

---

## 📊 Design System Stats

- **Components**: 8+ reusable components
- **Icons**: 17+ professional line icons
- **Design Tokens**: 13+ color variables per theme
- **Typography Levels**: 5 (H1, H2, H3, body, caption)
- **Breakpoints**: 3 (mobile, tablet, desktop)
- **Themes**: 2 (dark, light)
- **Accessibility**: WCAG AA compliant

---

## 🔗 Related Resources

- **Main README**: [../README.md](../README.md)
- **Design Spec**: [../.kiro/specs/ui-redesign-dark-light-mode/design.md](../.kiro/specs/ui-redesign-dark-light-mode/design.md)
- **Requirements**: [../.kiro/specs/ui-redesign-dark-light-mode/requirements.md](../.kiro/specs/ui-redesign-dark-light-mode/requirements.md)
- **Tasks**: [../.kiro/specs/ui-redesign-dark-light-mode/tasks.md](../.kiro/specs/ui-redesign-dark-light-mode/tasks.md)

---

**Happy coding! 🚀**
