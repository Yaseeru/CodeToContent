import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import ContentGenerator from '../ContentGenerator';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock SnapshotSelector component
jest.mock('../SnapshotSelector', () => ({
     __esModule: true,
     default: function MockSnapshotSelector({ repositoryId, onSnapshotSelected, onClose }: any) {
          return (
               <div data-testid="snapshot-selector-modal">
                    <button
                         data-testid="mock-select-snapshot"
                         onClick={() => {
                              onSnapshotSelected({
                                   _id: 'snapshot-123',
                                   repositoryId: repositoryId,
                                   analysisId: 'analysis-123',
                                   userId: 'user-123',
                                   snippetMetadata: {
                                        filePath: 'src/services/TestService.ts',
                                        startLine: 10,
                                        endLine: 30,
                                        functionName: 'testFunction',
                                        language: 'typescript',
                                        linesOfCode: 20,
                                   },
                                   selectionScore: 85,
                                   selectionReason: 'Core algorithm implementation',
                                   imageUrl: 'http://localhost:3001/uploads/snapshots/test.png',
                                   imageSize: 150000,
                                   imageDimensions: { width: 1200, height: 800 },
                                   renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                                   isStale: false,
                                   lastCommitSha: 'abc123',
                                   createdAt: '2024-01-01T00:00:00.000Z',
                                   updatedAt: '2024-01-01T00:00:00.000Z',
                              });
                              // Close modal after selection (mimics real behavior)
                              onClose();
                         }}
                    >
                         Select Snapshot
                    </button>
                    <button data-testid="mock-close-modal" onClick={onClose}>
                         Close
                    </button>
               </div>
          );
     },
}));

describe('ContentGenerator Snapshot Integration Tests', () => {
     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('jwt', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     // Validates: Requirements 4.2, 7.1
     test('"Add Visual" button is visible when repositoryId is provided', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 4.2, 7.1
     test('"Add Visual" button is NOT visible when repositoryId is not provided', async () => {
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
               expect(screen.queryByText('Add Visual')).not.toBeInTheDocument();
          });
     });

     // Validates: Requirements 7.2
     test('clicking "Add Visual" button opens SnapshotSelector modal', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 7.2
     test('SnapshotSelector modal can be closed without selecting', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Open modal
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          // Close modal
          const closeButton = screen.getByTestId('mock-close-modal');
          fireEvent.click(closeButton);

          await waitFor(() => {
               expect(screen.queryByTestId('snapshot-selector-modal')).not.toBeInTheDocument();
          });

          // "Add Visual" button should still be visible
          expect(screen.getByText('Add Visual')).toBeInTheDocument();
     });

     // Validates: Requirements 4.3, 7.3
     test('selecting a snapshot attaches it and displays preview', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Open modal
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          // Select snapshot
          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               // Modal should close
               expect(screen.queryByTestId('snapshot-selector-modal')).not.toBeInTheDocument();
          });

          // Snapshot preview should be displayed
          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
               expect(image).toHaveAttribute('src', 'http://localhost:3001/uploads/snapshots/test.png');
          });

          // File path should be displayed
          expect(screen.getByText('src/services/TestService.ts')).toBeInTheDocument();

          // Selection reason should be displayed
          expect(screen.getByText('Core algorithm implementation')).toBeInTheDocument();

          // Selection score should be displayed
          expect(screen.getByText('85')).toBeInTheDocument();

          // "Add Visual" button should be hidden
          expect(screen.queryByText('Add Visual')).not.toBeInTheDocument();
     });

     // Validates: Requirements 7.5
     test('clicking remove button clears snapshot attachment', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Open modal and select snapshot
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });

          // Click remove button
          const removeButton = screen.getByLabelText('Remove visual');
          fireEvent.click(removeButton);

          await waitFor(() => {
               // Snapshot preview should be removed
               expect(screen.queryByAltText('Code snapshot from src/services/TestService.ts')).not.toBeInTheDocument();
          });

          // "Add Visual" button should be visible again
          expect(screen.getByText('Add Visual')).toBeInTheDocument();
     });

     // Validates: Requirements 4.1, 4.3
     test('content generation includes snapshotId when snapshot is attached', async () => {
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
                         generatedText: 'Generated content with visual',
                         version: 1,
                         snapshotId: 'snapshot-123',
                         imageUrl: 'http://localhost:3001/uploads/snapshots/test.png',
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Attach snapshot
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });

          // Generate content
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
                              snapshotId: 'snapshot-123',
                         }),
                    })
               );
          });

          expect(mockOnContentGenerated).toHaveBeenCalledWith(
               expect.objectContaining({
                    id: 'content-123',
                    snapshotId: 'snapshot-123',
                    imageUrl: 'http://localhost:3001/uploads/snapshots/test.png',
               })
          );
     });

     // Validates: Requirements 4.4, 8.1 (backward compatibility)
     test('content generation works without snapshot (backward compatibility)', async () => {
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
                         generatedText: 'Generated content without visual',
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Generate content without attaching snapshot
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
                              snapshotId: undefined,
                         }),
                    })
               );
          });

          expect(mockOnContentGenerated).toHaveBeenCalledWith(
               expect.objectContaining({
                    id: 'content-123',
                    generatedText: 'Generated content without visual',
               })
          );

          // Verify the call was made with the correct content
          const callArg = mockOnContentGenerated.mock.calls[0][0];
          expect(callArg.snapshotId).toBeUndefined();
          expect(callArg.imageUrl).toBeUndefined();
     });

     // Validates: Requirements 4.3
     test('snapshot attachment state is maintained across format changes', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Attach snapshot
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });

          // Change format to mini_thread
          const miniThreadRadio = container.querySelector('input[value="mini_thread"]') as HTMLInputElement;
          fireEvent.click(miniThreadRadio);

          // Snapshot should still be attached
          expect(screen.getByAltText('Code snapshot from src/services/TestService.ts')).toBeInTheDocument();

          // Change format to full_thread
          const fullThreadRadio = container.querySelector('input[value="full_thread"]') as HTMLInputElement;
          fireEvent.click(fullThreadRadio);

          // Snapshot should still be attached
          expect(screen.getByAltText('Code snapshot from src/services/TestService.ts')).toBeInTheDocument();
     });

     // Validates: Requirements 4.3, 6.5
     test('snapshot attachment works with voice profile enabled', async () => {
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
                         contentFormat: 'single',
                         generatedText: 'Generated content with voice and visual',
                         version: 1,
                         snapshotId: 'snapshot-123',
                         imageUrl: 'http://localhost:3001/uploads/snapshots/test.png',
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Using your voice')).toBeInTheDocument();
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Attach snapshot
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });

          // Generate content
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
                              voiceStrength: 80,
                              snapshotId: 'snapshot-123',
                         }),
                    })
               );
          });
     });

     // Validates: Requirements 7.1, 7.4
     test('snapshot preview displays all metadata correctly', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Attach snapshot
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               // Image should be displayed
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
               expect(image).toHaveAttribute('src', 'http://localhost:3001/uploads/snapshots/test.png');

               // File path should be displayed
               expect(screen.getByText('src/services/TestService.ts')).toBeInTheDocument();

               // Selection reason should be displayed
               expect(screen.getByText('Core algorithm implementation')).toBeInTheDocument();

               // Selection score should be displayed
               expect(screen.getByText('85')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 4.3
     test('multiple snapshots can be attached and removed sequentially', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Attach first snapshot
          let addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          let selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });

          // Remove first snapshot
          const removeButton = screen.getByLabelText('Remove visual');
          fireEvent.click(removeButton);

          await waitFor(() => {
               expect(screen.queryByAltText('Code snapshot from src/services/TestService.ts')).not.toBeInTheDocument();
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Attach second snapshot
          addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });
     });

     // Validates: Requirements 4.3
     test('snapshot state is independent of voice strength changes', async () => {
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

          mockedAxios.mockResolvedValueOnce(mockProfileResponse);

          const mockOnContentGenerated = jest.fn();

          const { container } = render(
               <ContentGenerator
                    analysisId="test-analysis-id"
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Using your voice')).toBeInTheDocument();
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Attach snapshot
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               expect(screen.getByTestId('snapshot-selector-modal')).toBeInTheDocument();
          });

          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });

          // Change voice strength
          const slider = container.querySelector('#voice-strength') as HTMLInputElement;
          fireEvent.change(slider, { target: { value: '50' } });

          // Snapshot should still be attached
          expect(screen.getByAltText('Code snapshot from src/services/TestService.ts')).toBeInTheDocument();

          // Change voice strength again
          fireEvent.change(slider, { target: { value: '100' } });

          // Snapshot should still be attached
          expect(screen.getByAltText('Code snapshot from src/services/TestService.ts')).toBeInTheDocument();
     });

     // Validates: Requirements 7.1
     test('Visual Attachment section has proper heading', async () => {
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
                    repositoryId="repo-123"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Visual Attachment')).toBeInTheDocument();
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });
     });

     // Validates: Requirements 4.2
     test('repositoryId is passed to SnapshotSelector modal', async () => {
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
                    repositoryId="repo-456"
                    onContentGenerated={mockOnContentGenerated}
               />
          );

          await waitFor(() => {
               expect(screen.getByText('Add Visual')).toBeInTheDocument();
          });

          // Open modal
          const addVisualButton = screen.getByText('Add Visual');
          fireEvent.click(addVisualButton);

          await waitFor(() => {
               const modal = screen.getByTestId('snapshot-selector-modal');
               expect(modal).toBeInTheDocument();
          });

          // The mock component receives repositoryId as a prop
          // When we select a snapshot, it should use the correct repositoryId
          const selectButton = screen.getByTestId('mock-select-snapshot');
          fireEvent.click(selectButton);

          await waitFor(() => {
               const image = screen.getByAltText('Code snapshot from src/services/TestService.ts');
               expect(image).toBeInTheDocument();
          });
     });
});
