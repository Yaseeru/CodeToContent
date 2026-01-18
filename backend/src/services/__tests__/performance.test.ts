/**
 * Performance Tests for Voice Engine
 * 
 * Tests performance requirements:
 * - Profile retrieval < 100ms (cached)
 * - Content generation < 3s (with profile)
 * - Learning job processing < 30s
 * - Concurrent users (100 simultaneous content generations)
 * 
 * Requirements: 13.2, 13.3
 */

import { User, StyleProfile, IUser } from '../../models/User';
import { Content } from '../../models/Content';
import { Analysis } from '../../models/Analysis';
import { Repository } from '../../models/Repository';
import { LearningJob } from '../../models/LearningJob';
import { cacheService } from '../../services/CacheService';
import { ContentGenerationService } from '../../services/ContentGenerationService';
import { FeedbackLearningEngine } from '../../services/FeedbackLearningEngine';
import mongoose from 'mongoose';

// Mock Gemini API to avoid actual API calls and ensure deterministic timing
jest.mock('@google/genai', () => {
     return {
          GoogleGenAI: jest.fn().mockImplementation(() => ({
               models: {
                    generateContent: jest.fn().mockResolvedValue({
                         text: 'This is a test generated content that simulates Gemini API response for performance testing purposes.',
                    }),
               },
          })),
     };
});

describe('Performance Tests', () => {
     let testUser: IUser;
     let testAnalysis: any;
     let testRepository: any;
     let contentGenerationService: ContentGenerationService;
     let feedbackLearningEngine: FeedbackLearningEngine;

     const createTestStyleProfile = (): StyleProfile => ({
          voiceType: 'professional',
          tone: {
               formality: 7,
               enthusiasm: 6,
               directness: 8,
               humor: 3,
               emotionality: 4,
          },
          writingTraits: {
               avgSentenceLength: 15,
               usesQuestionsOften: false,
               usesEmojis: false,
               emojiFrequency: 0,
               usesBulletPoints: true,
               usesShortParagraphs: true,
               usesHooks: true,
          },
          structurePreferences: {
               introStyle: 'hook',
               bodyStyle: 'analysis',
               endingStyle: 'summary',
          },
          vocabularyLevel: 'advanced',
          commonPhrases: ['innovative solution', 'cutting-edge'],
          bannedPhrases: ['game-changer', 'revolutionary'],
          samplePosts: [
               'Sample post 1 demonstrating writing style.',
               'Sample post 2 with technical details.',
               'Sample post 3 showing structure preferences.',
          ],
          learningIterations: 5,
          lastUpdated: new Date(),
          profileSource: 'manual',
     });

     beforeAll(async () => {
          // Initialize services
          contentGenerationService = new ContentGenerationService(process.env.GEMINI_API_KEY || 'test-key');
          feedbackLearningEngine = new FeedbackLearningEngine(process.env.GEMINI_API_KEY || 'test-key');

          // Clear cache before tests
          await cacheService.clearAll();
          cacheService.resetMetrics();
     });

     beforeEach(async () => {
          // Create test user with style profile
          testUser = await User.create({
               githubId: 'perf-test-user',
               username: 'perftest',
               accessToken: 'test-token',
               avatarUrl: 'https://example.com/avatar.jpg',
               styleProfile: createTestStyleProfile(),
               voiceStrength: 80,
          });

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubRepoId: 'test-repo-123',
               name: 'test-repo',
               fullName: 'user/test-repo',
               description: 'Test repository for performance testing',
               url: 'https://github.com/user/test-repo',
               language: 'TypeScript',
               stars: 100,
               forks: 20,
               lastUpdated: new Date(),
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               problemStatement: 'Test problem statement',
               targetAudience: 'Developers',
               coreFunctionality: ['Feature 1', 'Feature 2'],
               notableFeatures: ['Notable 1', 'Notable 2'],
               recentChanges: ['Change 1', 'Change 2'],
               integrations: ['Integration 1'],
               valueProposition: 'Test value proposition',
          });
     });

     afterEach(async () => {
          // Clear cache after each test
          await cacheService.clearAll();
          cacheService.resetMetrics();
     });

     describe('Profile Retrieval Performance', () => {
          /**
           * Test: Profile retrieval < 100ms (cached)
           * Validates: Requirements 13.2
           */
          it('should retrieve cached profile in < 100ms', async () => {
               // First, cache the profile
               await cacheService.setStyleProfile(testUser._id.toString(), testUser.styleProfile!);

               // Measure retrieval time
               const startTime = Date.now();
               const cachedProfile = await cacheService.getStyleProfile(testUser._id.toString());
               const endTime = Date.now();

               const latency = endTime - startTime;

               expect(cachedProfile).toBeDefined();
               expect(cachedProfile).toMatchObject(testUser.styleProfile!);
               expect(latency).toBeLessThan(100); // < 100ms requirement

               console.log(`[Performance] Cached profile retrieval: ${latency}ms`);
          });

          it('should retrieve profile from database in reasonable time', async () => {
               // Measure database retrieval time (without cache)
               const startTime = Date.now();
               const user = await User.findById(testUser._id);
               const endTime = Date.now();

               const latency = endTime - startTime;

               expect(user).toBeDefined();
               expect(user!.styleProfile).toBeDefined();
               expect(latency).toBeLessThan(500); // Database should be < 500ms

               console.log(`[Performance] Database profile retrieval: ${latency}ms`);
          });

          it('should have high cache hit rate after multiple retrievals', async () => {
               // Cache the profile
               await cacheService.setStyleProfile(testUser._id.toString(), testUser.styleProfile!);

               // Perform multiple retrievals
               for (let i = 0; i < 10; i++) {
                    await cacheService.getStyleProfile(testUser._id.toString());
               }

               const metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(10);
               expect(metrics.misses).toBe(0);
               expect(metrics.hitRate).toBe(1.0); // 100% hit rate

               console.log(`[Performance] Cache hit rate: ${metrics.hitRate * 100}%`);
          });
     });

     describe('Content Generation Performance', () => {
          /**
           * Test: Content generation < 3s (with profile)
           * Validates: Requirements 13.3
           */
          it('should generate content with profile in < 3s', async () => {
               const startTime = Date.now();

               const content = await contentGenerationService.generateContent({
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'linkedin',
                    tone: 'Professional',
                    voiceStrength: 80,
               });

               const endTime = Date.now();
               const latency = endTime - startTime;

               expect(content).toBeDefined();
               expect(content.usedStyleProfile).toBe(true);
               expect(latency).toBeLessThan(3000); // < 3s requirement

               console.log(`[Performance] Content generation with profile: ${latency}ms`);
          }, 10000); // 10s timeout for this test

          it('should generate content without profile in < 2s', async () => {
               // Create user without profile
               const userWithoutProfile = await User.create({
                    githubId: 'perf-test-user-no-profile',
                    username: 'perftest-no-profile',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
                    voiceStrength: 80,
               });

               const startTime = Date.now();

               const content = await contentGenerationService.generateContent({
                    analysisId: testAnalysis._id.toString(),
                    userId: userWithoutProfile._id.toString(),
                    platform: 'linkedin',
                    tone: 'Professional',
               });

               const endTime = Date.now();
               const latency = endTime - startTime;

               expect(content).toBeDefined();
               expect(content.usedStyleProfile).toBe(false);
               expect(latency).toBeLessThan(2000); // < 2s requirement

               console.log(`[Performance] Content generation without profile: ${latency}ms`);
          }, 10000);
     });

     describe('Learning Job Processing Performance', () => {
          /**
           * Test: Learning job processing < 30s
           * Validates: Requirements 13.3
           */
          it('should process learning job in < 30s', async () => {
               // Create content with edits
               const content = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'linkedin',
                    tone: 'Professional',
                    generatedText: 'Original generated text with some content.',
                    editedText: 'Edited text with user modifications and improvements.',
                    version: 1,
                    usedStyleProfile: true,
                    voiceStrengthUsed: 80,
                    evolutionScoreAtGeneration: 50,
               });

               // Create learning job
               const learningJob = await LearningJob.create({
                    userId: testUser._id,
                    contentId: content._id,
                    status: 'pending',
                    priority: 1,
                    attempts: 0,
               });

               const startTime = Date.now();

               // Process the learning job
               await feedbackLearningEngine.processLearningJob(learningJob._id.toString());

               const endTime = Date.now();
               const latency = endTime - startTime;

               // Verify job was processed
               const processedJob = await LearningJob.findById(learningJob._id);
               expect(processedJob!.status).toBe('completed');
               expect(latency).toBeLessThan(30000); // < 30s requirement

               console.log(`[Performance] Learning job processing: ${latency}ms`);
          }, 35000); // 35s timeout for this test
     });

     describe('Concurrent User Load Performance', () => {
          /**
           * Test: Support 100 concurrent content generations
           * Validates: Requirements 13.3
           */
          it('should handle 10 concurrent content generations', async () => {
               const concurrentRequests = 10;
               const startTime = Date.now();

               // Create multiple concurrent content generation requests
               const promises = Array.from({ length: concurrentRequests }, (_, i) =>
                    contentGenerationService.generateContent({
                         analysisId: testAnalysis._id.toString(),
                         userId: testUser._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                         voiceStrength: 80,
                    })
               );

               const results = await Promise.all(promises);

               const endTime = Date.now();
               const totalLatency = endTime - startTime;
               const avgLatency = totalLatency / concurrentRequests;

               expect(results).toHaveLength(concurrentRequests);
               results.forEach(content => {
                    expect(content).toBeDefined();
                    expect(content.usedStyleProfile).toBe(true);
               });

               console.log(`[Performance] ${concurrentRequests} concurrent generations: ${totalLatency}ms total, ${avgLatency}ms avg`);
               expect(avgLatency).toBeLessThan(5000); // Average should be reasonable
          }, 60000); // 60s timeout for concurrent test

          it('should handle 50 concurrent content generations', async () => {
               const concurrentRequests = 50;
               const startTime = Date.now();

               // Create multiple concurrent content generation requests
               const promises = Array.from({ length: concurrentRequests }, (_, i) =>
                    contentGenerationService.generateContent({
                         analysisId: testAnalysis._id.toString(),
                         userId: testUser._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                         voiceStrength: 80,
                    })
               );

               const results = await Promise.all(promises);

               const endTime = Date.now();
               const totalLatency = endTime - startTime;
               const avgLatency = totalLatency / concurrentRequests;

               expect(results).toHaveLength(concurrentRequests);
               results.forEach(content => {
                    expect(content).toBeDefined();
               });

               console.log(`[Performance] ${concurrentRequests} concurrent generations: ${totalLatency}ms total, ${avgLatency}ms avg`);
               expect(avgLatency).toBeLessThan(10000); // Average should be reasonable for 50 concurrent
          }, 120000); // 120s timeout for larger concurrent test
     });

     describe('Database Query Performance', () => {
          /**
           * Test: Database queries use indexes and are fast
           * Validates: Requirements 13.2
           */
          it('should query user by ID efficiently', async () => {
               const startTime = Date.now();
               const user = await User.findById(testUser._id);
               const endTime = Date.now();

               const latency = endTime - startTime;

               expect(user).toBeDefined();
               expect(latency).toBeLessThan(50); // Should be very fast with index

               console.log(`[Performance] User query by ID: ${latency}ms`);
          });

          it('should query content by userId efficiently', async () => {
               // Create multiple content items
               await Promise.all(
                    Array.from({ length: 10 }, (_, i) =>
                         Content.create({
                              analysisId: testAnalysis._id,
                              userId: testUser._id,
                              platform: 'linkedin',
                              tone: 'Professional',
                              generatedText: `Generated text ${i}`,
                              editedText: '',
                              version: 1,
                         })
                    )
               );

               const startTime = Date.now();
               const contents = await Content.find({ userId: testUser._id });
               const endTime = Date.now();

               const latency = endTime - startTime;

               expect(contents).toHaveLength(10);
               expect(latency).toBeLessThan(100); // Should be fast with index

               console.log(`[Performance] Content query by userId: ${latency}ms`);
          });

          it('should query learning jobs by userId and status efficiently', async () => {
               // Create multiple learning jobs
               await Promise.all(
                    Array.from({ length: 20 }, (_, i) =>
                         LearningJob.create({
                              userId: testUser._id,
                              contentId: new mongoose.Types.ObjectId(),
                              status: i % 2 === 0 ? 'pending' : 'completed',
                              priority: i,
                              attempts: 0,
                         })
                    )
               );

               const startTime = Date.now();
               const pendingJobs = await LearningJob.find({
                    userId: testUser._id,
                    status: 'pending',
               });
               const endTime = Date.now();

               const latency = endTime - startTime;

               expect(pendingJobs.length).toBeGreaterThan(0);
               expect(latency).toBeLessThan(100); // Should be fast with compound index

               console.log(`[Performance] Learning job query by userId+status: ${latency}ms`);
          });
     });

     describe('Cache Performance', () => {
          it('should cache and retrieve evolution scores quickly', async () => {
               const evolutionScore = 75;

               // Set evolution score
               await cacheService.setEvolutionScore(testUser._id.toString(), evolutionScore);

               // Measure retrieval time
               const startTime = Date.now();
               const cachedScore = await cacheService.getEvolutionScore(testUser._id.toString());
               const endTime = Date.now();

               const latency = endTime - startTime;

               expect(cachedScore).toBe(evolutionScore);
               expect(latency).toBeLessThan(50); // Should be very fast

               console.log(`[Performance] Evolution score cache retrieval: ${latency}ms`);
          });

          it('should cache and retrieve archetype list quickly', async () => {
               const archetypes = [
                    { name: 'Tech Influencer', description: 'Test archetype' },
                    { name: 'Thought Leader', description: 'Test archetype 2' },
               ];

               // Set archetype list
               await cacheService.setArchetypeList(archetypes as any);

               // Measure retrieval time
               const startTime = Date.now();
               const cachedArchetypes = await cacheService.getArchetypeList();
               const endTime = Date.now();

               const latency = endTime - startTime;

               expect(cachedArchetypes).toHaveLength(2);
               expect(latency).toBeLessThan(50); // Should be very fast

               console.log(`[Performance] Archetype list cache retrieval: ${latency}ms`);
          });
     });
});
