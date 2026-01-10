import { Octokit } from "octokit";
import { Repository, Commit } from "@/types";

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

        // @ts-expect-error: Octokit types mismatch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((repo: any) => ({
            id: String(repo.id),
            name: repo.name,
            description: repo.description,
            stars: repo.stargazers_count,
            lastUpdated: new Date(repo.updated_at).toLocaleDateString(),
            language: repo.language || "Unknown",
        }));
    }

    async getCommits(owner: string, repo: string): Promise<Commit[]> {
        const { data } = await this.octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: 10,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((commit: any) => ({
            id: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name || "Unknown",
            date: new Date(commit.commit.author?.date || "").toLocaleDateString(),
            filesChanged: 0, // Requires detailed fetch, simplified for list
        }));
    }

    async getCommitDiff(owner: string, repo: string, ref: string): Promise<string> {
        const { data } = await this.octokit.rest.repos.getCommit({
            owner,
            repo,
            ref,
        });

        // Find patches
        // @ts-expect-error: Octokit types mismatch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patches = (data as any).files?.map((f: any) => `File: ${f.filename}\n${f.patch}`).join("\n\n") || "";
        return patches;
    }
}
