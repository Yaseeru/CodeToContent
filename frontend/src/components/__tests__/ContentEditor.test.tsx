import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import ContentEditor from '../ContentEditor';
import { GeneratedContent } from '../ContentGenerator';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock clipboard API
Object.assign(navigator, {
     clipboard: {
          writeText: jest.fn(),
     },
});

describe('ContentEditor Unit Tests', () => {
     const mockContent: GeneratedContent = {
          id: 'test-content-id',
          platform: 'linkedin',
          generatedText: 'This is the original generated content for LinkedIn.',
          tone: 'Professional',
          version: 1,
     };

     beforeEach(() => {
          jest.clearAllMocks();
          localStorage.setItem('token', 'test-token');
     });

     afterEach(() => {
          localStorage.clear();
     });

     // Validates: Requirements 6.3
     test('regenerate button triggers new generation', () => {
          const mockRegenerate = jest.fn();
          const mockUpdate = jest.fn();

          render(
               <ContentEditor
                    content={mockContent}
                    onRegenerate={mockRegenerate}
                    onContentUpdate={mockUpdate}
               />
          );

          const regenerateButton = screen.getByText('Regenerate');
          fireEvent.click(regenerateButton);

          expect(mockRegenerate).toHaveBeenCalledTimes(1);
     });

     // Validates: Requirements 6.4
     test('refinement button "shorter" calls refine API', async () => {
          const mockRegenerate = jest.fn();
          const mockUpdate = jest.fn();

          const refinedContent: GeneratedContent = {
               ...mockContent,
               generatedText: 'Shorter content.',
               version: 2,
          };

          mockedAxios.post.mockResolvedValueOnce({
               data: { content: refinedContent },
          });

          render(
               <ContentEditor
                    content={mockContent}
                    onRegenerate={mockRegenerate}
                    onContentUpdate={mockUpdate}
               />
          );

          const shorterButton = screen.getByText('Make Shorter');
          fireEvent.click(shorterButton);

          await waitFor(() => {
               expect(mockedAxios.post).toHaveBeenCalledWith(
                    '/api/content/refine',
                    {
                         contentId: mockContent.id,
                         instruction: 'shorter',
                    },
                    {
                         headers: {
                              Authorization: 'Bearer test-token',
                         },
                    }
               );
          });

          await waitFor(() => {
               expect(mockUpdate).toHaveBeenCalledWith(refinedContent);
          });
     });

     // Validates: Requirements 6.4
     test('refinement button "clearer" calls refine API', async () => {
          const mockRegenerate = jest.fn();
          const mockUpdate = jest.fn();

          const refinedContent: GeneratedContent = {
               ...mockContent,
               generatedText: 'Clearer content.',
               version: 2,
          };

          mockedAxios.post.mockResolvedValueOnce({
               data: { content: refinedContent },
          });

          render(
               <ContentEditor
                    content={mockContent}
                    onRegenerate={mockRegenerate}
                    onContentUpdate={mockUpdate}
               />
          );

          const clearerButton = screen.getByText('Make Clearer');
          fireEvent.click(clearerButton);

          await waitFor(() => {
               expect(mockedAxios.post).toHaveBeenCalledWith(
                    '/api/content/refine',
                    {
                         contentId: mockContent.id,
                         instruction: 'clearer',
                    },
                    {
                         headers: {
                              Authorization: 'Bearer test-token',
                         },
                    }
               );
          });

          await waitFor(() => {
               expect(mockUpdate).toHaveBeenCalledWith(refinedContent);
          });
     });

     // Validates: Requirements 6.4
     test('refinement button "more engaging" calls refine API', async () => {
          const mockRegenerate = jest.fn();
          const mockUpdate = jest.fn();

          const refinedContent: GeneratedContent = {
               ...mockContent,
               generatedText: 'More engaging content!',
               version: 2,
          };

          mockedAxios.post.mockResolvedValueOnce({
               data: { content: refinedContent },
          });

          render(
               <ContentEditor
                    content={mockContent}
                    onRegenerate={mockRegenerate}
                    onContentUpdate={mockUpdate}
               />
          );

          const engagingButton = screen.getByText('Make More Engaging');
          fireEvent.click(engagingButton);

          await waitFor(() => {
               expect(mockedAxios.post).toHaveBeenCalledWith(
                    '/api/content/refine',
                    {
                         contentId: mockContent.id,
                         instruction: 'more engaging',
                    },
                    {
                         headers: {
                              Authorization: 'Bearer test-token',
                         },
                    }
               );
          });

          await waitFor(() => {
               expect(mockUpdate).toHaveBeenCalledWith(refinedContent);
          });
     });

     // Validates: Requirements 6.5
     test('copy button copies content to clipboard', async () => {
          const mockRegenerate = jest.fn();
          const mockUpdate = jest.fn();

          render(
               <ContentEditor
                    content={mockContent}
                    onRegenerate={mockRegenerate}
                    onContentUpdate={mockUpdate}
               />
          );

          const copyButton = screen.getByText('Copy');
          fireEvent.click(copyButton);

          await waitFor(() => {
               expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                    mockContent.generatedText
               );
          });

          // Verify button text changes to "Copied!"
          expect(screen.getByText('Copied!')).toBeInTheDocument();
     });

     // Validates: Requirements 6.5
     test('copy button copies edited content to clipboard', async () => {
          const mockRegenerate = jest.fn();
          const mockUpdate = jest.fn();

          render(
               <ContentEditor
                    content={mockContent}
                    onRegenerate={mockRegenerate}
                    onContentUpdate={mockUpdate}
               />
          );

          const textarea = screen.getByPlaceholderText(
               /Generated content will appear here.../i
          ) as HTMLTextAreaElement;

          const editedText = 'This is my edited content.';
          fireEvent.change(textarea, { target: { value: editedText } });

          const copyButton = screen.getByText('Copy');
          fireEvent.click(copyButton);

          await waitFor(() => {
               expect(navigator.clipboard.writeText).toHaveBeenCalledWith(editedText);
          });
     });
});
