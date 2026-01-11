import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

     useEffect(() => {
          const fetchRepositories = async () => {
               try {
                    setLoading(true);
                    setError(null);

                    const token = localStorage.getItem('token');
                    if (!token) {
                         throw new Error('No authentication token found');
                    }

                    const response = await axios.get('/api/repositories', {
                         headers: {
                              Authorization: `Bearer ${token}`,
                         },
                    });

                    setRepositories(response.data.repositories);
               } catch (err) {
                    console.error('Error fetching repositories:', err);
                    if (axios.isAxiosError(err)) {
                         if (err.response?.status === 401) {
                              setError('Authentication failed. Please log in again.');
                              // Clear invalid token
                              localStorage.removeItem('token');
                              window.location.href = '/';
                         } else if (err.response?.status === 429) {
                              setError('GitHub API rate limit exceeded. Please try again later.');
                         } else {
                              setError(err.response?.data?.message || 'Failed to fetch repositories');
                         }
                    } else {
                         setError('An unexpected error occurred');
                    }
               } finally {
                    setLoading(false);
               }
          };

          fetchRepositories();
     }, []);

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
               <div className="flex items-center justify-center py-12">
                    <div className="text-dark-text-secondary">Loading repositories...</div>
               </div>
          );
     }

     if (error) {
          return (
               <div className="bg-dark-surface border border-red-500 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
               </div>
          );
     }

     if (filteredRepositories.length === 0) {
          return (
               <div className="text-center py-12">
                    <p className="text-dark-text-secondary">
                         {searchQuery ? 'No repositories match your search' : 'No repositories found'}
                    </p>
               </div>
          );
     }

     return (
          <div className="space-y-3">
               {filteredRepositories.map((repo) => (
                    <div
                         key={repo.id}
                         onClick={() => handleRepositoryClick(repo.id)}
                         className="bg-dark-surface border border-dark-border rounded-lg p-4 cursor-pointer hover:border-dark-accent transition-colors"
                    >
                         <h3 className="text-dark-text font-semibold">{repo.name}</h3>
                         <p className="text-dark-text-secondary text-sm mt-1">{repo.fullName}</p>
                         {repo.description && (
                              <p className="text-dark-text-secondary text-sm mt-2">
                                   {repo.description}
                              </p>
                         )}
                         {repo.lastAnalyzed && (
                              <p className="text-dark-text-secondary text-xs mt-2">
                                   Last analyzed: {new Date(repo.lastAnalyzed).toLocaleDateString()}
                              </p>
                         )}
                    </div>
               ))}
          </div>
     );
};

export default RepositoryList;
