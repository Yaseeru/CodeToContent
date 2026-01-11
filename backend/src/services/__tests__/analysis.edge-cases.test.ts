import { AnalysisService } from '../AnalysisService';
import { GitHubService } from '../GitHubService';
import { Repository } from '../../models/Repository';
import { User } from '../../models/User';

// Unit tests for analysis edge cases
// Validates: Requirements 3.1
describe('AnalysisService Edge Cases', () => {
     let analysisService: AnalysisService;

     beforeAll(() => {
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          analysisService = new AnalysisService(process.env.GEMINI_API_KEY);
     });

     describe('Empty Repository Handling', () => {
          test('should handle repository with no README', async () => {
               const githubService = new GitHubService('test_token');

               // Mock responses for empty repository
               jest.spyOn(githubService, 'fetchRepositoryReadme').mockResolvedValue('');
               jest.spyOn(githubService, 'fetchCommitHistory').mockResolvedValue([
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
               jest.spyOn(githubService, 'fetchPullRequests').mockResolvedValue([]);
               jest.spyOn(githubService, 'fetchFileStructure').mockResolvedValue([
                    { name: '.gitignore', path: '.gitignore', type: 'file' },
               ]);
               jest.spyOn(githubService, 'fetchPackageJson').mockResolvedValue(null);

               const signals = await analysisService.collectRepositorySignals(
                    githubService,
                    'owner',
                    'repo'
               );

               // Verify empty README is handled
               expect(signals.readme).toBe('');
               expect(signals.commits.length).toBeGreaterThan(0);
               expect(signals.fileStructure.length).toBeGreaterThan(0);
          });

          test('should handle repository with no commits', async () => {
               const githubService = new GitHubService('test_token');

               // Mock responses for repository with no commits
               jest.spyOn(githubService, 'fetchRepositoryReadme').mockResolvedValue('# Test Repo\nA test repository.');
               jest.spyOn(githubService, 'fetchCommitHistory').mockResolvedValue([]);
               jest.spyOn(githubService, 'fetchPullRequests').mockResolvedValue([]);
               jest.spyOn(githubService, 'fetchFileStructure').mockResolvedValue([
                    { name: 'README.md', path: 'README.md', type: 'file' },
               ]);
               jest.spyOn(githubService, 'fetchPackageJson').mockResolvedValue(null);

               const signals = await analysisService.collectRepositorySignals(
                    githubService,
                    'owner',
                    'repo'
               );

               // Verify empty commits array is handled
               expect(signals.readme).toContain('Test Repo');
               expect(signals.commits).toEqual([]);
               expect(signals.pullRequests).toEqual([]);
               expect(signals.fileStructure.length).toBeGreaterThan(0);
          });

          test('should handle completely empty repository', async () => {
               const githubService = new GitHubService('test_token');

               // Mock responses for completely empty repository
               jest.spyOn(githubService, 'fetchRepositoryReadme').mockResolvedValue('');
               jest.spyOn(githubService, 'fetchCommitHistory').mockResolvedValue([]);
               jest.spyOn(githubService, 'fetchPullRequests').mockResolvedValue([]);
               jest.spyOn(githubService, 'fetchFileStructure').mockResolvedValue([]);
               jest.spyOn(githubService, 'fetchPackageJson').mockResolvedValue(null);

               const signals = await analysisService.collectRepositorySignals(
                    githubService,
                    'owner',
                    'repo'
               );

               // Verify all empty data is handled gracefully
               expect(signals.readme).toBe('');
               expect(signals.commits).toEqual([]);
               expect(signals.pullRequests).toEqual([]);
               expect(signals.fileStructure).toEqual([]);
               expect(signals.packageJson).toBeNull();
          });
     });

     describe('Prompt Construction Edge Cases', () => {
          test('should construct prompt with minimal data', () => {
               const signals = {
                    readme: '',
                    commits: [],
                    pullRequests: [],
                    fileStructure: [],
                    packageJson: null,
               };

               // Access private method via type assertion
               const prompt = (analysisService as any).constructAnalysisPrompt(
                    signals,
                    'test-repo',
                    'Test description'
               );

               // Verify prompt is constructed even with minimal data
               expect(prompt).toContain('test-repo');
               expect(prompt).toContain('Test description');
               expect(prompt).toContain('No commits found');
               expect(prompt).toContain('No pull requests found');
          });

          test('should construct prompt with no description', () => {
               const signals = {
                    readme: '# Test',
                    commits: [
                         {
                              sha: 'abc123',
                              commit: {
                                   message: 'Test commit',
                                   author: {
                                        name: 'Test User',
                                        email: 'test@example.com',
                                        date: '2024-01-01T00:00:00Z',
                                   },
                              },
                              html_url: 'https://github.com/test/test/commit/abc123',
                         },
                    ],
                    pullRequests: [],
                    fileStructure: [{ name: 'README.md', path: 'README.md', type: 'file' as const }],
                    packageJson: null,
               };

               const prompt = (analysisService as any).constructAnalysisPrompt(
                    signals,
                    'test-repo',
                    ''
               );

               // Verify prompt handles missing description
               expect(prompt).toContain('test-repo');
               expect(prompt).toContain('No description provided');
               expect(prompt).toContain('Test commit');
          });

          test('should truncate very long README', () => {
               const longReadme = 'A'.repeat(5000);
               const signals = {
                    readme: longReadme,
                    commits: [],
                    pullRequests: [],
                    fileStructure: [],
                    packageJson: null,
               };

               const prompt = (analysisService as any).constructAnalysisPrompt(
                    signals,
                    'test-repo',
                    'Test description'
               );

               // Verify README is truncated to 2000 chars
               const readmeInPrompt = prompt.match(/README Content.*?Recent Commits:/s)?.[0];
               expect(readmeInPrompt).toBeTruthy();
               // The truncated README should be around 2000 chars, not 5000
               expect(prompt.length).toBeLessThan(longReadme.length + 1000);
          });
     });

     describe('Gemini Response Parsing Edge Cases', () => {
          test('should parse response with markdown code blocks', () => {
               const responseWithMarkdown = '```json\n{"problemStatement":"Test","targetAudience":"Developers","coreFunctionality":["Feature 1"],"notableFeatures":[],"recentChanges":[],"integrations":[],"valueProposition":"Value"}\n```';

               const parsed = (analysisService as any).parseGeminiResponse(responseWithMarkdown);

               expect(parsed.problemStatement).toBe('Test');
               expect(parsed.targetAudience).toBe('Developers');
               expect(parsed.coreFunctionality).toEqual(['Feature 1']);
          });

          test('should parse response without markdown', () => {
               const responseWithoutMarkdown = '{"problemStatement":"Test","targetAudience":"Developers","coreFunctionality":["Feature 1"],"notableFeatures":[],"recentChanges":[],"integrations":[],"valueProposition":"Value"}';

               const parsed = (analysisService as any).parseGeminiResponse(responseWithoutMarkdown);

               expect(parsed.problemStatement).toBe('Test');
               expect(parsed.targetAudience).toBe('Developers');
               expect(parsed.coreFunctionality).toEqual(['Feature 1']);
          });

          test('should throw error for invalid JSON', () => {
               const invalidResponse = 'This is not JSON';

               expect(() => {
                    (analysisService as any).parseGeminiResponse(invalidResponse);
               }).toThrow('Failed to parse Gemini response as JSON');
          });

          test('should throw error for missing required fields', () => {
               const incompleteResponse = '{"problemStatement":"Test"}';

               expect(() => {
                    (analysisService as any).parseGeminiResponse(incompleteResponse);
               }).toThrow();
          });

          test('should throw error for empty coreFunctionality array', () => {
               const responseWithEmptyArray = '{"problemStatement":"Test","targetAudience":"Developers","coreFunctionality":[],"notableFeatures":[],"recentChanges":[],"integrations":[],"valueProposition":"Value"}';

               expect(() => {
                    (analysisService as any).parseGeminiResponse(responseWithEmptyArray);
               }).toThrow('Missing or invalid coreFunctionality');
          });
     });

     describe('Repository Not Found', () => {
          test('should throw error when repository does not exist', async () => {
               const nonExistentId = '507f1f77bcf86cd799439011';

               await expect(
                    analysisService.analyzeRepository(nonExistentId, 'user123', 'token')
               ).rejects.toThrow('Repository not found');
          });

          test('should throw error for invalid repository fullName format', async () => {
               // Create test user
               const user = new User({
                    githubId: 'github_123',
                    username: 'testuser',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
               });
               await user.save();

               // Create repository with invalid fullName (missing slash)
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_123',
                    name: 'test-repo',
                    fullName: 'invalidformat', // Should be "owner/repo"
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               await expect(
                    analysisService.analyzeRepository(
                         repository._id.toString(),
                         user._id.toString(),
                         'test_token'
                    )
               ).rejects.toThrow('Invalid repository fullName format');
          });
     });
});
