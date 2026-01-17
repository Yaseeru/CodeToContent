import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';

interface VoiceFeatureStatus {
     available: boolean;
     loading: boolean;
     error: string | null;
     retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Hook for managing voice feature availability with graceful degradation
 */
export function useVoiceFeatures() {
     const [status, setStatus] = useState<VoiceFeatureStatus>({
          available: true,
          loading: false,
          error: null,
          retryCount: 0,
     });

     const checkVoiceFeatures = useCallback(async () => {
          try {
               setStatus((prev) => ({ ...prev, loading: true, error: null }));

               // Try to fetch profile to check if voice features are available
               await apiClient.get('/api/profile/style');

               setStatus({
                    available: true,
                    loading: false,
                    error: null,
                    retryCount: 0,
               });
          } catch (err: any) {
               // If it's a 404, voice features are available but user doesn't have a profile
               if (err.response?.status === 404) {
                    setStatus({
                         available: true,
                         loading: false,
                         error: null,
                         retryCount: 0,
                    });
                    return;
               }

               // For other errors, mark as unavailable
               setStatus((prev) => ({
                    available: false,
                    loading: false,
                    error: 'Voice features are temporarily unavailable',
                    retryCount: prev.retryCount + 1,
               }));
          }
     }, []);

     const retry = useCallback(async () => {
          if (status.retryCount < MAX_RETRIES) {
               await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
               await checkVoiceFeatures();
          }
     }, [status.retryCount, checkVoiceFeatures]);

     useEffect(() => {
          checkVoiceFeatures();
     }, [checkVoiceFeatures]);

     return {
          available: status.available,
          loading: status.loading,
          error: status.error,
          canRetry: status.retryCount < MAX_RETRIES,
          retry,
     };
}
