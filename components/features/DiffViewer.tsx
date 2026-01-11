import { Card } from "@/components/ui/Card"
import { FileText } from "@/components/ui/icons/FileText"
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
            <Card className="bg-background-secondary border-none overflow-hidden" role="region" aria-label="Code diff viewer">
                <div className="flex items-center justify-between px-4 py-2 bg-background-tertiary/50 border-b border-background-tertiary">
                    <span className="text-sm text-foreground-secondary font-mono">{fileName}</span>
                    <span className="text-sm text-accent">No changes</span>
                </div>
                <div className="p-8 text-center text-foreground-secondary" role="status" aria-live="polite">
                    <FileText size="lg" className="mx-auto mb-4 text-foreground-secondary" aria-hidden="true" />
                    <p className="text-body">No diff data available</p>
                    <p className="text-caption mt-2 opacity-70">Select a commit to view changes</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-background-secondary border-none overflow-hidden" role="region" aria-label="Code diff viewer">
            <div className="flex items-center justify-between px-4 py-2 bg-background-tertiary/50 border-b border-background-tertiary">
                <span className="text-sm text-foreground-secondary font-mono">{fileName}</span>
                <span className="text-sm text-accent">Modified</span>
            </div>
            <div className="p-0 overflow-x-auto" role="table" aria-label="Code changes">
                {diff.map((line, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex min-w-full font-mono text-[14px] leading-relaxed",
                            line.type === 'add' && "bg-diff-add-bg",
                            line.type === 'del' && "bg-diff-del-bg",
                        )}
                        role="row"
                    >
                        <div className="w-[48px] flex-shrink-0 text-right pr-4 select-none text-diff-line-number bg-black/10" role="rowheader">
                            {line.lineNo}
                        </div>
                        <div className={cn(
                            "pl-4 whitespace-pre",
                            line.type === 'add' && "text-foreground",
                            line.type === 'del' && "text-foreground-secondary line-through decoration-1 opacity-70",
                            line.type === 'eq' && "text-foreground-code"
                        )} role="cell">
                            <span className="sr-only">
                                {line.type === 'add' && 'Added: '}
                                {line.type === 'del' && 'Deleted: '}
                                {line.type === 'eq' && 'Unchanged: '}
                            </span>
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
