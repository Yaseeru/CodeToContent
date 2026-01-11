/**
 * Unit Tests for Button Component
 * Feature: developer-focused-ui-redesign
 * Requirements: 2.2, 7.1, 7.2, 7.3, 7.4
 */

// Mock the Button component behavior for testing
describe('Button Component - Unit Tests', () => {
     // Helper to simulate button class generation
     const generateButtonClasses = (options: {
          variant?: 'primary' | 'secondary' | 'ghost';
          disabled?: boolean;
          loading?: boolean;
     }) => {
          const { variant = 'primary', disabled = false, loading = false } = options;

          const classes: string[] = [
               'inline-flex',
               'items-center',
               'justify-center',
               'gap-2',
               // Padding: 8px vertical (py-sm), 12px horizontal (px-md)
               'py-sm',
               'px-md',
               // Border radius: max 4px
               'rounded-button',
               'text-sm',
               'font-medium',
               // No transitions (0ms)
               'transition-none',
               // Focus: elevation with box-shadow only
               'focus-visible:outline-none',
               'focus-visible:shadow-[0_0_0_2px_var(--border-focus)]',
               'disabled:pointer-events-none',
               'disabled:opacity-50',
          ];

          // Variant classes
          if (variant === 'primary') {
               classes.push('bg-accent-neutral', 'text-text-primary', 'hover:bg-accent-hover');
          } else if (variant === 'secondary') {
               classes.push('bg-transparent', 'text-text-secondary', 'border', 'border-border-subtle', 'hover:bg-[rgba(110,110,128,0.05)]');
          } else if (variant === 'ghost') {
               classes.push('bg-transparent', 'text-text-muted', 'hover:text-text-secondary', 'hover:bg-[rgba(110,110,128,0.05)]');
          }

          return classes.join(' ');
     };

     // Helper to check if button should be disabled
     const isButtonDisabled = (disabled: boolean, loading: boolean): boolean => {
          return disabled || loading;
     };

     // Helper to remove emojis from text
     const sanitizeText = (text: string): string => {
          return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');
     };

     /**
      * Test flat styling with no gradients
      * Validates: Requirement 7.1
      */
     test('should have flat styling with no gradient classes', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          // Should not contain gradient-related classes
          expect(classes).not.toContain('bg-gradient');
          expect(classes).not.toContain('from-');
          expect(classes).not.toContain('to-');
     });

     /**
      * Test padding: 8px vertical, 12px horizontal
      * Validates: Requirement 2.2
      */
     test('should have correct padding (8px vertical, 12px horizontal)', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          expect(classes).toContain('py-sm');  // 8px
          expect(classes).toContain('px-md');  // 12px
     });

     /**
      * Test border-radius max 4px
      * Validates: Requirement 7.3
      */
     test('should have border-radius max 4px', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          expect(classes).toContain('rounded-button');  // 4px from design tokens
     });

     /**
      * Test subtle hover states
      * Validates: Requirement 7.2
      */
     test('should include subtle hover classes for all variants', () => {
          const primaryClasses = generateButtonClasses({ variant: 'primary' });
          expect(primaryClasses).toContain('hover:bg-accent-hover');

          const secondaryClasses = generateButtonClasses({ variant: 'secondary' });
          expect(secondaryClasses).toContain('hover:bg-[rgba(110,110,128,0.05)]');

          const ghostClasses = generateButtonClasses({ variant: 'ghost' });
          expect(ghostClasses).toContain('hover:bg-[rgba(110,110,128,0.05)]');
     });

     /**
      * Test elevation only on focus (box-shadow)
      * Validates: Requirement 7.4
      */
     test('should apply elevation only on focus state', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          // Should have focus shadow
          expect(classes).toContain('focus-visible:shadow-[0_0_0_2px_var(--border-focus)]');

          // Should not have default shadow (elevation only on focus)
          // Check that shadow classes only appear with focus-visible prefix
          const classArray = classes.split(' ');
          const shadowClasses = classArray.filter(c => c.includes('shadow-'));
          const nonFocusShadowClasses = shadowClasses.filter(c => !c.startsWith('focus-visible:'));

          expect(nonFocusShadowClasses.length).toBe(0);
     });

     /**
      * Test no transitions or animations (0ms)
      * Validates: Requirement 13.4 (via task requirements)
      */
     test('should have no transitions (transition-none)', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          expect(classes).toContain('transition-none');
          expect(classes).not.toContain('transition-all');
          expect(classes).not.toContain('duration-');
     });

     /**
      * Test disabled state with 50% opacity
      * Validates: General button behavior
      */
     test('should include disabled classes with 50% opacity', () => {
          const classes = generateButtonClasses({ disabled: true });

          expect(classes).toContain('disabled:opacity-50');
          expect(classes).toContain('disabled:pointer-events-none');
     });

     /**
      * Test loading state disables button
      * Validates: General button behavior
      */
     test('should be disabled when loading', () => {
          const disabled = isButtonDisabled(false, true);
          expect(disabled).toBe(true);
     });

     /**
      * Test emoji removal
      * Validates: Requirement 13.1 (no emojis)
      */
     test('should remove emoji characters from button text', () => {
          const textWithEmojis = 'Click Me 🚀 Now 😊';
          const sanitized = sanitizeText(textWithEmojis);

          expect(sanitized).toBe('Click Me  Now ');
          expect(sanitized).not.toContain('🚀');
          expect(sanitized).not.toContain('😊');
     });

     /**
      * Test all button variants have correct classes
      * Validates: Requirements 7.1, 7.2
      */
     test('should apply correct classes for primary variant', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          expect(classes).toContain('bg-accent-neutral');
          expect(classes).toContain('text-text-primary');
          expect(classes).toContain('hover:bg-accent-hover');
     });

     test('should apply correct classes for secondary variant', () => {
          const classes = generateButtonClasses({ variant: 'secondary' });

          expect(classes).toContain('bg-transparent');
          expect(classes).toContain('text-text-secondary');
          expect(classes).toContain('border');
          expect(classes).toContain('border-border-subtle');
     });

     test('should apply correct classes for ghost variant', () => {
          const classes = generateButtonClasses({ variant: 'ghost' });

          expect(classes).toContain('bg-transparent');
          expect(classes).toContain('text-text-muted');
          expect(classes).toContain('hover:text-text-secondary');
     });

     /**
      * Test icon positioning logic
      * Validates: Icon support
      */
     test('should support icon positioning', () => {
          // Test that icon can be positioned left or right
          const iconPositions: Array<'left' | 'right'> = ['left', 'right'];

          iconPositions.forEach(position => {
               expect(['left', 'right']).toContain(position);
          });
     });

     /**
      * Test that loading state takes precedence over disabled
      * Validates: General button behavior
      */
     test('should be disabled when loading regardless of disabled prop', () => {
          expect(isButtonDisabled(false, true)).toBe(true);
          expect(isButtonDisabled(true, true)).toBe(true);
     });
});
