import React, { useState } from 'react';
import SearchBar from './SearchBar';
import RepositoryList from './RepositoryList';
import AnalysisView from './AnalysisView';
import ToneSelector from './ToneSelector';
import ContentGenerator from './ContentGenerator';
import ContentEditor from './ContentEditor';
import { GeneratedContent } from './ContentGenerator';

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

const Dashboard: React.FC = () => {
     const [searchQuery, setSearchQuery] = useState<string>('');
     const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);
     const [analysis, setAnalysis] = useState<Analysis | null>(null);
     const [selectedTone, setSelectedTone] = useState<string>('Professional');
     const [generatedContents, setGeneratedContents] = useState<{
          linkedin?: GeneratedContent;
          x?: GeneratedContent;
     }>({});

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
                         <button
                              onClick={handleLogout}
                              className="px-4 py-2 bg-dark-surface border border-dark-border text-dark-text text-sm font-medium rounded-lg hover:bg-dark-surface-hover"
                         >
                              Logout
                         </button>
                    </div>

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
