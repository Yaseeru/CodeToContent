import React, { useState, useRef, useEffect } from 'react';
import { apiClient, getErrorMessage } from '../utils/apiClient';
import ErrorNotification from './ErrorNotification';

interface ContentGeneratorProps {
     analysisId: string;
     tone: string;
     onContentGenerated: (content: GeneratedContent) => void;
}

export interface GeneratedContent {
     id: string;
     platform: 'linkedin' | 'x';
     generatedText: string;
     tone: string;
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

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
     analysisId,
     tone,
     onContentGenerated,
}) => {
     const [loading, setLoading] = useState<{ linkedin: boolean; x: boolean }>({
          linkedin: false,
          x: false,
     });
     const [error, setError] = useState<string | null>(null);
     const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
     const lastPlatform = useRef<'linkedin' | 'x' | null>(null);
     const [profileData, setProfileData] = useState<ProfileData | null>(null);
     const [voiceStrength, setVoiceStrength] = useState<number>(80);
     const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

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

     const generateContent = async (platform: 'linkedin' | 'x') => {
          try {
               setLoading((prev) => ({ ...prev, [platform]: true }));
               setError(null);
               setShowErrorNotification(false);
               lastPlatform.current = platform;

               const response = await apiClient.post(
                    '/api/content/generate',
                    {
                         analysisId,
                         tone,
                         platform,
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
               setLoading((prev) => ({ ...prev, [platform]: false }));
          }
     };

     const handleRetryGenerate = () => {
          if (lastPlatform.current) {
               setShowErrorNotification(false);
               generateContent(lastPlatform.current);
          }
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
                         Select a platform to generate content with the selected tone
                    </p>
               </div>

               <div className="flex gap-3">
                    <button
                         onClick={() => generateContent('linkedin')}
                         disabled={loading.linkedin || loading.x}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {loading.linkedin ? (
                              <span className="flex items-center justify-center">
                                   <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
                                   Generating...
                              </span>
                         ) : (
                              'Generate for LinkedIn'
                         )}
                    </button>

                    <button
                         onClick={() => generateContent('x')}
                         disabled={loading.linkedin || loading.x}
                         className="flex-1 px-6 py-3 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {loading.x ? (
                              <span className="flex items-center justify-center">
                                   <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner mr-2"></span>
                                   Generating...
                              </span>
                         ) : (
                              'Generate for X'
                         )}
                    </button>
               </div>
          </div>
     );
};

export default ContentGenerator;
