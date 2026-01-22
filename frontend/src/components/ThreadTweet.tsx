import React, { useState } from 'react';
import { Tweet } from './ContentGenerator';

interface ThreadTweetProps {
     tweet: Tweet;
     totalTweets: number;
     onEdit: (position: number, newText: string) => void;
     isEditing: boolean;
     onToggleEdit: () => void;
}

const ThreadTweet: React.FC<ThreadTweetProps> = ({
     tweet,
     totalTweets,
     onEdit,
     isEditing,
     onToggleEdit,
}) => {
     const [text, setText] = useState(tweet.text);
     const isOverLimit = text.length > 280;
     const isLastTweet = tweet.position === totalTweets;

     const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newText = e.target.value;
          setText(newText);
          onEdit(tweet.position, newText);
     };

     return (
          <div className="relative">
               <div className="bg-dark-surface border border-dark-border rounded-lg p-4 space-y-3">
                    {/* Tweet Header */}
                    <div className="flex items-center justify-between">
                         <span className="text-xs font-medium text-dark-text-secondary">
                              {tweet.position}/{totalTweets}
                         </span>
                         <div className="flex items-center gap-3">
                              <span
                                   className={`text-xs font-medium ${isOverLimit
                                             ? 'text-red-500'
                                             : text.length > 260
                                                  ? 'text-yellow-500'
                                                  : 'text-dark-text-secondary'
                                        }`}
                              >
                                   {text.length}/280
                              </span>
                              <button
                                   onClick={onToggleEdit}
                                   className="text-xs text-dark-accent hover:text-dark-accent-hover font-medium transition-colors"
                                   aria-label={isEditing ? 'Stop editing' : 'Edit tweet'}
                              >
                                   {isEditing ? 'Done' : 'Edit'}
                              </button>
                         </div>
                    </div>

                    {/* Tweet Content */}
                    {isEditing ? (
                         <textarea
                              value={text}
                              onChange={handleTextChange}
                              rows={4}
                              className={`w-full px-3 py-2 bg-dark-bg border rounded-lg text-sm text-dark-text placeholder-dark-text-tertiary focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface resize-y transition-colors ${isOverLimit
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-dark-border focus:border-dark-accent focus:ring-dark-accent'
                                   }`}
                              placeholder="Tweet text..."
                              aria-label={`Edit tweet ${tweet.position}`}
                         />
                    ) : (
                         <p className="text-sm text-dark-text leading-relaxed whitespace-pre-wrap">
                              {text}
                         </p>
                    )}

                    {/* Character Limit Warning */}
                    {isOverLimit && (
                         <div className="flex items-start gap-2 text-xs text-red-500">
                              <svg
                                   className="w-4 h-4 mt-0.5 flex-shrink-0"
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
                              <span>Tweet exceeds 280 character limit</span>
                         </div>
                    )}
               </div>

               {/* Thread Connector */}
               {!isLastTweet && (
                    <div className="flex justify-center py-2">
                         <div className="w-0.5 h-4 bg-dark-border"></div>
                    </div>
               )}
          </div>
     );
};

export default ThreadTweet;
