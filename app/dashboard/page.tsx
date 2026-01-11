import { Suspense } from "react"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { RepoList } from "@/components/features/RepoList"
import { Spinner } from "@/components/ui/icons/Spinner"
import { Repository as RepoIcon } from "@/components/ui/icons/Repository"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { redirect } from "next/navigation"

import { Repository } from "@/types"

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

    if (error) {
        return (
            <div className="text-center py-12" role="alert" aria-live="assertive">
                <p className="text-red-500 mb-4">Error: {error}</p>
                <p className="text-foreground-secondary">Please check your GitHub connection and try again.</p>
            </div>
        )
    }

    if (repos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
                <RepoIcon size="lg" className="text-foreground-secondary mb-4" aria-hidden="true" />
                <p className="text-body text-foreground-secondary">No repositories found</p>
                <p className="text-caption text-foreground-secondary mt-2 opacity-70">Make sure you have repositories in your GitHub account</p>
            </div>
        )
    }

    return <RepoList repos={repos} />
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/")
    }

    if (!session.accessToken) {
        redirect("/")
    }

    return (
        <DashboardShell user={session.user}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Repositories</h1>
                    <p className="text-foreground-secondary">
                        Select a project to start generating content.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                        <div className="text-center space-y-4">
                            <Spinner size="lg" className="mx-auto text-accent" aria-hidden="true" />
                            <p className="text-foreground-secondary">Loading repositories...</p>
                        </div>
                    </div>
                }>
                    <RepositoryList accessToken={session.accessToken} />
                </Suspense>
            </div>
        </DashboardShell>
    )
}
