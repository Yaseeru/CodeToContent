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
                    <h3 className="text-base font-medium text-dark-text mb-2">
                         Generate Content
                    </h3>
                    <p className="text-sm text-dark-text-secondary leading-relaxed">
                         Select a platform to generate content with the selected tone
                    </p>
               </div>

               {error && (
                    <div className="bg-dark-error-bg border border-dark-error rounded-lg p-4">
                         <p className="text-dark-error text-sm">{error}</p>
                    </div>
               )}

               <div className="flex gap-3">
                    <button
                         onClick={() => generateContent('linkedin')}
                         disabled={loading.linkedin || loading.x}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {loading.linkedin ? (
                              <span className="flex items-center justify-center">
                                   <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
                                   Generating...
                              </span>
                         ) : (
                              'Generate for LinkedIn'
                         )}
                    </button>

                    <button
                         onClick={() => generateContent('x')}
                         disabled={loading.linkedin || loading.x}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {loading.x ? (
                              <span className="flex items-center justify-center">
                                   <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
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
