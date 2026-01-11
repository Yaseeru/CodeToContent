'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'interactive' | 'elevated';
    padding?: 'none' | 'sm' | 'default' | 'lg';
    /**
     * Whether the card is interactive (clickable/focusable)
     * When true, adds proper keyboard accessibility attributes
     */
    interactive?: boolean;
    /**
     * Callback for when the card is activated (clicked or Enter/Space pressed)
     */
    onActivate?: () => void;
}

const Card = React.forwardRef<
    HTMLDivElement,
    CardProps
>(({
    className,
    variant = 'default',
    padding = 'default',
    interactive = false,
    onActivate,
    onClick,
    onKeyDown,
    tabIndex,
    role,
    ...props
}, ref) => {
    // Padding classes using design token spacing scale
    // Minimum 16px (lg) for default panels per Requirements 2.4
    const paddingClasses = {
        none: '',
        sm: 'p-sm',      // 8px
        default: 'p-lg', // 16px - minimum panel padding
        lg: 'p-xl'       // 24px
    };

    // Variant classes following developer-focused UI redesign
    // - Use theme-appropriate background colors (Requirements 4.2, 4.3, 5.2, 5.3)
    // - Apply subtle borders with theme colors
    // - Remove shadows, gradients, and decorative elements
    const variantClasses = {
        default: 'bg-bg-panel border border-border-subtle',
        interactive: cn(
            'bg-bg-panel border border-border-subtle',
            'cursor-pointer hover:border-accent-neutral',
            // Focus indicator for keyboard accessibility (Requirements 14.5, 15.1)
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            // No transitions
            'transition-none'
        ),
        elevated: 'bg-bg-elevated border border-border-subtle'
    };

    // Handle keyboard activation (Enter or Space)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (interactive && onActivate && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onActivate();
        }
        onKeyDown?.(e);
    };

    // Handle click activation
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (interactive && onActivate) {
            onActivate();
        }
        onClick?.(e);
    };

    // Determine if card should be focusable
    const isInteractive = interactive || variant === 'interactive' || onActivate;
    const cardTabIndex = tabIndex !== undefined ? tabIndex : (isInteractive ? 0 : undefined);
    const cardRole = role || (isInteractive ? 'button' : undefined);

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-panel text-text-primary",
                variantClasses[variant],
                paddingClasses[padding],
                className
            )}
            tabIndex={cardTabIndex}
            role={cardRole}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
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
        className={cn("flex flex-col space-y-sm", className)}
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
            "text-md font-semibold leading-normal",
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
    <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
