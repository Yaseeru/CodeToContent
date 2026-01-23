// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDatabase, checkDatabaseHealth } from './config/database';
import { closeQueue } from './config/queue';
import { validateEnvironmentVariables } from './config/validateEnv';
import { validateRedisConnection, checkRedisHealth } from './config/redis';
import { ServiceManager } from './services/ServiceManager';
import { LoggerService, LogLevel } from './services/LoggerService';
import authRoutes from './routes/auth';
import repositoryRoutes from './routes/repositories';
import contentRoutes from './routes/content';
import queueRoutes from './routes/queue';
import profileRoutes from './routes/profile';
import monitoringRoutes from './routes/monitoring';
import snapshotsRoutes from './routes/snapshots';

const app = express();
const PORT = process.env.PORT || 3001;
const logger = LoggerService.getInstance();

// Middleware
app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true
}));
app.use(express.json());

// Serve uploaded snapshot images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
// Requirements: 2.7, 2.8 - Include Redis and database connection status
app.get('/health', async (req, res) => {
     try {
          // Check Redis connection status
          const redisHealth = await checkRedisHealth();

          // Check database connection status
          const databaseHealth = await checkDatabaseHealth();

          // Determine overall status
          const isHealthy = redisHealth.connected && databaseHealth.connected;
          const status = isHealthy ? 'healthy' : 'degraded';

          // Return appropriate HTTP status code
          const statusCode = isHealthy ? 200 : 503;

          res.status(statusCode).json({
               status,
               message: isHealthy
                    ? 'CodeToContent API is running'
                    : 'CodeToContent API is running with degraded services',
               services: {
                    redis: {
                         connected: redisHealth.connected,
                         latencyMs: redisHealth.latencyMs,
                         error: redisHealth.error
                    },
                    database: {
                         connected: databaseHealth.connected,
                         database: databaseHealth.database,
                         error: databaseHealth.error
                    }
               },
               timestamp: new Date().toISOString()
          });
     } catch (error: any) {
          res.status(503).json({
               status: 'unhealthy',
               message: 'Health check failed',
               error: error.message,
               timestamp: new Date().toISOString()
          });
     }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/snapshots', snapshotsRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
     const frontendPath = path.join(__dirname, '../../frontend/dist');
     app.use(express.static(frontendPath));

     // Serve index.html for all other routes (SPA fallback)
     app.get('*', (req, res) => {
          res.sendFile(path.join(frontendPath, 'index.html'));
     });
}

// Start server
const startServer = async () => {
     try {
          // Critical Fixes - Startup Validation Sequence
          // Requirements: 3.6, 2.1, 7.6

          // 1. Validate environment variables first (fail fast if config is wrong)
          validateEnvironmentVariables();

          // 2. Validate Redis connection second (required for rate limiting and worker)
          await validateRedisConnection();

          // 3. Connect to database third (with retry logic)
          await connectDatabase();

          // 4. Initialize ServiceManager (for VisualSnapshotService with Puppeteer)
          const serviceManager = ServiceManager.getInstance();
          await serviceManager.initialize();

          // 5. Only start server after all validations pass
          app.listen(PORT, () => {
               logger.log(LogLevel.INFO, `Backend server running on port ${PORT}`);
          });
     } catch (error) {
          console.error('Failed to start server:', error);
          process.exit(1);
     }
};

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
     startServer();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
     logger.log(LogLevel.INFO, 'SIGTERM received, closing server gracefully');
     const serviceManager = ServiceManager.getInstance();
     await serviceManager.cleanup();
     await closeQueue();
     process.exit(0);
});

process.on('SIGINT', async () => {
     logger.log(LogLevel.INFO, 'SIGINT received, closing server gracefully');
     const serviceManager = ServiceManager.getInstance();
     await serviceManager.cleanup();
     await closeQueue();
     process.exit(0);
});

export default app;
