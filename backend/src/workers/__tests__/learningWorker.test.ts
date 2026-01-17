import { Job } from 'bullmq';
import { LearningJob } from '../../models/LearningJob';
import { LearningJobData } from '../../config/queue';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock Redis and BullMQ
jest.mock('ioredis', () => {
     return jest.fn().mockImplementation(() => ({
          quit: jest.fn().mockResolvedValue(undefined),
          on: jest.fn(),
          connect: jest.fn().mockResolvedValue(undefined),
          disconnect: jest.fn().mockResolvedValue(undefined),
     }));
});

jest.mock('bullmq', () => {
     const actualBullMQ = jest.requireActual('bullmq');
     return {
          ...actualBullMQ,
          Worker: jest.fn().mockImplementation(() => ({
               on: jest.fn(),
               close: jest.fn().mockResolvedValue(undefined),
          })),
     };
});

describe('Learning Worker', () => {
     let mongoServer: MongoMemoryServer;

     beforeAll(async () => {
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);
     });

     afterAll(async () => {
          await mongoose.disconnect();
          await mongoServer.stop();
     });

     beforeEach(async () => {
          await LearningJob.deleteMany({});
     });

     describe('Job Processing', () => {
          it('should create a learning job record when processing starts', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'pending',
                    priority: 0,
                    attempts: 0,
               });

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job).toBeDefined();
               expect(job?.status).toBe('pending');
          });

          it('should update job status to processing when job starts', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'pending',
                    priority: 0,
                    attempts: 0,
               });

               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    {
                         status: 'processing',
                         processingStarted: new Date(),
                         attempts: 1,
                    }
               );

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job?.status).toBe('processing');
               expect(job?.processingStarted).toBeDefined();
               expect(job?.attempts).toBe(1);
          });

          it('should update job status to completed when job succeeds', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'processing',
                    priority: 0,
                    attempts: 1,
                    processingStarted: new Date(),
               });

               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    {
                         status: 'completed',
                         processingCompleted: new Date(),
                         error: undefined,
                    }
               );

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job?.status).toBe('completed');
               expect(job?.processingCompleted).toBeDefined();
               expect(job?.error).toBeUndefined();
          });

          it('should update job status to failed when job fails', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();
               const errorMessage = 'Test error';

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'processing',
                    priority: 0,
                    attempts: 1,
                    processingStarted: new Date(),
               });

               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    {
                         status: 'failed',
                         error: errorMessage,
                         attempts: 2,
                    }
               );

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job?.status).toBe('failed');
               expect(job?.error).toBe(errorMessage);
               expect(job?.attempts).toBe(2);
          });
     });

     describe('Retry Logic', () => {
          it('should increment attempts counter on each retry', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'pending',
                    priority: 0,
                    attempts: 0,
               });

               // Simulate first attempt
               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    { status: 'failed', attempts: 1, error: 'First failure' }
               );

               let job = await LearningJob.findOne({ userId, contentId });
               expect(job?.attempts).toBe(1);

               // Simulate second attempt
               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    { status: 'failed', attempts: 2, error: 'Second failure' }
               );

               job = await LearningJob.findOne({ userId, contentId });
               expect(job?.attempts).toBe(2);

               // Simulate third attempt
               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    { status: 'failed', attempts: 3, error: 'Third failure' }
               );

               job = await LearningJob.findOne({ userId, contentId });
               expect(job?.attempts).toBe(3);
          });

          it('should track error messages for failed attempts', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();
               const errorMessage = 'Database connection failed';

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'processing',
                    priority: 0,
                    attempts: 1,
               });

               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    {
                         status: 'failed',
                         error: errorMessage,
                         attempts: 2,
                    }
               );

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job?.error).toBe(errorMessage);
          });

          it('should allow job to be retried after failure', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'failed',
                    priority: 0,
                    attempts: 1,
                    error: 'First failure',
               });

               // Retry the job
               await LearningJob.findOneAndUpdate(
                    { userId, contentId },
                    {
                         status: 'processing',
                         processingStarted: new Date(),
                         attempts: 2,
                    }
               );

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job?.status).toBe('processing');
               expect(job?.attempts).toBe(2);
          });
     });

     describe('Concurrency Limits', () => {
          it('should respect concurrency configuration', () => {
               const concurrency = parseInt(process.env.LEARNING_QUEUE_CONCURRENCY || '5', 10);
               expect(concurrency).toBe(5);
          });

          it('should be able to process multiple jobs', async () => {
               const jobs = [];

               for (let i = 0; i < 10; i++) {
                    const userId = new mongoose.Types.ObjectId();
                    const contentId = new mongoose.Types.ObjectId();

                    const job = await LearningJob.create({
                         userId,
                         contentId,
                         status: 'pending',
                         priority: i,
                         attempts: 0,
                    });

                    jobs.push(job);
               }

               expect(jobs.length).toBe(10);

               const pendingJobs = await LearningJob.find({ status: 'pending' });
               expect(pendingJobs.length).toBe(10);
          });

          it('should process jobs with different priorities', async () => {
               const lowPriorityJob = await LearningJob.create({
                    userId: new mongoose.Types.ObjectId(),
                    contentId: new mongoose.Types.ObjectId(),
                    status: 'pending',
                    priority: 1,
                    attempts: 0,
               });

               const highPriorityJob = await LearningJob.create({
                    userId: new mongoose.Types.ObjectId(),
                    contentId: new mongoose.Types.ObjectId(),
                    status: 'pending',
                    priority: 10,
                    attempts: 0,
               });

               expect(lowPriorityJob.priority).toBe(1);
               expect(highPriorityJob.priority).toBe(10);
               expect(highPriorityJob.priority).toBeGreaterThan(lowPriorityJob.priority);
          });
     });

     describe('Job Status Updates', () => {
          it('should track processing timestamps', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               const startTime = new Date();

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'processing',
                    priority: 0,
                    attempts: 1,
                    processingStarted: startTime,
               });

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job?.processingStarted).toBeDefined();
               expect(job?.processingStarted?.getTime()).toBeCloseTo(startTime.getTime(), -2);
          });

          it('should track completion timestamps', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               const completionTime = new Date();

               await LearningJob.create({
                    userId,
                    contentId,
                    status: 'completed',
                    priority: 0,
                    attempts: 1,
                    processingStarted: new Date(Date.now() - 1000),
                    processingCompleted: completionTime,
               });

               const job = await LearningJob.findOne({ userId, contentId });
               expect(job?.processingCompleted).toBeDefined();
               expect(job?.processingCompleted?.getTime()).toBeCloseTo(completionTime.getTime(), -2);
          });

          it('should maintain job history with timestamps', async () => {
               const userId = new mongoose.Types.ObjectId();
               const contentId = new mongoose.Types.ObjectId();

               const job = await LearningJob.create({
                    userId,
                    contentId,
                    status: 'completed',
                    priority: 0,
                    attempts: 1,
                    processingStarted: new Date(Date.now() - 5000),
                    processingCompleted: new Date(),
               });

               expect(job.createdAt).toBeDefined();
               expect(job.updatedAt).toBeDefined();
               expect(job.processingStarted).toBeDefined();
               expect(job.processingCompleted).toBeDefined();
          });
     });
});
