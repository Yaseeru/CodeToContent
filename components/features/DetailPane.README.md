# DetailPane Component

## Overview

The `DetailPane` component is an editor-like preview area for viewing and editing content with utility actions. It follows the developer-focused UI redesign principles with clean, functional styling and keyboard-first interaction.

## Features

- **24px padding** for comfortable reading and editing (Requirement 12.1)
- **Editable text area** with auto-save on blur (Requirement 12.3)
- **Utility actions**: Copy, Export, Regenerate
- **Monospace font** option for code-derived content (Requirement 12.4)
- **Clear separation** from UI chrome with subtle borders (Requirement 12.2)
- **Theme-appropriate styling** using design tokens
- **Keyboard accessibility** with visible focus indicators
- **ARIA labels** for screen readers

## Usage

### Basic Usage

```tsx
import { DetailPane } from "@/components/features/DetailPane"

function MyComponent() {
    const [content, setContent] = useState("Initial content")

    return (
        <DetailPane
            content={content}
            onContentChange={setContent}
            onSave={(newContent) => console.log("Saved:", newContent)}
        />
    )
}
```

### With All Features

```tsx
<DetailPane
    content={content}
    onContentChange={setContent}
    onSave={handleSave}
    onExport={handleExport}
    onRegenerate={handleRegenerate}
    title="Content Editor"
    placeholder="Start typing..."
    isCodeDerived={false}
    readOnly={false}
/>
```

### Read-Only Mode

```tsx
<DetailPane
    content={codeSnippet}
    isCodeDerived={true}
    readOnly={true}
    title="Code Preview"
/>
```

### Minimal Configuration

```tsx
<DetailPane
    content={content}
    onSave={handleSave}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | Required | The content to display and edit |
| `isCodeDerived` | `boolean` | `false` | Whether to use monospace font for code content |
| `onContentChange` | `(content: string) => void` | - | Callback when content changes (on every keystroke) |
| `onSave` | `(content: string) => void` | - | Callback when content is saved (on blur) |
| `onExport` | `() => void` | - | Callback for export action |
| `onRegenerate` | `() => void` | - | Callback for regenerate action |
| `readOnly` | `boolean` | `false` | Whether the pane is in read-only mode |
| `title` | `string` | - | Optional title for the detail pane |
| `placeholder` | `string` | `"No content to display"` | Placeholder text when content is empty |
| `className` | `string` | - | Additional CSS classes |

## Behavior

### Auto-Save

The component implements auto-save functionality:
1. User types in the textarea
2. `onContentChange` is called on every keystroke
3. When the textarea loses focus (blur), `onSave` is called with the current content
4. Only saves if content has changed since last save

### Copy to Clipboard

The copy button:
- Copies the current content to the clipboard
- Shows "Copied" feedback for 2 seconds
- Is disabled when content is empty

### Utility Actions

- **Copy**: Copies content to clipboard
- **Export**: Triggers the `onExport` callback (implementation up to parent)
- **Regenerate**: Triggers the `onRegenerate` callback (implementation up to parent)

All utility buttons are disabled when content is empty (except Regenerate).

## Styling

The component uses design tokens for consistent styling:

- **Padding**: 24px (`spacing.xl`) for content area, 16px (`spacing.lg`) for header
- **Border**: Subtle border using `border-border-subtle`
- **Background**: Panel background using `bg-bg-panel`
- **Typography**: 
  - Regular content: `font-primary`, `text-base`, `leading-relaxed`
  - Code content: `font-mono`, `text-sm`
- **Colors**: Theme-appropriate colors from design tokens
- **Transitions**: None (0ms) per design requirements

## Accessibility

The component follows WCAG AA standards:

- **ARIA labels**: All interactive elements have appropriate labels
- **Focus indicators**: Visible focus rings on focusable elements
- **Screen reader support**: Status announcements for unsaved changes
- **Keyboard navigation**: Full keyboard support for all actions
- **Semantic HTML**: Proper use of `role` attributes

## Requirements Validation

This component satisfies the following requirements from the design specification:

- **Requirement 12.1**: Clean editor styling with 24px padding
- **Requirement 12.2**: Clear separation from UI chrome
- **Requirement 12.3**: Editable text area with auto-save
- **Requirement 12.4**: Monospace font for code-derived content

## Demo

Visit `/detail-pane-demo` to see the component in action with various configurations.

## Examples

### Content Editor

```tsx
<DetailPane
    content={articleContent}
    onContentChange={setArticleContent}
    onSave={saveArticle}
    onExport={exportArticle}
    title="Article Editor"
    placeholder="Write your article here..."
/>
```

### Code Preview

```tsx
<DetailPane
    content={codeSnippet}
    isCodeDerived={true}
    readOnly={true}
    title="Generated Code"
    onRegenerate={regenerateCode}
/>
```

### Generated Content

```tsx
<DetailPane
    content={generatedContent}
    onSave={saveContent}
    onExport={exportContent}
    onRegenerate={regenerateContent}
    title="Generated Content"
    placeholder="Click 'Regenerate' to create content"
/>
```

## Integration

The DetailPane component is designed to work seamlessly with:

- **Command Bar**: For keyboard shortcuts and actions
- **List View**: For selecting content to display
- **Theme System**: Automatically adapts to dark/light mode
- **Design Tokens**: Uses centralized design system

## Best Practices

1. **Always provide `onSave`** if content is editable
2. **Use `isCodeDerived`** for code snippets and diffs
3. **Provide meaningful `title`** for context
4. **Use `readOnly`** for preview-only content
5. **Handle `onExport` and `onRegenerate`** appropriately for your use case
6. **Provide clear `placeholder`** text for empty states

## Notes

- The component maintains internal state for content to enable auto-save
- Content is synced with props when they change
- Unsaved changes are tracked and announced to screen readers
- All utility buttons respect the empty state
- The component is fully responsive and works on all screen sizes
