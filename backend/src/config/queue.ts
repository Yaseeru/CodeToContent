import { Queue, QueueEvents, Job } from 'bullmq';

// Redis connection configuration
const redisConnection = {
     host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
     port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379', 10),
     maxRetriesPerRequest: null,
};

// Learning job data interface
export interface LearningJobData {
     userId: string;
     contentId: string;
     priority?: number;
}

// Create the learning queue with priority support
export const learningQueue = new Queue<LearningJobData>('learning-jobs', {
     connection: redisConnection,
     defaultJobOptions: {
          attempts: 3,
          backoff: {
               type: 'exponential',
               delay: 1000, // Start with 1 second, then 2s, 4s
          },
          removeOnComplete: {
               age: 24 * 3600, // Keep completed jobs for 24 hours
               count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: false, // Keep failed jobs for debugging
     },
});

// Dead letter queue for persistent failures
export const deadLetterQueue = new Queue<LearningJobData>('learning-jobs-dlq', {
     connection: redisConnection,
});

// Queue events for monitoring
export const queueEvents = new QueueEvents('learning-jobs', {
     connection: redisConnection,
});

// Job status tracking
queueEvents.on('completed', ({ jobId }) => {
     console.log(`[Queue] Job ${jobId} completed successfully`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
     console.error(`[Queue] Job ${jobId} failed: ${failedReason}`);
});

queueEvents.on('progress', ({ jobId, data }) => {
     console.log(`[Queue] Job ${jobId} progress: ${JSON.stringify(data)}`);
});

// Helper function to add a job to the queue
export async function queueLearningJob(
     userId: string,
     contentId: string,
     priority: number = 0
): Promise<Job<LearningJobData>> {
     const job = await learningQueue.add(
          'process-learning',
          { userId, contentId, priority },
          {
               priority, // Higher priority = processed sooner
               jobId: `${userId}-${contentId}-${Date.now()}`, // Unique job ID
          }
     );

     console.log(`[Queue] Queued learning job ${job.id} for user ${userId}`);
     return job;
}

// Helper function to get job status
export async function getJobStatus(jobId: string) {
     const job = await learningQueue.getJob(jobId);
     if (!job) {
          return null;
     }

     const state = await job.getState();
     return {
          id: job.id,
          state,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          data: job.data,
          failedReason: job.failedReason,
          finishedOn: job.finishedOn,
          processedOn: job.processedOn,
     };
}

// Helper function to get queue metrics
export async function getQueueMetrics() {
     const [waiting, active, completed, failed, delayed] = await Promise.all([
          learningQueue.getWaitingCount(),
          learningQueue.getActiveCount(),
          learningQueue.getCompletedCount(),
          learningQueue.getFailedCount(),
          learningQueue.getDelayedCount(),
     ]);

     return {
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + delayed,
     };
}

// Graceful shutdown
export async function closeQueue() {
     await learningQueue.close();
     await deadLetterQueue.close();
     await queueEvents.close();
}
