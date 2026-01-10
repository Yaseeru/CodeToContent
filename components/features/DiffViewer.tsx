import { Card } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

export interface DiffLine {
    type: 'add' | 'del' | 'eq';
    content: string;
    lineNo: number;
}

interface DiffViewerProps {
    diff?: DiffLine[];
    fileName?: string;
}

export function DiffViewer({ diff, fileName = "No file selected" }: DiffViewerProps) {
    // Display empty state when no diff provided
    if (!diff || diff.length === 0) {
        return (
            <Card className="bg-background-secondary border-none overflow-hidden font-mono text-sm leading-relaxed">
                <div className="flex items-center justify-between px-4 py-2 bg-background-tertiary/50 border-b border-background-tertiary">
                    <span className="text-xs text-foreground-secondary">{fileName}</span>
                    <span className="text-xs text-accent">No changes</span>
                </div>
                <div className="p-8 text-center text-foreground-secondary">
                    <div className="text-4xl mb-4">📄</div>
                    <p>No diff data available</p>
                    <p className="text-xs mt-2 opacity-70">Select a commit to view changes</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-background-secondary border-none overflow-hidden font-mono text-sm leading-relaxed">
            <div className="flex items-center justify-between px-4 py-2 bg-background-tertiary/50 border-b border-background-tertiary">
                <span className="text-xs text-foreground-secondary">{fileName}</span>
                <span className="text-xs text-accent">Modified</span>
            </div>
            <div className="p-0 overflow-x-auto">
                {diff.map((line, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex min-w-full",
                            line.type === 'add' && "bg-diff-add-bg",
                            line.type === 'del' && "bg-diff-del-bg",
                        )}
                    >
                        <div className="w-12 flex-shrink-0 text-right pr-4 select-none text-diff-line-number bg-black/10">
                            {line.lineNo}
                        </div>
                        <div className={cn(
                            "pl-4 whitespace-pre",
                            line.type === 'add' && "text-foreground",
                            line.type === 'del' && "text-foreground-secondary line-through decoration-1 opacity-70",
                            line.type === 'eq' && "text-foreground-code"
                        )}>
                            {line.type === 'add' && '+ '}
                            {line.type === 'del' && '- '}
                            {line.type === 'eq' && '  '}
                            {line.content}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
