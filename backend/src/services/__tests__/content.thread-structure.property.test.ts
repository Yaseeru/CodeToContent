/**
 * Property-Based Test: Thread Structure Integrity
 * Feature: multi-format-x-content-engine, Property 2
 * Validates: Requirements 3.1, 4.1
 * 
 * For any generated thread content:
 * - Mini threads must have exactly 3 tweets
 * - Full threads must have 5-7 tweets
 * - All tweets must have sequential positions (1, 2, 3, ...)
 */

import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content, ContentFormat } from '../../models/Content';

describe('Property 2: Thread Structure Integrity', () => {
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

     it('should generate mini threads with exactly 3 tweets and sequential positions', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
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

                         // Mock Gemini API response for mini thread (3 tweets)
                         const mockResponse = `Ever struggled with slow data processing in your apps? We built something to fix that problem today.
Our new TypeScript library uses smart caching and parallel processing to speed things up by 10x. Simple API, zero configuration needed.
Result: Apps that feel instant. Try it out and share your feedback! What's your biggest performance bottleneck right now?`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                                   format: 'mini_thread',
                              });

                              // Verify content was created
                              expect(content).toBeDefined();
                              expect(content.contentFormat).toBe('mini_thread');

                              // Property 2.1: Mini threads must have exactly 3 tweets
                              expect(content.tweets).toBeDefined();
                              expect(content.tweets!.length).toBe(3);

                              // Property 2.2: Tweets must have sequential positions (1, 2, 3)
                              content.tweets!.forEach((tweet, index) => {
                                   expect(tweet.position).toBe(index + 1);
                              });

                              // Verify positions are 1, 2, 3
                              expect(content.tweets![0].position).toBe(1);
                              expect(content.tweets![1].position).toBe(2);
                              expect(content.tweets![2].position).toBe(3);

                              // Verify each tweet has required fields
                              content.tweets!.forEach((tweet) => {
                                   expect(tweet.text).toBeDefined();
                                   expect(typeof tweet.text).toBe('string');
                                   expect(tweet.text.length).toBeGreaterThan(0);
                                   expect(tweet.characterCount).toBeDefined();
                                   expect(tweet.characterCount).toBe(tweet.text.length);
                              });
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should generate full threads with 5-7 tweets and sequential positions', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
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
                              coreFunctionality: ['Feature 1', 'Feature 2', 'Feature 3'],
                              notableFeatures: ['Notable feature 1', 'Notable feature 2'],
                              recentChanges: ['Recent change 1', 'Recent change 2'],
                              integrations: ['Integration 1', 'Integration 2'],
                              valueProposition: 'Test value proposition',
                              rawSignals: {
                                   readmeLength: 2000,
                                   commitCount: 100,
                                   prCount: 25,
                                   fileStructure: ['README.md', 'src/index.ts', 'src/utils.ts'],
                              },
                         });

                         // Mock Gemini API response for full thread (5 tweets)
                         const mockResponse = `Data processing shouldn't be this slow. But it is. And it's costing you users every single day.
Most apps process data sequentially. That's fine for small datasets. But scale up? Everything grinds to a halt. Users leave frustrated.
We built a TypeScript library that parallelizes data processing automatically. Smart caching. Zero config. Just works out of the box.
Under the hood: Worker threads, memory-efficient streaming, and intelligent batching. All the hard stuff handled for you automatically.
Result: 10x faster processing. Apps that feel instant. Users that stick around. Open source and ready to use in your projects today.`;

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                                   format: 'full_thread',
                              });

                              // Verify content was created
                              expect(content).toBeDefined();
                              expect(content.contentFormat).toBe('full_thread');

                              // Property 2.1: Full threads must have 5-7 tweets
                              expect(content.tweets).toBeDefined();
                              expect(content.tweets!.length).toBeGreaterThanOrEqual(5);
                              expect(content.tweets!.length).toBeLessThanOrEqual(7);

                              // Property 2.2: Tweets must have sequential positions
                              content.tweets!.forEach((tweet, index) => {
                                   expect(tweet.position).toBe(index + 1);
                              });

                              // Verify positions start at 1 and increment by 1
                              for (let i = 0; i < content.tweets!.length; i++) {
                                   expect(content.tweets![i].position).toBe(i + 1);
                              }

                              // Verify each tweet has required fields
                              content.tweets!.forEach((tweet) => {
                                   expect(tweet.text).toBeDefined();
                                   expect(typeof tweet.text).toBe('string');
                                   expect(tweet.text.length).toBeGreaterThan(0);
                                   expect(tweet.characterCount).toBeDefined();
                                   expect(tweet.characterCount).toBe(tweet.text.length);
                              });
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should maintain sequential positions regardless of tweet count variation', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.integer({ min: 5, max: 7 }), // Generate 5, 6, or 7 tweets
                    async (tweetCount) => {
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
                              problemStatement: 'Test problem statement',
                              targetAudience: 'Developers',
                              coreFunctionality: ['Feature 1', 'Feature 2'],
                              notableFeatures: ['Notable 1'],
                              recentChanges: ['Change 1'],
                              integrations: ['Integration 1'],
                              valueProposition: 'Test value',
                              rawSignals: {
                                   readmeLength: 1500,
                                   commitCount: 75,
                                   prCount: 15,
                                   fileStructure: ['README.md', 'src/index.ts'],
                              },
                         });

                         // Generate mock response with specified number of tweets
                         const baseTweet = 'This is a test tweet that demonstrates the thread structure integrity property for our content generation system.';
                         const mockTweets = Array(tweetCount).fill(baseTweet);
                         const mockResponse = mockTweets.join('\n');

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   format: 'full_thread',
                              });

                              // Verify content was created
                              expect(content).toBeDefined();
                              expect(content.tweets).toBeDefined();

                              // Property: Positions must be sequential starting from 1
                              const positions = content.tweets!.map(t => t.position);
                              const expectedPositions = Array.from({ length: content.tweets!.length }, (_, i) => i + 1);
                              expect(positions).toEqual(expectedPositions);

                              // Verify no gaps in positions
                              for (let i = 1; i < content.tweets!.length; i++) {
                                   const currentPosition = content.tweets![i].position;
                                   const previousPosition = content.tweets![i - 1].position;
                                   expect(currentPosition).toBe(previousPosition + 1);
                              }

                              // Verify first position is 1
                              expect(content.tweets![0].position).toBe(1);

                              // Verify last position equals tweet count
                              expect(content.tweets![content.tweets!.length - 1].position).toBe(content.tweets!.length);
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should ensure thread structure integrity across different formats', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.constantFrom<ContentFormat>('mini_thread', 'full_thread'),
                    async (format) => {
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

                         // Generate appropriate mock response based on format
                         const mockResponse = format === 'mini_thread'
                              ? `First tweet in the mini thread about our amazing project and what it does for developers.
Second tweet explaining the problem we solve and the technical approach we took to build this solution.
Third tweet with results and a call to action for users to try it out and share their feedback with us.`
                              : `First tweet with a bold hook that grabs attention and sets up the story we're about to tell.
Second tweet explaining why this problem matters and the context behind why we built this solution.
Third tweet describing what we built and the high-level approach we took to solve the problem.
Fourth tweet diving into technical details, architecture decisions, and code patterns we used.
Fifth tweet with a strong call to action asking users to try it, contribute, or share feedback.`;

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

                              // Verify content format matches request
                              expect(content.contentFormat).toBe(format);

                              // Verify tweets array exists
                              expect(content.tweets).toBeDefined();
                              expect(Array.isArray(content.tweets)).toBe(true);

                              // Verify tweet count based on format
                              if (format === 'mini_thread') {
                                   expect(content.tweets!.length).toBe(3);
                              } else {
                                   expect(content.tweets!.length).toBeGreaterThanOrEqual(5);
                                   expect(content.tweets!.length).toBeLessThanOrEqual(7);
                              }

                              // Verify sequential positions
                              content.tweets!.forEach((tweet, index) => {
                                   expect(tweet.position).toBe(index + 1);
                              });

                              // Verify no duplicate positions
                              const positions = content.tweets!.map(t => t.position);
                              const uniquePositions = new Set(positions);
                              expect(uniquePositions.size).toBe(positions.length);

                              // Verify positions are contiguous (no gaps)
                              const sortedPositions = [...positions].sort((a, b) => a - b);
                              for (let i = 0; i < sortedPositions.length; i++) {
                                   expect(sortedPositions[i]).toBe(i + 1);
                              }
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should handle edge case: minimum viable tweet length filtering', async () => {
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

                         // Create response with some short lines that should be filtered out
                         const validTweet = 'This is a valid tweet with enough characters to meet the minimum length requirement for our system.';
                         const expectedCount = format === 'mini_thread' ? 3 : 5;
                         const mockTweets = Array(expectedCount).fill(validTweet);

                         // Add some short lines that should be filtered
                         mockTweets.splice(1, 0, 'Short'); // Too short, should be filtered
                         mockTweets.splice(3, 0, 'Also short'); // Too short, should be filtered

                         const mockResponse = mockTweets.join('\n');

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

                              // Verify only valid tweets are included
                              expect(content.tweets).toBeDefined();

                              // All tweets should meet minimum length (50 chars)
                              content.tweets!.forEach((tweet) => {
                                   expect(tweet.text.length).toBeGreaterThanOrEqual(50);
                              });

                              // Positions should still be sequential despite filtering
                              content.tweets!.forEach((tweet, index) => {
                                   expect(tweet.position).toBe(index + 1);
                              });

                              // Verify correct count after filtering
                              if (format === 'mini_thread') {
                                   expect(content.tweets!.length).toBe(3);
                              } else {
                                   expect(content.tweets!.length).toBeGreaterThanOrEqual(5);
                                   expect(content.tweets!.length).toBeLessThanOrEqual(7);
                              }
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 5 }
          );
     }, 90000);
});
