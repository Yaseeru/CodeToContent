"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createOptimizedResizeObserver } from "@/lib/performance"
import { Repository } from "@/components/ui/icons/Repository"
import { Settings } from "@/components/ui/icons/Settings"
import { ChevronLeft } from "@/components/ui/icons/ChevronLeft"
import { ChevronRight } from "@/components/ui/icons/ChevronRight"
import { Logo } from "@/components/ui/Logo"

const navItems = [
    { href: "/dashboard", label: "Repositories", icon: Repository },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const STORAGE_KEY = "sidebar-collapsed"

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [windowWidth, setWindowWidth] = useState(0)

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        setIsMounted(true)
        setWindowWidth(window.innerWidth)

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored !== null) {
            setIsCollapsed(stored === "true")
        } else {
            // Set default collapsed state based on screen size
            if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                // Tablet: collapsed by default
                setIsCollapsed(true)
            } else if (window.innerWidth >= 1024) {
                // Desktop: expanded by default
                setIsCollapsed(false)
            }
        }

        // Use optimized ResizeObserver instead of resize event listener
        const resizeObserver = createOptimizedResizeObserver((width) => {
            setWindowWidth(width)
        }, 150)

        if (resizeObserver) {
            resizeObserver.observe(document.body)
            return () => resizeObserver.disconnect()
        } else {
            // Fallback to resize event listener if ResizeObserver is not supported
            const handleResize = () => {
                setWindowWidth(window.innerWidth)
            }
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }
    }, [])

    // Save collapsed state to localStorage
    const toggleCollapsed = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem(STORAGE_KEY, String(newState))
    }

    // Determine if we're in mobile mode
    const isMobile = windowWidth > 0 && windowWidth < 768

    // Prevent hydration mismatch by not rendering dynamic content until mounted
    if (!isMounted) {
        return (
            <aside
                className="hidden md:flex w-60 border-r border-border bg-background-secondary h-screen sticky top-0 flex-col"
                style={{ minWidth: '240px' }}
            >
                <div className="p-6 flex items-center gap-3" style={{ height: '64px' }}>
                    <Logo size="md" className="text-accent" aria-hidden="true" />
                    <h1 className="text-xl font-bold text-accent font-mono">CodeToContent</h1>
                </div>
            </aside>
        )
    }

    // Mobile: render as overlay drawer
    if (isMobile) {
        return (
            <>
                {/* Backdrop */}
                {isOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                )}

                {/* Drawer */}
                <aside
                    className={cn(
                        "fixed top-0 left-0 h-screen w-60 border-r border-border bg-background-secondary z-50 flex flex-col transition-transform duration-200 ease-in-out md:hidden",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    role="navigation"
                    aria-label="Main navigation"
                >
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <Logo size="md" className="text-accent" aria-hidden="true" />
                            <h1 className="text-xl font-bold text-accent font-mono">CodeToContent</h1>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-2" aria-label="Primary navigation">
                        {navItems.map((item) => {
                            const IconComponent = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-accent/10 text-accent"
                                            : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary"
                                    )}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <IconComponent size="sm" aria-hidden="true" />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 px-3 py-2" role="region" aria-label="User profile">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-mono flex-shrink-0" aria-hidden="true">
                                US
                            </div>
                            <div className="text-sm overflow-hidden">
                                <p className="font-medium text-foreground truncate">User</p>
                                <p className="text-xs text-foreground-secondary truncate">Indie Dev</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </>
        )
    }

    // Tablet and Desktop: render as sidebar
    return (
        <aside
            className={cn(
                "hidden md:flex border-r border-border bg-background-secondary h-screen sticky top-0 flex-col sidebar-transition transition-all duration-200 ease-in-out",
                isCollapsed ? "w-16" : "w-60"
            )}
            style={{ minWidth: isCollapsed ? '64px' : '240px' }}
            role="navigation"
            aria-label="Main navigation"
        >
            {/* Header with toggle button */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <Logo size="md" className="text-accent" aria-hidden="true" />
                        <h1 className="text-xl font-bold text-accent font-mono">CodeToContent</h1>
                    </div>
                )}
                {isCollapsed && (
                    <Logo size="sm" className="text-accent mx-auto" aria-hidden="true" />
                )}
                <button
                    onClick={toggleCollapsed}
                    className={cn(
                        "p-2 rounded-md hover:bg-background-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-accent",
                        isCollapsed && "absolute right-2"
                    )}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!isCollapsed}
                    type="button"
                >
                    {isCollapsed ? (
                        <ChevronRight size="sm" aria-hidden="true" />
                    ) : (
                        <ChevronLeft size="sm" aria-hidden="true" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-2" aria-label="Primary navigation">
                {navItems.map((item) => {
                    const IconComponent = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent",
                                isActive
                                    ? "bg-accent/10 text-accent"
                                    : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary",
                                isCollapsed && "justify-center"
                            )}
                            title={isCollapsed ? item.label : undefined}
                            aria-label={isCollapsed ? item.label : undefined}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <IconComponent size="sm" aria-hidden="true" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <div className={cn(
                    "flex items-center gap-3 px-3 py-2",
                    isCollapsed && "justify-center"
                )} role="region" aria-label="User profile">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-mono flex-shrink-0" aria-hidden="true">
                        US
                    </div>
                    {!isCollapsed && (
                        <div className="text-sm overflow-hidden">
                            <p className="font-medium text-foreground truncate">User</p>
                            <p className="text-xs text-foreground-secondary truncate">Indie Dev</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}
