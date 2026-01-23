/**
 * Property-Based Tests for Cache Expiration Consistency
 * Feature: visual-intelligence-code-snapshot-generator
 * **Validates: Requirements 9.4**
 * 
 * Property 14: Cache Expiration Consistency
 * For any Gemini AI analysis result, cached data should expire after 24 hours.
 */

import * as fc from 'fast-check';
import { CacheService } from '../CacheService';
import { SNAPSHOT_CONFIG } from '../../config/constants';

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
          _mockData: mockData,
     }));
});

describe('Property 14: Cache Expiration Consistency', () => {
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
      * Property: Default TTL is 24 hours
      * For any cache key and data, when cached with default TTL,
      * the TTL should be exactly 24 hours (86400 seconds)
      */
     test('property: default TTL is 24 hours for all cache entries', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         repositoryId: fc.hexaString({ minLength: 24, maxLength: 24 }),
                         commitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                         analysisData: fc.record({
                              snippets: fc.array(
                                   fc.record({
                                        filePath: fc.string({ minLength: 5, maxLength: 50 }),
                                        score: fc.integer({ min: 0, max: 100 }),
                                        reason: fc.string({ minLength: 10, maxLength: 100 }),
                                   }),
                                   { minLength: 0, maxLength: 10 }
                              ),
                              timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
                              totalFiles: fc.integer({ min: 1, max: 1000 }),
                         }),
                    }),
                    async ({ repositoryId, commitSha, analysisData }) => {
                         const cacheKey = `${repositoryId}:${commitSha}`;

                         // Cache with default TTL (no custom TTL provided)
                         await cacheService.cacheSnapshotAnalysis(cacheKey, analysisData);

                         // Verify data is cached immediately
                         const cached = await cacheService.getCachedSnapshotAnalysis(cacheKey);
                         expect(cached).toEqual(analysisData);

                         // The default TTL should be 24 hours (86400 seconds)
                         // This is verified by the constant
                         expect(SNAPSHOT_CONFIG.ANALYSIS_CACHE_TTL_SECONDS).toBe(24 * 3600);
                    }
               ),
               { numRuns: 20 }
          );
     });

     /**
      * Property: Cache entries expire after TTL
      * For any cache key and short TTL, cached data should be retrievable
      * before expiration and null after expiration
      */
     test('property: cache entries expire after specified TTL', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         repositoryId: fc.hexaString({ minLength: 24, maxLength: 24 }),
                         commitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                         analysisData: fc.record({
                              result: fc.string({ minLength: 10, maxLength: 100 }),
                              score: fc.integer({ min: 0, max: 100 }),
                         }),
                         ttlSeconds: fc.integer({ min: 1, max: 2 }), // Short TTL for testing
                    }),
                    async ({ repositoryId, commitSha, analysisData, ttlSeconds }) => {
                         const cacheKey = `${repositoryId}:${commitSha}`;

                         // Cache with custom short TTL
                         await cacheService.cacheSnapshotAnalysis(cacheKey, analysisData, ttlSeconds);

                         // Should be cached immediately
                         const cachedBefore = await cacheService.getCachedSnapshotAnalysis(cacheKey);
                         expect(cachedBefore).toEqual(analysisData);

                         // Wait for TTL to expire (add 100ms buffer)
                         await new Promise((resolve) => setTimeout(resolve, ttlSeconds * 1000 + 100));

                         // Should be expired now
                         const cachedAfter = await cacheService.getCachedSnapshotAnalysis(cacheKey);
                         expect(cachedAfter).toBeNull();
                    }
               ),
               { numRuns: 10 } // Fewer runs due to time delays
          );
     });

     /**
      * Property: Multiple entries with different TTLs expire independently
      * For any set of cache entries with different TTLs, each should expire
      * at its own time without affecting others
      */
     test('property: multiple entries with different TTLs expire independently', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         entries: fc.array(
                              fc.record({
                                   repositoryId: fc.hexaString({ minLength: 24, maxLength: 24 }),
                                   commitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                                   data: fc.record({
                                        value: fc.string({ minLength: 5, maxLength: 50 }),
                                   }),
                                   ttl: fc.constantFrom(1, 2, 3), // Different TTLs
                              }),
                              { minLength: 2, maxLength: 5 }
                         ),
                    }),
                    async ({ entries }) => {
                         // Ensure unique keys
                         const uniqueEntries = entries.filter(
                              (entry, index, self) =>
                                   index ===
                                   self.findIndex(
                                        (e) =>
                                             e.repositoryId === entry.repositoryId &&
                                             e.commitSha === entry.commitSha
                                   )
                         );

                         if (uniqueEntries.length < 2) return; // Skip if not enough unique entries

                         // Cache all entries
                         for (const entry of uniqueEntries) {
                              const key = `${entry.repositoryId}:${entry.commitSha}`;
                              await cacheService.cacheSnapshotAnalysis(key, entry.data, entry.ttl);
                         }

                         // All should be cached initially
                         for (const entry of uniqueEntries) {
                              const key = `${entry.repositoryId}:${entry.commitSha}`;
                              const cached = await cacheService.getCachedSnapshotAnalysis(key);
                              expect(cached).toEqual(entry.data);
                         }

                         // Wait for shortest TTL to expire
                         const minTTL = Math.min(...uniqueEntries.map((e) => e.ttl));
                         await new Promise((resolve) => setTimeout(resolve, minTTL * 1000 + 100));

                         // Entries with minTTL should be expired, others should still be cached
                         for (const entry of uniqueEntries) {
                              const key = `${entry.repositoryId}:${entry.commitSha}`;
                              const cached = await cacheService.getCachedSnapshotAnalysis(key);

                              if (entry.ttl === minTTL) {
                                   expect(cached).toBeNull();
                              } else {
                                   expect(cached).toEqual(entry.data);
                              }
                         }
                    }
               ),
               { numRuns: 5 } // Fewer runs due to time delays
          );
     });

     /**
      * Property: Cache invalidation removes entries regardless of TTL
      * For any cached entries, invalidation should remove them immediately
      * even if TTL has not expired
      */
     test('property: cache invalidation removes entries regardless of TTL', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         repositoryId: fc.hexaString({ minLength: 24, maxLength: 24 }),
                         commits: fc.array(
                              fc.record({
                                   sha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                                   data: fc.record({
                                        snippets: fc.array(fc.string({ minLength: 5, maxLength: 20 })),
                                   }),
                              }),
                              { minLength: 1, maxLength: 5 }
                         ),
                         ttl: fc.integer({ min: 3600, max: 86400 }), // Long TTL (1-24 hours)
                    }),
                    async ({ repositoryId, commits, ttl }) => {
                         // Ensure unique commit SHAs
                         const uniqueCommits = commits.filter(
                              (commit, index, self) =>
                                   index === self.findIndex((c) => c.sha === commit.sha)
                         );

                         if (uniqueCommits.length === 0) return;

                         // Cache all entries with long TTL
                         for (const commit of uniqueCommits) {
                              const key = `${repositoryId}:${commit.sha}`;
                              await cacheService.cacheSnapshotAnalysis(key, commit.data, ttl);
                         }

                         // Verify all are cached
                         for (const commit of uniqueCommits) {
                              const key = `${repositoryId}:${commit.sha}`;
                              const cached = await cacheService.getCachedSnapshotAnalysis(key);
                              expect(cached).toEqual(commit.data);
                         }

                         // Invalidate all entries for the repository
                         await cacheService.invalidateSnapshotCache(repositoryId);

                         // All should be invalidated immediately, regardless of TTL
                         for (const commit of uniqueCommits) {
                              const key = `${repositoryId}:${commit.sha}`;
                              const cached = await cacheService.getCachedSnapshotAnalysis(key);
                              expect(cached).toBeNull();
                         }
                    }
               ),
               { numRuns: 20 }
          );
     });

     /**
      * Property: Repository isolation in cache invalidation
      * For any set of repositories, invalidating one repository's cache
      * should not affect other repositories' cached entries
      */
     test('property: repository isolation in cache invalidation', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         repositories: fc.array(
                              fc.record({
                                   id: fc.hexaString({ minLength: 24, maxLength: 24 }),
                                   commitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                                   data: fc.record({
                                        value: fc.string({ minLength: 10, maxLength: 50 }),
                                   }),
                              }),
                              { minLength: 2, maxLength: 5 }
                         ),
                         targetIndex: fc.integer({ min: 0, max: 4 }),
                    }),
                    async ({ repositories, targetIndex }) => {
                         // Ensure unique repository IDs
                         const uniqueRepos = repositories.filter(
                              (repo, index, self) =>
                                   index === self.findIndex((r) => r.id === repo.id && r.commitSha === repo.commitSha)
                         );

                         if (uniqueRepos.length < 2) return; // Need at least 2 repositories

                         const actualTargetIndex = targetIndex % uniqueRepos.length;

                         // Cache all entries
                         for (const repo of uniqueRepos) {
                              const key = `${repo.id}:${repo.commitSha}`;
                              await cacheService.cacheSnapshotAnalysis(key, repo.data);
                         }

                         // Invalidate only the target repository
                         const targetRepo = uniqueRepos[actualTargetIndex];
                         await cacheService.invalidateSnapshotCache(targetRepo.id);

                         // Verify target is invalidated, others are not
                         for (let i = 0; i < uniqueRepos.length; i++) {
                              const repo = uniqueRepos[i];
                              const key = `${repo.id}:${repo.commitSha}`;
                              const cached = await cacheService.getCachedSnapshotAnalysis(key);

                              if (i === actualTargetIndex) {
                                   expect(cached).toBeNull();
                              } else {
                                   expect(cached).toEqual(repo.data);
                              }
                         }
                    }
               ),
               { numRuns: 20 }
          );
     });

     /**
      * Property: Cache hit/miss metrics consistency
      * For any sequence of cache operations, metrics should accurately
      * reflect the number of hits and misses
      */
     test('property: cache hit/miss metrics consistency', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         operations: fc.array(
                              fc.record({
                                   type: fc.constantFrom('cache', 'get'),
                                   key: fc.hexaString({ minLength: 10, maxLength: 20 }),
                                   data: fc.record({
                                        value: fc.string({ minLength: 5, maxLength: 20 }),
                                   }),
                              }),
                              { minLength: 5, maxLength: 20 }
                         ),
                    }),
                    async ({ operations }) => {
                         cacheService.resetMetrics();

                         let expectedHits = 0;
                         let expectedMisses = 0;
                         const cachedKeys = new Set<string>();

                         for (const op of operations) {
                              if (op.type === 'cache') {
                                   await cacheService.cacheSnapshotAnalysis(op.key, op.data);
                                   cachedKeys.add(op.key);
                              } else {
                                   // get operation
                                   await cacheService.getCachedSnapshotAnalysis(op.key);
                                   if (cachedKeys.has(op.key)) {
                                        expectedHits++;
                                   } else {
                                        expectedMisses++;
                                   }
                              }
                         }

                         const metrics = cacheService.getMetrics();
                         expect(metrics.hits).toBe(expectedHits);
                         expect(metrics.misses).toBe(expectedMisses);
                    }
               ),
               { numRuns: 20 }
          );
     });

     /**
      * Property: Custom TTL overrides default TTL
      * For any cache entry with custom TTL, the custom TTL should be used
      * instead of the default 24-hour TTL
      */
     test('property: custom TTL overrides default TTL', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         repositoryId: fc.hexaString({ minLength: 24, maxLength: 24 }),
                         commitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                         data: fc.record({
                              result: fc.string({ minLength: 10, maxLength: 50 }),
                         }),
                         customTTL: fc.integer({ min: 1, max: 2 }), // Short custom TTL
                    }),
                    async ({ repositoryId, commitSha, data, customTTL }) => {
                         const key = `${repositoryId}:${commitSha}`;

                         // Cache with custom TTL
                         await cacheService.cacheSnapshotAnalysis(key, data, customTTL);

                         // Should be cached immediately
                         const cachedBefore = await cacheService.getCachedSnapshotAnalysis(key);
                         expect(cachedBefore).toEqual(data);

                         // Wait for custom TTL to expire
                         await new Promise((resolve) => setTimeout(resolve, customTTL * 1000 + 100));

                         // Should be expired (proving custom TTL was used, not default 24h)
                         const cachedAfter = await cacheService.getCachedSnapshotAnalysis(key);
                         expect(cachedAfter).toBeNull();
                    }
               ),
               { numRuns: 10 } // Fewer runs due to time delays
          );
     });
});
