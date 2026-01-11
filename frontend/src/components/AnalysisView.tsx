import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';

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
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);

     useEffect(() => {
          if (!repositoryId) {
               setAnalysis(null);
               setLoading(false);
               setError(null);
               setShowErrorNotification(false);
               return;
          }

          analyzeRepository();
     }, [repositoryId]);

     const analyzeRepository = async () => {
          if (!repositoryId) return;

          try {
               setLoading(true);
               setError(null);
               setShowErrorNotification(false);

               // Trigger analysis
               const response = await apiClient.post(
                    `/api/repositories/${repositoryId}/analyze`,
                    {}
               );

               const analysisData = response.data.analysis;
               setAnalysis(analysisData);

               if (onAnalysisComplete) {
                    onAnalysisComplete(analysisData);
               }
          } catch (err) {
               console.error('Error analyzing repository:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
          } finally {
               setLoading(false);
          }
     };

     const handleRetryAnalysis = () => {
          setShowErrorNotification(false);
          analyzeRepository();
     };

     const handleCloseErrorNotification = () => {
          setShowErrorNotification(false);
     };

     if (!repositoryId) {
          return (
               <div className="text-center py-16">
                    <p className="text-base text-dark-text-secondary">
                         Select a repository to analyze
                    </p>
               </div>
          );
     }

     if (loading) {
          return (
               <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-10 h-10 border-3 border-dark-border border-t-dark-accent rounded-full spinner mb-4"></div>
                    <p className="text-base text-dark-text-secondary">Analyzing repository...</p>
                    <p className="text-sm text-dark-text-tertiary mt-2">
                         This may take a few moments
                    </p>
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
                              onRetry={handleRetryAnalysis}
                         />
                    )}
                    <div className="bg-dark-error-bg border border-dark-error rounded-lg p-4">
                         <p className="text-dark-error font-medium mb-2">Analysis Failed</p>
                         <p className="text-dark-error text-sm mb-3">{error}</p>
                         <button
                              onClick={handleRetryAnalysis}
                              className="px-4 py-2 bg-dark-error text-white text-sm font-medium rounded-lg hover:bg-dark-error-hover"
                         >
                              Retry Analysis
                         </button>
                    </div>
               </>
          );
     }

     if (!analysis) {
          return null;
     }

     return (
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6 space-y-6">
               <div>
                    <h2 className="text-2xl font-semibold text-dark-text mb-2">Analysis Results</h2>
                    <p className="text-sm text-dark-text-tertiary">
                         Analyzed on {new Date(analysis.createdAt).toLocaleString()}
                    </p>
               </div>

               <div>
                    <h3 className="text-base font-medium text-dark-text mb-2">Problem Statement</h3>
                    <p className="text-sm text-dark-text-secondary leading-relaxed">{analysis.problemStatement}</p>
               </div>

               <div>
                    <h3 className="text-base font-medium text-dark-text mb-2">Target Audience</h3>
                    <p className="text-sm text-dark-text-secondary leading-relaxed">{analysis.targetAudience}</p>
               </div>

               <div>
                    <h3 className="text-base font-medium text-dark-text mb-2">Core Functionality</h3>
                    <ul className="list-disc list-inside space-y-1">
                         {analysis.coreFunctionality.map((item, index) => (
                              <li key={index} className="text-sm text-dark-text-secondary leading-relaxed">
                                   {item}
                              </li>
                         ))}
                    </ul>
               </div>

               {analysis.notableFeatures.length > 0 && (
                    <div>
                         <h3 className="text-base font-medium text-dark-text mb-2">Notable Features</h3>
                         <ul className="list-disc list-inside space-y-1">
                              {analysis.notableFeatures.map((item, index) => (
                                   <li key={index} className="text-sm text-dark-text-secondary leading-relaxed">
                                        {item}
                                   </li>
                              ))}
                         </ul>
                    </div>
               )}

               {analysis.recentChanges.length > 0 && (
                    <div>
                         <h3 className="text-base font-medium text-dark-text mb-2">Recent Changes</h3>
                         <ul className="list-disc list-inside space-y-1">
                              {analysis.recentChanges.map((item, index) => (
                                   <li key={index} className="text-sm text-dark-text-secondary leading-relaxed">
                                        {item}
                                   </li>
                              ))}
                         </ul>
                    </div>
               )}

               {analysis.integrations.length > 0 && (
                    <div>
                         <h3 className="text-base font-medium text-dark-text mb-2">Integrations</h3>
                         <ul className="list-disc list-inside space-y-1">
                              {analysis.integrations.map((item, index) => (
                                   <li key={index} className="text-sm text-dark-text-secondary leading-relaxed">
                                        {item}
                                   </li>
                              ))}
                         </ul>
                    </div>
               )}

               <div>
                    <h3 className="text-base font-medium text-dark-text mb-2">Value Proposition</h3>
                    <p className="text-sm text-dark-text-secondary leading-relaxed">{analysis.valueProposition}</p>
               </div>
          </div>
     );
};

export default AnalysisView;
