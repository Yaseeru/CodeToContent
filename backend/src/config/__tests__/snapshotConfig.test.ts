/**
 * Unit Tests for Snapshot Configuration
 * Tests configuration loading and validation
 */

import { getSnapshotConfig, EXTENSION_TO_LANGUAGE, DEFAULT_RENDER_OPTIONS } from '../snapshotConfig';

describe('SnapshotConfig', () => {
     const originalEnv = process.env;

     beforeEach(() => {
          // Reset environment before each test
          jest.resetModules();
          process.env = { ...originalEnv };
     });

     afterAll(() => {
          // Restore original environment
          process.env = originalEnv;
     });

     describe('getSnapshotConfig', () => {
          it('should return default configuration when no env vars are set', () => {
               const config = getSnapshotConfig();

               expect(config.storageType).toBe('local');
               expect(config.storagePath).toBe('uploads/snapshots');
               expect(config.maxSnippets).toBe(5);
               expect(config.imageQuality).toBe(90);
               expect(config.maxImageSizeMB).toBe(5);
               expect(config.selectionTimeoutMs).toBe(5000);
               expect(config.renderingTimeoutMs).toBe(3000);
               expect(config.parallelBatchSize).toBe(5);
               expect(config.cacheTTLHours).toBe(24);
               expect(config.cleanupAgeDays).toBe(30);
               expect(config.maxPerUser).toBe(50);
               expect(config.rateLimitPerHour).toBe(5);
          });

          it('should use environment variables when provided', () => {
               process.env.SNAPSHOT_STORAGE_TYPE = 's3';
               process.env.SNAPSHOT_STORAGE_PATH = 'custom/path';
               process.env.SNAPSHOT_MAX_SNIPPETS = '10';
               process.env.SNAPSHOT_IMAGE_QUALITY = '95';
               process.env.SNAPSHOT_MAX_IMAGE_SIZE_MB = '10';

               const config = getSnapshotConfig();

               expect(config.storageType).toBe('s3');
               expect(config.storagePath).toBe('custom/path');
               expect(config.maxSnippets).toBe(10);
               expect(config.imageQuality).toBe(95);
               expect(config.maxImageSizeMB).toBe(10);
          });

          it('should include S3 configuration when storage type is s3', () => {
               process.env.SNAPSHOT_STORAGE_TYPE = 's3';
               process.env.AWS_S3_BUCKET = 'my-bucket';
               process.env.AWS_S3_REGION = 'us-west-2';
               process.env.AWS_ACCESS_KEY_ID = 'test-key';
               process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

               const config = getSnapshotConfig();

               expect(config.s3).toBeDefined();
               expect(config.s3?.bucket).toBe('my-bucket');
               expect(config.s3?.region).toBe('us-west-2');
               expect(config.s3?.accessKeyId).toBe('test-key');
               expect(config.s3?.secretAccessKey).toBe('test-secret');
          });

          it('should not include S3 configuration when storage type is local', () => {
               process.env.SNAPSHOT_STORAGE_TYPE = 'local';

               const config = getSnapshotConfig();

               expect(config.s3).toBeUndefined();
          });

          it('should parse numeric values correctly', () => {
               process.env.SNAPSHOT_SELECTION_TIMEOUT_MS = '10000';
               process.env.SNAPSHOT_RENDERING_TIMEOUT_MS = '5000';
               process.env.SNAPSHOT_PARALLEL_BATCH_SIZE = '10';
               process.env.SNAPSHOT_CACHE_TTL_HOURS = '48';
               process.env.SNAPSHOT_CLEANUP_AGE_DAYS = '60';
               process.env.SNAPSHOT_MAX_PER_USER = '100';
               process.env.SNAPSHOT_RATE_LIMIT_PER_HOUR = '10';

               const config = getSnapshotConfig();

               expect(config.selectionTimeoutMs).toBe(10000);
               expect(config.renderingTimeoutMs).toBe(5000);
               expect(config.parallelBatchSize).toBe(10);
               expect(config.cacheTTLHours).toBe(48);
               expect(config.cleanupAgeDays).toBe(60);
               expect(config.maxPerUser).toBe(100);
               expect(config.rateLimitPerHour).toBe(10);
          });
     });

     describe('DEFAULT_RENDER_OPTIONS', () => {
          it('should have correct default render options', () => {
               expect(DEFAULT_RENDER_OPTIONS.theme).toBe('nord');
               expect(DEFAULT_RENDER_OPTIONS.showLineNumbers).toBe(false);
               expect(DEFAULT_RENDER_OPTIONS.fontSize).toBe(14);
               expect(DEFAULT_RENDER_OPTIONS.padding).toBe(24);
               expect(DEFAULT_RENDER_OPTIONS.backgroundColor).toBe('#2e3440');
               expect(DEFAULT_RENDER_OPTIONS.windowControls).toBe(true);
          });
     });

     describe('EXTENSION_TO_LANGUAGE', () => {
          it('should map TypeScript extensions correctly', () => {
               expect(EXTENSION_TO_LANGUAGE['.ts']).toBe('typescript');
               expect(EXTENSION_TO_LANGUAGE['.tsx']).toBe('typescript');
          });

          it('should map JavaScript extensions correctly', () => {
               expect(EXTENSION_TO_LANGUAGE['.js']).toBe('javascript');
               expect(EXTENSION_TO_LANGUAGE['.jsx']).toBe('javascript');
          });

          it('should map Python extension correctly', () => {
               expect(EXTENSION_TO_LANGUAGE['.py']).toBe('python');
          });

          it('should map common languages correctly', () => {
               expect(EXTENSION_TO_LANGUAGE['.java']).toBe('java');
               expect(EXTENSION_TO_LANGUAGE['.go']).toBe('go');
               expect(EXTENSION_TO_LANGUAGE['.rs']).toBe('rust');
               expect(EXTENSION_TO_LANGUAGE['.cpp']).toBe('cpp');
               expect(EXTENSION_TO_LANGUAGE['.c']).toBe('c');
               expect(EXTENSION_TO_LANGUAGE['.rb']).toBe('ruby');
               expect(EXTENSION_TO_LANGUAGE['.php']).toBe('php');
          });

          it('should map markup and config files correctly', () => {
               expect(EXTENSION_TO_LANGUAGE['.html']).toBe('html');
               expect(EXTENSION_TO_LANGUAGE['.css']).toBe('css');
               expect(EXTENSION_TO_LANGUAGE['.json']).toBe('json');
               expect(EXTENSION_TO_LANGUAGE['.yaml']).toBe('yaml');
               expect(EXTENSION_TO_LANGUAGE['.yml']).toBe('yaml');
               expect(EXTENSION_TO_LANGUAGE['.md']).toBe('markdown');
          });
     });
});
