/**
 * Logger Service for Voice Engine
 * Provides structured logging for monitoring and debugging
 */

export enum LogLevel {
     DEBUG = 'DEBUG',
     INFO = 'INFO',
     WARN = 'WARN',
     ERROR = 'ERROR',
}

export interface LogContext {
     userId?: string;
     contentId?: string;
     jobId?: string;
     [key: string]: any;
}

export interface GeminiAPILog {
     operation: 'style_analysis' | 'content_generation' | 'tone_shift_detection';
     userId: string;
     promptTokens: number;
     completionTokens: number;
     totalTokens: number;
     latencyMs: number;
     success: boolean;
     error?: string;
     timestamp: Date;
}

export interface ProfileUpdateLog {
     userId: string;
     updateType: 'manual' | 'feedback' | 'archetype' | 'aggregation';
     before: any;
     after: any;
     changedFields: string[];
     learningIterations: number;
     timestamp: Date;
}

export interface LearningJobFailureLog {
     jobId: string;
     userId: string;
     contentId: string;
     attemptNumber: number;
     error: string;
     stackTrace?: string;
     context: any;
     timestamp: Date;
}

export class LoggerService {
     private static instance: LoggerService;
     private geminiAPILogs: GeminiAPILog[] = [];
     private profileUpdateLogs: ProfileUpdateLog[] = [];
     private learningJobFailureLogs: LearningJobFailureLog[] = [];

     // Metrics
     private metrics = {
          profileCreationCount: 0,
          contentGenerationCount: 0,
          contentGenerationWithProfileCount: 0,
          learningJobProcessingTimes: [] as number[],
          geminiAPICallCount: 0,
          geminiAPIErrorCount: 0,
          profileUpdateCount: 0,
     };

     private constructor() { }

     static getInstance(): LoggerService {
          if (!LoggerService.instance) {
               LoggerService.instance = new LoggerService();
          }
          return LoggerService.instance;
     }

     /**
      * Log a general message
      */
     log(level: LogLevel, message: string, context?: LogContext): void {
          const timestamp = new Date().toISOString();
          const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
          console.log(`[${timestamp}] [${level}] ${message}${contextStr}`);
     }

     /**
      * Log Gemini API call with token usage
      */
     logGeminiAPICall(log: GeminiAPILog): void {
          this.geminiAPILogs.push(log);
          this.metrics.geminiAPICallCount++;

          if (!log.success) {
               this.metrics.geminiAPIErrorCount++;
          }

          const status = log.success ? 'SUCCESS' : 'FAILED';
          const errorMsg = log.error ? ` | Error: ${log.error}` : '';

          console.log(
               `[${log.timestamp.toISOString()}] [GEMINI_API] ${log.operation} | ` +
               `User: ${log.userId} | Status: ${status} | ` +
               `Tokens: ${log.totalTokens} (prompt: ${log.promptTokens}, completion: ${log.completionTokens}) | ` +
               `Latency: ${log.latencyMs}ms${errorMsg}`
          );

          // Keep only last 1000 logs in memory
          if (this.geminiAPILogs.length > 1000) {
               this.geminiAPILogs.shift();
          }
     }

     /**
      * Log profile update with before/after
      */
     logProfileUpdate(log: ProfileUpdateLog): void {
          this.profileUpdateLogs.push(log);
          this.metrics.profileUpdateCount++;

          console.log(
               `[${log.timestamp.toISOString()}] [PROFILE_UPDATE] ${log.updateType} | ` +
               `User: ${log.userId} | Changed Fields: ${log.changedFields.join(', ')} | ` +
               `Learning Iterations: ${log.learningIterations}`
          );

          // Log detailed before/after for debugging
          console.log(`[PROFILE_UPDATE] Before:`, JSON.stringify(log.before, null, 2));
          console.log(`[PROFILE_UPDATE] After:`, JSON.stringify(log.after, null, 2));

          // Keep only last 500 logs in memory
          if (this.profileUpdateLogs.length > 500) {
               this.profileUpdateLogs.shift();
          }
     }

     /**
      * Log learning job failure with context
      */
     logLearningJobFailure(log: LearningJobFailureLog): void {
          this.learningJobFailureLogs.push(log);

          console.error(
               `[${log.timestamp.toISOString()}] [LEARNING_JOB_FAILURE] Job: ${log.jobId} | ` +
               `User: ${log.userId} | Content: ${log.contentId} | ` +
               `Attempt: ${log.attemptNumber} | Error: ${log.error}`
          );

          if (log.stackTrace) {
               console.error(`[LEARNING_JOB_FAILURE] Stack Trace:`, log.stackTrace);
          }

          console.error(`[LEARNING_JOB_FAILURE] Context:`, JSON.stringify(log.context, null, 2));

          // Keep only last 500 logs in memory
          if (this.learningJobFailureLogs.length > 500) {
               this.learningJobFailureLogs.shift();
          }
     }

     /**
      * Track profile creation
      */
     trackProfileCreation(): void {
          this.metrics.profileCreationCount++;
          this.log(LogLevel.INFO, 'Profile created', { metric: 'profile_creation' });
     }

     /**
      * Track content generation
      */
     trackContentGeneration(usedProfile: boolean): void {
          this.metrics.contentGenerationCount++;
          if (usedProfile) {
               this.metrics.contentGenerationWithProfileCount++;
          }
          this.log(LogLevel.INFO, 'Content generated', {
               metric: 'content_generation',
               usedProfile
          });
     }

     /**
      * Track learning job processing time
      */
     trackLearningJobProcessingTime(timeMs: number): void {
          this.metrics.learningJobProcessingTimes.push(timeMs);

          // Keep only last 1000 measurements
          if (this.metrics.learningJobProcessingTimes.length > 1000) {
               this.metrics.learningJobProcessingTimes.shift();
          }

          this.log(LogLevel.INFO, `Learning job processed in ${timeMs}ms`, {
               metric: 'learning_job_processing_time',
               timeMs
          });
     }

     /**
      * Get metrics summary
      */
     getMetrics() {
          const avgProcessingTime = this.metrics.learningJobProcessingTimes.length > 0
               ? this.metrics.learningJobProcessingTimes.reduce((a, b) => a + b, 0) /
               this.metrics.learningJobProcessingTimes.length
               : 0;

          const profileUsageRate = this.metrics.contentGenerationCount > 0
               ? (this.metrics.contentGenerationWithProfileCount / this.metrics.contentGenerationCount) * 100
               : 0;

          const geminiErrorRate = this.metrics.geminiAPICallCount > 0
               ? (this.metrics.geminiAPIErrorCount / this.metrics.geminiAPICallCount) * 100
               : 0;

          return {
               profileCreationCount: this.metrics.profileCreationCount,
               contentGenerationCount: this.metrics.contentGenerationCount,
               contentGenerationWithProfileCount: this.metrics.contentGenerationWithProfileCount,
               profileUsageRate: Math.round(profileUsageRate * 100) / 100,
               avgLearningJobProcessingTimeMs: Math.round(avgProcessingTime),
               geminiAPICallCount: this.metrics.geminiAPICallCount,
               geminiAPIErrorCount: this.metrics.geminiAPIErrorCount,
               geminiErrorRate: Math.round(geminiErrorRate * 100) / 100,
               profileUpdateCount: this.metrics.profileUpdateCount,
          };
     }

     /**
      * Get recent Gemini API logs
      */
     getRecentGeminiAPILogs(limit: number = 50): GeminiAPILog[] {
          return this.geminiAPILogs.slice(-limit);
     }

     /**
      * Get recent profile update logs
      */
     getRecentProfileUpdateLogs(limit: number = 50): ProfileUpdateLog[] {
          return this.profileUpdateLogs.slice(-limit);
     }

     /**
      * Get recent learning job failure logs
      */
     getRecentLearningJobFailureLogs(limit: number = 50): LearningJobFailureLog[] {
          return this.learningJobFailureLogs.slice(-limit);
     }

     /**
      * Clear all logs (for testing)
      */
     clearLogs(): void {
          this.geminiAPILogs = [];
          this.profileUpdateLogs = [];
          this.learningJobFailureLogs = [];
     }

     /**
      * Reset metrics (for testing)
      */
     resetMetrics(): void {
          this.metrics = {
               profileCreationCount: 0,
               contentGenerationCount: 0,
               contentGenerationWithProfileCount: 0,
               learningJobProcessingTimes: [],
               geminiAPICallCount: 0,
               geminiAPIErrorCount: 0,
               profileUpdateCount: 0,
          };
     }
}

// Export singleton instance
export const logger = LoggerService.getInstance();
