import React, { useState, useRef } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';

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
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
     const lastPlatform = useRef<'linkedin' | 'x' | null>(null);

     const generateContent = async (platform: 'linkedin' | 'x') => {
          try {
               setLoading((prev) => ({ ...prev, [platform]: true }));
               setError(null);
               setShowErrorNotification(false);
               lastPlatform.current = platform;

               const response = await apiClient.post(
                    '/api/content/generate',
                    {
                         analysisId,
                         tone,
                         platform,
                    }
               );

               onContentGenerated(response.data.content);
          } catch (err) {
               console.error('Error generating content:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
          } finally {
               setLoading((prev) => ({ ...prev, [platform]: false }));
          }
     };

     const handleRetryGenerate = () => {
          if (lastPlatform.current) {
               setShowErrorNotification(false);
               generateContent(lastPlatform.current);
          }
     };

     const handleCloseErrorNotification = () => {
          setShowErrorNotification(false);
          setError(null);
     };

     return (
          <div className="space-y-4">
               {showErrorNotification && error && (
                    <ErrorNotification
                         message={error}
                         onClose={handleCloseErrorNotification}
                         onRetry={handleRetryGenerate}
                    />
               )}

               <div>
                    <h3 className="text-base font-medium text-dark-text mb-2">
                         Generate Content
                    </h3>
                    <p className="text-sm text-dark-text-secondary leading-relaxed">
                         Select a platform to generate content with the selected tone
                    </p>
               </div>

               <div className="flex gap-3">
                    <button
                         onClick={() => generateContent('linkedin')}
                         disabled={loading.linkedin || loading.x}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
                         className="flex-1 px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
