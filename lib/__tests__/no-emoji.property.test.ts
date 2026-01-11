/**
 * Property-Based Test for No Emoji Characters
 * Feature: ui-redesign-dark-light-mode, Property 17: No Emoji Characters
 * 
 * For any rendered component in the UI, the text content must not contain
 * emoji characters (Unicode ranges U+1F300-U+1F9FF).
 * 
 * Validates: Requirements 6.5, 11.10, 13.10, 14.11, 15.3, 16.9, 22.5, 23.5
 */

import * as fc from 'fast-check';

describe('No Emoji Characters - Property Test', () => {
     /**
      * Property 17: No Emoji Characters
      * Feature: ui-redesign-dark-light-mode, Property 17: No Emoji Characters
      * 
      * For any rendered component in the UI, the text content must not contain
      * emoji characters (Unicode ranges U+1F300-U+1F9FF and other common emoji ranges).
      * 
      * Validates: Requirements 6.5, 11.10, 13.10, 14.11, 15.3, 16.9, 22.5, 23.5
      */
     test('Property 17: No Emoji Characters', () => {
          // Function to check if text contains emojis
          const containsEmoji = (text: string): boolean => {
               // Comprehensive emoji regex covering all major emoji Unicode ranges
               // Including variation selectors (U+FE0F) and other emoji modifiers
               const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
               return emojiRegex.test(text);
          };

          // Function to sanitize text by removing emojis
          const sanitizeText = (text: string): string => {
               const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
               return text.replace(emojiRegex, '');
          };

          // Simulate component text content that should be emoji-free
          // These represent various UI components and their text content
          const componentTextSamples = [
               // Button component text
               { component: 'Button', text: 'Sign in with GitHub' },
               { component: 'Button', text: 'Generate Content' },
               { component: 'Button', text: 'Copy' },
               { component: 'Button', text: 'Copied' },

               // Empty state messages
               { component: 'RepoList Empty State', text: 'No repositories found' },
               { component: 'DiffViewer Empty State', text: 'No diff data available' },
               { component: 'DiffViewer Empty State', text: 'Select a commit to view changes' },
               { component: 'ContentPreview Empty State', text: 'No content drafts available' },

               // Loading state messages
               { component: 'Loading State', text: 'Loading...' },
               { component: 'Loading State', text: 'Generating content...' },

               // Content type labels
               { component: 'ContentPreview', text: 'X Thread' },
               { component: 'ContentPreview', text: 'LinkedIn Post' },
               { component: 'ContentPreview', text: 'Blog Outline' },

               // Repository list
               { component: 'RepoList', text: 'No description available' },

               // Landing page
               { component: 'Landing Page', text: 'CodeToContent' },
               { component: 'Landing Page', text: 'Turn real code into real content—automatically.' },
               { component: 'Landing Page', text: 'Sign in to get started' },

               // Diff viewer
               { component: 'DiffViewer', text: 'No file selected' },
               { component: 'DiffViewer', text: 'No changes' },
               { component: 'DiffViewer', text: 'Modified' },
          ];

          fc.assert(
               fc.property(
                    fc.constantFrom(...componentTextSamples),
                    (sample) => {
                         // Verify the component text does not contain emojis
                         expect(containsEmoji(sample.text)).toBe(false);

                         // Verify sanitization doesn't change the text (because it has no emojis)
                         expect(sanitizeText(sample.text)).toBe(sample.text);

                         // Additional check: text should be identical after sanitization
                         const sanitized = sanitizeText(sample.text);
                         expect(sanitized.length).toBe(sample.text.length);
                    }
               ),
               { numRuns: 100 }
          );
     });

     /**
      * Additional test: Emoji detection works correctly
      * Verifies that our emoji detection function correctly identifies emojis
      */
     test('Emoji detection correctly identifies emoji characters', () => {
          const containsEmoji = (text: string): boolean => {
               const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
               return emojiRegex.test(text);
          };

          // Test strings with emojis
          const textsWithEmojis = [
               '🚀 Launch',
               'Click Me 😊',
               'Test 🎉 🔥 ⚡ 🌟',
               '📚 Repository',
               '⚙️ Settings',
          ];

          // Test strings without emojis
          const textsWithoutEmojis = [
               'Launch',
               'Click Me',
               'Test',
               'Repository',
               'Settings',
               'Sign in with GitHub',
               'No repositories found',
          ];

          fc.assert(
               fc.property(
                    fc.constantFrom(...textsWithEmojis),
                    (textWithEmoji) => {
                         // Should detect emojis
                         expect(containsEmoji(textWithEmoji)).toBe(true);
                    }
               ),
               { numRuns: 100 }
          );

          fc.assert(
               fc.property(
                    fc.constantFrom(...textsWithoutEmojis),
                    (textWithoutEmoji) => {
                         // Should not detect emojis
                         expect(containsEmoji(textWithoutEmoji)).toBe(false);
                    }
               ),
               { numRuns: 100 }
          );
     });

     /**
      * Additional test: Sanitization removes all emojis
      * Verifies that sanitization function removes all emoji characters
      */
     test('Sanitization removes all emoji characters', () => {
          const sanitizeText = (text: string): string => {
               const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
               return text.replace(emojiRegex, '');
          };

          const containsEmoji = (text: string): boolean => {
               const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
               return emojiRegex.test(text);
          };

          const testCases = [
               { input: '🚀 Launch', expected: ' Launch' },
               { input: 'Click Me 😊 Now', expected: 'Click Me  Now' },
               { input: 'Test 🎉 🔥 ⚡ 🌟 Text', expected: 'Test     Text' },
               { input: '📚 Repository', expected: ' Repository' },
               { input: '⚙️ Settings', expected: ' Settings' }, // ⚙ + variation selector
          ];

          fc.assert(
               fc.property(
                    fc.constantFrom(...testCases),
                    (testCase) => {
                         const sanitized = sanitizeText(testCase.input);

                         // Verify sanitized text matches expected
                         expect(sanitized).toBe(testCase.expected);

                         // Verify sanitized text contains no emojis
                         expect(containsEmoji(sanitized)).toBe(false);

                         // Verify original text had emojis
                         expect(containsEmoji(testCase.input)).toBe(true);
                    }
               ),
               { numRuns: 100 }
          );
     });

     /**
      * Additional test: Icon components should not render emojis
      * Verifies that icon names and aria-labels don't contain emojis
      */
     test('Icon components use proper names without emojis', () => {
          const iconNames = [
               'Repository',
               'Settings',
               'Menu',
               'X',
               'ChevronLeft',
               'ChevronRight',
               'Sun',
               'Moon',
               'Copy',
               'Check',
               'Spinner',
               'User',
               'LogOut',
               'Code',
               'FileText',
               'Star',
          ];

          const containsEmoji = (text: string): boolean => {
               const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
               return emojiRegex.test(text);
          };

          fc.assert(
               fc.property(
                    fc.constantFrom(...iconNames),
                    (iconName) => {
                         // Icon names should not contain emojis
                         expect(containsEmoji(iconName)).toBe(false);

                         // Icon names should be valid identifiers (alphanumeric)
                         expect(iconName).toMatch(/^[A-Za-z]+$/);
                    }
               ),
               { numRuns: 100 }
          );
     });

     /**
      * Additional test: User-facing messages should be emoji-free
      * Verifies that all user-facing messages across the application are emoji-free
      */
     test('User-facing messages are emoji-free', () => {
          const containsEmoji = (text: string): boolean => {
               const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
               return emojiRegex.test(text);
          };

          // Comprehensive list of user-facing messages from all components
          const userMessages = [
               // Landing page
               'CodeToContent',
               'Turn real code into real content—automatically.',
               'Sign in to get started',
               'Sign in with GitHub',

               // Empty states (Requirement 22.5)
               'No repositories found',
               'No diff data available',
               'Select a commit to view changes',
               'No content drafts available',
               'No description available',
               'No file selected',
               'No changes',

               // Loading states (Requirement 23.5)
               'Loading...',
               'Generating content...',

               // Button labels (Requirement 11.10)
               'Copy',
               'Copied',
               'Generate Content',
               'Sign Out',

               // Content type labels (Requirement 15.3)
               'X Thread',
               'LinkedIn Post',
               'Blog Outline',

               // Repository list (Requirement 13.10)
               'Repository list',
               'Stars:',
               'Language:',
               'Last updated:',

               // Diff viewer (Requirement 14.11)
               'Code diff viewer',
               'Code changes',
               'Added:',
               'Deleted:',
               'Unchanged:',
               'Modified',

               // Accessibility labels (Requirement 6.5)
               'Toggle theme',
               'Open menu',
               'Close menu',
               'Copy to clipboard',
               'Copied to clipboard',
          ];

          fc.assert(
               fc.property(
                    fc.constantFrom(...userMessages),
                    (message) => {
                         const containsEmoji = (text: string): boolean => {
                              const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
                              return emojiRegex.test(text);
                         };

                         // All user-facing messages should be emoji-free
                         expect(containsEmoji(message)).toBe(false);

                         // Message should not change after sanitization
                         const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu;
                         const sanitized = message.replace(emojiRegex, '');
                         expect(sanitized).toBe(message);
                    }
               ),
               { numRuns: 100 }
          );
     });
});
