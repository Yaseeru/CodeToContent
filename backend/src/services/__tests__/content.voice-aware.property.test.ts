import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { Analysis } from '../../models/Analysis';
import { User, StyleProfile } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Content } from '../../models/Content';

// Feature: personalized-voice-engine, Property 8, 9, 11, 39
// Validates: Requirements 3.3, 3.4, 6.4, 17.11
describe('ContentGenerationService Voice-Aware Property Tests', () => {
     let contentService: ContentGenerationService;

     beforeAll(() => {
          // Set up Gemini API key for testing
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          contentService = new ContentGenerationService(process.env.GEMINI_API_KEY);
     });

     describe('Property 8: Few-Shot Sample Count', () => {
          test(
               'for any content generation request with a styleProfile, the constructed Gemini prompt should include between 3 and 6 sample posts from the user\'s styleProfile',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.array(fc.string({ minLength: 50, maxLength: 300 }), {
                                   minLength: 1,
                                   maxLength: 20,
                              }), // samplePosts
                              fc.constantFrom('linkedin', 'x'), // platform
                              async (samplePosts, platform) => {
                                   // Create test user with styleProfile
                                   const user = new User({
                                        githubId: `github_${Math.random()}`,
                                        username: `testuser_${Math.random()}`,
                                        accessToken: 'test_token',
                                        avatarUrl: 'https://example.com/avatar.png',
                                        voiceStrength: 80,
                                        styleProfile: {
                                             voiceType: 'casual',
                                             tone: {
                                                  formality: 5,
                                                  enthusiasm: 7,
                                                  directness: 8,
                                                  humor: 6,
                                                  emotionality: 5,
                                             },
                                             writingTraits: {
                                                  avgSentenceLength: 15,
                                                  usesQuestionsOften: true,
                                                  usesEmojis: true,
                                                  emojiFrequency: 3,
                                                  usesBulletPoints: false,
                                                  usesShortParagraphs: true,
                                                  usesHooks: true,
                                             },
                                             structurePreferences: {
                                                  introStyle: 'hook',
                                                  bodyStyle: 'narrative',
                                                  endingStyle: 'cta',
                                             },
                                             vocabularyLevel: 'medium',
                                             commonPhrases: ['let\'s dive in', 'game changer'],
                                             bannedPhrases: ['leverage', 'synergy'],
                                             samplePosts: samplePosts,
                                             learningIterations: 5,
                                             lastUpdated: new Date(),
                                             profileSource: 'manual',
                                        },
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
                                        problemStatement: 'Solving a problem',
                                        targetAudience: 'Developers',
                                        coreFunctionality: ['Feature A'],
                                        notableFeatures: ['Feature B'],
                                        recentChanges: ['Change 1'],
                                        integrations: ['API 1'],
                                        valueProposition: 'Provides value',
                                        rawSignals: {
                                             readmeLength: 100,
                                             commitCount: 10,
                                             prCount: 5,
                                             fileStructure: ['README.md'],
                                        },
                                   });
                                   await analysis.save();

                                   // Track the prompt
                                   let capturedPrompt = '';
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             capturedPrompt = args[0] as string;
                                             return 'Generated content in user voice';
                                        });

                                   try {
                                        // Generate content
                                        await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: platform as 'linkedin' | 'x',
                                             tone: 'Professional',
                                        });

                                        // Count how many examples are in the prompt
                                        const exampleMatches = capturedPrompt.match(/Example \d+:/g);
                                        const exampleCount = exampleMatches ? exampleMatches.length : 0;

                                        // Verify between 3 and 6 samples
                                        if (samplePosts.length === 0) {
                                             // No samples, should not have examples
                                             expect(exampleCount).toBe(0);
                                        } else if (samplePosts.length <= 6) {
                                             // Should use all samples
                                             expect(exampleCount).toBe(samplePosts.length);
                                        } else {
                                             // Should use exactly 6 samples
                                             expect(exampleCount).toBe(6);
                                        }

                                        // Verify the count is between 3 and 6 (or 0 if no samples)
                                        if (samplePosts.length >= 3) {
                                             expect(exampleCount).toBeGreaterThanOrEqual(3);
                                             expect(exampleCount).toBeLessThanOrEqual(6);
                                        }
                                   } finally {
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

     describe('Property 9: Profile Injection Completeness', () => {
          test(
               'for any content generation with a styleProfile, the Gemini prompt should include all tone metrics, all writing traits, and all structure preferences from the profile',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.record({
                                   formality: fc.integer({ min: 1, max: 10 }),
                                   enthusiasm: fc.integer({ min: 1, max: 10 }),
                                   directness: fc.integer({ min: 1, max: 10 }),
                                   humor: fc.integer({ min: 1, max: 10 }),
                                   emotionality: fc.integer({ min: 1, max: 10 }),
                              }),
                              fc.record({
                                   avgSentenceLength: fc.integer({ min: 5, max: 30 }),
                                   usesQuestionsOften: fc.boolean(),
                                   usesEmojis: fc.boolean(),
                                   emojiFrequency: fc.integer({ min: 0, max: 5 }),
                                   usesBulletPoints: fc.boolean(),
                                   usesShortParagraphs: fc.boolean(),
                                   usesHooks: fc.boolean(),
                              }),
                              fc.record({
                                   introStyle: fc.constantFrom('hook', 'story', 'problem', 'statement'),
                                   bodyStyle: fc.constantFrom('steps', 'narrative', 'analysis', 'bullets'),
                                   endingStyle: fc.constantFrom('cta', 'reflection', 'summary', 'question'),
                              }),
                              async (toneMetrics, writingTraits, structurePreferences) => {
                                   // Create test user with styleProfile
                                   const user = new User({
                                        githubId: `github_${Math.random()}`,
                                        username: `testuser_${Math.random()}`,
                                        accessToken: 'test_token',
                                        avatarUrl: 'https://example.com/avatar.png',
                                        voiceStrength: 80,
                                        styleProfile: {
                                             voiceType: 'casual',
                                             tone: toneMetrics,
                                             writingTraits: writingTraits,
                                             structurePreferences: structurePreferences,
                                             vocabularyLevel: 'medium',
                                             commonPhrases: ['test phrase'],
                                             bannedPhrases: ['avoid this'],
                                             samplePosts: ['Sample post 1', 'Sample post 2', 'Sample post 3'],
                                             learningIterations: 5,
                                             lastUpdated: new Date(),
                                             profileSource: 'manual',
                                        },
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
                                        problemStatement: 'Solving a problem',
                                        targetAudience: 'Developers',
                                        coreFunctionality: ['Feature A'],
                                        notableFeatures: ['Feature B'],
                                        recentChanges: ['Change 1'],
                                        integrations: ['API 1'],
                                        valueProposition: 'Provides value',
                                        rawSignals: {
                                             readmeLength: 100,
                                             commitCount: 10,
                                             prCount: 5,
                                             fileStructure: ['README.md'],
                                        },
                                   });
                                   await analysis.save();

                                   // Track the prompt
                                   let capturedPrompt = '';
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             capturedPrompt = args[0] as string;
                                             return 'Generated content in user voice';
                                        });

                                   try {
                                        // Generate content
                                        await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: 'linkedin',
                                             tone: 'Professional',
                                        });

                                        // Verify all tone metrics are in the prompt
                                        expect(capturedPrompt).toContain('Formality:');
                                        expect(capturedPrompt).toContain('Enthusiasm:');
                                        expect(capturedPrompt).toContain('Directness:');
                                        expect(capturedPrompt).toContain('Humor:');
                                        expect(capturedPrompt).toContain('Emotionality:');
                                        expect(capturedPrompt).toContain(`${toneMetrics.formality}/10`);
                                        expect(capturedPrompt).toContain(`${toneMetrics.enthusiasm}/10`);
                                        expect(capturedPrompt).toContain(`${toneMetrics.directness}/10`);
                                        expect(capturedPrompt).toContain(`${toneMetrics.humor}/10`);
                                        expect(capturedPrompt).toContain(`${toneMetrics.emotionality}/10`);

                                        // Verify writing traits are in the prompt
                                        expect(capturedPrompt).toContain('Average sentence length:');
                                        expect(capturedPrompt).toContain(`${Math.round(writingTraits.avgSentenceLength)} words`);

                                        if (writingTraits.usesEmojis) {
                                             expect(capturedPrompt).toContain('Uses emojis');
                                             expect(capturedPrompt).toContain(`${writingTraits.emojiFrequency}/5`);
                                        }

                                        // Verify structure preferences are in the prompt
                                        expect(capturedPrompt).toContain('Introduction style:');
                                        expect(capturedPrompt).toContain('Body style:');
                                        expect(capturedPrompt).toContain('Ending style:');
                                        expect(capturedPrompt).toContain(structurePreferences.introStyle);
                                        expect(capturedPrompt).toContain(structurePreferences.bodyStyle);
                                        expect(capturedPrompt).toContain(structurePreferences.endingStyle);
                                   } finally {
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

     describe('Property 11: Voice Strength Blending', () => {
          test(
               'for any content generation with voiceStrength between 0 and 100, the generated content should reflect a proportional blend of styleProfile characteristics and generic generation',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.integer({ min: 0, max: 100 }), // voiceStrength
                              async (voiceStrength) => {
                                   // Create test user with styleProfile
                                   const user = new User({
                                        githubId: `github_${Math.random()}`,
                                        username: `testuser_${Math.random()}`,
                                        accessToken: 'test_token',
                                        avatarUrl: 'https://example.com/avatar.png',
                                        voiceStrength: 80, // Default, will be overridden
                                        styleProfile: {
                                             voiceType: 'casual',
                                             tone: {
                                                  formality: 3, // Very casual
                                                  enthusiasm: 9, // Very enthusiastic
                                                  directness: 8,
                                                  humor: 7,
                                                  emotionality: 6,
                                             },
                                             writingTraits: {
                                                  avgSentenceLength: 12,
                                                  usesQuestionsOften: true,
                                                  usesEmojis: true,
                                                  emojiFrequency: 4,
                                                  usesBulletPoints: false,
                                                  usesShortParagraphs: true,
                                                  usesHooks: true,
                                             },
                                             structurePreferences: {
                                                  introStyle: 'hook',
                                                  bodyStyle: 'narrative',
                                                  endingStyle: 'cta',
                                             },
                                             vocabularyLevel: 'simple',
                                             commonPhrases: ['let\'s go', 'awesome'],
                                             bannedPhrases: ['leverage', 'synergy'],
                                             samplePosts: ['Sample 1', 'Sample 2', 'Sample 3'],
                                             learningIterations: 5,
                                             lastUpdated: new Date(),
                                             profileSource: 'manual',
                                        },
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
                                        problemStatement: 'Solving a problem',
                                        targetAudience: 'Developers',
                                        coreFunctionality: ['Feature A'],
                                        notableFeatures: ['Feature B'],
                                        recentChanges: ['Change 1'],
                                        integrations: ['API 1'],
                                        valueProposition: 'Provides value',
                                        rawSignals: {
                                             readmeLength: 100,
                                             commitCount: 10,
                                             prCount: 5,
                                             fileStructure: ['README.md'],
                                        },
                                   });
                                   await analysis.save();

                                   // Track the prompt
                                   let capturedPrompt = '';
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             capturedPrompt = args[0] as string;
                                             return 'Generated content';
                                        });

                                   try {
                                        // Generate content with specific voice strength
                                        const content = await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: 'linkedin',
                                             tone: 'Professional',
                                             voiceStrength: voiceStrength,
                                        });

                                        // Verify voice strength is stored
                                        expect(content.voiceStrengthUsed).toBe(voiceStrength);

                                        if (voiceStrength === 0) {
                                             // At 0%, should use tone-based generation (no profile)
                                             expect(content.usedStyleProfile).toBe(false);
                                        } else {
                                             // At > 0%, should use voice-aware generation
                                             expect(content.usedStyleProfile).toBe(true);

                                             // Verify voice strength is mentioned in prompt
                                             expect(capturedPrompt).toContain(`Voice Strength: ${voiceStrength}%`);

                                             // Verify guidance based on voice strength
                                             if (voiceStrength < 50) {
                                                  expect(capturedPrompt).toContain('blend the user\'s style with more generic');
                                             } else if (voiceStrength >= 50 && voiceStrength < 80) {
                                                  expect(capturedPrompt).toContain('match the user\'s style while allowing some creative flexibility');
                                             } else {
                                                  expect(capturedPrompt).toContain('closely match the user\'s authentic voice');
                                             }
                                        }
                                   } finally {
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

     describe('Property 39: Gemini Prompt Token Limit', () => {
          test(
               'for any content generation request, the constructed Gemini prompt should be under 8000 tokens (approximately 6000 words) to ensure fast response times',
               async () => {
                    await fc.assert(
                         fc.asyncProperty(
                              fc.array(fc.string({ minLength: 100, maxLength: 500 }), {
                                   minLength: 3,
                                   maxLength: 10,
                              }), // samplePosts
                              fc.array(fc.string({ minLength: 5, maxLength: 30 }), {
                                   minLength: 0,
                                   maxLength: 20,
                              }), // commonPhrases
                              fc.array(fc.string({ minLength: 5, maxLength: 30 }), {
                                   minLength: 0,
                                   maxLength: 20,
                              }), // bannedPhrases
                              async (samplePosts, commonPhrases, bannedPhrases) => {
                                   // Create test user with styleProfile
                                   const user = new User({
                                        githubId: `github_${Math.random()}`,
                                        username: `testuser_${Math.random()}`,
                                        accessToken: 'test_token',
                                        avatarUrl: 'https://example.com/avatar.png',
                                        voiceStrength: 80,
                                        styleProfile: {
                                             voiceType: 'casual',
                                             tone: {
                                                  formality: 5,
                                                  enthusiasm: 7,
                                                  directness: 8,
                                                  humor: 6,
                                                  emotionality: 5,
                                             },
                                             writingTraits: {
                                                  avgSentenceLength: 15,
                                                  usesQuestionsOften: true,
                                                  usesEmojis: true,
                                                  emojiFrequency: 3,
                                                  usesBulletPoints: false,
                                                  usesShortParagraphs: true,
                                                  usesHooks: true,
                                             },
                                             structurePreferences: {
                                                  introStyle: 'hook',
                                                  bodyStyle: 'narrative',
                                                  endingStyle: 'cta',
                                             },
                                             vocabularyLevel: 'medium',
                                             commonPhrases: commonPhrases,
                                             bannedPhrases: bannedPhrases,
                                             samplePosts: samplePosts,
                                             learningIterations: 5,
                                             lastUpdated: new Date(),
                                             profileSource: 'manual',
                                        },
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
                                        problemStatement: 'Solving a problem',
                                        targetAudience: 'Developers',
                                        coreFunctionality: ['Feature A'],
                                        notableFeatures: ['Feature B'],
                                        recentChanges: ['Change 1'],
                                        integrations: ['API 1'],
                                        valueProposition: 'Provides value',
                                        rawSignals: {
                                             readmeLength: 100,
                                             commitCount: 10,
                                             prCount: 5,
                                             fileStructure: ['README.md'],
                                        },
                                   });
                                   await analysis.save();

                                   // Track the prompt
                                   let capturedPrompt = '';
                                   const callGeminiSpy = jest
                                        .spyOn(contentService as any, 'callGeminiAPI')
                                        .mockImplementation(async (...args: any[]) => {
                                             capturedPrompt = args[0] as string;
                                             return 'Generated content';
                                        });

                                   try {
                                        // Generate content
                                        await contentService.generateContent({
                                             analysisId: analysis._id.toString(),
                                             userId: user._id.toString(),
                                             platform: 'linkedin',
                                             tone: 'Professional',
                                        });

                                        // Count words in the prompt (rough token estimation)
                                        const wordCount = capturedPrompt.split(/\s+/).length;

                                        // Verify prompt is under 6000 words (approximately 8000 tokens)
                                        expect(wordCount).toBeLessThan(6000);
                                   } finally {
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
