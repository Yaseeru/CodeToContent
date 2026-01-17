import * as fc from 'fast-check';
import { StyleDeltaExtractionService } from '../StyleDeltaExtractionService';

// Mock Gemini API for testing
jest.mock('@google/genai', () => {
     return {
          GoogleGenAI: jest.fn().mockImplementation(() => ({
               models: {
                    generateContent: jest.fn().mockResolvedValue({
                         text: 'no change',
                    }),
               },
          })),
     };
});

describe('Style Delta Extraction Service - Property Tests', () => {
     let service: StyleDeltaExtractionService;

     beforeEach(() => {
          service = new StyleDeltaExtractionService('test-api-key');
     });

     // Feature: personalized-voice-engine, Property 14: Sentence Length Delta Calculation
     // Validates: Requirements 11.4
     // For any content edit, the calculated sentence length delta should equal the difference
     // between the average sentence length of the edited version and the original version.
     describe('Property 14: Sentence Length Delta Calculation', () => {
          it('should calculate sentence length delta as difference of averages', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
                         fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
                         async (originalSentences, editedSentences) => {
                              // Build texts from sentences
                              const original = originalSentences.join('. ') + '.';
                              const edited = editedSentences.join('. ') + '.';

                              // Extract delta
                              const delta = await service.extractDeltas(original, edited);

                              // Calculate expected delta manually
                              const originalAvg = calculateAvgSentenceLength(original);
                              const editedAvg = calculateAvgSentenceLength(edited);
                              const expectedDelta = editedAvg - originalAvg;

                              // Allow small floating point error
                              expect(Math.abs(delta.sentenceLengthDelta - expectedDelta)).toBeLessThan(0.1);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should return zero delta for identical texts', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 50, maxLength: 500 }),
                         async (text) => {
                              const delta = await service.extractDeltas(text, text);
                              expect(delta.sentenceLengthDelta).toBe(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should return positive delta when edited has longer sentences', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.array(fc.constantFrom('word', 'test', 'hello', 'world', 'code'), { minLength: 2, maxLength: 5 })
                                   .map(words => words.join(' ')),
                              { minLength: 3, maxLength: 10 }
                         ),
                         fc.array(
                              fc.array(fc.constantFrom('word', 'test', 'hello', 'world', 'code', 'example', 'sentence', 'longer', 'text', 'content'), { minLength: 8, maxLength: 15 })
                                   .map(words => words.join(' ')),
                              { minLength: 3, maxLength: 10 }
                         ),
                         async (shortSentences, longSentences) => {
                              const original = shortSentences.join('. ') + '.';
                              const edited = longSentences.join('. ') + '.';

                              const delta = await service.extractDeltas(original, edited);

                              // Edited should have longer sentences, so delta should be positive
                              expect(delta.sentenceLengthDelta).toBeGreaterThan(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should return negative delta when edited has shorter sentences', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.array(fc.constantFrom('word', 'test', 'hello', 'world', 'code', 'example', 'sentence', 'longer', 'text', 'content'), { minLength: 8, maxLength: 15 })
                                   .map(words => words.join(' ')),
                              { minLength: 3, maxLength: 10 }
                         ),
                         fc.array(
                              fc.array(fc.constantFrom('word', 'test', 'hello', 'world', 'code'), { minLength: 2, maxLength: 5 })
                                   .map(words => words.join(' ')),
                              { minLength: 3, maxLength: 10 }
                         ),
                         async (longSentences, shortSentences) => {
                              const original = longSentences.join('. ') + '.';
                              const edited = shortSentences.join('. ') + '.';

                              const delta = await service.extractDeltas(original, edited);

                              // Edited should have shorter sentences, so delta should be negative
                              expect(delta.sentenceLengthDelta).toBeLessThan(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 15: Emoji Change Detection
     // Validates: Requirements 11.5
     // For any content edit, the emoji change count should accurately reflect the number of emojis
     // added minus the number removed, with separate counts for additions and removals.
     describe('Property 15: Emoji Change Detection', () => {
          it('should accurately count emoji additions and removals', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 20, maxLength: 100 }),
                         fc.array(fc.constantFrom('😀', '🎉', '👍', '❤️', '🔥', '💯', '✨', '🚀'), { maxLength: 10 }),
                         fc.array(fc.constantFrom('😀', '🎉', '👍', '❤️', '🔥', '💯', '✨', '🚀'), { maxLength: 10 }),
                         async (baseText, originalEmojis, editedEmojis) => {
                              const original = baseText + ' ' + originalEmojis.join('');
                              const edited = baseText + ' ' + editedEmojis.join('');

                              const delta = await service.extractDeltas(original, edited);

                              const expectedNet = editedEmojis.length - originalEmojis.length;

                              expect(delta.emojiChanges.netChange).toBe(expectedNet);
                              expect(delta.emojiChanges.added).toBeGreaterThanOrEqual(0);
                              expect(delta.emojiChanges.removed).toBeGreaterThanOrEqual(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should return zero changes for texts with no emojis', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 50, maxLength: 200 }).filter(s => !/[\u{1F600}-\u{1F64F}]/u.test(s)),
                         fc.string({ minLength: 50, maxLength: 200 }).filter(s => !/[\u{1F600}-\u{1F64F}]/u.test(s)),
                         async (original, edited) => {
                              const delta = await service.extractDeltas(original, edited);

                              expect(delta.emojiChanges.added).toBe(0);
                              expect(delta.emojiChanges.removed).toBe(0);
                              expect(delta.emojiChanges.netChange).toBe(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should detect emoji additions correctly', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 20, maxLength: 100 }),
                         fc.array(fc.constantFrom('😀', '🎉', '👍', '❤️', '🔥'), { minLength: 1, maxLength: 5 }),
                         async (baseText, emojisToAdd) => {
                              const original = baseText;
                              const edited = baseText + ' ' + emojisToAdd.join('');

                              const delta = await service.extractDeltas(original, edited);

                              expect(delta.emojiChanges.added).toBe(emojisToAdd.length);
                              expect(delta.emojiChanges.removed).toBe(0);
                              expect(delta.emojiChanges.netChange).toBe(emojisToAdd.length);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should detect emoji removals correctly', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 20, maxLength: 100 }),
                         fc.array(fc.constantFrom('😀', '🎉', '👍', '❤️', '🔥'), { minLength: 1, maxLength: 5 }),
                         async (baseText, emojisToRemove) => {
                              const original = baseText + ' ' + emojisToRemove.join('');
                              const edited = baseText;

                              const delta = await service.extractDeltas(original, edited);

                              expect(delta.emojiChanges.added).toBe(0);
                              expect(delta.emojiChanges.removed).toBe(emojisToRemove.length);
                              expect(delta.emojiChanges.netChange).toBe(-emojisToRemove.length);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should handle mixed emoji additions and removals', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 20, maxLength: 100 }),
                         fc.array(fc.constantFrom('😀', '🎉', '👍'), { minLength: 1, maxLength: 3 }),
                         fc.array(fc.constantFrom('❤️', '🔥', '💯'), { minLength: 1, maxLength: 3 }),
                         async (baseText, originalEmojis, newEmojis) => {
                              const original = baseText + ' ' + originalEmojis.join('');
                              const edited = baseText + ' ' + newEmojis.join('');

                              const delta = await service.extractDeltas(original, edited);

                              const expectedNet = newEmojis.length - originalEmojis.length;
                              expect(delta.emojiChanges.netChange).toBe(expectedNet);

                              // Net change should equal added minus removed
                              expect(delta.emojiChanges.netChange).toBe(
                                   delta.emojiChanges.added - delta.emojiChanges.removed
                              );
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });
});

/**
 * Helper function to calculate average sentence length
 */
function calculateAvgSentenceLength(text: string): number {
     if (!text || text.trim().length === 0) {
          return 0;
     }

     const sentences = text
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);

     if (sentences.length === 0) {
          return 0;
     }

     const totalWords = sentences.reduce((sum, sentence) => {
          const words = sentence.split(/\s+/).filter(w => w.length > 0);
          return sum + words.length;
     }, 0);

     return totalWords / sentences.length;
}
