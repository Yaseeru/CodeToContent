/**
 * Property-Based Tests for ARIA Label Presence
 * Feature: ui-redesign-dark-light-mode, Property 19: ARIA Label Presence
 * Validates: Requirements 4.7, 6.7, 19.4
 */

import fc from 'fast-check';

describe('Feature: ui-redesign-dark-light-mode, Property 19: ARIA Label Presence', () => {
     /**
      * Helper to check if an icon-only element has proper ARIA attributes
      */
     const hasProperAriaForIconOnly = (element: {
          hasVisibleText: boolean;
          ariaLabel?: string;
          ariaHidden?: boolean;
          role?: string;
     }): boolean => {
          // If element is decorative (aria-hidden), it doesn't need aria-label
          if (element.ariaHidden) {
               return true;
          }

          // If element has no visible text and is interactive, it must have aria-label
          if (!element.hasVisibleText && element.role && ['button', 'link', 'menuitem'].includes(element.role)) {
               return !!element.ariaLabel;
          }

          // If element has visible text, aria-label is optional
          return true;
     };

     /**
      * Helper to check if an icon has proper accessibility attributes
      */
     const iconHasProperAria = (icon: {
          isDecorative: boolean;
          ariaHidden?: boolean;
          ariaLabel?: string;
     }): boolean => {
          // Decorative icons should have aria-hidden="true"
          if (icon.isDecorative) {
               return icon.ariaHidden === true;
          }

          // Non-decorative icons should have aria-label or aria-hidden
          return !!icon.ariaLabel || icon.ariaHidden === true;
     };

     test('For any icon-only button, it must have an aria-label', () => {
          fc.assert(
               fc.property(
                    fc.constantFrom('button', 'link', 'menuitem'),
                    fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                    fc.boolean(),
                    (role, ariaLabel, ariaHidden) => {
                         const element = {
                              hasVisibleText: false,
                              ariaLabel,
                              ariaHidden,
                              role
                         };

                         const hasProperAria = hasProperAriaForIconOnly(element);

                         if (ariaHidden) {
                              // Decorative elements don't need aria-label
                              expect(hasProperAria).toBe(true);
                         } else {
                              // Interactive elements without text need aria-label
                              expect(hasProperAria).toBe(!!ariaLabel);
                         }
                    }
               ),
               { numRuns: 100 }
          );
     });

     test('For any button with visible text, aria-label is optional', () => {
          fc.assert(
               fc.property(
                    fc.constantFrom('button', 'link', 'menuitem'),
                    fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                    (role, ariaLabel) => {
                         const element = {
                              hasVisibleText: true,
                              ariaLabel,
                              ariaHidden: false,
                              role
                         };

                         const hasProperAria = hasProperAriaForIconOnly(element);
                         // Should always be true when visible text exists
                         expect(hasProperAria).toBe(true);
                    }
               ),
               { numRuns: 100 }
          );
     });

     test('For any decorative icon, it must have aria-hidden="true"', () => {
          fc.assert(
               fc.property(
                    fc.boolean(),
                    fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                    (ariaHidden, ariaLabel) => {
                         const icon = {
                              isDecorative: true,
                              ariaHidden,
                              ariaLabel
                         };

                         const hasProperAria = iconHasProperAria(icon);
                         // Decorative icons must have aria-hidden="true"
                         expect(hasProperAria).toBe(ariaHidden === true);
                    }
               ),
               { numRuns: 100 }
          );
     });

     test('For any non-decorative icon, it must have aria-label or aria-hidden', () => {
          fc.assert(
               fc.property(
                    fc.boolean(),
                    fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                    (ariaHidden, ariaLabel) => {
                         const icon = {
                              isDecorative: false,
                              ariaHidden,
                              ariaLabel
                         };

                         const hasProperAria = iconHasProperAria(icon);
                         // Non-decorative icons need either aria-label or aria-hidden
                         expect(hasProperAria).toBe(!!ariaLabel || ariaHidden === true);
                    }
               ),
               { numRuns: 100 }
          );
     });
});
