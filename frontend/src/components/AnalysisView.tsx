import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Analysis {
     id: string;
     repositoryId: string;
     problemStatement: string;
     targetAudience: string;
     coreFunctionality: string[];
     notableFeatures: string[];
     recentChanges: string[];
     integrations: string[];
     valueProposition: string;
     createdAt: Date;
}

interface AnalysisViewProps {
     repositoryId: string | null;
     onAnalysisComplete?: (analysis: Analysis) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({
     repositoryId,
     onAnalysisComplete
}) => {
     const [analysis, setAnalysis] = useState<Analysis | null>(null);
     const [loading, setLoading] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (!repositoryId) {
               setAnalysis(null);
               setLoading(false);
               setError(null);
               return;
          }

          const analyzeRepository = async () => {
               try {
                    setLoading(true);
                    setError(null);

                    const token = localStorage.getItem('token');
                    if (!token) {
                         throw new Error('No authentication token found');
                    }

                    // Trigger analysis
                    const response = await axios.post(
                         `/api/repositories/${repositoryId}/analyze`,
                         {},
                         {
                              headers: {
                                   Authorization: `Bearer ${token}`,
                              },
                         }
                    );

                    const analysisData = response.data.analysis;
                    setAnalysis(analysisData);

                    if (onAnalysisComplete) {
                         onAnalysisComplete(analysisData);
                    }
               } catch (err) {
                    console.error('Error analyzing repository:', err);
                    if (axios.isAxiosError(err)) {
                         if (err.response?.status === 401) {
                              setError('Authentication failed. Please log in again.');
                              localStorage.removeItem('token');
                              window.location.href = '/';
                         } else if (err.response?.status === 404) {
                              setError('Repository not found.');
                         } else if (err.response?.status === 429) {
                              setError('API rate limit exceeded. Please try again later.');
                         } else if (err.response?.status === 503) {
                              setError('AI service temporarily unavailable. Please try again later.');
                         } else {
                              setError(err.response?.data?.message || 'Failed to analyze repository');
                         }
                    } else {
                         setError('An unexpected error occurred');
                    }
               } finally {
                    setLoading(false);
               }
          };

          analyzeRepository();
     }, [repositoryId, onAnalysisComplete]);

     if (!repositoryId) {
          return (
               <div className="text-center py-12">
                    <p className="text-dark-text-secondary">
                         Select a repository to analyze
                    </p>
               </div>
          );
     }

     if (loading) {
          return (
               <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-dark-border border-t-dark-accent rounded-full animate-spin mb-4"></div>
                    <p className="text-dark-text-secondary">Analyzing repository...</p>
                    <p className="text-dark-text-secondary text-sm mt-2">
                         This may take a few moments
                    </p>
               </div>
          );
     }

     if (error) {
          return (
               <div className="bg-dark-surface border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 font-semibold mb-2">Analysis Failed</p>
                    <p className="text-red-400">{error}</p>
               </div>
          );
     }

     if (!analysis) {
          return null;
     }

     return (
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 space-y-6">
               <div>
                    <h2 className="text-2xl font-bold text-dark-text mb-4">Analysis Results</h2>
                    <p className="text-dark-text-secondary text-sm">
                         Analyzed on {new Date(analysis.createdAt).toLocaleString()}
                    </p>
               </div>

               <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-2">Problem Statement</h3>
                    <p className="text-dark-text-secondary">{analysis.problemStatement}</p>
               </div>

               <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-2">Target Audience</h3>
                    <p className="text-dark-text-secondary">{analysis.targetAudience}</p>
               </div>

               <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-2">Core Functionality</h3>
                    <ul className="list-disc list-inside space-y-1">
                         {analysis.coreFunctionality.map((item, index) => (
                              <li key={index} className="text-dark-text-secondary">
                                   {item}
                              </li>
                         ))}
                    </ul>
               </div>

               {analysis.notableFeatures.length > 0 && (
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-2">Notable Features</h3>
                         <ul className="list-disc list-inside space-y-1">
                              {analysis.notableFeatures.map((item, index) => (
                                   <li key={index} className="text-dark-text-secondary">
                                        {item}
                                   </li>
                              ))}
                         </ul>
                    </div>
               )}

               {analysis.recentChanges.length > 0 && (
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-2">Recent Changes</h3>
                         <ul className="list-disc list-inside space-y-1">
                              {analysis.recentChanges.map((item, index) => (
                                   <li key={index} className="text-dark-text-secondary">
                                        {item}
                                   </li>
                              ))}
                         </ul>
                    </div>
               )}

               {analysis.integrations.length > 0 && (
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-2">Integrations</h3>
                         <ul className="list-disc list-inside space-y-1">
                              {analysis.integrations.map((item, index) => (
                                   <li key={index} className="text-dark-text-secondary">
                                        {item}
                                   </li>
                              ))}
                         </ul>
                    </div>
               )}

               <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-2">Value Proposition</h3>
                    <p className="text-dark-text-secondary">{analysis.valueProposition}</p>
               </div>
          </div>
     );
};

export default AnalysisView;
