/**
 * Property-Based Test: Backward Compatibility
 * Feature: multi-format-x-content-engine, Property 4
 * Validates: Requirements 2.5
 * 
 * Existing single post generation must work unchanged.
 * Content generated without format parameter or with format='single' 
 * should produce identical single posts with no tweets array.
 */

import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content } from '../../models/Content';

describe('Property 4: Backward Compatibility', () => {
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

     it('should produce single posts when format parameter is omitted', async () => {
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
                              description: 'Test repository for backward compatibility',
                              url: 'https://github.com/owner/test-repo',
                         });

                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: 'Test problem statement for backward compatibility',
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

                         // Mock Gemini API response for single post
                         const mockResponse = 'Just shipped a new feature that solves the problem of inefficient data processing. Built with TypeScript and optimized for performance. Check it out! 🚀';

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              // Generate content WITHOUT format parameter (should default to 'single')
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                                   // format parameter is intentionally omitted
                              });

                              // Property 4: Backward Compatibility
                              // Content should be a single post
                              expect(content).toBeDefined();
                              expect(content.contentFormat).toBe('single');

                              // generatedText should contain the content
                              expect(content.generatedText).toBeDefined();
                              expect(content.generatedText.length).toBeGreaterThan(0);
                              expect(content.generatedText.length).toBeLessThanOrEqual(280);

                              // tweets array should NOT be present for single posts
                              expect(content.tweets).toBeUndefined();

                              // Verify voice metadata is preserved
                              expect(content.voiceStrengthUsed).toBe(data.voiceStrength);
                              expect(content.platform).toBe('x');
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should produce identical single posts with and without explicit format="single"', async () => {
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
                              description: 'Test repository for backward compatibility',
                              url: 'https://github.com/owner/test-repo',
                         });

                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: 'Test problem statement for backward compatibility',
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

                         // Mock Gemini API response for single post
                         const mockResponse = 'Just shipped a new feature that solves the problem of inefficient data processing. Built with TypeScript and optimized for performance. Check it out! 🚀';

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              // Generate content WITHOUT format parameter
                              const contentWithoutFormat = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                              });

                              // Clean up content for second generation
                              await Content.deleteMany({});

                              // Generate content WITH explicit format='single'
                              const contentWithFormat = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                                   format: 'single',
                              });

                              // Property 4: Both should produce single posts
                              expect(contentWithoutFormat.contentFormat).toBe('single');
                              expect(contentWithFormat.contentFormat).toBe('single');

                              // Both should have generatedText
                              expect(contentWithoutFormat.generatedText).toBeDefined();
                              expect(contentWithFormat.generatedText).toBeDefined();
                              expect(contentWithoutFormat.generatedText.length).toBeGreaterThan(0);
                              expect(contentWithFormat.generatedText.length).toBeGreaterThan(0);

                              // Neither should have tweets array
                              expect(contentWithoutFormat.tweets).toBeUndefined();
                              expect(contentWithFormat.tweets).toBeUndefined();

                              // Both should respect character limits
                              expect(contentWithoutFormat.generatedText.length).toBeLessThanOrEqual(280);
                              expect(contentWithFormat.generatedText.length).toBeLessThanOrEqual(280);

                              // Both should have same voice metadata
                              expect(contentWithoutFormat.voiceStrengthUsed).toBe(data.voiceStrength);
                              expect(contentWithFormat.voiceStrengthUsed).toBe(data.voiceStrength);
                              expect(contentWithoutFormat.platform).toBe('x');
                              expect(contentWithFormat.platform).toBe('x');
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should never produce tweets array for single posts regardless of voice profile', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         voiceStrength: fc.integer({ min: 0, max: 100 }),
                         hasStyleProfile: fc.boolean(),
                    }),
                    async (data) => {
                         // Clean up before each iteration
                         await User.deleteMany({});
                         await Repository.deleteMany({});
                         await Analysis.deleteMany({});
                         await Content.deleteMany({});

                         // Create test data with optional style profile
                         const user = await User.create({
                              githubId: `github_${Date.now()}_${Math.random()}`,
                              username: `testuser_${Math.random()}`,
                              accessToken: 'test_token',
                              avatarUrl: 'https://example.com/avatar.png',
                              voiceStrength: data.voiceStrength,
                              styleProfile: data.hasStyleProfile ? {
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
                              description: 'Test repository for backward compatibility',
                              url: 'https://github.com/owner/test-repo',
                         });

                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: 'Test problem statement',
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

                         // Mock Gemini API response
                         const mockResponse = data.hasStyleProfile
                              ? 'Let\'s dive in! Just shipped a new feature that solves the problem of inefficient data processing. Built with TypeScript and optimized for performance. Check it out! 🚀'
                              : 'Just shipped a new feature that solves the problem of inefficient data processing. Built with TypeScript and optimized for performance. Check it out! 🚀';

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              // Generate content without format (defaults to single)
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                              });

                              // Property 4: Single posts should never have tweets array
                              expect(content.contentFormat).toBe('single');
                              expect(content.tweets).toBeUndefined();
                              expect(content.generatedText).toBeDefined();
                              expect(content.generatedText.length).toBeGreaterThan(0);
                              expect(content.generatedText.length).toBeLessThanOrEqual(280);

                              // Voice profile usage should match expectations
                              if (data.hasStyleProfile && data.voiceStrength > 0) {
                                   expect(content.usedStyleProfile).toBe(true);
                              }
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);

     it('should maintain backward compatibility with existing API contracts', async () => {
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

                         const mockResponse = 'Just shipped a new feature! Built with TypeScript. Check it out! 🚀';

                         const callGeminiSpy = jest
                              .spyOn(contentService as any, 'callGeminiAPI')
                              .mockResolvedValue(mockResponse);

                         try {
                              // Generate content using the original API (no format parameter)
                              const content = await contentService.generateContent({
                                   analysisId: analysis._id.toString(),
                                   userId: user._id.toString(),
                                   platform: 'x',
                                   voiceStrength: data.voiceStrength,
                              });

                              // Property 4: All existing fields should be present and valid
                              expect(content._id).toBeDefined();
                              expect(content.analysisId).toBeDefined();
                              expect(content.userId).toBeDefined();
                              expect(content.platform).toBe('x');
                              expect(content.contentFormat).toBe('single');
                              expect(content.generatedText).toBeDefined();
                              expect(content.editedText).toBeDefined();
                              expect(content.version).toBe(1);
                              expect(content.voiceStrengthUsed).toBe(data.voiceStrength);
                              expect(content.createdAt).toBeDefined();
                              expect(content.updatedAt).toBeDefined();

                              // New field (tweets) should be undefined for single posts
                              expect(content.tweets).toBeUndefined();

                              // Verify the content can be saved and retrieved
                              const savedContent = await Content.findById(content._id);
                              expect(savedContent).toBeDefined();
                              expect(savedContent!.contentFormat).toBe('single');
                              expect(savedContent!.tweets).toBeUndefined();
                         } finally {
                              callGeminiSpy.mockRestore();
                         }
                    }
               ),
               { numRuns: 10 }
          );
     }, 120000);
});
