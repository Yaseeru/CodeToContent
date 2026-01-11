import * as React from "react"
import { cn } from "@/lib/utils"

// Using type alias to avoid empty interface lint error
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    // Base styles with design token compliance
                    "flex w-full",
                    // Padding: 10px vertical, 12px horizontal (Requirements 2.3)
                    "py-[10px] px-md",
                    // Border radius: max 4px (Requirements 8.1)
                    "rounded-input",
                    // Border with theme-appropriate colors
                    "border border-border-subtle",
                    // Background using theme colors
                    "bg-bg-panel",
                    // Typography
                    "text-sm font-regular text-text-primary",
                    // Placeholder styling with muted colors (Requirements 8.3)
                    "placeholder:text-text-muted",
                    // Clear focus ring with theme-appropriate colors (Requirements 8.2)
                    "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus",
                    // File input styling
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    // Disabled state
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    // Remove transitions (Requirements 13.4)
                    "transition-none",
                    // Remove inner shadows and gradients (Requirements 8.1)
                    "shadow-none",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
