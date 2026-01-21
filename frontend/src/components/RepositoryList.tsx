import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';

interface Repository {
     id: string;
     name: string;
     fullName: string;
     description: string;
     url: string;
     lastAnalyzed?: Date;
}

interface RepositoryListProps {
     onRepositoryClick?: (repositoryId: string) => void;
     searchQuery?: string;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
     onRepositoryClick,
     searchQuery = ''
}) => {
     const [repositories, setRepositories] = useState<Repository[]>([]);
     const [loading, setLoading] = useState<boolean>(true);
     const [error, setError] = useState<string | null>(null);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);

     useEffect(() => {
          fetchRepositories();
     }, []);

     const fetchRepositories = async () => {
          try {
               setLoading(true);
               setError(null);
               setShowErrorNotification(false);

               const response = await apiClient.get('/api/repositories');
               setRepositories(response.data.repositories);
          } catch (err) {
               console.error('Error fetching repositories:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
          } finally {
               setLoading(false);
          }
     };

     const handleRetryFetch = () => {
          setShowErrorNotification(false);
          fetchRepositories();
     };

     const handleCloseErrorNotification = () => {
          setShowErrorNotification(false);
     };

     const handleRepositoryClick = async (repositoryId: string) => {
          if (onRepositoryClick) {
               onRepositoryClick(repositoryId);
          }
     };

     // Filter repositories based on search query
     const filteredRepositories = repositories.filter((repo) => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
               repo.name.toLowerCase().includes(query) ||
               repo.fullName.toLowerCase().includes(query) ||
               repo.description.toLowerCase().includes(query)
          );
     });

     if (loading) {
          return (
               <div className="flex items-center justify-center py-12 sm:py-16">
                    <div className="text-sm sm:text-base text-dark-text-secondary">Loading repositories...</div>
               </div>
          );
     }

     if (error) {
          return (
               <>
                    {showErrorNotification && (
                         <ErrorNotification
                              message={error}
                              onClose={handleCloseErrorNotification}
                              onRetry={handleRetryFetch}
                         />
                    )}
                    <div className="bg-dark-error-bg border border-dark-error rounded-lg p-4">
                         <p className="text-dark-error text-sm mb-3">{error}</p>
                         <button
                              onClick={handleRetryFetch}
                              className="px-4 py-3 min-h-[44px] bg-dark-error text-white text-sm font-medium rounded-lg hover:bg-dark-error-hover focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                              aria-label="Retry loading repositories"
                         >
                              Retry
                         </button>
                    </div>
               </>
          );
     }

     if (filteredRepositories.length === 0) {
          return (
               <div className="text-center py-12 sm:py-16">
                    <p className="text-sm sm:text-base text-dark-text-secondary">
                         {searchQuery ? 'No repositories match your search' : 'No repositories found'}
                    </p>
               </div>
          );
     }

     return (
          <div className="space-y-2 sm:space-y-3">
               {filteredRepositories.map((repo) => (
                    <div
                         key={repo.id}
                         onClick={() => handleRepositoryClick(repo.id)}
                         className="bg-dark-surface border border-dark-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-dark-surface-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                         role="button"
                         tabIndex={0}
                         aria-label={`Select repository ${repo.name}`}
                    >
                         <h3 className="text-sm sm:text-base font-medium text-dark-text">{repo.name}</h3>
                         <p className="text-xs sm:text-sm text-dark-text-tertiary mt-1">{repo.fullName}</p>
                         {repo.description && (
                              <p className="text-xs sm:text-sm text-dark-text-secondary mt-2 leading-relaxed line-clamp-2">
                                   {repo.description}
                              </p>
                         )}
                         {repo.lastAnalyzed && (
                              <p className="text-xs text-dark-text-tertiary mt-2">
                                   Last analyzed: {new Date(repo.lastAnalyzed).toLocaleDateString()}
                              </p>
                         )}
                    </div>
               ))}
          </div>
     );
};

export default RepositoryList;
