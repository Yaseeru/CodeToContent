import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./icons/Spinner"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost"
    size?: "default" | "sm" | "lg"
    loading?: boolean
    icon?: React.ReactNode
    iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant = "primary",
        size = "default",
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
                    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-in-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0",
                    "disabled:pointer-events-none disabled:opacity-50",
                    {
                        // Variant styles
                        "bg-accent text-white hover:bg-accent-hover": variant === "primary",
                        "bg-background-tertiary text-foreground hover:bg-opacity-80": variant === "secondary",
                        "bg-transparent text-foreground hover:bg-background-secondary": variant === "ghost",

                        // Size styles - matching requirements (sm: 36px, default: 40px, lg: 44px)
                        "h-10 px-4": size === "default",
                        "h-9 px-3": size === "sm",
                        "h-11 px-6": size === "lg",
                    },
                    className
                )}
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
