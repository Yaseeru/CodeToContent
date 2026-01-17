/**
 * Property-Based Tests for Cache Invalidation
 * Feature: personalized-voice-engine, Property 32: Cache Invalidation on Update
 * Validates: Requirements 13.9
 */

import * as fc from 'fast-check';
import { CacheService } from '../CacheService';
import { StyleProfile } from '../../models/User';

// Mock Redis for testing
jest.mock('ioredis', () => {
     const mockData = new Map<string, { value: string; expiry?: number }>();

     return jest.fn().mockImplementation(() => ({
          get: jest.fn((key: string) => {
               const item = mockData.get(key);
               if (!item) return Promise.resolve(null);
               if (item.expiry && Date.now() > item.expiry) {
                    mockData.delete(key);
                    return Promise.resolve(null);
               }
               return Promise.resolve(item.value);
          }),
          setex: jest.fn((key: string, ttl: number, value: string) => {
               mockData.set(key, {
                    value,
                    expiry: Date.now() + ttl * 1000,
               });
               return Promise.resolve('OK');
          }),
          del: jest.fn((key: string) => {
               mockData.delete(key);
               return Promise.resolve(1);
          }),
          flushdb: jest.fn(() => {
               mockData.clear();
               return Promise.resolve('OK');
          }),
          quit: jest.fn(() => Promise.resolve('OK')),
          on: jest.fn(),
          status: 'ready',
          _mockData: mockData, // Expose for test access
     }));
});

describe('Cache Invalidation Property Tests', () => {
     let cacheService: CacheService;

     beforeAll(() => {
          cacheService = new CacheService();
     });

     afterAll(async () => {
          await cacheService.close();
     });

     beforeEach(async () => {
          await cacheService.clearAll();
          cacheService.resetMetrics();
     });

     /**
      * Property 32: Cache Invalidation on Update
      * For any user profile, after caching and then invalidating,
      * the cache should return null (cache miss)
      */
     test('Property 32: Cache Invalidation on Update - profile cache', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }), // userId
                    fc.record({
                         voiceType: fc.constantFrom('educational', 'storytelling', 'opinionated', 'analytical', 'casual', 'professional'),
                         tone: fc.record({
                              formality: fc.integer({ min: 1, max: 10 }),
                              enthusiasm: fc.integer({ min: 1, max: 10 }),
                              directness: fc.integer({ min: 1, max: 10 }),
                              humor: fc.integer({ min: 1, max: 10 }),
                              emotionality: fc.integer({ min: 1, max: 10 }),
                         }),
                         writingTraits: fc.record({
                              avgSentenceLength: fc.integer({ min: 5, max: 50 }),
                              usesQuestionsOften: fc.boolean(),
                              usesEmojis: fc.boolean(),
                              emojiFrequency: fc.integer({ min: 0, max: 5 }),
                              usesBulletPoints: fc.boolean(),
                              usesShortParagraphs: fc.boolean(),
                              usesHooks: fc.boolean(),
                         }),
                         structurePreferences: fc.record({
                              introStyle: fc.constantFrom('hook', 'story', 'problem', 'statement'),
                              bodyStyle: fc.constantFrom('steps', 'narrative', 'analysis', 'bullets'),
                              endingStyle: fc.constantFrom('cta', 'reflection', 'summary', 'question'),
                         }),
                         vocabularyLevel: fc.constantFrom('simple', 'medium', 'advanced'),
                         commonPhrases: fc.array(fc.string(), { maxLength: 10 }),
                         bannedPhrases: fc.array(fc.string(), { maxLength: 10 }),
                         samplePosts: fc.array(fc.string(), { maxLength: 10 }),
                         learningIterations: fc.integer({ min: 0, max: 100 }),
                         lastUpdated: fc.date(),
                         profileSource: fc.constantFrom('manual', 'file', 'feedback', 'archetype'),
                    }),
                    async (userId, profile) => {
                         // Step 1: Cache the profile
                         await cacheService.setStyleProfile(userId, profile as StyleProfile);

                         // Step 2: Verify it's cached (should be a cache hit)
                         const cached = await cacheService.getStyleProfile(userId);
                         expect(cached).not.toBeNull();

                         // Step 3: Invalidate the cache
                         await cacheService.invalidateStyleProfile(userId);

                         // Step 4: Verify cache is invalidated (should be a cache miss)
                         const afterInvalidation = await cacheService.getStyleProfile(userId);
                         expect(afterInvalidation).toBeNull();

                         return true;
                    }
               ),
               { numRuns: 100 }
          );
     }, 60000); // 60 second timeout for property test

     /**
      * Property 32: Cache Invalidation on Update - evolution score cache
      * For any user evolution score, after caching and then invalidating,
      * the cache should return null (cache miss)
      */
     test('Property 32: Cache Invalidation on Update - evolution score cache', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }), // userId
                    fc.integer({ min: 0, max: 100 }), // evolution score
                    async (userId, score) => {
                         // Step 1: Cache the evolution score
                         await cacheService.setEvolutionScore(userId, score);

                         // Step 2: Verify it's cached (should be a cache hit)
                         const cached = await cacheService.getEvolutionScore(userId);
                         expect(cached).toBe(score);

                         // Step 3: Invalidate the cache
                         await cacheService.invalidateEvolutionScore(userId);

                         // Step 4: Verify cache is invalidated (should be a cache miss)
                         const afterInvalidation = await cacheService.getEvolutionScore(userId);
                         expect(afterInvalidation).toBeNull();

                         return true;
                    }
               ),
               { numRuns: 100 }
          );
     }, 60000);

     /**
      * Property 32: Cache Invalidation on Update - archetype list cache
      * After caching and then invalidating the archetype list,
      * the cache should return null (cache miss)
      */
     test('Property 32: Cache Invalidation on Update - archetype list cache', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              name: fc.string({ minLength: 1, maxLength: 50 }),
                              description: fc.string(),
                              category: fc.constantFrom('professional', 'casual', 'creative', 'technical'),
                              usageCount: fc.integer({ min: 0, max: 1000 }),
                         }),
                         { maxLength: 10 }
                    ),
                    async (archetypes) => {
                         // Step 1: Cache the archetype list
                         await cacheService.setArchetypeList(archetypes as any);

                         // Step 2: Verify it's cached (should be a cache hit)
                         const cached = await cacheService.getArchetypeList();
                         expect(cached).not.toBeNull();
                         expect(cached).toHaveLength(archetypes.length);

                         // Step 3: Invalidate the cache
                         await cacheService.invalidateArchetypeList();

                         // Step 4: Verify cache is invalidated (should be a cache miss)
                         const afterInvalidation = await cacheService.getArchetypeList();
                         expect(afterInvalidation).toBeNull();

                         return true;
                    }
               ),
               { numRuns: 100 }
          );
     }, 60000);

     /**
      * Property: Multiple invalidations should be idempotent
      * Invalidating an already invalidated cache should not cause errors
      */
     test('Multiple invalidations are idempotent', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.integer({ min: 1, max: 5 }), // number of invalidations
                    async (userId, numInvalidations) => {
                         // Cache a profile
                         const profile = {
                              voiceType: 'casual',
                              tone: { formality: 5, enthusiasm: 5, directness: 5, humor: 5, emotionality: 5 },
                              writingTraits: {
                                   avgSentenceLength: 15,
                                   usesQuestionsOften: false,
                                   usesEmojis: false,
                                   emojiFrequency: 0,
                                   usesBulletPoints: false,
                                   usesShortParagraphs: false,
                                   usesHooks: false,
                              },
                              structurePreferences: {
                                   introStyle: 'hook',
                                   bodyStyle: 'narrative',
                                   endingStyle: 'summary',
                              },
                              vocabularyLevel: 'medium',
                              commonPhrases: [],
                              bannedPhrases: [],
                              samplePosts: [],
                              learningIterations: 0,
                              lastUpdated: new Date(),
                              profileSource: 'manual',
                         } as StyleProfile;

                         await cacheService.setStyleProfile(userId, profile);

                         // Invalidate multiple times
                         for (let i = 0; i < numInvalidations; i++) {
                              await cacheService.invalidateStyleProfile(userId);
                         }

                         // Should still be null after multiple invalidations
                         const result = await cacheService.getStyleProfile(userId);
                         expect(result).toBeNull();

                         return true;
                    }
               ),
               { numRuns: 50 }
          );
     }, 60000);
});
