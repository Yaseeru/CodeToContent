import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios, { AxiosResponse } from 'axios';
import Dashboard from '../Dashboard';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock child components
jest.mock('../SearchBar', () => ({
     __esModule: true,
     default: ({ value, onChange }: any) => (
          <input
               data-testid="search-bar"
               value={value}
               onChange={(e) => onChange(e.target.value)}
          />
     ),
}));

jest.mock('../RepositoryList', () => ({
     __esModule: true,
     default: ({ onRepositoryClick }: any) => (
          <div data-testid="repository-list">
               <button onClick={() => onRepositoryClick('repo-1')}>Test Repo</button>
          </div>
     ),
}));

jest.mock('../AnalysisView', () => ({
     __esModule: true,
     default: ({ repositoryId, onAnalysisComplete }: any) => (
          <div data-testid="analysis-view">
               {repositoryId && (
                    <button
                         onClick={() =>
                              onAnalysisComplete({
                                   id: 'analysis-1',
                                   repositoryId,
                                   problemStatement: 'Test',
                                   targetAudience: 'Developers',
                                   coreFunctionality: [],
                                   notableFeatures: [],
                                   recentChanges: [],
                                   integrations: [],
                                   valueProposition: 'Test value',
                                   createdAt: new Date(),
                              })
                         }
                    >
                         Complete Analysis
                    </button>
               )}
          </div>
     ),
}));

jest.mock('../ToneSelector', () => ({
     __esModule: true,
     default: ({ onToneChange, selectedTone }: any) => (
          <div data-testid="tone-selector">
               <button onClick={() => onToneChange('Casual')}>Change Tone</button>
          </div>
     ),
}));

jest.mock('../ContentGenerator', () => ({
     __esModule: true,
     default: ({ analysisId, tone, onContentGenerated }: any) => (
          <div data-testid="content-generator">
               <button
                    onClick={() =>
                         onContentGenerated({
                              id: 'content-1',
                              platform: 'linkedin',
                              generatedText: 'Test content',
                              tone,
                              version: 1,
                         })
                    }
               >
                    Generate Content
               </button>
          </div>
     ),
}));

jest.mock('../ContentEditor', () => ({
     __esModule: true,
     default: ({ content, onRegenerate }: any) => (
          <div data-testid={`content-editor-${content.platform}`}>
               <button onClick={() => onRegenerate()}>Regenerate</button>
          </div>
     ),
}));

jest.mock('../StyleProfileSetup', () => ({
     __esModule: true,
     default: ({ onComplete, onSkip }: any) => (
          <div data-testid="style-profile-setup">
               <button onClick={() => onComplete(50)}>Complete Setup</button>
               <button onClick={onSkip}>Skip Setup</button>
          </div>
     ),
}));

jest.mock('../ProfileAnalytics', () => ({
     __esModule: true,
     default: ({ onClose }: any) => (
          <div data-testid="profile-analytics">
               <button onClick={onClose}>Close Analytics</button>
          </div>
     ),
}));

jest.mock('../StyleProfileEditor', () => ({
     __esModule: true,
     default: ({ onClose, onSave }: any) => (
          <div data-testid="style-profile-editor">
               <button onClick={onClose}>Close Editor</button>
               <button onClick={onSave}>Save Editor</button>
          </div>
     ),
}));

const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
     data,
     status: 200,
     statusText: 'OK',
     headers: {},
     config: {} as any,
});

describe('Dashboard Profile Management Tests', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.clear();
          localStorage.setItem('voiceProfileOnboardingCompleted', 'true');
     });

     describe('Profile section display', () => {
          // Validates: Requirements 9.3, 10.3
          test('displays Voice Profile section when user has profile', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 10.3
          test('displays evolution score prominently', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 75,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('75%')).toBeInTheDocument();
                    expect(screen.getByText('Evolution Score:')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 10.3
          test('displays "Well-trained" badge for high evolution scores', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 75,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Well-trained')).toBeInTheDocument();
               });
          });

          test('does not display "Well-trained" badge for low evolution scores', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 45,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('45%')).toBeInTheDocument();
                    expect(screen.queryByText('Well-trained')).not.toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.3
          test('displays quick stats (edit count)', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('12')).toBeInTheDocument();
                    expect(screen.getByText(/edits/)).toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.3
          test('displays quick stats (last updated)', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
               });
          });

          test('does not display Voice Profile section when user has no profile', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: null,
                              voiceStrength: 80,
                              evolutionScore: 0,
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.queryByText('Voice Profile')).not.toBeInTheDocument();
               });
          });
     });

     describe('Navigation links', () => {
          // Validates: Requirements 9.3
          test('displays "View Analytics" button', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('View Analytics')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.3
          test('clicking "View Analytics" opens ProfileAnalytics modal', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('View Analytics')).toBeInTheDocument();
               });

               const analyticsButton = screen.getByText('View Analytics');
               fireEvent.click(analyticsButton);

               await waitFor(() => {
                    expect(screen.getByTestId('profile-analytics')).toBeInTheDocument();
               });
          });

          test('closing ProfileAnalytics modal hides it', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('View Analytics')).toBeInTheDocument();
               });

               const analyticsButton = screen.getByText('View Analytics');
               fireEvent.click(analyticsButton);

               await waitFor(() => {
                    expect(screen.getByTestId('profile-analytics')).toBeInTheDocument();
               });

               const closeButton = screen.getByText('Close Analytics');
               fireEvent.click(closeButton);

               await waitFor(() => {
                    expect(screen.queryByTestId('profile-analytics')).not.toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.3
          test('displays "Edit Profile" button', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.3
          test('clicking "Edit Profile" opens StyleProfileEditor modal', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
               });

               const editButton = screen.getByText('Edit Profile');
               fireEvent.click(editButton);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-editor')).toBeInTheDocument();
               });
          });

          test('closing StyleProfileEditor modal hides it', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
               });

               const editButton = screen.getByText('Edit Profile');
               fireEvent.click(editButton);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-editor')).toBeInTheDocument();
               });

               const closeButton = screen.getByText('Close Editor');
               fireEvent.click(closeButton);

               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-editor')).not.toBeInTheDocument();
               });
          });

          test('saving in StyleProfileEditor refreshes profile data', async () => {
               let callCount = 0;
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         callCount++;
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: callCount === 1 ? 65 : 70, // Different score after save
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
               });

               const editButton = screen.getByText('Edit Profile');
               fireEvent.click(editButton);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-editor')).toBeInTheDocument();
               });

               const saveButton = screen.getByText('Save Editor');
               fireEvent.click(saveButton);

               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-editor')).not.toBeInTheDocument();
               });

               // Verify profile was refreshed (callCount should be 2)
               expect(callCount).toBe(2);
          });
     });

     describe('Delete functionality with confirmation', () => {
          // Validates: Requirements 9.4, 9.6
          test('displays "Delete Profile" button', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Delete Profile')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.6
          test('clicking "Delete Profile" shows confirmation modal', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Delete Profile')).toBeInTheDocument();
               });

               const deleteButton = screen.getByText('Delete Profile');
               fireEvent.click(deleteButton);

               await waitFor(() => {
                    expect(screen.getByText('Delete Voice Profile?')).toBeInTheDocument();
                    expect(screen.getByText(/This will permanently delete your voice profile/)).toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.6
          test('clicking "Cancel" in confirmation modal closes it', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Delete Profile')).toBeInTheDocument();
               });

               const deleteButton = screen.getByText('Delete Profile');
               fireEvent.click(deleteButton);

               await waitFor(() => {
                    expect(screen.getByText('Delete Voice Profile?')).toBeInTheDocument();
               });

               const cancelButton = screen.getByText('Cancel');
               fireEvent.click(cancelButton);

               await waitFor(() => {
                    expect(screen.queryByText('Delete Voice Profile?')).not.toBeInTheDocument();
               });
          });

          // Validates: Requirements 9.4
          test('confirming delete calls API and removes profile', async () => {
               let getCallCount = 0;
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         getCallCount++;
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    if (config.url === '/api/profile/reset' && config.method === 'POST') {
                         return Promise.resolve(createAxiosResponse({ success: true }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Delete Profile')).toBeInTheDocument();
               });

               const deleteButton = screen.getByText('Delete Profile');
               fireEvent.click(deleteButton);

               await waitFor(() => {
                    expect(screen.getByText('Delete Voice Profile?')).toBeInTheDocument();
               });

               const confirmButtons = screen.getAllByText('Delete Profile');
               const confirmButton = confirmButtons.find(btn =>
                    btn.className.includes('bg-red-600')
               );

               if (confirmButton) {
                    fireEvent.click(confirmButton);
               }

               await waitFor(() => {
                    expect(screen.queryByText('Delete Voice Profile?')).not.toBeInTheDocument();
               });

               await waitFor(() => {
                    expect(screen.queryByText('Voice Profile')).not.toBeInTheDocument();
               });
          });

          test('delete API error does not crash the app', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({
                              styleProfile: {
                                   voiceType: 'professional',
                                   tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                                   learningIterations: 5,
                              },
                              voiceStrength: 80,
                              evolutionScore: 65,
                              editCount: 12,
                              lastUpdated: '2024-01-15T10:00:00Z',
                         }));
                    }
                    if (config.url === '/api/profile/reset' && config.method === 'POST') {
                         return Promise.reject(new Error('API Error'));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Delete Profile')).toBeInTheDocument();
               });

               const deleteButton = screen.getByText('Delete Profile');
               fireEvent.click(deleteButton);

               await waitFor(() => {
                    expect(screen.getByText('Delete Voice Profile?')).toBeInTheDocument();
               });

               const confirmButtons = screen.getAllByText('Delete Profile');
               const confirmButton = confirmButtons.find(btn =>
                    btn.className.includes('bg-red-600')
               );

               if (confirmButton) {
                    fireEvent.click(confirmButton);
               }

               // Should not crash, modal should close
               await waitFor(() => {
                    expect(screen.queryByText('Delete Voice Profile?')).not.toBeInTheDocument();
               });
          });
     });
});
