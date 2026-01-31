import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';
import SkeletonLoader from './SkeletonLoader';
import { useErrorHandler } from '../hooks/useErrorHandler';

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
     const { error, handleError, clearError } = useErrorHandler();

     useEffect(() => {
          fetchRepositories();
     }, []);

     const fetchRepositories = async () => {
          try {
               setLoading(true);
               clearError();

               const response = await apiClient.get('/api/repositories');
               setRepositories(response.data.repositories);
          } catch (err) {
               handleError(err, 'Failed to fetch repositories');
          } finally {
               setLoading(false);
          }
     };

     const handleRetryFetch = () => {
          clearError();
          fetchRepositories();
     };

     const handleCloseErrorNotification = () => {
          clearError();
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
               <div className="space-y-3">
                    {Array.from({ length: 5 }, (_, i) => (
                         <SkeletonLoader key={i} type="repository" />
                    ))}
               </div>
          );
     }

     if (error) {
          return (
               <>
                    {error.showNotification && (
                         <ErrorNotification
                              message={error.message}
                              onClose={handleCloseErrorNotification}
                              onRetry={handleRetryFetch}
                         />
                    )}
                    <div className="bg-dark-error-bg border border-dark-error rounded-lg p-4">
                         <p className="text-dark-error text-sm mb-3">{error.message}</p>
                         <button
                              onClick={handleRetryFetch}
                              className="btn-enhanced focus-enhanced-primary px-4 py-3 min-h-[44px] bg-dark-error text-white text-sm font-medium rounded-lg hover:bg-dark-error-hover"
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
                         className="interactive-card bg-dark-surface border border-dark-border rounded-lg p-3 sm:p-4 cursor-pointer focus-enhanced-secondary"
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
