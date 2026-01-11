import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * ListView Component
 * 
 * A dense, keyboard-navigable list component following the developer-focused UI redesign.
 * 
 * Features:
 * - Dense layout with 8px gap between items (Requirements 2.5)
 * - 8px vertical, 12px horizontal padding on items (Requirements 2.5)
 * - Subtle hover highlight (Requirements 9.2)
 * - Clear selected state styling (Requirements 9.3)
 * - Keyboard navigation with arrow keys and Enter (Requirements 9.4, 14.5)
 * - Visible focus indicators (Requirements 14.5)
 */

export interface ListViewItem {
     id: string;
     content: React.ReactNode;
     disabled?: boolean;
}

export interface ListViewProps {
     items: ListViewItem[];
     selectedId?: string;
     onSelect?: (id: string) => void;
     onItemAction?: (id: string) => void;
     className?: string;
     emptyMessage?: string;
     'aria-label'?: string;
}

const ListView = React.forwardRef<HTMLDivElement, ListViewProps>(
     ({
          items,
          selectedId,
          onSelect,
          onItemAction,
          className,
          emptyMessage = "No items to display",
          'aria-label': ariaLabel = "List view",
          ...props
     }, ref) => {
          const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
          const listRef = React.useRef<HTMLDivElement>(null);
          const itemRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

          // Combine refs
          React.useImperativeHandle(ref, () => listRef.current!);

          // Handle keyboard navigation
          const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
               const enabledItems = items.filter(item => !item.disabled);
               if (enabledItems.length === 0) return;

               const currentIndex = focusedIndex >= 0 ? focusedIndex :
                    selectedId ? enabledItems.findIndex(item => item.id === selectedId) : -1;

               switch (event.key) {
                    case 'ArrowDown':
                         event.preventDefault();
                         const nextIndex = currentIndex < enabledItems.length - 1 ? currentIndex + 1 : 0;
                         setFocusedIndex(nextIndex);
                         const nextItem = enabledItems[nextIndex];
                         itemRefs.current.get(nextItem.id)?.focus();
                         break;

                    case 'ArrowUp':
                         event.preventDefault();
                         const prevIndex = currentIndex > 0 ? currentIndex - 1 : enabledItems.length - 1;
                         setFocusedIndex(prevIndex);
                         const prevItem = enabledItems[prevIndex];
                         itemRefs.current.get(prevItem.id)?.focus();
                         break;

                    case 'Enter':
                    case ' ':
                         event.preventDefault();
                         if (currentIndex >= 0) {
                              const item = enabledItems[currentIndex];
                              if (onItemAction) {
                                   onItemAction(item.id);
                              } else if (onSelect) {
                                   onSelect(item.id);
                              }
                         }
                         break;

                    case 'Home':
                         event.preventDefault();
                         setFocusedIndex(0);
                         itemRefs.current.get(enabledItems[0].id)?.focus();
                         break;

                    case 'End':
                         event.preventDefault();
                         const lastIndex = enabledItems.length - 1;
                         setFocusedIndex(lastIndex);
                         itemRefs.current.get(enabledItems[lastIndex].id)?.focus();
                         break;
               }
          }, [items, focusedIndex, selectedId, onSelect, onItemAction]);

          // Empty state
          if (items.length === 0) {
               return (
                    <div
                         ref={listRef}
                         className={cn("flex items-center justify-center p-xl text-text-muted text-sm", className)}
                         role="status"
                         aria-live="polite"
                         {...props}
                    >
                         {emptyMessage}
                    </div>
               );
          }

          return (
               <div
                    ref={listRef}
                    role="list"
                    aria-label={ariaLabel}
                    className={cn(
                         // Dense list layout with 8px gap (Requirements 2.5, 9.1)
                         "flex flex-col gap-sm",
                         className
                    )}
                    onKeyDown={handleKeyDown}
                    {...props}
               >
                    {items.map((item, index) => {
                         const isSelected = item.id === selectedId;
                         const isDisabled = item.disabled;

                         return (
                              <div
                                   key={item.id}
                                   ref={(el) => {
                                        if (el) {
                                             itemRefs.current.set(item.id, el);
                                        } else {
                                             itemRefs.current.delete(item.id);
                                        }
                                   }}
                                   role="listitem"
                                   tabIndex={isDisabled ? -1 : 0}
                                   aria-selected={isSelected}
                                   aria-disabled={isDisabled}
                                   className={cn(
                                        // Padding: 8px vertical, 12px horizontal (Requirements 2.5)
                                        "py-sm px-md",
                                        // Border radius: 4px
                                        "rounded-list",
                                        // Typography
                                        "text-sm",
                                        // Remove all transitions (0ms)
                                        "transition-none",
                                        // Cursor
                                        "cursor-pointer",
                                        // Focus indicator: visible outline (Requirements 14.5, 15.1)
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                                        {
                                             // Default state: transparent
                                             "bg-transparent text-text-primary": !isSelected && !isDisabled,
                                             // Hover state: subtle highlight (Requirements 9.2)
                                             "hover:bg-[rgba(110,110,128,0.05)]": !isSelected && !isDisabled,
                                             // Selected state: clear styling (Requirements 9.3)
                                             "bg-[rgba(110,110,128,0.1)] text-text-primary": isSelected && !isDisabled,
                                             // Disabled state
                                             "opacity-50 cursor-not-allowed": isDisabled,
                                        }
                                   )}
                                   onClick={() => {
                                        if (!isDisabled) {
                                             setFocusedIndex(index);
                                             if (onItemAction) {
                                                  onItemAction(item.id);
                                             } else if (onSelect) {
                                                  onSelect(item.id);
                                             }
                                        }
                                   }}
                                   onFocus={() => {
                                        if (!isDisabled) {
                                             setFocusedIndex(index);
                                        }
                                   }}
                              >
                                   {item.content}
                              </div>
                         );
                    })}
               </div>
          );
     }
);

ListView.displayName = "ListView";

export { ListView };
