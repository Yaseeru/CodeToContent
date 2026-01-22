import React, { useState, useEffect, useRef } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import { GeneratedContent, Tweet } from './ContentGenerator';
import ErrorNotification from './ErrorNotification';
import ThreadTweet from './ThreadTweet';

interface ContentEditorProps {
     content: GeneratedContent;
     onRegenerate: () => void;
     onContentUpdate: (updatedContent: GeneratedContent) => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
     content,
     onRegenerate,
     onContentUpdate,
}) => {
     // Detect if content is a thread
     const isThread = content.tweets !== undefined && content.tweets.length > 0;

     const [editedText, setEditedText] = useState<string>(content.generatedText);
     const [originalText, setOriginalText] = useState<string>(content.generatedText);
     const [isEdited, setIsEdited] = useState<boolean>(false);

     // Thread editing state
     const [editedTweets, setEditedTweets] = useState<Map<number, string>>(new Map());
     const [editingTweetPosition, setEditingTweetPosition] = useState<number | null>(null);

     const [refining, setRefining] = useState<boolean>(false);
     const [saving, setSaving] = useState<boolean>(false);
     const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
     const [isLearning, setIsLearning] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);
     const [copySuccess, setCopySuccess] = useState<boolean>(false);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
     const lastRefineInstruction = useRef<'shorter' | 'clearer' | 'more engaging' | null>(null);

     // Track if content has an attached snapshot
     const hasAttachedSnapshot = content.imageUrl && content.snapshotId;

     useEffect(() => {
          // Only update if content actually changed (not just a re-render)
          // This preserves user edits during error scenarios
          if (content.generatedText !== editedText && !isEdited) {
               setEditedText(content.generatedText);
               setOriginalText(content.generatedText);
               setIsEdited(false);
               setSaveSuccess(false);
               setIsLearning(false);
          }

          // Reset thread editing state when content changes
          if (isThread) {
               setEditedTweets(new Map());
               setEditingTweetPosition(null);
          }
     }, [content, editedText, isEdited, isThread]);

     const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newText = e.target.value;
          setEditedText(newText);
          setIsEdited(newText !== originalText);
          setSaveSuccess(false);
     };

     // Thread editing handlers
     const handleTweetEdit = (position: number, newText: string) => {
          setEditedTweets(prev => {
               const updated = new Map(prev);
               updated.set(position, newText);
               return updated;
          });
          setIsEdited(true);
          setSaveSuccess(false);
     };

     const handleToggleEditTweet = (position: number) => {
          setEditingTweetPosition(prev => prev === position ? null : position);
     };

     const saveThreadEdits = async () => {
          if (editedTweets.size === 0) return;

          try {
               setSaving(true);
               setError(null);
               setShowErrorNotification(false);
               setIsLearning(true);

               // Format edited tweets as array
               const editsArray = Array.from(editedTweets.entries()).map(([position, text]) => ({
                    position,
                    text,
               }));

               await apiClient.post(
                    `/api/content/${content.id}/save-edits`,
                    {
                         editedTweets: editsArray,
                    }
               );

               // Clear edited tweets and reset state
               setEditedTweets(new Map());
               setIsEdited(false);
               setSaveSuccess(true);
               setEditingTweetPosition(null);

               // Show learning indicator for 3 seconds
               setTimeout(() => {
                    setIsLearning(false);
               }, 3000);

               // Hide success message after 2 seconds
               setTimeout(() => {
                    setSaveSuccess(false);
               }, 2000);
          } catch (err) {
               console.error('Error saving thread edits:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               setIsLearning(false);
          } finally {
               setSaving(false);
          }
     };

     const handleRefine = async (instruction: 'shorter' | 'clearer' | 'more engaging') => {
          try {
               setRefining(true);
               setError(null);
               setShowErrorNotification(false);
               lastRefineInstruction.current = instruction;

               const response = await apiClient.post(
                    '/api/content/refine',
                    {
                         contentId: content.id,
                         instruction,
                    }
               );

               const refinedContent = response.data.content;
               onContentUpdate(refinedContent);
          } catch (err) {
               console.error('Error refining content:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               // User's edited text is preserved in state
          } finally {
               setRefining(false);
          }
     };

     const handleSaveEdits = async () => {
          if (!isEdited) return;

          try {
               setSaving(true);
               setError(null);
               setShowErrorNotification(false);
               setIsLearning(true);

               await apiClient.post(
                    `/api/content/${content.id}/save-edits`,
                    {
                         editedText,
                    }
               );

               // Update the original text to the saved version
               setOriginalText(editedText);
               setIsEdited(false);
               setSaveSuccess(true);

               // Show learning indicator for 3 seconds
               setTimeout(() => {
                    setIsLearning(false);
               }, 3000);

               // Hide success message after 2 seconds
               setTimeout(() => {
                    setSaveSuccess(false);
               }, 2000);
          } catch (err) {
               console.error('Error saving edits:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               setIsLearning(false);
          } finally {
               setSaving(false);
          }
     };

     const handleRetryRefine = () => {
          if (lastRefineInstruction.current) {
               setShowErrorNotification(false);
               handleRefine(lastRefineInstruction.current);
          }
     };

     const handleCopy = async () => {
          try {
               const textToCopy = isThread && content.tweets
                    ? content.tweets.map(t => t.text).join('\n\n')
                    : editedText;
               await navigator.clipboard.writeText(textToCopy);
               setCopySuccess(true);
               setTimeout(() => setCopySuccess(false), 2000);
          } catch (err) {
               console.error('Failed to copy text:', err);
               const errorMessage = 'Failed to copy to clipboard';
               setError(errorMessage);
               setShowErrorNotification(true);
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
                         onRetry={lastRefineInstruction.current ? handleRetryRefine : undefined}
                    />
               )}

               {isLearning && (
                    <div className="bg-dark-accent/10 border border-dark-accent/30 rounded-lg p-3 flex items-center gap-2">
                         <svg className="animate-spin h-5 w-5 text-dark-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         <span className="text-sm text-dark-accent font-medium">Learning from your edits...</span>
                    </div>
               )}

               {saveSuccess && !isLearning && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                         <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                         <span className="text-sm text-green-500 font-medium">Edits saved successfully!</span>
                    </div>
               )}

               {/* Attached Snapshot Display */}
               {hasAttachedSnapshot && (
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
                         <h4 className="text-sm font-medium text-dark-text mb-3">Attached Visual</h4>
                         <div className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden">
                              <div className="aspect-video">
                                   <img
                                        src={content.imageUrl}
                                        alt="Attached code snapshot"
                                        className="w-full h-full object-cover"
                                   />
                              </div>
                         </div>
                    </div>
               )}

               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                         <h4 className="text-base font-medium text-dark-text">
                              X (Twitter) Content
                              {isThread && content.tweets && (
                                   <span className="ml-2 text-sm text-dark-text-secondary">
                                        ({content.tweets.length} tweets)
                                   </span>
                              )}
                         </h4>
                         <p className="text-sm text-dark-text-secondary mt-1">
                              Platform: {content.platform} | Version: {content.version}
                              {isEdited && ' (edited)'}
                         </p>
                    </div>
                    <button
                         onClick={onRegenerate}
                         className="px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                         aria-label="Regenerate content"
                    >
                         Regenerate
                    </button>
               </div>

               {/* Thread Display */}
               {isThread && content.tweets ? (
                    <div className="space-y-0">
                         {content.tweets.map((tweet) => {
                              const currentText = editedTweets.get(tweet.position) || tweet.text;
                              const tweetWithCurrentText = {
                                   ...tweet,
                                   text: currentText,
                              };

                              return (
                                   <ThreadTweet
                                        key={tweet.position}
                                        tweet={tweetWithCurrentText}
                                        totalTweets={content.tweets!.length}
                                        onEdit={handleTweetEdit}
                                        isEditing={editingTweetPosition === tweet.position}
                                        onToggleEdit={() => handleToggleEditTweet(tweet.position)}
                                   />
                              );
                         })}
                    </div>
               ) : (
                    /* Single Post Display */
                    <textarea
                         value={editedText}
                         onChange={handleTextChange}
                         rows={8}
                         className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-base text-dark-text placeholder-dark-text-tertiary focus:border-dark-accent focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg resize-y transition-colors"
                         placeholder="Generated content will appear here..."
                         aria-label="Content editor"
                    />
               )}

               <div className="flex flex-col gap-3">
                    {/* Refine buttons - only for single posts */}
                    {!isThread && (
                         <div className="flex flex-wrap gap-2">
                              <button
                                   onClick={() => handleRefine('shorter')}
                                   disabled={refining}
                                   className="px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                   aria-label="Make content shorter"
                              >
                                   {refining ? 'Refining...' : 'Make Shorter'}
                              </button>
                              <button
                                   onClick={() => handleRefine('clearer')}
                                   disabled={refining}
                                   className="px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                   aria-label="Make content clearer"
                              >
                                   {refining ? 'Refining...' : 'Make Clearer'}
                              </button>
                              <button
                                   onClick={() => handleRefine('more engaging')}
                                   disabled={refining}
                                   className="px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                   aria-label="Make content more engaging"
                              >
                                   {refining ? 'Refining...' : 'Make More Engaging'}
                              </button>
                         </div>
                    )}

                    {/* Save and Copy buttons */}
                    <div className="flex flex-wrap gap-2">
                         {isEdited && (
                              <button
                                   onClick={isThread ? saveThreadEdits : handleSaveEdits}
                                   disabled={saving}
                                   className="px-4 py-3 min-h-[44px] bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                   aria-label="Save your edits"
                              >
                                   {saving ? 'Saving...' : 'Save Edits'}
                              </button>
                         )}
                         <button
                              onClick={handleCopy}
                              className="px-4 py-3 min-h-[44px] bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors sm:ml-auto"
                              aria-label="Copy content to clipboard"
                         >
                              {copySuccess ? 'Copied!' : 'Copy'}
                         </button>
                    </div>
               </div>
          </div>
     );
};

export default ContentEditor;
