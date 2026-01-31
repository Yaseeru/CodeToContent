import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/apiClient';

export type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'general';

interface ErrorState {
  message: string;
  type: ErrorType;
  showNotification: boolean;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState | null>(null);

  const categorizeError = useCallback((error: any): ErrorType => {
    const errorMessage = getErrorMessage(error).toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return 'network';
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('token')) {
      return 'auth';
    }
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
      return 'validation';
    }
    if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('internal')) {
      return 'server';
    }
    
    return 'general';
  }, []);

  const handleError = useCallback((error: any, context?: string) => {
    const message = getErrorMessage(error);
    const type = categorizeError(error);
    
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    setError({
      message: context ? `${context}: ${message}` : message,
      type,
      showNotification: true
    });
  }, [categorizeError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showErrorNotification = useCallback((message: string, type: ErrorType = 'general') => {
    setError({
      message,
      type,
      showNotification: true
    });
  }, []);

  return {
    error,
    handleError,
    clearError,
    showErrorNotification,
    hasError: !!error
  };
};
