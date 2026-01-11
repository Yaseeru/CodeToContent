import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GeneratedContent } from './ContentGenerator';

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

     useEffect(() => {
          setEditedText(content.generatedText);
          setIsEdited(false);
     }, [content]);

     const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newText = e.target.value;
          setEditedText(newText);
          setIsEdited(newText !== content.generatedText);
     };

     const handleRefine = async (instruction: 'shorter' | 'clearer' | 'more engaging') => {
          try {
               setRefining(true);
               setError(null);

               const token = localStorage.getItem('token');
               if (!token) {
                    throw new Error('No authentication token found');
               }

               const response = await axios.post(
                    '/api/content/refine',
                    {
                         contentId: content.id,
                         instruction,
                    },
                    {
                         headers: {
                              Authorization: `Bearer ${token}`,
                         },
                    }
               );

               const refinedContent = response.data.content;
               onContentUpdate(refinedContent);
          } catch (err) {
               console.error('Error refining content:', err);
               if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                         setError('Authentication failed. Please log in again.');
                         localStorage.removeItem('token');
                         window.location.href = '/';
                    } else if (err.response?.status === 404) {
                         setError('Content not found.');
                    } else if (err.response?.status === 429) {
                         setError('API rate limit exceeded. Please try again later.');
                    } else if (err.response?.status === 503) {
                         setError('AI service temporarily unavailable. Please try again later.');
                    } else {
                         setError(err.response?.data?.message || 'Failed to refine content');
                    }
               } else {
                    setError('An unexpected error occurred');
               }
          } finally {
               setRefining(false);
          }
     };

     const handleCopy = async () => {
          try {
               await navigator.clipboard.writeText(editedText);
               setCopySuccess(true);
               setTimeout(() => setCopySuccess(false), 2000);
          } catch (err) {
               console.error('Failed to copy text:', err);
               setError('Failed to copy to clipboard');
          }
     };

     return (
          <div className="space-y-4">
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
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg"
                    >
                         Regenerate
                    </button>
               </div>

               {error && (
                    <div className="bg-dark-error-bg border border-dark-error rounded-lg p-3">
                         <p className="text-dark-error text-sm">{error}</p>
                    </div>
               )}

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
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {refining ? 'Refining...' : 'Make Shorter'}
                    </button>
                    <button
                         onClick={() => handleRefine('clearer')}
                         disabled={refining}
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {refining ? 'Refining...' : 'Make Clearer'}
                    </button>
                    <button
                         onClick={() => handleRefine('more engaging')}
                         disabled={refining}
                         className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {refining ? 'Refining...' : 'Make More Engaging'}
                    </button>
                    <button
                         onClick={handleCopy}
                         className="ml-auto px-6 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg"
                    >
                         {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
               </div>
          </div>
     );
};

export default ContentEditor;
