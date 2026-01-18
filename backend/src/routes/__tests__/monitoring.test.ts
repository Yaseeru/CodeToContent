/**
 * Tests for Monitoring Routes
 * Requirements: 5.15, 13.7, 15.11
 */

import request from 'supertest';
import express from 'express';
import monitoringRoutes from '../monitoring';
import { monitoring } from '../../services/MonitoringService';
import { logger } from '../../services/LoggerService';
import * as queueModule from '../../config/queue';

// Mock dependencies
jest.mock('../../config/queue');

const app = express();
app.use(express.json());
app.use('/api/monitoring', monitoringRoutes);

describe('Monitoring Routes', () => {
     beforeEach(() => {
          monitoring.clearAlerts();
          logger.clearLogs();
          logger.resetMetrics();
          jest.clearAllMocks();
     });

     describe('GET /api/monitoring/health', () => {
          it('should return healthy status when all systems are healthy', async () => {
               // Mock healthy queue
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 10,
                    active: 2,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 12,
               });

               const response = await request(app)
                    .get('/api/monitoring/health')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.status).toBe('healthy');
               expect(response.body.data.checks).toHaveProperty('queueHealth');
               expect(response.body.data.checks).toHaveProperty('geminiAPI');
               expect(response.body.data.checks).toHaveProperty('learningEngine');
          });

          it('should return 200 with degraded status when systems are degraded', async () => {
               // Mock degraded queue (high backlog)
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 60,
                    active: 5,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 65,
               });

               const response = await request(app)
                    .get('/api/monitoring/health')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.status).toBe('degraded');
          });

          it('should return 503 when systems are unhealthy', async () => {
               // Mock unhealthy queue (critical backlog)
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 120,
                    active: 5,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 125,
               });

               const response = await request(app)
                    .get('/api/monitoring/health')
                    .expect(503);

               expect(response.body.success).toBe(true);
               expect(response.body.data.status).toBe('unhealthy');
          });
     });

     describe('GET /api/monitoring/metrics', () => {
          it('should return current metrics', async () => {
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

               const response = await request(app)
                    .get('/api/monitoring/metrics')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('voiceEngine');
               expect(response.body.data).toHaveProperty('queue');
               expect(response.body.data).toHaveProperty('timestamp');

               expect(response.body.data.voiceEngine.profileCreationCount).toBe(1);
               expect(response.body.data.voiceEngine.contentGenerationCount).toBe(1);
               expect(response.body.data.queue.waiting).toBe(10);
          });
     });

     describe('GET /api/monitoring/alerts', () => {
          it('should return recent alerts', async () => {
               // Mock critical backlog to trigger alert
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 120,
                    active: 5,
                    completed: 100,
                    failed: 5,
                    delayed: 0,
                    total: 125,
               });

               // Trigger health check to generate alerts
               await monitoring.checkHealth();

               const response = await request(app)
                    .get('/api/monitoring/alerts')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('alerts');
               expect(response.body.data).toHaveProperty('count');
               expect(response.body.data.alerts.length).toBeGreaterThan(0);
          });

          it('should respect limit parameter', async () => {
               // Mock critical conditions
               (queueModule.getQueueMetrics as jest.Mock).mockResolvedValue({
                    waiting: 120,
                    active: 5,
                    completed: 100,
                    failed: 20,
                    delayed: 0,
                    total: 125,
               });

               // Trigger multiple health checks
               for (let i = 0; i < 10; i++) {
                    await monitoring.checkHealth();
               }

               const response = await request(app)
                    .get('/api/monitoring/alerts?limit=5')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.alerts.length).toBeLessThanOrEqual(5);
          });
     });

     describe('GET /api/monitoring/dashboard', () => {
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

               const response = await request(app)
                    .get('/api/monitoring/dashboard')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('health');
               expect(response.body.data).toHaveProperty('metrics');
               expect(response.body.data).toHaveProperty('queueMetrics');
               expect(response.body.data).toHaveProperty('recentAlerts');
               expect(response.body.data).toHaveProperty('timestamp');
          });
     });

     describe('GET /api/monitoring/logs/gemini', () => {
          it('should return recent Gemini API logs', async () => {
               // Log some API calls
               logger.logGeminiAPICall({
                    operation: 'style_analysis',
                    userId: 'user123',
                    promptTokens: 1000,
                    completionTokens: 500,
                    totalTokens: 1500,
                    latencyMs: 200,
                    success: true,
                    timestamp: new Date(),
               });

               const response = await request(app)
                    .get('/api/monitoring/logs/gemini')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('logs');
               expect(response.body.data).toHaveProperty('count');
               expect(response.body.data.logs.length).toBe(1);
          });

          it('should respect limit parameter', async () => {
               // Log multiple API calls
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

               const response = await request(app)
                    .get('/api/monitoring/logs/gemini?limit=5')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.logs.length).toBeLessThanOrEqual(5);
          });
     });

     describe('GET /api/monitoring/logs/profile-updates', () => {
          it('should return recent profile update logs', async () => {
               // Log a profile update
               logger.logProfileUpdate({
                    userId: 'user123',
                    updateType: 'feedback',
                    before: { tone: { formality: 5 } },
                    after: { tone: { formality: 6 } },
                    changedFields: ['tone'],
                    learningIterations: 5,
                    timestamp: new Date(),
               });

               const response = await request(app)
                    .get('/api/monitoring/logs/profile-updates')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('logs');
               expect(response.body.data).toHaveProperty('count');
               expect(response.body.data.logs.length).toBe(1);
          });
     });

     describe('GET /api/monitoring/logs/job-failures', () => {
          it('should return recent job failure logs', async () => {
               // Log a job failure
               logger.logLearningJobFailure({
                    jobId: 'job123',
                    userId: 'user123',
                    contentId: 'content123',
                    attemptNumber: 2,
                    error: 'Test error',
                    context: {},
                    timestamp: new Date(),
               });

               const response = await request(app)
                    .get('/api/monitoring/logs/job-failures')
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('logs');
               expect(response.body.data).toHaveProperty('count');
               expect(response.body.data.logs.length).toBe(1);
          });
     });
});
