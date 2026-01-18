/**
 * Monitoring Service for Voice Engine
 * Tracks health metrics and triggers alerts
 */

import { getQueueMetrics } from '../config/queue';
import { logger, LogLevel } from './LoggerService';

export interface HealthStatus {
     status: 'healthy' | 'degraded' | 'unhealthy';
     timestamp: Date;
     checks: {
          queueHealth: {
               status: 'healthy' | 'degraded' | 'unhealthy';
               backlog: number;
               activeJobs: number;
               failedJobs: number;
               message?: string;
          };
          geminiAPI: {
               status: 'healthy' | 'degraded' | 'unhealthy';
               errorRate: number;
               message?: string;
          };
          learningEngine: {
               status: 'healthy' | 'degraded' | 'unhealthy';
               avgProcessingTime: number;
               message?: string;
          };
     };
}

export interface Alert {
     type: 'queue_backlog' | 'job_failure_rate' | 'api_error_rate' | 'processing_time';
     severity: 'warning' | 'critical';
     message: string;
     value: number;
     threshold: number;
     timestamp: Date;
}

export class MonitoringService {
     private static instance: MonitoringService;
     private alerts: Alert[] = [];

     // Alert thresholds
     private readonly QUEUE_BACKLOG_WARNING = 50;
     private readonly QUEUE_BACKLOG_CRITICAL = 100;
     private readonly JOB_FAILURE_RATE_WARNING = 5; // 5%
     private readonly JOB_FAILURE_RATE_CRITICAL = 10; // 10%
     private readonly API_ERROR_RATE_WARNING = 3; // 3%
     private readonly API_ERROR_RATE_CRITICAL = 5; // 5%
     private readonly PROCESSING_TIME_WARNING = 20000; // 20s
     private readonly PROCESSING_TIME_CRITICAL = 30000; // 30s

     private constructor() { }

     static getInstance(): MonitoringService {
          if (!MonitoringService.instance) {
               MonitoringService.instance = new MonitoringService();
          }
          return MonitoringService.instance;
     }

     /**
      * Check overall health status
      */
     async checkHealth(): Promise<HealthStatus> {
          const queueHealth = await this.checkQueueHealth();
          const geminiHealth = this.checkGeminiAPIHealth();
          const learningEngineHealth = this.checkLearningEngineHealth();

          // Determine overall status
          const statuses = [
               queueHealth.status,
               geminiHealth.status,
               learningEngineHealth.status,
          ];

          let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
          if (statuses.includes('unhealthy')) {
               overallStatus = 'unhealthy';
          } else if (statuses.includes('degraded')) {
               overallStatus = 'degraded';
          }

          return {
               status: overallStatus,
               timestamp: new Date(),
               checks: {
                    queueHealth,
                    geminiAPI: geminiHealth,
                    learningEngine: learningEngineHealth,
               },
          };
     }

     /**
      * Check queue health
      */
     private async checkQueueHealth() {
          try {
               const metrics = await getQueueMetrics();
               const backlog = metrics.waiting + metrics.delayed;
               const failureRate = metrics.failed > 0 && metrics.completed > 0
                    ? (metrics.failed / (metrics.completed + metrics.failed)) * 100
                    : 0;

               let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
               let message: string | undefined;

               // Check backlog
               if (backlog >= this.QUEUE_BACKLOG_CRITICAL) {
                    status = 'unhealthy';
                    message = `Critical queue backlog: ${backlog} jobs`;
                    this.triggerAlert({
                         type: 'queue_backlog',
                         severity: 'critical',
                         message,
                         value: backlog,
                         threshold: this.QUEUE_BACKLOG_CRITICAL,
                         timestamp: new Date(),
                    });
               } else if (backlog >= this.QUEUE_BACKLOG_WARNING) {
                    status = 'degraded';
                    message = `High queue backlog: ${backlog} jobs`;
                    this.triggerAlert({
                         type: 'queue_backlog',
                         severity: 'warning',
                         message,
                         value: backlog,
                         threshold: this.QUEUE_BACKLOG_WARNING,
                         timestamp: new Date(),
                    });
               }

               // Check failure rate
               if (failureRate >= this.JOB_FAILURE_RATE_CRITICAL) {
                    status = 'unhealthy';
                    message = `Critical job failure rate: ${failureRate.toFixed(2)}%`;
                    this.triggerAlert({
                         type: 'job_failure_rate',
                         severity: 'critical',
                         message,
                         value: failureRate,
                         threshold: this.JOB_FAILURE_RATE_CRITICAL,
                         timestamp: new Date(),
                    });
               } else if (failureRate >= this.JOB_FAILURE_RATE_WARNING) {
                    if (status === 'healthy') status = 'degraded';
                    message = `High job failure rate: ${failureRate.toFixed(2)}%`;
                    this.triggerAlert({
                         type: 'job_failure_rate',
                         severity: 'warning',
                         message,
                         value: failureRate,
                         threshold: this.JOB_FAILURE_RATE_WARNING,
                         timestamp: new Date(),
                    });
               }

               return {
                    status,
                    backlog,
                    activeJobs: metrics.active,
                    failedJobs: metrics.failed,
                    message,
               };
          } catch (error: any) {
               logger.log(LogLevel.ERROR, 'Failed to check queue health', { error: error.message });
               return {
                    status: 'unhealthy' as const,
                    backlog: 0,
                    activeJobs: 0,
                    failedJobs: 0,
                    message: 'Failed to connect to queue',
               };
          }
     }

     /**
      * Check Gemini API health
      */
     private checkGeminiAPIHealth() {
          const metrics = logger.getMetrics();
          const errorRate = metrics.geminiErrorRate;

          let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
          let message: string | undefined;

          if (errorRate >= this.API_ERROR_RATE_CRITICAL) {
               status = 'unhealthy';
               message = `Critical Gemini API error rate: ${errorRate.toFixed(2)}%`;
               this.triggerAlert({
                    type: 'api_error_rate',
                    severity: 'critical',
                    message,
                    value: errorRate,
                    threshold: this.API_ERROR_RATE_CRITICAL,
                    timestamp: new Date(),
               });
          } else if (errorRate >= this.API_ERROR_RATE_WARNING) {
               status = 'degraded';
               message = `High Gemini API error rate: ${errorRate.toFixed(2)}%`;
               this.triggerAlert({
                    type: 'api_error_rate',
                    severity: 'warning',
                    message,
                    value: errorRate,
                    threshold: this.API_ERROR_RATE_WARNING,
                    timestamp: new Date(),
               });
          }

          return {
               status,
               errorRate,
               message,
          };
     }

     /**
      * Check learning engine health
      */
     private checkLearningEngineHealth() {
          const metrics = logger.getMetrics();
          const avgProcessingTime = metrics.avgLearningJobProcessingTimeMs;

          let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
          let message: string | undefined;

          if (avgProcessingTime >= this.PROCESSING_TIME_CRITICAL) {
               status = 'unhealthy';
               message = `Critical learning job processing time: ${avgProcessingTime}ms`;
               this.triggerAlert({
                    type: 'processing_time',
                    severity: 'critical',
                    message,
                    value: avgProcessingTime,
                    threshold: this.PROCESSING_TIME_CRITICAL,
                    timestamp: new Date(),
               });
          } else if (avgProcessingTime >= this.PROCESSING_TIME_WARNING) {
               status = 'degraded';
               message = `High learning job processing time: ${avgProcessingTime}ms`;
               this.triggerAlert({
                    type: 'processing_time',
                    severity: 'warning',
                    message,
                    value: avgProcessingTime,
                    threshold: this.PROCESSING_TIME_WARNING,
                    timestamp: new Date(),
               });
          }

          return {
               status,
               avgProcessingTime,
               message,
          };
     }

     /**
      * Trigger an alert
      */
     private triggerAlert(alert: Alert): void {
          this.alerts.push(alert);

          // Log alert
          const severity = alert.severity.toUpperCase();
          logger.log(LogLevel.WARN, `[ALERT] [${severity}] ${alert.message}`, {
               type: alert.type,
               value: alert.value,
               threshold: alert.threshold,
          });

          // Keep only last 100 alerts
          if (this.alerts.length > 100) {
               this.alerts.shift();
          }
     }

     /**
      * Get recent alerts
      */
     getRecentAlerts(limit: number = 20): Alert[] {
          return this.alerts.slice(-limit);
     }

     /**
      * Clear alerts (for testing)
      */
     clearAlerts(): void {
          this.alerts = [];
     }

     /**
      * Get dashboard data
      */
     async getDashboardData() {
          const health = await this.checkHealth();
          const metrics = logger.getMetrics();
          const queueMetrics = await getQueueMetrics();
          const recentAlerts = this.getRecentAlerts(10);

          return {
               health,
               metrics,
               queueMetrics,
               recentAlerts,
               timestamp: new Date(),
          };
     }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();
