import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/apiClient';

interface UseAsyncOperationOptions {
     onSuccess?: () => void;
     onError?: (error: string) => void;
     showToast?: boolean;
}

interface UseAsyncOperationReturn<T> {
     execute: (...args: any[]) => Promise<T | undefined>;
     loading: boolean;
     error: string | null;
     data: T | null;
     reset: () => void;
}

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsyncOperation<T>(
     asyncFunction: (...args: any[]) => Promise<T>,
     options: UseAsyncOperationOptions = {}
): UseAsyncOperationReturn<T> {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [data, setData] = useState<T | null>(null);

     const execute = useCallback(
          async (...args: any[]): Promise<T | undefined> => {
               try {
                    setLoading(true);
                    setError(null);

                    const result = await asyncFunction(...args);
                    setData(result);

                    if (options.onSuccess) {
                         options.onSuccess();
                    }

                    return result;
               } catch (err) {
                    const errorMessage = getErrorMessage(err);
                    setError(errorMessage);

                    if (options.onError) {
                         options.onError(errorMessage);
                    }

                    return undefined;
               } finally {
                    setLoading(false);
               }
          },
          [asyncFunction, options]
     );

     const reset = useCallback(() => {
          setLoading(false);
          setError(null);
          setData(null);
     }, []);

     return {
          execute,
          loading,
          error,
          data,
          reset,
     };
}
