import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Content } from '../../models/Content';

// Feature: code-to-content, Property 10: Multi-Platform Content Generation
// Validates: Requirements 4.1
describe('ContentGenerationService Multi-Platform Property Tests', () => {
     let contentService: ContentGenerationService;

     beforeAll(() => {
          // Set up Gemini API key for testing
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          contentService = new ContentGenerationService(process.env.GEMINI_API_KEY);
     });

     describe('Property 10: Multi-Platform Content Generation', () => {
          test(
               'for any valid Summary, the system should generate content for both LinkedIn and X platforms when requested',
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
                                        minLength: 0,
                                        maxLength: 10,
                                   }),
                                   integrations: fc.array(fc.string({ minLength: 3, maxLength: 30 }), {
                                        minLength: 0,
                                        maxLength: 15,
                                   }),
                                   valueProposition: fc.string({ minLength: 10, maxLength: 200 }),
                              }),
                              fc.string({ minLength: 5, maxLength: 30 }), // tone
                              async (analysisData, tone) => {
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

                                   // Create analysis
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

                                   // Mock Gemini API to return platform-specific content
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             const prompt = args[0] as string;
                                             // Return different content based on platform in prompt
                                             if (prompt.includes('Platform: LinkedIn')) {
                                                  return 'LinkedIn content: Professional post about the repository.';
                                             } else if (prompt.includes('Platform: X')) {
                                                  return 'X content: Concise tweet about the repository.';
                                             }
                                             return 'Generic content';
                                        });

                                   try {
                                        // Generate content for LinkedIn
                                        const linkedinContent = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: 'linkedin',
                                             tone: tone,
                                        });

                                        // Generate content for X
                                        const xContent = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: 'x',
                                             tone: tone,
                                        });

                                        // Verify both contents were generated
                                        expect(linkedinContent).toBeDefined();
                                        expect(xContent).toBeDefined();

                                        // Verify LinkedIn content properties
                                        expect(linkedinContent.platform).toBe('linkedin');
                                        expect(linkedinContent.tone).toBe(tone);
                                        expect(linkedinContent.generatedText).toBeTruthy();
                                        expect(linkedinContent.generatedText.length).toBeGreaterThan(0);
                                        expect(linkedinContent.analysisId.toString()).toBe(analysis._id.toString());
                                        expect(linkedinContent.userId.toString()).toBe(user._id.toString());
                                        expect(linkedinContent.version).toBe(1);

                                        // Verify X content properties
                                        expect(xContent.platform).toBe('x');
                                        expect(xContent.tone).toBe(tone);
                                        expect(xContent.generatedText).toBeTruthy();
                                        expect(xContent.generatedText.length).toBeGreaterThan(0);
                                        expect(xContent.analysisId.toString()).toBe(analysis._id.toString());
                                        expect(xContent.userId.toString()).toBe(user._id.toString());
                                        expect(xContent.version).toBe(1);

                                        // Verify both contents are persisted in database
                                        const savedLinkedinContent = await Content.findById(linkedinContent._id);
                                        const savedXContent = await Content.findById(xContent._id);

                                        expect(savedLinkedinContent).not.toBeNull();
                                        expect(savedXContent).not.toBeNull();

                                        // Verify they are different content instances
                                        expect(linkedinContent._id.toString()).not.toBe(xContent._id.toString());

                                        // Verify both reference the same analysis
                                        expect(savedLinkedinContent!.analysisId.toString()).toBe(
                                             savedXContent!.analysisId.toString()
                                        );
                                   } finally {
                                        // Cleanup
                                        callGeminiSpy.mockRestore();
                                   }
                              }
                         ),
                         { numRuns: 50 }
                    );
               },
               120000
          ); // 120 second timeout

          test(
               'for any analysis, generating content for both platforms should produce distinct platform-appropriate content',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.string({ minLength: 10, maxLength: 100 }), // problem statement
                              fc.string({ minLength: 5, maxLength: 50 }), // value proposition
                              fc.constantFrom('Professional', 'Casual', 'Confident', 'Funny', 'Educational'), // tone
                              async (problemStatement, valueProposition, tone) => {
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

                                   // Create analysis
                                   const analysis = new Analysis({
                                        repositoryId: repository._id,
                                        userId: user._id,
                                        problemStatement: problemStatement,
                                        targetAudience: 'Developers',
                                        coreFunctionality: ['Feature 1', 'Feature 2'],
                                        notableFeatures: ['Notable 1'],
                                        recentChanges: ['Change 1'],
                                        integrations: ['API 1'],
                                        valueProposition: valueProposition,
                                        rawSignals: {
                                             readmeLength: 100,
                                             commitCount: 10,
                                             prCount: 5,
                                             fileStructure: ['README.md'],
                                        },
                                   });
                                   await analysis.save();

                                   // Mock Gemini API to return platform-specific content
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             const prompt = args[0] as string;
                                             if (prompt.includes('Platform: LinkedIn')) {
                                                  return `LinkedIn ${tone} content about ${problemStatement}`;
                                             } else if (prompt.includes('Platform: X')) {
                                                  return `X ${tone} content about ${problemStatement}`;
                                             }
                                             return 'Generic content';
                                        });

                                   try {
                                        // Generate content for both platforms
                                        const linkedinContent = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: 'linkedin',
                                             tone: tone,
                                        });

                                        const xContent = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: 'x',
                                             tone: tone,
                                        });

                                        // Verify content is platform-specific
                                        expect(linkedinContent.generatedText).toContain('LinkedIn');
                                        expect(xContent.generatedText).toContain('X');

                                        // Verify both use the same tone
                                        expect(linkedinContent.tone).toBe(tone);
                                        expect(xContent.tone).toBe(tone);

                                        // Verify both reference the same analysis
                                        expect(linkedinContent.analysisId.toString()).toBe(xContent.analysisId.toString());

                                        // Verify content is different (platform-specific)
                                        expect(linkedinContent.generatedText).not.toBe(xContent.generatedText);
                                   } finally {
                                        // Cleanup
                                        callGeminiSpy.mockRestore();
                                   }
                              }
                         ),
                         { numRuns: 50 }
                    );
               },
               120000
          ); // 120 second timeout
     });
});
