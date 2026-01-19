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

jest.mock('../ContentGenerator', () => ({
     __esModule: true,
     default: ({ analysisId, onContentGenerated }: any) => (
          <div data-testid="content-generator">
               <button
                    onClick={() =>
                         onContentGenerated({
                              id: 'content-1',
                              platform: 'linkedin',
                              generatedText: 'Test content',
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

const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
     data,
     status: 200,
     statusText: 'OK',
     headers: {},
     config: {} as any,
});

describe('Dashboard Onboarding Integration Tests', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.clear();

          // Default mock for axios
          (mockedAxios as any).mockImplementation((config: any) => {
               if (config.url === '/api/profile/style' && config.method === 'GET') {
                    return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
               }
               return Promise.reject(new Error('Not mocked'));
          });
     });

     describe('Modal display for new users', () => {
          // Validates: Requirements 8.1
          test('shows onboarding modal for new users without profile', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 8.7
          test('does not show modal for users who already completed onboarding', async () => {
               localStorage.setItem('voiceProfileOnboardingCompleted', 'true');

               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-setup')).not.toBeInTheDocument();
               });
          });

          // Validates: Requirements 8.7
          test('does not show modal for users with existing profile', async () => {
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
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-setup')).not.toBeInTheDocument();
               });
          });

          // Validates: Requirements 8.7
          test('shows modal only once unless explicitly requested', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               const { unmount } = render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });

               // Complete onboarding
               const completeButton = screen.getByText('Complete Setup');
               fireEvent.click(completeButton);

               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-setup')).not.toBeInTheDocument();
               });

               // Unmount and remount
               unmount();
               render(<Dashboard />);

               // Modal should not appear again
               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-setup')).not.toBeInTheDocument();
               });
          });
     });

     describe('Setup button for users who skipped', () => {
          // Validates: Requirements 8.1
          test('shows "Setup Voice Profile" button when user has no profile', async () => {
               localStorage.setItem('voiceProfileOnboardingCompleted', 'true');

               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Setup Voice Profile')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 8.1
          test('clicking "Setup Voice Profile" button opens onboarding modal', async () => {
               localStorage.setItem('voiceProfileOnboardingCompleted', 'true');

               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Setup Voice Profile')).toBeInTheDocument();
               });

               const setupButton = screen.getByText('Setup Voice Profile');
               fireEvent.click(setupButton);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });
          });

          test('does not show "Setup Voice Profile" button when user has profile', async () => {
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
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.queryByText('Setup Voice Profile')).not.toBeInTheDocument();
               });
          });
     });

     describe('Reconfigure option', () => {
          // Validates: Requirements 8.7
          test('shows "Reconfigure Voice" button when user has profile', async () => {
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
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Reconfigure Voice')).toBeInTheDocument();
               });
          });

          // Validates: Requirements 8.7
          test('clicking "Reconfigure Voice" button opens onboarding modal', async () => {
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
                         }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByText('Reconfigure Voice')).toBeInTheDocument();
               });

               const reconfigureButton = screen.getByText('Reconfigure Voice');
               fireEvent.click(reconfigureButton);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });
          });

          test('does not show "Reconfigure Voice" button when user has no profile', async () => {
               localStorage.setItem('voiceProfileOnboardingCompleted', 'true');

               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.queryByText('Reconfigure Voice')).not.toBeInTheDocument();
               });
          });
     });

     describe('Onboarding completion tracking', () => {
          test('marks onboarding as completed when user completes setup', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });

               const completeButton = screen.getByText('Complete Setup');
               fireEvent.click(completeButton);

               await waitFor(() => {
                    expect(localStorage.getItem('voiceProfileOnboardingCompleted')).toBe('true');
               });
          });

          test('marks onboarding as completed when user skips setup', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });

               const skipButton = screen.getByText('Skip Setup');
               fireEvent.click(skipButton);

               await waitFor(() => {
                    expect(localStorage.getItem('voiceProfileOnboardingCompleted')).toBe('true');
               });
          });

          test('closes modal after completing setup', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });

               const completeButton = screen.getByText('Complete Setup');
               fireEvent.click(completeButton);

               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-setup')).not.toBeInTheDocument();
               });
          });

          test('closes modal after skipping setup', async () => {
               (mockedAxios as any).mockImplementation((config: any) => {
                    if (config.url === '/api/profile/style' && config.method === 'GET') {
                         return Promise.resolve(createAxiosResponse({ styleProfile: null, voiceStrength: 80, evolutionScore: 0 }));
                    }
                    return Promise.reject(new Error('Not mocked'));
               });

               render(<Dashboard />);

               await waitFor(() => {
                    expect(screen.getByTestId('style-profile-setup')).toBeInTheDocument();
               });

               const skipButton = screen.getByText('Skip Setup');
               fireEvent.click(skipButton);

               await waitFor(() => {
                    expect(screen.queryByTestId('style-profile-setup')).not.toBeInTheDocument();
               });
          });
     });
});
