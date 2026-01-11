import { Suspense } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { RepoList } from "@/components/features/RepoList"
import { Spinner } from "@/components/ui/icons/Spinner"
import { Repository as RepoIcon } from "@/components/ui/icons/Repository"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { redirect } from "next/navigation"

import { Repository } from "@/types"

/**
 * Repository List Component
 * 
 * Fetches and displays user's GitHub repositories.
 * Handles loading, error, and empty states.
 */
async function RepositoryList({ accessToken }: { accessToken: string }) {
    const github = new GitHubService(accessToken)
    let repos: Repository[] = []
    let error: string | null = null

    try {
        repos = await github.getRepositories()
    } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to fetch repositories'
        console.error("Failed to fetch repos", e)
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-xl" role="alert" aria-live="assertive">
                <p className="text-sm text-status-error mb-lg">Error: {error}</p>
                <p className="text-sm text-text-secondary">Please check your GitHub connection and try again.</p>
            </div>
        )
    }

    // Empty state
    if (repos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-xxl text-center" role="status" aria-live="polite">
                <RepoIcon size="lg" className="text-text-muted mb-lg" aria-hidden="true" />
                <p className="text-sm text-text-secondary">No repositories found</p>
                <p className="text-xs text-text-muted mt-sm">Make sure you have repositories in your GitHub account</p>
            </div>
        )
    }

    return <RepoList repos={repos} />
}

/**
 * Dashboard Page
 * 
 * Main dashboard view showing user's repositories.
 * Uses AppShell layout with List View and Detail Pane.
 * 
 * Requirements:
 * - 1.1-1.6: Global layout structure with AppShell
 * - 2.1: Spacing scale compliance
 * - 3.1-3.7: Typography system
 * - 4.1-4.13, 5.1-5.11: Theme-appropriate colors
 * - 13.1-13.8: Visual design constraints
 */
export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/")
    }

    if (!session.accessToken) {
        redirect("/")
    }

    return (
        <AppShell
            user={session.user}
            listView={
                <div className="space-y-lg">
                    {/* Header section */}
                    <div>
                        <h1 className="text-md font-semibold text-text-primary mb-sm">Repositories</h1>
                        <p className="text-sm text-text-secondary">
                            Select a project to start generating content.
                        </p>
                    </div>

                    {/* Repository list with loading state */}
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-xl" role="status" aria-live="polite">
                            <div className="text-center space-y-lg">
                                <Spinner size="lg" className="mx-auto text-accent-neutral" aria-hidden="true" />
                                <p className="text-sm text-text-secondary">Loading repositories...</p>
                            </div>
                        </div>
                    }>
                        <RepositoryList accessToken={session.accessToken} />
                    </Suspense>
                </div>
            }
            detailPane={
                <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-lg">
                        <RepoIcon size="lg" className="mx-auto text-text-muted" aria-hidden="true" />
                        <p className="text-sm text-text-muted">
                            Select a repository to view details
                        </p>
                    </div>
                </div>
            }
        />
    )
}
