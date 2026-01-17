import { render, screen, waitFor } from '@testing-library/react';
import axios, { AxiosResponse } from 'axios';
import ProfileAnalytics from '../ProfileAnalytics';

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

const mockAnalytics = {
     evolutionScore: 65,
     editCount: 12,
     learningIterations: 8,
     lastUpdated: '2024-01-15T10:00:00Z',
     toneDistribution: {
          formality: 7,
          enthusiasm: 5,
          directness: 6,
          humor: 3,
          emotionality: 4,
     },
     commonPhrases: ['Let me explain', 'In my experience', 'Here\'s the thing'],
     bannedPhrases: ['Leverage', 'Synergy', 'Paradigm shift'],
     writingTraits: {
          avgSentenceLength: 15,
          usesQuestionsOften: true,
          usesEmojis: false,
          emojiFrequency: 0,
          usesBulletPoints: true,
          usesShortParagraphs: true,
          usesHooks: false,
     },
     evolutionTimeline: [
          {
               date: '2024-01-01T10:00:00Z',
               event: 'Profile created',
               score: 20,
          },
          {
               date: '2024-01-08T10:00:00Z',
               event: 'First 5 edits completed',
               score: 45,
          },
          {
               date: '2024-01-15T10:00:00Z',
               event: '10+ edits milestone',
               score: 65,
          },
     ],
     beforeAfterExamples: [
          {
               before: 'This is a generic AI-generated sentence that sounds robotic.',
               after: 'Here\'s the thing - this sounds way more natural and human.',
               improvement: 'More conversational tone, added personal phrase',
          },
          {
               before: 'We should leverage this synergy to create value.',
               after: 'Let\'s use this opportunity to build something great.',
               improvement: 'Removed corporate jargon, simplified language',
          },
     ],
};

describe('ProfileAnalytics Component Tests', () => {
     const mockOnClose = jest.fn();

     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('jwt', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     // Validates: Requirements 10.3, 10.4 - Score display
     describe('Score display', () => {
          test('displays evolution score with visual indicator', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               // Check score is displayed (use getAllByText since it appears in multiple places)
               const scoreElements = screen.getAllByText('65%');
               expect(scoreElements.length).toBeGreaterThan(0);

               // Check badge is displayed
               expect(screen.getByText('Voice profile learning')).toBeInTheDocument();
          });

          test('displays correct badge for well-trained profile (score >= 70)', async () => {
               const highScoreAnalytics = { ...mockAnalytics, evolutionScore: 85 };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(highScoreAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('85%')).toBeInTheDocument();
               });

               expect(screen.getByText('Voice profile well-trained')).toBeInTheDocument();
          });

          test('displays correct badge for low-trained profile (score < 30)', async () => {
               const lowScoreAnalytics = { ...mockAnalytics, evolutionScore: 15 };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(lowScoreAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('15%')).toBeInTheDocument();
               });

               expect(screen.getByText('Voice profile needs training')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 10.5 - Statistics display
     describe('Statistics display', () => {
          test('displays learning statistics correctly', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               // Check edit count
               expect(screen.getByText('12')).toBeInTheDocument();
               expect(screen.getByText('Total Edits')).toBeInTheDocument();

               // Check learning iterations
               expect(screen.getByText('8')).toBeInTheDocument();
               expect(screen.getByText('Learning Iterations')).toBeInTheDocument();

               // Check last updated date (use getAllByText since date appears in timeline too)
               const dateElements = screen.getAllByText(/15.*01.*2024|1.*15.*2024/);
               expect(dateElements.length).toBeGreaterThan(0);
               expect(screen.getByText('Last Updated')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 10.6 - Charts rendering
     describe('Charts rendering', () => {
          test('renders tone distribution chart with all metrics', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               // Check tone distribution section
               expect(screen.getByText('Tone Distribution')).toBeInTheDocument();

               // Check all tone metrics are displayed
               expect(screen.getByText('formality')).toBeInTheDocument();
               expect(screen.getByText('7/10')).toBeInTheDocument();

               expect(screen.getByText('enthusiasm')).toBeInTheDocument();
               expect(screen.getByText('5/10')).toBeInTheDocument();

               expect(screen.getByText('directness')).toBeInTheDocument();
               expect(screen.getByText('6/10')).toBeInTheDocument();

               expect(screen.getByText('humor')).toBeInTheDocument();
               expect(screen.getByText('3/10')).toBeInTheDocument();

               expect(screen.getByText('emotionality')).toBeInTheDocument();
               expect(screen.getByText('4/10')).toBeInTheDocument();
          });

          test('displays common phrases list', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText('Common Phrases')).toBeInTheDocument();
               expect(screen.getByText('Let me explain')).toBeInTheDocument();
               expect(screen.getByText('In my experience')).toBeInTheDocument();
               expect(screen.getByText('Here\'s the thing')).toBeInTheDocument();
          });

          test('displays banned phrases list', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText('Banned Phrases')).toBeInTheDocument();
               expect(screen.getByText('Leverage')).toBeInTheDocument();
               expect(screen.getByText('Synergy')).toBeInTheDocument();
               expect(screen.getByText('Paradigm shift')).toBeInTheDocument();
          });

          test('displays writing traits summary', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText('Writing Traits Summary')).toBeInTheDocument();
               expect(screen.getByText('Average Sentence Length')).toBeInTheDocument();
               expect(screen.getByText('15 words')).toBeInTheDocument();
               expect(screen.getByText('Uses Questions Often')).toBeInTheDocument();
               expect(screen.getByText('Uses Emojis')).toBeInTheDocument();
               expect(screen.getByText('Emoji Frequency')).toBeInTheDocument();
               expect(screen.getByText('0/5')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 10.9 - Timeline rendering
     describe('Timeline rendering', () => {
          test('renders evolution timeline with milestones', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText('Evolution Timeline')).toBeInTheDocument();

               // Check milestones are displayed
               expect(screen.getByText('Profile created')).toBeInTheDocument();
               expect(screen.getByText('First 5 edits completed')).toBeInTheDocument();
               expect(screen.getByText('10+ edits milestone')).toBeInTheDocument();

               // Check scores are displayed
               expect(screen.getByText('20%')).toBeInTheDocument();
               expect(screen.getByText('45%')).toBeInTheDocument();
               // 65% is already checked in score display tests
          });

          test('shows message when no timeline milestones exist', async () => {
               const noTimelineAnalytics = { ...mockAnalytics, evolutionTimeline: [] };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(noTimelineAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText(/No milestones yet/)).toBeInTheDocument();
          });
     });

     // Validates: Requirements 10.10 - Before/after examples
     describe('Before/after examples', () => {
          test('displays before/after examples with improvements', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText('Before/After Examples')).toBeInTheDocument();

               // Check first example
               expect(screen.getByText(/This is a generic AI-generated sentence/)).toBeInTheDocument();
               expect(screen.getByText(/Here's the thing - this sounds way more natural/)).toBeInTheDocument();
               expect(screen.getByText('More conversational tone, added personal phrase')).toBeInTheDocument();

               // Check second example
               expect(screen.getByText(/We should leverage this synergy/)).toBeInTheDocument();
               expect(screen.getByText(/Let's use this opportunity/)).toBeInTheDocument();
               expect(screen.getByText('Removed corporate jargon, simplified language')).toBeInTheDocument();
          });

          test('shows message when no examples exist', async () => {
               const noExamplesAnalytics = { ...mockAnalytics, beforeAfterExamples: [] };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(noExamplesAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText(/No examples yet/)).toBeInTheDocument();
          });
     });

     // Validates: Requirements 10.7, 10.8 - Suggestions display
     describe('Suggestions display', () => {
          test('displays suggestions based on low evolution score', async () => {
               const lowScoreAnalytics = { ...mockAnalytics, evolutionScore: 15, editCount: 2 };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(lowScoreAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText('Suggestions')).toBeInTheDocument();
               expect(screen.getByText(/Provide initial writing samples/)).toBeInTheDocument();
               expect(screen.getByText(/Generate and edit more content/)).toBeInTheDocument();
               expect(screen.getByText(/Make at least 5 edits/)).toBeInTheDocument();
          });

          test('displays suggestions based on medium evolution score', async () => {
               const mediumScoreAnalytics = { ...mockAnalytics, evolutionScore: 50, editCount: 8 };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mediumScoreAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText(/Continue editing generated content/)).toBeInTheDocument();
               expect(screen.getByText(/Add more common phrases/)).toBeInTheDocument();
          });

          test('displays suggestions based on high evolution score', async () => {
               const highScoreAnalytics = { ...mockAnalytics, evolutionScore: 85, editCount: 20 };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(highScoreAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText(/Your voice profile is well-trained/)).toBeInTheDocument();
               expect(screen.getByText(/Review and update banned phrases/)).toBeInTheDocument();
          });
     });

     // Additional tests for edge cases
     describe('Edge cases', () => {
          test('shows loading state while fetching analytics', () => {
               (mockedAxios as any).mockImplementation(() => new Promise(() => { })); // Never resolves

               render(<ProfileAnalytics onClose={mockOnClose} />);

               // Check for the spinner element
               const spinner = document.querySelector('.spinner');
               expect(spinner).toBeInTheDocument();
          });

          test('shows message when no analytics available', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(null));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText(/No analytics available/)).toBeInTheDocument();
               });
          });

          test('handles API errors gracefully', async () => {
               (mockedAxios as any).mockRejectedValueOnce({
                    response: {
                         status: 500,
                         data: { message: 'Server error' },
                    },
               });

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    // When error occurs, analytics is null so we see the "no analytics" message
                    expect(screen.getByText(/No analytics available/)).toBeInTheDocument();
               });
          });

          test('shows empty state messages for missing data', async () => {
               const emptyAnalytics = {
                    ...mockAnalytics,
                    commonPhrases: [],
                    bannedPhrases: [],
                    evolutionTimeline: [],
                    beforeAfterExamples: [],
               };
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(emptyAnalytics));

               render(<ProfileAnalytics onClose={mockOnClose} />);

               await waitFor(() => {
                    expect(screen.getByText('Voice Profile Analytics')).toBeInTheDocument();
               });

               expect(screen.getByText(/No common phrases learned yet/)).toBeInTheDocument();
               expect(screen.getByText(/No banned phrases set/)).toBeInTheDocument();
               expect(screen.getByText(/No milestones yet/)).toBeInTheDocument();
               expect(screen.getByText(/No examples yet/)).toBeInTheDocument();
          });
     });
});
