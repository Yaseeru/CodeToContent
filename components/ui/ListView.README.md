# ListView Component

A dense, keyboard-navigable list component following the developer-focused UI redesign principles.

## Features

- **Dense Layout**: 8px gap between items (Requirements 2.5, 9.1)
- **Consistent Padding**: 8px vertical, 12px horizontal padding on items (Requirements 2.5)
- **Subtle Interactions**: Subtle hover highlight and clear selected state (Requirements 9.2, 9.3)
- **Keyboard Navigation**: Full keyboard support with arrow keys, Enter, Home, End (Requirements 9.4, 14.5)
- **Accessibility**: Visible focus indicators and proper ARIA attributes (Requirements 14.5, 15.1)
- **Disabled Items**: Support for disabled items that are skipped during navigation
- **Empty State**: Customizable empty state message

## Usage

### Basic Example

```tsx
import { ListView, ListViewItem } from '@/components/ui/ListView';

const items: ListViewItem[] = [
  { id: '1', content: 'Item 1' },
  { id: '2', content: 'Item 2' },
  { id: '3', content: 'Item 3' },
];

function MyComponent() {
  const [selectedId, setSelectedId] = useState<string>();

  return (
    <ListView
      items={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      aria-label="My list"
    />
  );
}
```

### With Rich Content

```tsx
const items: ListViewItem[] = [
  {
    id: '1',
    content: (
      <div>
        <div className="font-semibold">Title</div>
        <div className="text-sm text-text-muted">Description</div>
      </div>
    ),
  },
];
```

### With Disabled Items

```tsx
const items: ListViewItem[] = [
  { id: '1', content: 'Active Item' },
  { id: '2', content: 'Disabled Item', disabled: true },
  { id: '3', content: 'Active Item' },
];
```

### With Actions

Use `onItemAction` instead of `onSelect` when you want to trigger an action (like opening a detail view) rather than just selecting:

```tsx
<ListView
  items={items}
  onItemAction={(id) => router.push(`/detail/${id}`)}
  aria-label="Actionable list"
/>
```

### Empty State

```tsx
<ListView
  items={[]}
  emptyMessage="No items to display"
  aria-label="Empty list"
/>
```

## Props

### `items` (required)

Array of list items to display.

```typescript
interface ListViewItem {
  id: string;
  content: React.ReactNode;
  disabled?: boolean;
}
```

### `selectedId` (optional)

ID of the currently selected item. When provided, the item will be visually highlighted.

### `onSelect` (optional)

Callback fired when an item is selected (clicked or Enter pressed).

```typescript
onSelect?: (id: string) => void
```

### `onItemAction` (optional)

Callback fired when an item action is triggered. Takes precedence over `onSelect` if both are provided.

```typescript
onItemAction?: (id: string) => void
```

### `className` (optional)

Additional CSS classes to apply to the list container.

### `emptyMessage` (optional)

Message to display when the list is empty. Defaults to "No items to display".

### `aria-label` (optional)

Accessible label for the list. Defaults to "List view".

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↓` / `ArrowDown` | Move to next item (wraps to first) |
| `↑` / `ArrowUp` | Move to previous item (wraps to last) |
| `Enter` / `Space` | Select/action current item |
| `Home` | Move to first item |
| `End` | Move to last item |

## Styling

The ListView component uses design tokens for consistent styling:

- **Gap**: `gap-sm` (8px) between items
- **Padding**: `py-sm px-md` (8px vertical, 12px horizontal) on items
- **Border Radius**: `rounded-list` (4px) on items
- **Hover**: `rgba(110,110,128,0.05)` background
- **Selected**: `rgba(110,110,128,0.1)` background
- **Focus**: `ring-2 ring-border-focus` outline

## Accessibility

The ListView component follows WCAG accessibility guidelines:

- Proper ARIA roles (`list`, `listitem`)
- ARIA attributes (`aria-selected`, `aria-disabled`, `aria-label`)
- Keyboard navigation support
- Visible focus indicators
- Screen reader friendly

## Design Requirements

This component satisfies the following requirements from the developer-focused UI redesign:

- **2.5**: 8px gap between list items
- **9.1**: Dense list layout
- **9.2**: Subtle hover highlight
- **9.3**: Clear selected state styling
- **9.4**: Keyboard navigation (arrow keys, Enter)
- **14.5**: Visible focus indicators
- **15.1**: Clear focus outlines using theme-appropriate colors

## Examples

See the demo page at `/listview-demo` for interactive examples.

See `components/features/RepoListView.tsx` for a real-world example of using ListView with repository data.
