'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardShellProps {
    children: React.ReactNode;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            {/* Skip to main content link for keyboard users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
                Skip to main content
            </a>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main content area with Topbar */}
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <Topbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Main content */}
                <main id="main-content" className="flex-1 overflow-auto">
                    <div className="px-4 py-6 md:px-6 md:py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
