import React from 'react';

interface EnhancedErrorNotificationProps {
  type: 'network' | 'auth' | 'validation' | 'server' | 'general';
  message: string;
  onClose: () => void;
  onRetry?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const EnhancedErrorNotification: React.FC<EnhancedErrorNotificationProps> = ({
  type,
  message,
  onClose,
  onRetry,
  autoClose = false,
  autoCloseDelay = 8000,
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          title: 'Connection Error',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l-4-4m0 0l4-4m-4 4h16" />
            </svg>
          ),
          guidance: 'Check your internet connection and try again.',
          actions: onRetry ? ['Retry', 'Dismiss'] : ['Dismiss']
        };
      case 'auth':
        return {
          title: 'Authentication Error',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          guidance: 'Your session may have expired. Please log in again.',
          actions: ['Login', 'Dismiss']
        };
      case 'validation':
        return {
          title: 'Validation Error',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          guidance: 'Please check your input and try again.',
          actions: ['Fix', 'Dismiss']
        };
      case 'server':
        return {
          title: 'Server Error',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          guidance: 'Something went wrong on our end. Please try again in a few moments.',
          actions: onRetry ? ['Retry', 'Report Issue', 'Dismiss'] : ['Report Issue', 'Dismiss']
        };
      default:
        return {
          title: 'Error',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          guidance: 'An unexpected error occurred.',
          actions: ['Dismiss']
        };
    }
  };

  const config = getErrorConfig();

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const handleAction = (action: string) => {
    switch (action) {
      case 'Retry':
        if (onRetry) onRetry();
        break;
      case 'Login':
        window.location.href = '/';
        break;
      case 'Report Issue':
        // Could open a support ticket or email
        window.open('mailto:support@codetocontent.com?subject=Error Report', '_blank');
        break;
      case 'Fix':
        // Focus on the first input field or scroll to form
        const firstInput = document.querySelector('input, textarea, select') as HTMLElement;
        if (firstInput) {
          firstInput.focus();
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      default:
        onClose();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in p-4">
      <div className="bg-dark-error-bg border border-dark-error rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="text-dark-error flex-shrink-0 mt-0.5">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-dark-error font-semibold text-sm" role="alert" aria-live="assertive">
                {config.title}
              </h4>
              <button
                onClick={onClose}
                className="text-dark-error hover:text-dark-error-hover flex-shrink-0 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-dark-bg rounded transition-colors p-1"
                aria-label="Close error notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-dark-error text-sm leading-relaxed break-words mb-2">
              {message}
            </p>
            <p className="text-dark-error text-xs leading-relaxed mb-3 opacity-80">
              {config.guidance}
            </p>
            <div className="flex flex-wrap gap-2">
              {config.actions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleAction(action)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg ${
                    action === 'Retry' || action === 'Login'
                      ? 'bg-dark-error text-white hover:bg-dark-error-hover focus:ring-red-600'
                      : 'bg-dark-surface border border-dark-border text-dark-text hover:bg-dark-surface-hover focus:ring-dark-accent'
                  }`}
                  aria-label={action}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedErrorNotification;
