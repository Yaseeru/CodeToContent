import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

interface RetryConfig {
     maxRetries?: number;
     retryDelay?: number;
     retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
     maxRetries: 3,
     retryDelay: 1000,
     retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
     return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if an error is retryable
 */
const isRetryableError = (error: AxiosError, retryableStatuses: number[]): boolean => {
     if (!error.response) {
          // Network errors are retryable
          return true;
     }
     return retryableStatuses.includes(error.response.status);
};

/**
 * Make an API request with automatic retry logic
 */
export const apiRequest = async <T = any>(
     config: AxiosRequestConfig,
     retryConfig: RetryConfig = {}
): Promise<AxiosResponse<T>> => {
     const {
          maxRetries,
          retryDelay,
          retryableStatuses,
     } = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

     let lastError: AxiosError | null = null;

     for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
               // Add auth token if available
               const token = localStorage.getItem('jwt');
               if (token && !config.headers?.Authorization) {
                    config.headers = {
                         ...config.headers,
                         Authorization: `Bearer ${token}`,
                    };
               }

               const response = await axios(config);
               return response;
          } catch (error) {
               if (!axios.isAxiosError(error)) {
                    throw error;
               }

               lastError = error;

               // Handle authentication errors immediately
               if (error.response?.status === 401) {
                    // Don't redirect immediately - let the component handle it
                    console.error('[apiClient] Authentication error (401):', error.response.data);
                    throw error;
               }

               // Check if we should retry
               const shouldRetry = attempt < maxRetries && isRetryableError(error, retryableStatuses);

               if (!shouldRetry) {
                    throw error;
               }

               // Exponential backoff
               const delay = retryDelay * Math.pow(2, attempt);
               await sleep(delay);
          }
     }

     throw lastError;
};

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
     if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ message?: string }>;

          // Handle specific status codes
          if (axiosError.response) {
               const status = axiosError.response.status;
               const message = axiosError.response.data?.message;

               switch (status) {
                    case 400:
                         return message || 'Invalid request. Please check your input.';
                    case 401:
                         return 'Authentication failed. Please log in again.';
                    case 403:
                         return 'Access denied. You do not have permission to perform this action.';
                    case 404:
                         return message || 'Resource not found.';
                    case 429:
                         return 'Too many requests. Please try again later.';
                    case 500:
                         return 'Server error. Please try again later.';
                    case 503:
                         return 'Service temporarily unavailable. Please try again later.';
                    default:
                         return message || 'An unexpected error occurred. Please try again.';
               }
          }

          // Network errors
          if (axiosError.request) {
               return 'Network error. Please check your connection and try again.';
          }
     }

     if (error instanceof Error) {
          return error.message;
     }

     return 'An unexpected error occurred. Please try again.';
};

/**
 * API client with common methods
 */
export const apiClient = {
     get: <T = any>(url: string, config?: AxiosRequestConfig, retryConfig?: RetryConfig) =>
          apiRequest<T>({ ...config, method: 'GET', url }, retryConfig),

     post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: RetryConfig) =>
          apiRequest<T>({ ...config, method: 'POST', url, data }, retryConfig),

     put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: RetryConfig) =>
          apiRequest<T>({ ...config, method: 'PUT', url, data }, retryConfig),

     delete: <T = any>(url: string, config?: AxiosRequestConfig, retryConfig?: RetryConfig) =>
          apiRequest<T>({ ...config, method: 'DELETE', url }, retryConfig),
};
