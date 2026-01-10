import { Sidebar } from "./Sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-background">
                <div className="container mx-auto py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
