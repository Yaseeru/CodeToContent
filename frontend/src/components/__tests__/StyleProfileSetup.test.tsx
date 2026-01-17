import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios, { AxiosResponse } from 'axios';
import StyleProfileSetup from '../StyleProfileSetup';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Helper to create axios response
const createAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
     data,
     status: 200,
     statusText: 'OK',
     headers: {},
     config: {} as any,
});

describe('StyleProfileSetup Component Tests', () => {
     const mockOnComplete = jest.fn();
     const mockOnSkip = jest.fn();

     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('jwt', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     // Validates: Requirements 8.2 - Three-path rendering
     describe('Three-path rendering', () => {
          test('renders initial choice screen with three options', () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               expect(screen.getByText('Set Up Your Voice Profile')).toBeInTheDocument();
               expect(screen.getByText('Quick Start')).toBeInTheDocument();
               expect(screen.getByText('Choose an Archetype')).toBeInTheDocument();
               expect(screen.getByText('Skip for Now')).toBeInTheDocument();
          });

          test('navigates to quick start path when clicked', () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               const quickStartButton = screen.getByText('Quick Start');
               fireEvent.click(quickStartButton);

               expect(screen.getByText('Paste Your Writing Sample')).toBeInTheDocument();
               expect(screen.getByPlaceholderText(/Paste any writing sample here/i)).toBeInTheDocument();
          });

          test('navigates to archetype path when clicked', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
                    {
                         id: 'linkedin-leader',
                         name: 'LinkedIn Thought Leader',
                         description: 'Professional, thoughtful',
                         category: 'professional',
                    },
               ];

               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse({
                    archetypes: mockArchetypes,
               }));

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               const archetypeButton = screen.getByText('Choose an Archetype');
               fireEvent.click(archetypeButton);

               await waitFor(() => {
                    expect(screen.getByText('Tech Twitter Influencer')).toBeInTheDocument();
                    expect(screen.getByText('LinkedIn Thought Leader')).toBeInTheDocument();
               });
          });

          test('shows skip confirmation when skip is clicked', () => {
               jest.useFakeTimers();
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               const skipButton = screen.getByText('Skip for Now');
               fireEvent.click(skipButton);

               expect(screen.getByText('No Problem!')).toBeInTheDocument();
               expect(screen.getByText(/The system will learn your writing style from your edits over time/i)).toBeInTheDocument();

               jest.advanceTimersByTime(1500);
               expect(mockOnSkip).toHaveBeenCalledTimes(1);

               jest.useRealTimers();
          });
     });

     // Validates: Requirements 8.3 - Text input validation
     describe('Text input validation', () => {
          test('shows character count for text input', () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               fireEvent.change(textarea, { target: { value: 'Hello world' } });

               expect(screen.getByText('11 / 300 characters minimum')).toBeInTheDocument();
          });

          test('disables analyze button when text is less than 300 characters', () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               fireEvent.change(textarea, { target: { value: 'Short text' } });

               const analyzeButton = screen.getByText('Analyze My Style');
               expect(analyzeButton).toBeDisabled();
          });

          test('enables analyze button when text is 300 or more characters', () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               const longText = 'a'.repeat(300);
               fireEvent.change(textarea, { target: { value: longText } });

               const analyzeButton = screen.getByText('Analyze My Style');
               expect(analyzeButton).not.toBeDisabled();
          });

          test('shows error when trying to analyze text with less than 300 characters', async () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               fireEvent.change(textarea, { target: { value: 'Short text' } });

               // Force click the button (even though it should be disabled)
               const analyzeButton = screen.getByText('Analyze My Style');
               analyzeButton.removeAttribute('disabled');
               fireEvent.click(analyzeButton);

               await waitFor(() => {
                    expect(screen.getByText('Please provide at least 300 characters for analysis.')).toBeInTheDocument();
               });
          });

          test('calls API with text when analyze button is clicked with valid text', async () => {
               mockedAxios.post.mockResolvedValueOnce(createAxiosResponse({
                    evolutionScore: 35,
               }));

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               const longText = 'a'.repeat(300);
               fireEvent.change(textarea, { target: { value: longText } });

               const analyzeButton = screen.getByText('Analyze My Style');
               fireEvent.click(analyzeButton);

               await waitFor(() => {
                    expect(mockedAxios.post).toHaveBeenCalledWith(
                         '/api/profile/analyze-text',
                         { text: longText }
                    );
               });
          });

          test('shows success state with evolution score after text analysis', async () => {
               mockedAxios.post.mockResolvedValueOnce(createAxiosResponse({
                    evolutionScore: 35,
               }));

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               const longText = 'a'.repeat(300);
               fireEvent.change(textarea, { target: { value: longText } });

               const analyzeButton = screen.getByText('Analyze My Style');
               fireEvent.click(analyzeButton);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Created!')).toBeInTheDocument();
                    expect(screen.getByText('35%')).toBeInTheDocument();
               });
          });
     });

     // Validates: Requirements 8.4 - File upload handling
     describe('File upload handling', () => {
          test('accepts valid file formats (.txt, .md, .pdf)', async () => {
               mockedAxios.post.mockResolvedValueOnce(createAxiosResponse({
                    evolutionScore: 40,
               }));

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const fileInput = screen.getByLabelText(/Click to upload/i).querySelector('input[type="file"]') as HTMLInputElement;
               const file = new File(['a'.repeat(500)], 'sample.txt', { type: 'text/plain' });

               Object.defineProperty(fileInput, 'files', {
                    value: [file],
               });

               fireEvent.change(fileInput);

               await waitFor(() => {
                    expect(mockedAxios.post).toHaveBeenCalledWith(
                         '/api/profile/analyze-text',
                         expect.any(FormData),
                         expect.objectContaining({
                              headers: {
                                   'Content-Type': 'multipart/form-data',
                              },
                         })
                    );
               });
          });

          test('rejects invalid file formats', async () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const fileInput = screen.getByLabelText(/Click to upload/i).querySelector('input[type="file"]') as HTMLInputElement;
               const file = new File(['content'], 'sample.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

               Object.defineProperty(fileInput, 'files', {
                    value: [file],
               });

               fireEvent.change(fileInput);

               await waitFor(() => {
                    expect(screen.getByText('Please upload a .txt, .md, or .pdf file.')).toBeInTheDocument();
               });

               expect(mockedAxios.post).not.toHaveBeenCalled();
          });

          test('shows file name after selection', async () => {
               mockedAxios.post.mockResolvedValueOnce(createAxiosResponse({
                    evolutionScore: 40,
               }));

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const fileInput = screen.getByLabelText(/Click to upload/i).querySelector('input[type="file"]') as HTMLInputElement;
               const file = new File(['a'.repeat(500)], 'my-writing.md', { type: 'text/markdown' });

               Object.defineProperty(fileInput, 'files', {
                    value: [file],
               });

               fireEvent.change(fileInput);

               await waitFor(() => {
                    expect(screen.getByText('my-writing.md')).toBeInTheDocument();
               });
          });

          test('shows success state with evolution score after file upload', async () => {
               mockedAxios.post.mockResolvedValueOnce(createAxiosResponse({
                    evolutionScore: 42,
               }));

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const fileInput = screen.getByLabelText(/Click to upload/i).querySelector('input[type="file"]') as HTMLInputElement;
               const file = new File(['a'.repeat(500)], 'sample.pdf', { type: 'application/pdf' });

               Object.defineProperty(fileInput, 'files', {
                    value: [file],
               });

               fireEvent.change(fileInput);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Created!')).toBeInTheDocument();
                    expect(screen.getByText('42%')).toBeInTheDocument();
               });
          });
     });

     // Validates: Requirements 8.5 - Archetype selection
     describe('Archetype selection', () => {
          test('loads and displays archetypes', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
                    {
                         id: 'linkedin-leader',
                         name: 'LinkedIn Thought Leader',
                         description: 'Professional, thoughtful',
                         category: 'professional',
                    },
                    {
                         id: 'meme-lord',
                         name: 'Meme Lord',
                         description: 'Humorous, very casual',
                         category: 'creative',
                    },
                    {
                         id: 'academic',
                         name: 'Academic Researcher',
                         description: 'Formal, analytical',
                         category: 'technical',
                    },
               ];

               mockedAxios.mockResolvedValueOnce({
                    data: { archetypes: mockArchetypes },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Tech Twitter Influencer')).toBeInTheDocument();
                    expect(screen.getByText('LinkedIn Thought Leader')).toBeInTheDocument();
                    expect(screen.getByText('Meme Lord')).toBeInTheDocument();
                    expect(screen.getByText('Academic Researcher')).toBeInTheDocument();
               });
          });

          test('allows selecting an archetype', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
               ];

               mockedAxios.mockResolvedValueOnce({
                    data: { archetypes: mockArchetypes },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Tech Twitter Influencer')).toBeInTheDocument();
               });

               const archetypeButton = screen.getByText('Tech Twitter Influencer').closest('button');
               fireEvent.click(archetypeButton!);

               expect(archetypeButton).toHaveClass('border-dark-accent');
          });

          test('disables apply button when no archetype is selected', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
               ];

               mockedAxios.mockResolvedValueOnce({
                    data: { archetypes: mockArchetypes },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Apply Archetype')).toBeInTheDocument();
               });

               const applyButton = screen.getByText('Apply Archetype');
               expect(applyButton).toBeDisabled();
          });

          test('calls API when archetype is applied', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
               ];

               mockedAxios.mockResolvedValueOnce({
                    data: { archetypes: mockArchetypes },
               });

               mockedAxios.post.mockResolvedValueOnce({
                    data: { evolutionScore: 30 },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Tech Twitter Influencer')).toBeInTheDocument();
               });

               const archetypeButton = screen.getByText('Tech Twitter Influencer').closest('button');
               fireEvent.click(archetypeButton!);

               const applyButton = screen.getByText('Apply Archetype');
               fireEvent.click(applyButton);

               await waitFor(() => {
                    expect(mockedAxios.post).toHaveBeenCalledWith(
                         '/api/profile/apply-archetype',
                         { archetypeId: 'tech-twitter' }
                    );
               });
          });

          test('shows success state with evolution score after archetype is applied', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
               ];

               mockedAxios.mockResolvedValueOnce({
                    data: { archetypes: mockArchetypes },
               });

               mockedAxios.post.mockResolvedValueOnce({
                    data: { evolutionScore: 30 },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Tech Twitter Influencer')).toBeInTheDocument();
               });

               const archetypeButton = screen.getByText('Tech Twitter Influencer').closest('button');
               fireEvent.click(archetypeButton!);

               const applyButton = screen.getByText('Apply Archetype');
               fireEvent.click(applyButton);

               await waitFor(() => {
                    expect(screen.getByText('Archetype Applied!')).toBeInTheDocument();
                    expect(screen.getByText('30%')).toBeInTheDocument();
               });
          });
     });

     // Validates: Requirements 8.2, 8.3, 8.4, 8.5 - Skip functionality
     describe('Skip functionality', () => {
          test('calls onSkip callback after showing confirmation', () => {
               jest.useFakeTimers();
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               const skipButton = screen.getByText('Skip for Now');
               fireEvent.click(skipButton);

               expect(mockOnSkip).not.toHaveBeenCalled();

               jest.advanceTimersByTime(1500);

               expect(mockOnSkip).toHaveBeenCalledTimes(1);

               jest.useRealTimers();
          });
     });

     // Additional tests for loading states and error handling
     describe('Loading states', () => {
          test('shows loading spinner during text analysis', async () => {
               mockedAxios.post.mockImplementation(() => new Promise(() => { })); // Never resolves

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               const longText = 'a'.repeat(300);
               fireEvent.change(textarea, { target: { value: longText } });

               const analyzeButton = screen.getByText('Analyze My Style');
               fireEvent.click(analyzeButton);

               await waitFor(() => {
                    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
               });
          });

          test('shows loading spinner during archetype application', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
               ];

               mockedAxios.mockResolvedValueOnce({
                    data: { archetypes: mockArchetypes },
               });

               mockedAxios.post.mockImplementation(() => new Promise(() => { })); // Never resolves

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Tech Twitter Influencer')).toBeInTheDocument();
               });

               const archetypeButton = screen.getByText('Tech Twitter Influencer').closest('button');
               fireEvent.click(archetypeButton!);

               const applyButton = screen.getByText('Apply Archetype');
               fireEvent.click(applyButton);

               await waitFor(() => {
                    expect(screen.getByText('Applying...')).toBeInTheDocument();
               });
          });
     });

     describe('Error handling', () => {
          test('shows error notification when text analysis fails', async () => {
               mockedAxios.post.mockRejectedValueOnce({
                    response: {
                         status: 500,
                         data: { message: 'Analysis failed' },
                    },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               const longText = 'a'.repeat(300);
               fireEvent.change(textarea, { target: { value: longText } });

               const analyzeButton = screen.getByText('Analyze My Style');
               fireEvent.click(analyzeButton);

               await waitFor(() => {
                    expect(screen.getByText('Analysis failed')).toBeInTheDocument();
               });
          });

          test('shows error notification when archetype loading fails', async () => {
               mockedAxios.mockRejectedValueOnce({
                    response: {
                         status: 500,
                         data: { message: 'Failed to load archetypes' },
                    },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Failed to load archetypes')).toBeInTheDocument();
               });
          });

          test('allows retry after error', async () => {
               mockedAxios.post
                    .mockRejectedValueOnce({
                         response: {
                              status: 500,
                              data: { message: 'Analysis failed' },
                         },
                    })
                    .mockResolvedValueOnce({
                         data: { evolutionScore: 35 },
                    });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               const longText = 'a'.repeat(300);
               fireEvent.change(textarea, { target: { value: longText } });

               const analyzeButton = screen.getByText('Analyze My Style');
               fireEvent.click(analyzeButton);

               await waitFor(() => {
                    expect(screen.getByText('Analysis failed')).toBeInTheDocument();
               });

               const retryButton = screen.getByText('Retry');
               fireEvent.click(retryButton);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Created!')).toBeInTheDocument();
               });
          });
     });

     describe('Navigation', () => {
          test('allows navigating back from quick start to choice screen', () => {
               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));
               expect(screen.getByText('Paste Your Writing Sample')).toBeInTheDocument();

               const backButton = screen.getByText('Back');
               fireEvent.click(backButton);

               expect(screen.getByText('Set Up Your Voice Profile')).toBeInTheDocument();
          });

          test('allows navigating back from archetype to choice screen', async () => {
               const mockArchetypes = [
                    {
                         id: 'tech-twitter',
                         name: 'Tech Twitter Influencer',
                         description: 'Casual, direct, emoji-heavy',
                         category: 'casual',
                    },
               ];

               mockedAxios.mockResolvedValueOnce({
                    data: { archetypes: mockArchetypes },
               });

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Choose an Archetype'));

               await waitFor(() => {
                    expect(screen.getByText('Tech Twitter Influencer')).toBeInTheDocument();
               });

               const backButton = screen.getByText('Back');
               fireEvent.click(backButton);

               expect(screen.getByText('Set Up Your Voice Profile')).toBeInTheDocument();
          });
     });

     describe('Completion', () => {
          test('calls onComplete with evolution score when Get Started is clicked', async () => {
               const mockResponse = {
                    data: { evolutionScore: 45 },
               };

               mockedAxios.post.mockResolvedValueOnce(mockResponse);

               render(<StyleProfileSetup onComplete={mockOnComplete} onSkip={mockOnSkip} />);

               fireEvent.click(screen.getByText('Quick Start'));

               const textarea = screen.getByPlaceholderText(/Paste any writing sample here/i);
               const longText = 'a'.repeat(300);
               fireEvent.change(textarea, { target: { value: longText } });

               const analyzeButton = screen.getByText('Analyze My Style');
               fireEvent.click(analyzeButton);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Created!')).toBeInTheDocument();
               });

               const getStartedButton = screen.getByText('Get Started');
               fireEvent.click(getStartedButton);

               expect(mockOnComplete).toHaveBeenCalledWith(45);
          });
     });
});
