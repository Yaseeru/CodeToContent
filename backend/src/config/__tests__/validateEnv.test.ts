/**
 * Unit Tests for Environment Variable Validation
 * Tests validation logic for required and snapshot-specific environment variables
 */

import { validateEnvironmentVariables } from '../validateEnv';
import { logger, LogLevel } from '../../services/LoggerService';

// Mock logger to prevent actual logging during tests
jest.mock('../../services/LoggerService', () => ({
     logger: {
          log: jest.fn(),
     },
     LogLevel: {
          INFO: 'INFO',
          WARN: 'WARN',
          ERROR: 'ERROR',
     },
}));

describe('validateEnvironmentVariables', () => {
     const originalEnv = process.env;
     const mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: string | number | null | undefined) => {
          throw new Error(`process.exit(${code})`);
     }) as any);

     beforeEach(() => {
          jest.clearAllMocks();
          process.env = { ...originalEnv };
     });

     afterAll(() => {
          process.env = originalEnv;
          mockExit.mockRestore();
     });

     describe('Required Environment Variables', () => {
          it('should pass validation when all required variables are present', () => {
               process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
               process.env.GITHUB_CLIENT_ID = 'test-client-id';
               process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
               process.env.JWT_SECRET = 'test-jwt-secret';
               process.env.GEMINI_API_KEY = 'test-gemini-key';
               process.env.REDIS_URL = 'redis://localhost:6379';

               expect(() => validateEnvironmentVariables()).not.toThrow();
               expect(logger.log).toHaveBeenCalledWith(
                    LogLevel.INFO,
                    '✓ All required environment variables present'
               );
          });

          it('should exit with code 1 when required variables are missing', () => {
               // Clear all env vars first
               process.env = {};
               process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
               process.env.REDIS_URL = 'redis://localhost:6379';
               // Missing other required variables

               expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
               expect(logger.log).toHaveBeenCalledWith(
                    LogLevel.ERROR,
                    '✗ Missing required environment variables',
                    expect.objectContaining({
                         missing: expect.arrayContaining([
                              'GITHUB_CLIENT_ID',
                              'GITHUB_CLIENT_SECRET',
                              'JWT_SECRET',
                              'GEMINI_API_KEY',
                         ]),
                    })
               );
          });

          it('should list all missing required variables', () => {
               process.env = {}; // Clear all env vars

               expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
               expect(logger.log).toHaveBeenCalledWith(
                    LogLevel.ERROR,
                    '✗ Missing required environment variables',
                    expect.objectContaining({
                         missing: [
                              'MONGODB_URI',
                              'GITHUB_CLIENT_ID',
                              'GITHUB_CLIENT_SECRET',
                              'JWT_SECRET',
                              'GEMINI_API_KEY',
                              'REDIS_URL',
                         ],
                    })
               );
          });
     });

     describe('Snapshot Configuration Validation', () => {
          beforeEach(() => {
               // Set all required variables for these tests
               process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
               process.env.GITHUB_CLIENT_ID = 'test-client-id';
               process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
               process.env.JWT_SECRET = 'test-jwt-secret';
               process.env.GEMINI_API_KEY = 'test-gemini-key';
               process.env.REDIS_URL = 'redis://localhost:6379';
          });

          describe('SNAPSHOT_STORAGE_TYPE', () => {
               it('should accept local storage type', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.INFO,
                         '✓ Snapshot configuration validated (storage: local)'
                    );
               });

               it('should accept s3 storage type with valid configuration', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 's3';
                    process.env.AWS_S3_BUCKET = 'test-bucket';
                    process.env.AWS_S3_REGION = 'us-east-1';
                    process.env.AWS_ACCESS_KEY_ID = 'test-key';
                    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.INFO,
                         '✓ Snapshot configuration validated (storage: s3)'
                    );
               });

               it('should reject invalid storage types', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'invalid';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('SNAPSHOT_STORAGE_TYPE must be one of'),
                              ]),
                         })
                    );
               });
          });

          describe('SNAPSHOT_STORAGE_PATH', () => {
               it('should accept valid relative paths', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_STORAGE_PATH = 'uploads/snapshots';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
               });

               it('should reject paths with path traversal attempts', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_STORAGE_PATH = '../../../etc/passwd';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('must not contain ".."'),
                              ]),
                         })
                    );
               });

               it('should reject absolute paths', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_STORAGE_PATH = '/absolute/path';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('must be a relative path'),
                              ]),
                         })
                    );
               });

               it('should reject empty paths', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_STORAGE_PATH = '   ';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('must not be empty'),
                              ]),
                         })
                    );
               });
          });

          describe('Numeric Configuration Validation', () => {
               it('should accept valid numeric values within range', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_MAX_SNIPPETS = '5';
                    process.env.SNAPSHOT_IMAGE_QUALITY = '90';
                    process.env.SNAPSHOT_SELECTION_TIMEOUT_MS = '5000';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
               });

               it('should reject non-numeric values', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_MAX_SNIPPETS = 'not-a-number';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('SNAPSHOT_MAX_SNIPPETS must be a valid number'),
                              ]),
                         })
                    );
               });

               it('should warn about values below minimum', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_MAX_SNIPPETS = '0';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.WARN,
                         '⚠ Snapshot configuration warnings',
                         expect.objectContaining({
                              warnings: expect.arrayContaining([
                                   expect.stringContaining('SNAPSHOT_MAX_SNIPPETS should be at least 1'),
                              ]),
                         })
                    );
               });

               it('should warn about values above maximum', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.SNAPSHOT_IMAGE_QUALITY = '150';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.WARN,
                         '⚠ Snapshot configuration warnings',
                         expect.objectContaining({
                              warnings: expect.arrayContaining([
                                   expect.stringContaining('SNAPSHOT_IMAGE_QUALITY should be at most 100'),
                              ]),
                         })
                    );
               });
          });

          describe('S3 Configuration Validation', () => {
               it('should require S3 bucket and region when storage type is s3', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 's3';
                    // Missing AWS_S3_BUCKET and AWS_S3_REGION

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('S3 storage requires: AWS_S3_BUCKET, AWS_S3_REGION'),
                              ]),
                         })
                    );
               });

               it('should validate S3 bucket name format', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 's3';
                    process.env.AWS_S3_BUCKET = 'Invalid_Bucket_Name';
                    process.env.AWS_S3_REGION = 'us-east-1';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('AWS_S3_BUCKET must be 3-63 characters'),
                              ]),
                         })
                    );
               });

               it('should validate S3 region format', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 's3';
                    process.env.AWS_S3_BUCKET = 'valid-bucket-name';
                    process.env.AWS_S3_REGION = 'invalid-region';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('AWS_S3_REGION format should be like: us-east-1'),
                              ]),
                         })
                    );
               });

               it('should accept valid S3 configuration', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 's3';
                    process.env.AWS_S3_BUCKET = 'my-valid-bucket';
                    process.env.AWS_S3_REGION = 'us-west-2';
                    process.env.AWS_ACCESS_KEY_ID = 'test-key';
                    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.INFO,
                         '✓ Snapshot configuration validated (storage: s3)'
                    );
               });

               it('should warn when AWS credentials are missing (IAM role fallback)', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 's3';
                    process.env.AWS_S3_BUCKET = 'my-valid-bucket';
                    process.env.AWS_S3_REGION = 'us-west-2';
                    // Missing AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

                    expect(() => validateEnvironmentVariables()).not.toThrow();
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.WARN,
                         '⚠ Snapshot configuration warnings',
                         expect.objectContaining({
                              warnings: expect.arrayContaining([
                                   expect.stringContaining('AWS credentials not provided'),
                              ]),
                         })
                    );
               });
          });

          describe('PUPPETEER_EXECUTABLE_PATH', () => {
               it('should log info when custom Puppeteer path is provided', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium';

                    expect(() => validateEnvironmentVariables()).not.toThrow();
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.INFO,
                         'Using custom Puppeteer executable: /usr/bin/chromium'
                    );
               });

               it('should reject empty Puppeteer path', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'local';
                    process.env.PUPPETEER_EXECUTABLE_PATH = '   ';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('PUPPETEER_EXECUTABLE_PATH must not be empty'),
                              ]),
                         })
                    );
               });
          });

          describe('Multiple Validation Errors', () => {
               it('should report all validation errors at once', () => {
                    process.env.SNAPSHOT_STORAGE_TYPE = 'invalid';
                    process.env.SNAPSHOT_STORAGE_PATH = '../../../etc';
                    process.env.SNAPSHOT_MAX_SNIPPETS = 'not-a-number';

                    expect(() => validateEnvironmentVariables()).toThrow('process.exit(1)');
                    expect(logger.log).toHaveBeenCalledWith(
                         LogLevel.ERROR,
                         '✗ Snapshot configuration errors',
                         expect.objectContaining({
                              errors: expect.arrayContaining([
                                   expect.stringContaining('SNAPSHOT_STORAGE_TYPE'),
                                   expect.stringContaining('SNAPSHOT_STORAGE_PATH'),
                                   expect.stringContaining('SNAPSHOT_MAX_SNIPPETS'),
                              ]),
                         })
                    );
               });
          });
     });
});
