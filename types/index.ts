export interface Repository {
    id: string;
    name: string;
    description: string | null;
    stars: number;
    lastUpdated: string;
    language: string;
}

export interface Commit {
    id: string;
    message: string;
    author: string;
    date: string;
    filesChanged: number;
}

export interface ContentDraft {
    id: string;
    type: 'twitter' | 'linkedin' | 'blog';
    content: string;
    tone: string;
}

export interface DiffLine {
    type: 'add' | 'del' | 'eq';
    content: string;
    lineNo: number;
}

/**
 * Parse a git diff patch string into structured DiffLine objects
 */
export function parseDiffPatch(patch: string): DiffLine[] {
    if (!patch) return [];

    const lines = patch.split('\n');
    const diffLines: DiffLine[] = [];
    let lineNo = 1;

    for (const line of lines) {
        // Skip diff headers and metadata
        if (line.startsWith('@@') || line.startsWith('diff --git') ||
            line.startsWith('index ') || line.startsWith('---') ||
            line.startsWith('+++')) {
            continue;
        }

        if (line.startsWith('+')) {
            diffLines.push({
                type: 'add',
                content: line.substring(1),
                lineNo: lineNo++
            });
        } else if (line.startsWith('-')) {
            diffLines.push({
                type: 'del',
                content: line.substring(1),
                lineNo: lineNo++
            });
        } else {
            diffLines.push({
                type: 'eq',
                content: line,
                lineNo: lineNo++
            });
        }
    }

    return diffLines;
}
