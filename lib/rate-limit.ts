/**
 * Rate limiting module for API routes
 * 
 * Implements in-memory rate limiting to protect API endpoints from abuse.
 * Tracks requests per IP address with configurable time windows and limits.
 */

export interface RateLimitConfig {
     interval: number  // Time window in milliseconds
     uniqueTokenPerInterval: number  // Max unique tokens (not used in simple implementation)
     limit: number  // Max requests per interval
}

export interface RateLimitResult {
     success: boolean
     limit: number
     remaining: number
     reset: number  // Timestamp when the limit resets
}

interface RateLimitEntry {
     count: number
     resetTime: number
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Creates a rate limiter function with the specified configuration.
 * 
 * @param config - Rate limit configuration
 * @returns Function that checks rate limits for a given identifier
 */
export function rateLimit(config: RateLimitConfig) {
     return async (identifier: string): Promise<RateLimitResult> => {
          const now = Date.now()
          const entry = rateLimitStore.get(identifier)

          // If no entry exists or the window has expired, create a new entry
          if (!entry || now >= entry.resetTime) {
               const resetTime = now + config.interval
               rateLimitStore.set(identifier, {
                    count: 1,
                    resetTime,
               })

               return {
                    success: true,
                    limit: config.limit,
                    remaining: config.limit - 1,
                    reset: resetTime,
               }
          }

          // Check if limit has been exceeded
          if (entry.count >= config.limit) {
               return {
                    success: false,
                    limit: config.limit,
                    remaining: 0,
                    reset: entry.resetTime,
               }
          }

          // Increment the counter
          entry.count++
          rateLimitStore.set(identifier, entry)

          return {
               success: true,
               limit: config.limit,
               remaining: config.limit - entry.count,
               reset: entry.resetTime,
          }
     }
}

/**
 * Cleans up expired entries from the rate limit store.
 * Should be called periodically to prevent memory leaks.
 */
export function cleanupExpiredEntries(): void {
     const now = Date.now()
     for (const [key, entry] of rateLimitStore.entries()) {
          if (now >= entry.resetTime) {
               rateLimitStore.delete(key)
          }
     }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
