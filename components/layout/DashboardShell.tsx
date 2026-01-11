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
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main content area with Topbar */}
            <div className="flex-1 flex flex-col">
                {/* Topbar */}
                <Topbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Main content */}
                <main className="flex-1 overflow-auto">
                    <div className="px-4 py-6 md:px-6 md:py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
