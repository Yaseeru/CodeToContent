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
                    "flex h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 py-2 text-base text-foreground placeholder:text-[#666C87] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:border-2 focus-visible:border-border-focus disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
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
