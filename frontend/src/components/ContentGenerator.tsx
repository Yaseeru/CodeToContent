import React, { useState } from 'react';
import axios from 'axios';

interface ContentGeneratorProps {
     analysisId: string;
     tone: string;
     onContentGenerated: (content: GeneratedContent) => void;
}

export interface GeneratedContent {
     id: string;
     platform: 'linkedin' | 'x';
     generatedText: string;
     tone: string;
     version: number;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
     analysisId,
     tone,
     onContentGenerated,
}) => {
     const [loading, setLoading] = useState<{ linkedin: boolean; x: boolean }>({
          linkedin: false,
          x: false,
     });
     const [error, setError] = useState<string | null>(null);

     const generateContent = async (platform: 'linkedin' | 'x') => {
          try {
               setLoading((prev) => ({ ...prev, [platform]: true }));
               setError(null);

               const token = localStorage.getItem('token');
               if (!token) {
                    throw new Error('No authentication token found');
               }

               const response = await axios.post(
                    '/api/content/generate',
                    {
                         analysisId,
                         tone,
                         platform,
                    },
                    {
                         headers: {
                              Authorization: `Bearer ${token}`,
                         },
                    }
               );

               onContentGenerated(response.data.content);
          } catch (err) {
               console.error('Error generating content:', err);
               if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                         setError('Authentication failed. Please log in again.');
                         localStorage.removeItem('token');
                         window.location.href = '/';
                    } else if (err.response?.status === 404) {
                         setError('Analysis not found.');
                    } else if (err.response?.status === 429) {
                         setError('API rate limit exceeded. Please try again later.');
                    } else if (err.response?.status === 503) {
                         setError('AI service temporarily unavailable. Please try again later.');
                    } else {
                         setError(err.response?.data?.message || 'Failed to generate content');
                    }
               } else {
                    setError('An unexpected error occurred');
               }
          } finally {
               setLoading((prev) => ({ ...prev, [platform]: false }));
          }
     };

     return (
          <div className="space-y-4">
               <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-4">
                         Generate Content
                    </h3>
                    <p className="text-sm text-dark-text-secondary mb-4">
                         Select a platform to generate content with the selected tone
                    </p>
               </div>

               {error && (
                    <div className="bg-dark-surface border border-red-500 rounded-lg p-4">
                         <p className="text-red-400">{error}</p>
                    </div>
               )}

               <div className="flex gap-4">
                    <button
                         onClick={() => generateContent('linkedin')}
                         disabled={loading.linkedin || loading.x}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                         {loading.linkedin ? (
                              <span className="flex items-center justify-center">
                                   <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                   Generating...
                              </span>
                         ) : (
                              'Generate for LinkedIn'
                         )}
                    </button>

                    <button
                         onClick={() => generateContent('x')}
                         disabled={loading.linkedin || loading.x}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                         {loading.x ? (
                              <span className="flex items-center justify-center">
                                   <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                   Generating...
                              </span>
                         ) : (
                              'Generate for X'
                         )}
                    </button>
               </div>
          </div>
     );
};

export default ContentGenerator;
