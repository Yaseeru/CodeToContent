import React, { useState, useRef, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';

interface ContentGeneratorProps {
     analysisId: string;
     onContentGenerated: (content: GeneratedContent) => void;
}

export type ContentFormat = 'single' | 'mini_thread' | 'full_thread';

export interface Tweet {
     text: string;
     position: number;
     characterCount: number;
}

export interface GeneratedContent {
     id: string;
     platform: 'x';
     contentFormat: ContentFormat;
     generatedText: string;
     tweets?: Tweet[];
     version: number;
}

interface StyleProfile {
     voiceType: string;
     learningIterations: number;
     samplePosts: string[];
}

interface ProfileData {
     styleProfile?: StyleProfile;
     voiceStrength: number;
     evolutionScore: number;
}

interface FormatOption {
     value: ContentFormat;
     label: string;
     description: string;
     tweetCount: string;
}

const formatOptions: FormatOption[] = [
     {
          value: 'single',
          label: 'Single Post',
          description: 'One high-impact tweet with hook, update, and CTA',
          tweetCount: '1 tweet',
     },
     {
          value: 'mini_thread',
          label: 'Mini Thread',
          description: 'Hook + Context → Problem + Solution → Result + CTA',
          tweetCount: '3 tweets',
     },
     {
          value: 'full_thread',
          label: 'Full Thread',
          description: 'Comprehensive story with technical depth',
          tweetCount: '5-7 tweets',
     },
];

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
     analysisId,
     onContentGenerated,
}) => {
     const [loading, setLoading] = useState<boolean>(false);
     const [error, setError] = useState<string | null>(null);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
     const lastPlatform = useRef<'x' | null>(null);
     const [profileData, setProfileData] = useState<ProfileData | null>(null);
     const [voiceStrength, setVoiceStrength] = useState<number>(80);
     const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
     const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('single');

     // Fetch user profile on component mount
     useEffect(() => {
          const fetchProfile = async () => {
               try {
                    setLoadingProfile(true);
                    const response = await apiClient.get('/api/profile/style');
                    const data = response.data;

                    setProfileData({
                         styleProfile: data.styleProfile,
                         voiceStrength: data.voiceStrength || 80,
                         evolutionScore: data.evolutionScore || 0,
                    });

                    // Set initial voice strength from user's preference
                    if (data.voiceStrength !== undefined) {
                         setVoiceStrength(data.voiceStrength);
                    }
               } catch (err) {
                    // Silently fail - user may not have a profile yet
                    console.log('No profile found or error fetching profile');
                    setProfileData(null);
               } finally {
                    setLoadingProfile(false);
               }
          };

          fetchProfile();
     }, []);

     const generateContent = async () => {
          try {
               setLoading(true);
               setError(null);
               setShowErrorNotification(false);
               lastPlatform.current = 'x';

               const response = await apiClient.post(
                    '/api/content/generate',
                    {
                         analysisId,
                         platform: 'x',
                         format: selectedFormat,
                         voiceStrength: profileData?.styleProfile ? voiceStrength : undefined,
                    }
               );

               onContentGenerated(response.data.content);
          } catch (err) {
               console.error('Error generating content:', err);
               const errorMessage = getErrorMessage(err);
               setError(errorMessage);
               setShowErrorNotification(true);
          } finally {
               setLoading(false);
          }
     };

     const handleRetryGenerate = () => {
          setShowErrorNotification(false);
          generateContent();
     };

     const handleCloseErrorNotification = () => {
          setShowErrorNotification(false);
          setError(null);
     };

     const handleVoiceStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setVoiceStrength(Number(e.target.value));
     };

     const hasStyleProfile = profileData?.styleProfile !== undefined && profileData?.styleProfile !== null;
     const evolutionScore = profileData?.evolutionScore || 0;

     return (
          <div className="space-y-4">
               {showErrorNotification && error && (
                    <ErrorNotification
                         message={error}
                         onClose={handleCloseErrorNotification}
                         onRetry={handleRetryGenerate}
                    />
               )}

               {/* Format Selection */}
               <div className="bg-dark-surface border border-dark-border rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-dark-text">Choose Format</h4>
                    <div className="space-y-2" role="radiogroup" aria-label="Content format selection">
                         {formatOptions.map((option) => (
                              <label
                                   key={option.value}
                                   className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedFormat === option.value
                                        ? 'border-dark-accent bg-dark-accent bg-opacity-10'
                                        : 'border-dark-border hover:border-dark-accent hover:border-opacity-50'
                                        }`}
                              >
                                   <input
                                        type="radio"
                                        name="format"
                                        value={option.value}
                                        checked={selectedFormat === option.value}
                                        onChange={(e) => setSelectedFormat(e.target.value as ContentFormat)}
                                        className="mt-1 w-4 h-4 text-dark-accent focus:ring-dark-accent focus:ring-offset-dark-bg"
                                        aria-label={option.label}
                                   />
                                   <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                             <span className="text-sm font-medium text-dark-text">
                                                  {option.label}
                                             </span>
                                             <span className="text-xs text-dark-text-secondary">
                                                  {option.tweetCount}
                                             </span>
                                        </div>
                                        <p className="text-xs text-dark-text-secondary leading-relaxed">
                                             {option.description}
                                        </p>
                                   </div>
                              </label>
                         ))}
                    </div>
               </div>

               {/* Voice Profile Indicator */}
               {!loadingProfile && hasStyleProfile && (
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 space-y-3">
                         <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                   <svg
                                        className="w-5 h-5 text-dark-accent"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                   >
                                        <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                   </svg>
                                   <span className="text-sm font-medium text-dark-text">
                                        Using your voice
                                   </span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <span className="text-xs text-dark-text-secondary">
                                        Evolution Score:
                                   </span>
                                   <span className="text-sm font-semibold text-dark-accent">
                                        {evolutionScore}%
                                   </span>
                              </div>
                         </div>

                         {/* Voice Strength Slider */}
                         <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                   <label
                                        htmlFor="voice-strength"
                                        className="text-sm text-dark-text-secondary flex items-center gap-1"
                                   >
                                        Voice Strength
                                        <button
                                             type="button"
                                             className="group relative"
                                             aria-label="Voice strength explanation"
                                        >
                                             <svg
                                                  className="w-4 h-4 text-dark-text-secondary hover:text-dark-text"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                             >
                                                  <path
                                                       strokeLinecap="round"
                                                       strokeLinejoin="round"
                                                       strokeWidth={2}
                                                       d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                             </svg>
                                             <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-dark-bg border border-dark-border rounded-lg text-xs text-dark-text opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                                                  Control how strongly your personal style is applied. 0% uses generic tone-based generation, 100% applies maximum voice matching.
                                             </div>
                                        </button>
                                   </label>
                                   <span className="text-sm font-medium text-dark-text">
                                        {voiceStrength}%
                                   </span>
                              </div>
                              <input
                                   id="voice-strength"
                                   type="range"
                                   min="0"
                                   max="100"
                                   step="5"
                                   value={voiceStrength}
                                   onChange={handleVoiceStrengthChange}
                                   className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-dark-accent"
                                   style={{
                                        background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${voiceStrength}%, rgb(55, 65, 81) ${voiceStrength}%, rgb(55, 65, 81) 100%)`,
                                   }}
                              />
                         </div>
                    </div>
               )}

               <div>
                    <h3 className="text-base font-medium text-dark-text mb-2">
                         Generate Content
                    </h3>
                    <p className="text-sm text-dark-text-secondary leading-relaxed">
                         Select a platform to generate content using your voice profile
                    </p>
               </div>

               <div className="flex gap-3">
                    <button
                         onClick={() => generateContent()}
                         disabled={loading}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {loading ? (
                              <span className="flex items-center justify-center">
                                   <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
                                   Generating...
                              </span>
                         ) : (
                              'Generate for X (Twitter)'
                         )}
                    </button>
               </div>
          </div>
     );
};

export default ContentGenerator;
