import { renderHook, waitFor } from '@testing-library/react';
import { useVoiceFeatures } from '../useVoiceFeatures';
import { apiClient } from '../../utils/apiClient';

jest.mock('../../utils/apiClient');

describe('useVoiceFeatures', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          jest.useFakeTimers();
     });

     afterEach(() => {
          jest.runOnlyPendingTimers();
          jest.useRealTimers();
     });

     it('marks voice features as available when API call succeeds', async () => {
          (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });

          const { result } = renderHook(() => useVoiceFeatures());

          expect(result.current.loading).toBe(true);

          await waitFor(() => {
               expect(result.current.loading).toBe(false);
          });

          expect(result.current.available).toBe(true);
          expect(result.current.error).toBeNull();
     });

     it('marks voice features as available when API returns 404', async () => {
          (apiClient.get as jest.Mock).mockRejectedValue({
               response: { status: 404 },
          });

          const { result } = renderHook(() => useVoiceFeatures());

          await waitFor(() => {
               expect(result.current.loading).toBe(false);
          });

          expect(result.current.available).toBe(true);
          expect(result.current.error).toBeNull();
     });

     it('marks voice features as unavailable when API call fails', async () => {
          (apiClient.get as jest.Mock).mockRejectedValue({
               response: { status: 500 },
          });

          const { result } = renderHook(() => useVoiceFeatures());

          await waitFor(() => {
               expect(result.current.loading).toBe(false);
          });

          expect(result.current.available).toBe(false);
          expect(result.current.error).toBe('Voice features are temporarily unavailable');
     });

     it('allows retry when under max retry limit', async () => {
          (apiClient.get as jest.Mock).mockRejectedValue({
               response: { status: 500 },
          });

          const { result } = renderHook(() => useVoiceFeatures());

          await waitFor(() => {
               expect(result.current.loading).toBe(false);
          });

          expect(result.current.canRetry).toBe(true);
     });

     it('retries checking voice features', async () => {
          (apiClient.get as jest.Mock)
               .mockRejectedValueOnce({ response: { status: 500 } })
               .mockResolvedValueOnce({ data: {} });

          const { result } = renderHook(() => useVoiceFeatures());

          await waitFor(() => {
               expect(result.current.loading).toBe(false);
          });

          expect(result.current.available).toBe(false);

          // Trigger retry
          result.current.retry();

          // Fast-forward the retry delay
          jest.advanceTimersByTime(2000);

          await waitFor(() => {
               expect(result.current.available).toBe(true);
          });
     });

     it('tracks retry count on failures', async () => {
          (apiClient.get as jest.Mock).mockRejectedValue({
               response: { status: 500 },
          });

          const { result } = renderHook(() => useVoiceFeatures());

          await waitFor(() => {
               expect(result.current.loading).toBe(false);
          });

          // Initial failure - should allow retry
          expect(result.current.available).toBe(false);
          expect(result.current.canRetry).toBe(true);
     });
});
