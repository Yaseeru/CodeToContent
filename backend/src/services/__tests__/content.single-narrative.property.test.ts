import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Content } from '../../models/Content';

// Feature: code-to-content, Property 11: Single Narrative Generation
// Validates: Requirements 4.3
describe('ContentGenerationService Single Narrative Property Tests', () => {
     let contentService: ContentGenerationService;

     beforeAll(() => {
          // Set up Gemini API key for testing
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          contentService = new ContentGenerationService(process.env.GEMINI_API_KEY);
     });

     describe('Property 11: Single Narrative Generation', () => {
          test(
               'for any repository, content generation should produce exactly one coherent narrative per platform, not multiple fragments or per-commit content',
               async () => {
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
                                        minLength: 1,
                                        maxLength: 20,
                                   }),
                                   integrations: fc.array(fc.string({ minLength: 3, maxLength: 30 }), {
                                        minLength: 0,
                                        maxLength: 15,
                                   }),
                                   valueProposition: fc.string({ minLength: 10, maxLength: 200 }),
                              }),
                              fc.constantFrom('linkedin', 'x'), // platform
                              fc.string({ minLength: 5, maxLength: 30 }), // tone
                              async (analysisData, platform, tone) => {
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

                                   // Create analysis with multiple recent changes (simulating multiple commits/PRs)
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
                                             commitCount: analysisData.recentChanges.length,
                                             prCount: Math.floor(analysisData.recentChanges.length / 2),
                                             fileStructure: ['README.md', 'src/index.ts'],
                                        },
                                   });
                                   await analysis.save();

                                   // Mock Gemini API to return a single coherent narrative
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             const prompt = args[0] as string;

                                             // Verify prompt instructs to generate ONE coherent narrative
                                             expect(prompt).toContain('ONE coherent narrative');
                                             expect(prompt).toContain('Do not create multiple posts or per-commit content');

                                             // Return a single coherent narrative (not per-commit fragments)
                                             return `This is a single coherent narrative about the repository. It discusses the problem, solution, and recent improvements as a unified story, not as separate commit-by-commit updates.`;
                                        });

                                   try {
                                        // Generate content
                                        const content = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: platform as 'linkedin' | 'x',
                                             tone: tone,
                                        });

                                        // Verify exactly one content document was created
                                        expect(content).toBeDefined();
                                        expect(content.generatedText).toBeTruthy();
                                        expect(content.generatedText.length).toBeGreaterThan(0);

                                        // Verify the content is a single narrative, not fragmented
                                        // A single narrative should not have multiple distinct sections per commit
                                        const generatedText = content.generatedText;

                                        // Check that the content doesn't contain per-commit markers
                                        // (e.g., "Commit 1:", "PR #123:", "Update 1:", etc.)
                                        expect(generatedText).not.toMatch(/commit\s+\d+:/i);
                                        expect(generatedText).not.toMatch(/pr\s+#?\d+:/i);
                                        expect(generatedText).not.toMatch(/update\s+\d+:/i);
                                        expect(generatedText).not.toMatch(/change\s+\d+:/i);

                                        // Verify it's described as a single narrative
                                        expect(generatedText.toLowerCase()).toContain('single');
                                        expect(generatedText.toLowerCase()).toContain('coherent');
                                        expect(generatedText.toLowerCase()).toContain('narrative');

                                        // Verify only ONE content document exists for this analysis and platform
                                        const allContentForAnalysis = await Content.find({
                                             analysisId: analysis._id,
                                             platform: platform,
                                        });

                                        expect(allContentForAnalysis.length).toBe(1);
                                        expect(allContentForAnalysis[0]._id.toString()).toBe(content._id.toString());

                                        // Verify the Gemini API was called exactly once
                                        expect(callGeminiSpy).toHaveBeenCalledTimes(1);
                                   } finally {
                                        // Cleanup
                                        callGeminiSpy.mockRestore();
                                   }
                              }
                         ),
                         { numRuns: 20 }
                    );
               },
               120000
          ); // 120 second timeout

          test(
               'for any repository with multiple commits and PRs, content should synthesize them into one narrative rather than listing them separately',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.array(fc.string({ minLength: 10, maxLength: 100 }), {
                                   minLength: 3,
                                   maxLength: 15,
                              }), // multiple recent changes
                              fc.constantFrom('linkedin', 'x'), // platform
                              async (recentChanges, platform) => {
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

                                   // Create analysis with many recent changes
                                   const analysis = new Analysis({
                                        repositoryId: repository._id,
                                        userId: user._id,
                                        problemStatement: 'Solving a complex problem',
                                        targetAudience: 'Developers',
                                        coreFunctionality: ['Feature A', 'Feature B'],
                                        notableFeatures: ['Notable feature'],
                                        recentChanges: recentChanges,
                                        integrations: ['API 1', 'API 2'],
                                        valueProposition: 'Provides significant value',
                                        rawSignals: {
                                             readmeLength: 500,
                                             commitCount: recentChanges.length,
                                             prCount: Math.floor(recentChanges.length / 2),
                                             fileStructure: ['README.md', 'src/index.ts', 'src/utils.ts'],
                                        },
                                   });
                                   await analysis.save();

                                   // Track how the prompt is constructed
                                   let capturedPrompt = '';
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             capturedPrompt = args[0] as string;

                                             // Return a synthesized narrative
                                             return `A comprehensive narrative that synthesizes all ${recentChanges.length} recent changes into a cohesive story about the repository's evolution and current state.`;
                                        });

                                   try {
                                        // Generate content
                                        const content = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: platform as 'linkedin' | 'x',
                                             tone: 'Professional',
                                        });

                                        // Verify the prompt includes all recent changes as context
                                        expect(capturedPrompt).toContain('Recent Changes:');
                                        recentChanges.forEach((change) => {
                                             expect(capturedPrompt).toContain(change);
                                        });

                                        // Verify the prompt explicitly requests ONE narrative
                                        expect(capturedPrompt).toContain('ONE coherent narrative');
                                        expect(capturedPrompt).not.toContain('for each commit');
                                        expect(capturedPrompt).not.toContain('for each change');
                                        expect(capturedPrompt).not.toContain('list all commits');

                                        // Verify the generated content is a single piece
                                        expect(content.generatedText).toBeTruthy();
                                        expect(content.generatedText).toContain('synthesizes');
                                        expect(content.generatedText).toContain('cohesive');

                                        // Verify version is 1 (first generation, not multiple versions)
                                        expect(content.version).toBe(1);
                                   } finally {
                                        // Cleanup
                                        callGeminiSpy.mockRestore();
                                   }
                              }
                         ),
                         { numRuns: 20 }
                    );
               },
               120000
          ); // 120 second timeout
     });
});
