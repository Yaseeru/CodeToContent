import React from 'react';

const LandingPage: React.FC = () => {
     const handleGitHubLogin = () => {
          // Redirect to backend OAuth initiation endpoint
          window.location.href = '/api/auth/github';
     };

     return (
          <div className="min-h-screen bg-dark-bg flex items-center justify-center">
               <div className="text-center">
                    <h1 className="text-4xl font-bold text-dark-text mb-4">
                         CodeToContent
                    </h1>
                    <p className="text-dark-text-secondary mb-8 max-w-md">
                         Transform your GitHub repositories into compelling content for LinkedIn and X
                    </p>
                    <button
                         onClick={handleGitHubLogin}
                         className="bg-dark-accent hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                         Continue with GitHub
                    </button>
               </div>
          </div>
     );
};

export default LandingPage;
