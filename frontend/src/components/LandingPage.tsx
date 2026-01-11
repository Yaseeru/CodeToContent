import React from 'react';

const LandingPage: React.FC = () => {
     const handleGitHubLogin = () => {
          // Redirect to backend OAuth initiation endpoint
          window.location.href = '/api/auth/github';
     };

     return (
          <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
               <div className="text-center max-w-lg">
                    <h1 className="text-4xl font-semibold text-dark-text mb-3">
                         CodeToContent
                    </h1>
                    <p className="text-base text-dark-text-secondary mb-8 leading-relaxed">
                         Transform your GitHub repositories into compelling content for LinkedIn and X
                    </p>
                    <button
                         onClick={handleGitHubLogin}
                         className="bg-dark-accent text-white font-medium py-3 px-8 rounded-lg"
                    >
                         Continue with GitHub
                    </button>
               </div>
          </div>
     );
};

export default LandingPage;
