import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient, getErrorMessage } from '../utils/apiClient';

const AuthCallback: React.FC = () => {
     const [searchParams] = useSearchParams();
     const navigate = useNavigate();
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          const handleCallback = async () => {
               const token = searchParams.get('token');
               const errorParam = searchParams.get('error');

               // Handle OAuth errors (user denied permission, etc.)
               if (errorParam) {
                    setError(errorParam);
                    return;
               }

               if (!token) {
                    setError('No authentication token received. Please try again.');
                    return;
               }

               try {
                    // Store JWT in localStorage
                    localStorage.setItem('jwt', token);

                    // Redirect to dashboard
                    navigate('/dashboard');
               } catch (err: any) {
                    console.error('Authentication error:', err);
                    setError(getErrorMessage(err));
               }
          };

          handleCallback();
     }, [searchParams, navigate]);

     const handleRetry = () => {
          navigate('/');
     };

     if (error) {
          return (
               <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                         <h2 className="text-2xl font-semibold text-dark-text mb-3">
                              Authentication Error
                         </h2>
                         <p className="text-base text-dark-text-secondary mb-6 leading-relaxed">{error}</p>
                         <button
                              onClick={handleRetry}
                              className="bg-dark-accent text-white font-medium py-3 px-8 rounded-lg"
                         >
                              Try Again
                         </button>
                    </div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
               <div className="text-center">
                    <h2 className="text-2xl font-semibold text-dark-text mb-3">
                         Authenticating...
                    </h2>
                    <p className="text-base text-dark-text-secondary">
                         Please wait while we complete your authentication.
                    </p>
               </div>
          </div>
     );
};

export default AuthCallback;
