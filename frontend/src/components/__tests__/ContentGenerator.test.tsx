import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import ContentGenerator from '../ContentGenerator';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContentGenerator Voice Enhancements Tests', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('jwt', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     // Validates: Requirements 10.4
     test('displays "Using your voice" indicator when styleProfile exists', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'professional',
                         learningIterations: 5,
                         samplePosts: ['Sample post 1', 'Sample post 2'],
                    },
                    voiceStrength: 80,
                    evolutionScore: 45,
               },
          };

          mockedAxios.mockResolvedValueOnce(mockProfileResponse);

          const mockOnContentGenerated = jest.fn();

          render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Using your voice')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 10.4
     test('displays evolution score when styleProfile exists', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'professional',
                         learningIterations: 10,
                         samplePosts: ['Sample post 1'],
                    },
                    voiceStrength: 80,
                    evolutionScore: 65,
               },
          };

          mockedAxios.mockResolvedValueOnce(mockProfileResponse);

          const mockOnContentGenerated = jest.fn();

          render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Evolution Score:')).toBeInTheDocument();
               expect(screen.getByText('65%')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 6.5
     test('displays voice strength slider when styleProfile exists', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'casual',
                         learningIterations: 3,
                         samplePosts: ['Sample'],
                    },
                    voiceStrength: 70,
                    evolutionScore: 30,
               },
          };

          mockedAxios.mockResolvedValueOnce(mockProfileResponse);

          const mockOnContentGenerated = jest.fn();

          const { container } = render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               const slider = container.querySelector('#voice-strength') as HTMLInputElement;
               expect(slider).toBeInTheDocument();
               expect(slider.value).toBe('70');
          });
     });

     // Validates: Requirements 6.5, 6.6
     test('voice strength slider updates value in real-time', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'professional',
                         learningIterations: 5,
                         samplePosts: ['Sample'],
                    },
                    voiceStrength: 80,
                    evolutionScore: 50,
               },
          };

          mockedAxios.mockResolvedValueOnce(mockProfileResponse);

          const mockOnContentGenerated = jest.fn();

          const { container } = render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               const slider = container.querySelector('#voice-strength') as HTMLInputElement;
               expect(slider.value).toBe('80');
          });

          const slider = container.querySelector('#voice-strength') as HTMLInputElement;
          fireEvent.change(slider, { target: { value: '50' } });

          expect(slider.value).toBe('50');
          // Check that the voice strength display (not evolution score) shows 50%
          const voiceStrengthDisplay = container.querySelector('.space-y-2 .text-sm.font-medium.text-dark-text');
          expect(voiceStrengthDisplay).toHaveTextContent('50%');
     });

     // Validates: Requirements 6.6
     test('displays tooltip explaining voice strength', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'professional',
                         learningIterations: 5,
                         samplePosts: ['Sample'],
                    },
                    voiceStrength: 80,
                    evolutionScore: 50,
               },
          };

          mockedAxios.mockResolvedValueOnce(mockProfileResponse);

          const mockOnContentGenerated = jest.fn();

          render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               const tooltipButton = screen.getByLabelText('Voice strength explanation');
               expect(tooltipButton).toBeInTheDocument();
          });
     });

     // Validates: Requirements 10.4, 6.5
     test('does not display voice indicators when no styleProfile exists', async () => {
          const mockProfileResponse = {
               data: {
                    voiceStrength: 80,
                    evolutionScore: 0,
               },
          };

          mockedAxios.mockResolvedValueOnce(mockProfileResponse);

          const mockOnContentGenerated = jest.fn();

          const { container } = render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.queryByText('Using your voice')).not.toBeInTheDocument();
               expect(screen.queryByText('Evolution Score:')).not.toBeInTheDocument();
               const slider = container.querySelector('#voice-strength');
               expect(slider).not.toBeInTheDocument();
          });
     });

     // Validates: Requirements 6.5
     test('sends voiceStrength parameter when generating content with profile', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'professional',
                         learningIterations: 5,
                         samplePosts: ['Sample'],
                    },
                    voiceStrength: 80,
                    evolutionScore: 50,
               },
          };

          const mockContentResponse = {
               data: {
                    content: {
                         id: 'content-123',
                         platform: 'linkedin',
                         generatedText: 'Generated content',
                         version: 1,
                    },
               },
          };

          mockedAxios
               .mockResolvedValueOnce(mockProfileResponse)
               .mockResolvedValueOnce(mockContentResponse);

          const mockOnContentGenerated = jest.fn();

          render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Using your voice')).toBeInTheDocument();
          });

          const generateButton = screen.getByText('Generate for LinkedIn');
          fireEvent.click(generateButton);

          await waitFor(() => {
               expect(mockedAxios).toHaveBeenCalledWith(
                    expect.objectContaining({
                         method: 'POST',
                         url: '/api/content/generate',
                         data: expect.objectContaining({
                              analysisId: 'test-analysis-id',
                              platform: 'linkedin',
                              voiceStrength: 80,
                         }),
                    })
               );
          });
     });

     // Validates: Requirements 6.5
     test('does not send voiceStrength parameter when no profile exists', async () => {
          const mockProfileResponse = {
               data: {
                    voiceStrength: 80,
                    evolutionScore: 0,
               },
          };

          const mockContentResponse = {
               data: {
                    content: {
                         id: 'content-123',
                         platform: 'linkedin',
                         generatedText: 'Generated content',
                         version: 1,
                    },
               },
          };

          mockedAxios
               .mockResolvedValueOnce(mockProfileResponse)
               .mockResolvedValueOnce(mockContentResponse);

          const mockOnContentGenerated = jest.fn();

          render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.queryByText('Using your voice')).not.toBeInTheDocument();
          });

          const generateButton = screen.getByText('Generate for LinkedIn');
          fireEvent.click(generateButton);

          await waitFor(() => {
               expect(mockedAxios).toHaveBeenCalledWith(
                    expect.objectContaining({
                         method: 'POST',
                         url: '/api/content/generate',
                         data: expect.objectContaining({
                              analysisId: 'test-analysis-id',
                              platform: 'linkedin',
                              voiceStrength: undefined,
                         }),
                    })
               );
          });
     });

     // Validates: Requirements 6.5
     test('uses updated voice strength value when generating content', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'professional',
                         learningIterations: 5,
                         samplePosts: ['Sample'],
                    },
                    voiceStrength: 80,
                    evolutionScore: 50,
               },
          };

          const mockContentResponse = {
               data: {
                    content: {
                         id: 'content-123',
                         platform: 'x',
                         generatedText: 'Generated content',
                         version: 1,
                    },
               },
          };

          mockedAxios
               .mockResolvedValueOnce(mockProfileResponse)
               .mockResolvedValueOnce(mockContentResponse);

          const mockOnContentGenerated = jest.fn();

          const { container } = render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Using your voice')).toBeInTheDocument();
          });

          // Change voice strength
          const slider = container.querySelector('#voice-strength') as HTMLInputElement;
          fireEvent.change(slider, { target: { value: '60' } });

          expect(slider.value).toBe('60');

          // Generate content
          const generateButton = screen.getByText('Generate for X');
          fireEvent.click(generateButton);

          await waitFor(() => {
               expect(mockedAxios).toHaveBeenCalledWith(
                    expect.objectContaining({
                         method: 'POST',
                         url: '/api/content/generate',
                         data: expect.objectContaining({
                              voiceStrength: 60,
                         }),
                    })
               );
          });
     });

     // Validates: Requirements 10.4
     test('maintains existing functionality when profile loading fails', async () => {
          mockedAxios.mockRejectedValueOnce(new Error('Profile fetch failed'));

          const mockContentResponse = {
               data: {
                    content: {
                         id: 'content-123',
                         platform: 'linkedin',
                         generatedText: 'Generated content',
                         version: 1,
                    },
               },
          };

          mockedAxios.mockResolvedValueOnce(mockContentResponse);

          const mockOnContentGenerated = jest.fn();

          render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.queryByText('Using your voice')).not.toBeInTheDocument();
          });

          // Should still be able to generate content
          const generateButton = screen.getByText('Generate for LinkedIn');
          expect(generateButton).toBeEnabled();
     });
});
