import axios, { AxiosError, AxiosInstance } from 'axios';

export interface GitHubRepository {
     id: number;
     name: string;
     full_name: string;
     description: string | null;
     html_url: string;
     private: boolean;
     owner: {
          login: string;
     };
     updated_at: string;
}

export interface GitHubCommit {
     sha: string;
     commit: {
          message: string;
          author: {
               name: string;
               email: string;
               date: string;
          };
     };
     html_url: string;
}

export interface GitHubPullRequest {
     number: number;
     title: string;
     body: string | null;
     state: string;
     created_at: string;
     merged_at: string | null;
     html_url: string;
}

export interface GitHubContent {
     name: string;
     path: string;
     type: 'file' | 'dir';
     size?: number;
     download_url?: string | null;
}

export interface GitHubReadme {
     content: string; // Base64 encoded
     encoding: string;
     name: string;
     path: string;
}

export interface RateLimitInfo {
     limit: number;
     remaining: number;
     reset: number; // Unix timestamp
}

export class GitHubService {
     private client: AxiosInstance;
     private accessToken: string;

     constructor(accessToken: string) {
          this.accessToken = accessToken;
          this.client = axios.create({
               baseURL: 'https://api.github.com',
               headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
               },
          });

          // Add response interceptor for rate limiting
          this.client.interceptors.response.use(
               (response) => response,
               (error: AxiosError) => {
                    if (error.response?.status === 403) {
                         const rateLimitRemaining = error.response.headers['x-ratelimit-remaining'];
                         if (rateLimitRemaining === '0') {
                              const resetTime = error.response.headers['x-ratelimit-reset'];
                              throw new Error(`GitHub API rate limit exceeded. Resets at ${new Date(parseInt(resetTime) * 1000).toISOString()}`);
                         }
                    }
                    throw error;
               }
          );
     }

     /**
      * Fetch user's repositories
      */
     async fetchUserRepositories(page: number = 1, perPage: number = 100): Promise<GitHubRepository[]> {
          try {
               const response = await this.client.get<GitHubRepository[]>('/user/repos', {
                    params: {
                         page,
                         per_page: perPage,
                         sort: 'updated',
                         affiliation: 'owner,collaborator',
                    },
               });

               return response.data;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    if (error.response?.status === 401) {
                         throw new Error('GitHub authentication failed. Token may be invalid or expired.');
                    }
                    if (error.response?.status === 403) {
                         throw new Error('Access forbidden. Check token permissions.');
                    }
                    throw new Error(`Failed to fetch repositories: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Fetch repository README
      */
     async fetchRepositoryReadme(owner: string, repo: string): Promise<string> {
          try {
               const response = await this.client.get<GitHubReadme>(`/repos/${owner}/${repo}/readme`);

               // Decode base64 content
               const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
               return content;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                         // No README found - return empty string
                         return '';
                    }
                    if (error.response?.status === 403) {
                         throw new Error('Access forbidden. Repository may be private or token lacks permissions.');
                    }
                    throw new Error(`Failed to fetch README: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Fetch commit history
      */
     async fetchCommitHistory(owner: string, repo: string, limit: number = 50): Promise<GitHubCommit[]> {
          try {
               const response = await this.client.get<GitHubCommit[]>(`/repos/${owner}/${repo}/commits`, {
                    params: {
                         per_page: limit,
                    },
               });

               return response.data;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                         throw new Error('Repository not found or no commits available.');
                    }
                    if (error.response?.status === 403) {
                         throw new Error('Access forbidden. Repository may be private or token lacks permissions.');
                    }
                    if (error.response?.status === 409) {
                         // Empty repository
                         return [];
                    }
                    throw new Error(`Failed to fetch commit history: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Fetch pull request data
      */
     async fetchPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all', limit: number = 50): Promise<GitHubPullRequest[]> {
          try {
               const response = await this.client.get<GitHubPullRequest[]>(`/repos/${owner}/${repo}/pulls`, {
                    params: {
                         state,
                         per_page: limit,
                         sort: 'updated',
                         direction: 'desc',
                    },
               });

               return response.data;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                         throw new Error('Repository not found.');
                    }
                    if (error.response?.status === 403) {
                         throw new Error('Access forbidden. Repository may be private or token lacks permissions.');
                    }
                    throw new Error(`Failed to fetch pull requests: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Fetch file structure (directory contents)
      */
     async fetchFileStructure(owner: string, repo: string, path: string = ''): Promise<GitHubContent[]> {
          try {
               const response = await this.client.get<GitHubContent[]>(`/repos/${owner}/${repo}/contents/${path}`);

               return response.data;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                         throw new Error('Repository or path not found.');
                    }
                    if (error.response?.status === 403) {
                         throw new Error('Access forbidden. Repository may be private or token lacks permissions.');
                    }
                    throw new Error(`Failed to fetch file structure: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Get current rate limit status
      */
     async getRateLimitStatus(): Promise<RateLimitInfo> {
          try {
               const response = await this.client.get('/rate_limit');
               const coreLimit = response.data.resources.core;

               return {
                    limit: coreLimit.limit,
                    remaining: coreLimit.remaining,
                    reset: coreLimit.reset,
               };
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to fetch rate limit status: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Fetch package.json content (for Node.js projects)
      */
     async fetchPackageJson(owner: string, repo: string): Promise<any | null> {
          try {
               const response = await this.client.get<GitHubReadme>(`/repos/${owner}/${repo}/contents/package.json`);
               const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
               return JSON.parse(content);
          } catch (error) {
               if (axios.isAxiosError(error) && error.response?.status === 404) {
                    // No package.json found
                    return null;
               }
               throw error;
          }
     }
}
