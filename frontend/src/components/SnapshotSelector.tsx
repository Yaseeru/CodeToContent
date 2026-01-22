import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import LoadingSpinner from './LoadingSpinner';

// Type definitions matching backend CodeSnapshot model
interface SnippetMetadata {
     filePath: string;
     startLine: number;
     endLine: number;
     functionName?: string;
     language: string;
     linesOfCode: number;
}

interface ImageDimensions {
     width: number;
     height: number;
}

interface RenderOptions {
     theme: string;
     showLineNumbers: boolean;
     fontSize: number;
}

export interface CodeSnapshot {
     _id: string;
     repositoryId: string;
     analysisId: string;
     userId: string;
     snippetMetadata: SnippetMetadata;
     selectionScore: number;
     selectionReason: string;
     imageUrl: string;
     imageSize: number;
     imageDimensions: ImageDimensions;
     renderOptions: RenderOptions;
     isStale: boolean;
     lastCommitSha: string;
     createdAt: string;
     updatedAt: string;
}

export interface SnapshotSelectorProps {
     repositoryId: string;
     onSnapshotSelected: (snapshot: CodeSnapshot) => void;
     onClose: () => void;
}

const SnapshotSelector: React.FC<SnapshotSelectorProps> = ({
     repositoryId,
     onSnapshotSelected,
     onClose,
}) => {
     const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([]);
     const [loading, setLoading] = useState<boolean>(true);
     const [error, setError] = useState<string | null>(null);
     const [selectedSnapshot, setSelectedSnapshot] = useState<CodeSnapshot | null>(null);
     const [generating, setGenerating] = useState<boolean>(false);
     const [generateError, setGenerateError] = useState<string | null>(null);

     useEffect(() => {
          fetchSnapshots();
     }, [repositoryId]);

     const fetchSnapshots = async () => {
          try {
               setLoading(true);
               setError(null);

               const response = await apiClient.get<{ snapshots: CodeSnapshot[] }>(
                    `/api/snapshots/${repositoryId}`
               );

               setSnapshots(response.data.snapshots);
          } catch (err) {
               console.error('Error fetching snapshots:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
          } finally {
               setLoading(false);
          }
     };

     const handleGenerateSnapshots = async () => {
          try {
               setGenerating(true);
               setGenerateError(null);

               await apiClient.post(`/api/snapshots/generate`, {
                    repositoryId,
               });

               // Refresh snapshot list after generation
               await fetchSnapshots();
          } catch (err) {
               console.error('Error generating snapshots:', err);
               const errorMessage = getErrorMessage(err);
               setGenerateError(errorMessage);
          } finally {
               setGenerating(false);
          }
     };

     const handleThumbnailClick = (snapshot: CodeSnapshot) => {
          setSelectedSnapshot(snapshot);
     };

     const handleSelectSnapshot = () => {
          if (selectedSnapshot) {
               onSnapshotSelected(selectedSnapshot);
               onClose();
          }
     };

     const handleClosePreview = () => {
          setSelectedSnapshot(null);
     };

     const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
          if (e.target === e.currentTarget) {
               if (selectedSnapshot) {
                    handleClosePreview();
               } else {
                    onClose();
               }
          }
     };

     // Format file path to show only filename and parent directory
     const formatFilePath = (filePath: string): string => {
          const parts = filePath.split('/');
          if (parts.length > 2) {
               return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
          }
          return filePath;
     };

     return (
          <div
               className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
               onClick={handleBackdropClick}
          >
               {/* Main Modal */}
               {!selectedSnapshot && (
                    <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                         {/* Header */}
                         <div className="flex items-center justify-between p-6 border-b border-dark-border">
                              <div>
                                   <h2 className="text-xl font-semibold text-dark-text">
                                        Select Code Snapshot
                                   </h2>
                                   <p className="text-sm text-dark-text-secondary mt-1">
                                        Choose a code visual to attach to your content
                                   </p>
                              </div>
                              <div className="flex items-center gap-3">
                                   <button
                                        onClick={handleGenerateSnapshots}
                                        disabled={generating}
                                        className="px-4 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                   >
                                        {generating ? (
                                             <>
                                                  <svg
                                                       className="animate-spin h-4 w-4"
                                                       fill="none"
                                                       viewBox="0 0 24 24"
                                                  >
                                                       <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                       />
                                                       <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                       />
                                                  </svg>
                                                  Generating...
                                             </>
                                        ) : (
                                             <>
                                                  <svg
                                                       className="w-4 h-4"
                                                       fill="none"
                                                       stroke="currentColor"
                                                       viewBox="0 0 24 24"
                                                  >
                                                       <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                       />
                                                  </svg>
                                                  Generate Snapshots
                                             </>
                                        )}
                                   </button>
                                   <button
                                        onClick={onClose}
                                        className="text-dark-text-secondary hover:text-dark-text transition-colors"
                                        aria-label="Close modal"
                                   >
                                        <svg
                                             className="w-6 h-6"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                        >
                                             <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M6 18L18 6M6 6l12 12"
                                             />
                                        </svg>
                                   </button>
                              </div>
                         </div>

                         {/* Content */}
                         <div className="flex-1 overflow-y-auto p-6">
                              {loading && (
                                   <div className="flex items-center justify-center py-12">
                                        <LoadingSpinner size="md" message="Loading snapshots..." />
                                   </div>
                              )}

                              {generating && (
                                   <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                             <svg
                                                  className="animate-spin h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                             >
                                                  <circle
                                                       className="opacity-25"
                                                       cx="12"
                                                       cy="12"
                                                       r="10"
                                                       stroke="currentColor"
                                                       strokeWidth="4"
                                                  />
                                                  <path
                                                       className="opacity-75"
                                                       fill="currentColor"
                                                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                  />
                                             </svg>
                                             <div className="flex-1">
                                                  <p className="text-sm text-blue-200 font-medium">
                                                       Generating code snapshots...
                                                  </p>
                                                  <p className="text-xs text-blue-300 mt-1">
                                                       This may take a few moments. We're analyzing your repository and creating beautiful code visuals.
                                                  </p>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {generateError && (
                                   <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                             <svg
                                                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                             >
                                                  <path
                                                       strokeLinecap="round"
                                                       strokeLinejoin="round"
                                                       strokeWidth={2}
                                                       d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                             </svg>
                                             <div className="flex-1">
                                                  <p className="text-sm text-red-200 font-medium">
                                                       Failed to generate snapshots
                                                  </p>
                                                  <p className="text-xs text-red-300 mt-1">{generateError}</p>
                                                  <button
                                                       onClick={handleGenerateSnapshots}
                                                       disabled={generating}
                                                       className="mt-2 text-sm text-red-300 hover:text-red-200 underline disabled:opacity-50"
                                                  >
                                                       Try again
                                                  </button>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {error && (
                                   <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                             <svg
                                                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                             >
                                                  <path
                                                       strokeLinecap="round"
                                                       strokeLinejoin="round"
                                                       strokeWidth={2}
                                                       d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                             </svg>
                                             <div className="flex-1">
                                                  <p className="text-sm text-red-200">{error}</p>
                                                  <button
                                                       onClick={fetchSnapshots}
                                                       className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                                                  >
                                                       Try again
                                                  </button>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {!loading && !error && snapshots.length === 0 && (
                                   <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <svg
                                             className="w-16 h-16 text-dark-text-secondary mb-4"
                                             fill="none"
                                             stroke="currentColor"
                                             viewBox="0 0 24 24"
                                        >
                                             <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={1.5}
                                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                             />
                                        </svg>
                                        <h3 className="text-lg font-medium text-dark-text mb-2">
                                             No code snapshots yet
                                        </h3>
                                        <p className="text-sm text-dark-text-secondary max-w-md mb-4">
                                             Generate beautiful code visuals from your repository to attach to your content.
                                        </p>
                                        <button
                                             onClick={handleGenerateSnapshots}
                                             disabled={generating}
                                             className="px-6 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                             {generating ? (
                                                  <>
                                                       <svg
                                                            className="animate-spin h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                       >
                                                            <circle
                                                                 className="opacity-25"
                                                                 cx="12"
                                                                 cy="12"
                                                                 r="10"
                                                                 stroke="currentColor"
                                                                 strokeWidth="4"
                                                            />
                                                            <path
                                                                 className="opacity-75"
                                                                 fill="currentColor"
                                                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                       </svg>
                                                       Generating...
                                                  </>
                                             ) : (
                                                  <>
                                                       <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                       >
                                                            <path
                                                                 strokeLinecap="round"
                                                                 strokeLinejoin="round"
                                                                 strokeWidth={2}
                                                                 d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                       </svg>
                                                       Generate Snapshots
                                                  </>
                                             )}
                                        </button>
                                   </div>
                              )}

                              {!loading && !error && snapshots.length > 0 && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {snapshots.map((snapshot) => (
                                             <button
                                                  key={snapshot._id}
                                                  onClick={() => handleThumbnailClick(snapshot)}
                                                  className="group relative bg-dark-bg border border-dark-border rounded-lg overflow-hidden hover:border-dark-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-surface"
                                             >
                                                  {/* Thumbnail Image */}
                                                  <div className="aspect-video bg-dark-bg flex items-center justify-center overflow-hidden">
                                                       <img
                                                            src={snapshot.imageUrl}
                                                            alt={`Code snapshot from ${snapshot.snippetMetadata.filePath}`}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                            loading="lazy"
                                                       />
                                                  </div>

                                                  {/* Metadata */}
                                                  <div className="p-3 space-y-2">
                                                       <div className="flex items-start justify-between gap-2">
                                                            <p className="text-xs font-mono text-dark-text truncate flex-1">
                                                                 {formatFilePath(snapshot.snippetMetadata.filePath)}
                                                            </p>
                                                            <span className="flex-shrink-0 px-2 py-0.5 bg-dark-accent bg-opacity-20 text-dark-accent text-xs font-medium rounded">
                                                                 {snapshot.selectionScore}
                                                            </span>
                                                       </div>
                                                       <p className="text-xs text-dark-text-secondary line-clamp-2 text-left">
                                                            {snapshot.selectionReason}
                                                       </p>
                                                       <div className="flex items-center gap-2 text-xs text-dark-text-secondary">
                                                            <span className="px-2 py-0.5 bg-dark-border rounded">
                                                                 {snapshot.snippetMetadata.language}
                                                            </span>
                                                            <span>
                                                                 {snapshot.snippetMetadata.linesOfCode} lines
                                                            </span>
                                                       </div>
                                                  </div>

                                                  {/* Stale indicator */}
                                                  {snapshot.isStale && (
                                                       <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-600 bg-opacity-90 text-white text-xs font-medium rounded">
                                                            Outdated
                                                       </div>
                                                  )}
                                             </button>
                                        ))}
                                   </div>
                              )}
                         </div>
                    </div>
               )}

               {/* Preview Modal */}
               {selectedSnapshot && (
                    <div className="bg-dark-surface border border-dark-border rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                         {/* Header */}
                         <div className="flex items-center justify-between p-6 border-b border-dark-border">
                              <div className="flex-1">
                                   <h2 className="text-xl font-semibold text-dark-text">
                                        Preview Code Snapshot
                                   </h2>
                                   <p className="text-sm text-dark-text-secondary mt-1">
                                        {selectedSnapshot.snippetMetadata.filePath}
                                   </p>
                              </div>
                              <button
                                   onClick={handleClosePreview}
                                   className="text-dark-text-secondary hover:text-dark-text transition-colors"
                                   aria-label="Close preview"
                              >
                                   <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                   >
                                        <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M6 18L18 6M6 6l12 12"
                                        />
                                   </svg>
                              </button>
                         </div>

                         {/* Preview Content */}
                         <div className="flex-1 overflow-y-auto p-6">
                              <div className="space-y-6">
                                   {/* Full-size Image */}
                                   <div className="bg-dark-bg rounded-lg overflow-hidden border border-dark-border">
                                        <img
                                             src={selectedSnapshot.imageUrl}
                                             alt={`Code snapshot from ${selectedSnapshot.snippetMetadata.filePath}`}
                                             className="w-full h-auto"
                                        />
                                   </div>

                                   {/* Metadata Details */}
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3">
                                             <h3 className="text-sm font-semibold text-dark-text">
                                                  Snippet Details
                                             </h3>
                                             <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                       <span className="text-dark-text-secondary">File:</span>
                                                       <span className="text-dark-text font-mono text-xs">
                                                            {selectedSnapshot.snippetMetadata.filePath}
                                                       </span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                       <span className="text-dark-text-secondary">Lines:</span>
                                                       <span className="text-dark-text">
                                                            {selectedSnapshot.snippetMetadata.startLine}-
                                                            {selectedSnapshot.snippetMetadata.endLine}
                                                       </span>
                                                  </div>
                                                  {selectedSnapshot.snippetMetadata.functionName && (
                                                       <div className="flex justify-between">
                                                            <span className="text-dark-text-secondary">Function:</span>
                                                            <span className="text-dark-text font-mono text-xs">
                                                                 {selectedSnapshot.snippetMetadata.functionName}
                                                            </span>
                                                       </div>
                                                  )}
                                                  <div className="flex justify-between">
                                                       <span className="text-dark-text-secondary">Language:</span>
                                                       <span className="text-dark-text">
                                                            {selectedSnapshot.snippetMetadata.language}
                                                       </span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                       <span className="text-dark-text-secondary">Lines of Code:</span>
                                                       <span className="text-dark-text">
                                                            {selectedSnapshot.snippetMetadata.linesOfCode}
                                                       </span>
                                                  </div>
                                             </div>
                                        </div>

                                        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3">
                                             <h3 className="text-sm font-semibold text-dark-text">
                                                  Selection Info
                                             </h3>
                                             <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between items-center">
                                                       <span className="text-dark-text-secondary">Score:</span>
                                                       <span className="px-3 py-1 bg-dark-accent bg-opacity-20 text-dark-accent font-semibold rounded">
                                                            {selectedSnapshot.selectionScore}/100
                                                       </span>
                                                  </div>
                                                  <div>
                                                       <span className="text-dark-text-secondary block mb-1">Reason:</span>
                                                       <p className="text-dark-text text-xs leading-relaxed">
                                                            {selectedSnapshot.selectionReason}
                                                       </p>
                                                  </div>
                                                  {selectedSnapshot.isStale && (
                                                       <div className="pt-2 border-t border-dark-border">
                                                            <div className="flex items-center gap-2 text-yellow-500">
                                                                 <svg
                                                                      className="w-4 h-4"
                                                                      fill="none"
                                                                      stroke="currentColor"
                                                                      viewBox="0 0 24 24"
                                                                 >
                                                                      <path
                                                                           strokeLinecap="round"
                                                                           strokeLinejoin="round"
                                                                           strokeWidth={2}
                                                                           d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                                      />
                                                                 </svg>
                                                                 <span className="text-xs">
                                                                      This snapshot is outdated
                                                                 </span>
                                                            </div>
                                                       </div>
                                                  )}
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         {/* Footer Actions */}
                         <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-border">
                              <button
                                   onClick={handleClosePreview}
                                   className="px-4 py-2 text-sm font-medium text-dark-text hover:text-dark-text-secondary transition-colors"
                              >
                                   Cancel
                              </button>
                              <button
                                   onClick={handleSelectSnapshot}
                                   className="px-6 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover transition-colors"
                              >
                                   Select
                              </button>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default SnapshotSelector;
