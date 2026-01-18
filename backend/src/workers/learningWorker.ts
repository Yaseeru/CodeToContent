import { Worker, Job } from 'bullmq';
import { LearningJobData, deadLetterQueue } from '../config/queue';
import { LearningJob } from '../models/LearningJob';
import { FeedbackLearningEngine } from '../services/FeedbackLearningEngine';
import { logger, LogLevel } from '../services/LoggerService';
import { getRedisConnection } from '../config/redisConnection';

// Redis connection for worker
const redisConnection = {
     ...getRedisConnection(),
     maxRetriesPerRequest: null,
};

// Concurrency configuration
const CONCURRENCY = parseInt(process.env.LEARNING_QUEUE_CONCURRENCY || '5', 10);

// Initialize FeedbackLearningEngine
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const feedbackEngine = new FeedbackLearningEngine(geminiApiKey);

// Process learning job function
async function processLearningJob(job: Job<LearningJobData>): Promise<void> {
     const { userId, contentId } = job.data;
     const startTime = Date.now();

     // Log job start
     logger.log(LogLevel.INFO, `Processing learning job ${job.id}`, {
          jobId: job.id?.toString(),
          userId,
          contentId,
          attemptsMade: job.attemptsMade,
     });

     try {
          // Find the job in database to get the job ID
          const dbJob = await LearningJob.findOne({ userId, contentId, status: 'pending' });

          if (!dbJob) {
               throw new Error(`Learning job not found in database for user ${userId}, content ${contentId}`);
          }

          // Call FeedbackLearningEngine.processLearningJob with the job ID
          await feedbackEngine.processLearningJob(dbJob._id.toString());

          // Log successful completion
          const processingTime = Date.now() - startTime;
          logger.log(LogLevel.INFO, `Learning job ${job.id} completed successfully`, {
               jobId: job.id?.toString(),
               userId,
               contentId,
               processingTimeMs: processingTime,
               attemptsMade: job.attemptsMade,
          });

          // Track processing time metric
          logger.trackLearningJobProcessingTime(processingTime);

     } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;

          // Log job failure
          logger.log(LogLevel.ERROR, `Learning job ${job.id} failed`, {
               jobId: job.id?.toString(),
               userId,
               contentId,
               error: errorMessage,
               attemptsMade: job.attemptsMade,
               maxAttempts: 3,
          });

          // Log detailed failure for monitoring
          logger.logLearningJobFailure({
               jobId: job.id?.toString() || 'unknown',
               userId,
               contentId,
               attemptNumber: job.attemptsMade + 1,
               error: errorMessage,
               stackTrace: errorStack,
               context: {
                    priority: job.data.priority,
                    timestamp: new Date(),
               },
               timestamp: new Date(),
          });

          // If this is the last attempt, move to dead letter queue
          if (job.attemptsMade >= 2) {
               logger.log(LogLevel.ERROR, `Job ${job.id} failed after 3 attempts, moving to DLQ`, {
                    jobId: job.id?.toString(),
                    userId,
                    contentId,
               });

               await deadLetterQueue.add('failed-learning', job.data, {
                    jobId: `dlq-${job.id}`,
               });
          }

          throw error; // Re-throw to trigger Bull's retry mechanism
     }
}

// Create the worker with concurrency support and retry configuration
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

// Worker event handlers with comprehensive logging
learningWorker.on('completed', (job) => {
     logger.log(LogLevel.INFO, `Job ${job.id} completed`, {
          jobId: job.id?.toString(),
          userId: job.data.userId,
          contentId: job.data.contentId,
          returnValue: job.returnvalue,
     });
});

learningWorker.on('failed', (job, err) => {
     if (job) {
          logger.log(LogLevel.ERROR, `Job ${job.id} failed`, {
               jobId: job.id?.toString(),
               userId: job.data.userId,
               contentId: job.data.contentId,
               error: err.message,
               attemptsMade: job.attemptsMade,
          });
     } else {
          logger.log(LogLevel.ERROR, 'Job failed with no job data', {
               error: err.message,
          });
     }
});

learningWorker.on('error', (err) => {
     logger.log(LogLevel.ERROR, 'Worker error occurred', {
          error: err.message,
          stack: err.stack,
     });
});

learningWorker.on('stalled', (jobId) => {
     logger.log(LogLevel.WARN, `Job ${jobId} stalled`, {
          jobId,
     });
});

learningWorker.on('active', (job) => {
     logger.log(LogLevel.INFO, `Job ${job.id} started processing`, {
          jobId: job.id?.toString(),
          userId: job.data.userId,
          contentId: job.data.contentId,
          attemptsMade: job.attemptsMade,
     });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
     logger.log(LogLevel.INFO, 'SIGTERM received, closing worker gracefully');
     await learningWorker.close();
     logger.log(LogLevel.INFO, 'Worker closed successfully');
     process.exit(0);
});

process.on('SIGINT', async () => {
     logger.log(LogLevel.INFO, 'SIGINT received, closing worker gracefully');
     await learningWorker.close();
     logger.log(LogLevel.INFO, 'Worker closed successfully');
     process.exit(0);
});

logger.log(LogLevel.INFO, `Learning worker started with concurrency: ${CONCURRENCY}`);

export default learningWorker;
