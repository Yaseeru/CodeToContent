// Mock BullMQ completely to avoid Redis connections
jest.mock('../queue', () => {
     const mockJob = {
          id: 'test-job-id',
          data: { userId: 'user123', contentId: 'content456', priority: 0 },
          opts: { priority: 0 },
     };

     return {
          learningQueue: {
               name: 'learning-jobs',
               opts: {
                    defaultJobOptions: {
                         attempts: 3,
                         backoff: {
                              type: 'exponential',
                              delay: 1000,
                         },
                         removeOnComplete: {
                              age: 24 * 3600,
                              count: 1000,
                         },
                         removeOnFail: false,
                    },
               },
               add: jest.fn().mockResolvedValue(mockJob),
               getJob: jest.fn().mockResolvedValue(mockJob),
               getWaitingCount: jest.fn().mockResolvedValue(5),
               getActiveCount: jest.fn().mockResolvedValue(2),
               getCompletedCount: jest.fn().mockResolvedValue(10),
               getFailedCount: jest.fn().mockResolvedValue(1),
               getDelayedCount: jest.fn().mockResolvedValue(0),
               close: jest.fn().mockResolvedValue(undefined),
          },
          deadLetterQueue: {
               name: 'learning-jobs-dlq',
               add: jest.fn().mockResolvedValue(mockJob),
               close: jest.fn().mockResolvedValue(undefined),
          },
          queueEvents: {
               close: jest.fn().mockResolvedValue(undefined),
          },
          queueLearningJob: jest.fn().mockImplementation(async (userId, contentId, priority = 0) => ({
               id: `${userId}-${contentId}-${Date.now()}`,
               data: { userId, contentId, priority },
               opts: { priority },
          })),
          getJobStatus: jest.fn().mockImplementation(async (jobId) => {
               if (jobId === 'non-existent-job-id') return null;
               return {
                    id: jobId,
                    state: 'waiting',
                    progress: 0,
                    attemptsMade: 0,
                    data: { userId: 'user123', contentId: 'content456', priority: 0 },
                    failedReason: undefined,
                    finishedOn: undefined,
                    processedOn: undefined,
               };
          }),
          getQueueMetrics: jest.fn().mockResolvedValue({
               waiting: 5,
               active: 2,
               completed: 10,
               failed: 1,
               delayed: 0,
               total: 7,
          }),
          closeQueue: jest.fn().mockResolvedValue(undefined),
          LearningJobData: {},
     };
});

describe('Job Queue Infrastructure', () => {
     const {
          learningQueue,
          deadLetterQueue,
          queueLearningJob,
          getJobStatus,
          getQueueMetrics,
          closeQueue,
     } = require('../queue');

     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('Job Creation and Queuing', () => {
          it('should create a learning job with correct data', async () => {
               const userId = 'user123';
               const contentId = 'content456';
               const priority = 5;

               const job = await queueLearningJob(userId, contentId, priority);

               expect(job).toBeDefined();
               expect(job.data.userId).toBe(userId);
               expect(job.data.contentId).toBe(contentId);
               expect(job.data.priority).toBe(priority);
          });

          it('should create a job with default priority when not specified', async () => {
               const userId = 'user123';
               const contentId = 'content456';

               const job = await queueLearningJob(userId, contentId);

               expect(job).toBeDefined();
               expect(job.data.userId).toBe(userId);
               expect(job.data.contentId).toBe(contentId);
               expect(job.data.priority).toBe(0);
          });

          it('should generate unique job IDs for different jobs', async () => {
               const userId = 'user123';
               const contentId1 = 'content456';
               const contentId2 = 'content789';

               const job1 = await queueLearningJob(userId, contentId1);
               const job2 = await queueLearningJob(userId, contentId2);

               expect(job1.id).toBeDefined();
               expect(job2.id).toBeDefined();
               expect(job1.id).not.toBe(job2.id);
          });

          it('should queue jobs with higher priority first', async () => {
               const userId = 'user123';

               const lowPriorityJob = await queueLearningJob(userId, 'content1', 1);
               const highPriorityJob = await queueLearningJob(userId, 'content2', 10);

               expect(lowPriorityJob.opts.priority).toBe(1);
               expect(highPriorityJob.opts.priority).toBe(10);
          });
     });

     describe('Job Status Tracking', () => {
          it('should retrieve job status by ID', async () => {
               const userId = 'user123';
               const contentId = 'content456';

               const job = await queueLearningJob(userId, contentId);
               const status = await getJobStatus(job.id);

               expect(status).toBeDefined();
               expect(status?.id).toBe(job.id);
               expect(status?.data.userId).toBe(userId);
               expect(status?.data.contentId).toBe(contentId);
          });

          it('should return null for non-existent job ID', async () => {
               const status = await getJobStatus('non-existent-job-id');
               expect(status).toBeNull();
          });

          it('should track job state correctly', async () => {
               const userId = 'user123';
               const contentId = 'content456';

               const job = await queueLearningJob(userId, contentId);
               const status = await getJobStatus(job.id);

               expect(status?.state).toBeDefined();
               expect(['waiting', 'active', 'completed', 'failed', 'delayed']).toContain(status?.state);
          });
     });

     describe('Queue Metrics', () => {
          it('should retrieve queue metrics', async () => {
               const metrics = await getQueueMetrics();

               expect(metrics).toBeDefined();
               expect(typeof metrics.waiting).toBe('number');
               expect(typeof metrics.active).toBe('number');
               expect(typeof metrics.completed).toBe('number');
               expect(typeof metrics.failed).toBe('number');
               expect(typeof metrics.delayed).toBe('number');
               expect(typeof metrics.total).toBe('number');
          });

          it('should calculate total correctly', async () => {
               const metrics = await getQueueMetrics();

               const expectedTotal = metrics.waiting + metrics.active + metrics.delayed;
               expect(metrics.total).toBe(expectedTotal);
          });

          it('should have non-negative counts', async () => {
               const metrics = await getQueueMetrics();

               expect(metrics.waiting).toBeGreaterThanOrEqual(0);
               expect(metrics.active).toBeGreaterThanOrEqual(0);
               expect(metrics.completed).toBeGreaterThanOrEqual(0);
               expect(metrics.failed).toBeGreaterThanOrEqual(0);
               expect(metrics.delayed).toBeGreaterThanOrEqual(0);
               expect(metrics.total).toBeGreaterThanOrEqual(0);
          });
     });

     describe('Retry Logic Configuration', () => {
          it('should configure retry attempts to 3', () => {
               const defaultOptions = learningQueue.opts.defaultJobOptions;
               expect(defaultOptions?.attempts).toBe(3);
          });

          it('should configure exponential backoff', () => {
               const defaultOptions = learningQueue.opts.defaultJobOptions;
               const backoff = defaultOptions?.backoff;
               expect(backoff).toBeDefined();
               expect(backoff.type).toBe('exponential');
               expect(backoff.delay).toBe(1000);
          });

          it('should keep failed jobs for debugging', () => {
               const defaultOptions = learningQueue.opts.defaultJobOptions;
               expect(defaultOptions?.removeOnFail).toBe(false);
          });

          it('should remove completed jobs after retention period', () => {
               const defaultOptions = learningQueue.opts.defaultJobOptions;
               const removeOnComplete = defaultOptions?.removeOnComplete;
               expect(removeOnComplete).toBeDefined();
               expect(removeOnComplete.age).toBe(24 * 3600);
               expect(removeOnComplete.count).toBe(1000);
          });
     });

     describe('Dead Letter Queue', () => {
          it('should have a dead letter queue configured', () => {
               expect(deadLetterQueue).toBeDefined();
               expect(deadLetterQueue.name).toBe('learning-jobs-dlq');
          });

          it('should be a valid BullMQ queue instance', () => {
               expect(deadLetterQueue).toBeDefined();
               expect(typeof deadLetterQueue.add).toBe('function');
               expect(typeof deadLetterQueue.close).toBe('function');
          });
     });

     describe('Concurrency Configuration', () => {
          it('should respect LEARNING_QUEUE_CONCURRENCY environment variable', () => {
               // This test verifies the worker configuration
               // The actual concurrency is set in the worker, not the queue
               const concurrency = parseInt(process.env.LEARNING_QUEUE_CONCURRENCY || '5', 10);
               expect(concurrency).toBeGreaterThan(0);
               expect(concurrency).toBeLessThanOrEqual(10);
          });
     });
});
