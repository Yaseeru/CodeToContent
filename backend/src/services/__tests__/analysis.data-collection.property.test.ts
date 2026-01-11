import * as fc from 'fast-check';
import { AnalysisService } from '../AnalysisService';
import { GitHubService } from '../GitHubService';

// Feature: code-to-content, Property 7: Analysis Data Collection
// Validates: Requirements 3.2
describe('AnalysisService Data Collection Property Tests', () => {
     let analysisService: AnalysisService;

     beforeAll(() => {
          // Set up Gemini API key for testing
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          analysisService = new AnalysisService(process.env.GEMINI_API_KEY);
     });

     describe('Property 7: Analysis Data Collection', () => {
          test('for any repository analysis, the system should fetch and examine README files, file structure, commit history, and pull request descriptions', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 3, maxLength: 20 }), // owner
                         fc.string({ minLength: 3, maxLength: 20 }), // repo
                         fc.string({ minLength: 20, maxLength: 40 }), // access token
                         async (owner, repo, accessToken) => {
                              // Create a mock GitHubService
                              const githubService = new GitHubService(accessToken);

                              // Spy on GitHubService methods to verify they are called
                              const readmeSpy = jest.spyOn(githubService, 'fetchRepositoryReadme');
                              const commitsSpy = jest.spyOn(githubService, 'fetchCommitHistory');
                              const prsSpy = jest.spyOn(githubService, 'fetchPullRequests');
                              const fileStructureSpy = jest.spyOn(githubService, 'fetchFileStructure');
                              const packageJsonSpy = jest.spyOn(githubService, 'fetchPackageJson');

                              // Mock the responses to avoid actual API calls
                              readmeSpy.mockResolvedValue('# Test README\nThis is a test repository.');
                              commitsSpy.mockResolvedValue([
                                   {
                                        sha: 'abc123',
                                        commit: {
                                             message: 'Initial commit',
                                             author: {
                                                  name: 'Test User',
                                                  email: 'test@example.com',
                                                  date: '2024-01-01T00:00:00Z',
                                             },
                                        },
                                        html_url: 'https://github.com/test/test/commit/abc123',
                                   },
                              ]);
                              prsSpy.mockResolvedValue([
                                   {
                                        number: 1,
                                        title: 'Add feature',
                                        body: 'This PR adds a new feature',
                                        state: 'closed',
                                        created_at: '2024-01-01T00:00:00Z',
                                        merged_at: '2024-01-02T00:00:00Z',
                                        html_url: 'https://github.com/test/test/pull/1',
                                   },
                              ]);
                              fileStructureSpy.mockResolvedValue([
                                   {
                                        name: 'README.md',
                                        path: 'README.md',
                                        type: 'file',
                                        size: 100,
                                        download_url: 'https://raw.githubusercontent.com/test/test/main/README.md',
                                   },
                                   {
                                        name: 'src',
                                        path: 'src',
                                        type: 'dir',
                                   },
                              ]);
                              packageJsonSpy.mockResolvedValue({
                                   name: 'test-package',
                                   version: '1.0.0',
                                   dependencies: {
                                        express: '^4.18.0',
                                   },
                              });

                              try {
                                   // Call collectRepositorySignals
                                   const signals = await analysisService.collectRepositorySignals(
                                        githubService,
                                        owner,
                                        repo
                                   );

                                   // Verify all required methods were called
                                   expect(readmeSpy).toHaveBeenCalledWith(owner, repo);
                                   expect(commitsSpy).toHaveBeenCalledWith(owner, repo, 50);
                                   expect(prsSpy).toHaveBeenCalledWith(owner, repo, 'all', 30);
                                   expect(fileStructureSpy).toHaveBeenCalledWith(owner, repo);
                                   expect(packageJsonSpy).toHaveBeenCalledWith(owner, repo);

                                   // Verify signals contain all required data
                                   expect(signals).toHaveProperty('readme');
                                   expect(signals).toHaveProperty('commits');
                                   expect(signals).toHaveProperty('pullRequests');
                                   expect(signals).toHaveProperty('fileStructure');
                                   expect(signals).toHaveProperty('packageJson');

                                   // Verify data types
                                   expect(typeof signals.readme).toBe('string');
                                   expect(Array.isArray(signals.commits)).toBe(true);
                                   expect(Array.isArray(signals.pullRequests)).toBe(true);
                                   expect(Array.isArray(signals.fileStructure)).toBe(true);

                                   // Verify the collected data matches what was mocked
                                   expect(signals.readme).toContain('Test README');
                                   expect(signals.commits.length).toBeGreaterThan(0);
                                   expect(signals.pullRequests.length).toBeGreaterThan(0);
                                   expect(signals.fileStructure.length).toBeGreaterThan(0);
                              } finally {
                                   // Restore mocks
                                   readmeSpy.mockRestore();
                                   commitsSpy.mockRestore();
                                   prsSpy.mockRestore();
                                   fileStructureSpy.mockRestore();
                                   packageJsonSpy.mockRestore();
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          test('for any repository with missing data sources, the system should handle gracefully and still collect available data', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 3, maxLength: 20 }), // owner
                         fc.string({ minLength: 3, maxLength: 20 }), // repo
                         fc.string({ minLength: 20, maxLength: 40 }), // access token
                         async (owner, repo, accessToken) => {
                              // Create a mock GitHubService
                              const githubService = new GitHubService(accessToken);

                              // Spy on GitHubService methods
                              const readmeSpy = jest.spyOn(githubService, 'fetchRepositoryReadme');
                              const commitsSpy = jest.spyOn(githubService, 'fetchCommitHistory');
                              const prsSpy = jest.spyOn(githubService, 'fetchPullRequests');
                              const fileStructureSpy = jest.spyOn(githubService, 'fetchFileStructure');
                              const packageJsonSpy = jest.spyOn(githubService, 'fetchPackageJson');

                              // Mock responses with some missing data (empty arrays, empty strings, null)
                              readmeSpy.mockResolvedValue(''); // No README
                              commitsSpy.mockResolvedValue([]); // No commits
                              prsSpy.mockResolvedValue([]); // No PRs
                              fileStructureSpy.mockResolvedValue([
                                   {
                                        name: '.gitignore',
                                        path: '.gitignore',
                                        type: 'file',
                                   },
                              ]);
                              packageJsonSpy.mockResolvedValue(null); // No package.json

                              try {
                                   // Call collectRepositorySignals
                                   const signals = await analysisService.collectRepositorySignals(
                                        githubService,
                                        owner,
                                        repo
                                   );

                                   // Verify all methods were still called
                                   expect(readmeSpy).toHaveBeenCalled();
                                   expect(commitsSpy).toHaveBeenCalled();
                                   expect(prsSpy).toHaveBeenCalled();
                                   expect(fileStructureSpy).toHaveBeenCalled();
                                   expect(packageJsonSpy).toHaveBeenCalled();

                                   // Verify signals structure is still valid even with missing data
                                   expect(signals).toHaveProperty('readme');
                                   expect(signals).toHaveProperty('commits');
                                   expect(signals).toHaveProperty('pullRequests');
                                   expect(signals).toHaveProperty('fileStructure');
                                   expect(signals).toHaveProperty('packageJson');

                                   // Verify empty/null values are handled
                                   expect(signals.readme).toBe('');
                                   expect(signals.commits).toEqual([]);
                                   expect(signals.pullRequests).toEqual([]);
                                   expect(signals.fileStructure.length).toBeGreaterThanOrEqual(0);
                                   expect(signals.packageJson).toBeNull();
                              } finally {
                                   // Restore mocks
                                   readmeSpy.mockRestore();
                                   commitsSpy.mockRestore();
                                   prsSpy.mockRestore();
                                   fileStructureSpy.mockRestore();
                                   packageJsonSpy.mockRestore();
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});
