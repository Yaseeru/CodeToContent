import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import RepositoryList from './RepositoryList';
import AnalysisView from './AnalysisView';
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
     const [generatedContents, setGeneratedContents] = useState<{
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

     const handleRegenerate = () => {
          // Remove the content to trigger regeneration
          setGeneratedContents({});
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
                    <div className="modal-backdrop-mobile md:modal-desktop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-enter">
                         <div className="modal-mobile md:modal-content-desktop w-full max-w-3xl bg-dark-surface modal-content-mobile">
                              <div className="modal-swipe-indicator md:hidden"></div>
                              <StyleProfileSetup
                                   onComplete={handleOnboardingComplete}
                                   onSkip={handleOnboardingSkip}
                              />
                         </div>
                    </div>
               )}

               {/* Profile Analytics Modal */}
               {showProfileAnalytics && (
                    <div className="modal-backdrop-mobile md:modal-desktop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-enter">
                         <div className="modal-mobile md:modal-content-desktop w-full max-w-4xl bg-dark-surface modal-content-mobile">
                              <div className="modal-swipe-indicator md:hidden"></div>
                              <ProfileAnalytics onClose={() => setShowProfileAnalytics(false)} />
                         </div>
                    </div>
               )}

               {/* Profile Editor Modal */}
               {showProfileEditor && (
                    <div className="modal-backdrop-mobile md:modal-desktop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-enter">
                         <div className="modal-mobile md:modal-content-desktop w-full max-w-4xl bg-dark-surface modal-content-mobile">
                              <div className="modal-swipe-indicator md:hidden"></div>
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
                    <div className="modal-backdrop-mobile md:modal-desktop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-enter">
                         <div className="modal-mobile md:modal-content-desktop bg-dark-surface border border-dark-border rounded-lg p-6 max-w-md w-full">
                              <div className="modal-swipe-indicator md:hidden"></div>
                              <h3 className="text-xl font-semibold text-dark-text mb-4">Delete Voice Profile?</h3>
                              <p className="text-dark-text-secondary mb-6">
                                   This will permanently delete your voice profile and all learning data.
                                   You can always create a new profile later.
                              </p>
                              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                   <button
                                        onClick={() => setShowDeleteConfirmation(false)}
                                        className="btn-enhanced focus-enhanced-secondary px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                                        aria-label="Cancel profile deletion"
                                   >
                                        Cancel
                                   </button>
                                   <button
                                        onClick={handleDeleteProfile}
                                        className="btn-enhanced focus-enhanced-primary px-4 py-3 min-h-[44px] bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                                        aria-label="Confirm profile deletion"
                                   >
                                        Delete Profile
                                   </button>
                              </div>
                         </div>
                    </div>
               )}

               <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                         <div>
                              <h1 className="text-2xl sm:text-3xl font-semibold text-dark-text mb-2">
                                   CodeToContent
                              </h1>
                              <p className="text-sm sm:text-base text-dark-text-secondary leading-relaxed">
                                   Transform your repositories into compelling content
                              </p>
                         </div>
                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                              {/* Setup Voice Profile button for users who skipped or don't have a profile */}
                              {!checkingProfile && !hasStyleProfile && (
                                   <button
                                        onClick={handleSetupVoiceProfile}
                                        className="px-4 py-3 min-h-[44px] bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                        aria-label="Setup your voice profile"
                                   >
                                        Setup Voice Profile
                                   </button>
                              )}

                              {/* Reconfigure option for users with a profile */}
                              {!checkingProfile && hasStyleProfile && (
                                   <button
                                        onClick={handleReconfigureVoiceProfile}
                                        className="px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                        aria-label="Reconfigure your voice profile"
                                   >
                                        Reconfigure Voice
                                   </button>
                              )}

                              <button
                                   onClick={handleLogout}
                                   className="px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                   aria-label="Logout from your account"
                              >
                                   Logout
                              </button>
                         </div>
                    </div>

                    {/* Voice Profile Section */}
                    {!checkingProfile && hasStyleProfile && profileData && (
                         <div className="bg-dark-surface border border-dark-border rounded-lg p-4 sm:p-6 mb-6">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                   <div className="flex-1">
                                        <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-2">
                                             Voice Profile
                                        </h2>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                                             <div className="flex items-center gap-2">
                                                  <span className="text-sm text-dark-text-secondary">Evolution Score:</span>
                                                  <span className="text-xl sm:text-2xl font-bold text-dark-accent">
                                                       {profileData.evolutionScore || 0}%
                                                  </span>
                                             </div>
                                             {profileData.evolutionScore && profileData.evolutionScore >= 70 && (
                                                  <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-500 text-xs font-medium rounded-full">
                                                       Well-trained
                                                  </span>
                                             )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-dark-text-secondary">
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
                                   <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                                        <button
                                             onClick={() => setShowProfileAnalytics(true)}
                                             className="px-4 py-3 min-h-[44px] bg-dark-accent text-white text-sm font-medium rounded-lg hover:bg-dark-accent-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                             aria-label="View your voice profile analytics"
                                        >
                                             View Analytics
                                        </button>
                                        <button
                                             onClick={() => setShowProfileEditor(true)}
                                             className="px-4 py-3 min-h-[44px] bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover focus:ring-2 focus:ring-dark-accent focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                             aria-label="Edit your voice profile"
                                        >
                                             Edit Profile
                                        </button>
                                        <button
                                             onClick={() => setShowDeleteConfirmation(true)}
                                             className="px-4 py-3 min-h-[44px] bg-dark-surface border border-red-600 text-red-600 text-sm font-medium rounded-lg hover:bg-red-600 hover:bg-opacity-10 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
                                             aria-label="Delete your voice profile"
                                        >
                                             Delete Profile
                                        </button>
                                   </div>
                              </div>
                         </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                         {/* Left Column: Repository List */}
                         <div className="xl:col-span-1">
                              <div className="bg-dark-surface border border-dark-border rounded-lg p-4 sm:p-6">
                                   <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-4">
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
                         <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                              {/* Analysis View */}
                              <AnalysisView
                                   repositoryId={selectedRepositoryId}
                                   onAnalysisComplete={handleAnalysisComplete}
                              />

                              {/* Content Generation Section */}
                              {analysis && (
                                   <div className="bg-dark-surface border border-dark-border rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                                        <div>
                                             <h2 className="text-xl sm:text-2xl font-semibold text-dark-text mb-2">
                                                  Generate Content
                                             </h2>
                                             <p className="text-sm text-dark-text-secondary leading-relaxed">
                                                  Generate platform-specific content using your voice profile
                                             </p>
                                        </div>

                                        {/* Content Generator */}
                                        <ContentGenerator
                                             analysisId={analysis.id}
                                             repositoryId={analysis.repositoryId}
                                             onContentGenerated={handleContentGenerated}
                                        />

                                        {/* Content Editor */}
                                        {generatedContents.x && (
                                             <ContentEditor
                                                  content={generatedContents.x}
                                                  onRegenerate={handleRegenerate}
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
