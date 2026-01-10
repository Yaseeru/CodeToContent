/**
 * Structured Logging System
 * 
 * Provides structured logging with different output formats for production and development.
 * Production: JSON format for log aggregation systems
 * Development: Human-readable formatted output
 */

export interface LogContext {
     userId?: string
     requestId?: string
     path?: string
     method?: string
     duration?: number
     [key: string]: unknown
}

export interface Logger {
     debug(message: string, context?: LogContext): void
     info(message: string, context?: LogContext): void
     warn(message: string, context?: LogContext): void
     error(message: string, error: Error, context?: LogContext): void
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
     timestamp: string
     level: LogLevel
     message: string
     context?: LogContext
     error?: {
          name: string
          message: string
          stack?: string
     }
}

class LoggerImpl implements Logger {
     private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
          const isProduction = process.env.NODE_ENV === 'production'

          const entry: LogEntry = {
               timestamp: new Date().toISOString(),
               level,
               message,
          }

          if (context) {
               entry.context = context
          }

          if (error) {
               entry.error = {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
               }
          }

          if (isProduction) {
               // JSON format for production (log aggregation systems)
               console.log(JSON.stringify(entry))
          } else {
               // Formatted output for development
               this.formatDevelopmentLog(entry)
          }
     }

     private formatDevelopmentLog(entry: LogEntry): void {
          const levelColors: Record<LogLevel, string> = {
               debug: '\x1b[36m', // Cyan
               info: '\x1b[32m',  // Green
               warn: '\x1b[33m',  // Yellow
               error: '\x1b[31m', // Red
          }
          const reset = '\x1b[0m'
          const color = levelColors[entry.level]

          // Format: [timestamp] LEVEL: message
          let output = `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}:${reset} ${entry.message}`

          // Add context if present
          if (entry.context && Object.keys(entry.context).length > 0) {
               output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`
          }

          // Add error details if present
          if (entry.error) {
               output += `\n  Error: ${entry.error.name}: ${entry.error.message}`
               if (entry.error.stack) {
                    output += `\n  Stack: ${entry.error.stack}`
               }
          }

          console.log(output)
     }

     debug(message: string, context?: LogContext): void {
          this.log('debug', message, context)
     }

     info(message: string, context?: LogContext): void {
          this.log('info', message, context)
     }

     warn(message: string, context?: LogContext): void {
          this.log('warn', message, context)
     }

     error(message: string, error: Error, context?: LogContext): void {
          this.log('error', message, context, error)
     }
}

// Export singleton logger instance
export const logger: Logger = new LoggerImpl()
