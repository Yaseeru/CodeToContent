import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { GitHubService } from "@/lib/github"
import { AppShell } from "@/components/layout/AppShell"
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

/**
 * Repository Content Component
 * 
 * Fetches repository details, commits, and diff data.
 * Handles data fetching and error states.
 */
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

    return {
        repository,
        latestCommit,
        diffLines,
        fileName
    }
}

/**
 * Generate Page Content Component
 * 
 * Displays code context and content generation interface.
 * Uses AppShell layout with DiffViewer and GenerateClient.
 * 
 * Requirements:
 * - 1.1-1.6: Global layout structure with AppShell
 * - 2.1: Spacing scale compliance
 * - 3.1-3.7: Typography system
 * - 4.1-4.13, 5.1-5.11: Theme-appropriate colors
 * - 12.1-12.4: Detail pane with editor-like experience
 * - 13.1-13.8: Visual design constraints
 */
async function GeneratePageContent({ repoId, accessToken, user }: { repoId: string; accessToken: string; user: any }) {
    const data = await RepositoryContent({ repoId, accessToken })

    return (
        <AppShell
            user={user}
            listView={
                <div className="flex flex-col gap-lg h-full">
                    {/* Header section */}
                    <div>
                        <h2 className="text-md font-semibold text-text-primary mb-sm">Code Context</h2>
                        <p className="text-sm text-text-secondary">
                            Selected commit: <span className="font-mono text-xs text-accent-neutral">{data.latestCommit?.message || 'No commits'}</span>
                        </p>
                    </div>

                    {/* Diff viewer with scroll */}
                    <div className="flex-1 overflow-auto">
                        <DiffViewer diff={data.diffLines} fileName={data.fileName} />
                    </div>
                </div>
            }
            detailPane={
                <GenerateClient
                    repoName={data.repository.name}
                    commitMessage={data.latestCommit?.message || 'No commits'}
                />
            }
        />
    )
}

/**
 * Generate Page
 * 
 * Main page for generating content from code commits.
 * Handles authentication and loading states.
 * 
 * Requirements:
 * - 1.1-1.6: Global layout structure
 * - 2.1: Spacing scale compliance
 * - 3.1-3.7: Typography system
 */
export default async function GeneratePage({ params }: PageProps) {
    // Get session for authentication
    const session = await auth()

    if (!session?.accessToken) {
        redirect('/api/auth/signin')
    }

    // Extract repoId from params
    const { repoId } = await params

    return (
        <Suspense fallback={
            <AppShell
                user={session.user}
                listView={
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-lg">
                            <Spinner size="lg" className="mx-auto text-accent-neutral" aria-hidden="true" />
                            <p className="text-sm text-text-secondary">Loading repository data...</p>
                        </div>
                    </div>
                }
            />
        }>
            <GeneratePageContent repoId={repoId} accessToken={session.accessToken} user={session.user} />
        </Suspense>
    )
}
