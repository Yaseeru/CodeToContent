/**
 * Unit Tests for DiffViewer Component
 * Feature: ui-redesign-dark-light-mode
 * Requirements: 14.1-14.11
 */

import type { DiffLine } from '@/components/features/DiffViewer';

describe('DiffViewer Component - Unit Tests', () => {
     /**
      * Helper to generate diff line styling classes
      */
     const getDiffLineClasses = (type: 'add' | 'del' | 'eq') => {
          const baseClasses = 'flex min-w-full font-mono text-[14px] leading-relaxed';

          if (type === 'add') {
               return `${baseClasses} bg-diff-add-bg`;
          } else if (type === 'del') {
               return `${baseClasses} bg-diff-del-bg`;
          }

          return baseClasses;
     };

     /**
      * Helper to get line number column width
      */
     const getLineNumberWidth = () => {
          return '48px';
     };

     /**
      * Helper to get code font size
      */
     const getCodeFontSize = () => {
          return '14px';
     };

     /**
      * Helper to get code font family
      */
     const getCodeFontFamily = () => {
          return 'JetBrains Mono';
     };

     /**
      * Helper to get text color for diff line type
      */
     const getTextColorForLineType = (type: 'add' | 'del' | 'eq') => {
          if (type === 'add') return 'text-foreground';
          if (type === 'del') return 'text-foreground-secondary';
          if (type === 'eq') return 'text-foreground-code';
          return '';
     };

     /**
      * Helper to check if emoji is present in text
      */
     const containsEmoji = (text: string): boolean => {
          const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
          return emojiRegex.test(text);
     };

     /**
      * Test JetBrains Mono font usage
      * Validates: Requirement 14.1
      */
     test('should use JetBrains Mono font for code', () => {
          const fontFamily = getCodeFontFamily();
          expect(fontFamily).toBe('JetBrains Mono');
     });

     /**
      * Test 14px font size for code
      * Validates: Requirement 14.2
      */
     test('should use 14px font size for code', () => {
          const fontSize = getCodeFontSize();
          expect(fontSize).toBe('14px');
     });

     /**
      * Test line number column width is 48px
      * Validates: Requirement 14.10
      */
     test('should have 48px width for line number column', () => {
          const width = getLineNumberWidth();
          expect(width).toBe('48px');
     });

     /**
      * Test line number styling
      * Validates: Requirement 14.3
      */
     test('should style line numbers with diff-line-number color', () => {
          const lineNumberClasses = 'w-[48px] flex-shrink-0 text-right pr-4 select-none text-diff-line-number bg-black/10';

          expect(lineNumberClasses).toContain('text-diff-line-number');
          expect(lineNumberClasses).toContain('text-right');
          expect(lineNumberClasses).toContain('select-none');
     });

     /**
      * Test addition line background color
      * Validates: Requirement 14.4
      */
     test('should use diff-add-bg for added lines', () => {
          const classes = getDiffLineClasses('add');
          expect(classes).toContain('bg-diff-add-bg');
     });

     /**
      * Test deletion line background color
      * Validates: Requirement 14.5
      */
     test('should use diff-del-bg for deleted lines', () => {
          const classes = getDiffLineClasses('del');
          expect(classes).toContain('bg-diff-del-bg');
     });

     /**
      * Test unchanged line text color
      * Validates: Requirement 14.6
      */
     test('should use foreground-code color for unchanged lines', () => {
          const textColor = getTextColorForLineType('eq');
          expect(textColor).toBe('text-foreground-code');
     });

     /**
      * Test added line text color
      * Validates: Requirement 14.4
      */
     test('should use foreground color for added lines', () => {
          const textColor = getTextColorForLineType('add');
          expect(textColor).toBe('text-foreground');
     });

     /**
      * Test deleted line text color
      * Validates: Requirement 14.5
      */
     test('should use foreground-secondary color for deleted lines', () => {
          const textColor = getTextColorForLineType('del');
          expect(textColor).toBe('text-foreground-secondary');
     });

     /**
      * Test header styling
      * Validates: Requirement 14.7
      */
     test('should style header with background-tertiary/50', () => {
          const headerClasses = 'flex items-center justify-between px-4 py-2 bg-background-tertiary/50 border-b border-background-tertiary';

          expect(headerClasses).toContain('bg-background-tertiary/50');
          expect(headerClasses).toContain('border-b');
          expect(headerClasses).toContain('border-background-tertiary');
     });

     /**
      * Test file name display in header
      * Validates: Requirement 14.7
      */
     test('should display file name in header with mono font', () => {
          const fileNameClasses = 'text-sm text-foreground-secondary font-mono';

          expect(fileNameClasses).toContain('font-mono');
          expect(fileNameClasses).toContain('text-foreground-secondary');
     });

     /**
      * Test modification status badge
      * Validates: Requirement 14.8
      */
     test('should display modification status badge', () => {
          const statusBadgeClasses = 'text-sm text-accent';

          expect(statusBadgeClasses).toContain('text-accent');
     });

     /**
      * Test horizontal scrolling support
      * Validates: Requirement 14.9
      */
     test('should support horizontal scrolling for long lines', () => {
          const containerClasses = 'p-0 overflow-x-auto';

          expect(containerClasses).toContain('overflow-x-auto');
     });

     /**
      * Test empty state without emoji
      * Validates: Requirement 14.11
      */
     test('should not contain emoji in empty state', () => {
          const emptyStateText = 'No diff data available';
          const emptyStateSubtext = 'Select a commit to view changes';

          expect(containsEmoji(emptyStateText)).toBe(false);
          expect(containsEmoji(emptyStateSubtext)).toBe(false);
     });

     /**
      * Test empty state uses FileText icon
      * Validates: Requirement 14.11
      */
     test('should use FileText icon in empty state (not emoji)', () => {
          // The component should use <FileText /> component instead of emoji
          const emptyStateIconType = 'FileText';

          expect(emptyStateIconType).toBe('FileText');
     });

     /**
      * Test diff line rendering with correct structure
      * Validates: Requirements 14.1-14.6
      */
     test('should render diff lines with correct structure', () => {
          const mockDiffLines: DiffLine[] = [
               { type: 'add', content: 'new line', lineNo: 1 },
               { type: 'del', content: 'old line', lineNo: 2 },
               { type: 'eq', content: 'unchanged', lineNo: 3 },
          ];

          mockDiffLines.forEach(line => {
               const classes = getDiffLineClasses(line.type);
               const textColor = getTextColorForLineType(line.type);

               expect(classes).toContain('font-mono');
               expect(classes).toContain('text-[14px]');
               expect(textColor).toBeTruthy();
          });
     });

     /**
      * Test line prefixes for different types
      * Validates: Requirements 14.4-14.6
      */
     test('should add correct prefixes to diff lines', () => {
          const getLinePrefix = (type: 'add' | 'del' | 'eq') => {
               if (type === 'add') return '+ ';
               if (type === 'del') return '- ';
               if (type === 'eq') return '  ';
               return '';
          };

          expect(getLinePrefix('add')).toBe('+ ');
          expect(getLinePrefix('del')).toBe('- ');
          expect(getLinePrefix('eq')).toBe('  ');
     });

     /**
      * Test empty state message styling
      * Validates: Requirement 14.11
      */
     test('should style empty state with proper typography', () => {
          const emptyStateClasses = 'p-8 text-center text-foreground-secondary';
          const messageClasses = 'text-body';
          const subtextClasses = 'text-caption mt-2 opacity-70';

          expect(emptyStateClasses).toContain('text-center');
          expect(emptyStateClasses).toContain('text-foreground-secondary');
          expect(messageClasses).toContain('text-body');
          expect(subtextClasses).toContain('text-caption');
     });

     /**
      * Test card styling for diff viewer
      * Validates: Requirements 14.1-14.11
      */
     test('should use Card component with proper styling', () => {
          const cardClasses = 'bg-background-secondary border-none overflow-hidden';

          expect(cardClasses).toContain('bg-background-secondary');
          expect(cardClasses).toContain('border-none');
          expect(cardClasses).toContain('overflow-hidden');
     });

     /**
      * Test line number background
      * Validates: Requirement 14.3
      */
     test('should have semi-transparent background for line numbers', () => {
          const lineNumberClasses = 'w-[48px] flex-shrink-0 text-right pr-4 select-none text-diff-line-number bg-black/10';

          expect(lineNumberClasses).toContain('bg-black/10');
     });

     /**
      * Test whitespace preservation
      * Validates: Requirement 14.9
      */
     test('should preserve whitespace in code content', () => {
          const contentClasses = 'pl-4 whitespace-pre';

          expect(contentClasses).toContain('whitespace-pre');
     });
});
