import { render, screen, fireEvent } from '@testing-library/react';
import fc from 'fast-check';
import ContentEditor from '../ContentEditor';
import { GeneratedContent } from '../ContentGenerator';

// Feature: code-to-content, Property 14: Content Editability
// Validates: Requirements 6.1, 6.2

describe('ContentEditor Property Tests', () => {
     test('Property 14: For any generated content displayed in the UI, the text field should be editable and any user modifications should be preserved', () => {
          fc.assert(
               fc.property(
                    fc.record({
                         id: fc.uuid(),
                         platform: fc.constantFrom('linkedin' as const, 'x' as const),
                         generatedText: fc.string({ minLength: 10, maxLength: 500 }),
                         tone: fc.constantFrom(
                              'Professional',
                              'Casual',
                              'Confident',
                              'Funny'
                         ),
                         version: fc.integer({ min: 1, max: 10 }),
                    }),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    (content: GeneratedContent, userEdit: string) => {
                         const mockRegenerate = jest.fn();
                         const mockUpdate = jest.fn();

                         const { unmount } = render(
                              <ContentEditor
                                   content={content}
                                   onRegenerate={mockRegenerate}
                                   onContentUpdate={mockUpdate}
                              />
                         );

                         // Find the textarea
                         const textarea = screen.getByPlaceholderText(
                              /Generated content will appear here.../i
                         ) as HTMLTextAreaElement;

                         // Verify initial content is displayed
                         expect(textarea.value).toBe(content.generatedText);

                         // Simulate user editing the content
                         const newText = content.generatedText + userEdit;
                         fireEvent.change(textarea, { target: { value: newText } });

                         // Verify the edited text is preserved in the textarea
                         expect(textarea.value).toBe(newText);

                         // Verify the text is different from the original
                         expect(textarea.value).not.toBe(content.generatedText);

                         unmount();
                    }
               ),
               { numRuns: 100 }
          );
     });
});
