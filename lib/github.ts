import { Octokit } from "octokit";
import { Repository, Commit } from "@/types";

// Octokit response type interfaces for the fields we actually use
interface OctokitRepository {
    id: number;
    name: string;
    description: string | null;
    stargazers_count: number;
    updated_at: string;
    language: string | null;
}

interface OctokitCommitAuthor {
    name?: string;
    date?: string;
}

interface OctokitCommitData {
    message: string;
    author?: OctokitCommitAuthor;
}

interface OctokitCommit {
    sha: string;
    commit: OctokitCommitData;
}

interface OctokitCommitFile {
    filename: string;
    patch?: string;
}

interface OctokitCommitDetail {
    files?: OctokitCommitFile[];
}

export class GitHubService {
    private octokit: Octokit;

    constructor(accessToken: string) {
        this.octokit = new Octokit({
            auth: accessToken,
        });
    }

    async getRepositories(): Promise<Repository[]> {
        const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
            sort: "updated",
            per_page: 20,
            type: "owner",
        });

        return data.map((repo) => {
            const octokitRepo = repo as unknown as OctokitRepository;
            return {
                id: String(octokitRepo.id),
                name: octokitRepo.name,
                description: octokitRepo.description,
                stars: octokitRepo.stargazers_count,
                lastUpdated: new Date(octokitRepo.updated_at).toLocaleDateString(),
                language: octokitRepo.language || "Unknown",
            };
        });
    }

    async getCommits(owner: string, repo: string): Promise<Commit[]> {
        const { data } = await this.octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: 10,
        });

        return data.map((commit) => {
            const octokitCommit = commit as unknown as OctokitCommit;
            return {
                id: octokitCommit.sha,
                message: octokitCommit.commit.message,
                author: octokitCommit.commit.author?.name || "Unknown",
                date: new Date(octokitCommit.commit.author?.date || "").toLocaleDateString(),
                filesChanged: 0, // Requires detailed fetch, simplified for list
            };
        });
    }

    async getCommitDiff(owner: string, repo: string, ref: string): Promise<string> {
        const { data } = await this.octokit.rest.repos.getCommit({
            owner,
            repo,
            ref,
        });

        // Extract patches from commit detail
        const commitDetail = data as unknown as OctokitCommitDetail;
        const patches = commitDetail.files
            ?.map((f) => `File: ${f.filename}\n${f.patch || ""}`)
            .join("\n\n") || "";
        return patches;
    }
}
