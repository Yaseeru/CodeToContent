import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentEditor from '../ContentEditor';
import { GeneratedContent } from '../ContentGenerator';
import { apiClient } from '../../utils/apiClient';

// Mock apiClient
jest.mock('../../utils/apiClient', () => ({
     apiClient: {
          post: jest.fn(),
     },
     getErrorMessage: jest.fn((err) => err.message || 'An error occurred'),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ContentEditor - Thread Editing', () => {
     const mockOnRegenerate = jest.fn();
     const mockOnContentUpdate = jest.fn();

     const mockThreadContent: GeneratedContent = {
          id: 'test-thread-id',
          platform: 'x',
          contentFormat: 'mini_thread',
          generatedText: 'Tweet 1\n\nTweet 2\n\nTweet 3',
          tweets: [
               { text: 'First tweet 1/3', position: 1, characterCount: 16 },
               { text: 'Second tweet 2/3', position: 2, characterCount: 17 },
               { text: 'Third tweet 3/3', position: 3, characterCount: 16 },
          ],
          version: 1,
     };

     beforeEach(() => {
          jest.clearAllMocks();
          mockApiClient.post.mockResolvedValue({ data: { success: true } });
     });

     it('should allow editing individual tweets', async () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Click edit button on first tweet
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);

          // Should show textarea for editing
          const textarea = screen.getByLabelText('Edit tweet 1');
          expect(textarea).toBeInTheDocument();
          expect(textarea).toHaveValue('First tweet 1/3');

          // Edit the tweet
          fireEvent.change(textarea, { target: { value: 'Edited first tweet 1/3' } });

          // Verify the text was updated
          expect(textarea).toHaveValue('Edited first tweet 1/3');
     });

     it('should update character count in real-time while editing', async () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Click edit button on first tweet
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);

          // Get the textarea
          const textarea = screen.getByLabelText('Edit tweet 1');

          // Edit with longer text
          const newText = 'This is a much longer tweet that has more characters';
          fireEvent.change(textarea, { target: { value: newText } });

          // Check character count updated
          await waitFor(() => {
               expect(screen.getByText(`${newText.length}/280`)).toBeInTheDocument();
          });
     });

     it('should show warning when tweet exceeds 280 characters', async () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Click edit button on first tweet
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);

          // Get the textarea
          const textarea = screen.getByLabelText('Edit tweet 1');

          // Edit with text exceeding 280 characters
          const longText = 'A'.repeat(290);
          fireEvent.change(textarea, { target: { value: longText } });

          // Check for warning
          await waitFor(() => {
               expect(screen.getByText('Tweet exceeds 280 character limit')).toBeInTheDocument();
               expect(screen.getByText('290/280')).toHaveClass('text-red-500');
          });
     });

     it('should trigger API call with editedTweets when save button is clicked', async () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Edit first tweet
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);

          const textarea = screen.getByLabelText('Edit tweet 1');
          fireEvent.change(textarea, { target: { value: 'Edited first tweet' } });

          // Click save button
          const saveButton = screen.getByRole('button', { name: /save your edits/i });
          fireEvent.click(saveButton);

          // Verify API was called with correct parameters
          await waitFor(() => {
               expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/api/content/test-thread-id/save-edits',
                    {
                         editedTweets: [
                              {
                                   position: 1,
                                   text: 'Edited first tweet',
                              },
                         ],
                    }
               );
          });
     });

     it('should handle editing multiple tweets', async () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Edit first tweet
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);
          const textarea1 = screen.getByLabelText('Edit tweet 1');
          fireEvent.change(textarea1, { target: { value: 'Edited tweet 1' } });

          // Click done on first tweet
          fireEvent.click(screen.getByText('Done'));

          // Edit second tweet
          fireEvent.click(editButtons[1]);
          const textarea2 = screen.getByLabelText('Edit tweet 2');
          fireEvent.change(textarea2, { target: { value: 'Edited tweet 2' } });

          // Click save button
          const saveButton = screen.getByRole('button', { name: /save your edits/i });
          fireEvent.click(saveButton);

          // Verify API was called with both edits
          await waitFor(() => {
               expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/api/content/test-thread-id/save-edits',
                    {
                         editedTweets: expect.arrayContaining([
                              { position: 1, text: 'Edited tweet 1' },
                              { position: 2, text: 'Edited tweet 2' },
                         ]),
                    }
               );
          });
     });

     it('should show success message after saving', async () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Edit a tweet
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);
          const textarea = screen.getByLabelText('Edit tweet 1');
          fireEvent.change(textarea, { target: { value: 'Edited tweet' } });

          // Save
          const saveButton = screen.getByRole('button', { name: /save your edits/i });
          fireEvent.click(saveButton);

          // Check for success message
          await waitFor(() => {
               expect(screen.getByText('Edits saved successfully!')).toBeInTheDocument();
          });

          // Check for learning indicator
          expect(screen.getByText('Learning from your edits...')).toBeInTheDocument();
     });

     it('should toggle edit mode when clicking edit/done button', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Click edit button
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);

          // Should show Done button and textarea
          expect(screen.getByText('Done')).toBeInTheDocument();
          expect(screen.getByLabelText('Edit tweet 1')).toBeInTheDocument();

          // Click done button
          fireEvent.click(screen.getByText('Done'));

          // Should show Edit button again and hide textarea
          expect(screen.queryByLabelText('Edit tweet 1')).not.toBeInTheDocument();
     });

     it('should not show save button when no edits are made', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Save button should not be visible initially
          expect(screen.queryByRole('button', { name: /save your edits/i })).not.toBeInTheDocument();
     });

     it('should show save button after making edits', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Edit a tweet
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);
          const textarea = screen.getByLabelText('Edit tweet 1');
          fireEvent.change(textarea, { target: { value: 'Edited tweet' } });

          // Save button should now be visible
          expect(screen.getByRole('button', { name: /save your edits/i })).toBeInTheDocument();
     });

     it('should handle API errors gracefully', async () => {
          mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Edit and save
          const editButtons = screen.getAllByText('Edit');
          fireEvent.click(editButtons[0]);
          const textarea = screen.getByLabelText('Edit tweet 1');
          fireEvent.change(textarea, { target: { value: 'Edited tweet' } });

          const saveButton = screen.getByRole('button', { name: /save your edits/i });
          fireEvent.click(saveButton);

          // Should show error notification (wait for async operation)
          await waitFor(() => {
               // The error notification component should be rendered
               const errorElements = screen.queryAllByText(/error/i);
               expect(errorElements.length).toBeGreaterThan(0);
          }, { timeout: 3000 });
     });
});
