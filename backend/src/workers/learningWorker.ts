import { Worker, Job } from 'bullmq';
import { LearningJobData, deadLetterQueue } from '../config/queue';
import { LearningJob } from '../models/LearningJob';

// Redis connection for worker
const redisConnection = {
     host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
     port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379', 10),
     maxRetriesPerRequest: null,
};

// Concurrency configuration
const CONCURRENCY = parseInt(process.env.LEARNING_QUEUE_CONCURRENCY || '5', 10);

// Process learning job function
async function processLearningJob(job: Job<LearningJobData>): Promise<void> {
     const { userId, contentId } = job.data;

     console.log(`[Worker] Processing learning job ${job.id} for user ${userId}, content ${contentId}`);

     try {
          // Update job status in database
          await LearningJob.findOneAndUpdate(
               { userId, contentId },
               {
                    status: 'processing',
                    processingStarted: new Date(),
                    attempts: job.attemptsMade + 1,
               },
               { upsert: true }
          );

          // Update progress
          await job.updateProgress(10);

          // TODO: This will be implemented in task 8 (Feedback Learning Engine)
          // For now, we'll just simulate the processing
          console.log(`[Worker] Learning job processing would happen here for ${userId}`);

          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update progress
          await job.updateProgress(50);

          // More processing simulation
          await new Promise(resolve => setTimeout(resolve, 100));

          // Update progress
          await job.updateProgress(100);

          // Mark as completed in database
          await LearningJob.findOneAndUpdate(
               { userId, contentId },
               {
                    status: 'completed',
                    processingCompleted: new Date(),
                    error: undefined,
               }
          );

          console.log(`[Worker] Successfully processed learning job ${job.id}`);
     } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Worker] Error processing learning job ${job.id}:`, errorMessage);

          // Update job status in database
          await LearningJob.findOneAndUpdate(
               { userId, contentId },
               {
                    status: 'failed',
                    error: errorMessage,
                    attempts: job.attemptsMade + 1,
               }
          );

          // If this is the last attempt, move to dead letter queue
          if (job.attemptsMade >= 2) {
               console.error(`[Worker] Job ${job.id} failed after 3 attempts, moving to DLQ`);
               await deadLetterQueue.add('failed-learning', job.data, {
                    jobId: `dlq-${job.id}`,
               });
          }

          throw error; // Re-throw to trigger retry
     }
}

// Create the worker with concurrency support
export const learningWorker = new Worker<LearningJobData>(
     'learning-jobs',
     processLearningJob,
     {
          connection: redisConnection,
          concurrency: CONCURRENCY,
          limiter: {
               max: 10, // Max 10 jobs
               duration: 1000, // Per second
          },
     }
);

// Worker event handlers
learningWorker.on('completed', (job) => {
     console.log(`[Worker] Job ${job.id} completed`);
});

learningWorker.on('failed', (job, err) => {
     console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

learningWorker.on('error', (err) => {
     console.error('[Worker] Worker error:', err);
});

learningWorker.on('stalled', (jobId) => {
     console.warn(`[Worker] Job ${jobId} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
     console.log('[Worker] SIGTERM received, closing worker...');
     await learningWorker.close();
     process.exit(0);
});

process.on('SIGINT', async () => {
     console.log('[Worker] SIGINT received, closing worker...');
     await learningWorker.close();
     process.exit(0);
});

console.log(`[Worker] Learning worker started with concurrency: ${CONCURRENCY}`);

export default learningWorker;
