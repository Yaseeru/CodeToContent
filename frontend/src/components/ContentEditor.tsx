import React, { useState, useEffect, useRef } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import { GeneratedContent } from './ContentGenerator';
import ErrorNotification from './ErrorNotification';

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
     const [editedText, setEditedText] = useState<string>(content.generatedText);
     const [isEdited, setIsEdited] = useState<boolean>(false);
     const [refining, setRefining] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);
     const [copySuccess, setCopySuccess] = useState<boolean>(false);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
     const lastRefineInstruction = useRef<'shorter' | 'clearer' | 'more engaging' | null>(null);

     useEffect(() => {
          // Only update if content actually changed (not just a re-render)
          // This preserves user edits during error scenarios
          if (content.generatedText !== editedText && !isEdited) {
               setEditedText(content.generatedText);
               setIsEdited(false);
          }
     }, [content, editedText, isEdited]);

     const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newText = e.target.value;
          setEditedText(newText);
          setIsEdited(newText !== content.generatedText);
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

     const handleRetryRefine = () => {
          if (lastRefineInstruction.current) {
               setShowErrorNotification(false);
               handleRefine(lastRefineInstruction.current);
          }
     };

     const handleCopy = async () => {
          try {
               await navigator.clipboard.writeText(editedText);
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

               <div className="flex items-center justify-between">
                    <div>
                         <h4 className="text-base font-medium text-dark-text">
                              {content.platform === 'linkedin' ? 'LinkedIn' : 'X (Twitter)'} Content
                         </h4>
                         <p className="text-sm text-dark-text-secondary mt-1">
                              Tone: {content.tone} | Version: {content.version}
                              {isEdited && ' (edited)'}
                         </p>
                    </div>
                    <button
                         onClick={onRegenerate}
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                    >
                         Regenerate
                    </button>
               </div>

               <textarea
                    value={editedText}
                    onChange={handleTextChange}
                    rows={8}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-base text-dark-text placeholder-dark-text-tertiary focus:border-dark-accent resize-y"
                    placeholder="Generated content will appear here..."
               />

               <div className="flex flex-wrap gap-2">
                    <button
                         onClick={() => handleRefine('shorter')}
                         disabled={refining}
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {refining ? 'Refining...' : 'Make Shorter'}
                    </button>
                    <button
                         onClick={() => handleRefine('clearer')}
                         disabled={refining}
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {refining ? 'Refining...' : 'Make Clearer'}
                    </button>
                    <button
                         onClick={() => handleRefine('more engaging')}
                         disabled={refining}
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {refining ? 'Refining...' : 'Make More Engaging'}
                    </button>
                    <button
                         onClick={handleCopy}
                         className="ml-auto px-6 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                    >
                         {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
               </div>
          </div>
     );
};

export default ContentEditor;
