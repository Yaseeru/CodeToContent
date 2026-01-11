"use client"

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Copy, Check, FileText } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export interface DetailPaneProps {
     /**
      * The content to display and edit
      */
     content: string;

     /**
      * Whether the content is code-derived (uses monospace font)
      */
     isCodeDerived?: boolean;

     /**
      * Callback when content changes
      */
     onContentChange?: (content: string) => void;

     /**
      * Callback when content is saved
      */
     onSave?: (content: string) => void;

     /**
      * Callback for export action
      */
     onExport?: () => void;

     /**
      * Callback for regenerate action
      */
     onRegenerate?: () => void;

     /**
      * Whether the pane is in read-only mode
      */
     readOnly?: boolean;

     /**
      * Optional title for the detail pane
      */
     title?: string;

     /**
      * Optional placeholder text when content is empty
      */
     placeholder?: string;

     /**
      * Additional CSS classes
      */
     className?: string;
}

/**
 * Detail Pane Component
 * 
 * Editor-like preview area for viewing and editing content with utility actions.
 * Follows Requirements 12.1, 12.2, 12.3, 12.4 from the design specification.
 * 
 * Features:
 * - 24px padding for comfortable reading/editing
 * - Editable text area with auto-save on blur
 * - Utility actions (copy, export, regenerate)
 * - Monospace font option for code-derived content
 * - Clear separation from UI chrome
 * - Theme-appropriate styling
 */
export function DetailPane({
     content,
     isCodeDerived = false,
     onContentChange,
     onSave,
     onExport,
     onRegenerate,
     readOnly = false,
     title,
     placeholder = "No content to display",
     className
}: DetailPaneProps) {
     const [localContent, setLocalContent] = React.useState(content)
     const [isCopied, setIsCopied] = React.useState(false)
     const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
     const textareaRef = React.useRef<HTMLTextAreaElement>(null)

     // Sync local content with prop changes
     React.useEffect(() => {
          setLocalContent(content)
          setHasUnsavedChanges(false)
     }, [content])

     // Handle content change
     const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newContent = e.target.value
          setLocalContent(newContent)
          setHasUnsavedChanges(true)
          onContentChange?.(newContent)
     }

     // Auto-save on blur
     const handleBlur = () => {
          if (hasUnsavedChanges && onSave) {
               onSave(localContent)
               setHasUnsavedChanges(false)
          }
     }

     // Copy to clipboard
     const handleCopy = async () => {
          try {
               await navigator.clipboard.writeText(localContent)
               setIsCopied(true)
               setTimeout(() => setIsCopied(false), 2000)
          } catch (error) {
               console.error('Failed to copy to clipboard:', error)
          }
     }

     // Handle export
     const handleExport = () => {
          onExport?.()
     }

     // Handle regenerate
     const handleRegenerate = () => {
          onRegenerate?.()
     }

     const isEmpty = !localContent || localContent.trim().length === 0

     return (
          <div
               className={cn(
                    // Panel background with theme-appropriate colors
                    "bg-bg-panel",
                    // Clear separation from UI chrome with subtle border
                    "border border-border-subtle",
                    // Rounded corners (8px for panels)
                    "rounded-lg",
                    // Full height
                    "h-full flex flex-col",
                    // Remove transitions (Requirements 13.4)
                    "transition-none",
                    className
               )}
               role="region"
               aria-label={title || "Content detail pane"}
          >
               {/* Header with title and utility actions */}
               {(title || onExport || onRegenerate) && (
                    <div
                         className={cn(
                              // Padding: 16px (panel minimum)
                              "px-lg py-md",
                              // Border bottom for separation
                              "border-b border-border-subtle",
                              // Flex layout for title and actions
                              "flex items-center justify-between gap-md"
                         )}
                    >
                         {/* Title */}
                         {title && (
                              <h2 className="text-md font-semibold text-text-primary">
                                   {title}
                              </h2>
                         )}

                         {/* Utility Actions */}
                         <div className="flex items-center gap-sm ml-auto">
                              {/* Copy button */}
                              <Button
                                   variant="ghost"
                                   icon={isCopied ? <Check size="sm" aria-hidden="true" /> : <Copy size="sm" aria-hidden="true" />}
                                   onClick={handleCopy}
                                   disabled={isEmpty}
                                   aria-label={isCopied ? "Copied to clipboard" : "Copy content to clipboard"}
                              >
                                   {isCopied ? 'Copied' : 'Copy'}
                              </Button>

                              {/* Export button */}
                              {onExport && (
                                   <Button
                                        variant="ghost"
                                        icon={<FileText size="sm" aria-hidden="true" />}
                                        onClick={handleExport}
                                        disabled={isEmpty}
                                        aria-label="Export content"
                                   >
                                        Export
                                   </Button>
                              )}

                              {/* Regenerate button */}
                              {onRegenerate && (
                                   <Button
                                        variant="secondary"
                                        onClick={handleRegenerate}
                                        aria-label="Regenerate content"
                                   >
                                        Regenerate
                                   </Button>
                              )}
                         </div>
                    </div>
               )}

               {/* Content area - editor-like with 24px padding */}
               <div
                    className={cn(
                         // Padding: 24px for comfortable reading/editing (Requirements 12.1)
                         "p-xl",
                         // Flex-1 to fill available space
                         "flex-1",
                         // Overflow handling
                         "overflow-auto"
                    )}
               >
                    {readOnly ? (
                         // Read-only content display
                         <div
                              className={cn(
                                   // Typography
                                   "text-base leading-relaxed",
                                   // Font family based on content type (Requirements 12.4)
                                   isCodeDerived ? "font-mono text-sm" : "font-primary",
                                   // Text color
                                   "text-text-primary",
                                   // Whitespace handling
                                   "whitespace-pre-wrap break-words",
                                   // Empty state
                                   isEmpty && "text-text-muted italic"
                              )}
                              role="article"
                              aria-label="Content preview"
                         >
                              {isEmpty ? placeholder : localContent}
                         </div>
                    ) : (
                         // Editable textarea
                         <textarea
                              ref={textareaRef}
                              value={localContent}
                              onChange={handleContentChange}
                              onBlur={handleBlur}
                              placeholder={placeholder}
                              className={cn(
                                   // Full size
                                   "w-full h-full",
                                   // Remove default textarea styling
                                   "resize-none outline-none border-none",
                                   // Background transparent to inherit panel background
                                   "bg-transparent",
                                   // Typography
                                   "text-base leading-relaxed",
                                   // Font family based on content type (Requirements 12.4)
                                   isCodeDerived ? "font-mono text-sm" : "font-primary",
                                   // Text color
                                   "text-text-primary",
                                   // Placeholder color (Requirements 8.3)
                                   "placeholder:text-text-muted placeholder:italic",
                                   // Remove transitions
                                   "transition-none",
                                   // Focus ring for accessibility (Requirements 15.1)
                                   "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
                              )}
                              aria-label="Editable content area"
                              aria-describedby={hasUnsavedChanges ? "unsaved-changes-notice" : undefined}
                         />
                    )}

                    {/* Unsaved changes indicator (screen reader only) */}
                    {hasUnsavedChanges && !readOnly && (
                         <div
                              id="unsaved-changes-notice"
                              className="sr-only"
                              role="status"
                              aria-live="polite"
                         >
                              You have unsaved changes. Changes will be saved when you click outside the text area.
                         </div>
                    )}
               </div>
          </div>
     )
}
