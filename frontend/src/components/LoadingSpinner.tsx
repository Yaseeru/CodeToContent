import React from 'react';

interface LoadingSpinnerProps {
     size?: 'sm' | 'md' | 'lg';
     message?: string;
     fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
     size = 'md',
     message,
     fullScreen = false,
}) => {
     const sizeClasses = {
          sm: 'w-4 h-4 border-2',
          md: 'w-8 h-8 border-4',
          lg: 'w-12 h-12 border-4',
     };

     const spinner = (
          <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
               <div
                    className={`${sizeClasses[size]} border-dark-accent border-t-transparent rounded-full animate-spin`}
                    aria-hidden="true"
               />
               {message && (
                    <p className="text-sm text-dark-text-secondary text-center px-4">{message}</p>
               )}
          </div>
     );

     if (fullScreen) {
          return (
               <div className="fixed inset-0 bg-dark-bg bg-opacity-75 flex items-center justify-center z-50 p-4">
                    {spinner}
               </div>
          );
     }

     return spinner;
};

export default LoadingSpinner;
