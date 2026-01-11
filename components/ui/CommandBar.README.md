# CommandBar Component

## Overview

The CommandBar is the primary interaction surface for search, navigation, and actions in the CodeToContent application. It follows the developer-focused UI redesign principles with keyboard-first interaction, instant theme switching, and flat, minimal styling.

## Features

- **48px height** with flat styling and subtle border bottom
- **Keyboard focus** with `/` key shortcut
- **Fuzzy search** capability across repos, commits, and actions
- **Keyboard navigation** with arrow keys, Enter, and Escape
- **Integrated theme toggle** for instant dark/light mode switching
- **No animations or transitions** for instant responsiveness
- **Accessible** with proper ARIA labels and keyboard support

## Requirements

Validates the following requirements from the specification:
- **1.2**: Command Bar as primary interaction surface
- **6.4**: Theme toggle access via command bar
- **14.3**: Command-driven interactions through Command Bar

## Usage

### Basic Usage

```tsx
import { CommandBar } from '@/components/ui/CommandBar';

export default function MyPage() {
     return (
          <div>
               <CommandBar onSearch={(query) => console.log(query)} />
               {/* Rest of your page content */}
          </div>
     );
}
```

### With Search Handler

```tsx
import { CommandBar } from '@/components/ui/CommandBar';
import { useState } from 'react';

export default function SearchPage() {
     const [results, setResults] = useState([]);

     const handleSearch = (query: string) => {
          // Implement your search logic here
          const filtered = myData.filter(item => 
               item.toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered);
     };

     return (
          <div>
               <CommandBar 
                    onSearch={handleSearch}
                    placeholder="Search repos, commits, actions..."
               />
               {/* Display results */}
          </div>
     );
}
```

### Custom Placeholder

```tsx
<CommandBar 
     onSearch={handleSearch}
     placeholder="Type to search..."
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSearch` | `(query: string) => void` | `undefined` | Callback function called when search query changes |
| `placeholder` | `string` | `"Search repos, commits, actions..."` | Placeholder text for the search input |
| `className` | `string` | `undefined` | Additional CSS classes to apply to the container |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus the search input (from anywhere on the page) |
| `Escape` | Clear search and blur the input |
| `Cmd/Ctrl + Shift + T` | Toggle theme (via integrated ThemeToggle) |

## Design Tokens

The CommandBar uses the following design tokens:

- **Height**: `48px` (from `commandBar.height`)
- **Padding**: `8px` vertical, `16px` horizontal (from `spacing.sm` and `spacing.lg`)
- **Background**: Panel color (from theme)
- **Border**: Subtle border bottom (from theme)
- **Typography**: `13px` base text (from `fontSize.sm`)

## Styling

The CommandBar follows strict design principles:

- **Flat styling**: No gradients or shadows
- **Subtle border**: Only a bottom border for separation
- **No transitions**: Instant responsiveness (0ms transitions)
- **Theme-aware**: Automatically adapts to dark/light mode
- **Minimal padding**: Efficient use of space

## Accessibility

The CommandBar is fully accessible:

- **ARIA labels**: Proper labels for screen readers
- **Keyboard navigation**: Full keyboard support
- **Focus management**: Clear focus indicators
- **Role attributes**: Proper semantic HTML with `role="search"`

## Implementation Details

### Search Input Focus

The search input can be focused using the `/` key from anywhere on the page (except when already in an input or textarea). This provides quick access to search functionality without requiring mouse interaction.

### Clear Functionality

When text is entered, a clear button (X icon) appears on the right side of the input. Clicking it clears the search and refocuses the input.

### Keyboard Shortcut Hint

When the input is not focused and empty, a visual hint (`/`) appears on the right side to indicate the keyboard shortcut.

### Theme Toggle Integration

The CommandBar includes an integrated ThemeToggle component on the right side, providing instant theme switching without animations.

## Demo

A demo page is available at `/command-bar-demo` that showcases:
- Keyboard focus with `/` key
- Fuzzy search functionality
- Theme toggle integration
- Clear and blur functionality

## Related Components

- **ThemeToggle**: Integrated for instant theme switching
- **Search Icon**: Used for visual search indicator
- **X Icon**: Used for clear button

## Future Enhancements

Potential future enhancements (not in current scope):

- Arrow key navigation through search results
- Enter key to select highlighted result
- Recent searches history
- Search suggestions/autocomplete
- Keyboard shortcuts display (Cmd+K style)
- Command palette mode with actions

## Testing

The CommandBar should be tested for:

1. **Keyboard focus**: `/` key focuses the input
2. **Escape key**: Clears and blurs the input
3. **Search callback**: `onSearch` is called with correct query
4. **Clear button**: Appears when text is entered and clears on click
5. **Theme toggle**: Works correctly and instantly
6. **Accessibility**: ARIA labels and keyboard navigation work
7. **No transitions**: All interactions are instant (0ms)

## Notes

- The CommandBar is a client component (`'use client'`) due to keyboard event handling
- Search logic is not implemented in the component - it's provided via the `onSearch` callback
- The component follows the "functional > aesthetic" principle with minimal styling
- No animations or transitions are used for instant responsiveness
