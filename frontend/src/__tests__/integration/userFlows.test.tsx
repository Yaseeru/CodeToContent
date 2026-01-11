/**
 * Integration Tests for Complete User Flows
 * Feature: code-to-content
 * 
 * Tests the complete user journey from authentication through content generation
 * Requirements: 1.2, 1.3, 2.1, 2.4, 3.1, 4.1
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../../components/Dashboard';
import LandingPage from '../../components/LandingPage';
import AuthCallback from '../../components/AuthCallback';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
     let store: Record<string, string> = {};
     return {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => {
               store[key] = value.toString();
          },
          removeItem: (key: string) => {
               delete store[key];
          },
          clear: () => {
               store = {};
          },
     };
})();

Object.defineProperty(window, 'localStorage', {
     value: localStorageMock,
});

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('Integration Tests - Complete User Flows', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorageMock.clear();
          mockedAxios.mockClear();
          mockedAxios.get = jest.fn();
          mockedAxios.post = jest.fn();
          mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
     });

     describe('Authentication → Dashboard → Analysis → Content Generation Flow', () => {
          it('should complete full user journey from login to content generation', async () => {
               const user = userEvent.setup();

               // Step 1: User lands on homepage and sees login button
               const { rerender } = render(
                    <BrowserRouter>
                         <LandingPage />
                    </BrowserRouter>
               );

               const loginButton = screen.getByText(/Continue with GitHub/i);
               expect(loginButton).toBeInTheDocument();

               // Step 2: User clicks login button (OAuth flow would happen externally)
               // Simulate successful OAuth callback
               const mockToken = 'test-jwt-token';
               mockedAxios.get.mockResolvedValueOnce({
                    data: { token: mockToken },
               });

               // Step 3: User is redirected to dashboard with JWT
               localStorageMock.setItem('jwt', mockToken);

               // Mock repositories fetch
               const mockRepositories = [
                    {
                         id: 'repo-1',
                         name: 'test-repo',
                         fullName: 'user/test-repo',
                         description: 'A test repository',
                         url: 'https://github.com/user/test-repo',
                    },
               ];

               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               rerender(
                    <BrowserRouter>
                         <Dashboard />
                    </BrowserRouter>
               );

               // Step 4: Verify dashboard loads with repositories
               await waitFor(() => {
                    expect(screen.getByText('test-repo')).toBeInTheDocument();
               });

               // Step 5: User clicks on a repository to analyze
               const mockAnalysis = {
                    id: 'analysis-1',
                    repositoryId: 'repo-1',
                    problemStatement: 'Solves testing problems',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing', 'Automation'],
                    notableFeatures: ['Fast', 'Reliable'],
                    recentChanges: ['Added new features'],
                    integrations: ['GitHub'],
                    valueProposition: 'Makes testing easier',
                    createdAt: new Date(),
               };

               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    if (config.url?.includes('/analyze') && config.method === 'POST') {
                         return Promise.resolve({ data: { analysis: mockAnalysis } });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               const repoCard = screen.getByText('test-repo');
               await user.click(repoCard);

               // Step 6: Verify analysis starts and completes
               await waitFor(() => {
                    expect(screen.getByText('Analyzing repository...')).toBeInTheDocument();
               });

               await waitFor(() => {
                    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
                    expect(screen.getByText('Solves testing problems')).toBeInTheDocument();
               });

               // Step 7: User generates content for LinkedIn
               const mockContent = {
                    id: 'content-1',
                    platform: 'linkedin' as const,
                    generatedText: 'Check out my new project!',
                    tone: 'Professional',
                    version: 1,
               };

               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    if (config.url?.includes('/analyze') && config.method === 'POST') {
                         return Promise.resolve({ data: { analysis: mockAnalysis } });
                    }
                    if (config.url === '/api/content/generate' && config.method === 'POST') {
                         return Promise.resolve({ data: { content: mockContent } });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               const generateLinkedInButton = screen.getByText('Generate for LinkedIn');
               await user.click(generateLinkedInButton);

               // Step 8: Verify content is generated and displayed
               await waitFor(() => {
                    expect(screen.getByText('LinkedIn Content')).toBeInTheDocument();
                    expect(screen.getByDisplayValue('Check out my new project!')).toBeInTheDocument();
               });

               // Step 9: User can copy the content
               const copyButton = screen.getByText('Copy');
               expect(copyButton).toBeInTheDocument();
          });
     });

     describe('Error Recovery Scenarios', () => {
          it('should handle repository fetch failure with retry', async () => {
               const user = userEvent.setup();
               localStorageMock.setItem('jwt', 'test-token');

               // First attempt fails
               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.reject({
                              response: { status: 500, data: { message: 'Server error' } },
                              isAxiosError: true,
                         });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               render(
                    <BrowserRouter>
                         <Dashboard />
                    </BrowserRouter>
               );

               // Verify error is displayed
               await waitFor(() => {
                    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
               });

               // Verify retry button is present
               const retryButton = screen.getByText('Retry');
               expect(retryButton).toBeInTheDocument();

               // Mock successful retry
               const mockRepositories = [
                    {
                         id: 'repo-1',
                         name: 'test-repo',
                         fullName: 'user/test-repo',
                         description: 'A test repository',
                         url: 'https://github.com/user/test-repo',
                    },
               ];

               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               // Click retry
               await user.click(retryButton);

               // Verify repositories load successfully
               await waitFor(() => {
                    expect(screen.getByText('test-repo')).toBeInTheDocument();
               });
          });

          it('should handle analysis failure with retry', async () => {
               const user = userEvent.setup();
               localStorageMock.setItem('jwt', 'test-token');

               const mockRepositories = [
                    {
                         id: 'repo-1',
                         name: 'test-repo',
                         fullName: 'user/test-repo',
                         description: 'A test repository',
                         url: 'https://github.com/user/test-repo',
                    },
               ];

               // First analysis attempt fails
               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    if (config.url?.includes('/analyze') && config.method === 'POST') {
                         return Promise.reject({
                              response: { status: 503, data: { message: 'Service unavailable' } },
                              isAxiosError: true,
                         });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               render(
                    <BrowserRouter>
                         <Dashboard />
                    </BrowserRouter>
               );

               await waitFor(() => {
                    expect(screen.getByText('test-repo')).toBeInTheDocument();
               });

               // Click repository to trigger analysis
               const repoCard = screen.getByText('test-repo');
               await user.click(repoCard);

               // Verify error is displayed
               await waitFor(() => {
                    expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
                    expect(screen.getByText(/Service unavailable/i)).toBeInTheDocument();
               });

               // Verify retry button is present
               const retryButton = screen.getByText('Retry Analysis');
               expect(retryButton).toBeInTheDocument();

               // Mock successful retry
               const mockAnalysis = {
                    id: 'analysis-1',
                    repositoryId: 'repo-1',
                    problemStatement: 'Solves testing problems',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: [],
                    recentChanges: [],
                    integrations: [],
                    valueProposition: 'Makes testing easier',
                    createdAt: new Date(),
               };

               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    if (config.url?.includes('/analyze') && config.method === 'POST') {
                         return Promise.resolve({ data: { analysis: mockAnalysis } });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               // Click retry
               await user.click(retryButton);

               // Verify analysis completes successfully
               await waitFor(() => {
                    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
                    expect(screen.getByText('Solves testing problems')).toBeInTheDocument();
               });
          });

          it('should preserve edited content when refinement fails', async () => {
               const user = userEvent.setup();
               localStorageMock.setItem('jwt', 'test-token');

               const mockRepositories = [
                    {
                         id: 'repo-1',
                         name: 'test-repo',
                         fullName: 'user/test-repo',
                         description: 'A test repository',
                         url: 'https://github.com/user/test-repo',
                    },
               ];

               const mockAnalysis = {
                    id: 'analysis-1',
                    repositoryId: 'repo-1',
                    problemStatement: 'Solves testing problems',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: [],
                    recentChanges: [],
                    integrations: [],
                    valueProposition: 'Makes testing easier',
                    createdAt: new Date(),
               };

               const mockContent = {
                    id: 'content-1',
                    platform: 'linkedin' as const,
                    generatedText: 'Original content',
                    tone: 'Professional',
                    version: 1,
               };

               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    if (config.url?.includes('/analyze') && config.method === 'POST') {
                         return Promise.resolve({ data: { analysis: mockAnalysis } });
                    }
                    if (config.url === '/api/content/generate' && config.method === 'POST') {
                         return Promise.resolve({ data: { content: mockContent } });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               render(
                    <BrowserRouter>
                         <Dashboard />
                    </BrowserRouter>
               );

               await waitFor(() => {
                    expect(screen.getByText('test-repo')).toBeInTheDocument();
               });

               // Trigger analysis and content generation
               const repoCard = screen.getByText('test-repo');
               await user.click(repoCard);

               await waitFor(() => {
                    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
               });

               const generateButton = screen.getByText('Generate for LinkedIn');
               await user.click(generateButton);

               await waitFor(() => {
                    expect(screen.getByDisplayValue('Original content')).toBeInTheDocument();
               });

               // User edits the content
               const textarea = screen.getByDisplayValue('Original content');
               await user.clear(textarea);
               await user.type(textarea, 'My edited content');

               // Verify edited content is displayed
               expect(screen.getByDisplayValue('My edited content')).toBeInTheDocument();

               // Mock refinement failure
               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    if (config.url?.includes('/analyze') && config.method === 'POST') {
                         return Promise.resolve({ data: { analysis: mockAnalysis } });
                    }
                    if (config.url === '/api/content/generate' && config.method === 'POST') {
                         return Promise.resolve({ data: { content: mockContent } });
                    }
                    if (config.url === '/api/content/refine' && config.method === 'POST') {
                         return Promise.reject({
                              response: { status: 500, data: { message: 'Refinement failed' } },
                              isAxiosError: true,
                         });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               // Try to refine content
               const shorterButton = screen.getByText('Make Shorter');
               await user.click(shorterButton);

               // Verify error is displayed but edited content is preserved
               await waitFor(() => {
                    expect(screen.getByText(/Refinement failed/i)).toBeInTheDocument();
               });

               // Verify edited content is still there
               expect(screen.getByDisplayValue('My edited content')).toBeInTheDocument();
          });

          it('should handle network errors with automatic retry', async () => {
               localStorageMock.setItem('jwt', 'test-token');

               let attemptCount = 0;
               const mockRepositories = [
                    {
                         id: 'repo-1',
                         name: 'test-repo',
                         fullName: 'user/test-repo',
                         description: 'A test repository',
                         url: 'https://github.com/user/test-repo',
                    },
               ];

               // First 2 attempts fail with network error, 3rd succeeds
               mockedAxios.mockImplementation((config: any) => {
                    if (config.url === '/api/repositories' && config.method === 'GET') {
                         attemptCount++;
                         if (attemptCount <= 2) {
                              return Promise.reject({
                                   request: {},
                                   isAxiosError: true,
                              });
                         }
                         return Promise.resolve({ data: { repositories: mockRepositories } });
                    }
                    return Promise.reject(new Error('Not found'));
               });

               render(
                    <BrowserRouter>
                         <Dashboard />
                    </BrowserRouter>
               );

               // Should eventually succeed after retries
               await waitFor(
                    () => {
                         expect(screen.getByText('test-repo')).toBeInTheDocument();
                    },
                    { timeout: 10000 }
               );

               // Verify multiple attempts were made
               expect(attemptCount).toBeGreaterThan(1);
          });
     });

     describe('Authentication Flow', () => {
          it('should handle OAuth callback success', async () => {
               const mockToken = 'test-jwt-token';
               mockedAxios.get.mockResolvedValueOnce({
                    data: { token: mockToken },
               });

               // Mock useSearchParams
               const mockSearchParams = new URLSearchParams('?code=test-code');
               jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([
                    mockSearchParams,
                    jest.fn(),
               ]);

               const mockNavigate = jest.fn();
               jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

               render(
                    <BrowserRouter>
                         <AuthCallback />
                    </BrowserRouter>
               );

               await waitFor(() => {
                    expect(localStorageMock.getItem('jwt')).toBe(mockToken);
                    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
               });
          });

          it('should handle OAuth callback failure', async () => {
               // Mock useSearchParams with error
               const mockSearchParams = new URLSearchParams('?error=access_denied');
               jest.spyOn(require('react-router-dom'), 'useSearchParams').mockReturnValue([
                    mockSearchParams,
                    jest.fn(),
               ]);

               render(
                    <BrowserRouter>
                         <AuthCallback />
                    </BrowserRouter>
               );

               await waitFor(() => {
                    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
                    expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
               });

               // Verify retry button is present
               expect(screen.getByText('Try Again')).toBeInTheDocument();
          });
     });
});
