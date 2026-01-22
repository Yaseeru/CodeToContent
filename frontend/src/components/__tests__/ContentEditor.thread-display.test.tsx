import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentEditor from '../ContentEditor';
import { GeneratedContent } from '../ContentGenerator';

// Mock apiClient
jest.mock('../../utils/apiClient', () => ({
     apiClient: {
          post: jest.fn(),
     },
     getErrorMessage: jest.fn((err) => err.message || 'An error occurred'),
}));

describe('ContentEditor - Thread Display', () => {
     const mockOnRegenerate = jest.fn();
     const mockOnContentUpdate = jest.fn();

     const mockThreadContent: GeneratedContent = {
          id: 'test-thread-id',
          platform: 'x',
          contentFormat: 'mini_thread',
          generatedText: 'Tweet 1\n\nTweet 2\n\nTweet 3',
          tweets: [
               { text: 'First tweet in the thread 1/3', position: 1, characterCount: 31 },
               { text: 'Second tweet in the thread 2/3', position: 2, characterCount: 32 },
               { text: 'Third tweet in the thread 3/3', position: 3, characterCount: 31 },
          ],
          version: 1,
     };

     beforeEach(() => {
          jest.clearAllMocks();
     });

     it('should render thread tweets correctly', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Check that all tweets are rendered
          expect(screen.getByText('First tweet in the thread 1/3')).toBeInTheDocument();
          expect(screen.getByText('Second tweet in the thread 2/3')).toBeInTheDocument();
          expect(screen.getByText('Third tweet in the thread 3/3')).toBeInTheDocument();
     });

     it('should show position indicators for each tweet', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Check position indicators
          expect(screen.getByText('1/3')).toBeInTheDocument();
          expect(screen.getByText('2/3')).toBeInTheDocument();
          expect(screen.getByText('3/3')).toBeInTheDocument();
     });

     it('should display character counts for each tweet', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Check character counts are displayed
          const charCounts = screen.getAllByText(/\/280/);
          expect(charCounts).toHaveLength(3);

          // Verify specific character counts exist (using getAllByText for duplicates)
          const count29 = screen.getAllByText('29/280');
          expect(count29.length).toBeGreaterThanOrEqual(1); // First and third tweets both have 29 chars

          const count30 = screen.getAllByText('30/280');
          expect(count30.length).toBe(1); // Second tweet has 30 chars
     });

     it('should show thread connectors between tweets', () => {
          const { container } = render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Check for thread connector elements (vertical lines)
          const connectors = container.querySelectorAll('.w-0\\.5.h-4.bg-dark-border');
          // Should have 2 connectors for 3 tweets (between 1-2 and 2-3)
          expect(connectors.length).toBe(2);
     });

     it('should display tweet count in header', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          expect(screen.getByText('(3 tweets)')).toBeInTheDocument();
     });

     it('should not show refine buttons for threads', () => {
          render(
               <ContentEditor
                    content={mockThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Refine buttons should not be present for threads
          expect(screen.queryByText('Make Shorter')).not.toBeInTheDocument();
          expect(screen.queryByText('Make Clearer')).not.toBeInTheDocument();
          expect(screen.queryByText('Make More Engaging')).not.toBeInTheDocument();
     });

     it('should highlight tweets exceeding 280 characters', () => {
          const longThreadContent: GeneratedContent = {
               ...mockThreadContent,
               tweets: [
                    {
                         text: 'A'.repeat(290),
                         position: 1,
                         characterCount: 290,
                    },
                    {
                         text: 'Normal tweet',
                         position: 2,
                         characterCount: 12,
                    },
               ],
          };

          render(
               <ContentEditor
                    content={longThreadContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Check for error state in character count
          expect(screen.getByText('290/280')).toHaveClass('text-red-500');

          // Check for warning message
          expect(screen.getByText('Tweet exceeds 280 character limit')).toBeInTheDocument();
     });

     it('should render single post with textarea when no tweets array', () => {
          const singlePostContent: GeneratedContent = {
               id: 'test-single-id',
               platform: 'x',
               contentFormat: 'single',
               generatedText: 'This is a single post',
               version: 1,
          };

          render(
               <ContentEditor
                    content={singlePostContent}
                    onRegenerate={mockOnRegenerate}
                    onContentUpdate={mockOnContentUpdate}
               />
          );

          // Should show textarea for single posts
          const textarea = screen.getByRole('textbox', { name: /content editor/i });
          expect(textarea).toBeInTheDocument();
          expect(textarea).toHaveValue('This is a single post');

          // Should show refine buttons for single posts
          expect(screen.getByText('Make Shorter')).toBeInTheDocument();
     });
});
