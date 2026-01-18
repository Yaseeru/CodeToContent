// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { validateEnvironmentVariables } from './config/validateEnv';
import { validateRedisConnection } from './config/redis';
import { connectDatabase } from './config/database';
import { learningWorker } from './workers/learningWorker';
import { startHealthServer } from './workers/healthServer';

// Start worker with validation sequence
// Requirements: 3.7, 2.6
const startWorker = async () => {
     try {
          // Step 1: Validate environment variables (fail fast if missing)
          validateEnvironmentVariables();

          // Step 2: Validate Redis connection (fail fast if unavailable)
          await validateRedisConnection();

          // Step 3: Connect to database (with retry logic)
          await connectDatabase();

          console.log('[Worker] All validations passed');
          console.log('[Worker] Learning worker is now processing jobs...');

          // Step 4: Start health check server (Requirement 5.1)
          startHealthServer(learningWorker);
     } catch (error) {
          console.error('[Worker] Failed to start worker:', error);
          process.exit(1);
     }
};

startWorker();
