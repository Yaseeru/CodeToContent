/**
 * Worker Health Check Server
 * Provides a separate HTTP endpoint for monitoring worker health
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 */

import express, { Request, Response } from 'express';
import { Worker } from 'bullmq';
import { checkRedisHealth } from '../config/redis';
import { checkDatabaseHealth } from '../config/database';
import { logger, LogLevel } from '../services/LoggerService';

interface HealthStatus {
     status: 'healthy' | 'unhealthy';
     worker: {
          running: boolean;
          name: string;
     };
     redis: {
          connected: boolean;
          error?: string;
          latencyMs?: number;
     };
     database: {
          connected: boolean;
          error?: string;
          database?: string;
     };
     timestamp: string;
}

/**
 * Start health check server for worker process
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
 */
export function startHealthServer(worker: Worker): void {
     const app = express();
     const port = parseInt(process.env.WORKER_HEALTH_PORT || '3002', 10);

     /**
      * Health check endpoint
      * Requirements: 5.2, 5.3, 5.4, 5.7, 5.8
      */
     app.get('/health', async (req: Request, res: Response) => {
          try {
               // Check Redis health (Requirement 5.7)
               const redisHealth = await checkRedisHealth();

               // Check Database health (Requirement 5.8)
               const databaseHealth = await checkDatabaseHealth();

               // Check worker status
               const workerRunning = worker.isRunning();

               // Determine overall health status
               const isHealthy = redisHealth.connected && databaseHealth.connected && workerRunning;

               const healthStatus: HealthStatus = {
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    worker: {
                         running: workerRunning,
                         name: worker.name,
                    },
                    redis: redisHealth,
                    database: databaseHealth,
                    timestamp: new Date().toISOString(),
               };

               // Return HTTP 200 when healthy, 503 when unhealthy (Requirements 5.2, 5.3)
               const statusCode = isHealthy ? 200 : 503;
               res.status(statusCode).json(healthStatus);

          } catch (error: any) {
               // Handle unexpected errors
               logger.log(LogLevel.ERROR, 'Health check endpoint error', {
                    error: error.message,
                    stack: error.stack,
               });

               res.status(503).json({
                    status: 'unhealthy',
                    error: 'Health check failed',
                    timestamp: new Date().toISOString(),
               });
          }
     });

     // Start the health check server (Requirement 5.1, 5.5, 5.6)
     app.listen(port, () => {
          // Log health check endpoint URL at startup (Requirement 5.9)
          logger.log(LogLevel.INFO, `✓ Worker health check available at http://localhost:${port}/health`, {
               port,
               endpoint: '/health',
          });
     });
}
