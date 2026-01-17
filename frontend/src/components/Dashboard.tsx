import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import RepositoryList from './RepositoryList';
import AnalysisView from './AnalysisView';
import ToneSelector from './ToneSelector';
import ContentGenerator from './ContentGenerator';
import ContentEditor from './ContentEditor';
import StyleProfileSetup from './StyleProfileSetup';
import ProfileAnalytics from './ProfileAnalytics';
import StyleProfileEditor from './StyleProfileEditor';
import { GeneratedContent } from './ContentGenerator';
import { apiClient } from '../utils/apiClient';

interface Analysis {
     id: string;
     repositoryId: string;
     problemStatement: string;
     targetAudience: string;
     coreFunctionality: string[];
     notableFeatures: string[];
     recentChanges: string[];
     integrations: string[];
     valueProposition: string;
     createdAt: Date;
}

interface ProfileData {
     styleProfile: any;
     voiceStrength: number;
     evolutionScore: number;
     editCount?: number;
     lastUpdated?: string;
}

const ONBOARDING_COMPLETED_KEY = 'voiceProfileOnboardingCompleted';

const Dashboard: React.FC = () => {
     const [searchQuery, setSearchQuery] = useState<string>('');
     const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);
     const [analysis, setAnalysis] = useState<Analysis | null>(null);
     const [selectedTone, setSelectedTone] = useState<string>('Professional');
     const [generatedContents, setGeneratedContents] = useState<{
          linkedin?: GeneratedContent;
          x?: GeneratedContent;
     }>({});
     const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
     const [hasStyleProfile, setHasStyleProfile] = useState<boolean>(false);
     const [checkingProfile, setCheckingProfile] = useState<boolean>(true);
     const [profileData, setProfileData] = useState<ProfileData | null>(null);
     const [showProfileAnalytics, setShowProfileAnalytics] = useState<boolean>(false);
     const [showProfileEditor, setShowProfileEditor] = useState<boolean>(false);
     const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);

     // Check if user has a style profile on mount
     useEffect(() => {
          const checkStyleProfile = async () => {
               try {
                    setCheckingProfile(true);
                    const response = await apiClient.get<ProfileData>('/api/profile/style');
                    const hasProfile = response.data.styleProfile !== undefined && response.data.styleProfile !== null;
                    setHasStyleProfile(hasProfile);
                    setProfileData(response.data);

                    // Show onboarding modal only if:
                    // 1. User doesn't have a profile
                    // 2. Onboarding hasn't been completed before
                    const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
                    if (!hasProfile && !onboardingCompleted) {
                         setShowOnboardingModal(true);
                    }
               } catch (err) {
                    // If profile fetch fails, assume no profile exists
                    console.log('No profile found or error fetching profile');
                    setHasStyleProfile(false);
                    setProfileData(null);

                    // Show onboarding for new users
                    const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
                    if (!onboardingCompleted) {
                         setShowOnboardingModal(true);
                    }
               } finally {
                    setCheckingProfile(false);
               }
          };

          checkStyleProfile();
     }, []);

     const handleOnboardingComplete = (evolutionScore: number) => {
          console.log('Onboarding completed with evolution score:', evolutionScore);
          localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
          setShowOnboardingModal(false);
          setHasStyleProfile(true);
          // Refresh profile data
          refreshProfileData();
     };

     const handleOnboardingSkip = () => {
          console.log('Onboarding skipped');
          localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
          setShowOnboardingModal(false);
          setHasStyleProfile(false);
     };

     const handleSetupVoiceProfile = () => {
          setShowOnboardingModal(true);
     };

     const handleReconfigureVoiceProfile = () => {
          setShowOnboardingModal(true);
     };

     const refreshProfileData = async () => {
          try {
               const response = await apiClient.get<ProfileData>('/api/profile/style');
               const hasProfile = response.data.styleProfile !== undefined && response.data.styleProfile !== null;
               setHasStyleProfile(hasProfile);
               setProfileData(response.data);
          } catch (err) {
               console.log('Error refreshing profile data:', err);
          }
     };

     const handleDeleteProfile = async () => {
          try {
               await apiClient.post('/api/profile/reset');
               setHasStyleProfile(false);
               setProfileData(null);
               setShowDeleteConfirmation(false);
               // Optionally show a success message
          } catch (err) {
               console.error('Error deleting profile:', err);
               // Close modal even on error to prevent UI from being stuck
               setShowDeleteConfirmation(false);
               // Optionally show an error message
          }
     };

     const handleRepositoryClick = (repositoryId: string) => {
          // Reset state when selecting a new repository
          setSelectedRepositoryId(repositoryId);
          setAnalysis(null);
          setGeneratedContents({});
     };

     const handleAnalysisComplete = (completedAnalysis: Analysis) => {
          setAnalysis(completedAnalysis);
     };

     const handleContentGenerated = (content: GeneratedContent) => {
          setGeneratedContents((prev) => ({
               ...prev,
               [content.platform]: content,
          }));
     };

     const handleContentUpdate = (updatedContent: GeneratedContent) => {
          setGeneratedContents((prev) => ({
               ...prev,
               [updatedContent.platform]: updatedContent,
          }));
     };

     const handleRegenerate = (platform: 'linkedin' | 'x') => {
          // Remove the content for the platform to trigger regeneration
          setGeneratedContents((prev) => {
               const updated = { ...prev };
               delete updated[platform];
               return updated;
          });
     };

     const handleLogout = () => {
          localStorage.removeItem('jwt');
          localStorage.removeItem('token');
          window.location.href = '/';
     };

     return (
          <div className="min-h-screen bg-dark-bg text-dark-text">
               {/* Onboarding Modal */}
               {showOnboardingModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                         <div className="w-full max-w-3xl">
                              <StyleProfileSetup
                                   onComplete={handleOnboardingComplete}
                                   onSkip={handleOnboardingSkip}
                              />
                         </div>
                    </div>
               )}

               {/* Profile Analytics Modal */}
               {showProfileAnalytics && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                         <div className="w-full max-w-4xl">
                              <ProfileAnalytics onClose={() => setShowProfileAnalytics(false)} />
                         </div>
                    </div>
               )}

               {/* Profile Editor Modal */}
               {showProfileEditor && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                         <div className="w-full max-w-4xl">
                              <StyleProfileEditor
                                   onClose={() => setShowProfileEditor(false)}
                                   onSave={() => {
                                        setShowProfileEditor(false);
                                        refreshProfileData();
                                   }}
                              />
                         </div>
                    </div>
               )}

               {/* Delete Confirmation Modal */}
               {showDeleteConfirmation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                         <div className="bg-dark-surface border border-dark-border rounded-lg p-6 max-w-md w-full">
                              <h3 className="text-xl font-semibold text-dark-text mb-4">Delete Voice Profile?</h3>
                              <p className="text-dark-text-secondary mb-6">
                                   This will permanently delete your voice profile and all learning data.
                                   You can always create a new profile later.
                              </p>
                              <div className="flex gap-3 justify-end">
                                   <button
                                        onClick={() => setShowDeleteConfirmation(false)}
                                        className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                                   >
                                        Cancel
                                   </button>
                                   <button
                                        onClick={handleDeleteProfile}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                                   >
                                        Delete Profile
                                   </button>
                              </div>
                         </div>
                    </div>
               )}

               <div className="container mx-auto px-6 py-8 max-w-7xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                         <div>
                              <h1 className="text-3xl font-semibold text-dark-text mb-2">
                                   CodeToContent
                              </h1>
                              <p className="text-base text-dark-text-secondary leading-relaxed">
                                   Transform your repositories into compelling content
                              </p>
                         </div>
                         <div className="flex items-center gap-3">
                              {/* Setup Voice Profile button for users who skipped or don't have a profile */}
                              {!checkingProfile && !hasStyleProfile && (
                                   <button
                                        onClick={handleSetupVoiceProfile}
                                        className="px-4 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                                   >
                                        Setup Voice Profile
                                   </button>
                              )}

                              {/* Reconfigure option for users with a profile */}
                              {!checkingProfile && hasStyleProfile && (
                                   <button
                                        onClick={handleReconfigureVoiceProfile}
                                        className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                                   >
                                        Reconfigure Voice
                                   </button>
                              )}

                              <button
                                   onClick={handleLogout}
                                   className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                              >
                                   Logout
                              </button>
                         </div>
                    </div>

                    {/* Voice Profile Section */}
                    {!checkingProfile && hasStyleProfile && profileData && (
                         <div className="bg-dark-surface border border-dark-border rounded-lg p-6 mb-6">
                              <div className="flex items-start justify-between">
                                   <div className="flex-1">
                                        <h2 className="text-xl font-semibold text-dark-text mb-2">
                                             Voice Profile
                                        </h2>
                                        <div className="flex items-center gap-4 mb-4">
                                             <div className="flex items-center gap-2">
                                                  <span className="text-sm text-dark-text-secondary">Evolution Score:</span>
                                                  <span className="text-2xl font-bold text-dark-accent">
                                                       {profileData.evolutionScore || 0}%
                                                  </span>
                                             </div>
                                             {profileData.evolutionScore && profileData.evolutionScore >= 70 && (
                                                  <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-500 text-xs font-medium rounded-full">
                                                       Well-trained
                                                  </span>
                                             )}
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-dark-text-secondary">
                                             {profileData.editCount !== undefined && (
                                                  <div>
                                                       <span className="font-medium text-dark-text">{profileData.editCount}</span> edits
                                                  </div>
                                             )}
                                             {profileData.lastUpdated && (
                                                  <div>
                                                       Last updated: {new Date(profileData.lastUpdated).toLocaleDateString()}
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                                   <div className="flex flex-col gap-2">
                                        <button
                                             onClick={() => setShowProfileAnalytics(true)}
                                             className="px-4 py-2 bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover"
                                        >
                                             View Analytics
                                        </button>
                                        <button
                                             onClick={() => setShowProfileEditor(true)}
                                             className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                                        >
                                             Edit Profile
                                        </button>
                                        <button
                                             onClick={() => setShowDeleteConfirmation(true)}
                                             className="px-4 py-2 bg-dark-surface border border-red-600 text-red-600 text-sm font-medium rounded-lg hover:bg-red-600 hover:bg-opacity-10"
                                        >
                                             Delete Profile
                                        </button>
                                   </div>
                              </div>
                         </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         {/* Left Column: Repository List */}
                         <div className="lg:col-span-1">
                              <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
                                   <h2 className="text-xl font-semibold text-dark-text mb-4">
                                        Your Repositories
                                   </h2>
                                   <SearchBar
                                        value={searchQuery}
                                        onChange={setSearchQuery}
                                        placeholder="Search repositories..."
                                   />
                                   <RepositoryList
                                        onRepositoryClick={handleRepositoryClick}
                                        searchQuery={searchQuery}
                                   />
                              </div>
                         </div>

                         {/* Right Column: Analysis and Content Generation */}
                         <div className="lg:col-span-2 space-y-6">
                              {/* Analysis View */}
                              <AnalysisView
                                   repositoryId={selectedRepositoryId}
                                   onAnalysisComplete={handleAnalysisComplete}
                              />

                              {/* Content Generation Section */}
                              {analysis && (
                                   <div className="bg-dark-surface border border-dark-border rounded-lg p-6 space-y-6">
                                        <div>
                                             <h2 className="text-2xl font-semibold text-dark-text mb-2">
                                                  Generate Content
                                             </h2>
                                             <p className="text-sm text-dark-text-secondary leading-relaxed">
                                                  Customize the tone and generate platform-specific content
                                             </p>
                                        </div>

                                        {/* Tone Selector */}
                                        <ToneSelector
                                             onToneChange={setSelectedTone}
                                             selectedTone={selectedTone}
                                        />

                                        {/* Content Generator */}
                                        <ContentGenerator
                                             analysisId={analysis.id}
                                             tone={selectedTone}
                                             onContentGenerated={handleContentGenerated}
                                        />

                                        {/* Content Editors */}
                                        {generatedContents.linkedin && (
                                             <ContentEditor
                                                  content={generatedContents.linkedin}
                                                  onRegenerate={() => handleRegenerate('linkedin')}
                                                  onContentUpdate={handleContentUpdate}
                                             />
                                        )}

                                        {generatedContents.x && (
                                             <ContentEditor
                                                  content={generatedContents.x}
                                                  onRegenerate={() => handleRegenerate('x')}
                                                  onContentUpdate={handleContentUpdate}
                                             />
                                        )}
                                   </div>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default Dashboard;
