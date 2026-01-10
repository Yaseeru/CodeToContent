import { Octokit } from "octokit";
import { Repository, Commit } from "@/types";
import { ExternalAPIError } from "@/lib/errors";

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
        try {
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
        } catch (error) {
            throw new ExternalAPIError("Failed to fetch repositories from GitHub", {
                api: "GitHub",
                endpoint: "/user/repos",
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    async getCommits(owner: string, repo: string): Promise<Commit[]> {
        try {
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
        } catch (error) {
            throw new ExternalAPIError("Failed to fetch commits from GitHub", {
                api: "GitHub",
                endpoint: `/repos/${owner}/${repo}/commits`,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    async getCommitDiff(owner: string, repo: string, ref: string): Promise<string> {
        try {
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
        } catch (error) {
            throw new ExternalAPIError("Failed to fetch commit diff from GitHub", {
                api: "GitHub",
                endpoint: `/repos/${owner}/${repo}/commits/${ref}`,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
