"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/dashboard", label: "Repositories", icon: "📚" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r border-border bg-background-secondary h-screen sticky top-0 flex flex-col">
            <div className="p-6">
                <h1 className="text-xl font-bold text-accent font-mono">CodeToContent</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            pathname === item.href
                                ? "bg-accent/10 text-accent"
                                : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary"
                        )}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-mono">
                        US
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-foreground">User</p>
                        <p className="text-xs text-foreground-secondary">Indie Dev</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
