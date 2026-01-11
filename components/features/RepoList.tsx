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
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <RepoIcon size="lg" className="text-foreground-secondary mb-4" />
                <p className="text-body text-foreground-secondary">
                    No repositories found
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
                <Link key={repo.id} href={`/dashboard/generate/${repo.id}`} className="block">
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
                                    <Star size="sm" />
                                    {repo.stars}
                                </span>
                                <span>{repo.language}</span>
                                <span className="ml-auto">{repo.lastUpdated}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
