import Redis from 'ioredis';
import { StyleProfile } from '../models/User';
import { IVoiceArchetype } from '../models/VoiceArchetype';
import { CACHE_CONFIG, REDIS_CONFIG, SNAPSHOT_CONFIG } from '../config/constants';

export interface CacheMetrics {
     hits: number;
     misses: number;
     hitRate: number;
}

export class CacheService {
     private redis: Redis;
     private metrics: { hits: number; misses: number };

     // Cache TTLs in seconds
     private readonly PROFILE_TTL = CACHE_CONFIG.PROFILE_TTL_SECONDS;
     private readonly EVOLUTION_SCORE_TTL = CACHE_CONFIG.EVOLUTION_SCORE_TTL_SECONDS;
     private readonly ARCHETYPE_LIST_TTL = CACHE_CONFIG.ARCHETYPE_LIST_TTL_SECONDS;

     // Cache key prefixes
     private readonly PROFILE_PREFIX = 'profile:';
     private readonly EVOLUTION_SCORE_PREFIX = 'evolution:';
     private readonly ARCHETYPE_LIST_KEY = 'archetypes:list';
     private readonly SNAPSHOT_ANALYSIS_PREFIX = 'snapshot:analysis:';
     private readonly SNAPSHOT_SELECTION_PREFIX = 'snapshot:selection:';

     constructor() {
          // Use centralized Redis URL parsing
          const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

          this.redis = new Redis(redisUrl, {
               maxRetriesPerRequest: null,
               retryStrategy: (times: number) => {
                    const delay = Math.min(times * REDIS_CONFIG.RETRY_DELAY_BASE_MS, REDIS_CONFIG.MAX_RETRY_DELAY_MS);
                    return delay;
               },
          });

          this.metrics = { hits: 0, misses: 0 };

          this.redis.on('error', (error) => {
               console.error('[Cache] Redis connection error:', error.message);
          });

          this.redis.on('connect', () => {
               console.log('[Cache] Redis connected successfully');
          });
     }



     /**
      * Get style profile from cache
      * Implements cache-aside pattern: check cache, fallback to DB
      */
     async getStyleProfile(userId: string): Promise<StyleProfile | null> {
          try {
               const key = `${this.PROFILE_PREFIX}${userId}`;
               const cached = await this.redis.get(key);

               if (cached) {
                    this.metrics.hits++;
                    console.log(`[Cache] Profile cache HIT for user ${userId}`);
                    return JSON.parse(cached) as StyleProfile;
               }

               this.metrics.misses++;
               console.log(`[Cache] Profile cache MISS for user ${userId}`);
               return null;
          } catch (error: any) {
               console.error(`[Cache] Error getting profile from cache:`, error.message);
               this.metrics.misses++;
               return null; // Graceful degradation: return null on cache error
          }
     }

     /**
      * Set style profile in cache with 1-hour TTL
      */
     async setStyleProfile(userId: string, profile: StyleProfile): Promise<void> {
          try {
               const key = `${this.PROFILE_PREFIX}${userId}`;
               await this.redis.setex(key, this.PROFILE_TTL, JSON.stringify(profile));
               console.log(`[Cache] Cached profile for user ${userId} (TTL: ${this.PROFILE_TTL}s)`);
          } catch (error: any) {
               console.error(`[Cache] Error setting profile in cache:`, error.message);
               // Don't throw - caching is optional
          }
     }

     /**
      * Invalidate style profile cache on update
      */
     async invalidateStyleProfile(userId: string): Promise<void> {
          try {
               const key = `${this.PROFILE_PREFIX}${userId}`;
               await this.redis.del(key);
               console.log(`[Cache] Invalidated profile cache for user ${userId}`);
          } catch (error: any) {
               console.error(`[Cache] Error invalidating profile cache:`, error.message);
               // Don't throw - cache invalidation failure is not critical
          }
     }

     /**
      * Get evolution score from cache
      */
     async getEvolutionScore(userId: string): Promise<number | null> {
          try {
               const key = `${this.EVOLUTION_SCORE_PREFIX}${userId}`;
               const cached = await this.redis.get(key);

               if (cached) {
                    this.metrics.hits++;
                    console.log(`[Cache] Evolution score cache HIT for user ${userId}`);
                    return parseFloat(cached);
               }

               this.metrics.misses++;
               console.log(`[Cache] Evolution score cache MISS for user ${userId}`);
               return null;
          } catch (error: any) {
               console.error(`[Cache] Error getting evolution score from cache:`, error.message);
               this.metrics.misses++;
               return null;
          }
     }

     /**
      * Set evolution score in cache with 5-minute TTL
      */
     async setEvolutionScore(userId: string, score: number): Promise<void> {
          try {
               const key = `${this.EVOLUTION_SCORE_PREFIX}${userId}`;
               await this.redis.setex(key, this.EVOLUTION_SCORE_TTL, score.toString());
               console.log(`[Cache] Cached evolution score for user ${userId} (TTL: ${this.EVOLUTION_SCORE_TTL}s)`);
          } catch (error: any) {
               console.error(`[Cache] Error setting evolution score in cache:`, error.message);
          }
     }

     /**
      * Invalidate evolution score cache
      */
     async invalidateEvolutionScore(userId: string): Promise<void> {
          try {
               const key = `${this.EVOLUTION_SCORE_PREFIX}${userId}`;
               await this.redis.del(key);
               console.log(`[Cache] Invalidated evolution score cache for user ${userId}`);
          } catch (error: any) {
               console.error(`[Cache] Error invalidating evolution score cache:`, error.message);
          }
     }

     /**
      * Get archetype list from cache
      */
     async getArchetypeList(): Promise<IVoiceArchetype[] | null> {
          try {
               const cached = await this.redis.get(this.ARCHETYPE_LIST_KEY);

               if (cached) {
                    this.metrics.hits++;
                    console.log(`[Cache] Archetype list cache HIT`);
                    return JSON.parse(cached) as IVoiceArchetype[];
               }

               this.metrics.misses++;
               console.log(`[Cache] Archetype list cache MISS`);
               return null;
          } catch (error: any) {
               console.error(`[Cache] Error getting archetype list from cache:`, error.message);
               this.metrics.misses++;
               return null;
          }
     }

     /**
      * Set archetype list in cache with 24-hour TTL (rarely changes)
      */
     async setArchetypeList(archetypes: IVoiceArchetype[]): Promise<void> {
          try {
               await this.redis.setex(
                    this.ARCHETYPE_LIST_KEY,
                    this.ARCHETYPE_LIST_TTL,
                    JSON.stringify(archetypes)
               );
               console.log(`[Cache] Cached archetype list (TTL: ${this.ARCHETYPE_LIST_TTL}s)`);
          } catch (error: any) {
               console.error(`[Cache] Error setting archetype list in cache:`, error.message);
          }
     }

     /**
      * Invalidate archetype list cache (when new archetype is added)
      */
     async invalidateArchetypeList(): Promise<void> {
          try {
               await this.redis.del(this.ARCHETYPE_LIST_KEY);
               console.log(`[Cache] Invalidated archetype list cache`);
          } catch (error: any) {
               console.error(`[Cache] Error invalidating archetype list cache:`, error.message);
          }
     }

     /**
      * Get cache hit/miss metrics
      */
     getMetrics(): CacheMetrics {
          const total = this.metrics.hits + this.metrics.misses;
          const hitRate = total > 0 ? this.metrics.hits / total : 0;

          return {
               hits: this.metrics.hits,
               misses: this.metrics.misses,
               hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
          };
     }

     /**
      * Reset metrics (useful for testing)
      */
     resetMetrics(): void {
          this.metrics = { hits: 0, misses: 0 };
     }

     /**
      * Clear all cache entries (useful for testing)
      */
     async clearAll(): Promise<void> {
          try {
               await this.redis.flushdb();
               console.log(`[Cache] Cleared all cache entries`);
          } catch (error: any) {
               console.error(`[Cache] Error clearing cache:`, error.message);
          }
     }

     /**
      * Cache snapshot analysis results with 24-hour TTL
      * @param key - Cache key (e.g., repositoryId:commitSha or snippet hash)
      * @param data - Analysis data to cache (any JSON-serializable object)
      * @param ttl - Optional TTL in seconds (defaults to 24 hours)
      */
     async cacheSnapshotAnalysis(key: string, data: any, ttl?: number): Promise<void> {
          try {
               const cacheKey = `${this.SNAPSHOT_ANALYSIS_PREFIX}${key}`;
               const cacheTTL = ttl || SNAPSHOT_CONFIG.ANALYSIS_CACHE_TTL_SECONDS;
               await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(data));
               console.log(`[Cache] Cached snapshot analysis for key ${key} (TTL: ${cacheTTL}s)`);
          } catch (error: any) {
               console.error(`[Cache] Error caching snapshot analysis:`, error.message);
               // Don't throw - caching is optional
          }
     }

     /**
      * Get cached snapshot analysis results
      * @param key - Cache key (e.g., repositoryId:commitSha or snippet hash)
      * @returns Cached analysis data or null if not found
      */
     async getCachedSnapshotAnalysis(key: string): Promise<any | null> {
          try {
               const cacheKey = `${this.SNAPSHOT_ANALYSIS_PREFIX}${key}`;
               const cached = await this.redis.get(cacheKey);

               if (cached) {
                    this.metrics.hits++;
                    console.log(`[Cache] Snapshot analysis cache HIT for key ${key}`);
                    return JSON.parse(cached);
               }

               this.metrics.misses++;
               console.log(`[Cache] Snapshot analysis cache MISS for key ${key}`);
               return null;
          } catch (error: any) {
               console.error(`[Cache] Error getting snapshot analysis from cache:`, error.message);
               this.metrics.misses++;
               return null; // Graceful degradation
          }
     }

     /**
      * Invalidate snapshot cache by repository ID pattern
      * Removes all snapshot-related cache entries for a repository
      * @param repositoryId - Repository ID to invalidate cache for
      */
     async invalidateSnapshotCache(repositoryId: string): Promise<void> {
          try {
               // Find all keys matching the repository pattern
               const analysisPattern = `${this.SNAPSHOT_ANALYSIS_PREFIX}${repositoryId}:*`;
               const selectionPattern = `${this.SNAPSHOT_SELECTION_PREFIX}${repositoryId}:*`;

               // Get all matching keys
               const analysisKeys = await this.redis.keys(analysisPattern);
               const selectionKeys = await this.redis.keys(selectionPattern);
               const allKeys = [...analysisKeys, ...selectionKeys];

               if (allKeys.length > 0) {
                    await this.redis.del(...allKeys);
                    console.log(`[Cache] Invalidated ${allKeys.length} snapshot cache entries for repository ${repositoryId}`);
               } else {
                    console.log(`[Cache] No snapshot cache entries found for repository ${repositoryId}`);
               }
          } catch (error: any) {
               console.error(`[Cache] Error invalidating snapshot cache:`, error.message);
               // Don't throw - cache invalidation failure is not critical
          }
     }

     /**
      * Close Redis connection
      */
     async close(): Promise<void> {
          try {
               await this.redis.quit();
               console.log(`[Cache] Redis connection closed`);
          } catch (error: any) {
               console.error(`[Cache] Error closing Redis connection:`, error.message);
          }
     }

     /**
      * Check if Redis is connected
      */
     isConnected(): boolean {
          return this.redis.status === 'ready';
     }
}

// Export singleton instance
export const cacheService = new CacheService();
