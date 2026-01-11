import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const AuthCallback: React.FC = () => {
     const [searchParams] = useSearchParams();
     const navigate = useNavigate();
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          const handleCallback = async () => {
               const code = searchParams.get('code');
               const errorParam = searchParams.get('error');

               // Handle OAuth errors (user denied permission, etc.)
               if (errorParam) {
                    setError('Authentication failed. Please try again.');
                    return;
               }

               if (!code) {
                    setError('No authorization code received. Please try again.');
                    return;
               }

               try {
                    // Exchange code for JWT
                    const response = await axios.get(`/api/auth/callback?code=${code}`);
                    const { token } = response.data;

                    // Store JWT in localStorage
                    localStorage.setItem('jwt', token);

                    // Redirect to dashboard
                    navigate('/dashboard');
               } catch (err: any) {
                    console.error('Authentication error:', err);
                    setError(
                         err.response?.data?.message ||
                         'Authentication failed. Please try again.'
                    );
               }
          };

          handleCallback();
     }, [searchParams, navigate]);

     const handleRetry = () => {
          navigate('/');
     };

     if (error) {
          return (
               <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                    <div className="text-center max-w-md">
                         <h2 className="text-2xl font-bold text-dark-text mb-4">
                              Authentication Error
                         </h2>
                         <p className="text-dark-text-secondary mb-6">{error}</p>
                         <button
                              onClick={handleRetry}
                              className="bg-dark-accent hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                         >
                              Try Again
                         </button>
                    </div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-dark-bg flex items-center justify-center">
               <div className="text-center">
                    <h2 className="text-2xl font-bold text-dark-text mb-4">
                         Authenticating...
                    </h2>
                    <p className="text-dark-text-secondary">
                         Please wait while we complete your authentication.
                    </p>
               </div>
          </div>
     );
};

export default AuthCallback;
