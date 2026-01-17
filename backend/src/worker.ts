// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from './config/database';
import './workers/learningWorker';

// Start worker
const startWorker = async () => {
     try {
          await connectDatabase();
          console.log('[Worker] Database connected');
          console.log('[Worker] Learning worker is now processing jobs...');
     } catch (error) {
          console.error('[Worker] Failed to start worker:', error);
          process.exit(1);
     }
};

startWorker();
