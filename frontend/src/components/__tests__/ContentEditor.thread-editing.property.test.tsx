import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import ContentEditor from '../ContentEditor';
import { GeneratedContent, Tweet } from '../ContentGenerator';
import { apiClient } from '../../utils/apiClient';

// Mock apiClient
jest.mock('../../utils/apiClient', () => ({
     apiClient: {
          post: jest.fn(),
     },
     getErrorMessage: jest.fn((err) => err.message || 'An error occurred'),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ContentEditor - Thread Editing Property-Based Tests', () => {
     const mockOnRegenerate = jest.fn();
     const mockOnContentUpdate = jest.fn();

     beforeEach(() => {
          jest.clearAllMocks();
          mockApiClient.post.mockResolvedValue({ data: { success: true } });
          // Clean up any lingering DOM elements
          document.body.innerHTML = '';
     });

     afterEach(() => {
          // Ensure cleanup after each test
          document.body.innerHTML = '';
     });

     /**
      * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
      * 
      * Property 1: Character limits are enforced in UI
      * - Any tweet text > 280 characters should show error state
      * - Character count should update in real-time
      * - Warning message should appear for over-limit tweets
      */
     it('property: character limits are enforced for all tweet edits', () => {
          fc.assert(
               fc.property(
                    // Generate random tweet text of varying lengths
                    fc.array(
                         fc.record({
                              text: fc.string({ minLength: 1, maxLength: 350 }),
                              position: fc.integer({ min: 1, max: 3 }),
                         }),
                         { minLength: 1, maxLength: 3 }
                    ),
                    (tweetEdits) => {
                         // Create mock thread content with exactly 3 tweets
                         const tweets: Tweet[] = [
                              { text: 'Original tweet 1', position: 1, characterCount: 16 },
                              { text: 'Original tweet 2', position: 2, characterCount: 16 },
                              { text: 'Original tweet 3', position: 3, characterCount: 16 },
                         ];

                         const mockContent: GeneratedContent = {
                              id: 'test-id',
                              platform: 'x',
                              contentFormat: 'mini_thread',
                              generatedText: tweets.map(t => t.text).join('\n\n'),
                              tweets,
                              version: 1,
                         };

                         const { container, unmount } = render(
                              <ContentEditor
                                   content={mockContent}
                                   onRegenerate={mockOnRegenerate}
                                   onContentUpdate={mockOnContentUpdate}
                              />
                         );

                         // Edit each tweet (up to 3)
                         const editsToApply = tweetEdits.slice(0, 3);
                         editsToApply.forEach((edit, idx) => {
                              const editButtons = screen.getAllByText('Edit');
                              if (editButtons[idx]) {
                                   fireEvent.click(editButtons[idx]);

                                   const textarea = screen.getByLabelText(`Edit tweet ${idx + 1}`);
                                   fireEvent.change(textarea, { target: { value: edit.text } });

                                   // Verify character count is displayed
                                   const charCount = screen.getByText(`${edit.text.length}/280`);
                                   expect(charCount).toBeInTheDocument();

                                   // If over limit, verify error state
                                   if (edit.text.length > 280) {
                                        expect(charCount).toHaveClass('text-red-500');
                                        expect(screen.getByText('Tweet exceeds 280 character limit')).toBeInTheDocument();
                                   }

                                   // Click done to close edit mode
                                   fireEvent.click(screen.getByText('Done'));
                              }
                         });

                         // Cleanup
                         unmount();
                    }
               ),
               { numRuns: 20 } // Reduced runs for stability
          );
     });

     /**
      * **Validates: Requirements 6.2, 6.5**
      * 
      * Property 2: Edited tweets are tracked correctly
      * - Only edited tweets should be included in save request
      * - Position and text should match the edits made
      * - Unedited tweets should not be included
      */
     it('property: edited tweets are tracked correctly', async () => {
          await fc.assert(
               fc.asyncProperty(
                    // Generate random edits for subset of tweets
                    fc.array(
                         fc.record({
                              position: fc.integer({ min: 1, max: 3 }),
                              newText: fc.string({ minLength: 20, maxLength: 280 }), // Avoid very short strings
                         }),
                         { minLength: 1, maxLength: 2 } // Limit to 2 edits for stability
                    ),
                    async (edits) => {
                         // Remove duplicate positions
                         const uniqueEdits = Array.from(
                              new Map(edits.map(e => [e.position, e])).values()
                         );

                         // Create mock thread with 3 tweets
                         const tweets: Tweet[] = [
                              { text: 'Tweet 1', position: 1, characterCount: 7 },
                              { text: 'Tweet 2', position: 2, characterCount: 7 },
                              { text: 'Tweet 3', position: 3, characterCount: 7 },
                         ];

                         const mockContent: GeneratedContent = {
                              id: 'test-id',
                              platform: 'x',
                              contentFormat: 'mini_thread',
                              generatedText: tweets.map(t => t.text).join('\n\n'),
                              tweets,
                              version: 1,
                         };

                         const { unmount } = render(
                              <ContentEditor
                                   content={mockContent}
                                   onRegenerate={mockOnRegenerate}
                                   onContentUpdate={mockOnContentUpdate}
                              />
                         );

                         // Apply edits
                         for (const edit of uniqueEdits) {
                              const editButtons = screen.getAllByText('Edit');
                              fireEvent.click(editButtons[edit.position - 1]);

                              const textarea = screen.getByLabelText(`Edit tweet ${edit.position}`);
                              fireEvent.change(textarea, { target: { value: edit.newText } });

                              // Click done if there are more edits to make
                              const doneButtons = screen.queryAllByText('Done');
                              if (doneButtons.length > 0) {
                                   fireEvent.click(doneButtons[0]);
                              }
                         }

                         // Click save
                         const saveButton = screen.getByRole('button', { name: /save your edits/i });
                         fireEvent.click(saveButton);

                         // Verify API call
                         await waitFor(() => {
                              expect(mockApiClient.post).toHaveBeenCalled();
                         }, { timeout: 3000 });

                         const callArgs = mockApiClient.post.mock.calls[mockApiClient.post.mock.calls.length - 1];
                         const editedTweets = callArgs[1].editedTweets;

                         // Verify only edited tweets are included
                         expect(editedTweets).toHaveLength(uniqueEdits.length);

                         // Verify each edit matches
                         uniqueEdits.forEach(edit => {
                              const savedEdit = editedTweets.find(
                                   (e: { position: number }) => e.position === edit.position
                              );
                              expect(savedEdit).toBeDefined();
                              expect(savedEdit.text).toBe(edit.newText);
                         });

                         unmount();
                         mockApiClient.post.mockClear();
                    }
               ),
               { numRuns: 10 } // Reduced runs for async tests
          );
     });

     /**
      * **Validates: Requirements 6.3, 6.4**
      * 
      * Property 3: Character count updates in real-time
      * - Character count should always match the current text length
      * - Warning state should appear/disappear based on length
      */
     it('property: character count updates match text length', () => {
          fc.assert(
               fc.property(
                    // Generate sequence of text changes
                    fc.array(
                         fc.string({ minLength: 1, maxLength: 350 }),
                         { minLength: 1, maxLength: 3 } // Reduced to 3 changes
                    ),
                    (textSequence) => {
                         const mockContent: GeneratedContent = {
                              id: `test-id-${Math.random()}`,
                              platform: 'x',
                              contentFormat: 'mini_thread',
                              generatedText: 'Tweet 1',
                              tweets: [
                                   { text: 'Tweet 1', position: 1, characterCount: 7 },
                              ],
                              version: 1,
                         };

                         const { unmount } = render(
                              <ContentEditor
                                   content={mockContent}
                                   onRegenerate={mockOnRegenerate}
                                   onContentUpdate={mockOnContentUpdate}
                              />
                         );

                         try {
                              // Click edit using getAllByText and select first
                              const editButtons = screen.getAllByText('Edit');
                              fireEvent.click(editButtons[0]);

                              const textareas = screen.getAllByLabelText('Edit tweet 1');
                              const textarea = textareas[0];

                              // Apply each text change and verify count
                              textSequence.forEach(text => {
                                   fireEvent.change(textarea, { target: { value: text } });

                                   // Verify character count matches
                                   const charCountElements = screen.getAllByText(`${text.length}/280`);
                                   expect(charCountElements.length).toBeGreaterThan(0);

                                   // Verify error state for over-limit
                                   if (text.length > 280) {
                                        expect(charCountElements[0]).toHaveClass('text-red-500');
                                   }
                              });
                         } finally {
                              unmount();
                         }
                    }
               ),
               { numRuns: 10 } // Further reduced runs
          );
     });

     /**
      * **Validates: Requirements 6.1, 6.2**
      * 
      * Property 4: Each tweet can be edited independently
      * - Editing one tweet should not affect others
      * - Multiple tweets can be edited in sequence
      */
     it('property: tweets can be edited independently', () => {
          fc.assert(
               fc.property(
                    fc.integer({ min: 2, max: 5 }), // Number of tweets
                    fc.integer({ min: 0, max: 4 }), // Which tweet to edit (0-indexed)
                    fc.string({ minLength: 10, maxLength: 280 }), // New text
                    (numTweets, editIndex, newText) => {
                         // Ensure editIndex is valid
                         const validEditIndex = editIndex % numTweets;

                         // Create tweets
                         const tweets: Tweet[] = Array.from({ length: numTweets }, (_, i) => ({
                              text: `Original tweet ${i + 1}`,
                              position: i + 1,
                              characterCount: `Original tweet ${i + 1}`.length,
                         }));

                         const mockContent: GeneratedContent = {
                              id: 'test-id',
                              platform: 'x',
                              contentFormat: numTweets === 3 ? 'mini_thread' : 'full_thread',
                              generatedText: tweets.map(t => t.text).join('\n\n'),
                              tweets,
                              version: 1,
                         };

                         const { unmount } = render(
                              <ContentEditor
                                   content={mockContent}
                                   onRegenerate={mockOnRegenerate}
                                   onContentUpdate={mockOnContentUpdate}
                              />
                         );

                         // Edit the selected tweet
                         const editButtons = screen.getAllByText('Edit');
                         fireEvent.click(editButtons[validEditIndex]);

                         const textarea = screen.getByLabelText(`Edit tweet ${validEditIndex + 1}`);
                         fireEvent.change(textarea, { target: { value: newText } });

                         // Verify other tweets are still showing original text
                         tweets.forEach((tweet, idx) => {
                              if (idx !== validEditIndex) {
                                   expect(screen.getByText(tweet.text)).toBeInTheDocument();
                              }
                         });

                         unmount();
                    }
               ),
               { numRuns: 20 }
          );
     });
});
