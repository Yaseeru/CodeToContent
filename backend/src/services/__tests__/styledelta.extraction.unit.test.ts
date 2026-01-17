import { StyleDeltaExtractionService } from '../StyleDeltaExtractionService';

// Mock Gemini API for testing
jest.mock('@google/genai', () => {
     return {
          GoogleGenAI: jest.fn().mockImplementation(() => ({
               models: {
                    generateContent: jest.fn().mockResolvedValue({
                         text: 'more casual',
                    }),
               },
          })),
     };
});

describe('Style Delta Extraction Service - Unit Tests', () => {
     let service: StyleDeltaExtractionService;

     beforeEach(() => {
          service = new StyleDeltaExtractionService('test-api-key');
     });

     describe('Sentence Length Calculation', () => {
          it('should calculate correct sentence length delta with known inputs', async () => {
               const original = 'This is short. Very brief. Quick.';
               const edited = 'This is a much longer sentence with many more words. Another lengthy sentence here. And one more extended sentence.';

               const delta = await service.extractDeltas(original, edited);

               // Original avg: (3 + 2 + 1) / 3 = 2 words per sentence
               // Edited avg: (10 + 4 + 5) / 3 = 6.33 words per sentence
               // Delta should be positive (around 4.33)
               expect(delta.sentenceLengthDelta).toBeGreaterThan(4);
               expect(delta.sentenceLengthDelta).toBeLessThan(5);
          });

          it('should return zero delta for identical sentence lengths', async () => {
               const original = 'This is a sentence. Another sentence here. One more sentence.';
               const edited = 'Different words here. But same length. Three words each.';

               const delta = await service.extractDeltas(original, edited);

               // Both have 3 words per sentence on average
               expect(Math.abs(delta.sentenceLengthDelta)).toBeLessThan(0.5);
          });

          it('should handle single sentence texts', async () => {
               const original = 'This is one long sentence with many words.';
               const edited = 'Short sentence.';

               const delta = await service.extractDeltas(original, edited);

               // Original: 8 words, Edited: 2 words
               // Delta should be negative (around -6)
               expect(delta.sentenceLengthDelta).toBeLessThan(-5);
          });
     });

     describe('Emoji Counting', () => {
          it('should count various emoji types correctly', async () => {
               const original = 'Hello world';
               const edited = 'Hello world 😀 🎉 👍 ❤️ 🔥';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.emojiChanges.added).toBe(5);
               expect(delta.emojiChanges.removed).toBe(0);
               expect(delta.emojiChanges.netChange).toBe(5);
          });

          it('should detect emoji removals', async () => {
               const original = 'Hello 😀 world 🎉 test 👍';
               const edited = 'Hello world test';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.emojiChanges.added).toBe(0);
               expect(delta.emojiChanges.removed).toBe(3);
               expect(delta.emojiChanges.netChange).toBe(-3);
          });

          it('should handle emoji substitutions', async () => {
               const original = 'Hello 😀 world 🎉';
               const edited = 'Hello 👍 world ❤️ test 🔥';

               const delta = await service.extractDeltas(original, edited);

               // 2 original emojis, 3 edited emojis, net = +1
               expect(delta.emojiChanges.netChange).toBe(1);
               expect(delta.emojiChanges.added).toBe(1);
               expect(delta.emojiChanges.removed).toBe(0);
          });

          it('should handle texts with no emojis', async () => {
               const original = 'Hello world';
               const edited = 'Goodbye world';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.emojiChanges.added).toBe(0);
               expect(delta.emojiChanges.removed).toBe(0);
               expect(delta.emojiChanges.netChange).toBe(0);
          });
     });

     describe('Structure Change Detection', () => {
          it('should detect paragraph additions', async () => {
               const original = 'This is one paragraph.';
               const edited = 'This is one paragraph.\n\nThis is a second paragraph.\n\nAnd a third paragraph.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.structureChanges.paragraphsAdded).toBe(2);
               expect(delta.structureChanges.paragraphsRemoved).toBe(0);
          });

          it('should detect paragraph removals', async () => {
               const original = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
               const edited = 'First paragraph.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.structureChanges.paragraphsAdded).toBe(0);
               expect(delta.structureChanges.paragraphsRemoved).toBe(2);
          });

          it('should detect bullet point additions', async () => {
               const original = 'This is regular text.';
               const edited = 'This is regular text.\n- First bullet\n- Second bullet\n- Third bullet';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.structureChanges.bulletsAdded).toBe(true);
               expect(delta.structureChanges.formattingChanges).toContain('bullets_added');
          });

          it('should detect bullet point removals', async () => {
               const original = 'Text with bullets:\n- First bullet\n- Second bullet';
               const edited = 'Text without bullets.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.structureChanges.bulletsAdded).toBe(false);
               expect(delta.structureChanges.formattingChanges).toContain('bullets_removed');
          });

          it('should detect numbered lists', async () => {
               const original = 'Regular text.';
               const edited = 'Text with list:\n1. First item\n2. Second item\n3. Third item';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.structureChanges.bulletsAdded).toBe(true);
          });

          it('should handle texts with no structure changes', async () => {
               const original = 'This is a simple paragraph.';
               const edited = 'This is another simple paragraph.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.structureChanges.paragraphsAdded).toBe(0);
               expect(delta.structureChanges.paragraphsRemoved).toBe(0);
               expect(delta.structureChanges.bulletsAdded).toBe(false);
          });
     });

     describe('Phrase Extraction', () => {
          it('should detect added phrases', async () => {
               const original = 'This is the original text.';
               const edited = 'This is the original text. Let me explain something new. Here is the thing.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.phrasesAdded.length).toBeGreaterThan(0);
               // Should include phrases like "let me explain", "here is the"
               const hasNewPhrase = delta.phrasesAdded.some(p =>
                    p.includes('let me') || p.includes('here is')
               );
               expect(hasNewPhrase).toBe(true);
          });

          it('should detect removed phrases', async () => {
               const original = 'Let me explain this concept. Here is the thing you need to know.';
               const edited = 'Simple explanation.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.phrasesRemoved.length).toBeGreaterThan(0);
               // Should include phrases from original
               const hasRemovedPhrase = delta.phrasesRemoved.some(p =>
                    p.includes('let me') || p.includes('here is')
               );
               expect(hasRemovedPhrase).toBe(true);
          });

          it('should handle texts with no phrase changes', async () => {
               const original = 'Hello world test.';
               const edited = 'Hello world test.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.phrasesAdded.length).toBe(0);
               expect(delta.phrasesRemoved.length).toBe(0);
          });
     });

     describe('Vocabulary Change Detection', () => {
          it('should detect word substitutions', async () => {
               const original = 'The quick brown fox jumps over the lazy dog.';
               const edited = 'The fast brown fox leaps over the sleepy dog.';

               const delta = await service.extractDeltas(original, edited);

               expect(delta.vocabularyChanges.wordsSubstituted.length).toBeGreaterThan(0);
               // Should detect substitutions like quick->fast, jumps->leaps, lazy->sleepy
               const hasSubstitution = delta.vocabularyChanges.wordsSubstituted.some(sub =>
                    (sub.from === 'quick' && sub.to === 'fast') ||
                    (sub.from === 'jumps' && sub.to === 'leaps') ||
                    (sub.from === 'lazy' && sub.to === 'sleepy')
               );
               expect(hasSubstitution).toBe(true);
          });

          it('should detect complexity increase', async () => {
               const original = 'I like to code. It is fun.';
               const edited = 'I appreciate programming. It is intellectually stimulating.';

               const delta = await service.extractDeltas(original, edited);

               // Edited uses longer words, so complexity should increase
               expect(delta.vocabularyChanges.complexityShift).toBe(1);
          });

          it('should detect complexity decrease', async () => {
               const original = 'I appreciate the sophisticated implementation.';
               const edited = 'I like the good code.';

               const delta = await service.extractDeltas(original, edited);

               // Edited uses shorter words, so complexity should decrease
               expect(delta.vocabularyChanges.complexityShift).toBe(-1);
          });

          it('should detect no complexity change', async () => {
               const original = 'This is a test sentence.';
               const edited = 'This is a demo sentence.';

               const delta = await service.extractDeltas(original, edited);

               // Similar word lengths, no complexity change
               expect(delta.vocabularyChanges.complexityShift).toBe(0);
          });
     });

     describe('Tone Shift Classification', () => {
          it('should classify tone shift using Gemini', async () => {
               const original = 'The implementation is functional.';
               const edited = 'The implementation works great!';

               const delta = await service.extractDeltas(original, edited);

               // Mocked to return 'more casual'
               expect(delta.toneShift).toBe('more casual');
          });

          it('should handle Gemini API failures gracefully', async () => {
               // Mock Gemini to throw error
               const mockAI = {
                    models: {
                         generateContent: jest.fn().mockRejectedValue(new Error('API error')),
                    },
               };
               (service as any).ai = mockAI;

               const original = 'Test text.';
               const edited = 'Different text.';

               const delta = await service.extractDeltas(original, edited);

               // Should default to 'no change' on error
               expect(delta.toneShift).toBe('no change');
          });
     });

     describe('Calculate Metrics', () => {
          it('should calculate metrics from style delta', async () => {
               const original = 'Short text.';
               const edited = 'This is a much longer text with more words and different structure.\n\n- Bullet one\n- Bullet two\n\nAnd emojis 😀 🎉';

               const delta = await service.extractDeltas(original, edited);
               const metrics = service.calculateMetrics(delta);

               expect(metrics.totalChanges).toBeGreaterThan(0);
               expect(metrics.significantChanges).toBeGreaterThan(0);
               expect(metrics.changeCategories.length).toBeGreaterThan(0);
               expect(metrics.changeCategories).toContain('sentence_length');
               expect(metrics.changeCategories).toContain('emoji');
               expect(metrics.changeCategories).toContain('structure');
          });

          it('should identify significant changes correctly', async () => {
               const original = 'Test.';
               const edited = 'This is a very long sentence with many many words to make it significantly longer than the original. Another long sentence here. And one more.';

               const delta = await service.extractDeltas(original, edited);
               const metrics = service.calculateMetrics(delta);

               // Sentence length change is significant (> 2 words difference)
               expect(metrics.significantChanges).toBeGreaterThan(0);
               expect(metrics.changeCategories).toContain('sentence_length');
          });

          it('should return zero metrics for identical texts', async () => {
               // Mock Gemini to return 'no change' for this test
               const mockAI = {
                    models: {
                         generateContent: jest.fn().mockResolvedValue({
                              text: 'no change',
                         }),
                    },
               };
               (service as any).ai = mockAI;

               const text = 'This is the same text.';
               const delta = await service.extractDeltas(text, text);
               const metrics = service.calculateMetrics(delta);

               expect(metrics.totalChanges).toBe(0);
               expect(metrics.significantChanges).toBe(0);
               expect(metrics.changeCategories.length).toBe(0);
          });
     });
});
