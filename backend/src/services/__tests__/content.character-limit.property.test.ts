/**
 * Property-Based Test: Character Limit Compliance
 * Feature: multi-format-x-content-engine, Property 1
 * Validates: Requirements 2.1, 3.5, 4.8
 * 
 * For any generated content (single post, mini thread, or full thread),
 * all tweets must be ≤ 280 characters and characterCount must match actual length.
 */

import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content, ContentFormat } from '../../models/Content';

describe('Property 1: Character Limit Compliance', () => {
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

     it('should ensure all generated tweets are ≤ 280 characters for any format', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         format: fc.constantFrom<ContentFormat>('single', 'mini_thread', 'full_thread'),
                         voiceStrength: fc.integer({ min: 0, max: 100 }),
                    }),
                    async (data) => {
                         // Clean up before each iteration
                         await User.deleteMany({});
                         await Repository.deleteMany({});
                         await Analysis.deleteMany({});
                         await Content.deleteMany({});

                         // Create test data
                         const user = await User.create({
                              githubId: `github_${Date.now()}_${Math.random()}`,
                              username: `testuser_${Math.random()}`,
                              accessToken: 'test_token',
                              avatarUrl: 'https://example.com/avatar.png',
                              voiceStrength: data.voiceStrength,
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
                              problemStatement: 'Test problem statement for analysis',
                              targetAudience: 'Developers and engineers',
                              coreFunctionality: ['Feature 1', 'Feature 2'],
                              notableFeatures: ['Notable feature 1'],
                              recentChanges: ['Recent change 1'],
                              integrations: ['Integration 1'],
                              valueProposition: 'Test value proposition',
                              rawSignals: {
                                   readmeLength: 1000,
                                   commitCount: 50,
                                   prCount: 10,
                                   fileStructure: ['README.md', 'src/index.ts'],
                              },
                         });

                         // Mock Gemini API response based on format
                         let mockResponse: string;
                         if (data.format === 'single') {
                              mockResponse = 'Just shipped a new feature that solves the problem of inefficient data processing. Built with TypeScript and optimized for performance. Check it out! 🚀';
                         } else if (data.format === 'mini_thread') {
                              mockResponse = `Ever struggled with slow data processing in your apps? We built something to fix that problem today.
Our new TypeScript library uses smart caching and parallel processing to speed things up by 10x. Simple API, zero configuration needed.
Result: Apps that feel instant. Try it out and share your feedback! What's your biggest performance bottleneck right now?`;
                         } else {
                              mockResponse = `Data processing shouldn't be this slow. But it is. And it's costing you users every single day.
Most apps process data sequentially. That's fine for small datasets. But scale up? Everything grinds to a halt. Users leave frustrated.
We built a TypeScript library that parallelizes data processing automatically. Smart caching. Zero config. Just works out of the box.
Under the hood: Worker threads, memory-efficient streaming, and intelligent batching. All the hard stuff handled for you automatically.
Result: 10x faster processing. Apps that feel instant. Users that stick around. Open source and ready to use in your projects today.`;
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

                              // Verify content was created
                              expect(content).toBeDefined();
                              expect(content.contentFormat).toBe(data.format);

                              // Property 1: Character Limit Compliance
                              if (data.format === 'single') {
                                   // For single posts, check generatedText
                                   expect(content.generatedText).toBeDefined();
                                   expect(content.generatedText.length).toBeLessThanOrEqual(280);
                                   expect(content.tweets).toBeUndefined();
                              } else {
                                   // For threads, check each tweet in the tweets array
                                   expect(content.tweets).toBeDefined();
                                   expect(content.tweets!.length).toBeGreaterThan(0);

                                   content.tweets!.forEach((tweet, index) => {
                                        // Each tweet must be ≤ 280 characters
                                        expect(tweet.text.length).toBeLessThanOrEqual(280);

                                        // characterCount must match actual text length
                                        expect(tweet.characterCount).toBe(tweet.text.length);

                                        // Verify characterCount is within valid range
                                        expect(tweet.characterCount).toBeGreaterThanOrEqual(0);
                                        expect(tweet.characterCount).toBeLessThanOrEqual(280);

                                        // Verify position is correct
                                        expect(tweet.position).toBe(index + 1);
                                   });

                                   // Verify thread length based on format
                                   if (data.format === 'mini_thread') {
                                        expect(content.tweets!.length).toBe(3);
                                   } else if (data.format === 'full_thread') {
                                        expect(content.tweets!.length).toBeGreaterThanOrEqual(5);
                                        expect(content.tweets!.length).toBeLessThanOrEqual(7);
                                   }
                              }

                              // Verify voice metadata
                              expect(content.voiceStrengthUsed).toBe(data.voiceStrength);
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should handle edge case: tweets at exactly 280 characters', async () => {
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
                              voiceStrength: 50,
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

                         // Create tweets that are exactly 276 characters (276 + " 1/3" = 280)
                         const exactLengthTweet = 'A'.repeat(276);
                         const mockResponse = format === 'mini_thread'
                              ? `${exactLengthTweet}\n${exactLengthTweet}\n${exactLengthTweet}`
                              : `${exactLengthTweet}\n${exactLengthTweet}\n${exactLengthTweet}\n${exactLengthTweet}\n${exactLengthTweet}`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   format,
                              });

                              expect(content.tweets).toBeDefined();
                              content.tweets!.forEach((tweet) => {
                                   expect(tweet.text.length).toBeLessThanOrEqual(280);
                                   expect(tweet.characterCount).toBe(tweet.text.length);
                                   expect(tweet.characterCount).toBeLessThanOrEqual(280);
                              });
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 5 }
          );
     }, 90000);

     it('should truncate tweets exceeding 280 characters', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.constantFrom<ContentFormat>('mini_thread', 'full_thread'),
                    fc.integer({ min: 281, max: 400 }),
                    async (format, tweetLength) => {
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
                              voiceStrength: 50,
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

                         const longTweet = 'A'.repeat(tweetLength);
                         const mockResponse = format === 'mini_thread'
                              ? `${longTweet}\n${longTweet}\n${longTweet}`
                              : `${longTweet}\n${longTweet}\n${longTweet}\n${longTweet}\n${longTweet}`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   format,
                              });

                              expect(content.tweets).toBeDefined();
                              content.tweets!.forEach((tweet) => {
                                   // Must be truncated to ≤ 280 characters
                                   expect(tweet.text.length).toBeLessThanOrEqual(280);
                                   expect(tweet.text).toContain('...');
                                   expect(tweet.characterCount).toBe(tweet.text.length);
                              });
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 5 }
          );
     }, 90000);

     it('should maintain character limit compliance across different voice strengths', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         format: fc.constantFrom<ContentFormat>('mini_thread', 'full_thread'),
                         voiceStrength: fc.integer({ min: 0, max: 100 }),
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
                              voiceStrength: data.voiceStrength,
                              styleProfile: data.voiceStrength > 0 ? {
                                   voiceType: 'professional',
                                   tone: {
                                        formality: 5,
                                        enthusiasm: 7,
                                        directness: 6,
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
                                   samplePosts: ['Sample post 1', 'Sample post 2'],
                                   commonPhrases: ['Let\'s dive in'],
                                   bannedPhrases: ['Leverage'],
                                   learningIterations: 5,
                                   lastUpdated: new Date(),
                                   profileSource: 'manual',
                              } : undefined,
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

                         const mockResponse = data.format === 'mini_thread'
                              ? `Let's dive in! Ever struggled with slow data processing? We built something to fix that. 🚀
Our new TypeScript library uses smart caching and parallel processing to speed things up by 10x. Simple API, zero config needed here.
Result: Apps that feel instant. Try it out and share your feedback! What's your biggest performance bottleneck right now?`
                              : `Let's dive in! Data processing shouldn't be this slow. But it is. And it's costing you users every day. 🚀
Most apps process data sequentially. That's fine for small datasets. But scale up? Everything grinds to a halt and users leave.
We built a TypeScript library that parallelizes data processing automatically. Smart caching. Zero config. Just works perfectly.
Under the hood: Worker threads, memory-efficient streaming, and intelligent batching. All the hard stuff handled for you here.
Result: 10x faster processing. Apps that feel instant. Users that stick around. Open source and ready to use in your projects.`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   format: data.format,
                                   voiceStrength: data.voiceStrength,
                              });

                              expect(content.tweets).toBeDefined();
                              content.tweets!.forEach((tweet) => {
                                   expect(tweet.text.length).toBeLessThanOrEqual(280);
                                   expect(tweet.characterCount).toBe(tweet.text.length);
                              });

                              expect(content.voiceStrengthUsed).toBe(data.voiceStrength);
                              expect(content.usedStyleProfile).toBe(data.voiceStrength > 0);
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);
});
