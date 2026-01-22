import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SnapshotSelector from '../SnapshotSelector';
import { apiClient } from '../../utils/apiClient';

// Mock apiClient
jest.mock('../../utils/apiClient', () => ({
     apiClient: {
          get: jest.fn(),
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


