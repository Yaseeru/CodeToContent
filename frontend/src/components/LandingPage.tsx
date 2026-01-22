import React from 'react';

const LandingPage: React.FC = () => {
     const handleGitHubLogin = () => {
          // Redirect to backend OAuth initiation endpoint
          window.location.href = '/api/auth/github';
     };

     return (
          <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-8">
               <div className="text-center max-w-lg w-full">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-dark-text mb-3">
                         CodeToContent
                    </h1>
                    <p className="text-sm sm:text-base text-dark-text-secondary mb-6 sm:mb-8 leading-relaxed px-2">
                         Turn your code into engaging X posts that sound authentically like you—powered by AI that learns your unique voice
                    </p>
                    <button
                         onClick={handleGitHubLogin}
                         className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] bg-dark-accent text-white font-medium rounded-lg hover:bg-dark-accent-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                         aria-label="Continue with GitHub authentication"
                    >
                         Continue with GitHub
                    </button>
               </div>
          </div>
     );
};

export default LandingPage;
