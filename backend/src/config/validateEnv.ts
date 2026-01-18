/**
 * Environment Variable Validation
 * Validates required environment variables at startup to fail fast
 * Part of Critical Fixes - Requirement 3
 */

import { logger, LogLevel } from '../services/LoggerService';

interface RequiredEnvVars {
     MONGODB_URI: string;
     GITHUB_CLIENT_ID: string;
     GITHUB_CLIENT_SECRET: string;
     JWT_SECRET: string;
     GEMINI_API_KEY: string;
     REDIS_URL: string;
}

/**
 * Validates that all required environment variables are present
 * Exits with code 1 if any are missing
 * Logs success message when all are present
 */
export function validateEnvironmentVariables(): void {
     const required: (keyof RequiredEnvVars)[] = [
          'MONGODB_URI',
          'GITHUB_CLIENT_ID',
          'GITHUB_CLIENT_SECRET',
          'JWT_SECRET',
          'GEMINI_API_KEY',
          'REDIS_URL'
     ];

     const missing = required.filter(key => !process.env[key]);

     if (missing.length > 0) {
          logger.log(LogLevel.ERROR, '✗ Missing required environment variables', {
               missing,
               help: 'Copy .env.example to .env and fill in the values',
               troubleshooting: [
                    '1. Check if .env file exists in the backend directory',
                    '2. Copy .env.example to .env if it doesn\'t exist',
                    '3. Fill in all required values in .env',
                    '4. Ensure .env is in the same directory as package.json'
               ]
          });
          process.exit(1);
     }

     logger.log(LogLevel.INFO, '✓ All required environment variables present');
}
