import React, { useEffect } from 'react';

interface ErrorNotificationProps {
     message: string;
     onClose: () => void;
     autoClose?: boolean;
     autoCloseDelay?: number;
     onRetry?: () => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
     message,
     onClose,
     autoClose = false,
     autoCloseDelay = 5000,
     onRetry,
}) => {
     useEffect(() => {
          if (autoClose) {
               const timer = setTimeout(() => {
                    onClose();
               }, autoCloseDelay);

               return () => clearTimeout(timer);
          }
     }, [autoClose, autoCloseDelay, onClose]);

     return (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
               <div className="bg-dark-error-bg border border-dark-error rounded-lg p-4 shadow-lg">
                    <div className="flex items-start justify-between">
                         <div className="flex-1">
                              <p className="text-dark-error text-sm font-medium mb-1">Error</p>
                              <p className="text-dark-error text-sm leading-relaxed">{message}</p>
                         </div>
                         <button
                              onClick={onClose}
                              className="ml-4 text-dark-error hover:text-dark-error-hover"
                              aria-label="Close notification"
                         >
                              <svg
                                   className="w-5 h-5"
                                   fill="none"
                                   stroke="currentColor"
                                   viewBox="0 0 24 24"
                              >
                                   <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                   />
                              </svg>
                         </button>
                    </div>
                    {onRetry && (
                         <button
                              onClick={onRetry}
                              className="mt-3 px-4 py-2 bg-dark-error text-white text-sm font-medium rounded-lg hover:bg-dark-error-hover"
                         >
                              Retry
                         </button>
                    )}
               </div>
          </div>
     );
};

export default ErrorNotification;
