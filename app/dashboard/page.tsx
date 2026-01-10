import { DashboardShell } from "@/components/layout/DashboardShell"
import { RepoList } from "@/components/features/RepoList"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { redirect } from "next/navigation"

import { Repository } from "@/types"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/")
    }

    // @ts-expect-error: Custom session property
    const github = new GitHubService(session.accessToken)
    let repos: Repository[] = []

    try {
        repos = await github.getRepositories()
    } catch (e) {
        console.error("Failed to fetch repos", e)
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

                <RepoList repos={repos} />
            </div>
        </DashboardShell>
    )
}
