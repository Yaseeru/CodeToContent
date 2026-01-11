import { render, screen, fireEvent } from '@testing-library/react';
import fc from 'fast-check';
import ToneSelector from '../ToneSelector';

// Feature: code-to-content, Property 13: Tone Selection Effect
// Validates: Requirements 5.2

describe('ToneSelector Property Tests', () => {
     test('Property 13: For any tone selection (predefined or custom), the system should pass the tone parameter to the callback', () => {
          fc.assert(
               fc.property(
                    fc.oneof(
                         fc.constantFrom(
                              'Professional',
                              'Casual',
                              'Confident',
                              'Funny',
                              'Meme',
                              'Thoughtful',
                              'Educational'
                         ),
                         fc.string({ minLength: 1, maxLength: 50 })
                    ),
                    (tone) => {
                         let capturedTone: string | null = null;
                         const handleToneChange = (t: string) => {
                              capturedTone = t;
                         };

                         const { container, unmount } = render(
                              <ToneSelector onToneChange={handleToneChange} />
                         );

                         // Check if tone is a predefined tone
                         const predefinedTones = [
                              'Professional',
                              'Casual',
                              'Confident',
                              'Funny',
                              'Meme',
                              'Thoughtful',
                              'Educational',
                         ];

                         if (predefinedTones.includes(tone)) {
                              // Click the predefined tone button
                              const button = screen.getByText(tone);
                              fireEvent.click(button);
                         } else {
                              // Enter custom tone
                              const input = screen.getByPlaceholderText(
                                   /e.g., Inspirational and motivating/i
                              );
                              fireEvent.change(input, { target: { value: tone } });
                         }

                         // Verify the tone was passed to the callback
                         expect(capturedTone).toBe(tone);

                         unmount();
                    }
               ),
               { numRuns: 100 }
          );
     });
});
