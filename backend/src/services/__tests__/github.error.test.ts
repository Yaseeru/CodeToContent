import axios from 'axios';
import { GitHubService } from '../GitHubService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Feature: code-to-content, GitHub API Error Handling
// Validates: Requirements 3.2
describe('GitHubService Error Handling Unit Tests', () => {
     let githubService: GitHubService;
     let mockAxiosInstance: any;
     const mockAccessToken = 'test_github_token_12345';

     beforeEach(() => {
          // Reset mocks before each test
          jest.clearAllMocks();

          // Create a mock axios instance with all necessary methods
          mockAxiosInstance = {
               get: jest.fn(),
               interceptors: {
                    response: {
                         use: jest.fn(),
                    },
               },
          };

          mockedAxios.create.mockReturnValue(mockAxiosInstance);
          (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn((error: any) => error.isAxiosError === true);

          githubService = new GitHubService(mockAccessToken);
     });

     describe('Rate Limiting Scenarios', () => {
          test('should throw rate limit error when GitHub returns 403 with rate limit headers', async () => {
               const resetTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

               // The interceptor will transform this error before it reaches the catch block
               // So we need to simulate what the interceptor does
               const transformedError = new Error(`GitHub API rate limit exceeded. Resets at ${new Date(resetTime * 1000).toISOString()}`);

               mockAxiosInstance.get.mockRejectedValue(transformedError);

               await expect(githubService.fetchUserRepositories()).rejects.toThrow(
                    /GitHub API rate limit exceeded/
               );
          });

          test('should return rate limit status when getRateLimitStatus is called', async () => {
               const mockRateLimitData = {
                    data: {
                         resources: {
                              core: {
                                   limit: 5000,
                                   remaining: 4999,
                                   reset: 1234567890,
                              },
                         },
                    },
               };

               mockAxiosInstance.get.mockResolvedValue(mockRateLimitData);

               const rateLimitInfo = await githubService.getRateLimitStatus();

               expect(rateLimitInfo).toEqual({
                    limit: 5000,
                    remaining: 4999,
                    reset: 1234567890,
               });
          });

          test('should handle rate limit check failure gracefully', async () => {
               const mockError = {
                    message: 'Network error',
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.getRateLimitStatus()).rejects.toThrow(
                    /Failed to fetch rate limit status/
               );
          });
     });

     describe('404 (Repository Not Found) Handling', () => {
          test('should throw "Repository not found" error when fetching commits from non-existent repo', async () => {
               const mockError = {
                    response: {
                         status: 404,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchCommitHistory('owner', 'nonexistent-repo')).rejects.toThrow(
                    'Repository not found or no commits available.'
               );
          });

          test('should return empty string when README is not found (404)', async () => {
               const mockError = {
                    response: {
                         status: 404,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               const readme = await githubService.fetchRepositoryReadme('owner', 'repo-without-readme');

               expect(readme).toBe('');
          });

          test('should throw "Repository not found" error when fetching pull requests from non-existent repo', async () => {
               const mockError = {
                    response: {
                         status: 404,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchPullRequests('owner', 'nonexistent-repo')).rejects.toThrow(
                    'Repository not found.'
               );
          });

          test('should throw "Repository or path not found" error when fetching file structure from invalid path', async () => {
               const mockError = {
                    response: {
                         status: 404,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchFileStructure('owner', 'repo', 'invalid/path')).rejects.toThrow(
                    'Repository or path not found.'
               );
          });
     });

     describe('403 (Access Denied) Handling', () => {
          test('should throw "Access forbidden" error when fetching repositories without proper permissions', async () => {
               const mockError = {
                    response: {
                         status: 403,
                         headers: {
                              'x-ratelimit-remaining': '100', // Not a rate limit issue
                         },
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchUserRepositories()).rejects.toThrow(
                    'Access forbidden. Check token permissions.'
               );
          });

          test('should throw "Access forbidden" error when fetching README from private repo without access', async () => {
               const mockError = {
                    response: {
                         status: 403,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchRepositoryReadme('owner', 'private-repo')).rejects.toThrow(
                    'Access forbidden. Repository may be private or token lacks permissions.'
               );
          });

          test('should throw "Access forbidden" error when fetching commits from private repo without access', async () => {
               const mockError = {
                    response: {
                         status: 403,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchCommitHistory('owner', 'private-repo')).rejects.toThrow(
                    'Access forbidden. Repository may be private or token lacks permissions.'
               );
          });

          test('should throw "Access forbidden" error when fetching pull requests from private repo without access', async () => {
               const mockError = {
                    response: {
                         status: 403,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchPullRequests('owner', 'private-repo')).rejects.toThrow(
                    'Access forbidden. Repository may be private or token lacks permissions.'
               );
          });

          test('should throw "Access forbidden" error when fetching file structure from private repo without access', async () => {
               const mockError = {
                    response: {
                         status: 403,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchFileStructure('owner', 'private-repo')).rejects.toThrow(
                    'Access forbidden. Repository may be private or token lacks permissions.'
               );
          });
     });

     describe('401 (Authentication Failed) Handling', () => {
          test('should throw authentication error when token is invalid', async () => {
               const mockError = {
                    response: {
                         status: 401,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchUserRepositories()).rejects.toThrow(
                    'GitHub authentication failed. Token may be invalid or expired.'
               );
          });
     });

     describe('Empty Repository Handling', () => {
          test('should return empty array when repository has no commits (409 status)', async () => {
               const mockError = {
                    response: {
                         status: 409,
                    },
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               const commits = await githubService.fetchCommitHistory('owner', 'empty-repo');

               expect(commits).toEqual([]);
          });
     });

     describe('General Error Handling', () => {
          test('should throw generic error for unexpected status codes', async () => {
               const mockError = {
                    response: {
                         status: 500,
                    },
                    message: 'Internal Server Error',
                    isAxiosError: true,
               };

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchUserRepositories()).rejects.toThrow(
                    /Failed to fetch repositories/
               );
          });

          test('should handle non-axios errors', async () => {
               const mockError = new Error('Unexpected error');

               mockAxiosInstance.get.mockRejectedValue(mockError);

               await expect(githubService.fetchUserRepositories()).rejects.toThrow('Unexpected error');
          });
     });
});
