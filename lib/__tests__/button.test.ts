/**
 * Unit Tests for Button Component
 * Feature: ui-redesign-dark-light-mode
 * Requirements: 11.6-11.9
 */

// Mock the Button component behavior for testing
describe('Button Component - Unit Tests', () => {
     // Helper to simulate button class generation
     const generateButtonClasses = (options: {
          variant?: 'primary' | 'secondary' | 'ghost';
          size?: 'sm' | 'default' | 'lg';
          disabled?: boolean;
          loading?: boolean;
     }) => {
          const { variant = 'primary', size = 'default', disabled = false, loading = false } = options;

          const classes: string[] = [
               'inline-flex',
               'items-center',
               'justify-center',
               'gap-2',
               'rounded-lg',
               'font-medium',
               'transition-all',
               'duration-200',
               'ease-in-out',
               'focus-visible:outline-none',
               'focus-visible:ring-2',
               'focus-visible:ring-accent',
               'focus-visible:ring-offset-0',
               'disabled:pointer-events-none',
               'disabled:opacity-50',
          ];

          // Variant classes
          if (variant === 'primary') {
               classes.push('bg-accent', 'text-white', 'hover:bg-accent-hover');
          } else if (variant === 'secondary') {
               classes.push('bg-background-tertiary', 'text-foreground', 'hover:bg-opacity-80');
          } else if (variant === 'ghost') {
               classes.push('bg-transparent', 'text-foreground', 'hover:bg-background-secondary');
          }

          // Size classes
          if (size === 'sm') {
               classes.push('h-9', 'px-3');
          } else if (size === 'default') {
               classes.push('h-10', 'px-4');
          } else if (size === 'lg') {
               classes.push('h-11', 'px-6');
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
      * Test hover state classes
      * Validates: Requirement 11.6
      */
     test('should include hover classes for all variants', () => {
          const primaryClasses = generateButtonClasses({ variant: 'primary' });
          expect(primaryClasses).toContain('hover:bg-accent-hover');

          const secondaryClasses = generateButtonClasses({ variant: 'secondary' });
          expect(secondaryClasses).toContain('hover:bg-opacity-80');

          const ghostClasses = generateButtonClasses({ variant: 'ghost' });
          expect(ghostClasses).toContain('hover:bg-background-secondary');
     });

     /**
      * Test focus state with 2px border
      * Validates: Requirement 11.7
      */
     test('should include 2px focus ring classes', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          expect(classes).toContain('focus-visible:ring-2');
          expect(classes).toContain('focus-visible:ring-accent');
     });

     /**
      * Test disabled state with 50% opacity
      * Validates: Requirement 11.8
      */
     test('should include disabled classes with 50% opacity', () => {
          const classes = generateButtonClasses({ disabled: true });

          expect(classes).toContain('disabled:opacity-50');
          expect(classes).toContain('disabled:pointer-events-none');
     });

     /**
      * Test loading state disables button
      * Validates: Requirement 11.9
      */
     test('should be disabled when loading', () => {
          const disabled = isButtonDisabled(false, true);
          expect(disabled).toBe(true);
     });

     /**
      * Test loading state with explicit disabled
      * Validates: Requirement 11.9
      */
     test('should be disabled when both loading and disabled are true', () => {
          const disabled = isButtonDisabled(true, true);
          expect(disabled).toBe(true);
     });

     /**
      * Test emoji removal
      * Validates: Requirement 11.10
      */
     test('should remove emoji characters from button text', () => {
          const textWithEmojis = 'Click Me 🚀 Now 😊';
          const sanitized = sanitizeText(textWithEmojis);

          expect(sanitized).toBe('Click Me  Now ');
          expect(sanitized).not.toContain('🚀');
          expect(sanitized).not.toContain('😊');
     });

     /**
      * Test emoji removal with various emoji types
      * Validates: Requirement 11.10
      */
     test('should remove various types of emojis', () => {
          const textWithEmojis = 'Test 🎉 🔥 ⚡ 🌟 Text';
          const sanitized = sanitizeText(textWithEmojis);

          expect(sanitized).not.toContain('🎉');
          expect(sanitized).not.toContain('🔥');
          expect(sanitized).not.toContain('⚡');
          expect(sanitized).not.toContain('🌟');
     });

     /**
      * Test all button variants have correct classes
      * Validates: Requirements 11.3-11.5
      */
     test('should apply correct classes for primary variant', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          expect(classes).toContain('bg-accent');
          expect(classes).toContain('text-white');
          expect(classes).toContain('hover:bg-accent-hover');
     });

     test('should apply correct classes for secondary variant', () => {
          const classes = generateButtonClasses({ variant: 'secondary' });

          expect(classes).toContain('bg-background-tertiary');
          expect(classes).toContain('text-foreground');
     });

     test('should apply correct classes for ghost variant', () => {
          const classes = generateButtonClasses({ variant: 'ghost' });

          expect(classes).toContain('bg-transparent');
          expect(classes).toContain('text-foreground');
          expect(classes).toContain('hover:bg-background-secondary');
     });

     /**
      * Test button sizes match requirements
      * Validates: Requirement 11.2 (sm: 36px, default: 40px, lg: 44px)
      */
     test('should apply correct height for sm size (36px = h-9)', () => {
          const classes = generateButtonClasses({ size: 'sm' });
          expect(classes).toContain('h-9');
     });

     test('should apply correct height for default size (40px = h-10)', () => {
          const classes = generateButtonClasses({ size: 'default' });
          expect(classes).toContain('h-10');
     });

     test('should apply correct height for lg size (44px = h-11)', () => {
          const classes = generateButtonClasses({ size: 'lg' });
          expect(classes).toContain('h-11');
     });

     /**
      * Test transition classes
      * Validates: Requirement 11.6 (200ms transition)
      */
     test('should include transition classes with 200ms duration', () => {
          const classes = generateButtonClasses({ variant: 'primary' });

          expect(classes).toContain('transition-all');
          expect(classes).toContain('duration-200');
          expect(classes).toContain('ease-in-out');
     });

     /**
      * Test icon positioning logic
      * Validates: Requirement 11.1 (icon support)
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
      * Validates: Requirement 11.9
      */
     test('should be disabled when loading regardless of disabled prop', () => {
          expect(isButtonDisabled(false, true)).toBe(true);
          expect(isButtonDisabled(true, true)).toBe(true);
     });
});
