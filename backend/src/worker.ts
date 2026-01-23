// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { validateEnvironmentVariables } from './config/validateEnv';
import { validateRedisConnection } from './config/redis';
import { connectDatabase } from './config/database';
import { learningWorker } from './workers/learningWorker';
import { startHealthServer } from './workers/healthServer';
import { LoggerService, LogLevel } from './services/LoggerService';

const logger = LoggerService.getInstance();

// Start worker with validation sequence
const startWorker = async () => {
     try {
          // Step 1: Validate environment variables (fail fast if missing)
          validateEnvironmentVariables();

          // Step 2: Validate Redis connection (fail fast if unavailable)
          await validateRedisConnection();

          // Step 3: Connect to database (with retry logic)
          await connectDatabase();

          logger.log(LogLevel.INFO, 'Worker validations passed');
          logger.log(LogLevel.INFO, 'Learning worker is now processing jobs');

          // Step 4: Start health check server
          startHealthServer(learningWorker);
     } catch (error) {
          logger.log(LogLevel.ERROR, 'Failed to start worker', {
               error: error instanceof Error ? error.message : String(error)
          });
          process.exit(1);
     }
};

startWorker();
