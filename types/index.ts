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
