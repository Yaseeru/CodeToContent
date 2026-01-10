import { Suspense } from "react"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { RepoList } from "@/components/features/RepoList"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { redirect } from "next/navigation"

import { Repository } from "@/types"

async function RepositoryList({ accessToken }: { accessToken: string }) {
    const github = new GitHubService(accessToken)
    let repos: Repository[] = []

    try {
        repos = await github.getRepositories()
    } catch (e) {
        console.error("Failed to fetch repos", e)
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
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Repositories</h1>
                    <p className="text-foreground-secondary">
                        Select a project to start generating content.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                            <div className="text-4xl animate-pulse">⏳</div>
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
