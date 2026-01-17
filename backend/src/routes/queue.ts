import express from 'express';
import { getQueueMetrics, getJobStatus } from '../config/queue';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Health check endpoint for queue
router.get('/health', authenticate, async (req, res) => {
     try {
          const metrics = await getQueueMetrics();

          const isHealthy = metrics.failed < 10 && metrics.total < 100;

          res.json({
               status: isHealthy ? 'healthy' : 'degraded',
               metrics,
               timestamp: new Date().toISOString(),
          });
     } catch (error) {
          console.error('[Queue Health] Error getting queue metrics:', error);
          res.status(503).json({
               status: 'error',
               message: 'Unable to retrieve queue health',
          });
     }
});

// Get job status by ID
router.get('/jobs/:jobId', authenticate, async (req, res) => {
     try {
          const { jobId } = req.params;
          const status = await getJobStatus(jobId);

          if (!status) {
               return res.status(404).json({
                    error: 'Job not found',
               });
          }

          res.json(status);
     } catch (error) {
          console.error('[Queue] Error getting job status:', error);
          res.status(500).json({
               error: 'Failed to retrieve job status',
          });
     }
});

// Get queue metrics (admin only)
router.get('/metrics', authenticate, async (req, res) => {
     try {
          const metrics = await getQueueMetrics();
          res.json(metrics);
     } catch (error) {
          console.error('[Queue] Error getting queue metrics:', error);
          res.status(500).json({
               error: 'Failed to retrieve queue metrics',
          });
     }
});

export default router;
