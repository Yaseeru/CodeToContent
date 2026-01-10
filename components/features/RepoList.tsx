import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Repository } from "@/types"

interface RepoListProps {
    repos: Repository[]
}

export function RepoList({ repos }: RepoListProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
                <Link key={repo.id} href={`/dashboard/generate/${repo.id}`} className="block group">
                    <Card className="h-full transition-all group-hover:border-accent/50 group-hover:shadow-md border border-transparent">
                        <CardHeader>
                            <CardTitle className="font-mono text-lg group-hover:text-accent transition-colors">
                                {repo.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground-secondary line-clamp-2 mb-4">
                                {repo.description || "No description available"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-foreground-secondary font-mono">
                                <span>⭐ {repo.stars}</span>
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
