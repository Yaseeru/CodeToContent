import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios, { AxiosResponse } from 'axios';
import StyleProfileEditor from '../StyleProfileEditor';

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

const mockStyleProfile = {
     voiceType: 'professional' as const,
     tone: {
          formality: 7,
          enthusiasm: 5,
          directness: 6,
          humor: 3,
          emotionality: 4,
     },
     writingTraits: {
          avgSentenceLength: 15,
          usesQuestionsOften: true,
          usesEmojis: false,
          emojiFrequency: 0,
          usesBulletPoints: true,
          usesShortParagraphs: true,
          usesHooks: false,
     },
     structurePreferences: {
          introStyle: 'problem' as const,
          bodyStyle: 'analysis' as const,
          endingStyle: 'summary' as const,
     },
     vocabularyLevel: 'medium' as const,
     commonPhrases: ['Let me explain', 'In my experience'],
     bannedPhrases: ['Leverage', 'Synergy'],
     samplePosts: ['Sample post 1', 'Sample post 2'],
     learningIterations: 5,
     lastUpdated: '2024-01-15T10:00:00Z',
     profileSource: 'manual',
};

const mockProfileData = {
     styleProfile: mockStyleProfile,
     voiceStrength: 80,
     evolutionScore: 65,
};

describe('StyleProfileEditor Component Tests', () => {
     const mockOnClose = jest.fn();
     const mockOnSave = jest.fn();

     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('jwt', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     // Validates: Requirements 4.1 - Profile display
     describe('Profile display', () => {
          test('loads and displays profile data', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               // Check evolution score and stats
               expect(screen.getByText(/65%/)).toBeInTheDocument();
               expect(screen.getByText(/Learning Iterations: 5/)).toBeInTheDocument();

               // Check voice strength
               expect(screen.getByText(/Voice Strength: 80%/)).toBeInTheDocument();

               // Check tone metrics are displayed (text is split across elements)
               expect(screen.getByText(/formality/i)).toBeInTheDocument();
               expect(screen.getByText(/enthusiasm/i)).toBeInTheDocument();
               expect(screen.getByText(/directness/i)).toBeInTheDocument();
               expect(screen.getByText(/humor/i)).toBeInTheDocument();
               expect(screen.getByText(/emotionality/i)).toBeInTheDocument();
          });

          test('shows message when no profile exists', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse({
                    styleProfile: null,
                    voiceStrength: 80,
                    evolutionScore: 0,
               }));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText(/No voice profile found/)).toBeInTheDocument();
               });
          });

          test('displays common phrases', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Let me explain')).toBeInTheDocument();
                    expect(screen.getByText('In my experience')).toBeInTheDocument();
               });
          });

          test('displays banned phrases', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Leverage')).toBeInTheDocument();
                    expect(screen.getByText('Synergy')).toBeInTheDocument();
               });
          });
     });

     // Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7 - Field editing
     describe('Field editing', () => {
          test('allows editing tone metrics with sliders', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText(/formality/i)).toBeInTheDocument();
               });

               const formalitySlider = screen.getAllByRole('slider')[1]; // First is voice strength
               fireEvent.change(formalitySlider, { target: { value: '9' } });

               // Check that the slider value changed
               expect(formalitySlider).toHaveValue('9');
          });

          test('allows editing voice strength slider', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText(/Voice Strength: 80%/)).toBeInTheDocument();
               });

               const voiceStrengthSlider = screen.getAllByRole('slider')[0];
               fireEvent.change(voiceStrengthSlider, { target: { value: '50' } });

               await waitFor(() => {
                    expect(screen.getByText(/Voice Strength: 50%/)).toBeInTheDocument();
               });
          });

          test('allows editing writing traits checkboxes', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               const usesEmojisCheckbox = screen.getByLabelText('Uses Emojis');
               expect(usesEmojisCheckbox).not.toBeChecked();

               fireEvent.click(usesEmojisCheckbox);

               expect(usesEmojisCheckbox).toBeChecked();
          });

          test('allows editing structure preferences with dropdowns', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               // Find all select elements and get the first one (intro style)
               const selects = screen.getAllByRole('combobox');
               const introStyleSelect = selects[0];
               fireEvent.change(introStyleSelect, { target: { value: 'hook' } });

               expect(introStyleSelect).toHaveValue('hook');
          });

          test('allows adding common phrases', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               const phraseInput = screen.getByPlaceholderText(/Add a phrase you frequently use/);
               fireEvent.change(phraseInput, { target: { value: 'New phrase' } });

               const addButton = screen.getAllByText('Add')[0];
               fireEvent.click(addButton);

               expect(screen.getByText('New phrase')).toBeInTheDocument();
               expect(phraseInput).toHaveValue('');
          });
     });

     // Validates: Requirements 4.4 - Validation
     describe('Validation', () => {
          test('validates tone metrics are within 1-10 range', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               const formalitySlider = screen.getAllByRole('slider')[1];
               expect(formalitySlider).toHaveAttribute('min', '1');
               expect(formalitySlider).toHaveAttribute('max', '10');
          });

          test('validates voice strength is within 0-100 range', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               const voiceStrengthSlider = screen.getAllByRole('slider')[0];
               expect(voiceStrengthSlider).toHaveAttribute('min', '0');
               expect(voiceStrengthSlider).toHaveAttribute('max', '100');
          });
     });

     // Validates: Requirements 4.1, 4.2, 4.3 - Save functionality
     describe('Save functionality', () => {
          test('calls API with updated profile when save button is clicked', async () => {
               (mockedAxios as any)
                    .mockResolvedValueOnce(createAxiosResponse(mockProfileData))
                    .mockResolvedValueOnce(createAxiosResponse({}));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               // Make a change
               const voiceStrengthSlider = screen.getAllByRole('slider')[0];
               fireEvent.change(voiceStrengthSlider, { target: { value: '90' } });

               const saveButton = screen.getByText('Save Changes');
               fireEvent.click(saveButton);

               await waitFor(() => {
                    expect(mockedAxios).toHaveBeenCalledWith(
                         expect.objectContaining({
                              method: 'PUT',
                              url: '/api/profile/style',
                              data: expect.objectContaining({
                                   voiceStrength: 90,
                              }),
                         })
                    );
               });
          });

          test('calls onSave callback after successful save', async () => {
               (mockedAxios as any)
                    .mockResolvedValueOnce(createAxiosResponse(mockProfileData))
                    .mockResolvedValueOnce(createAxiosResponse({}));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               const saveButton = screen.getByText('Save Changes');
               fireEvent.click(saveButton);

               await waitFor(() => {
                    expect(mockOnSave).toHaveBeenCalledTimes(1);
               });
          });
     });

     // Validates: Requirements 4.1, 4.2, 4.3 - Reset functionality
     describe('Reset functionality', () => {
          test('shows confirmation modal when reset button is clicked', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               const resetButton = screen.getByText('Reset Profile');
               fireEvent.click(resetButton);

               expect(screen.getByText('Reset Voice Profile?')).toBeInTheDocument();
               expect(screen.getByText(/This will delete your current voice profile/)).toBeInTheDocument();
          });

          test('allows canceling reset', async () => {
               (mockedAxios as any).mockResolvedValueOnce(createAxiosResponse(mockProfileData));

               render(<StyleProfileEditor onClose={mockOnClose} onSave={mockOnSave} />);

               await waitFor(() => {
                    expect(screen.getByText('Edit Voice Profile')).toBeInTheDocument();
               });

               const resetButton = screen.getByText('Reset Profile');
               fireEvent.click(resetButton);

               const cancelButton = screen.getByText('Cancel');
               fireEvent.click(cancelButton);

               expect(screen.queryByText('Reset Voice Profile?')).not.toBeInTheDocument();
          });
     });
});
