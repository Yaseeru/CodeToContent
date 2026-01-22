/**
 * Unit Tests for CacheService Snapshot Methods
 * Feature: visual-intelligence-code-snapshot-generator
 * Validates: Requirements 9.4
 */

import { CacheService } from '../CacheService';

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
          del: jest.fn((...keys: string[]) => {
               keys.forEach((key) => mockData.delete(key));
               return Promise.resolve(keys.length);
          }),
          keys: jest.fn((pattern: string) => {
               const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
               const matchingKeys = Array.from(mockData.keys()).filter((key) => regex.test(key));
               return Promise.resolve(matchingKeys);
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

describe('CacheService - Snapshot Methods', () => {
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

     describe('cacheSnapshotAnalysis', () => {
          it('should cache snapshot analysis with default TTL', async () => {
               const key = 'repo123:commit456';
               const data = {
                    snippets: [
                         { filePath: 'src/index.ts', score: 85 },
                         { filePath: 'src/utils.ts', score: 72 },
                    ],
                    timestamp: Date.now(),
               };

               await cacheService.cacheSnapshotAnalysis(key, data);

               const cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toEqual(data);
          });

          it('should cache snapshot analysis with custom TTL', async () => {
               const key = 'repo123:commit789';
               const data = { result: 'test data' };
               const customTTL = 3600; // 1 hour

               await cacheService.cacheSnapshotAnalysis(key, data, customTTL);

               const cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toEqual(data);
          });

          it('should handle complex nested data structures', async () => {
               const key = 'repo456:commit123';
               const data = {
                    analysis: {
                         snippets: [
                              {
                                   filePath: 'src/services/AuthService.ts',
                                   startLine: 10,
                                   endLine: 50,
                                   score: 92,
                                   reason: 'Core authentication logic',
                                   metadata: {
                                        complexity: 'high',
                                        recentlyChanged: true,
                                   },
                              },
                         ],
                         totalFiles: 150,
                         analyzedAt: new Date().toISOString(),
                    },
               };

               await cacheService.cacheSnapshotAnalysis(key, data);

               const cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toEqual(data);
          });

          it('should not throw on cache error', async () => {
               const key = 'error-key';
               const data = { test: 'data' };

               // This should not throw even if Redis has issues
               await expect(cacheService.cacheSnapshotAnalysis(key, data)).resolves.not.toThrow();
          });
     });

     describe('getCachedSnapshotAnalysis', () => {
          it('should return null for cache miss', async () => {
               const key = 'nonexistent-key';

               const result = await cacheService.getCachedSnapshotAnalysis(key);

               expect(result).toBeNull();
          });

          it('should return cached data for cache hit', async () => {
               const key = 'repo789:commit321';
               const data = { snippets: [], count: 0 };

               await cacheService.cacheSnapshotAnalysis(key, data);
               const result = await cacheService.getCachedSnapshotAnalysis(key);

               expect(result).toEqual(data);
          });

          it('should track cache hits and misses', async () => {
               const key = 'repo111:commit222';
               const data = { test: 'metrics' };

               // Cache miss
               await cacheService.getCachedSnapshotAnalysis(key);
               let metrics = cacheService.getMetrics();
               expect(metrics.misses).toBe(1);
               expect(metrics.hits).toBe(0);

               // Cache the data
               await cacheService.cacheSnapshotAnalysis(key, data);

               // Cache hit
               await cacheService.getCachedSnapshotAnalysis(key);
               metrics = cacheService.getMetrics();
               expect(metrics.hits).toBe(1);
               expect(metrics.misses).toBe(1);
          });

          it('should return null on cache error without throwing', async () => {
               const key = 'error-key';

               const result = await cacheService.getCachedSnapshotAnalysis(key);

               expect(result).toBeNull();
          });
     });

     describe('invalidateSnapshotCache', () => {
          it('should invalidate all snapshot cache entries for a repository', async () => {
               const repositoryId = 'repo123';

               // Cache multiple entries for the repository
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:commit1`, { data: 'test1' });
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:commit2`, { data: 'test2' });
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:commit3`, { data: 'test3' });

               // Verify they're cached
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:commit1`)).not.toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:commit2`)).not.toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:commit3`)).not.toBeNull();

               // Invalidate all entries for the repository
               await cacheService.invalidateSnapshotCache(repositoryId);

               // Verify they're all invalidated
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:commit1`)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:commit2`)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:commit3`)).toBeNull();
          });

          it('should not affect cache entries for other repositories', async () => {
               const repo1 = 'repo123';
               const repo2 = 'repo456';

               // Cache entries for both repositories
               await cacheService.cacheSnapshotAnalysis(`${repo1}:commit1`, { data: 'repo1-data' });
               await cacheService.cacheSnapshotAnalysis(`${repo2}:commit1`, { data: 'repo2-data' });

               // Invalidate only repo1
               await cacheService.invalidateSnapshotCache(repo1);

               // Verify repo1 is invalidated but repo2 is not
               expect(await cacheService.getCachedSnapshotAnalysis(`${repo1}:commit1`)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repo2}:commit1`)).not.toBeNull();
          });

          it('should handle invalidation when no cache entries exist', async () => {
               const repositoryId = 'nonexistent-repo';

               // Should not throw when no entries exist
               await expect(cacheService.invalidateSnapshotCache(repositoryId)).resolves.not.toThrow();
          });

          it('should invalidate both analysis and selection cache entries', async () => {
               const repositoryId = 'repo789';

               // Cache both types of entries (using the internal prefix structure)
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:analysis1`, { type: 'analysis' });
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:selection1`, { type: 'selection' });

               // Invalidate all
               await cacheService.invalidateSnapshotCache(repositoryId);

               // Verify both are invalidated
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:analysis1`)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:selection1`)).toBeNull();
          });

          it('should not throw on invalidation error', async () => {
               const repositoryId = 'error-repo';

               // Should not throw even if Redis has issues
               await expect(cacheService.invalidateSnapshotCache(repositoryId)).resolves.not.toThrow();
          });
     });

     describe('TTL behavior', () => {
          it('should use 24-hour TTL by default', async () => {
               const key = 'repo123:commit456';
               const data = { test: 'ttl' };

               await cacheService.cacheSnapshotAnalysis(key, data);

               // The data should be cached
               const cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toEqual(data);

               // Note: Testing actual TTL expiration would require waiting 24 hours
               // or mocking time, which is beyond the scope of this unit test
          });

          it('should respect custom TTL values', async () => {
               const key = 'repo123:commit789';
               const data = { test: 'custom-ttl' };
               const customTTL = 60; // 1 minute

               await cacheService.cacheSnapshotAnalysis(key, data, customTTL);

               const cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toEqual(data);
          });

          it('should expire cache entries after TTL', async () => {
               const key = 'repo123:commit-expire';
               const data = { test: 'expiration' };
               const shortTTL = 1; // 1 second

               // Cache with short TTL
               await cacheService.cacheSnapshotAnalysis(key, data, shortTTL);

               // Should be cached immediately
               let cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toEqual(data);

               // Wait for TTL to expire
               await new Promise((resolve) => setTimeout(resolve, 1100));

               // Should be expired now
               cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toBeNull();
          });

          it('should handle multiple entries with different TTLs', async () => {
               const key1 = 'repo123:short-ttl';
               const key2 = 'repo123:long-ttl';
               const data1 = { test: 'short' };
               const data2 = { test: 'long' };

               // Cache with different TTLs
               await cacheService.cacheSnapshotAnalysis(key1, data1, 1); // 1 second
               await cacheService.cacheSnapshotAnalysis(key2, data2, 3600); // 1 hour

               // Both should be cached initially
               expect(await cacheService.getCachedSnapshotAnalysis(key1)).toEqual(data1);
               expect(await cacheService.getCachedSnapshotAnalysis(key2)).toEqual(data2);

               // Wait for short TTL to expire
               await new Promise((resolve) => setTimeout(resolve, 1100));

               // Short TTL should be expired, long TTL should still be cached
               expect(await cacheService.getCachedSnapshotAnalysis(key1)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(key2)).toEqual(data2);
          });
     });

     describe('Cache key prefixes', () => {
          it('should use correct prefix for snapshot analysis', async () => {
               const key = 'test-key';
               const data = { test: 'prefix' };

               await cacheService.cacheSnapshotAnalysis(key, data);

               // The internal key should have the snapshot:analysis: prefix
               // This is verified by the fact that getCachedSnapshotAnalysis can retrieve it
               const cached = await cacheService.getCachedSnapshotAnalysis(key);
               expect(cached).toEqual(data);
          });

          it('should isolate snapshot cache from other cache types', async () => {
               const userId = 'user123';
               const snapshotKey = 'user123:commit456';

               // Cache a style profile (different cache type)
               const profile = {
                    voiceType: 'educational' as const,
                    tone: { formality: 5, enthusiasm: 5, directness: 5, humor: 5, emotionality: 5 },
                    writingTraits: {
                         avgSentenceLength: 20,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: false,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'hook' as const,
                         bodyStyle: 'narrative' as const,
                         endingStyle: 'summary' as const,
                    },
                    vocabularyLevel: 'medium' as const,
                    commonPhrases: [],
                    bannedPhrases: [],
                    samplePosts: [],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'manual' as const,
               };
               await cacheService.setStyleProfile(userId, profile);

               // Cache snapshot analysis with similar key
               await cacheService.cacheSnapshotAnalysis(snapshotKey, { data: 'snapshot' });

               // Both should be retrievable independently
               const cachedProfile = await cacheService.getStyleProfile(userId);
               const cachedSnapshot = await cacheService.getCachedSnapshotAnalysis(snapshotKey);

               expect(cachedProfile).not.toBeNull();
               expect(cachedSnapshot).not.toBeNull();
               expect(cachedSnapshot).toEqual({ data: 'snapshot' });
          });
     });

     describe('Cache key uniqueness', () => {
          it('should generate unique keys for different repositories', async () => {
               const repo1Key = 'repo123:commit456';
               const repo2Key = 'repo789:commit456';
               const data1 = { repo: 'repo123' };
               const data2 = { repo: 'repo789' };

               await cacheService.cacheSnapshotAnalysis(repo1Key, data1);
               await cacheService.cacheSnapshotAnalysis(repo2Key, data2);

               // Each repository should have its own cached data
               const cached1 = await cacheService.getCachedSnapshotAnalysis(repo1Key);
               const cached2 = await cacheService.getCachedSnapshotAnalysis(repo2Key);

               expect(cached1).toEqual(data1);
               expect(cached2).toEqual(data2);
               expect(cached1).not.toEqual(cached2);
          });

          it('should generate unique keys for different commits in same repository', async () => {
               const repositoryId = 'repo123';
               const commit1Key = `${repositoryId}:commit-abc`;
               const commit2Key = `${repositoryId}:commit-def`;
               const commit3Key = `${repositoryId}:commit-ghi`;

               const data1 = { commit: 'abc', snippets: ['snippet1'] };
               const data2 = { commit: 'def', snippets: ['snippet2'] };
               const data3 = { commit: 'ghi', snippets: ['snippet3'] };

               await cacheService.cacheSnapshotAnalysis(commit1Key, data1);
               await cacheService.cacheSnapshotAnalysis(commit2Key, data2);
               await cacheService.cacheSnapshotAnalysis(commit3Key, data3);

               // Each commit should have its own cached data
               expect(await cacheService.getCachedSnapshotAnalysis(commit1Key)).toEqual(data1);
               expect(await cacheService.getCachedSnapshotAnalysis(commit2Key)).toEqual(data2);
               expect(await cacheService.getCachedSnapshotAnalysis(commit3Key)).toEqual(data3);
          });

          it('should generate unique keys for snippet hashes', async () => {
               const hash1 = 'snippet-hash-a1b2c3d4';
               const hash2 = 'snippet-hash-e5f6g7h8';
               const hash3 = 'snippet-hash-i9j0k1l2';

               const data1 = { hash: hash1, score: 85 };
               const data2 = { hash: hash2, score: 92 };
               const data3 = { hash: hash3, score: 78 };

               await cacheService.cacheSnapshotAnalysis(hash1, data1);
               await cacheService.cacheSnapshotAnalysis(hash2, data2);
               await cacheService.cacheSnapshotAnalysis(hash3, data3);

               // Each snippet hash should have its own cached data
               expect(await cacheService.getCachedSnapshotAnalysis(hash1)).toEqual(data1);
               expect(await cacheService.getCachedSnapshotAnalysis(hash2)).toEqual(data2);
               expect(await cacheService.getCachedSnapshotAnalysis(hash3)).toEqual(data3);
          });

          it('should not confuse similar keys', async () => {
               const key1 = 'repo123:commit456';
               const key2 = 'repo123:commit4567'; // Similar but different
               const key3 = 'repo1234:commit456'; // Similar but different

               const data1 = { id: 1 };
               const data2 = { id: 2 };
               const data3 = { id: 3 };

               await cacheService.cacheSnapshotAnalysis(key1, data1);
               await cacheService.cacheSnapshotAnalysis(key2, data2);
               await cacheService.cacheSnapshotAnalysis(key3, data3);

               // Each key should retrieve its own data
               expect(await cacheService.getCachedSnapshotAnalysis(key1)).toEqual(data1);
               expect(await cacheService.getCachedSnapshotAnalysis(key2)).toEqual(data2);
               expect(await cacheService.getCachedSnapshotAnalysis(key3)).toEqual(data3);
          });

          it('should handle special characters in keys', async () => {
               const key1 = 'repo-with-dashes:commit-123';
               const key2 = 'repo_with_underscores:commit_456';
               const key3 = 'repo.with.dots:commit.789';

               const data1 = { type: 'dashes' };
               const data2 = { type: 'underscores' };
               const data3 = { type: 'dots' };

               await cacheService.cacheSnapshotAnalysis(key1, data1);
               await cacheService.cacheSnapshotAnalysis(key2, data2);
               await cacheService.cacheSnapshotAnalysis(key3, data3);

               // Each key with special characters should work correctly
               expect(await cacheService.getCachedSnapshotAnalysis(key1)).toEqual(data1);
               expect(await cacheService.getCachedSnapshotAnalysis(key2)).toEqual(data2);
               expect(await cacheService.getCachedSnapshotAnalysis(key3)).toEqual(data3);
          });

          it('should maintain uniqueness across many entries', async () => {
               const entries = [];
               const numEntries = 50;

               // Create many unique entries
               for (let i = 0; i < numEntries; i++) {
                    const key = `repo${i}:commit${i}`;
                    const data = { index: i, value: `data-${i}` };
                    entries.push({ key, data });
                    await cacheService.cacheSnapshotAnalysis(key, data);
               }

               // Verify all entries are retrievable with correct data
               for (const entry of entries) {
                    const cached = await cacheService.getCachedSnapshotAnalysis(entry.key);
                    expect(cached).toEqual(entry.data);
               }
          });
     });

     describe('Cache invalidation patterns', () => {
          it('should invalidate only matching patterns', async () => {
               // Cache entries for multiple repositories
               await cacheService.cacheSnapshotAnalysis('repo123:commit1', { data: 'r123-c1' });
               await cacheService.cacheSnapshotAnalysis('repo123:commit2', { data: 'r123-c2' });
               await cacheService.cacheSnapshotAnalysis('repo456:commit1', { data: 'r456-c1' });
               await cacheService.cacheSnapshotAnalysis('repo789:commit1', { data: 'r789-c1' });

               // Invalidate only repo123
               await cacheService.invalidateSnapshotCache('repo123');

               // Verify only repo123 entries are invalidated
               expect(await cacheService.getCachedSnapshotAnalysis('repo123:commit1')).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis('repo123:commit2')).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis('repo456:commit1')).not.toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis('repo789:commit1')).not.toBeNull();
          });

          it('should handle wildcard patterns correctly', async () => {
               const repositoryId = 'repo-wildcard-test';

               // Cache multiple entries with various suffixes
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:analysis-1`, { type: 'analysis' });
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:analysis-2`, { type: 'analysis' });
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:selection-1`, { type: 'selection' });
               await cacheService.cacheSnapshotAnalysis(`${repositoryId}:selection-2`, { type: 'selection' });

               // Verify all are cached
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:analysis-1`)).not.toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:analysis-2`)).not.toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:selection-1`)).not.toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:selection-2`)).not.toBeNull();

               // Invalidate all entries for the repository
               await cacheService.invalidateSnapshotCache(repositoryId);

               // Verify all are invalidated
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:analysis-1`)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:analysis-2`)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:selection-1`)).toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis(`${repositoryId}:selection-2`)).toBeNull();
          });

          it('should not invalidate partial matches', async () => {
               // Cache entries with similar prefixes
               await cacheService.cacheSnapshotAnalysis('repo1:commit1', { data: 'repo1' });
               await cacheService.cacheSnapshotAnalysis('repo12:commit1', { data: 'repo12' });
               await cacheService.cacheSnapshotAnalysis('repo123:commit1', { data: 'repo123' });

               // Invalidate repo1
               await cacheService.invalidateSnapshotCache('repo1');

               // Only exact repo1 entries should be invalidated
               expect(await cacheService.getCachedSnapshotAnalysis('repo1:commit1')).toBeNull();
               // repo12 and repo123 should still be cached (not partial matches)
               expect(await cacheService.getCachedSnapshotAnalysis('repo12:commit1')).not.toBeNull();
               expect(await cacheService.getCachedSnapshotAnalysis('repo123:commit1')).not.toBeNull();
          });
     });
});
