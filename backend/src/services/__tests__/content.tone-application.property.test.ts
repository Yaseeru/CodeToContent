import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';

// Feature: code-to-content, Property 12: Tone Application
// Validates: Requirements 4.5, 5.4
describe('ContentGenerationService Tone Application Property Tests', () => {
     let contentService: ContentGenerationService;

     beforeAll(() => {
          // Set up Gemini API key for testing
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          contentService = new ContentGenerationService(process.env.GEMINI_API_KEY);
     });

     describe('Property 12: Tone Application', () => {
          test(
               'for any two different tone selections applied to the same Summary, the generated content should differ measurably in word choice, structure, and length',
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
                              fc.constantFrom('linkedin', 'x'), // platform
                              fc
                                   .tuple(
                                        fc.constantFrom('Professional', 'Casual', 'Confident', 'Funny', 'Educational'),
                                        fc.constantFrom('Professional', 'Casual', 'Confident', 'Funny', 'Educational')
                                   )
                                   .filter(([tone1, tone2]) => tone1 !== tone2), // Ensure different tones
                              async (analysisData, platform, [tone1, tone2]) => {
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

                                   // Mock Gemini API to return tone-specific content
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             const prompt = args[0] as string;

                                             // Verify tone is included in the prompt
                                             expect(prompt).toContain('Tone:');

                                             // Extract tone from prompt
                                             const toneMatch = prompt.match(/Tone:\s*(\w+)/);
                                             const tone = toneMatch ? toneMatch[1] : 'Unknown';

                                             // Return content that varies based on tone
                                             if (tone === 'Professional') {
                                                  return 'This repository implements a sophisticated solution to address critical challenges in the domain. The architecture demonstrates robust engineering principles and scalable design patterns. Recent enhancements have significantly improved performance metrics and operational efficiency.';
                                             } else if (tone === 'Casual') {
                                                  return "Hey! Check out this cool repo. It's solving some neat problems and the recent updates are pretty awesome. Really easy to use and gets the job done!";
                                             } else if (tone === 'Confident') {
                                                  return 'This is the definitive solution for the problem. Built with cutting-edge technology and proven methodologies. The results speak for themselves - unmatched performance and reliability.';
                                             } else if (tone === 'Funny') {
                                                  return "So I built this thing, and it actually works (shocking, I know). It's like magic, but with more code and fewer rabbits. The bugs are features now. You're welcome.";
                                             } else if (tone === 'Educational') {
                                                  return 'Let me explain how this repository works. First, it addresses the core problem by implementing specific algorithms. The architecture follows these principles: modularity, scalability, and maintainability. Here are the key concepts you should understand.';
                                             }
                                             return 'Generic content';
                                        });

                                   try {
                                        // Generate content with first tone
                                        const content1 = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: platform as 'linkedin' | 'x',
                                             tone: tone1,
                                        });

                                        // Generate content with second tone
                                        const content2 = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: platform as 'linkedin' | 'x',
                                             tone: tone2,
                                        });

                                        // Verify both contents were generated
                                        expect(content1).toBeDefined();
                                        expect(content2).toBeDefined();
                                        expect(content1.generatedText).toBeTruthy();
                                        expect(content2.generatedText).toBeTruthy();

                                        // Verify tones are stored correctly
                                        expect(content1.tone).toBe(tone1);
                                        expect(content2.tone).toBe(tone2);

                                        // Verify content is different (measurably different)
                                        expect(content1.generatedText).not.toBe(content2.generatedText);

                                        // Measure differences in word choice, structure, and length
                                        const text1 = content1.generatedText;
                                        const text2 = content2.generatedText;

                                        // Length difference
                                        const lengthDiff = Math.abs(text1.length - text2.length);
                                        const avgLength = (text1.length + text2.length) / 2;
                                        const lengthDiffPercent = (lengthDiff / avgLength) * 100;

                                        // Word choice difference (unique words)
                                        const words1 = new Set(text1.toLowerCase().split(/\s+/));
                                        const words2 = new Set(text2.toLowerCase().split(/\s+/));
                                        const uniqueWords1 = [...words1].filter((w) => !words2.has(w));
                                        const uniqueWords2 = [...words2].filter((w) => !words1.has(w));
                                        const totalUniqueWords = uniqueWords1.length + uniqueWords2.length;
                                        const totalWords = words1.size + words2.size;
                                        const wordChoiceDiffPercent = (totalUniqueWords / totalWords) * 100;

                                        // Structure difference (sentence count)
                                        const sentences1 = text1.split(/[.!?]+/).filter((s) => s.trim().length > 0);
                                        const sentences2 = text2.split(/[.!?]+/).filter((s) => s.trim().length > 0);
                                        const sentenceCountDiff = Math.abs(sentences1.length - sentences2.length);

                                        // At least one of these metrics should show measurable difference
                                        // (length diff > 10%, word choice diff > 20%, or sentence count diff > 0)
                                        const hasMeasurableDifference =
                                             lengthDiffPercent > 10 || wordChoiceDiffPercent > 20 || sentenceCountDiff > 0;

                                        expect(hasMeasurableDifference).toBe(true);

                                        // Verify both reference the same analysis
                                        expect(content1.analysisId.toString()).toBe(content2.analysisId.toString());
                                   } finally {
                                        // Cleanup
                                        callGeminiSpy.mockRestore();
                                   }
                              }
                         ),
                         { numRuns: 100 }
                    );
               },
               180000
          ); // 180 second timeout

          test(
               'for any tone selection, the tone parameter should be passed to the Gemini API and included in the prompt',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.string({ minLength: 10, maxLength: 100 }), // problem statement
                              fc.constantFrom('Professional', 'Casual', 'Confident', 'Funny', 'Meme', 'Thoughtful', 'Educational'), // tone
                              fc.constantFrom('linkedin', 'x'), // platform
                              async (problemStatement, tone, platform) => {
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
                                        coreFunctionality: ['Feature 1'],
                                        notableFeatures: [],
                                        recentChanges: [],
                                        integrations: [],
                                        valueProposition: 'Provides value',
                                        rawSignals: {
                                             readmeLength: 100,
                                             commitCount: 5,
                                             prCount: 2,
                                             fileStructure: ['README.md'],
                                        },
                                   });
                                   await analysis.save();

                                   // Track the prompt sent to Gemini API
                                   let capturedPrompt = '';
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             capturedPrompt = args[0] as string;
                                             return `Content generated with ${tone} tone`;
                                        });

                                   try {
                                        // Generate content
                                        const content = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: platform as 'linkedin' | 'x',
                                             tone: tone,
                                        });

                                        // Verify the tone was passed to the API
                                        expect(capturedPrompt).toContain(`Tone: ${tone}`);

                                        // Verify tone guidance is included in the prompt
                                        expect(capturedPrompt).toContain('Apply this tone to influence');
                                        expect(capturedPrompt).toContain('Word choice');
                                        expect(capturedPrompt).toContain('Sentence structure');
                                        expect(capturedPrompt).toContain('Overall length and depth');

                                        // Verify the tone is stored in the content document
                                        expect(content.tone).toBe(tone);

                                        // Verify the generated text reflects the tone
                                        expect(content.generatedText).toContain(tone);
                                   } finally {
                                        // Cleanup
                                        callGeminiSpy.mockRestore();
                                   }
                              }
                         ),
                         { numRuns: 100 }
                    );
               },
               180000
          ); // 180 second timeout

          test(
               'for any custom tone text input, the system should pass it to the Gemini API and apply it to content generation',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.string({ minLength: 10, maxLength: 100 }), // problem statement
                              fc.string({ minLength: 5, maxLength: 50 }), // custom tone
                              fc.constantFrom('linkedin', 'x'), // platform
                              async (problemStatement, customTone, platform) => {
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
                                        coreFunctionality: ['Feature 1'],
                                        notableFeatures: [],
                                        recentChanges: [],
                                        integrations: [],
                                        valueProposition: 'Provides value',
                                        rawSignals: {
                                             readmeLength: 100,
                                             commitCount: 5,
                                             prCount: 2,
                                             fileStructure: ['README.md'],
                                        },
                                   });
                                   await analysis.save();

                                   // Track the prompt sent to Gemini API
                                   let capturedPrompt = '';
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             capturedPrompt = args[0] as string;
                                             return `Content generated with custom tone: ${customTone}`;
                                        });

                                   try {
                                        // Generate content with custom tone
                                        const content = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: platform as 'linkedin' | 'x',
                                             tone: customTone,
                                        });

                                        // Verify the custom tone was passed to the API
                                        expect(capturedPrompt).toContain(`Tone: ${customTone}`);

                                        // Verify the custom tone is stored in the content document
                                        expect(content.tone).toBe(customTone);

                                        // Verify the generated text acknowledges the custom tone
                                        expect(content.generatedText).toContain('custom tone');
                                        expect(content.generatedText).toContain(customTone);
                                   } finally {
                                        // Cleanup
                                        callGeminiSpy.mockRestore();
                                   }
                              }
                         ),
                         { numRuns: 100 }
                    );
               },
               180000
          ); // 180 second timeout
     });
});
