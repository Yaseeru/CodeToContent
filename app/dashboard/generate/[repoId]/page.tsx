import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { DiffViewer } from "@/components/features/DiffViewer"
import { GenerateClient } from "./GenerateClient"
import { parseDiffPatch } from "@/types"
import { redirect } from "next/navigation"

interface PageProps {
    params: Promise<{
        repoId: string;
    }>;
}

async function RepositoryContent({ repoId, accessToken }: { repoId: string; accessToken: string }) {
    // Initialize GitHub service
    const githubService = new GitHubService(accessToken)

    // Fetch repositories to get the specific repo details
    const repositories = await githubService.getRepositories()
    const repository = repositories.find(repo => repo.id === repoId)

    if (!repository) {
        throw new Error(`Repository with id ${repoId} not found`)
    }

    // Parse repository name to get owner and repo
    // Note: The repository name from GitHub API might need to be split
    // For now, we'll use the authenticated user's repos
    const owner = 'owner' // This would come from the session or repo data
    const repoName = repository.name

    // Fetch commits for the repository
    const commits = await githubService.getCommits(owner, repoName)

    // Get the latest commit
    const latestCommit = commits[0]

    // Fetch diff for the latest commit
    let diffLines = []
    let fileName = "No file selected"

    if (latestCommit) {
        try {
            const diffPatch = await githubService.getCommitDiff(owner, repoName, latestCommit.id)
            diffLines = parseDiffPatch(diffPatch)

            // Extract filename from the first line of the patch if available
            const firstLine = diffPatch.split('\n')[0]
            if (firstLine && firstLine.startsWith('File: ')) {
                fileName = firstLine.substring(6)
            }
        } catch (error) {
            console.error('Failed to fetch commit diff:', error)
            // Continue with empty diff
        }
    }

    return (
        <>
            <GenerateClient
                repoName={repository.name}
                commitMessage={latestCommit?.message || 'No commits'}
            />

            <div className="flex-1 overflow-auto pr-2">
                <DiffViewer diff={diffLines} fileName={fileName} />
            </div>
        </>
    )
}

export default async function GeneratePage({ params }: PageProps) {
    // Get session for authentication
    const session = await auth()

    if (!session?.accessToken) {
        redirect('/api/auth/signin')
    }

    // Extract repoId from params
    const { repoId } = await params

    return (
        <DashboardShell>
            <div className="flex flex-col gap-8 lg:flex-row h-[calc(100vh-8rem)]">
                {/* Left Panel: Context & Selection */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <Suspense fallback={
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="text-4xl animate-pulse">⏳</div>
                                <p className="text-foreground-secondary">Loading repository data...</p>
                            </div>
                        </div>
                    }>
                        <RepositoryContent repoId={repoId} accessToken={session.accessToken} />
                    </Suspense>
                </div>
            </div>
        </DashboardShell>
    )
}
