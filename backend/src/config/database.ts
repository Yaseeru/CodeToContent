import mongoose from 'mongoose';
import { logger, LogLevel } from '../services/LoggerService';
import { DATABASE_CONFIG } from './constants';

/**
 * Connect to MongoDB with retry logic and exponential backoff
 * Implements Requirements 7.1-7.10 from critical-fixes spec
 */
export const connectDatabase = async (): Promise<void> => {
     const maxRetries = DATABASE_CONFIG.MAX_RETRIES;
     const delays = DATABASE_CONFIG.RETRY_DELAYS_MS;

     // Validate URI format before attempting connection (Requirement 7.9)
     const uri = process.env.MONGODB_URI;
     if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
          logger.log(LogLevel.ERROR, '✗ Invalid MongoDB URI format', {
               help: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
               example: 'mongodb://localhost:27017/code-to-content or mongodb+srv://user:pass@cluster.mongodb.net/dbname'
          });
          process.exit(1);
     }

     // Attempt connection with retry logic (Requirements 7.3, 7.4, 7.5)
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
               await mongoose.connect(uri);

               // Log successful connection with database name (Requirement 7.10)
               const dbName = mongoose.connection.db?.databaseName || 'unknown';
               logger.log(LogLevel.INFO, '✓ Database connected successfully', {
                    database: dbName,
                    attempt: attempt > 1 ? attempt : undefined
               });
               return;

          } catch (error: any) {
               const isLastAttempt = attempt === maxRetries;

               // Log detailed error with redacted password (Requirements 7.1, 7.2, 7.8)
               const redactedUri = uri.replace(/:[^:]*@/, ':****@');
               logger.log(LogLevel.ERROR, `✗ Database connection failed (attempt ${attempt}/${maxRetries})`, {
                    error: error.message,
                    stack: error.stack, // Full stack trace (Requirement 7.1)
                    uri: redactedUri, // Redacted connection string (Requirement 7.2)
                    troubleshooting: [
                         '1. Verify MongoDB is running (try: mongosh or mongo)',
                         '2. Check MONGODB_URI in .env file matches your MongoDB instance',
                         '3. Verify network connectivity to MongoDB server',
                         '4. Check MongoDB logs for errors',
                         '5. Ensure database user has correct permissions',
                         '6. For MongoDB Atlas, check IP whitelist settings',
                         '7. Verify firewall rules allow MongoDB port (default: 27017)'
                    ]
               });

               if (isLastAttempt) {
                    // All retries exhausted (Requirement 7.6)
                    logger.log(LogLevel.ERROR, '✗ All database connection attempts failed', {
                         totalAttempts: maxRetries,
                         finalError: error.message
                    });
                    process.exit(1);
               }

               // Wait before retry with exponential backoff (Requirement 7.5)
               const delay = delays[attempt - 1];
               logger.log(LogLevel.INFO, `Retrying database connection in ${delay}ms...`, {
                    nextAttempt: attempt + 1,
                    maxRetries
               });
               await new Promise(resolve => setTimeout(resolve, delay));
          }
     }
};

/**
 * Health check helper function for runtime monitoring
 * Implements Requirement 7.10
 */
export const checkDatabaseHealth = async (): Promise<{ connected: boolean; error?: string; database?: string }> => {
     try {
          // Check if mongoose is connected
          if (mongoose.connection.readyState !== 1) {
               return {
                    connected: false,
                    error: 'Mongoose connection state is not connected'
               };
          }

          // Ping the database to verify connectivity
          await mongoose.connection.db?.admin().ping();

          return {
               connected: true,
               database: mongoose.connection.db?.databaseName
          };
     } catch (error: any) {
          return {
               connected: false,
               error: error.message
          };
     }
};

export const disconnectDatabase = async (): Promise<void> => {
     try {
          await mongoose.disconnect();
          logger.log(LogLevel.INFO, 'MongoDB disconnected successfully');
     } catch (error: any) {
          logger.log(LogLevel.ERROR, 'MongoDB disconnection error', {
               error: error.message
          });
     }
};
