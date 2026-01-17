import React, { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

// Type definitions matching backend
type VoiceType = 'educational' | 'storytelling' | 'opinionated' | 'analytical' | 'casual' | 'professional';
type IntroStyle = 'hook' | 'story' | 'problem' | 'statement';
type BodyStyle = 'steps' | 'narrative' | 'analysis' | 'bullets';
type EndingStyle = 'cta' | 'reflection' | 'summary' | 'question';
type VocabularyLevel = 'simple' | 'medium' | 'advanced';

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

interface StructurePreferences {
     introStyle: IntroStyle;
     bodyStyle: BodyStyle;
     endingStyle: EndingStyle;
}

interface StyleProfile {
     voiceType: VoiceType;
     tone: ToneMetrics;
     writingTraits: WritingTraits;
     structurePreferences: StructurePreferences;
     vocabularyLevel: VocabularyLevel;
     commonPhrases: string[];
     bannedPhrases: string[];
     samplePosts: string[];
     learningIterations: number;
     lastUpdated: string;
     profileSource: string;
     archetypeBase?: string;
}

interface ProfileData {
     styleProfile: StyleProfile;
     voiceStrength: number;
     evolutionScore: number;
}

interface StyleProfileEditorProps {
     onClose?: () => void;
     onSave?: () => void;
}

const StyleProfileEditor: React.FC<StyleProfileEditorProps> = ({ onClose, onSave }) => {
     const [profile, setProfile] = useState<StyleProfile | null>(null);
     const [voiceStrength, setVoiceStrength] = useState<number>(80);
     const [evolutionScore, setEvolutionScore] = useState<number>(0);
     const [loading, setLoading] = useState<boolean>(true);
     const [saving, setSaving] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
     const [showResetConfirmation, setShowResetConfirmation] = useState<boolean>(false);
     const [newPhrase, setNewPhrase] = useState<string>('');
     const [newBannedPhrase, setNewBannedPhrase] = useState<string>('');
     const toast = useToast();

     useEffect(() => {
          loadProfile();
     }, []);

     const loadProfile = async () => {
          try {
               setLoading(true);
               const response = await apiClient.get<ProfileData>('/api/profile/style');

               if (response.data.styleProfile) {
                    setProfile(response.data.styleProfile);
                    setVoiceStrength(response.data.voiceStrength || 80);
                    setEvolutionScore(response.data.evolutionScore || 0);
               }
          } catch (err) {
               console.error('Error loading profile:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               toast.showError('Failed to load profile. Please try again.', loadProfile);
          } finally {
               setLoading(false);
          }
     };

     const handleSave = async () => {
          if (!profile) return;

          try {
               setSaving(true);
               setError(null);
               setShowErrorNotification(false);

               await apiClient.put('/api/profile/style', {
                    styleProfile: profile,
                    voiceStrength,
               });

               toast.showSuccess('Profile saved successfully!');

               if (onSave) {
                    onSave();
               }
          } catch (err) {
               console.error('Error saving profile:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               toast.showError('Failed to save profile. Please try again.', handleSave);
          } finally {
               setSaving(false);
          }
     };

     const handleReset = async () => {
          try {
               setSaving(true);
               setError(null);
               setShowErrorNotification(false);

               await apiClient.post('/api/profile/reset');

               toast.showSuccess('Profile reset successfully!');

               // Reload profile after reset
               await loadProfile();
               setShowResetConfirmation(false);
          } catch (err) {
               console.error('Error resetting profile:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
               toast.showError('Failed to reset profile. Please try again.', handleReset);
          } finally {
               setSaving(false);
          }
     };

     const updateToneMetric = (key: keyof ToneMetrics, value: number) => {
          if (!profile) return;
          setProfile({
               ...profile,
               tone: {
                    ...profile.tone,
                    [key]: value,
               },
          });
     };

     const updateWritingTrait = (key: keyof WritingTraits, value: boolean | number) => {
          if (!profile) return;
          setProfile({
               ...profile,
               writingTraits: {
                    ...profile.writingTraits,
                    [key]: value,
               },
          });
     };

     const updateStructurePreference = (key: keyof StructurePreferences, value: string) => {
          if (!profile) return;
          setProfile({
               ...profile,
               structurePreferences: {
                    ...profile.structurePreferences,
                    [key]: value,
               },
          });
     };

     const addCommonPhrase = () => {
          if (!profile || !newPhrase.trim()) return;
          setProfile({
               ...profile,
               commonPhrases: [...profile.commonPhrases, newPhrase.trim()],
          });
          setNewPhrase('');
     };

     const removeCommonPhrase = (index: number) => {
          if (!profile) return;
          setProfile({
               ...profile,
               commonPhrases: profile.commonPhrases.filter((_, i) => i !== index),
          });
     };

     const addBannedPhrase = () => {
          if (!profile || !newBannedPhrase.trim()) return;
          setProfile({
               ...profile,
               bannedPhrases: [...profile.bannedPhrases, newBannedPhrase.trim()],
          });
          setNewBannedPhrase('');
     };

     const removeBannedPhrase = (index: number) => {
          if (!profile) return;
          setProfile({
               ...profile,
               bannedPhrases: profile.bannedPhrases.filter((_, i) => i !== index),
          });
     };

     const handleCloseErrorNotification = () => {
          setShowErrorNotification(false);
          setError(null);
     };

     if (loading) {
          return (
               <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
                    <LoadingSpinner size="lg" message="Loading profile..." />
               </div>
          );
     }

     if (!profile) {
          return (
               <div className="bg-dark-surface border border-dark-border rounded-lg p-8">
                    <div className="text-center py-12">
                         <p className="text-dark-text-secondary mb-4">
                              No voice profile found. Please set up your profile first.
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
                    <div>
                         <h2 className="text-2xl font-semibold text-dark-text mb-2">
                              Edit Voice Profile
                         </h2>
                         <div className="flex items-center gap-4 text-sm text-dark-text-secondary">
                              <span>Evolution Score: <span className="text-dark-accent font-semibold">{evolutionScore}%</span></span>
                              <span>•</span>
                              <span>Learning Iterations: {profile.learningIterations}</span>
                              <span>•</span>
                              <span>Last Updated: {new Date(profile.lastUpdated).toLocaleDateString()}</span>
                         </div>
                    </div>
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
                    {/* Voice Strength */}
                    <div>
                         <label className="block text-sm font-medium text-dark-text mb-3">
                              Voice Strength: {voiceStrength}%
                         </label>
                         <input
                              type="range"
                              min="0"
                              max="100"
                              value={voiceStrength}
                              onChange={(e) => setVoiceStrength(Number(e.target.value))}
                              className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-dark-accent"
                         />
                         <p className="text-xs text-dark-text-secondary mt-2">
                              Controls how strongly your personal style is applied (0% = generic, 100% = maximum personalization)
                         </p>
                    </div>

                    {/* Tone Metrics */}
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Tone Metrics</h3>
                         <div className="space-y-4">
                              {Object.entries(profile.tone).map(([key, value]) => (
                                   <div key={key}>
                                        <label className="block text-sm font-medium text-dark-text mb-2 capitalize">
                                             {key}: {value}
                                        </label>
                                        <input
                                             type="range"
                                             min="1"
                                             max="10"
                                             value={value}
                                             onChange={(e) => updateToneMetric(key as keyof ToneMetrics, Number(e.target.value))}
                                             className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-dark-accent"
                                        />
                                   </div>
                              ))}
                         </div>
                    </div>

                    {/* Writing Traits */}
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Writing Traits</h3>
                         <div className="space-y-4">
                              <div>
                                   <label className="block text-sm font-medium text-dark-text mb-2">
                                        Average Sentence Length: {profile.writingTraits.avgSentenceLength} words
                                   </label>
                                   <input
                                        type="number"
                                        min="5"
                                        max="50"
                                        value={profile.writingTraits.avgSentenceLength}
                                        onChange={(e) => updateWritingTrait('avgSentenceLength', Number(e.target.value))}
                                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-dark-accent"
                                   />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                             type="checkbox"
                                             checked={profile.writingTraits.usesQuestionsOften}
                                             onChange={(e) => updateWritingTrait('usesQuestionsOften', e.target.checked)}
                                             className="w-4 h-4 text-dark-accent bg-dark-bg border-dark-border rounded focus:ring-dark-accent"
                                        />
                                        <span className="text-sm text-dark-text">Uses Questions Often</span>
                                   </label>

                                   <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                             type="checkbox"
                                             checked={profile.writingTraits.usesEmojis}
                                             onChange={(e) => updateWritingTrait('usesEmojis', e.target.checked)}
                                             className="w-4 h-4 text-dark-accent bg-dark-bg border-dark-border rounded focus:ring-dark-accent"
                                        />
                                        <span className="text-sm text-dark-text">Uses Emojis</span>
                                   </label>

                                   <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                             type="checkbox"
                                             checked={profile.writingTraits.usesBulletPoints}
                                             onChange={(e) => updateWritingTrait('usesBulletPoints', e.target.checked)}
                                             className="w-4 h-4 text-dark-accent bg-dark-bg border-dark-border rounded focus:ring-dark-accent"
                                        />
                                        <span className="text-sm text-dark-text">Uses Bullet Points</span>
                                   </label>

                                   <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                             type="checkbox"
                                             checked={profile.writingTraits.usesShortParagraphs}
                                             onChange={(e) => updateWritingTrait('usesShortParagraphs', e.target.checked)}
                                             className="w-4 h-4 text-dark-accent bg-dark-bg border-dark-border rounded focus:ring-dark-accent"
                                        />
                                        <span className="text-sm text-dark-text">Uses Short Paragraphs</span>
                                   </label>

                                   <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                             type="checkbox"
                                             checked={profile.writingTraits.usesHooks}
                                             onChange={(e) => updateWritingTrait('usesHooks', e.target.checked)}
                                             className="w-4 h-4 text-dark-accent bg-dark-bg border-dark-border rounded focus:ring-dark-accent"
                                        />
                                        <span className="text-sm text-dark-text">Uses Hooks</span>
                                   </label>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-dark-text mb-2">
                                        Emoji Frequency: {profile.writingTraits.emojiFrequency}
                                   </label>
                                   <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        value={profile.writingTraits.emojiFrequency}
                                        onChange={(e) => updateWritingTrait('emojiFrequency', Number(e.target.value))}
                                        className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer accent-dark-accent"
                                        disabled={!profile.writingTraits.usesEmojis}
                                   />
                              </div>
                         </div>
                    </div>

                    {/* Structure Preferences */}
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Structure Preferences</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-dark-text mb-2">
                                        Intro Style
                                   </label>
                                   <select
                                        value={profile.structurePreferences.introStyle}
                                        onChange={(e) => updateStructurePreference('introStyle', e.target.value)}
                                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-dark-accent"
                                   >
                                        <option value="hook">Hook</option>
                                        <option value="story">Story</option>
                                        <option value="problem">Problem</option>
                                        <option value="statement">Statement</option>
                                   </select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-dark-text mb-2">
                                        Body Style
                                   </label>
                                   <select
                                        value={profile.structurePreferences.bodyStyle}
                                        onChange={(e) => updateStructurePreference('bodyStyle', e.target.value)}
                                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-dark-accent"
                                   >
                                        <option value="steps">Steps</option>
                                        <option value="narrative">Narrative</option>
                                        <option value="analysis">Analysis</option>
                                        <option value="bullets">Bullets</option>
                                   </select>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-dark-text mb-2">
                                        Ending Style
                                   </label>
                                   <select
                                        value={profile.structurePreferences.endingStyle}
                                        onChange={(e) => updateStructurePreference('endingStyle', e.target.value)}
                                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-dark-accent"
                                   >
                                        <option value="cta">Call to Action</option>
                                        <option value="reflection">Reflection</option>
                                        <option value="summary">Summary</option>
                                        <option value="question">Question</option>
                                   </select>
                              </div>
                         </div>
                    </div>

                    {/* Vocabulary Level */}
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Vocabulary Level</h3>
                         <select
                              value={profile.vocabularyLevel}
                              onChange={(e) => setProfile({ ...profile, vocabularyLevel: e.target.value as VocabularyLevel })}
                              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-dark-accent"
                         >
                              <option value="simple">Simple</option>
                              <option value="medium">Medium</option>
                              <option value="advanced">Advanced</option>
                         </select>
                    </div>

                    {/* Common Phrases */}
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Common Phrases</h3>
                         <div className="space-y-3">
                              <div className="flex gap-2">
                                   <input
                                        type="text"
                                        value={newPhrase}
                                        onChange={(e) => setNewPhrase(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addCommonPhrase()}
                                        placeholder="Add a phrase you frequently use..."
                                        className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-dark-accent"
                                   />
                                   <button
                                        onClick={addCommonPhrase}
                                        className="px-4 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                                   >
                                        Add
                                   </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                   {profile.commonPhrases.map((phrase, index) => (
                                        <span
                                             key={index}
                                             className="inline-flex items-center gap-2 px-3 py-1 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text"
                                        >
                                             {phrase}
                                             <button
                                                  onClick={() => removeCommonPhrase(index)}
                                                  className="text-dark-text-secondary hover:text-dark-text"
                                             >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                             </button>
                                        </span>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* Banned Phrases */}
                    <div>
                         <h3 className="text-lg font-semibold text-dark-text mb-4">Banned Phrases</h3>
                         <div className="space-y-3">
                              <div className="flex gap-2">
                                   <input
                                        type="text"
                                        value={newBannedPhrase}
                                        onChange={(e) => setNewBannedPhrase(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addBannedPhrase()}
                                        placeholder="Add a phrase to avoid..."
                                        className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text text-sm placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-dark-accent"
                                   />
                                   <button
                                        onClick={addBannedPhrase}
                                        className="px-4 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                                   >
                                        Add
                                   </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                   {profile.bannedPhrases.map((phrase, index) => (
                                        <span
                                             key={index}
                                             className="inline-flex items-center gap-2 px-3 py-1 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text"
                                        >
                                             {phrase}
                                             <button
                                                  onClick={() => removeBannedPhrase(index)}
                                                  className="text-dark-text-secondary hover:text-dark-text"
                                             >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                             </button>
                                        </span>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-dark-border">
                         <button
                              onClick={() => setShowResetConfirmation(true)}
                              className="px-6 py-3 bg-dark-bg border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                              disabled={saving}
                         >
                              Reset Profile
                         </button>
                         <button
                              onClick={handleSave}
                              disabled={saving}
                              className="px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              {saving ? (
                                   <span className="flex items-center">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
                                        Saving...
                                   </span>
                              ) : (
                                   'Save Changes'
                              )}
                         </button>
                    </div>
               </div>

               {/* Reset Confirmation Modal */}
               {showResetConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                         <div className="bg-dark-surface border border-dark-border rounded-lg p-8 max-w-md mx-4">
                              <h3 className="text-xl font-semibold text-dark-text mb-4">
                                   Reset Voice Profile?
                              </h3>
                              <p className="text-sm text-dark-text-secondary mb-6">
                                   This will delete your current voice profile and all learning progress. This action cannot be undone.
                              </p>
                              <div className="flex gap-4">
                                   <button
                                        onClick={() => setShowResetConfirmation(false)}
                                        className="flex-1 px-6 py-3 bg-dark-bg border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                                        disabled={saving}
                                   >
                                        Cancel
                                   </button>
                                   <button
                                        onClick={handleReset}
                                        disabled={saving}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                        {saving ? 'Resetting...' : 'Reset'}
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default StyleProfileEditor;
