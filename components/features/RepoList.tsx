import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Star, Repository as RepoIcon } from "@/components/ui/icons"
import { Repository } from "@/types"

interface RepoListProps {
    repos: Repository[]
}

export function RepoList({ repos }: RepoListProps) {
    // Empty state
    if (repos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
                <RepoIcon size="lg" className="text-foreground-secondary mb-4" aria-hidden="true" />
                <p className="text-body text-foreground-secondary">
                    No repositories found
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Repository list">
            {repos.map((repo) => (
                <Link
                    key={repo.id}
                    href={`/dashboard/generate/${repo.id}`}
                    className="block"
                    role="listitem"
                    aria-label={`${repo.name} repository - ${repo.description || 'No description'}`}
                >
                    <Card variant="interactive" className="h-full border border-transparent">
                        <CardHeader>
                            <CardTitle className="font-mono text-h3">
                                {repo.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-body text-foreground-secondary line-clamp-2 mb-4">
                                {repo.description || "No description available"}
                            </p>
                            <div className="flex items-center gap-4 text-caption text-foreground-secondary font-mono">
                                <span className="flex items-center gap-1">
                                    <Star size="sm" aria-hidden="true" />
                                    <span className="sr-only">Stars:</span>
                                    {repo.stars}
                                </span>
                                <span>
                                    <span className="sr-only">Language:</span>
                                    {repo.language}
                                </span>
                                <span className="ml-auto">
                                    <span className="sr-only">Last updated:</span>
                                    {repo.lastUpdated}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
