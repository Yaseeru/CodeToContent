import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import axios from 'axios';
import RepositoryList from '../RepositoryList';

// Feature: code-to-content, Property 4: Repository Fetching
// Validates: Requirements 2.1

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RepositoryList - Property 4: Repository Fetching', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('token', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     it('should fetch and display repositories for any authenticated user', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              id: fc.uuid(),
                              name: fc.string({ minLength: 1, maxLength: 50 }),
                              fullName: fc.string({ minLength: 1, maxLength: 100 }),
                              description: fc.string({ maxLength: 200 }),
                              url: fc.webUrl(),
                              lastAnalyzed: fc.option(fc.date(), { nil: undefined }),
                         }),
                         { minLength: 0, maxLength: 20 }
                    ),
                    async (repositories) => {
                         // Mock API response
                         mockedAxios.get.mockResolvedValueOnce({
                              data: { repositories },
                         });

                         // Render component
                         render(<RepositoryList />);

                         // Wait for loading to complete
                         await waitFor(() => {
                              expect(screen.queryByText('Loading repositories...')).not.toBeInTheDocument();
                         });

                         // Verify API was called with correct headers
                         expect(mockedAxios.get).toHaveBeenCalledWith(
                              '/api/repositories',
                              {
                                   headers: {
                                        Authorization: 'Bearer test-token',
                                   },
                              }
                         );

                         // Verify all repositories are displayed
                         if (repositories.length === 0) {
                              expect(screen.getByText('No repositories found')).toBeInTheDocument();
                         } else {
                              repositories.forEach((repo) => {
                                   expect(screen.getByText(repo.name)).toBeInTheDocument();
                              });
                         }
                    }
               ),
               { numRuns: 100 }
          );
     });

     it('should handle authentication errors for any user', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.constantFrom(401, 403),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    async (statusCode, errorMessage) => {
                         // Mock API error
                         mockedAxios.get.mockRejectedValueOnce({
                              isAxiosError: true,
                              response: {
                                   status: statusCode,
                                   data: { message: errorMessage },
                              },
                         });

                         // Render component
                         render(<RepositoryList />);

                         // Wait for error to be displayed
                         await waitFor(() => {
                              expect(screen.queryByText('Loading repositories...')).not.toBeInTheDocument();
                         });

                         // Verify error message is displayed
                         if (statusCode === 401) {
                              expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
                         } else {
                              expect(screen.getByText(errorMessage)).toBeInTheDocument();
                         }
                    }
               ),
               { numRuns: 100 }
          );
     });

     it('should handle rate limit errors gracefully', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.constant(429),
                    async (statusCode) => {
                         // Mock rate limit error
                         mockedAxios.get.mockRejectedValueOnce({
                              isAxiosError: true,
                              response: {
                                   status: statusCode,
                                   data: { message: 'Rate limit exceeded' },
                              },
                         });

                         // Render component
                         render(<RepositoryList />);

                         // Wait for error to be displayed
                         await waitFor(() => {
                              expect(screen.queryByText('Loading repositories...')).not.toBeInTheDocument();
                         });

                         // Verify rate limit message is displayed
                         expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
                    }
               ),
               { numRuns: 100 }
          );
     });
});
