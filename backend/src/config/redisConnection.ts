/**
 * Redis Connection Utility
 * Centralized Redis URL parsing to avoid duplication and ensure consistency
 */

export interface RedisConnectionConfig {
     host: string;
     port: number;
     password?: string;
     username?: string;
     db?: number;
}

/**
 * Parse Redis URL into connection configuration
 * Handles various Redis URL formats:
 * - redis://localhost:6379
 * - redis://user:password@host:port
 * - redis://user:password@host:port/database
 * 
 * @param url - Redis connection URL
 * @returns Parsed connection configuration
 */
export function parseRedisUrl(url: string): RedisConnectionConfig {
     try {
          const urlObj = new URL(url);

          const config: RedisConnectionConfig = {
               host: urlObj.hostname,
               port: parseInt(urlObj.port || '6379', 10),
          };

          // Add authentication if present
          if (urlObj.password) {
               config.password = urlObj.password;
          }

          if (urlObj.username && urlObj.username !== 'default') {
               config.username = urlObj.username;
          }

          // Parse database number from pathname (e.g., /1 for database 1)
          if (urlObj.pathname && urlObj.pathname.length > 1) {
               const dbNum = parseInt(urlObj.pathname.slice(1), 10);
               if (!isNaN(dbNum)) {
                    config.db = dbNum;
               }
          }

          return config;
     } catch (error) {
          console.error('Failed to parse REDIS_URL, using defaults:', error);
          return {
               host: 'localhost',
               port: 6379,
          };
     }
}

/**
 * Get Redis connection configuration from environment
 * Falls back to localhost:6379 if REDIS_URL is not set
 */
export function getRedisConnection(): RedisConnectionConfig {
     const redisUrl = process.env.REDIS_URL;

     if (!redisUrl) {
          console.warn('REDIS_URL not set, using default localhost:6379');
          return {
               host: 'localhost',
               port: 6379,
          };
     }

     return parseRedisUrl(redisUrl);
}
