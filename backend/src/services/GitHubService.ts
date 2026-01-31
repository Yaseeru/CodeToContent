import axios, { AxiosError, AxiosInstance } from 'axios';
import { GITHUB_CONFIG } from '../config/constants';

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
     async fetchUserRepositories(page: number = GITHUB_CONFIG.DEFAULT_PAGE, perPage: number = GITHUB_CONFIG.DEFAULT_PER_PAGE): Promise<GitHubRepository[]> {
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
     async fetchCommitHistory(owner: string, repo: string, limit: number = GITHUB_CONFIG.COMMIT_HISTORY_LIMIT): Promise<GitHubCommit[]> {
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
     async fetchPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all', limit: number = GITHUB_CONFIG.PULL_REQUEST_LIMIT): Promise<GitHubPullRequest[]> {
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
      * Recursively fetch all files in repository (up to a depth limit)
      * This is needed because fetchFileStructure only returns one directory level
      */
     async fetchAllFiles(owner: string, repo: string, maxDepth: number = 3): Promise<GitHubContent[]> {
          const allFiles: GitHubContent[] = [];
          const visited = new Set<string>();

          const fetchRecursive = async (path: string = '', depth: number = 0): Promise<void> => {
               if (depth > maxDepth || visited.has(path)) {
                    return;
               }

               visited.add(path);

               try {
                    const contents = await this.fetchFileStructure(owner, repo, path);

                    for (const item of contents) {
                         if (item.type === 'file') {
                              allFiles.push(item);
                         } else if (item.type === 'dir' && depth < maxDepth) {
                              // Recursively fetch directory contents
                              await fetchRecursive(item.path, depth + 1);
                         }
                    }
               } catch (error) {
                    // Skip directories that can't be accessed
                    console.warn(`Failed to fetch directory ${path}:`, error);
               }
          };

          await fetchRecursive('', 0);
          return allFiles;
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

     /**
      * Fetch file content from repository
      * Returns the decoded content as a string
      * 
      * @param owner - Repository owner
      * @param repo - Repository name
      * @param filePath - File path in repository
      * @param ref - Git reference (branch/commit SHA), optional
      */
     async fetchFileContent(owner: string, repo: string, filePath: string, ref?: string): Promise<string> {
          try {
               // Build URL with optional ref parameter
               const url = `/repos/${owner}/${repo}/contents/${filePath}${ref ? `?ref=${ref}` : ''}`;
               const response = await this.client.get<GitHubReadme>(url);

               // Decode base64 content
               const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
               return content;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                         throw new Error(`File not found: ${filePath}`);
                    }
                    if (error.response?.status === 403) {
                         throw new Error('Access forbidden. Repository may be private or token lacks permissions.');
                    }
                    throw new Error(`Failed to fetch file content: ${error.message}`);
               }
               throw error;
          }
     }
}
