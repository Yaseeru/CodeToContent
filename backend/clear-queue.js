/**
 * Script to clear all jobs from the learning queue
 * Run this when you have stale jobs causing issues
 */

const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Parse Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const url = new URL(redisUrl);

const connection = new Redis({
     host: url.hostname,
     port: parseInt(url.port) || 6379,
     password: url.password || undefined,
     maxRetriesPerRequest: null,
     enableReadyCheck: false,
});

const learningQueue = new Queue('learning-jobs', { connection });
const deadLetterQueue = new Queue('dead-letter-queue', { connection });

async function clearQueues() {
     try {
          console.log('Clearing learning queue...');

          // Clear all jobs from learning queue
          await learningQueue.obliterate({ force: true });
          console.log('✓ Learning queue cleared');

          // Clear dead letter queue
          await deadLetterQueue.obliterate({ force: true });
          console.log('✓ Dead letter queue cleared');

          // Get counts to verify
          const learningCount = await learningQueue.count();
          const dlqCount = await deadLetterQueue.count();

          console.log(`\nFinal counts:`);
          console.log(`  Learning queue: ${learningCount} jobs`);
          console.log(`  Dead letter queue: ${dlqCount} jobs`);

          console.log('\n✓ All queues cleared successfully');

     } catch (error) {
          console.error('Error clearing queues:', error);
          process.exit(1);
     } finally {
          await learningQueue.close();
          await deadLetterQueue.close();
          await connection.quit();
          process.exit(0);
     }
}

clearQueues();
