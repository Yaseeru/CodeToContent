import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'interactive' | 'outlined';
    padding?: 'none' | 'sm' | 'default' | 'lg';
}

const Card = React.forwardRef<
    HTMLDivElement,
    CardProps
>(({ className, variant = 'default', padding = 'default', ...props }, ref) => {
    const paddingClasses = {
        none: '',
        sm: 'p-2',
        default: 'p-4',
        lg: 'p-6'
    };

    const variantClasses = {
        default: 'bg-background-secondary shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] light:shadow-[0_2px_8px_rgba(0,0,0,0.1)]',
        interactive: 'bg-background-secondary shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] light:shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-200 hover:border-accent/50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] light:hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
        outlined: 'bg-background-secondary border border-[var(--border)]'
    };

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-lg text-foreground",
                variantClasses[variant],
                paddingClasses[padding],
                className
            )}
            {...props}
        />
    );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
