import { User, IUser, StyleProfile } from '../models/User';
import { cacheService } from './CacheService';
import Redis from 'ioredis';

export interface ProfileUpdateOperation {
     field: string;
     value: any;
     operation?: '$set' | '$inc' | '$push' | '$pull';
}

export interface AtomicUpdateResult {
     success: boolean;
     user?: IUser;
     error?: string;
     retries?: number;
}

export class AtomicProfileUpdateService {
     private redis: Redis;
     private readonly MAX_RETRIES = 3;
     private readonly LOCK_TTL = 5000; // 5 seconds
     private readonly RETRY_DELAY_BASE = 100; // Base delay in ms for exponential backoff

     constructor() {
          // Use existing Redis connection for distributed locks
          const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
          const [host, port] = this.parseRedisUrl(redisUrl);

          this.redis = new Redis({
               host,
               port,
               maxRetriesPerRequest: null,
               retryStrategy: (times: number) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
               },
          });

          this.redis.on('error', (error) => {
               console.error('[AtomicUpdate] Redis connection error:', error.message);
          });
     }

     /**
      * Parse Redis URL to extract host and port
      */
     private parseRedisUrl(url: string): [string, number] {
          const cleanUrl = url.replace('redis://', '');
          const parts = cleanUrl.split(':');
          const host = parts[0] || 'localhost';
          const port = parseInt(parts[1] || '6379', 10);
          return [host, port];
     }

     /**
      * Acquire a distributed lock for a user's profile
      * Uses Redis SET with NX (only set if not exists) and PX (expiry in milliseconds)
      */
     private async acquireLock(userId: string): Promise<boolean> {
          const lockKey = `lock:profile:${userId}`;
          const lockValue = `${Date.now()}`; // Unique lock value

          try {
               // SET key value NX PX milliseconds
               // Returns 'OK' if lock acquired, null if already locked
               const result = await this.redis.set(
                    lockKey,
                    lockValue,
                    'PX',
                    this.LOCK_TTL,
                    'NX'
               );

               const acquired = result === 'OK';
               if (acquired) {
                    console.log(`[AtomicUpdate] Lock acquired for user ${userId}`);
               } else {
                    console.log(`[AtomicUpdate] Lock already held for user ${userId}`);
               }

               return acquired;
          } catch (error: any) {
               console.error(`[AtomicUpdate] Error acquiring lock:`, error.message);
               return false;
          }
     }

     /**
      * Release a distributed lock for a user's profile
      */
     private async releaseLock(userId: string): Promise<void> {
          const lockKey = `lock:profile:${userId}`;

          try {
               await this.redis.del(lockKey);
               console.log(`[AtomicUpdate] Lock released for user ${userId}`);
          } catch (error: any) {
               console.error(`[AtomicUpdate] Error releasing lock:`, error.message);
          }
     }

     /**
      * Exponential backoff delay
      */
     private async delay(attempt: number): Promise<void> {
          const delayMs = this.RETRY_DELAY_BASE * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delayMs));
     }

     /**
      * Update style profile atomically with optimistic locking and retry logic
      * @param userId - The user ID
      * @param updates - Array of update operations
      * @param useDistributedLock - Whether to use distributed lock (default: true for critical sections)
      * @returns Promise<AtomicUpdateResult>
      */
     async updateStyleProfileAtomic(
          userId: string,
          updates: ProfileUpdateOperation[],
          useDistributedLock: boolean = true
     ): Promise<AtomicUpdateResult> {
          let lockAcquired = false;
          let retries = 0;

          try {
               // Acquire distributed lock if requested
               if (useDistributedLock) {
                    lockAcquired = await this.acquireLock(userId);
                    if (!lockAcquired) {
                         return {
                              success: false,
                              error: 'Could not acquire lock for profile update',
                         };
                    }
               }

               // Retry loop for optimistic locking conflicts
               while (retries < this.MAX_RETRIES) {
                    try {
                         // Fetch current user with version
                         const user = await User.findById(userId);
                         if (!user) {
                              return {
                                   success: false,
                                   error: 'User not found',
                              };
                         }

                         if (!user.styleProfile) {
                              return {
                                   success: false,
                                   error: 'User has no style profile',
                              };
                         }

                         const currentVersion = user.__v || 0;

                         // Build update operations
                         const updateOps: any = {};
                         for (const update of updates) {
                              const operation = update.operation || '$set';
                              if (!updateOps[operation]) {
                                   updateOps[operation] = {};
                              }
                              updateOps[operation][update.field] = update.value;
                         }

                         // Add version increment
                         if (!updateOps.$inc) {
                              updateOps.$inc = {};
                         }
                         updateOps.$inc.__v = 1;

                         // Update lastUpdated timestamp
                         if (!updateOps.$set) {
                              updateOps.$set = {};
                         }
                         updateOps.$set['styleProfile.lastUpdated'] = new Date();

                         // Perform atomic update with version check (optimistic locking)
                         const updatedUser = await User.findOneAndUpdate(
                              { _id: userId, __v: currentVersion },
                              updateOps,
                              { new: true, runValidators: true }
                         );

                         if (!updatedUser) {
                              // Version mismatch - concurrent update detected
                              retries++;
                              console.log(
                                   `[AtomicUpdate] Concurrent update conflict for user ${userId}, retry ${retries}/${this.MAX_RETRIES}`
                              );

                              if (retries < this.MAX_RETRIES) {
                                   await this.delay(retries);
                                   continue; // Retry
                              } else {
                                   return {
                                        success: false,
                                        error: 'Concurrent update conflict - max retries exceeded',
                                        retries,
                                   };
                              }
                         }

                         // Success - invalidate cache
                         await cacheService.invalidateStyleProfile(userId);
                         await cacheService.invalidateEvolutionScore(userId);

                         console.log(
                              `[AtomicUpdate] Successfully updated profile for user ${userId} (retries: ${retries})`
                         );

                         return {
                              success: true,
                              user: updatedUser,
                              retries,
                         };
                    } catch (error: any) {
                         // Handle validation errors or other database errors
                         if (error.name === 'ValidationError') {
                              return {
                                   success: false,
                                   error: `Validation error: ${error.message}`,
                                   retries,
                              };
                         }

                         // For other errors, retry
                         retries++;
                         if (retries < this.MAX_RETRIES) {
                              console.error(
                                   `[AtomicUpdate] Error updating profile, retry ${retries}/${this.MAX_RETRIES}:`,
                                   error.message
                              );
                              await this.delay(retries);
                         } else {
                              throw error;
                         }
                    }
               }

               return {
                    success: false,
                    error: 'Max retries exceeded',
                    retries,
               };
          } catch (error: any) {
               console.error(`[AtomicUpdate] Fatal error updating profile:`, error.message);
               return {
                    success: false,
                    error: error.message,
                    retries,
               };
          } finally {
               // Always release lock
               if (lockAcquired) {
                    await this.releaseLock(userId);
               }
          }
     }

     /**
      * Update a single field atomically
      * Convenience method for simple updates
      */
     async updateField(
          userId: string,
          field: string,
          value: any,
          useDistributedLock: boolean = true
     ): Promise<AtomicUpdateResult> {
          return this.updateStyleProfileAtomic(
               userId,
               [{ field, value, operation: '$set' }],
               useDistributedLock
          );
     }

     /**
      * Increment a numeric field atomically
      * Convenience method for counter updates
      */
     async incrementField(
          userId: string,
          field: string,
          increment: number = 1,
          useDistributedLock: boolean = true
     ): Promise<AtomicUpdateResult> {
          return this.updateStyleProfileAtomic(
               userId,
               [{ field, value: increment, operation: '$inc' }],
               useDistributedLock
          );
     }

     /**
      * Close Redis connection
      */
     async close(): Promise<void> {
          try {
               await this.redis.quit();
               console.log(`[AtomicUpdate] Redis connection closed`);
          } catch (error: any) {
               console.error(`[AtomicUpdate] Error closing Redis connection:`, error.message);
          }
     }
}

// Export singleton instance
export const atomicProfileUpdateService = new AtomicProfileUpdateService();
