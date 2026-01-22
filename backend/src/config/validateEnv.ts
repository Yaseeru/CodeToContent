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

     // Validate optional snapshot configuration
     validateSnapshotConfiguration();
}

/**
 * Validates optional snapshot-related environment variables
 * Logs warnings for invalid values but doesn't exit
 */
function validateSnapshotConfiguration(): void {
     const warnings: string[] = [];

     // Validate SNAPSHOT_STORAGE_TYPE if provided
     if (process.env.SNAPSHOT_STORAGE_TYPE) {
          const validTypes = ['local', 's3', 'gcs', 'azure'];
          if (!validTypes.includes(process.env.SNAPSHOT_STORAGE_TYPE)) {
               warnings.push(`SNAPSHOT_STORAGE_TYPE must be one of: ${validTypes.join(', ')}`);
          }
     }

     // Validate SNAPSHOT_STORAGE_PATH if provided
     if (process.env.SNAPSHOT_STORAGE_PATH) {
          const path = process.env.SNAPSHOT_STORAGE_PATH;
          // Check for path traversal attempts
          if (path.includes('..') || path.startsWith('/')) {
               warnings.push('SNAPSHOT_STORAGE_PATH must be a relative path without ".." or leading "/"');
          }
     }

     // Validate numeric configurations if provided
     const numericConfigs = [
          'SNAPSHOT_MAX_SNIPPETS',
          'SNAPSHOT_SELECTION_TIMEOUT_MS',
          'SNAPSHOT_RENDERING_TIMEOUT_MS',
          'SNAPSHOT_IMAGE_QUALITY',
          'SNAPSHOT_MAX_IMAGE_SIZE_MB',
          'SNAPSHOT_CACHE_TTL_HOURS',
          'SNAPSHOT_CLEANUP_AGE_DAYS',
          'SNAPSHOT_MAX_PER_USER',
          'SNAPSHOT_RATE_LIMIT_PER_HOUR'
     ];

     numericConfigs.forEach(key => {
          if (process.env[key]) {
               const value = parseInt(process.env[key]!, 10);
               if (isNaN(value) || value <= 0) {
                    warnings.push(`${key} must be a positive number`);
               }
          }
     });

     // Validate image quality range (0-100)
     if (process.env.SNAPSHOT_IMAGE_QUALITY) {
          const quality = parseInt(process.env.SNAPSHOT_IMAGE_QUALITY, 10);
          if (!isNaN(quality) && (quality < 0 || quality > 100)) {
               warnings.push('SNAPSHOT_IMAGE_QUALITY must be between 0 and 100');
          }
     }

     // Validate S3 configuration if storage type is S3
     if (process.env.SNAPSHOT_STORAGE_TYPE === 's3') {
          const s3Required = ['AWS_S3_BUCKET', 'AWS_S3_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
          const s3Missing = s3Required.filter(key => !process.env[key]);
          if (s3Missing.length > 0) {
               warnings.push(`S3 storage requires: ${s3Missing.join(', ')}`);
          }

          // Validate region format
          if (process.env.AWS_S3_REGION && !/^[a-z]{2}-[a-z]+-\d{1}$/.test(process.env.AWS_S3_REGION)) {
               warnings.push('AWS_S3_REGION format should be like: us-east-1, eu-west-2, etc.');
          }
     }

     // Validate Puppeteer executable path if provided
     if (process.env.PUPPETEER_EXECUTABLE_PATH) {
          logger.log(LogLevel.INFO, `Using custom Puppeteer executable: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
     }

     // Log warnings if any
     if (warnings.length > 0) {
          logger.log(LogLevel.WARN, '⚠ Snapshot configuration warnings', {
               warnings,
               note: 'Using default values from SNAPSHOT_CONFIG'
          });
     } else if (process.env.SNAPSHOT_STORAGE_TYPE) {
          logger.log(LogLevel.INFO, `✓ Snapshot configuration validated (storage: ${process.env.SNAPSHOT_STORAGE_TYPE})`);
     }
}
