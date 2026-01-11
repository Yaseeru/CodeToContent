import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import axios from 'axios';
import AnalysisView from '../AnalysisView';

// Feature: code-to-content, Property 6: Analysis Initiation
// Validates: Requirements 2.4, 2.5

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AnalysisView - Property 6: Analysis Initiation', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('token', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     it('should automatically initiate analysis when repository is selected', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.uuid(),
                    fc.record({
                         id: fc.uuid(),
                         repositoryId: fc.uuid(),
                         problemStatement: fc.string({ minLength: 10, maxLength: 200 }),
                         targetAudience: fc.string({ minLength: 10, maxLength: 200 }),
                         coreFunctionality: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
                         notableFeatures: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 5 }),
                         recentChanges: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 5 }),
                         integrations: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { maxLength: 5 }),
                         valueProposition: fc.string({ minLength: 10, maxLength: 200 }),
                         createdAt: fc.date(),
                    }),
                    async (repositoryId, analysis) => {
                         // Mock API response
                         mockedAxios.post.mockResolvedValueOnce({
                              data: {
                                   message: 'Analysis completed',
                                   analysisId: analysis.id,
                                   analysis,
                              },
                         });

                         // Render component with repository ID
                         render(<AnalysisView repositoryId={repositoryId} />);

                         // Verify loading indicator is displayed
                         expect(screen.getByText('Analyzing repository...')).toBeInTheDocument();

                         // Wait for analysis to complete
                         await waitFor(() => {
                              expect(screen.queryByText('Analyzing repository...')).not.toBeInTheDocument();
                         });

                         // Verify API was called with correct parameters
                         expect(mockedAxios.post).toHaveBeenCalledWith(
                              `/api/repositories/${repositoryId}/analyze`,
                              {},
                              {
                                   headers: {
                                        Authorization: 'Bearer test-token',
                                   },
                              }
                         );

                         // Verify analysis results are displayed
                         expect(screen.getByText('Analysis Results')).toBeInTheDocument();
                         expect(screen.getByText(analysis.problemStatement)).toBeInTheDocument();
                         expect(screen.getByText(analysis.targetAudience)).toBeInTheDocument();
                         expect(screen.getByText(analysis.valueProposition)).toBeInTheDocument();
                    }
               ),
               { numRuns: 100 }
          );
     });

     it('should display progress indicator during analysis', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.uuid(),
                    async (repositoryId) => {
                         // Mock API response with delay
                         mockedAxios.post.mockImplementationOnce(() =>
                              new Promise(resolve => setTimeout(() => resolve({
                                   data: {
                                        message: 'Analysis completed',
                                        analysisId: 'test-id',
                                        analysis: {
                                             id: 'test-id',
                                             repositoryId,
                                             problemStatement: 'Test problem',
                                             targetAudience: 'Test audience',
                                             coreFunctionality: ['Test functionality'],
                                             notableFeatures: [],
                                             recentChanges: [],
                                             integrations: [],
                                             valueProposition: 'Test value',
                                             createdAt: new Date(),
                                        },
                                   },
                              }), 100))
                         );

                         // Render component
                         render(<AnalysisView repositoryId={repositoryId} />);

                         // Verify progress indicator is displayed
                         expect(screen.getByText('Analyzing repository...')).toBeInTheDocument();
                         expect(screen.getByText('This may take a few moments')).toBeInTheDocument();

                         // Wait for analysis to complete
                         await waitFor(() => {
                              expect(screen.queryByText('Analyzing repository...')).not.toBeInTheDocument();
                         }, { timeout: 3000 });
                    }
               ),
               { numRuns: 100 }
          );
     });

     it('should handle analysis errors gracefully', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.uuid(),
                    fc.constantFrom(404, 429, 503, 500),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    async (repositoryId, statusCode, errorMessage) => {
                         // Mock API error
                         mockedAxios.post.mockRejectedValueOnce({
                              isAxiosError: true,
                              response: {
                                   status: statusCode,
                                   data: { message: errorMessage },
                              },
                         });

                         // Render component
                         render(<AnalysisView repositoryId={repositoryId} />);

                         // Wait for error to be displayed
                         await waitFor(() => {
                              expect(screen.queryByText('Analyzing repository...')).not.toBeInTheDocument();
                         });

                         // Verify error message is displayed
                         expect(screen.getByText('Analysis Failed')).toBeInTheDocument();

                         // Verify appropriate error message based on status code
                         if (statusCode === 404) {
                              expect(screen.getByText('Repository not found.')).toBeInTheDocument();
                         } else if (statusCode === 429) {
                              expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
                         } else if (statusCode === 503) {
                              expect(screen.getByText(/AI service temporarily unavailable/i)).toBeInTheDocument();
                         } else {
                              expect(screen.getByText(errorMessage)).toBeInTheDocument();
                         }
                    }
               ),
               { numRuns: 100 }
          );
     });

     it('should not initiate analysis when no repository is selected', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.constant(null),
                    async (repositoryId) => {
                         // Render component without repository ID
                         render(<AnalysisView repositoryId={repositoryId} />);

                         // Verify no analysis is initiated
                         expect(mockedAxios.post).not.toHaveBeenCalled();

                         // Verify placeholder message is displayed
                         expect(screen.getByText('Select a repository to analyze')).toBeInTheDocument();
                    }
               ),
               { numRuns: 100 }
          );
     });
});
