/**
 * Monitoring and Health Check Routes
 */

import express, { Request, Response } from 'express';
import { monitoring } from '../services/MonitoringService';
import { logger, LogLevel } from '../services/LoggerService';
import { getQueueMetrics } from '../config/queue';

const router = express.Router();

/**
 * GET /api/monitoring/health
 * Health check endpoint for voice engine services
 */
router.get('/health', async (req: Request, res: Response) => {
     try {
          const health = await monitoring.checkHealth();

          // Return appropriate HTTP status based on health
          const statusCode = health.status === 'healthy' ? 200 :
               health.status === 'degraded' ? 200 : 503;

          res.status(statusCode).json({
               success: true,
               data: health,
          });
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'Health check failed', { error: error.message });
          res.status(503).json({
               success: false,
               error: 'Health check failed',
               message: error.message,
          });
     }
});

/**
 * GET /api/monitoring/metrics
 * Get current metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
     try {
          const metrics = logger.getMetrics();
          const queueMetrics = await getQueueMetrics();

          res.json({
               success: true,
               data: {
                    voiceEngine: metrics,
                    queue: queueMetrics,
                    timestamp: new Date(),
               },
          });
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'Failed to get metrics', { error: error.message });
          res.status(500).json({
               success: false,
               error: 'Failed to get metrics',
               message: error.message,
          });
     }
});

/**
 * GET /api/monitoring/alerts
 * Get recent alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
     try {
          const limit = parseInt(req.query.limit as string) || 20;
          const alerts = monitoring.getRecentAlerts(limit);

          res.json({
               success: true,
               data: {
                    alerts,
                    count: alerts.length,
               },
          });
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'Failed to get alerts', { error: error.message });
          res.status(500).json({
               success: false,
               error: 'Failed to get alerts',
               message: error.message,
          });
     }
});

/**
 * GET /api/monitoring/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
     try {
          const dashboardData = await monitoring.getDashboardData();

          res.json({
               success: true,
               data: dashboardData,
          });
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'Failed to get dashboard data', { error: error.message });
          res.status(500).json({
               success: false,
               error: 'Failed to get dashboard data',
               message: error.message,
          });
     }
});

/**
 * GET /api/monitoring/logs/gemini
 * Get recent Gemini API logs
 */
router.get('/logs/gemini', async (req: Request, res: Response) => {
     try {
          const limit = parseInt(req.query.limit as string) || 50;
          const logs = logger.getRecentGeminiAPILogs(limit);

          res.json({
               success: true,
               data: {
                    logs,
                    count: logs.length,
               },
          });
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'Failed to get Gemini API logs', { error: error.message });
          res.status(500).json({
               success: false,
               error: 'Failed to get Gemini API logs',
               message: error.message,
          });
     }
});

/**
 * GET /api/monitoring/logs/profile-updates
 * Get recent profile update logs
 */
router.get('/logs/profile-updates', async (req: Request, res: Response) => {
     try {
          const limit = parseInt(req.query.limit as string) || 50;
          const logs = logger.getRecentProfileUpdateLogs(limit);

          res.json({
               success: true,
               data: {
                    logs,
                    count: logs.length,
               },
          });
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'Failed to get profile update logs', { error: error.message });
          res.status(500).json({
               success: false,
               error: 'Failed to get profile update logs',
               message: error.message,
          });
     }
});

/**
 * GET /api/monitoring/logs/job-failures
 * Get recent learning job failure logs
 */
router.get('/logs/job-failures', async (req: Request, res: Response) => {
     try {
          const limit = parseInt(req.query.limit as string) || 50;
          const logs = logger.getRecentLearningJobFailureLogs(limit);

          res.json({
               success: true,
               data: {
                    logs,
                    count: logs.length,
               },
          });
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'Failed to get job failure logs', { error: error.message });
          res.status(500).json({
               success: false,
               error: 'Failed to get job failure logs',
               message: error.message,
          });
     }
});

export default router;
