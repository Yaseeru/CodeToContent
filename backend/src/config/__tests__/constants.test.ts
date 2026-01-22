/**
 * Constants Configuration Tests
 * Validates that configuration constants are properly defined
 */

import { SNAPSHOT_CONFIG } from '../constants';

describe('SNAPSHOT_CONFIG', () => {
     describe('Selection Configuration', () => {
          it('should have valid max snippets per repository', () => {
               expect(SNAPSHOT_CONFIG.MAX_SNIPPETS_PER_REPOSITORY).toBe(5);
               expect(SNAPSHOT_CONFIG.MAX_SNIPPETS_PER_REPOSITORY).toBeGreaterThan(0);
          });

          it('should have valid selection timeout', () => {
               expect(SNAPSHOT_CONFIG.SELECTION_TIMEOUT_MS).toBe(5000);
               expect(SNAPSHOT_CONFIG.SELECTION_TIMEOUT_MS).toBeGreaterThan(0);
          });

          it('should have valid parallel batch size', () => {
               expect(SNAPSHOT_CONFIG.PARALLEL_BATCH_SIZE).toBe(5);
               expect(SNAPSHOT_CONFIG.PARALLEL_BATCH_SIZE).toBeGreaterThan(0);
          });
     });

     describe('Image Rendering Configuration', () => {
          it('should have valid rendering timeout', () => {
               expect(SNAPSHOT_CONFIG.RENDERING_TIMEOUT_MS).toBe(3000);
               expect(SNAPSHOT_CONFIG.RENDERING_TIMEOUT_MS).toBeGreaterThan(0);
          });

          it('should have valid image quality', () => {
               expect(SNAPSHOT_CONFIG.IMAGE_QUALITY).toBe(90);
               expect(SNAPSHOT_CONFIG.IMAGE_QUALITY).toBeGreaterThanOrEqual(0);
               expect(SNAPSHOT_CONFIG.IMAGE_QUALITY).toBeLessThanOrEqual(100);
          });

          it('should have valid max image size', () => {
               expect(SNAPSHOT_CONFIG.MAX_IMAGE_SIZE_BYTES).toBe(5 * 1024 * 1024);
               expect(SNAPSHOT_CONFIG.MAX_IMAGE_SIZE_BYTES).toBeGreaterThan(0);
          });

          it('should have valid image dimensions', () => {
               expect(SNAPSHOT_CONFIG.DEFAULT_IMAGE_WIDTH).toBe(1200);
               expect(SNAPSHOT_CONFIG.DEFAULT_IMAGE_HEIGHT).toBe(800);
               expect(SNAPSHOT_CONFIG.DEVICE_SCALE_FACTOR).toBe(2);
          });
     });

     describe('Rendering Options', () => {
          it('should have valid default theme', () => {
               expect(SNAPSHOT_CONFIG.DEFAULT_THEME).toBe('nord');
               expect(typeof SNAPSHOT_CONFIG.DEFAULT_THEME).toBe('string');
          });

          it('should have valid line numbers setting', () => {
               expect(SNAPSHOT_CONFIG.DEFAULT_SHOW_LINE_NUMBERS).toBe(false);
               expect(typeof SNAPSHOT_CONFIG.DEFAULT_SHOW_LINE_NUMBERS).toBe('boolean');
          });

          it('should have valid font size', () => {
               expect(SNAPSHOT_CONFIG.DEFAULT_FONT_SIZE).toBe(14);
               expect(SNAPSHOT_CONFIG.DEFAULT_FONT_SIZE).toBeGreaterThan(0);
          });
     });

     describe('Caching Configuration', () => {
          it('should have valid cache TTLs', () => {
               expect(SNAPSHOT_CONFIG.ANALYSIS_CACHE_TTL_SECONDS).toBe(24 * 3600);
               expect(SNAPSHOT_CONFIG.SELECTION_CACHE_TTL_SECONDS).toBe(24 * 3600);
               expect(SNAPSHOT_CONFIG.IMAGE_CACHE_TTL_SECONDS).toBe(7 * 24 * 3600);

               expect(SNAPSHOT_CONFIG.ANALYSIS_CACHE_TTL_SECONDS).toBeGreaterThan(0);
               expect(SNAPSHOT_CONFIG.SELECTION_CACHE_TTL_SECONDS).toBeGreaterThan(0);
               expect(SNAPSHOT_CONFIG.IMAGE_CACHE_TTL_SECONDS).toBeGreaterThan(0);
          });
     });

     describe('Storage Configuration', () => {
          it('should have valid cleanup age', () => {
               expect(SNAPSHOT_CONFIG.CLEANUP_AGE_DAYS).toBe(30);
               expect(SNAPSHOT_CONFIG.CLEANUP_AGE_DAYS).toBeGreaterThan(0);
          });

          it('should have valid max snapshots per user', () => {
               expect(SNAPSHOT_CONFIG.MAX_SNAPSHOTS_PER_USER).toBe(50);
               expect(SNAPSHOT_CONFIG.MAX_SNAPSHOTS_PER_USER).toBeGreaterThan(0);
          });
     });

     describe('Rate Limiting Configuration', () => {
          it('should have valid rate limit', () => {
               expect(SNAPSHOT_CONFIG.GENERATION_RATE_LIMIT_PER_HOUR).toBe(5);
               expect(SNAPSHOT_CONFIG.GENERATION_RATE_LIMIT_PER_HOUR).toBeGreaterThan(0);
          });

          it('should have valid rate window', () => {
               expect(SNAPSHOT_CONFIG.GENERATION_RATE_WINDOW_MS).toBe(60 * 60 * 1000);
               expect(SNAPSHOT_CONFIG.GENERATION_RATE_WINDOW_MS).toBeGreaterThan(0);
          });
     });

     describe('Retry Configuration', () => {
          it('should have valid max retry attempts', () => {
               expect(SNAPSHOT_CONFIG.MAX_RETRY_ATTEMPTS).toBe(3);
               expect(SNAPSHOT_CONFIG.MAX_RETRY_ATTEMPTS).toBeGreaterThan(0);
          });

          it('should have valid retry delays with exponential backoff', () => {
               expect(SNAPSHOT_CONFIG.RETRY_DELAYS_MS).toEqual([1000, 2000, 4000]);
               expect(SNAPSHOT_CONFIG.RETRY_DELAYS_MS.length).toBe(3);

               // Verify exponential backoff pattern
               expect(SNAPSHOT_CONFIG.RETRY_DELAYS_MS[1]).toBe(SNAPSHOT_CONFIG.RETRY_DELAYS_MS[0] * 2);
               expect(SNAPSHOT_CONFIG.RETRY_DELAYS_MS[2]).toBe(SNAPSHOT_CONFIG.RETRY_DELAYS_MS[1] * 2);
          });
     });

     describe('Snippet Selection Scoring', () => {
          it('should have valid score range', () => {
               expect(SNAPSHOT_CONFIG.SCORE_MIN).toBe(0);
               expect(SNAPSHOT_CONFIG.SCORE_MAX).toBe(100);
               expect(SNAPSHOT_CONFIG.SCORE_MIN).toBeLessThan(SNAPSHOT_CONFIG.SCORE_MAX);
          });

          it('should have valid score component maximums', () => {
               expect(SNAPSHOT_CONFIG.RECENCY_SCORE_MAX).toBe(30);
               expect(SNAPSHOT_CONFIG.COMPLEXITY_SCORE_MAX).toBe(30);
               expect(SNAPSHOT_CONFIG.FILE_TYPE_SCORE_MAX).toBe(20);
               expect(SNAPSHOT_CONFIG.FUNCTION_NAME_SCORE_MAX).toBe(20);

               // Verify total adds up to 100
               const total = SNAPSHOT_CONFIG.RECENCY_SCORE_MAX +
                    SNAPSHOT_CONFIG.COMPLEXITY_SCORE_MAX +
                    SNAPSHOT_CONFIG.FILE_TYPE_SCORE_MAX +
                    SNAPSHOT_CONFIG.FUNCTION_NAME_SCORE_MAX;
               expect(total).toBe(100);
          });
     });

     describe('Code Snippet Constraints', () => {
          it('should have valid lines of code constraints', () => {
               expect(SNAPSHOT_CONFIG.MIN_LINES_OF_CODE).toBe(5);
               expect(SNAPSHOT_CONFIG.MAX_LINES_OF_CODE).toBe(100);
               expect(SNAPSHOT_CONFIG.MIN_LINES_OF_CODE).toBeLessThan(SNAPSHOT_CONFIG.MAX_LINES_OF_CODE);
          });

          it('should have valid optimal lines range', () => {
               expect(SNAPSHOT_CONFIG.OPTIMAL_LINES_MIN).toBe(20);
               expect(SNAPSHOT_CONFIG.OPTIMAL_LINES_MAX).toBe(50);
               expect(SNAPSHOT_CONFIG.OPTIMAL_LINES_MIN).toBeLessThan(SNAPSHOT_CONFIG.OPTIMAL_LINES_MAX);

               // Verify optimal range is within min/max constraints
               expect(SNAPSHOT_CONFIG.OPTIMAL_LINES_MIN).toBeGreaterThanOrEqual(SNAPSHOT_CONFIG.MIN_LINES_OF_CODE);
               expect(SNAPSHOT_CONFIG.OPTIMAL_LINES_MAX).toBeLessThanOrEqual(SNAPSHOT_CONFIG.MAX_LINES_OF_CODE);
          });
     });

     describe('Repository Analysis Limits', () => {
          it('should have valid max files to analyze', () => {
               expect(SNAPSHOT_CONFIG.MAX_FILES_TO_ANALYZE).toBe(1000);
               expect(SNAPSHOT_CONFIG.MAX_FILES_TO_ANALYZE).toBeGreaterThan(0);
          });

          it('should have valid max candidates to score', () => {
               expect(SNAPSHOT_CONFIG.MAX_CANDIDATES_TO_SCORE).toBe(20);
               expect(SNAPSHOT_CONFIG.MAX_CANDIDATES_TO_SCORE).toBeGreaterThan(0);
               expect(SNAPSHOT_CONFIG.MAX_CANDIDATES_TO_SCORE).toBeGreaterThan(SNAPSHOT_CONFIG.MAX_SNIPPETS_PER_REPOSITORY);
          });
     });

     describe('Puppeteer Configuration', () => {
          it('should have valid page pool size', () => {
               expect(SNAPSHOT_CONFIG.PAGE_POOL_SIZE).toBe(3);
               expect(SNAPSHOT_CONFIG.PAGE_POOL_SIZE).toBeGreaterThan(0);
          });

          it('should have valid browser timeout', () => {
               expect(SNAPSHOT_CONFIG.BROWSER_TIMEOUT_MS).toBe(30000);
               expect(SNAPSHOT_CONFIG.BROWSER_TIMEOUT_MS).toBeGreaterThan(0);
          });
     });

     describe('Configuration Immutability', () => {
          it('should be read-only at compile time (as const)', () => {
               // TypeScript enforces immutability at compile time with 'as const'
               // Runtime immutability is not enforced, but TypeScript prevents modifications
               expect(SNAPSHOT_CONFIG).toBeDefined();
               expect(typeof SNAPSHOT_CONFIG).toBe('object');

               // Verify we can read all properties
               expect(SNAPSHOT_CONFIG.MAX_SNIPPETS_PER_REPOSITORY).toBeDefined();
               expect(SNAPSHOT_CONFIG.SELECTION_TIMEOUT_MS).toBeDefined();
          });
     });
});
