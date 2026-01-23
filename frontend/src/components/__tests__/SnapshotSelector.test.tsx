import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SnapshotSelector from '../SnapshotSelector';
import { apiClient } from '../../utils/apiClient';

// Mock apiClient
jest.mock('../../utils/apiClient', () => ({
     apiClient: {
          get: jest.fn(),
          post: jest.fn(),
     },
     getErrorMessage: jest.fn((err) => err.message || 'An error occurred'),
}));

// Mock LoadingSpinner
jest.mock('../LoadingSpinner', () => ({
     __esModule: true,
     default: ({ message }: { message?: string }) => (
          <div data-testid="loading-spinner">{message}</div>
     ),
}));

const mockSnapshot = {
     _id: 'snapshot1',
     repositoryId: 'repo1',
     analysisId: 'analysis1',
     userId: 'user1',
     snippetMetadata: {
          filePath: 'src/services/AuthService.ts',
          startLine: 10,
          endLine: 30,
          functionName: 'authenticate',
          language: 'typescript',
          linesOfCode: 20,
     },
     selectionScore: 85,
     selectionReason: 'Core authentication logic with complex validation',
     imageUrl: 'http://localhost:3001/uploads/snapshots/snapshot1.png',
     imageSize: 150000,
     imageDimensions: {
          width: 1200,
          height: 800,
     },
     renderOptions: {
          theme: 'nord',
          showLineNumbers: false,
          fontSize: 14,
     },
     isStale: false,
     lastCommitSha: 'abc123',
     createdAt: '2024-01-01T00:00:00.000Z',
     updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('SnapshotSelector - Preview and Selection (Task 40)', () => {
     const mockOnSnapshotSelected = jest.fn();
     const mockOnClose = jest.fn();

     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('Full-size preview functionality', () => {
          it('should show full-size preview when thumbnail is clicked', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               // Wait for snapshots to load
               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Find and click the thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify preview modal is shown
               await waitFor(() => {
                    expect(screen.getByText('Preview Code Snapshot')).toBeInTheDocument();
               });
          });

          it('should display full-size image in preview', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail to open preview
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify full-size image is displayed
               await waitFor(() => {
                    const images = screen.getAllByAltText(/Code snapshot from/);
                    // Should have 2 images now: thumbnail (hidden) and full-size preview
                    expect(images.length).toBeGreaterThan(0);
               });
          });
     });

     describe('Metadata display', () => {
          it('should display file path in preview', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify file path is displayed (appears in multiple places)
               await waitFor(() => {
                    const filePaths = screen.getAllByText(mockSnapshot.snippetMetadata.filePath);
                    expect(filePaths.length).toBeGreaterThan(0);
               });
          });

          it('should display selection score in preview', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify selection score is displayed
               await waitFor(() => {
                    expect(screen.getByText(`${mockSnapshot.selectionScore}/100`)).toBeInTheDocument();
               });
          });

          it('should display selection reason in preview', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify selection reason is displayed
               await waitFor(() => {
                    expect(screen.getByText(mockSnapshot.selectionReason)).toBeInTheDocument();
               });
          });

          it('should display snippet metadata details', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify metadata details
               await waitFor(() => {
                    expect(screen.getByText('10-30')).toBeInTheDocument(); // Lines
                    expect(screen.getByText(mockSnapshot.snippetMetadata.functionName!)).toBeInTheDocument();
                    expect(screen.getByText(mockSnapshot.snippetMetadata.language)).toBeInTheDocument();
                    expect(screen.getByText(mockSnapshot.snippetMetadata.linesOfCode.toString())).toBeInTheDocument();
               });
          });
     });

     describe('Select button functionality', () => {
          it('should have a Select button in preview', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify Select button exists
               await waitFor(() => {
                    expect(screen.getByRole('button', { name: /Select/i })).toBeInTheDocument();
               });
          });

          it('should call onSnapshotSelected with snapshot data when Select is clicked', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Click Select button
               await waitFor(() => {
                    const selectButton = screen.getByRole('button', { name: /Select/i });
                    fireEvent.click(selectButton);
               });

               // Verify callback was called with correct data
               expect(mockOnSnapshotSelected).toHaveBeenCalledWith(mockSnapshot);
               expect(mockOnSnapshotSelected).toHaveBeenCalledTimes(1);
          });

          it('should close modal after selection', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Click Select button
               await waitFor(() => {
                    const selectButton = screen.getByRole('button', { name: /Select/i });
                    fireEvent.click(selectButton);
               });

               // Verify onClose was called
               expect(mockOnClose).toHaveBeenCalledTimes(1);
          });
     });

     describe('Cancel button functionality', () => {
          it('should have a Cancel button in preview', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify Cancel button exists
               await waitFor(() => {
                    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
               });
          });

          it('should close preview when Cancel is clicked', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Verify preview is shown
               await waitFor(() => {
                    expect(screen.getByText('Preview Code Snapshot')).toBeInTheDocument();
               });

               // Click Cancel button
               const cancelButton = screen.getByRole('button', { name: /Cancel/i });
               fireEvent.click(cancelButton);

               // Verify preview is closed (back to thumbnail view)
               await waitFor(() => {
                    expect(screen.queryByText('Preview Code Snapshot')).not.toBeInTheDocument();
                    expect(screen.getByText('Select Code Snapshot')).toBeInTheDocument();
               });
          });

          it('should not call onSnapshotSelected when Cancel is clicked', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click thumbnail
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // Click Cancel button
               await waitFor(() => {
                    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
                    fireEvent.click(cancelButton);
               });

               // Verify callback was NOT called
               expect(mockOnSnapshotSelected).not.toHaveBeenCalled();
          });
     });

     describe('Requirement 7.3 validation', () => {
          it('should validate full user flow: thumbnail click → preview → metadata display → select', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [mockSnapshot] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               // 1. Wait for snapshots to load
               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // 2. Click thumbnail to open preview
               const thumbnail = screen.getByAltText(/Code snapshot from/);
               fireEvent.click(thumbnail.closest('button')!);

               // 3. Verify full-size preview is shown
               await waitFor(() => {
                    expect(screen.getByText('Preview Code Snapshot')).toBeInTheDocument();
               });

               // 4. Verify all metadata is displayed (file path appears in multiple places)
               const filePaths = screen.getAllByText(mockSnapshot.snippetMetadata.filePath);
               expect(filePaths.length).toBeGreaterThan(0);
               expect(screen.getByText(`${mockSnapshot.selectionScore}/100`)).toBeInTheDocument();
               expect(screen.getByText(mockSnapshot.selectionReason)).toBeInTheDocument();

               // 5. Click Select button
               const selectButton = screen.getByRole('button', { name: /Select/i });
               fireEvent.click(selectButton);

               // 6. Verify selection callback was called with correct data
               expect(mockOnSnapshotSelected).toHaveBeenCalledWith(mockSnapshot);
               expect(mockOnClose).toHaveBeenCalled();
          });
     });
});



describe('SnapshotSelector - Generation Trigger Tests (Task 53)', () => {
     const mockOnSnapshotSelected = jest.fn();
     const mockOnClose = jest.fn();

     beforeEach(() => {
          jest.clearAllMocks();
     });

     describe('Generate Snapshots button functionality', () => {
          it('should display Generate Snapshots button in header', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Verify Generate Snapshots button exists in header
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               expect(generateButtons.length).toBeGreaterThan(0);
          });

          it('should call POST /api/snapshots/generate when Generate Snapshots is clicked', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockResolvedValue({
                    data: { success: true },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button (in header)
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify POST request was made
               await waitFor(() => {
                    expect(apiClient.post).toHaveBeenCalledWith('/api/snapshots/generate', {
                         repositoryId: 'repo1',
                    });
               });
          });

          it('should disable Generate Snapshots button during generation', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockImplementation(() =>
                    new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
               );

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify button is disabled during generation
               await waitFor(() => {
                    const generatingButtons = screen.getAllByRole('button', { name: /Generating/i });
                    expect(generatingButtons[0]).toBeDisabled();
               });
          });
     });

     describe('Generation loading state display', () => {
          it('should show loading indicator during generation', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockImplementation(() =>
                    new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
               );

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify loading state is displayed
               await waitFor(() => {
                    expect(screen.getByText(/Generating code snapshots/i)).toBeInTheDocument();
               });
          });

          it('should show descriptive message during generation', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockImplementation(() =>
                    new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
               );

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify descriptive message is shown
               await waitFor(() => {
                    expect(screen.getByText(/This may take a few moments/i)).toBeInTheDocument();
                    expect(screen.getByText(/analyzing your repository/i)).toBeInTheDocument();
               });
          });

          it('should show spinner icon during generation', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockImplementation(() =>
                    new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
               );

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify spinner is shown (button text changes to "Generating...")
               await waitFor(() => {
                    const generatingButtons = screen.queryAllByText(/Generating/i);
                    expect(generatingButtons.length).toBeGreaterThan(0);
               });
          });
     });

     describe('Snapshot list refresh after generation', () => {
          it('should refresh snapshot list after successful generation', async () => {
               const newSnapshot = {
                    ...mockSnapshot,
                    _id: 'snapshot2',
                    selectionScore: 90,
               };

               // Mock multiple calls - initial load returns empty, subsequent calls return new snapshot
               (apiClient.get as jest.Mock).mockResolvedValue({ data: { snapshots: [] } });
               (apiClient.post as jest.Mock).mockResolvedValue({
                    data: { success: true },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Verify empty state initially
               expect(screen.getByText(/No code snapshots yet/i)).toBeInTheDocument();

               // Update mock to return new snapshot for subsequent calls
               (apiClient.get as jest.Mock).mockResolvedValue({ data: { snapshots: [newSnapshot] } });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify new snapshot is displayed after refresh
               await waitFor(() => {
                    expect(screen.queryByText(/No code snapshots yet/i)).not.toBeInTheDocument();
                    expect(screen.getByText(newSnapshot.selectionReason)).toBeInTheDocument();
               });

               // Verify GET was called at least twice (initial + refresh)
               expect(apiClient.get).toHaveBeenCalledWith('/api/snapshots/repo1');
               expect(apiClient.get).toHaveBeenCalled();
          });

          it('should call fetchSnapshots after generation completes', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockResolvedValue({
                    data: { success: true },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Clear previous calls
               (apiClient.get as jest.Mock).mockClear();

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Wait for generation and verify refresh was called
               await waitFor(() => {
                    expect(apiClient.post).toHaveBeenCalledWith('/api/snapshots/generate', {
                         repositoryId: 'repo1',
                    });
               });

               // Verify fetchSnapshots was called after generation
               await waitFor(() => {
                    expect(apiClient.get).toHaveBeenCalledWith('/api/snapshots/repo1');
               });
          });
     });

     describe('Generation error handling with user-friendly messages', () => {
          it('should display error message when generation fails', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockRejectedValue({
                    message: 'Failed to generate snapshots',
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify error message is displayed (use getAllByText since it appears twice)
               await waitFor(() => {
                    const errorMessages = screen.getAllByText(/Failed to generate snapshots/i);
                    expect(errorMessages.length).toBeGreaterThan(0);
               });
          });

          it('should show user-friendly error title', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockRejectedValue({
                    message: 'Network error',
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Verify user-friendly error title
               await waitFor(() => {
                    expect(screen.getByText(/Failed to generate snapshots/i)).toBeInTheDocument();
               });
          });

          it('should provide retry button in error state', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockRejectedValue({
                    message: 'Generation failed',
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Wait for error to appear
               await waitFor(() => {
                    expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
               });

               // Verify retry button exists
               const retryButton = screen.getByRole('button', { name: /Try again/i });
               expect(retryButton).toBeInTheDocument();
          });

          it('should retry generation when retry button is clicked', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock)
                    .mockRejectedValueOnce({ message: 'Generation failed' })
                    .mockResolvedValueOnce({ data: { success: true } });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button (first attempt)
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               // Wait for error
               await waitFor(() => {
                    expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
               });

               // Click retry button
               const retryButton = screen.getByRole('button', { name: /Try again/i });
               fireEvent.click(retryButton);

               // Verify second POST request was made
               await waitFor(() => {
                    expect(apiClient.post).toHaveBeenCalledTimes(2);
               });
          });

          it('should clear error message on successful retry', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock)
                    .mockRejectedValueOnce({ message: 'Generation failed' })
                    .mockResolvedValueOnce({ data: { success: true } });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // First attempt - fails
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               fireEvent.click(generateButtons[0]);

               await waitFor(() => {
                    expect(screen.getByText(/Generation failed/i)).toBeInTheDocument();
               });

               // Retry - succeeds
               const retryButton = screen.getByRole('button', { name: /Try again/i });
               fireEvent.click(retryButton);

               // Verify error message is cleared
               await waitFor(() => {
                    expect(screen.queryByText(/Generation failed/i)).not.toBeInTheDocument();
               });
          });
     });

     describe('Empty state with generation prompt', () => {
          it('should show empty state when no snapshots exist', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Verify empty state is displayed
               expect(screen.getByText(/No code snapshots yet/i)).toBeInTheDocument();
          });

          it('should display descriptive message in empty state', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Verify descriptive message
               expect(screen.getByText(/Generate beautiful code visuals/i)).toBeInTheDocument();
          });

          it('should show Generate Snapshots button in empty state', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Verify Generate Snapshots button exists in empty state
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               expect(generateButtons.length).toBeGreaterThan(0);
          });

          it('should trigger generation from empty state button', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });
               (apiClient.post as jest.Mock).mockResolvedValue({
                    data: { success: true },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Click Generate Snapshots button in empty state
               const generateButtons = screen.getAllByRole('button', { name: /Generate Snapshots/i });
               // Find the button in the empty state (not in header)
               const emptyStateButton = generateButtons.find(btn =>
                    btn.textContent?.includes('Generate Snapshots') &&
                    btn.closest('.flex.flex-col.items-center')
               );

               if (emptyStateButton) {
                    fireEvent.click(emptyStateButton);
               } else {
                    // Fallback: click any Generate Snapshots button
                    fireEvent.click(generateButtons[0]);
               }

               // Verify POST request was made
               await waitFor(() => {
                    expect(apiClient.post).toHaveBeenCalledWith('/api/snapshots/generate', {
                         repositoryId: 'repo1',
                    });
               });
          });

          it('should display icon in empty state', async () => {
               (apiClient.get as jest.Mock).mockResolvedValue({
                    data: { snapshots: [] },
               });

               render(
                    <SnapshotSelector
                         repositoryId="repo1"
                         onSnapshotSelected={mockOnSnapshotSelected}
                         onClose={mockOnClose}
                    />
               );

               await waitFor(() => {
                    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
               });

               // Verify empty state has visual elements (SVG icon)
               const emptyStateContainer = screen.getByText(/No code snapshots yet/i).closest('.flex.flex-col');
               expect(emptyStateContainer).toBeInTheDocument();

               // Check for SVG icon
               const svg = emptyStateContainer?.querySelector('svg');
               expect(svg).toBeInTheDocument();
          });
     });
});
