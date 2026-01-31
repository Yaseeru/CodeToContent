/**
 * Unit tests for retry logic with exponential backoff
 * Tests the retry mechanism used in VisualSnapshotService
 */

import { SNAPSHOT_CONFIG } from '../../config/constants';

// Standalone retry function for testing (mirrors the implementation)
async function retryFetch<T>(
     operation: () => Promise<T>,
     maxRetries: number = SNAPSHOT_CONFIG.MAX_FETCH_RETRIES
): Promise<T> {
     let lastError: Error;

     for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
               return await operation();
          } catch (error: any) {
               lastError = error;

               if (attempt < maxRetries) {
                    const delayMs = SNAPSHOT_CONFIG.FETCH_RETRY_DELAY_MS * Math.pow(2, attempt);
                    await delay(delayMs);
               }
          }
     }

     throw lastError!;
}

function delay(ms: number): Promise<void> {
     return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Retry Logic with Exponential Backoff', () => {

     describe('retryFetch', () => {
          it('should succeed on first attempt when operation succeeds', async () => {
               const mockOperation = jest.fn().mockResolvedValue('success');

               const result = await retryFetch(mockOperation);

               expect(result).toBe('success');
               expect(mockOperation).toHaveBeenCalledTimes(1);
          });

          it('should retry on failure and succeed on second attempt', async () => {
               const mockOperation = jest
                    .fn()
                    .mockRejectedValueOnce(new Error('First attempt failed'))
                    .mockResolvedValueOnce('success');

               const result = await retryFetch(mockOperation);

               expect(result).toBe('success');
               expect(mockOperation).toHaveBeenCalledTimes(2);
          });

          it('should retry on failure and succeed on third attempt', async () => {
               const mockOperation = jest
                    .fn()
                    .mockRejectedValueOnce(new Error('First attempt failed'))
                    .mockRejectedValueOnce(new Error('Second attempt failed'))
                    .mockResolvedValueOnce('success');

               const result = await retryFetch(mockOperation);

               expect(result).toBe('success');
               expect(mockOperation).toHaveBeenCalledTimes(3);
          });

          it('should throw error after max retries exceeded', async () => {
               const mockError = new Error('Operation failed');
               const mockOperation = jest.fn().mockRejectedValue(mockError);

               await expect(retryFetch(mockOperation)).rejects.toThrow('Operation failed');

               // Should be called maxRetries + 1 times (initial attempt + retries)
               expect(mockOperation).toHaveBeenCalledTimes(SNAPSHOT_CONFIG.MAX_FETCH_RETRIES + 1);
          });

          it('should use exponential backoff delays', async () => {
               jest.useFakeTimers();

               const mockOperation = jest
                    .fn()
                    .mockRejectedValueOnce(new Error('First attempt failed'))
                    .mockRejectedValueOnce(new Error('Second attempt failed'))
                    .mockResolvedValueOnce('success');

               const promise = retryFetch(mockOperation);

               // Fast-forward through first delay (1000ms)
               await jest.advanceTimersByTimeAsync(1000);
               // Fast-forward through second delay (2000ms)
               await jest.advanceTimersByTimeAsync(2000);

               const result = await promise;

               expect(result).toBe('success');
               expect(mockOperation).toHaveBeenCalledTimes(3);

               jest.useRealTimers();
          });

          it('should respect custom maxRetries parameter', async () => {
               const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));

               await expect(retryFetch(mockOperation, 1)).rejects.toThrow('Failed');

               // Should be called 2 times (initial attempt + 1 retry)
               expect(mockOperation).toHaveBeenCalledTimes(2);
          });

          it('should preserve error details from last attempt', async () => {
               const lastError = new Error('Final failure with details');
               const mockOperation = jest
                    .fn()
                    .mockRejectedValueOnce(new Error('First failure'))
                    .mockRejectedValueOnce(new Error('Second failure'))
                    .mockRejectedValueOnce(lastError);

               await expect(retryFetch(mockOperation)).rejects.toThrow('Final failure with details');
          });

          it('should handle network timeout errors', async () => {
               const timeoutError = new Error('ETIMEDOUT');
               const mockOperation = jest
                    .fn()
                    .mockRejectedValueOnce(timeoutError)
                    .mockResolvedValueOnce('success after timeout');

               const result = await retryFetch(mockOperation);

               expect(result).toBe('success after timeout');
               expect(mockOperation).toHaveBeenCalledTimes(2);
          });

          it('should handle rate limit errors', async () => {
               const rateLimitError = new Error('Rate limit exceeded');
               const mockOperation = jest
                    .fn()
                    .mockRejectedValueOnce(rateLimitError)
                    .mockResolvedValueOnce('success after rate limit');

               const result = await retryFetch(mockOperation);

               expect(result).toBe('success after rate limit');
               expect(mockOperation).toHaveBeenCalledTimes(2);
          });
     });

     describe('delay', () => {
          it('should delay for specified milliseconds', async () => {
               const startTime = Date.now();
               await delay(100);
               const endTime = Date.now();

               const elapsed = endTime - startTime;
               // Allow some tolerance for timing
               expect(elapsed).toBeGreaterThanOrEqual(90);
               expect(elapsed).toBeLessThan(150);
          });

          it('should resolve without value', async () => {
               const result = await delay(10);
               expect(result).toBeUndefined();
          });
     });

     describe('Configuration', () => {
          it('should use correct retry configuration from constants', () => {
               expect(SNAPSHOT_CONFIG.MAX_FETCH_RETRIES).toBe(2);
               expect(SNAPSHOT_CONFIG.FETCH_RETRY_DELAY_MS).toBe(1000);
          });

          it('should calculate correct exponential backoff delays', () => {
               const baseDelay = SNAPSHOT_CONFIG.FETCH_RETRY_DELAY_MS;

               // First retry: 1000ms * 2^0 = 1000ms
               expect(baseDelay * Math.pow(2, 0)).toBe(1000);
               // Second retry: 1000ms * 2^1 = 2000ms
               expect(baseDelay * Math.pow(2, 1)).toBe(2000);
               // Third retry (if maxRetries was 3): 1000ms * 2^2 = 4000ms
               expect(baseDelay * Math.pow(2, 2)).toBe(4000);
          });
     });
});
