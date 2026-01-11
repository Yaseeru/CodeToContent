import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { AnalysisService } from '../AnalysisService';
import { GitHubService } from '../GitHubService';
import { Repository } from '../../models/Repository';
import { User } from '../../models/User';
import { Analysis } from '../../models/Analysis';

// Feature: code-to-content, Property 8: Analysis Output Structure
// Validates: Requirements 3.3, 3.5
describe('AnalysisService Output Structure Property Tests', () => {
     let analysisService: AnalysisService;

     beforeAll(() => {
          // Set up Gemini API key for testing
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          analysisService = new AnalysisService(process.env.GEMINI_API_KEY);
     });

     describe('Property 8: Analysis Output Structure', () => {
          test('for any completed repository analysis, the resulting Summary should contain all required fields', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 5, maxLength: 30 }), // repo name
                         fc.string({ minLength: 10, maxLength: 100 }), // repo description
                         fc.string({ minLength: 3, maxLength: 20 }), // owner
                         fc.string({ minLength: 20, maxLength: 40 }), // access token
                         async (repoName, repoDescription, owner, accessToken) => {
                              // Create test user
                              const user = new User({
                                   githubId: `github_${Math.random()}`,
                                   username: `testuser_${Math.random()}`,
                                   accessToken: accessToken,
                                   avatarUrl: 'https://example.com/avatar.png',
                              });
                              await user.save();

                              // Create test repository
                              const repository = new Repository({
                                   userId: user._id,
                                   githubRepoId: `repo_${Math.random()}`,
                                   name: repoName,
                                   fullName: `${owner}/${repoName}`,
                                   description: repoDescription,
                                   url: `https://github.com/${owner}/${repoName}`,
                              });
                              await repository.save();

                              // Mock GitHubService methods
                              const mockGithubService = {
                                   fetchRepositoryReadme: jest.fn().mockResolvedValue('# Test README\nThis is a test.'),
                                   fetchCommitHistory: jest.fn().mockResolvedValue([
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
                                   ]),
                                   fetchPullRequests: jest.fn().mockResolvedValue([]),
                                   fetchFileStructure: jest.fn().mockResolvedValue([
                                        { name: 'README.md', path: 'README.md', type: 'file' as const },
                                   ]),
                                   fetchPackageJson: jest.fn().mockResolvedValue(null),
                              };

                              // Mock Gemini API response with valid JSON
                              const mockGeminiResponse = JSON.stringify({
                                   problemStatement: 'This repository solves a test problem.',
                                   targetAudience: 'Developers and testers',
                                   coreFunctionality: ['Feature 1', 'Feature 2', 'Feature 3'],
                                   notableFeatures: ['Notable feature 1', 'Notable feature 2'],
                                   recentChanges: ['Recent change 1'],
                                   integrations: ['Integration 1', 'Integration 2'],
                                   valueProposition: 'This provides value by testing.',
                              });

                              // Spy on collectRepositorySignals and callGeminiAPI
                              const collectSignalsSpy = jest
                                   .spyOn(analysisService, 'collectRepositorySignals')
                                   .mockResolvedValue({
                                        readme: '# Test README',
                                        commits: mockGithubService.fetchCommitHistory() as any,
                                        pullRequests: [],
                                        fileStructure: mockGithubService.fetchFileStructure() as any,
                                        packageJson: null,
                                   });

                              const callGeminiSpy = jest
                                   .spyOn(analysisService as any, 'callGeminiAPI')
                                   .mockResolvedValue(mockGeminiResponse);

                              try {
                                   // Perform analysis
                                   const analysis = await analysisService.analyzeRepository(
                                        repository._id.toString(),
                                        user._id.toString(),
                                        accessToken
                                   );

                                   // Verify all required fields are present
                                   expect(analysis).toHaveProperty('problemStatement');
                                   expect(analysis).toHaveProperty('targetAudience');
                                   expect(analysis).toHaveProperty('coreFunctionality');
                                   expect(analysis).toHaveProperty('notableFeatures');
                                   expect(analysis).toHaveProperty('recentChanges');
                                   expect(analysis).toHaveProperty('integrations');
                                   expect(analysis).toHaveProperty('valueProposition');
                                   expect(analysis).toHaveProperty('rawSignals');

                                   // Verify field types
                                   expect(typeof analysis.problemStatement).toBe('string');
                                   expect(typeof analysis.targetAudience).toBe('string');
                                   expect(Array.isArray(analysis.coreFunctionality)).toBe(true);
                                   expect(Array.isArray(analysis.notableFeatures)).toBe(true);
                                   expect(Array.isArray(analysis.recentChanges)).toBe(true);
                                   expect(Array.isArray(analysis.integrations)).toBe(true);
                                   expect(typeof analysis.valueProposition).toBe('string');

                                   // Verify coreFunctionality is non-empty (required by schema)
                                   expect(analysis.coreFunctionality.length).toBeGreaterThan(0);

                                   // Verify rawSignals structure
                                   expect(analysis.rawSignals).toHaveProperty('readmeLength');
                                   expect(analysis.rawSignals).toHaveProperty('commitCount');
                                   expect(analysis.rawSignals).toHaveProperty('prCount');
                                   expect(analysis.rawSignals).toHaveProperty('fileStructure');
                                   expect(typeof analysis.rawSignals.readmeLength).toBe('number');
                                   expect(typeof analysis.rawSignals.commitCount).toBe('number');
                                   expect(typeof analysis.rawSignals.prCount).toBe('number');
                                   expect(Array.isArray(analysis.rawSignals.fileStructure)).toBe(true);

                                   // Verify references are set correctly
                                   expect(analysis.repositoryId.toString()).toBe(repository._id.toString());
                                   expect(analysis.userId.toString()).toBe(user._id.toString());

                                   // Verify analysis is persisted
                                   const savedAnalysis = await Analysis.findById(analysis._id);
                                   expect(savedAnalysis).not.toBeNull();
                                   expect(savedAnalysis!.problemStatement).toBe(analysis.problemStatement);
                              } finally {
                                   // Cleanup
                                   collectSignalsSpy.mockRestore();
                                   callGeminiSpy.mockRestore();
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          test('for any analysis with varying data, all required fields should be present and valid', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.record({
                              problemStatement: fc.string({ minLength: 10, maxLength: 200 }),
                              targetAudience: fc.string({ minLength: 5, maxLength: 100 }),
                              coreFunctionality: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
                                   minLength: 1,
                                   maxLength: 10,
                              }),
                              notableFeatures: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
                                   minLength: 0,
                                   maxLength: 10,
                              }),
                              recentChanges: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
                                   minLength: 0,
                                   maxLength: 10,
                              }),
                              integrations: fc.array(fc.string({ minLength: 3, maxLength: 30 }), {
                                   minLength: 0,
                                   maxLength: 15,
                              }),
                              valueProposition: fc.string({ minLength: 10, maxLength: 200 }),
                         }),
                         async (analysisData) => {
                              // Create test user
                              const user = new User({
                                   githubId: `github_${Math.random()}`,
                                   username: `testuser_${Math.random()}`,
                                   accessToken: 'test_token',
                                   avatarUrl: 'https://example.com/avatar.png',
                              });
                              await user.save();

                              // Create test repository
                              const repository = new Repository({
                                   userId: user._id,
                                   githubRepoId: `repo_${Math.random()}`,
                                   name: 'test-repo',
                                   fullName: 'owner/test-repo',
                                   description: 'Test repository',
                                   url: 'https://github.com/owner/test-repo',
                              });
                              await repository.save();

                              // Create analysis directly with varying data
                              const analysis = new Analysis({
                                   repositoryId: repository._id,
                                   userId: user._id,
                                   problemStatement: analysisData.problemStatement,
                                   targetAudience: analysisData.targetAudience,
                                   coreFunctionality: analysisData.coreFunctionality,
                                   notableFeatures: analysisData.notableFeatures,
                                   recentChanges: analysisData.recentChanges,
                                   integrations: analysisData.integrations,
                                   valueProposition: analysisData.valueProposition,
                                   rawSignals: {
                                        readmeLength: 100,
                                        commitCount: 10,
                                        prCount: 5,
                                        fileStructure: ['README.md', 'src/index.ts'],
                                   },
                              });

                              await analysis.save();

                              // Retrieve and verify
                              const savedAnalysis = await Analysis.findById(analysis._id);
                              expect(savedAnalysis).not.toBeNull();

                              // Verify all required fields are present
                              expect(savedAnalysis!.problemStatement).toBe(analysisData.problemStatement);
                              expect(savedAnalysis!.targetAudience).toBe(analysisData.targetAudience);
                              expect(savedAnalysis!.coreFunctionality).toEqual(analysisData.coreFunctionality);
                              expect(savedAnalysis!.notableFeatures).toEqual(analysisData.notableFeatures);
                              expect(savedAnalysis!.recentChanges).toEqual(analysisData.recentChanges);
                              expect(savedAnalysis!.integrations).toEqual(analysisData.integrations);
                              expect(savedAnalysis!.valueProposition).toBe(analysisData.valueProposition);

                              // Verify structure is maintained
                              expect(Array.isArray(savedAnalysis!.coreFunctionality)).toBe(true);
                              expect(savedAnalysis!.coreFunctionality.length).toBeGreaterThan(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});
