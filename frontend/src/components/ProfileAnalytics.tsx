import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';

// Type definitions matching backend
interface ToneMetrics {
     formality: number;
     enthusiasm: number;
     directness: number;
     humor: number;
     emotionality: number;
}

interface WritingTraits {
     avgSentenceLength: number;
     usesQuestionsOften: boolean;
     usesEmojis: boolean;
     emojiFrequency: number;
     usesBulletPoints: boolean;
     usesShortParagraphs: boolean;
     usesHooks: boolean;
}

interface EvolutionMilestone {
     date: string;
     event: string;
     score: number;
}

interface BeforeAfterExample {
     before: string;
     after: string;
     improvement: string;
}

interface ProfileAnalytics {
     evolutionScore: number;
     editCount: number;
     learningIterations: number;
     lastUpdated: string;
     toneDistribution: ToneMetrics;
     commonPhrases: string[];
     bannedPhrases: string[];
     writingTraits: WritingTraits;
     evolutionTimeline: EvolutionMilestone[];
     beforeAfterExamples: BeforeAfterExample[];
}

interface ProfileAnalyticsProps {
     onClose?: () => void;
}

const ProfileAnalytics: React.FC<ProfileAnalyticsProps> = ({ onClose }) => {
     const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
     const [loading, setLoading] = useState<boolean>(true);
     const [error, setError] = useState<string | null>(null);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);

     useEffect(() => {
          loadAnalytics();
     }, []);

     const loadAnalytics = async () => {
          try {
               setLoading(true);
               const response = await apiClient.get<ProfileAnalytics>('/api/profile/analytics');
               setAnalytics(response.data);
          } catch (err) {
               console.error('Error loading analytics:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
          } finally {
               setLoading(false);
          }
     };

     const handleCloseErrorNotification = () => {
          setShowErrorNotification(false);
          setError(null);
     };

     const getEvolutionScoreColor = (score: number): string => {
          if (score >= 70) return 'text-green-500';
          if (score >= 30) return 'text-yellow-500';
          return 'text-red-500';
     };

     const getEvolutionScoreBadge = (score: number): string => {
          if (score >= 70) return 'Voice profile well-trained';
          if (score >= 30) return 'Voice profile learning';
          return 'Voice profile needs training';
     };

     const getSuggestions = (score: number, editCount: number): string[] => {
          const suggestions: string[] = [];

          if (score < 30) {
               suggestions.push('Provide initial writing samples to jumpstart your profile');
               suggestions.push('Generate and edit more content to help the system learn your style');
          } else if (score < 70) {
               suggestions.push('Continue editing generated content to refine your voice');
               suggestions.push('Add more common phrases that represent your style');
          } else {
               suggestions.push('Your voice profile is well-trained! Keep using it for best results');
               suggestions.push('Review and update banned phrases to avoid unwanted language');
          }

          if (editCount < 5) {
               suggestions.push('Make at least 5 edits to enable major profile improvements');
          }

          return suggestions;
     };

     if (loading) {
          return (
               <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
                    <div className="flex items-center justify-center py-12">
                         <span className="w-8 h-8 border-4 border-dark-accent border-t-transparent rounded-full spinner"></span>
                    </div>
               </div>
          );
     }

     if (!analytics) {
          return (
               <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
                    <div className="text-center py-12">
                         <p className="text-dark-text-secondary mb-4">
                              No analytics available. Please set up your voice profile first.
                         </p>
                         {onClose && (
                              <button
                                   onClick={onClose}
                                   className="px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                              >
                                   Close
                              </button>
                         )}
                    </div>
               </div>
          );
     }

     const suggestions = getSuggestions(analytics.evolutionScore, analytics.editCount);

     return (
          <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
               {showErrorNotification && error && (
                    <div className="mb-6">
                         <ErrorNotification
                              message={error}
                              onClose={handleCloseErrorNotification}
                         />
                    </div>
               )}

               {/* Header */}
               <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-dark-text">
                         Voice Profile Analytics
                    </h2>
                    {onClose && (
                         <button
                              onClick={onClose}
                              className="text-dark-text-secondary hover:text-dark-text"
                         >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                    )}
               </div>

               <div className="space-y-8">
                    {/* Profile Evolution Score */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Profile Evolution Score</h3>
                         <div className="flex items-center gap-6">
                              <div className="relative w-32 h-32">
                                   <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                             cx="64"
                                             cy="64"
                                             r="56"
                                             stroke="currentColor"
                                             strokeWidth="8"
                                             fill="none"
                                             className="text-dark-border"
                                        />
                                        <circle
                                             cx="64"
                                             cy="64"
                                             r="56"
                                             stroke="currentColor"
                                             strokeWidth="8"
                                             fill="none"
                                             strokeDasharray={`${2 * Math.PI * 56}`}
                                             strokeDashoffset={`${2 * Math.PI * 56 * (1 - analytics.evolutionScore / 100)}`}
                                             className={getEvolutionScoreColor(analytics.evolutionScore)}
                                             strokeLinecap="round"
                                        />
                                   </svg>
                                   <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-3xl font-bold ${getEvolutionScoreColor(analytics.evolutionScore)}`}>
                                             {analytics.evolutionScore}%
                                        </span>
                                   </div>
                              </div>
                              <div className="flex-1">
                                   <div className="inline-block px-3 py-1 bg-dark-surface border border-dark-border rounded-full text-sm text-dark-text mb-3">
                                        {getEvolutionScoreBadge(analytics.evolutionScore)}
                                   </div>
                                   <p className="text-sm text-dark-text-secondary leading-relaxed">
                                        Your voice profile evolution score indicates how well-trained the system is to match your writing style.
                                        Higher scores mean more personalized content generation.
                                   </p>
                              </div>
                         </div>
                    </div>

                    {/* Learning Statistics */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Learning Statistics</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                   <div className="text-3xl font-bold text-dark-accent mb-1">
                                        {analytics.editCount}
                                   </div>
                                   <div className="text-sm text-dark-text-secondary">
                                        Total Edits
                                   </div>
                              </div>
                              <div>
                                   <div className="text-3xl font-bold text-dark-accent mb-1">
                                        {analytics.learningIterations}
                                   </div>
                                   <div className="text-sm text-dark-text-secondary">
                                        Learning Iterations
                                   </div>
                              </div>
                              <div>
                                   <div className="text-3xl font-bold text-dark-accent mb-1">
                                        {new Date(analytics.lastUpdated).toLocaleDateString()}
                                   </div>
                                   <div className="text-sm text-dark-text-secondary">
                                        Last Updated
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* Tone Distribution Chart */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Tone Distribution</h3>
                         <div className="space-y-4">
                              {Object.entries(analytics.toneDistribution).map(([key, value]) => (
                                   <div key={key}>
                                        <div className="flex items-center justify-between mb-2">
                                             <span className="text-sm font-medium text-dark-text capitalize">{key}</span>
                                             <span className="text-sm text-dark-text-secondary">{value}/10</span>
                                        </div>
                                        <div className="w-full bg-dark-surface rounded-full h-2">
                                             <div
                                                  className="bg-dark-accent rounded-full h-2 transition-all duration-300"
                                                  style={{ width: `${(value / 10) * 100}%` }}
                                             />
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>

                    {/* Common Phrases */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Common Phrases</h3>
                         {analytics.commonPhrases.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                   {analytics.commonPhrases.map((phrase, index) => (
                                        <span
                                             key={index}
                                             className="px-3 py-1 bg-dark-surface border border-dark-border rounded-lg text-sm text-dark-text"
                                        >
                                             {phrase}
                                        </span>
                                   ))}
                              </div>
                         ) : (
                              <p className="text-sm text-dark-text-secondary">
                                   No common phrases learned yet. The system will identify your frequently used phrases as you edit content.
                              </p>
                         )}
                    </div>

                    {/* Banned Phrases */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Banned Phrases</h3>
                         {analytics.bannedPhrases.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                   {analytics.bannedPhrases.map((phrase, index) => (
                                        <span
                                             key={index}
                                             className="px-3 py-1 bg-red-900 bg-opacity-20 border border-red-700 rounded-lg text-sm text-red-400"
                                        >
                                             {phrase}
                                        </span>
                                   ))}
                              </div>
                         ) : (
                              <p className="text-sm text-dark-text-secondary">
                                   No banned phrases set. The system will learn phrases you consistently remove from generated content.
                              </p>
                         )}
                    </div>

                    {/* Writing Traits Summary */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Writing Traits Summary</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                                   <span className="text-sm text-dark-text">Average Sentence Length</span>
                                   <span className="text-sm font-semibold text-dark-accent">
                                        {analytics.writingTraits.avgSentenceLength} words
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                                   <span className="text-sm text-dark-text">Uses Questions Often</span>
                                   <span className={`text-sm font-semibold ${analytics.writingTraits.usesQuestionsOften ? 'text-green-500' : 'text-dark-text-secondary'}`}>
                                        {analytics.writingTraits.usesQuestionsOften ? 'Yes' : 'No'}
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                                   <span className="text-sm text-dark-text">Uses Emojis</span>
                                   <span className={`text-sm font-semibold ${analytics.writingTraits.usesEmojis ? 'text-green-500' : 'text-dark-text-secondary'}`}>
                                        {analytics.writingTraits.usesEmojis ? 'Yes' : 'No'}
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                                   <span className="text-sm text-dark-text">Emoji Frequency</span>
                                   <span className="text-sm font-semibold text-dark-accent">
                                        {analytics.writingTraits.emojiFrequency}/5
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                                   <span className="text-sm text-dark-text">Uses Bullet Points</span>
                                   <span className={`text-sm font-semibold ${analytics.writingTraits.usesBulletPoints ? 'text-green-500' : 'text-dark-text-secondary'}`}>
                                        {analytics.writingTraits.usesBulletPoints ? 'Yes' : 'No'}
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                                   <span className="text-sm text-dark-text">Uses Short Paragraphs</span>
                                   <span className={`text-sm font-semibold ${analytics.writingTraits.usesShortParagraphs ? 'text-green-500' : 'text-dark-text-secondary'}`}>
                                        {analytics.writingTraits.usesShortParagraphs ? 'Yes' : 'No'}
                                   </span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                                   <span className="text-sm text-dark-text">Uses Hooks</span>
                                   <span className={`text-sm font-semibold ${analytics.writingTraits.usesHooks ? 'text-green-500' : 'text-dark-text-secondary'}`}>
                                        {analytics.writingTraits.usesHooks ? 'Yes' : 'No'}
                                   </span>
                              </div>
                         </div>
                    </div>

                    {/* Evolution Timeline */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Evolution Timeline</h3>
                         {analytics.evolutionTimeline.length > 0 ? (
                              <div className="space-y-4">
                                   {analytics.evolutionTimeline.map((milestone, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                             <div className="flex-shrink-0 w-12 h-12 bg-dark-accent bg-opacity-20 border border-dark-accent rounded-full flex items-center justify-center">
                                                  <span className="text-sm font-semibold text-dark-accent">
                                                       {milestone.score}%
                                                  </span>
                                             </div>
                                             <div className="flex-1 pt-2">
                                                  <div className="text-sm font-medium text-dark-text mb-1">
                                                       {milestone.event}
                                                  </div>
                                                  <div className="text-xs text-dark-text-secondary">
                                                       {new Date(milestone.date).toLocaleDateString()}
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         ) : (
                              <p className="text-sm text-dark-text-secondary">
                                   No milestones yet. Your profile evolution will be tracked as you use the system.
                              </p>
                         )}
                    </div>

                    {/* Before/After Examples */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Before/After Examples</h3>
                         {analytics.beforeAfterExamples.length > 0 ? (
                              <div className="space-y-6">
                                   {analytics.beforeAfterExamples.map((example, index) => (
                                        <div key={index} className="border border-dark-border rounded-lg p-4">
                                             <div className="mb-4">
                                                  <div className="text-xs font-semibold text-dark-text-secondary uppercase mb-2">
                                                       Before (AI Generated)
                                                  </div>
                                                  <div className="text-sm text-dark-text-secondary bg-dark-surface p-3 rounded">
                                                       {example.before}
                                                  </div>
                                             </div>
                                             <div className="mb-4">
                                                  <div className="text-xs font-semibold text-dark-text-secondary uppercase mb-2">
                                                       After (Your Edit)
                                                  </div>
                                                  <div className="text-sm text-dark-text bg-dark-surface p-3 rounded">
                                                       {example.after}
                                                  </div>
                                             </div>
                                             <div className="flex items-start gap-2">
                                                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                  </svg>
                                                  <div className="text-xs text-green-500">
                                                       {example.improvement}
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         ) : (
                              <p className="text-sm text-dark-text-secondary">
                                   No examples yet. As you edit generated content, we'll show you how your voice has improved over time.
                              </p>
                         )}
                    </div>

                    {/* Suggestions */}
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Suggestions</h3>
                         <div className="space-y-3">
                              {suggestions.map((suggestion, index) => (
                                   <div key={index} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-dark-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <p className="text-sm text-dark-text leading-relaxed">
                                             {suggestion}
                                        </p>
                                   </div>
                              ))}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default ProfileAnalytics;
