import { ListView, ListViewItem } from "@/components/ui/ListView"
import { Star, Repository as RepoIcon } from "@/components/ui/icons"
import { Repository } from "@/types"

/**
 * RepoListView Component
 * 
 * A repository list using the new ListView component following the developer-focused UI redesign.
 * This is an alternative to the existing RepoList component that uses the new ListView pattern.
 */

interface RepoListViewProps {
     repos: Repository[]
     selectedRepoId?: string
     onSelectRepo?: (repoId: string) => void
     onOpenRepo?: (repoId: string) => void
}

export function RepoListView({
     repos,
     selectedRepoId,
     onSelectRepo,
     onOpenRepo
}: RepoListViewProps) {
     // Convert repositories to ListView items
     const items: ListViewItem[] = repos.map((repo) => ({
          id: repo.id,
          content: (
               <div className="flex flex-col gap-xs">
                    {/* Repository name */}
                    <div className="font-mono text-sm font-medium text-text-primary">
                         {repo.name}
                    </div>

                    {/* Repository description */}
                    {repo.description && (
                         <div className="text-sm text-text-secondary line-clamp-2">
                              {repo.description}
                         </div>
                    )}

                    {/* Repository metadata */}
                    <div className="flex items-center gap-md text-xs text-text-muted font-mono">
                         <span className="flex items-center gap-xs">
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
               </div>
          ),
     }));

     return (
          <ListView
               items={items}
               selectedId={selectedRepoId}
               onSelect={onSelectRepo}
               onItemAction={onOpenRepo}
               emptyMessage="No repositories found"
               aria-label="Repository list"
          />
     );
}
