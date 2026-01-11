import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./icons/Spinner"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost"
    loading?: boolean
    icon?: React.ReactNode
    iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = "primary",
        loading = false,
        icon,
        iconPosition = "left",
        children,
        disabled,
        ...props
    }, ref) => {
        // Filter out emoji characters from children
        const sanitizedChildren = React.useMemo(() => {
            if (typeof children === 'string') {
                // Remove emoji characters (Unicode ranges U+1F300-U+1F9FF and other common emoji ranges)
                return children.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');
            }
            return children;
        }, [children]);

        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={cn(
                    // Base styles - flat design with no gradients
                    "inline-flex items-center justify-center gap-2",
                    // Padding: 8px vertical, 12px horizontal (from design tokens)
                    "py-sm px-md",
                    // Border radius: max 4px
                    "rounded-button",
                    // Typography
                    "text-sm font-medium",
                    // Remove all transitions and animations (0ms)
                    "transition-none",
                    // Focus state: elevation with box-shadow only
                    "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--border-focus)]",
                    // Disabled state
                    "disabled:pointer-events-none disabled:opacity-50",
                    {
                        // Primary variant: neutral accent background
                        "bg-accent-neutral text-text-primary hover:bg-accent-hover": variant === "primary",
                        // Secondary variant: transparent with subtle hover
                        "bg-transparent text-text-secondary border border-border-subtle hover:bg-[rgba(110,110,128,0.05)]": variant === "secondary",
                        // Ghost variant: transparent with subtle hover
                        "bg-transparent text-text-muted hover:text-text-secondary hover:bg-[rgba(110,110,128,0.05)]": variant === "ghost",
                    },
                    className
                )}
                aria-live={loading ? "polite" : undefined}
                aria-busy={loading}
                {...props}
            >
                {loading && <Spinner size="sm" />}
                {!loading && icon && iconPosition === "left" && icon}
                {sanitizedChildren}
                {!loading && icon && iconPosition === "right" && icon}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
