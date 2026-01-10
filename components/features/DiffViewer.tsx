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
            <Card className="bg-[#1B2236] border-none overflow-hidden font-mono text-sm leading-relaxed">
                <div className="flex items-center justify-between px-4 py-2 bg-[#2A2F4A]/50 border-b border-[#2A2F4A]">
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
        <Card className="bg-[#1B2236] border-none overflow-hidden font-mono text-sm leading-relaxed">
            <div className="flex items-center justify-between px-4 py-2 bg-[#2A2F4A]/50 border-b border-[#2A2F4A]">
                <span className="text-xs text-foreground-secondary">{fileName}</span>
                <span className="text-xs text-accent">Modified</span>
            </div>
            <div className="p-0 overflow-x-auto">
                {diff.map((line, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex min-w-full",
                            line.type === 'add' && "bg-[#29414D]",
                            line.type === 'del' && "bg-[#4D2C2C]",
                        )}
                    >
                        <div className="w-12 flex-shrink-0 text-right pr-4 select-none text-[#666C87] bg-black/10">
                            {line.lineNo}
                        </div>
                        <div className={cn(
                            "pl-4 whitespace-pre",
                            line.type === 'add' && "text-[#E6E6E6]",
                            line.type === 'del' && "text-[#A0A0A0] line-through decoration-1 opacity-70",
                            line.type === 'eq' && "text-[#C7D1FF]"
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
