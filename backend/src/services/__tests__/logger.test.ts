/**
 * Tests for LoggerService
 * Requirements: 5.15, 13.7, 15.11
 */

import { LoggerService, logger, LogLevel } from '../LoggerService';

describe('LoggerService', () => {
     beforeEach(() => {
          // Reset logger state before each test
          logger.clearLogs();
          logger.resetMetrics();
     });

     describe('Gemini API Logging', () => {
          it('should log successful Gemini API calls with token usage', () => {
               const apiLog = {
                    operation: 'style_analysis' as const,
                    userId: 'user123',
                    promptTokens: 1000,
                    completionTokens: 500,
                    totalTokens: 1500,
                    latencyMs: 250,
                    success: true,
                    timestamp: new Date(),
               };

               logger.logGeminiAPICall(apiLog);

               const logs = logger.getRecentGeminiAPILogs(10);
               expect(logs).toHaveLength(1);
               expect(logs[0]).toMatchObject(apiLog);

               const metrics = logger.getMetrics();
               expect(metrics.geminiAPICallCount).toBe(1);
               expect(metrics.geminiAPIErrorCount).toBe(0);
          });

          it('should log failed Gemini API calls', () => {
               const apiLog = {
                    operation: 'content_generation' as const,
                    userId: 'user456',
                    promptTokens: 2000,
                    completionTokens: 0,
                    totalTokens: 2000,
                    latencyMs: 100,
                    success: false,
                    error: 'Rate limit exceeded',
                    timestamp: new Date(),
               };

               logger.logGeminiAPICall(apiLog);

               const logs = logger.getRecentGeminiAPILogs(10);
               expect(logs).toHaveLength(1);
               expect(logs[0].success).toBe(false);
               expect(logs[0].error).toBe('Rate limit exceeded');

               const metrics = logger.getMetrics();
               expect(metrics.geminiAPICallCount).toBe(1);
               expect(metrics.geminiAPIErrorCount).toBe(1);
               expect(metrics.geminiErrorRate).toBe(100);
          });

          it('should track Gemini API error rate correctly', () => {
               // Log 3 successful calls
               for (let i = 0; i < 3; i++) {
                    logger.logGeminiAPICall({
                         operation: 'style_analysis',
                         userId: `user${i}`,
                         promptTokens: 1000,
                         completionTokens: 500,
                         totalTokens: 1500,
                         latencyMs: 200,
                         success: true,
                         timestamp: new Date(),
                    });
               }

               // Log 1 failed call
               logger.logGeminiAPICall({
                    operation: 'content_generation',
                    userId: 'user3',
                    promptTokens: 1000,
                    completionTokens: 0,
                    totalTokens: 1000,
                    latencyMs: 100,
                    success: false,
                    error: 'API error',
                    timestamp: new Date(),
               });

               const metrics = logger.getMetrics();
               expect(metrics.geminiAPICallCount).toBe(4);
               expect(metrics.geminiAPIErrorCount).toBe(1);
               expect(metrics.geminiErrorRate).toBe(25); // 1/4 = 25%
          });

          it('should limit stored Gemini API logs to 1000', () => {
               // Log 1100 calls
               for (let i = 0; i < 1100; i++) {
                    logger.logGeminiAPICall({
                         operation: 'style_analysis',
                         userId: `user${i}`,
                         promptTokens: 1000,
                         completionTokens: 500,
                         totalTokens: 1500,
                         latencyMs: 200,
                         success: true,
                         timestamp: new Date(),
                    });
               }

               const logs = logger.getRecentGeminiAPILogs(2000);
               expect(logs.length).toBeLessThanOrEqual(1000);
          });
     });

     describe('Profile Update Logging', () => {
          it('should log profile updates with before/after', () => {
               const updateLog = {
                    userId: 'user123',
                    updateType: 'feedback' as const,
                    before: { tone: { formality: 5 } },
                    after: { tone: { formality: 6 } },
                    changedFields: ['tone'],
                    learningIterations: 5,
                    timestamp: new Date(),
               };

               logger.logProfileUpdate(updateLog);

               const logs = logger.getRecentProfileUpdateLogs(10);
               expect(logs).toHaveLength(1);
               expect(logs[0]).toMatchObject(updateLog);

               const metrics = logger.getMetrics();
               expect(metrics.profileUpdateCount).toBe(1);
          });

          it('should track multiple profile updates', () => {
               for (let i = 0; i < 5; i++) {
                    logger.logProfileUpdate({
                         userId: `user${i}`,
                         updateType: 'manual',
                         before: {},
                         after: {},
                         changedFields: ['tone'],
                         learningIterations: i,
                         timestamp: new Date(),
                    });
               }

               const logs = logger.getRecentProfileUpdateLogs(10);
               expect(logs).toHaveLength(5);

               const metrics = logger.getMetrics();
               expect(metrics.profileUpdateCount).toBe(5);
          });

          it('should limit stored profile update logs to 500', () => {
               for (let i = 0; i < 600; i++) {
                    logger.logProfileUpdate({
                         userId: `user${i}`,
                         updateType: 'feedback',
                         before: {},
                         after: {},
                         changedFields: [],
                         learningIterations: i,
                         timestamp: new Date(),
                    });
               }

               const logs = logger.getRecentProfileUpdateLogs(1000);
               expect(logs.length).toBeLessThanOrEqual(500);
          });
     });

     describe('Learning Job Failure Logging', () => {
          it('should log learning job failures with context', () => {
               const failureLog = {
                    jobId: 'job123',
                    userId: 'user123',
                    contentId: 'content123',
                    attemptNumber: 2,
                    error: 'Database connection failed',
                    stackTrace: 'Error: Database connection failed\n  at ...',
                    context: { status: 'processing', priority: 0 },
                    timestamp: new Date(),
               };

               logger.logLearningJobFailure(failureLog);

               const logs = logger.getRecentLearningJobFailureLogs(10);
               expect(logs).toHaveLength(1);
               expect(logs[0]).toMatchObject(failureLog);
          });

          it('should track multiple job failures', () => {
               for (let i = 0; i < 3; i++) {
                    logger.logLearningJobFailure({
                         jobId: `job${i}`,
                         userId: `user${i}`,
                         contentId: `content${i}`,
                         attemptNumber: 1,
                         error: 'Test error',
                         context: {},
                         timestamp: new Date(),
                    });
               }

               const logs = logger.getRecentLearningJobFailureLogs(10);
               expect(logs).toHaveLength(3);
          });

          it('should limit stored job failure logs to 500', () => {
               for (let i = 0; i < 600; i++) {
                    logger.logLearningJobFailure({
                         jobId: `job${i}`,
                         userId: `user${i}`,
                         contentId: `content${i}`,
                         attemptNumber: 1,
                         error: 'Test error',
                         context: {},
                         timestamp: new Date(),
                    });
               }

               const logs = logger.getRecentLearningJobFailureLogs(1000);
               expect(logs.length).toBeLessThanOrEqual(500);
          });
     });

     describe('Metrics Tracking', () => {
          it('should track profile creation count', () => {
               logger.trackProfileCreation();
               logger.trackProfileCreation();
               logger.trackProfileCreation();

               const metrics = logger.getMetrics();
               expect(metrics.profileCreationCount).toBe(3);
          });

          it('should track content generation with and without profile', () => {
               logger.trackContentGeneration(true);
               logger.trackContentGeneration(true);
               logger.trackContentGeneration(false);

               const metrics = logger.getMetrics();
               expect(metrics.contentGenerationCount).toBe(3);
               expect(metrics.contentGenerationWithProfileCount).toBe(2);
               expect(metrics.profileUsageRate).toBe(66.67); // 2/3 = 66.67%
          });

          it('should track learning job processing times', () => {
               logger.trackLearningJobProcessingTime(1000);
               logger.trackLearningJobProcessingTime(2000);
               logger.trackLearningJobProcessingTime(3000);

               const metrics = logger.getMetrics();
               expect(metrics.avgLearningJobProcessingTimeMs).toBe(2000); // (1000+2000+3000)/3
          });

          it('should limit stored processing times to 1000', () => {
               for (let i = 0; i < 1100; i++) {
                    logger.trackLearningJobProcessingTime(1000);
               }

               const metrics = logger.getMetrics();
               // Should still calculate average correctly
               expect(metrics.avgLearningJobProcessingTimeMs).toBe(1000);
          });

          it('should calculate profile usage rate correctly', () => {
               // 7 with profile, 3 without
               for (let i = 0; i < 7; i++) {
                    logger.trackContentGeneration(true);
               }
               for (let i = 0; i < 3; i++) {
                    logger.trackContentGeneration(false);
               }

               const metrics = logger.getMetrics();
               expect(metrics.profileUsageRate).toBe(70); // 7/10 = 70%
          });
     });

     describe('General Logging', () => {
          it('should log messages with different levels', () => {
               // Just verify these don't throw errors
               logger.log(LogLevel.DEBUG, 'Debug message');
               logger.log(LogLevel.INFO, 'Info message');
               logger.log(LogLevel.WARN, 'Warning message');
               logger.log(LogLevel.ERROR, 'Error message');
          });

          it('should log messages with context', () => {
               logger.log(LogLevel.INFO, 'Test message', {
                    userId: 'user123',
                    contentId: 'content456',
               });
          });
     });

     describe('Singleton Pattern', () => {
          it('should return the same instance', () => {
               const instance1 = LoggerService.getInstance();
               const instance2 = LoggerService.getInstance();
               expect(instance1).toBe(instance2);
          });
     });
});
