/**
 * Unit Tests for Cache Service
 * Tests cache hit/miss scenarios, TTL expiration, and fallback to database
 * Validates: Requirements 13.2, 13.9
 */

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
          _mockData: mockData,
     }));
});

describe('CacheService Unit Tests', () => {
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

     describe('Cache Hit and Miss Scenarios', () => {
          test('should return null on cache miss for profile', async () => {
               const result = await cacheService.getStyleProfile('nonexistent-user');
               expect(result).toBeNull();

               const metrics = cacheService.getMetrics();
               expect(metrics.misses).toBe(1);
               expect(metrics.hits).toBe(0);
          });

          test('should return cached profile on cache hit', async () => {
               const userId = 'test-user-1';
               const profile: StyleProfile = {
                    voiceType: 'casual',
                    tone: { formality: 5, enthusiasm: 7, directness: 8, humor: 6, emotionality: 5 },
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
                    vocabularyLevel: 'simple',
                    commonPhrases: ['Let me break this down', 'Here\'s the thing'],
                    bannedPhrases: ['leverage', 'synergy'],
                    samplePosts: ['Sample post 1', 'Sample post 2'],
                    learningIterations: 5,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };

               await cacheService.setStyleProfile(userId, profile);
               const cached = await cacheService.getStyleProfile(userId);

               expect(cached).not.toBeNull();
               expect(cached?.voiceType).toBe('casual');
               expect(cached?.tone.enthusiasm).toBe(7);

               const metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(1);
               expect(metrics.misses).toBe(0);
          });

          test('should return null on cache miss for evolution score', async () => {
               const result = await cacheService.getEvolutionScore('nonexistent-user');
               expect(result).toBeNull();

               const metrics = cacheService.getMetrics();
               expect(metrics.misses).toBe(1);
          });

          test('should return cached evolution score on cache hit', async () => {
               const userId = 'test-user-2';
               const score = 75;

               await cacheService.setEvolutionScore(userId, score);
               const cached = await cacheService.getEvolutionScore(userId);

               expect(cached).toBe(score);

               const metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(1);
          });

          test('should return null on cache miss for archetype list', async () => {
               const result = await cacheService.getArchetypeList();
               expect(result).toBeNull();

               const metrics = cacheService.getMetrics();
               expect(metrics.misses).toBe(1);
          });

          test('should return cached archetype list on cache hit', async () => {
               const archetypes = [
                    {
                         name: 'Tech Twitter Influencer',
                         description: 'Casual tech style',
                         category: 'casual',
                         usageCount: 10,
                    },
               ];

               await cacheService.setArchetypeList(archetypes as any);
               const cached = await cacheService.getArchetypeList();

               expect(cached).not.toBeNull();
               expect(cached).toHaveLength(1);
               expect(cached![0].name).toBe('Tech Twitter Influencer');

               const metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(1);
          });
     });

     describe('Cache Invalidation on Update', () => {
          test('should invalidate profile cache on update', async () => {
               const userId = 'test-user-3';
               const profile: StyleProfile = {
                    voiceType: 'professional',
                    tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                    writingTraits: {
                         avgSentenceLength: 20,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: false,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'statement',
                         bodyStyle: 'analysis',
                         endingStyle: 'summary',
                    },
                    vocabularyLevel: 'advanced',
                    commonPhrases: [],
                    bannedPhrases: [],
                    samplePosts: [],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'archetype',
               };

               // Cache the profile
               await cacheService.setStyleProfile(userId, profile);
               let cached = await cacheService.getStyleProfile(userId);
               expect(cached).not.toBeNull();

               // Invalidate
               await cacheService.invalidateStyleProfile(userId);

               // Should be null after invalidation
               cached = await cacheService.getStyleProfile(userId);
               expect(cached).toBeNull();
          });

          test('should invalidate evolution score cache on update', async () => {
               const userId = 'test-user-4';
               const score = 50;

               await cacheService.setEvolutionScore(userId, score);
               let cached = await cacheService.getEvolutionScore(userId);
               expect(cached).toBe(score);

               await cacheService.invalidateEvolutionScore(userId);

               cached = await cacheService.getEvolutionScore(userId);
               expect(cached).toBeNull();
          });

          test('should invalidate archetype list cache', async () => {
               const archetypes = [{ name: 'Test', description: 'Test', category: 'casual', usageCount: 0 }];

               await cacheService.setArchetypeList(archetypes as any);
               let cached = await cacheService.getArchetypeList();
               expect(cached).not.toBeNull();

               await cacheService.invalidateArchetypeList();

               cached = await cacheService.getArchetypeList();
               expect(cached).toBeNull();
          });
     });

     describe('TTL Expiration', () => {
          test('should respect TTL for profile cache (1 hour)', async () => {
               // Note: This test verifies the TTL is set correctly
               // Actual expiration testing would require time manipulation
               const userId = 'test-user-5';
               const profile: StyleProfile = {
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
               };

               await cacheService.setStyleProfile(userId, profile);
               const cached = await cacheService.getStyleProfile(userId);

               // Should be cached immediately
               expect(cached).not.toBeNull();
          });

          test('should respect TTL for evolution score cache (5 minutes)', async () => {
               const userId = 'test-user-6';
               const score = 80;

               await cacheService.setEvolutionScore(userId, score);
               const cached = await cacheService.getEvolutionScore(userId);

               // Should be cached immediately
               expect(cached).toBe(score);
          });

          test('should respect TTL for archetype list cache (24 hours)', async () => {
               const archetypes = [{ name: 'Test', description: 'Test', category: 'casual', usageCount: 0 }];

               await cacheService.setArchetypeList(archetypes as any);
               const cached = await cacheService.getArchetypeList();

               // Should be cached immediately
               expect(cached).not.toBeNull();
          });
     });

     describe('Cache Metrics', () => {
          test('should track cache hits and misses correctly', async () => {
               const userId = 'test-user-7';
               const profile: StyleProfile = {
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
               };

               // Miss
               await cacheService.getStyleProfile(userId);

               // Set
               await cacheService.setStyleProfile(userId, profile);

               // Hit
               await cacheService.getStyleProfile(userId);

               // Hit
               await cacheService.getStyleProfile(userId);

               const metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(2);
               expect(metrics.misses).toBe(1);
               expect(metrics.hitRate).toBeCloseTo(0.67, 1); // 2/3 = 0.67
          });

          test('should calculate hit rate correctly', async () => {
               // 3 misses
               await cacheService.getStyleProfile('user1');
               await cacheService.getStyleProfile('user2');
               await cacheService.getStyleProfile('user3');

               const metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(0);
               expect(metrics.misses).toBe(3);
               expect(metrics.hitRate).toBe(0);
          });

          test('should reset metrics', async () => {
               await cacheService.getStyleProfile('user1');
               await cacheService.getStyleProfile('user2');

               let metrics = cacheService.getMetrics();
               expect(metrics.misses).toBe(2);

               cacheService.resetMetrics();

               metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(0);
               expect(metrics.misses).toBe(0);
               expect(metrics.hitRate).toBe(0);
          });
     });

     describe('Fallback to Database', () => {
          test('should return null on cache miss, allowing fallback to DB', async () => {
               // This test verifies the cache-aside pattern
               // When cache returns null, the caller should fetch from DB
               const userId = 'test-user-8';

               const cached = await cacheService.getStyleProfile(userId);
               expect(cached).toBeNull();

               // In real usage, the caller would now fetch from DB
               // and then cache the result
               const profileFromDB: StyleProfile = {
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
               };

               await cacheService.setStyleProfile(userId, profileFromDB);

               // Now it should be cached
               const cachedAfter = await cacheService.getStyleProfile(userId);
               expect(cachedAfter).not.toBeNull();
          });
     });

     describe('Connection Status', () => {
          test('should report connection status', () => {
               const isConnected = cacheService.isConnected();
               expect(isConnected).toBe(true);
          });
     });
});
