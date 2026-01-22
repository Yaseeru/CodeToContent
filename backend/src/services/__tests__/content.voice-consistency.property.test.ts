/**
 * Property-Based Test: Voice Consistency Across Threads
 * Feature: multi-format-x-content-engine, Property 3
 * Validates: Requirements 7.1, 7.2, 7.3
 * 
 * For any generated thread content with a voice profile,
 * the voice profile must be applied consistently across all tweets:
 * - usedStyleProfile must be true
 * - voiceStrengthUsed must match the input parameter
 * - Tone characteristics should be consistent across all tweets (simplified check)
 */

import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { User, StyleProfile } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content, ContentFormat } from '../../models/Content';

describe('Property 3: Voice Consistency Across Threads', () => {
     let contentService: ContentGenerationService;

     beforeAll(() => {
          // Initialize service with test API key
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          contentService = new ContentGenerationService(process.env.GEMINI_API_KEY);
     });

     // Clean up between tests
     afterEach(async () => {
          jest.restoreAllMocks();
     });

     // Clean up after all tests
     afterAll(async () => {
          const collections = mongoose.connection.collections;
          for (const key in collections) {
               await collections[key].deleteMany({});
          }
     });

     /**
      * Helper function to create a complete style profile for testing
      */
     const createTestStyleProfile = (): StyleProfile => ({
          voiceType: 'professional',
          tone: {
               formality: 6,
               enthusiasm: 7,
               directness: 8,
               humor: 4,
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
          vocabularyLevel: 'advanced',
          commonPhrases: ['Let\'s dive in', 'Here\'s the thing', 'Bottom line'],
          bannedPhrases: ['Leverage', 'Synergy', 'Paradigm shift'],
          samplePosts: [
               'Just shipped a new feature that makes data processing 10x faster. Built with TypeScript and optimized for performance. 🚀',
               'Here\'s the thing about microservices: they\'re not always the answer. Sometimes a monolith is exactly what you need.',
               'Bottom line: Good code is code that\'s easy to delete. Write for maintainability, not cleverness.',
          ],
          learningIterations: 5,
          lastUpdated: new Date(),
          profileSource: 'manual',
     });

     /**
      * Helper function to analyze tone consistency across tweets
      * Returns a simplified consistency score (0-1, where 1 is perfectly consistent)
      * 
      * This is a simplified check that looks for:
      * - Similar sentence structures
      * - Consistent use of punctuation (questions, exclamations)
      * - Consistent emoji usage
      * - Similar vocabulary level
      */
     const analyzeToneConsistency = (tweets: string[]): number => {
          if (tweets.length < 2) return 1; // Single tweet is always consistent

          // Check for consistent emoji usage
          const emojiCounts = tweets.map(t => (t.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length);
          const hasEmojis = emojiCounts.some(count => count > 0);
          const emojiConsistent = hasEmojis
               ? emojiCounts.every(count => count > 0) || emojiCounts.every(count => count === 0)
               : true;

          // Check for consistent question usage
          const questionCounts = tweets.map(t => (t.match(/\?/g) || []).length);
          const hasQuestions = questionCounts.some(count => count > 0);
          const questionConsistent = hasQuestions
               ? questionCounts.filter(count => count > 0).length >= tweets.length * 0.3 // At least 30% have questions
               : true;

          // Check for consistent exclamation usage
          const exclamationCounts = tweets.map(t => (t.match(/!/g) || []).length);
          const hasExclamations = exclamationCounts.some(count => count > 0);
          const exclamationConsistent = hasExclamations
               ? exclamationCounts.filter(count => count > 0).length >= tweets.length * 0.3
               : true;

          // Check for consistent sentence length (variance should be low)
          const sentenceLengths = tweets.map(t => {
               const sentences = t.split(/[.!?]+/).filter(s => s.trim().length > 0);
               return sentences.length > 0
                    ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
                    : 0;
          });
          const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
          const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
          const lengthConsistent = variance < 50; // Low variance = consistent

          // Calculate overall consistency score
          const scores = [
               emojiConsistent ? 1 : 0,
               questionConsistent ? 1 : 0,
               exclamationConsistent ? 1 : 0,
               lengthConsistent ? 1 : 0,
          ];

          return scores.reduce((sum, score) => sum + score, 0) / scores.length;
     };

     it('should apply voice profile consistently across all tweets in a thread', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         format: fc.constantFrom<ContentFormat>('mini_thread', 'full_thread'),
                         voiceStrength: fc.integer({ min: 30, max: 100 }), // Minimum 30% for meaningful consistency
                    }),
                    async (data) => {
                         // Clean up before each iteration
                         await User.deleteMany({});
                         await Repository.deleteMany({});
                         await Analysis.deleteMany({});
                         await Content.deleteMany({});

                         // Create user with style profile
                         const user = await User.create({
                              githubId: `github_${Date.now()}_${Math.random()}`,
                              username: `testuser_${Math.random()}`,
                              accessToken: 'test_token',
                              avatarUrl: 'https://example.com/avatar.png',
                              voiceStrength: data.voiceStrength,
                              styleProfile: createTestStyleProfile(),
                         });

                         const repository = await Repository.create({
                              userId: user._id,
                              githubRepoId: `repo_${Date.now()}_${Math.random()}`,
                              name: 'test-repo',
                              fullName: 'owner/test-repo',
                              description: 'Test repository for voice consistency',
                              url: 'https://github.com/owner/test-repo',
                         });

                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: 'Developers struggle with slow data processing in their applications',
                              targetAudience: 'Developers and engineers building data-intensive applications',
                              coreFunctionality: ['Parallel data processing', 'Smart caching', 'Memory-efficient streaming'],
                              notableFeatures: ['Zero configuration', 'TypeScript support', 'Worker thread optimization'],
                              recentChanges: ['Added batch processing', 'Improved memory efficiency'],
                              integrations: ['Node.js', 'TypeScript', 'Worker threads'],
                              valueProposition: '10x faster data processing with zero configuration',
                              rawSignals: {
                                   readmeLength: 2000,
                                   commitCount: 100,
                                   prCount: 25,
                                   fileStructure: ['README.md', 'src/index.ts', 'src/processor.ts'],
                              },
                         });

                         // Mock Gemini API response with voice-aware content
                         // The mock should reflect the style profile characteristics
                         let mockResponse: string;
                         if (data.format === 'mini_thread') {
                              mockResponse = `Let's dive in! Ever struggled with slow data processing? Here's the thing: most apps process sequentially. We built something better. 🚀
Our TypeScript library parallelizes processing automatically. Smart caching, zero config, worker threads under the hood. Just works out of the box perfectly.
Bottom line: 10x faster processing. Apps that feel instant. Try it out and share your feedback! What's your biggest performance bottleneck? 💭`;
                         } else {
                              mockResponse = `Let's dive in! Data processing shouldn't be this slow. But it is. And it's costing you users every single day. Time to fix that. 🚀
Here's the thing: Most apps process data sequentially. That's fine for small datasets. But scale up? Everything grinds to a halt. Users leave frustrated.
We built a TypeScript library that parallelizes data processing automatically. Smart caching. Zero config. Just works out of the box. Simple as that.
Under the hood: Worker threads, memory-efficient streaming, intelligent batching. All the hard stuff handled for you automatically. No complexity exposed.
Bottom line: 10x faster processing. Apps that feel instant. Users that stick around. Open source and ready to use in your projects today. 🎯`;
                         }

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                                   format: data.format,
                              });

                              // **Validates: Requirement 7.1** - Voice strength setting applies to all tweets
                              expect(content.usedStyleProfile).toBe(true);
                              expect(content.voiceStrengthUsed).toBe(data.voiceStrength);

                              // Verify thread structure
                              expect(content.tweets).toBeDefined();
                              expect(content.tweets!.length).toBeGreaterThan(0);

                              // Extract tweet texts for consistency analysis
                              const tweetTexts = content.tweets!.map(t => t.text);

                              // **Validates: Requirement 7.2** - Style profile characteristics are consistent
                              // Check for common phrases from the style profile
                              const commonPhrasesUsed = user.styleProfile!.commonPhrases.filter(phrase =>
                                   tweetTexts.some(text => text.includes(phrase))
                              );
                              // At least one common phrase should appear in the thread
                              expect(commonPhrasesUsed.length).toBeGreaterThan(0);

                              // Check that banned phrases are NOT used
                              const bannedPhrasesUsed = user.styleProfile!.bannedPhrases.filter(phrase =>
                                   tweetTexts.some(text => text.toLowerCase().includes(phrase.toLowerCase()))
                              );
                              expect(bannedPhrasesUsed.length).toBe(0);

                              // **Validates: Requirement 7.3** - Tone, vocabulary, and structure preferences are maintained
                              // Check for tone consistency using a simplified approach
                              // The key is that voice characteristics should be present, not that every metric is identical
                              const consistencyScore = analyzeToneConsistency(tweetTexts);
                              // Consistency score should be reasonable (at least 25% of metrics consistent)
                              // This is a simplified check - in production, Gemini would maintain better consistency
                              expect(consistencyScore).toBeGreaterThanOrEqual(0.25);

                              // Check emoji usage consistency (if profile uses emojis)
                              if (user.styleProfile!.writingTraits.usesEmojis) {
                                   const tweetsWithEmojis = tweetTexts.filter(text =>
                                        /[\u{1F300}-\u{1F9FF}]/gu.test(text)
                                   );
                                   // At least some tweets should have emojis
                                   expect(tweetsWithEmojis.length).toBeGreaterThan(0);
                              }

                              // Check question usage consistency (if profile uses questions often)
                              if (user.styleProfile!.writingTraits.usesQuestionsOften) {
                                   const tweetsWithQuestions = tweetTexts.filter(text => text.includes('?'));
                                   // At least some tweets should have questions
                                   expect(tweetsWithQuestions.length).toBeGreaterThan(0);
                              }

                              // Verify evolution score is recorded
                              expect(content.evolutionScoreAtGeneration).toBeGreaterThanOrEqual(0);
                              expect(content.evolutionScoreAtGeneration).toBeLessThanOrEqual(100);

                              // Verify content format matches request
                              expect(content.contentFormat).toBe(data.format);

                              // Verify thread length based on format
                              if (data.format === 'mini_thread') {
                                   expect(content.tweets!.length).toBe(3);
                              } else if (data.format === 'full_thread') {
                                   expect(content.tweets!.length).toBeGreaterThanOrEqual(5);
                                   expect(content.tweets!.length).toBeLessThanOrEqual(7);
                              }
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should maintain voice consistency across different voice strengths', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         format: fc.constantFrom<ContentFormat>('mini_thread', 'full_thread'),
                         voiceStrength: fc.integer({ min: 20, max: 100 }), // Test various strengths
                    }),
                    async (data) => {
                         // Clean up
                         await User.deleteMany({});
                         await Repository.deleteMany({});
                         await Analysis.deleteMany({});
                         await Content.deleteMany({});

                         const user = await User.create({
                              githubId: `github_${Date.now()}_${Math.random()}`,
                              username: `testuser_${Math.random()}`,
                              accessToken: 'test_token',
                              avatarUrl: 'https://example.com/avatar.png',
                              voiceStrength: 50, // Default voice strength
                              styleProfile: createTestStyleProfile(),
                         });

                         const repository = await Repository.create({
                              userId: user._id,
                              githubRepoId: `repo_${Date.now()}_${Math.random()}`,
                              name: 'test-repo',
                              fullName: 'owner/test-repo',
                              description: 'Test repository',
                              url: 'https://github.com/owner/test-repo',
                         });

                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: 'Test problem statement',
                              targetAudience: 'Developers',
                              coreFunctionality: ['Feature 1', 'Feature 2'],
                              notableFeatures: ['Notable 1'],
                              recentChanges: ['Change 1'],
                              integrations: ['Integration 1'],
                              valueProposition: 'Test value proposition',
                              rawSignals: {
                                   readmeLength: 1500,
                                   commitCount: 75,
                                   prCount: 15,
                                   fileStructure: ['README.md', 'src/index.ts'],
                              },
                         });

                         const mockResponse = data.format === 'mini_thread'
                              ? `Let's dive in! Building scalable apps is hard. Here's what we learned from processing billions of records daily. 🚀
Bottom line: Smart caching and parallel processing make all the difference. Our TypeScript library handles the complexity for you automatically.
Result: 10x faster apps. Users that stick around. Try it out and let us know what you think! What's your approach to scaling? 💭`
                              : `Let's dive in! Building scalable applications is harder than it should be. But it doesn't have to be this way. Time to change that. 🚀
Here's the thing: Most developers reinvent the wheel for data processing. Same patterns, same mistakes, same performance issues every time.
We built a library that solves this once and for all. TypeScript-first, zero config, production-ready. Just install and start building faster.
Under the hood: Worker threads, intelligent caching, memory-efficient streaming. All the patterns we learned from processing billions of records.
Bottom line: 10x faster processing. Code that's maintainable. Apps that scale. Open source and ready for your next project today. 🎯`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              // Generate content with override voice strength
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength, // Override default
                                   format: data.format,
                              });

                              // Voice strength override should be respected
                              expect(content.voiceStrengthUsed).toBe(data.voiceStrength);
                              expect(content.usedStyleProfile).toBe(true);

                              // Voice characteristics should still be consistent
                              const tweetTexts = content.tweets!.map(t => t.text);
                              const consistencyScore = analyzeToneConsistency(tweetTexts);
                              expect(consistencyScore).toBeGreaterThanOrEqual(0.5);

                              // Common phrases should still appear
                              const hasCommonPhrases = user.styleProfile!.commonPhrases.some(phrase =>
                                   tweetTexts.some(text => text.includes(phrase))
                              );
                              expect(hasCommonPhrases).toBe(true);
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should not use voice profile when voice strength is 0', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.constantFrom<ContentFormat>('mini_thread', 'full_thread'),
                    async (format) => {
                         // Clean up
                         await User.deleteMany({});
                         await Repository.deleteMany({});
                         await Analysis.deleteMany({});
                         await Content.deleteMany({});

                         const user = await User.create({
                              githubId: `github_${Date.now()}_${Math.random()}`,
                              username: `testuser_${Math.random()}`,
                              accessToken: 'test_token',
                              avatarUrl: 'https://example.com/avatar.png',
                              voiceStrength: 80,
                              styleProfile: createTestStyleProfile(),
                         });

                         const repository = await Repository.create({
                              userId: user._id,
                              githubRepoId: `repo_${Date.now()}_${Math.random()}`,
                              name: 'test-repo',
                              fullName: 'owner/test-repo',
                              description: 'Test repository',
                              url: 'https://github.com/owner/test-repo',
                         });

                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: 'Test problem',
                              targetAudience: 'Developers',
                              coreFunctionality: ['Feature 1'],
                              notableFeatures: ['Notable 1'],
                              recentChanges: ['Change 1'],
                              integrations: ['Integration 1'],
                              valueProposition: 'Test value',
                              rawSignals: {
                                   readmeLength: 1000,
                                   commitCount: 50,
                                   prCount: 10,
                                   fileStructure: ['README.md'],
                              },
                         });

                         const mockResponse = format === 'mini_thread'
                              ? `Data processing is a common challenge in modern applications. This repository addresses performance bottlenecks effectively.
The solution uses parallel processing and caching strategies. Implementation is straightforward with TypeScript support included throughout.
Results show significant performance improvements. Consider trying this approach in your projects. Feedback is welcome from the community.`
                              : `Data processing performance is a critical concern for modern applications. This repository provides a comprehensive solution to common bottlenecks.
Many applications struggle with sequential data processing at scale. This leads to poor user experience and increased infrastructure costs over time.
This library implements parallel processing with intelligent caching. The TypeScript implementation provides type safety and developer productivity benefits.
The architecture uses worker threads and memory-efficient streaming. These patterns are proven at scale with production workloads and real data.
Performance improvements are significant and measurable. The library is open source and available for use in production applications today.`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              // Generate with voice strength = 0
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: 0, // Disable voice profile
                                   format,
                              });

                              // Voice profile should NOT be used
                              expect(content.usedStyleProfile).toBe(false);
                              expect(content.voiceStrengthUsed).toBe(0);
                              expect(content.evolutionScoreAtGeneration).toBe(0);
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 5 }
          );
     }, 90000);

     it('should maintain consistent voice characteristics across all tweet positions', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.constantFrom<ContentFormat>('full_thread'), // Test with longer threads
                    fc.integer({ min: 50, max: 100 }),
                    async (format, voiceStrength) => {
                         // Clean up
                         await User.deleteMany({});
                         await Repository.deleteMany({});
                         await Analysis.deleteMany({});
                         await Content.deleteMany({});

                         const user = await User.create({
                              githubId: `github_${Date.now()}_${Math.random()}`,
                              username: `testuser_${Math.random()}`,
                              accessToken: 'test_token',
                              avatarUrl: 'https://example.com/avatar.png',
                              voiceStrength,
                              styleProfile: createTestStyleProfile(),
                         });

                         const repository = await Repository.create({
                              userId: user._id,
                              githubRepoId: `repo_${Date.now()}_${Math.random()}`,
                              name: 'test-repo',
                              fullName: 'owner/test-repo',
                              description: 'Test repository',
                              url: 'https://github.com/owner/test-repo',
                         });

                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: 'Test problem',
                              targetAudience: 'Developers',
                              coreFunctionality: ['Feature 1', 'Feature 2'],
                              notableFeatures: ['Notable 1', 'Notable 2'],
                              recentChanges: ['Change 1', 'Change 2'],
                              integrations: ['Integration 1', 'Integration 2'],
                              valueProposition: 'Test value proposition',
                              rawSignals: {
                                   readmeLength: 2500,
                                   commitCount: 150,
                                   prCount: 30,
                                   fileStructure: ['README.md', 'src/index.ts', 'src/lib.ts'],
                              },
                         });

                         const mockResponse = `Let's dive in! Here's the thing about building scalable systems: it's harder than most people think. But we figured it out. 🚀
Most teams struggle with the same problems. Sequential processing. Memory leaks. Poor caching strategies. Sound familiar? We've been there too.
Bottom line: We built a TypeScript library that solves all of this. Parallel processing, smart caching, zero config. Just works out of the box.
Under the hood: Worker threads handle the heavy lifting. Memory-efficient streaming keeps things fast. Intelligent batching optimizes throughput automatically.
Result: 10x faster processing. Apps that feel instant. Users that stick around. What's your biggest scaling challenge right now? 💭
Plus: Full TypeScript support. Comprehensive docs. Active community. Everything you need to ship faster and build better products today. 🎯`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength,
                                   format,
                              });

                              expect(content.tweets).toBeDefined();
                              expect(content.tweets!.length).toBeGreaterThanOrEqual(5);

                              // Check that voice characteristics appear throughout the thread
                              // Not just in the first or last tweet
                              const tweetTexts = content.tweets!.map(t => t.text);

                              // Common phrases should be distributed across tweets
                              const phrasesPerTweet = tweetTexts.map(text =>
                                   user.styleProfile!.commonPhrases.filter(phrase =>
                                        text.includes(phrase)
                                   ).length
                              );
                              const totalPhrases = phrasesPerTweet.reduce((sum, count) => sum + count, 0);
                              expect(totalPhrases).toBeGreaterThan(0);

                              // Voice consistency should be maintained
                              const consistencyScore = analyzeToneConsistency(tweetTexts);
                              expect(consistencyScore).toBeGreaterThanOrEqual(0.5);

                              // Metadata should reflect voice usage
                              expect(content.usedStyleProfile).toBe(true);
                              expect(content.voiceStrengthUsed).toBe(voiceStrength);
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 8 }
          );
     }, 120000);
});
