/**
 * Tests for MonitoringService
 * Requirements: 5.15, 13.7, 15.11
 */

import { MonitoringService, monitoring } from '../MonitoringService';
import { logger } from '../LoggerService';
import * as queueModule from '../../config/queue';

// Mock the queue module
jest.mock('../../config/queue');

describe('MonitoringService', () => {
     beforeEach(() => {
          // Reset monitoring state
          monitoring.clearAlerts();
          logger.clearLogs();
          logger.resetMetrics();
          jest.clearAllMocks();
     });

     describe('Queue Health Checks', () => {
          it('should report healthy status when queue is normal', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               const health = await monitoring.checkHealth();

               expect(health.status).toBe('healthy');
               expect(health.checks.queueHealth.status).toBe('healthy');
               expect(health.checks.queueHealth.backlog).toBe(10);
          });

          it('should report degraded status when queue backlog is high', async () => {
               // Mock high backlog
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 60,
                    active: 5,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 65,
               });

               const health = await monitoring.checkHealth();

               expect(health.status).toBe('degraded');
               expect(health.checks.queueHealth.status).toBe('degraded');
               expect(health.checks.queueHealth.backlog).toBe(60);

               // Should trigger alert
               const alerts = monitoring.getRecentAlerts(10);
               expect(alerts.length).toBeGreaterThan(0);
               expect(alerts[0].type).toBe('queue_backlog');
               expect(alerts[0].severity).toBe('warning');
          });

          it('should report unhealthy status when queue backlog is critical', async () => {
               // Mock critical backlog
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 120,
                    active: 5,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 125,
               });

               const health = await monitoring.checkHealth();

               expect(health.status).toBe('unhealthy');
               expect(health.checks.queueHealth.status).toBe('unhealthy');

               // Should trigger critical alert
               const alerts = monitoring.getRecentAlerts(10);
               expect(alerts.length).toBeGreaterThan(0);
               expect(alerts[0].type).toBe('queue_backlog');
               expect(alerts[0].severity).toBe('critical');
          });

          it('should report unhealthy status when job failure rate is high', async () => {
               // Mock high failure rate (20 failed out of 100 total)
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 80,
                    failed: 20,
                    delayed: 0,
                    total: 12,
               });

               const health = await monitoring.checkHealth();

               expect(health.status).toBe('unhealthy');
               expect(health.checks.queueHealth.status).toBe('unhealthy');

               // Should trigger critical alert for failure rate
               const alerts = monitoring.getRecentAlerts(10);
               const failureAlert = alerts.find(a => a.type === 'job_failure_rate');
               expect(failureAlert).toBeDefined();
               expect(failureAlert?.severity).toBe('critical');
          });
     });

     describe('Gemini API Health Checks', () => {
          it('should report healthy status when API error rate is low', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               // Log successful API calls
               for (let i = 0; i < 10; i++) {
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

               const health = await monitoring.checkHealth();

               expect(health.checks.geminiAPI.status).toBe('healthy');
               expect(health.checks.geminiAPI.errorRate).toBe(0);
          });

          it('should report degraded status when API error rate is moderate', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               // Log 96 successful and 4 failed calls (4% error rate)
               for (let i = 0; i < 96; i++) {
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
               for (let i = 0; i < 4; i++) {
                    logger.logGeminiAPICall({
                         operation: 'content_generation',
                         userId: `user${i}`,
                         promptTokens: 1000,
                         completionTokens: 0,
                         totalTokens: 1000,
                         latencyMs: 100,
                         success: false,
                         error: 'API error',
                         timestamp: new Date(),
                    });
               }

               const health = await monitoring.checkHealth();

               expect(health.checks.geminiAPI.status).toBe('degraded');
               expect(health.checks.geminiAPI.errorRate).toBe(4);

               // Should trigger warning alert
               const alerts = monitoring.getRecentAlerts(10);
               const apiAlert = alerts.find(a => a.type === 'api_error_rate');
               expect(apiAlert).toBeDefined();
               expect(apiAlert?.severity).toBe('warning');
          });

          it('should report unhealthy status when API error rate is high', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               // Log 90 successful and 10 failed calls (10% error rate)
               for (let i = 0; i < 90; i++) {
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
               for (let i = 0; i < 10; i++) {
                    logger.logGeminiAPICall({
                         operation: 'content_generation',
                         userId: `user${i}`,
                         promptTokens: 1000,
                         completionTokens: 0,
                         totalTokens: 1000,
                         latencyMs: 100,
                         success: false,
                         error: 'API error',
                         timestamp: new Date(),
                    });
               }

               const health = await monitoring.checkHealth();

               expect(health.checks.geminiAPI.status).toBe('unhealthy');

               // Should trigger critical alert
               const alerts = monitoring.getRecentAlerts(10);
               const apiAlert = alerts.find(a => a.type === 'api_error_rate');
               expect(apiAlert).toBeDefined();
               expect(apiAlert?.severity).toBe('critical');
          });
     });

     describe('Learning Engine Health Checks', () => {
          it('should report healthy status when processing time is normal', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               // Track normal processing times
               logger.trackLearningJobProcessingTime(5000);
               logger.trackLearningJobProcessingTime(6000);
               logger.trackLearningJobProcessingTime(7000);

               const health = await monitoring.checkHealth();

               expect(health.checks.learningEngine.status).toBe('healthy');
               expect(health.checks.learningEngine.avgProcessingTime).toBe(6000);
          });

          it('should report degraded status when processing time is high', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               // Track high processing times (25s average)
               logger.trackLearningJobProcessingTime(25000);
               logger.trackLearningJobProcessingTime(25000);
               logger.trackLearningJobProcessingTime(25000);

               const health = await monitoring.checkHealth();

               expect(health.checks.learningEngine.status).toBe('degraded');

               // Should trigger warning alert
               const alerts = monitoring.getRecentAlerts(10);
               const processingAlert = alerts.find(a => a.type === 'processing_time');
               expect(processingAlert).toBeDefined();
               expect(processingAlert?.severity).toBe('warning');
          });

          it('should report unhealthy status when processing time is critical', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               // Track critical processing times (35s average)
               logger.trackLearningJobProcessingTime(35000);
               logger.trackLearningJobProcessingTime(35000);
               logger.trackLearningJobProcessingTime(35000);

               const health = await monitoring.checkHealth();

               expect(health.checks.learningEngine.status).toBe('unhealthy');

               // Should trigger critical alert
               const alerts = monitoring.getRecentAlerts(10);
               const processingAlert = alerts.find(a => a.type === 'processing_time');
               expect(processingAlert).toBeDefined();
               expect(processingAlert?.severity).toBe('critical');
          });
     });

     describe('Alert Management', () => {
          it('should store and retrieve recent alerts', async () => {
               // Mock critical backlog to trigger alert
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 120,
                    active: 5,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 125,
               });

               await monitoring.checkHealth();

               const alerts = monitoring.getRecentAlerts(10);
               expect(alerts.length).toBeGreaterThan(0);
               expect(alerts[0]).toHaveProperty('type');
               expect(alerts[0]).toHaveProperty('severity');
               expect(alerts[0]).toHaveProperty('message');
               expect(alerts[0]).toHaveProperty('value');
               expect(alerts[0]).toHaveProperty('threshold');
               expect(alerts[0]).toHaveProperty('timestamp');
          });

          it('should limit stored alerts to 100', async () => {
               // Mock critical conditions to trigger many alerts
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 120,
                    active: 5,
                    completed: 100,
                    failed: 20,
                    delayed: 0,
                    total: 125,
               });

               // Trigger 50 health checks (will generate multiple alerts each)
               for (let i = 0; i < 50; i++) {
                    await monitoring.checkHealth();
               }

               const alerts = monitoring.getRecentAlerts(200);
               expect(alerts.length).toBeLessThanOrEqual(100);
          });
     });

     describe('Dashboard Data', () => {
          it('should return comprehensive dashboard data', async () => {
               // Mock queue metrics
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               // Add some metrics
               logger.trackProfileCreation();
               logger.trackContentGeneration(true);
               logger.trackLearningJobProcessingTime(5000);

               const dashboardData = await monitoring.getDashboardData();

               expect(dashboardData).toHaveProperty('health');
               expect(dashboardData).toHaveProperty('metrics');
               expect(dashboardData).toHaveProperty('queueMetrics');
               expect(dashboardData).toHaveProperty('recentAlerts');
               expect(dashboardData).toHaveProperty('timestamp');

               expect(dashboardData.health.status).toBeDefined();
               expect(dashboardData.metrics.profileCreationCount).toBe(1);
               expect(dashboardData.queueMetrics.waiting).toBe(10);
          });
     });

     describe('Singleton Pattern', () => {
          it('should return the same instance', () => {
               const instance1 = MonitoringService.getInstance();
               const instance2 = MonitoringService.getInstance();
               expect(instance1).toBe(instance2);
          });
     });
});
