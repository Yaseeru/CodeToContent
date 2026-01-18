/**
 * Rate Limiting Middleware
 * Implements distributed rate limiting using Redis
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { logger, LogLevel } from '../services/LoggerService';
import { RATE_LIMIT_CONFIG } from '../config/constants';

// Create Redis client for rate limiting
// Use the same URL parsing as other Redis connections
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = new Redis(redisUrl, {
     maxRetriesPerRequest: null,
     enableReadyCheck: true,
});

/**
 * Default rate limiter: 100 requests per hour
 * Applied to most API endpoints
 * Requirements: 6.2
 */
export const defaultRateLimiter = rateLimit({
     store: new RedisStore({
          // Use sendCommand function for ioredis compatibility
          sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
          prefix: 'rl:default:',
     }),
     windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW_MS,
     max: parseInt(process.env.RATE_LIMIT_DEFAULT || String(RATE_LIMIT_CONFIG.DEFAULT_MAX_REQUESTS), 10),
     message: 'Too many requests, please try again later',
     standardHeaders: true, // Return rate limit info in RateLimit-* headers
     legacyHeaders: false, // Disable X-RateLimit-* headers

     // Use user ID if authenticated, otherwise fall back to IP
     // Requirements: 6.6
     keyGenerator: (req: Request): string => {
          return req.user?.userId || req.ip || 'unknown';
     },

     // Custom handler for rate limit exceeded
     // Requirements: 6.4, 6.5, 6.8
     handler: (req: Request, res: Response): void => {
          const userId = req.user?.userId;
          const endpoint = req.path;

          // Log rate limit violation
          // Requirements: 6.8
          logger.log(LogLevel.WARN, 'Rate limit exceeded', {
               userId: userId || 'unauthenticated',
               ip: req.ip,
               endpoint,
               limit: 'default (100/hour)',
          });

          // Return 429 with retry-after header
          // Requirements: 6.4, 6.5
          res.status(429).json({
               error: 'Too many requests',
               message: 'You have exceeded the rate limit. Please try again later.',
               retryAfter: res.getHeader('Retry-After'),
          });
     },

     // Skip rate limiting for health check endpoints
     // Requirements: 6.9
     skip: (req: Request): boolean => {
          return req.path === '/health' || req.path === '/api/health';
     },
});

/**
 * Strict rate limiter: 10 requests per hour
 * Applied to expensive operations (content generation, repository analysis)
 * Requirements: 6.3
 */
export const strictRateLimiter = rateLimit({
     store: new RedisStore({
          // Use sendCommand function for ioredis compatibility
          sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
          prefix: 'rl:strict:',
     }),
     windowMs: RATE_LIMIT_CONFIG.DEFAULT_WINDOW_MS,
     max: parseInt(process.env.RATE_LIMIT_STRICT || String(RATE_LIMIT_CONFIG.STRICT_MAX_REQUESTS), 10),
     message: 'Too many expensive requests, please try again later',
     standardHeaders: true, // Return rate limit info in RateLimit-* headers
     legacyHeaders: false, // Disable X-RateLimit-* headers

     // Use user ID if authenticated, otherwise fall back to IP
     // Requirements: 6.6
     keyGenerator: (req: Request): string => {
          return req.user?.userId || req.ip || 'unknown';
     },

     // Custom handler for rate limit exceeded
     // Requirements: 6.4, 6.5, 6.8
     handler: (req: Request, res: Response): void => {
          const userId = req.user?.userId;
          const endpoint = req.path;

          // Log rate limit violation
          // Requirements: 6.8
          logger.log(LogLevel.WARN, 'Strict rate limit exceeded', {
               userId: userId || 'unauthenticated',
               ip: req.ip,
               endpoint,
               limit: 'strict (10/hour)',
          });

          // Return 429 with retry-after header
          // Requirements: 6.4, 6.5
          res.status(429).json({
               error: 'Too many requests',
               message: 'You have exceeded the rate limit for this operation. Please try again later.',
               retryAfter: res.getHeader('Retry-After'),
          });
     },

     // Skip rate limiting for health check endpoints
     // Requirements: 6.9
     skip: (req: Request): boolean => {
          return req.path === '/health' || req.path === '/api/health';
     },
});

/**
 * Graceful shutdown helper
 * Closes Redis connection when application shuts down
 */
export async function closeRateLimiterRedis(): Promise<void> {
     try {
          await redisClient.quit();
          logger.log(LogLevel.INFO, 'Rate limiter Redis connection closed');
     } catch (error) {
          logger.log(LogLevel.ERROR, 'Error closing rate limiter Redis connection', { error });
     }
}
