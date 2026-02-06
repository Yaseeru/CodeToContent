import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface StyleProfileSetupProps {
     onComplete: (evolutionScore: number) => void;
     onSkip: () => void;
}

type SetupPath = 'choose' | 'quickstart' | 'archetype' | 'skip';

interface Archetype {
     id: string;
     name: string;
     description: string;
     category: string;
}

const StyleProfileSetup: React.FC<StyleProfileSetupProps> = ({ onComplete, onSkip }) => {
     const [currentPath, setCurrentPath] = useState<SetupPath>('choose');
     const [text, setText] = useState<string>('');
     const [selectedFile, setSelectedFile] = useState<File | null>(null);
     const [archetypes, setArchetypes] = useState<Archetype[]>([]);
     const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
     const [loading, setLoading] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
     const [evolutionScore, setEvolutionScore] = useState<number | null>(null);
     const toast = useToast();

     // Load archetypes when archetype path is selected
     useEffect(() => {
          if (currentPath === 'archetype' && archetypes.length === 0) {
               loadArchetypes();
          }
     }, [currentPath, archetypes.length]);

     const loadArchetypes = async () => {
          try {
               setLoading(true);
               const response = await apiClient.get('/api/profile/archetypes');
               setArchetypes(response.data.archetypes || []);
          } catch (err) {
               console.error('Error loading archetypes:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               toast.showError('Failed to load archetypes. Please try again.', loadArchetypes);
          } finally {
               setLoading(false);
          }
     };

     const handleTextAnalysis = async () => {
          if (text.length < 300) {
               setError('Please provide at least 300 characters for analysis.');
               setShowErrorNotification(true);
               toast.showWarning('Please provide at least 300 characters for analysis.');
               return;
          }

          try {
               setLoading(true);
               setError(null);
               setShowErrorNotification(false);

               const response = await apiClient.post('/api/profile/analyze-text', {
                    text,
               });

               const score = response.data.evolutionScore || 0;
               setEvolutionScore(score);
               toast.showSuccess('Voice profile created successfully!');
          } catch (err) {
               console.error('Error analyzing text:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               toast.showError('Failed to analyze text. Please try again.', handleTextAnalysis);
          } finally {
               setLoading(false);
          }
     };

     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (!file) return;

          const validExtensions = ['.txt', '.md', '.pdf'];
          const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

          if (!validExtensions.includes(fileExtension)) {
               setError('Please upload a .txt, .md, or .pdf file.');
               setShowErrorNotification(true);
               toast.showWarning('Please upload a .txt, .md, or .pdf file.');
               return;
          }

          setSelectedFile(file);

          try {
               setLoading(true);
               setError(null);
               setShowErrorNotification(false);

               const formData = new FormData();
               formData.append('file', file);

               const response = await apiClient.post('/api/profile/analyze-text', formData, {
                    headers: {
                         'Content-Type': 'multipart/form-data',
                    },
               });

               const score = response.data.evolutionScore || 0;
               setEvolutionScore(score);
               toast.showSuccess('Voice profile created from file successfully!');
          } catch (err) {
               console.error('Error analyzing file:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               toast.showError('Failed to analyze file. Please try again.', () => handleFileUpload(event));
          } finally {
               setLoading(false);
          }
     };

     const handleArchetypeSelection = async () => {
          if (!selectedArchetype) {
               setError('Please select an archetype.');
               setShowErrorNotification(true);
               toast.showWarning('Please select an archetype.');
               return;
          }

          try {
               setLoading(true);
               setError(null);
               setShowErrorNotification(false);

               const response = await apiClient.post('/api/profile/apply-archetype', {
                    archetypeId: selectedArchetype,
               });

               const score = response.data.evolutionScore || 0;
               setEvolutionScore(score);
               toast.showSuccess('Archetype applied successfully!');
          } catch (err) {
               console.error('Error applying archetype:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               toast.showError('Failed to apply archetype. Please try again.', handleArchetypeSelection);
          } finally {
               setLoading(false);
          }
     };

     const handleSkip = () => {
          setCurrentPath('skip');
          // Show skip confirmation briefly before calling onSkip
          setTimeout(() => {
               onSkip();
          }, 1500);
     };

     const handleRetry = () => {
          setShowErrorNotification(false);
          setError(null);

          if (currentPath === 'quickstart' && text.length >= 300) {
               handleTextAnalysis();
          } else if (currentPath === 'archetype' && selectedArchetype) {
               handleArchetypeSelection();
          }
     };

     const handleCloseErrorNotification = () => {
          setShowErrorNotification(false);
          setError(null);
     };

     const handleComplete = () => {
          if (evolutionScore !== null) {
               onComplete(evolutionScore);
          }
     };

     // Choose path view
     if (currentPath === 'choose') {
          return (
               <div className="modal-content-mobile bg-dark-surface border border-dark-border rounded-lg max-w-2xl md:max-w-3xl mx-auto relative max-h-[90vh] flex flex-col">
                    <div className="modal-header flex-shrink-0 sticky top-0 z-20 p-6 md:p-8 pb-4 bg-dark-surface border-b border-dark-border">
                         <button
                              onClick={onSkip}
                              className="absolute top-4 right-4 text-dark-text-secondary hover:text-dark-text transition-colors focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-surface rounded p-2 z-30"
                              aria-label="Close voice profile setup"
                         >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                         <div className="text-center pr-12">
                              <h2 className="text-xl md:text-2xl font-semibold text-dark-text mb-2">
                                   Set Up Your Voice Profile
                              </h2>
                              <p className="text-sm text-dark-text-secondary leading-relaxed">
                                   Choose how you'd like to personalize your content generation
                              </p>
                         </div>
                    </div>

                    <div className="modal-body flex-1 overflow-y-auto px-6 md:px-8 pb-6 md:pb-8">
                         <div className="space-y-4">
                              <button
                                   onClick={() => setCurrentPath('quickstart')}
                                   className="w-full p-4 md:p-6 bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-surface-hover text-left transition-colors"
                              >
                                   <h3 className="text-base md:text-lg font-medium text-dark-text mb-2">
                                        Quick Start
                                   </h3>
                                   <p className="text-sm text-dark-text-secondary leading-relaxed">
                                        Paste a writing sample or upload a file to analyze your style
                                   </p>
                              </button>

                              <button
                                   onClick={() => setCurrentPath('archetype')}
                                   className="w-full p-4 md:p-6 bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-surface-hover text-left transition-colors"
                              >
                                   <h3 className="text-base md:text-lg font-medium text-dark-text mb-2">
                                        Choose an Archetype
                                   </h3>
                                   <p className="text-sm text-dark-text-secondary leading-relaxed">
                                        Start with a pre-built voice template that matches your style
                                   </p>
                              </button>

                              <button
                                   onClick={handleSkip}
                                   className="w-full p-4 md:p-6 bg-dark-bg border border-dark-border rounded-lg hover:bg-dark-surface-hover text-left transition-colors"
                              >
                                   <h3 className="text-base md:text-lg font-medium text-dark-text mb-2">
                                        Skip for Now
                                   </h3>
                                   <p className="text-sm text-dark-text-secondary leading-relaxed">
                                        Start generating content immediately. The system will learn from your edits over time.
                                   </p>
                              </button>
                         </div>
                    </div>
               </div>
          );
     }

     // Quick start view
     if (currentPath === 'quickstart') {
          if (evolutionScore !== null) {
               return (
                    <div className="modal-content-mobile bg-dark-surface border border-dark-border rounded-lg p-6 md:p-8 max-w-2xl md:max-w-3xl mx-auto text-center">
                         <div className="mb-6">
                              <div className="w-16 h-16 bg-dark-success rounded-full flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                   </svg>
                              </div>
                              <h2 className="text-xl md:text-2xl font-semibold text-dark-text mb-2">
                                   Voice Profile Created!
                              </h2>
                              <p className="text-sm text-dark-text-secondary leading-relaxed mb-4">
                                   Your writing style has been analyzed and saved
                              </p>
                              <div className="inline-block px-4 py-2 bg-dark-bg border border-dark-border rounded-lg">
                                   <span className="text-sm text-dark-text-secondary">Evolution Score: </span>
                                   <span className="text-lg font-semibold text-dark-accent">{evolutionScore}%</span>
                              </div>
                         </div>
                         <button
                              onClick={handleComplete}
                              className="px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                         >
                              Get Started
                         </button>
                    </div>
               );
          }

          return (
               <div className="modal-content-mobile bg-dark-surface border border-dark-border rounded-lg p-6 md:p-8 max-w-2xl md:max-w-3xl mx-auto relative">
                    <div className="modal-header flex-shrink-0 sticky top-0 z-20 bg-dark-surface border-b border-dark-border -mx-6 md:-mx-8 px-6 md:px-8 py-4">
                         <button
                              onClick={onSkip}
                              className="absolute top-4 right-4 text-dark-text-secondary hover:text-dark-text transition-colors focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-surface rounded p-2 z-30"
                              aria-label="Close voice profile setup"
                         >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                         <div className="text-center pr-12">
                              <h2 className="text-xl md:text-2xl font-semibold text-dark-text mb-2">
                                   Quick Start
                              </h2>
                              <p className="text-sm text-dark-text-secondary leading-relaxed">
                                   Provide a writing sample to analyze your style
                              </p>
                         </div>
                    </div>

                    {showErrorNotification && error && (
                         <div className="mb-6">
                              <ErrorNotification
                                   message={error}
                                   onClose={handleCloseErrorNotification}
                                   onRetry={handleRetry}
                              />
                         </div>
                    )}

                    <div className="mb-6">
                         <button
                              onClick={() => setCurrentPath('choose')}
                              className="text-sm text-dark-text-secondary hover:text-dark-text flex items-center"
                         >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              Back
                         </button>
                    </div>

                    <div className="modal-body overflow-y-auto space-y-6">
                         <div>
                              <label className="block text-sm font-medium text-dark-text mb-2">
                                   Paste Your Writing Sample
                              </label>
                              <textarea
                                   value={text}
                                   onChange={(e) => setText(e.target.value)}
                                   placeholder="Paste any writing sample here (minimum 300 characters)..."
                                   className="w-full h-48 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-dark-accent resize-none"
                                   disabled={loading}
                              />
                              <p className="text-xs text-dark-text-secondary mt-2">
                                   {text.length} / 300 characters minimum
                              </p>
                         </div>

                         <button
                              onClick={handleTextAnalysis}
                              disabled={loading || text.length < 300}
                              className="w-full px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              {loading ? (
                                   <span className="flex items-center justify-center">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
                                        Analyzing...
                                   </span>
                              ) : (
                                   'Analyze My Style'
                              )}
                         </button>

                         <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                   <div className="w-full border-t border-dark-border"></div>
                              </div>
                              <div className="relative flex justify-center text-sm">
                                   <span className="px-2 bg-dark-surface text-dark-text-secondary">or</span>
                              </div>
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-dark-text mb-2">
                                   Upload a File
                              </label>
                              <div className="flex items-center justify-center w-full">
                                   <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dark-border border-dashed rounded-lg cursor-pointer bg-dark-bg hover:bg-dark-surface-hover">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                             <svg className="w-8 h-8 mb-3 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                             </svg>
                                             <p className="mb-2 text-sm text-dark-text-secondary">
                                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                             </p>
                                             <p className="text-xs text-dark-text-tertiary">
                                                  .txt, .md, or .pdf (minimum 500 characters)
                                             </p>
                                             {selectedFile && (
                                                  <p className="text-xs text-dark-accent mt-2">
                                                       {selectedFile.name}
                                                  </p>
                                             )}
                                        </div>
                                        <input
                                             type="file"
                                             className="hidden"
                                             accept=".txt,.md,.pdf"
                                             onChange={handleFileUpload}
                                             disabled={loading}
                                        />
                                   </label>
                              </div>
                         </div>
                    </div>
               </div>
          );
     }

     // Archetype selection view
     if (currentPath === 'archetype') {
          if (evolutionScore !== null) {
               return (
                    <div className="modal-content-mobile bg-dark-surface border border-dark-border rounded-lg p-6 md:p-8 max-w-2xl md:max-w-3xl mx-auto text-center">
                         <div className="mb-6">
                              <div className="w-16 h-16 bg-dark-success rounded-full flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                   </svg>
                              </div>
                              <h2 className="text-xl md:text-2xl font-semibold text-dark-text mb-2">
                                   Archetype Applied!
                              </h2>
                              <p className="text-sm text-dark-text-secondary leading-relaxed mb-4">
                                   Your voice profile has been set up with the selected archetype
                              </p>
                              <div className="inline-block px-4 py-2 bg-dark-bg border border-dark-border rounded-lg">
                                   <span className="text-sm text-dark-text-secondary">Evolution Score: </span>
                                   <span className="text-lg font-semibold text-dark-accent">{evolutionScore}%</span>
                              </div>
                         </div>
                         <button
                              onClick={handleComplete}
                              className="px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                         >
                              Get Started
                         </button>
                    </div>
               );
          }

          return (
               <div className="modal-content-mobile bg-dark-surface border border-dark-border rounded-lg p-6 md:p-8 max-w-2xl md:max-w-3xl mx-auto relative">
                    <div className="modal-header flex-shrink-0 sticky top-0 z-20 bg-dark-surface border-b border-dark-border -mx-6 md:-mx-8 px-6 md:px-8 py-4">
                         <button
                              onClick={onSkip}
                              className="absolute top-4 right-4 text-dark-text-secondary hover:text-dark-text transition-colors focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-surface rounded p-2 z-30"
                              aria-label="Close voice profile setup"
                         >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                         <div className="text-center pr-12">
                              <h2 className="text-xl md:text-2xl font-semibold text-dark-text mb-2">
                                   Choose an Archetype
                              </h2>
                              <p className="text-sm text-dark-text-secondary leading-relaxed">
                                   Select a pre-built voice template to get started quickly
                              </p>
                         </div>
                    </div>

                    {showErrorNotification && error && (
                         <div className="mb-6">
                              <ErrorNotification
                                   message={error}
                                   onClose={handleCloseErrorNotification}
                                   onRetry={handleRetry}
                              />
                         </div>
                    )}

                    <div className="mb-6">
                         <button
                              onClick={() => setCurrentPath('choose')}
                              className="text-sm text-dark-text-secondary hover:text-dark-text flex items-center"
                         >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                              Back
                         </button>
                    </div>

                    {loading && archetypes.length === 0 ? (
                         <LoadingSpinner size="lg" message="Loading archetypes..." />
                    ) : (
                         <div className="modal-body overflow-y-auto space-y-4">
                              {archetypes.map((archetype) => (
                                   <button
                                        key={archetype.id}
                                        onClick={() => setSelectedArchetype(archetype.id)}
                                        className={`w-full p-4 md:p-6 border rounded-lg text-left transition-colors ${selectedArchetype === archetype.id
                                             ? 'bg-dark-accent bg-opacity-10 border-dark-accent'
                                             : 'bg-dark-bg border-dark-border hover:bg-dark-surface-hover'
                                             }`}
                                        disabled={loading}
                                   >
                                        <h3 className="text-base md:text-lg font-medium text-dark-text mb-2">
                                             {archetype.name}
                                        </h3>
                                        <p className="text-sm text-dark-text-secondary leading-relaxed">
                                             {archetype.description}
                                        </p>
                                        <span className="inline-block mt-2 px-2 py-1 bg-dark-surface border border-dark-border rounded text-xs text-dark-text-secondary">
                                             {archetype.category}
                                        </span>
                                   </button>
                              ))}

                              <button
                                   onClick={handleArchetypeSelection}
                                   disabled={loading || !selectedArchetype}
                                   className="w-full px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                              >
                                   {loading ? (
                                        <span className="flex items-center justify-center">
                                             <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
                                             Applying...
                                        </span>
                                   ) : (
                                        'Apply Archetype'
                                   )}
                              </button>
                         </div>
                    )}
               </div>
          );
     }

     // Skip confirmation view
     if (currentPath === 'skip') {
          return (
               <div className="modal-content-mobile bg-dark-surface border border-dark-border rounded-lg p-6 md:p-8 max-w-2xl md:max-w-3xl mx-auto text-center relative">
                    <div className="modal-header flex-shrink-0 sticky top-0 z-20 bg-dark-surface border-b border-dark-border -mx-6 md:-mx-8 px-6 md:px-8 py-4">
                         <button
                              onClick={onSkip}
                              className="absolute top-4 right-4 text-dark-text-secondary hover:text-dark-text transition-colors focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-surface rounded p-2 z-30"
                              aria-label="Close voice profile setup"
                         >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                    </div>
                    <div className="modal-body overflow-y-auto">
                         <div className="mb-6">
                              <div className="w-16 h-16 bg-dark-bg border border-dark-border rounded-full flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                              </div>
                              <h2 className="text-xl md:text-2xl font-semibold text-dark-text mb-2">
                                   No Problem!
                              </h2>
                              <p className="text-sm text-dark-text-secondary leading-relaxed">
                                   You can start generating content right away. The system will learn your writing style from your edits over time.
                              </p>
                         </div>
                    </div>
               </div>
          );
     }

     return null;
};

export default StyleProfileSetup;
