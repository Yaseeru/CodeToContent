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
     const errors: string[] = [];

     // Validate SNAPSHOT_STORAGE_TYPE if provided
     if (process.env.SNAPSHOT_STORAGE_TYPE) {
          const validTypes = ['local', 's3', 'gcs', 'azure'];
          if (!validTypes.includes(process.env.SNAPSHOT_STORAGE_TYPE)) {
               errors.push(`SNAPSHOT_STORAGE_TYPE must be one of: ${validTypes.join(', ')} (got: ${process.env.SNAPSHOT_STORAGE_TYPE})`);
          }
     }

     // Validate SNAPSHOT_STORAGE_PATH if provided
     if (process.env.SNAPSHOT_STORAGE_PATH) {
          const path = process.env.SNAPSHOT_STORAGE_PATH;
          // Check for path traversal attempts
          if (path.includes('..')) {
               errors.push('SNAPSHOT_STORAGE_PATH must not contain ".." (path traversal attempt)');
          }
          if (path.startsWith('/')) {
               errors.push('SNAPSHOT_STORAGE_PATH must be a relative path (no leading "/")');
          }
          if (path.trim() === '') {
               errors.push('SNAPSHOT_STORAGE_PATH must not be empty');
          }
     }

     // Validate numeric configurations if provided
     const numericConfigs: Record<string, { min?: number; max?: number }> = {
          'SNAPSHOT_MAX_SNIPPETS': { min: 1, max: 20 },
          'SNAPSHOT_SELECTION_TIMEOUT_MS': { min: 1000, max: 30000 },
          'SNAPSHOT_RENDERING_TIMEOUT_MS': { min: 1000, max: 10000 },
          'SNAPSHOT_IMAGE_QUALITY': { min: 1, max: 100 },
          'SNAPSHOT_MAX_IMAGE_SIZE_MB': { min: 1, max: 50 },
          'SNAPSHOT_CACHE_TTL_HOURS': { min: 1, max: 168 },
          'SNAPSHOT_CLEANUP_AGE_DAYS': { min: 1, max: 365 },
          'SNAPSHOT_MAX_PER_USER': { min: 1, max: 1000 },
          'SNAPSHOT_RATE_LIMIT_PER_HOUR': { min: 1, max: 100 },
          'SNAPSHOT_PARALLEL_BATCH_SIZE': { min: 1, max: 10 }
     };

     Object.entries(numericConfigs).forEach(([key, { min, max }]) => {
          if (process.env[key]) {
               const value = parseInt(process.env[key]!, 10);
               if (isNaN(value)) {
                    errors.push(`${key} must be a valid number (got: ${process.env[key]})`);
               } else if (min !== undefined && value < min) {
                    warnings.push(`${key} should be at least ${min} (got: ${value})`);
               } else if (max !== undefined && value > max) {
                    warnings.push(`${key} should be at most ${max} (got: ${value})`);
               }
          }
     });

     // Validate S3 configuration if storage type is S3
     if (process.env.SNAPSHOT_STORAGE_TYPE === 's3') {
          const s3Required = ['AWS_S3_BUCKET', 'AWS_S3_REGION'];
          const s3Missing = s3Required.filter(key => !process.env[key]);
          if (s3Missing.length > 0) {
               errors.push(`S3 storage requires: ${s3Missing.join(', ')}`);
          }

          // Validate bucket name format
          if (process.env.AWS_S3_BUCKET) {
               const bucket = process.env.AWS_S3_BUCKET;
               if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket) || bucket.length < 3 || bucket.length > 63) {
                    errors.push('AWS_S3_BUCKET must be 3-63 characters, lowercase, alphanumeric with dots/hyphens');
               }
          }

          // Validate region format
          if (process.env.AWS_S3_REGION) {
               const region = process.env.AWS_S3_REGION;
               if (!/^[a-z]{2}-[a-z]+-\d{1}$/.test(region)) {
                    errors.push(`AWS_S3_REGION format should be like: us-east-1, eu-west-2 (got: ${region})`);
               }
          }

          // Warn if credentials are missing (IAM role might be used)
          if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
               warnings.push('AWS credentials not provided - will attempt to use IAM role or instance profile');
          }
     }

     // Validate Puppeteer executable path if provided
     if (process.env.PUPPETEER_EXECUTABLE_PATH) {
          const execPath = process.env.PUPPETEER_EXECUTABLE_PATH;
          if (execPath.trim() === '') {
               errors.push('PUPPETEER_EXECUTABLE_PATH must not be empty if provided');
          } else {
               logger.log(LogLevel.INFO, `Using custom Puppeteer executable: ${execPath}`);
          }
     }

     // Log errors and exit if critical issues found
     if (errors.length > 0) {
          logger.log(LogLevel.ERROR, '✗ Snapshot configuration errors', {
               errors,
               help: 'Check .env.example for valid configuration values',
               troubleshooting: [
                    '1. Review SNAPSHOT_* variables in .env file',
                    '2. Ensure all values match the expected format',
                    '3. For S3 storage, verify AWS credentials and bucket configuration',
                    '4. Check that numeric values are within valid ranges'
               ]
          });
          process.exit(1);
     }

     // Log warnings if any
     if (warnings.length > 0) {
          logger.log(LogLevel.WARN, '⚠ Snapshot configuration warnings', {
               warnings,
               note: 'Using default values or proceeding with caution'
          });
     }

     // Log success if snapshot configuration is present
     if (process.env.SNAPSHOT_STORAGE_TYPE) {
          logger.log(LogLevel.INFO, `✓ Snapshot configuration validated (storage: ${process.env.SNAPSHOT_STORAGE_TYPE})`);
     }
}
