import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { DiffViewer } from "@/components/features/DiffViewer"
import { GenerateClient } from "./GenerateClient"
import { Spinner } from "@/components/ui/icons/Spinner"
import { parseDiffPatch, DiffLine } from "@/types"
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

    // Use the owner from the repository data
    const owner = repository.owner
    const repoName = repository.name

    // Fetch commits for the repository
    const commits = await githubService.getCommits(owner, repoName)

    // Get the latest commit
    const latestCommit = commits[0]

    // Fetch diff for the latest commit
    let diffLines: DiffLine[] = []
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
            {/* Code Context Section */}
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-h2 font-semibold">Code Context</h2>
                    <p className="text-caption text-foreground-secondary">
                        Selected commit: <span className="font-mono text-accent">{latestCommit?.message || 'No commits'}</span>
                    </p>
                </div>
                <div className="flex-1 overflow-auto">
                    <DiffViewer diff={diffLines} fileName={fileName} />
                </div>
            </div>

            {/* Right Panel: Content Generation */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden lg:w-1/2">
                <GenerateClient
                    repoName={repository.name}
                    commitMessage={latestCommit?.message || 'No commits'}
                />
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
        <DashboardShell user={session.user}>
            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
                {/* Left Panel: Code Context (50% on desktop) */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden lg:w-1/2">
                    <Suspense fallback={
                        <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
                            <div className="text-center space-y-4">
                                <Spinner size="lg" className="mx-auto text-accent" aria-hidden="true" />
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
