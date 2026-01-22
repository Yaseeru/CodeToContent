import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import ContentGenerator from '../ContentGenerator';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContentGenerator Format Selection Tests', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('jwt', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     // Validates: Requirements 1.1, 1.3
     test('format selector renders all three format options', async () => {
          const mockProfileResponse = {
               data: {
                    voiceStrength: 80,
                    evolutionScore: 0,
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
               expect(screen.getByText('Single Post')).toBeInTheDocument();
               expect(screen.getByText('Mini Thread')).toBeInTheDocument();
               expect(screen.getByText('Full Thread')).toBeInTheDocument();
          });

          // Check descriptions
          expect(screen.getByText('One high-impact tweet with hook, update, and CTA')).toBeInTheDocument();
          expect(screen.getByText('Hook + Context → Problem + Solution → Result + CTA')).toBeInTheDocument();
          expect(screen.getByText('Comprehensive story with technical depth')).toBeInTheDocument();

          // Check tweet counts
          expect(screen.getByText('1 tweet')).toBeInTheDocument();
          expect(screen.getByText('3 tweets')).toBeInTheDocument();
          expect(screen.getByText('5-7 tweets')).toBeInTheDocument();
     });

     // Validates: Requirements 1.2, 1.4
     test('default format is single post', async () => {
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
               const singlePostRadio = container.querySelector('input[value="single"]') as HTMLInputElement;
               expect(singlePostRadio).toBeChecked();
          });
     });

     // Validates: Requirements 1.2
     test('clicking format option updates selected format', async () => {
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
               expect(screen.getByText('Single Post')).toBeInTheDocument();
          });

          // Click on Mini Thread
          const miniThreadRadio = container.querySelector('input[value="mini_thread"]') as HTMLInputElement;
          fireEvent.click(miniThreadRadio);

          expect(miniThreadRadio).toBeChecked();

          // Click on Full Thread
          const fullThreadRadio = container.querySelector('input[value="full_thread"]') as HTMLInputElement;
          fireEvent.click(fullThreadRadio);

          expect(fullThreadRadio).toBeChecked();
          expect(miniThreadRadio).not.toBeChecked();
     });

     // Validates: Requirements 1.5
     test('format parameter is included in API call for single post', async () => {
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
                         platform: 'x',
                         contentFormat: 'single',
                         generatedText: 'Generated single post content',
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
               expect(screen.getByText('Single Post')).toBeInTheDocument();
          });

          const generateButton = screen.getByText('Generate for X (Twitter)');
          fireEvent.click(generateButton);

          await waitFor(() => {
               expect(mockedAxios).toHaveBeenCalledWith(
                    expect.objectContaining({
                         method: 'POST',
                         url: '/api/content/generate',
                         data: expect.objectContaining({
                              analysisId: 'test-analysis-id',
                              platform: 'x',
                              format: 'single',
                         }),
                    })
               );
          });
     });

     // Validates: Requirements 1.5
     test('format parameter is included in API call for mini thread', async () => {
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
                         platform: 'x',
                         contentFormat: 'mini_thread',
                         generatedText: 'Tweet 1\n\nTweet 2\n\nTweet 3',
                         tweets: [
                              { text: 'Tweet 1', position: 1, characterCount: 7 },
                              { text: 'Tweet 2', position: 2, characterCount: 7 },
                              { text: 'Tweet 3', position: 3, characterCount: 7 },
                         ],
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
               expect(screen.getByText('Mini Thread')).toBeInTheDocument();
          });

          // Select mini thread format
          const miniThreadRadio = container.querySelector('input[value="mini_thread"]') as HTMLInputElement;
          fireEvent.click(miniThreadRadio);

          const generateButton = screen.getByText('Generate for X (Twitter)');
          fireEvent.click(generateButton);

          await waitFor(() => {
               expect(mockedAxios).toHaveBeenCalledWith(
                    expect.objectContaining({
                         method: 'POST',
                         url: '/api/content/generate',
                         data: expect.objectContaining({
                              analysisId: 'test-analysis-id',
                              platform: 'x',
                              format: 'mini_thread',
                         }),
                    })
               );
          });
     });

     // Validates: Requirements 1.5
     test('format parameter is included in API call for full thread', async () => {
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
                         platform: 'x',
                         contentFormat: 'full_thread',
                         generatedText: 'Tweet 1\n\nTweet 2\n\nTweet 3\n\nTweet 4\n\nTweet 5',
                         tweets: [
                              { text: 'Tweet 1', position: 1, characterCount: 7 },
                              { text: 'Tweet 2', position: 2, characterCount: 7 },
                              { text: 'Tweet 3', position: 3, characterCount: 7 },
                              { text: 'Tweet 4', position: 4, characterCount: 7 },
                              { text: 'Tweet 5', position: 5, characterCount: 7 },
                         ],
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
               expect(screen.getByText('Full Thread')).toBeInTheDocument();
          });

          // Select full thread format
          const fullThreadRadio = container.querySelector('input[value="full_thread"]') as HTMLInputElement;
          fireEvent.click(fullThreadRadio);

          const generateButton = screen.getByText('Generate for X (Twitter)');
          fireEvent.click(generateButton);

          await waitFor(() => {
               expect(mockedAxios).toHaveBeenCalledWith(
                    expect.objectContaining({
                         method: 'POST',
                         url: '/api/content/generate',
                         data: expect.objectContaining({
                              analysisId: 'test-analysis-id',
                              platform: 'x',
                              format: 'full_thread',
                         }),
                    })
               );
          });
     });

     // Validates: Requirements 1.1
     test('format selector is accessible with keyboard navigation', async () => {
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
               expect(screen.getByText('Single Post')).toBeInTheDocument();
          });

          // Check ARIA labels
          const radioGroup = container.querySelector('[role="radiogroup"]');
          expect(radioGroup).toHaveAttribute('aria-label', 'Content format selection');

          const singlePostRadio = screen.getByLabelText('Single Post');
          const miniThreadRadio = screen.getByLabelText('Mini Thread');
          const fullThreadRadio = screen.getByLabelText('Full Thread');

          expect(singlePostRadio).toBeInTheDocument();
          expect(miniThreadRadio).toBeInTheDocument();
          expect(fullThreadRadio).toBeInTheDocument();
     });

     // Validates: Requirements 1.2
     test('selected format is visually distinct', async () => {
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
               expect(screen.getByText('Single Post')).toBeInTheDocument();
          });

          // Get the label elements
          const singlePostLabel = container.querySelector('input[value="single"]')?.closest('label');
          const miniThreadLabel = container.querySelector('input[value="mini_thread"]')?.closest('label');

          // Single post should have accent border (selected)
          expect(singlePostLabel?.className).toContain('border-dark-accent');

          // Mini thread should not have accent border (not selected)
          expect(miniThreadLabel?.className).toContain('border-dark-border');

          // Click mini thread
          const miniThreadRadio = container.querySelector('input[value="mini_thread"]') as HTMLInputElement;
          fireEvent.click(miniThreadRadio);

          // Now mini thread should have accent border
          expect(miniThreadLabel?.className).toContain('border-dark-accent');
     });

     // Validates: Requirements 1.2
     test('format selection works with voice profile enabled', async () => {
          const mockProfileResponse = {
               data: {
                    styleProfile: {
                         voiceType: 'professional',
                         learningIterations: 5,
                         samplePosts: ['Sample post'],
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
                         contentFormat: 'mini_thread',
                         generatedText: 'Tweet 1\n\nTweet 2\n\nTweet 3',
                         tweets: [
                              { text: 'Tweet 1', position: 1, characterCount: 7 },
                              { text: 'Tweet 2', position: 2, characterCount: 7 },
                              { text: 'Tweet 3', position: 3, characterCount: 7 },
                         ],
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

          // Select mini thread
          const miniThreadRadio = container.querySelector('input[value="mini_thread"]') as HTMLInputElement;
          fireEvent.click(miniThreadRadio);

          const generateButton = screen.getByText('Generate for X (Twitter)');
          fireEvent.click(generateButton);

          await waitFor(() => {
               expect(mockedAxios).toHaveBeenCalledWith(
                    expect.objectContaining({
                         method: 'POST',
                         url: '/api/content/generate',
                         data: expect.objectContaining({
                              format: 'mini_thread',
                              voiceStrength: 80,
                         }),
                    })
               );
          });
     });
});
