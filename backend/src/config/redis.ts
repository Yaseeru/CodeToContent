/**
 * Redis Configuration and Validation
 * Provides Redis connection validation and health check functionality
 */

import Redis from 'ioredis';
import { logger, LogLevel } from '../services/LoggerService';

/**
 * Validates Redis connection at startup
 * Exits with code 1 if connection fails
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export async function validateRedisConnection(): Promise<void> {
     const redisUrl = process.env.REDIS_URL;

     if (!redisUrl) {
          logger.log(LogLevel.ERROR, '✗ REDIS_URL environment variable is not set');
          process.exit(1);
     }

     let client: Redis | null = null;

     try {
          // Create Redis client
          client = new Redis(redisUrl, {
               maxRetriesPerRequest: null,
               enableReadyCheck: true,
               lazyConnect: true, // Don't connect automatically
          });

          // Connect to Redis
          await client.connect();

          // Test connection with PING command
          const pingResponse = await client.ping();

          if (pingResponse !== 'PONG') {
               throw new Error(`Unexpected PING response: ${pingResponse}`);
          }

          // Disconnect test client
          await client.quit();

          logger.log(LogLevel.INFO, '✓ Redis connection validated successfully', {
               url: redisUrl.replace(/:[^:]*@/, ':****@') // Redact password
          });

     } catch (error: any) {
          const redactedUrl = redisUrl.replace(/:[^:]*@/, ':****@');

          logger.log(LogLevel.ERROR, '✗ Redis connection failed', {
               error: error.message,
               url: redactedUrl,
               troubleshooting: [
                    '1. Ensure Redis is running: redis-cli ping',
                    '2. Check REDIS_URL in .env file',
                    '3. Verify network connectivity to Redis server',
                    '4. Check Redis logs for errors',
                    '5. Verify Redis authentication credentials if required'
               ]
          });

          // Clean up client if it exists
          if (client && client.status !== 'end') {
               try {
                    await client.quit();
               } catch (quitError) {
                    // Ignore quit errors during cleanup
               }
          }

          process.exit(1);
     }
}

/**
 * Health check helper function for runtime monitoring
 * Returns Redis connection status without exiting
 * Requirements: 2.7
 */
export async function checkRedisHealth(): Promise<{ connected: boolean; error?: string; latencyMs?: number }> {
     const redisUrl = process.env.REDIS_URL;

     if (!redisUrl) {
          return {
               connected: false,
               error: 'REDIS_URL environment variable is not set'
          };
     }

     let client: Redis | null = null;
     const startTime = Date.now();

     try {
          // Create Redis client
          client = new Redis(redisUrl, {
               maxRetriesPerRequest: null,
               enableReadyCheck: true,
               lazyConnect: true,
          });

          // Connect to Redis
          await client.connect();

          // Test connection with PING command
          const pingResponse = await client.ping();

          if (pingResponse !== 'PONG') {
               throw new Error(`Unexpected PING response: ${pingResponse}`);
          }

          const latencyMs = Date.now() - startTime;

          // Disconnect test client
          await client.quit();

          return {
               connected: true,
               latencyMs
          };

     } catch (error: any) {
          // Clean up client if it exists
          if (client && client.status !== 'end') {
               try {
                    await client.quit();
               } catch (quitError) {
                    // Ignore quit errors during cleanup
               }
          }

          return {
               connected: false,
               error: error.message
          };
     }
}
