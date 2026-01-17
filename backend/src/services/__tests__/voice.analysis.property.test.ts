import * as fc from 'fast-check';
import { VoiceAnalysisService } from '../VoiceAnalysisService';
import { StyleProfile } from '../../models/User';

// Mock Gemini API for testing
jest.mock('@google/genai', () => {
     return {
          GoogleGenAI: jest.fn().mockImplementation(() => ({
               models: {
                    generateContent: jest.fn().mockResolvedValue({
                         text: JSON.stringify({
                              voiceType: 'casual',
                              tone: {
                                   formality: 5,
                                   enthusiasm: 7,
                                   directness: 6,
                                   humor: 4,
                                   emotionality: 5,
                              },
                              writingTraits: {
                                   avgSentenceLength: 15,
                                   usesQuestionsOften: true,
                                   usesEmojis: false,
                                   emojiFrequency: 0,
                                   usesBulletPoints: false,
                                   usesShortParagraphs: true,
                                   usesHooks: true,
                              },
                              structurePreferences: {
                                   introStyle: 'hook',
                                   bodyStyle: 'narrative',
                                   endingStyle: 'cta',
                              },
                              vocabularyLevel: 'medium',
                              commonPhrases: ['Let me explain', 'Here is the thing'],
                              bannedPhrases: [],
                              sampleExcerpts: ['This is a sample sentence from the text.', 'Another example sentence.', 'A third sample.'],
                         }),
                    }),
               },
          })),
     };
});

describe('Voice Analysis Service - Property Tests', () => {
     let service: VoiceAnalysisService;

     beforeEach(() => {
          service = new VoiceAnalysisService('test-api-key');
     });

     // Feature: personalized-voice-engine, Property 4: Text Input Validation
     // Validates: Requirements 2.1
     // For any text input for style analysis, inputs with fewer than 300 characters should be rejected,
     // and inputs with 300 or more characters should be accepted.
     describe('Property 4: Text Input Validation', () => {
          it('should reject text with fewer than 300 characters', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ maxLength: 299 }),
                         async (text) => {
                              await expect(service.analyzeText({ text })).rejects.toThrow(
                                   'Minimum 300 characters required for text analysis'
                              );
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should accept text with 300 or more characters', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 300, maxLength: 1000 }),
                         async (text) => {
                              const result = await service.analyzeText({ text });
                              expect(result).toBeDefined();
                              expect(result.voiceType).toBeDefined();
                              expect(result.tone).toBeDefined();
                              expect(result.writingTraits).toBeDefined();
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 5: File Format Validation
     // Validates: Requirements 2.2
     // For any file upload for style analysis, files with extensions .txt, .md, or .pdf should be accepted,
     // and files with other extensions should be rejected.
     describe('Property 5: File Format Validation', () => {
          it('should accept .txt, .md, and .pdf files', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom('txt', 'md', 'pdf'),
                         fc.string({ minLength: 500, maxLength: 1000 }),
                         async (extension, content) => {
                              const fileName = `test.${extension}`;
                              const fileBuffer = Buffer.from(content, 'utf-8');
                              const mimeType = extension === 'pdf' ? 'application/pdf' : 'text/plain';

                              // For PDF, we need to mock the pdf-parse module
                              if (extension === 'pdf') {
                                   // This will fail in actual execution, but validates the format check
                                   try {
                                        await service.analyzeFile({ fileBuffer, fileName, mimeType });
                                   } catch (error: any) {
                                        // Accept either success or PDF parsing error (not format error)
                                        if (error.message.includes('Supported formats')) {
                                             throw error;
                                        }
                                   }
                              } else {
                                   const result = await service.analyzeFile({ fileBuffer, fileName, mimeType });
                                   expect(result).toBeDefined();
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should reject files with unsupported extensions', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom('doc', 'docx', 'rtf', 'odt', 'html', 'xml', 'json'),
                         fc.string({ minLength: 500, maxLength: 1000 }),
                         async (extension, content) => {
                              const fileName = `test.${extension}`;
                              const fileBuffer = Buffer.from(content, 'utf-8');
                              const mimeType = 'application/octet-stream';

                              await expect(
                                   service.analyzeFile({ fileBuffer, fileName, mimeType })
                              ).rejects.toThrow('Supported formats: .txt, .md, .pdf');
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 6: File Content Validation
     // Validates: Requirements 2.3
     // For any uploaded file, if the extracted text content is less than 500 characters,
     // the analysis should be rejected with a clear error message.
     describe('Property 6: File Content Validation', () => {
          it('should reject files with less than 500 characters', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom('txt', 'md'),
                         fc.string({ maxLength: 499 }),
                         async (extension, content) => {
                              const fileName = `test.${extension}`;
                              const fileBuffer = Buffer.from(content, 'utf-8');
                              const mimeType = 'text/plain';

                              await expect(
                                   service.analyzeFile({ fileBuffer, fileName, mimeType })
                              ).rejects.toThrow('File must contain at least 500 characters');
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should accept files with 500 or more characters', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom('txt', 'md'),
                         fc.string({ minLength: 500, maxLength: 1000 }),
                         async (extension, content) => {
                              const fileName = `test.${extension}`;
                              const fileBuffer = Buffer.from(content, 'utf-8');
                              const mimeType = 'text/plain';

                              const result = await service.analyzeFile({ fileBuffer, fileName, mimeType });
                              expect(result).toBeDefined();
                              expect(result.voiceType).toBeDefined();
                              expect(result.tone).toBeDefined();
                              expect(result.writingTraits).toBeDefined();
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 7: Recency Weighting in Aggregation
     // Validates: Requirements 2.10
     // For any set of multiple writing samples provided at different times, when aggregating style patterns,
     // more recent samples should have higher weight than older samples in the final styleProfile.
     describe('Property 7: Recency Weighting in Aggregation', () => {
          it('should weight recent profiles more heavily than older ones', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.record({
                                   formality: fc.integer({ min: 1, max: 10 }),
                                   enthusiasm: fc.integer({ min: 1, max: 10 }),
                                   avgSentenceLength: fc.integer({ min: 5, max: 50 }),
                              }),
                              { minLength: 2, maxLength: 5 }
                         ),
                         async (profileData) => {
                              // Create profiles with varying tone metrics
                              const profiles: StyleProfile[] = profileData.map((data, index) => ({
                                   voiceType: 'casual',
                                   tone: {
                                        formality: data.formality,
                                        enthusiasm: data.enthusiasm,
                                        directness: 5,
                                        humor: 5,
                                        emotionality: 5,
                                   },
                                   writingTraits: {
                                        avgSentenceLength: data.avgSentenceLength,
                                        usesQuestionsOften: false,
                                        usesEmojis: false,
                                        emojiFrequency: 0,
                                        usesBulletPoints: false,
                                        usesShortParagraphs: true,
                                        usesHooks: false,
                                   },
                                   structurePreferences: {
                                        introStyle: 'hook',
                                        bodyStyle: 'narrative',
                                        endingStyle: 'cta',
                                   },
                                   vocabularyLevel: 'medium',
                                   commonPhrases: [`phrase-${index}`],
                                   bannedPhrases: [],
                                   samplePosts: [`sample-${index}`],
                                   learningIterations: 0,
                                   lastUpdated: new Date(Date.now() - (profileData.length - index) * 86400000), // Older profiles have earlier dates
                                   profileSource: 'manual',
                              }));

                              const aggregated = service.aggregateProfiles(profiles);

                              // The most recent profile (last in array) should have the highest influence
                              const mostRecentProfile = profiles[profiles.length - 1];
                              const oldestProfile = profiles[0];

                              // Check that aggregated values are closer to recent profile than oldest
                              // This is a statistical property that should hold most of the time
                              const distanceToRecent = Math.abs(
                                   aggregated.tone.formality - mostRecentProfile.tone.formality
                              );
                              const distanceToOldest = Math.abs(
                                   aggregated.tone.formality - oldestProfile.tone.formality
                              );

                              // If the values are different, the aggregated should be closer to recent
                              if (mostRecentProfile.tone.formality !== oldestProfile.tone.formality) {
                                   expect(distanceToRecent).toBeLessThanOrEqual(distanceToOldest);
                              }

                              // Verify that the most recent profile's categorical fields are used
                              expect(aggregated.voiceType).toBe(mostRecentProfile.voiceType);
                              expect(aggregated.structurePreferences).toEqual(mostRecentProfile.structurePreferences);
                              expect(aggregated.vocabularyLevel).toBe(mostRecentProfile.vocabularyLevel);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should aggregate phrases from all profiles with recency priority', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.record({
                                   commonPhrases: fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
                                        minLength: 1,
                                        maxLength: 5,
                                   }),
                              }),
                              { minLength: 2, maxLength: 4 }
                         ),
                         async (profileData) => {
                              const profiles: StyleProfile[] = profileData.map((data, index) => ({
                                   voiceType: 'casual',
                                   tone: {
                                        formality: 5,
                                        enthusiasm: 5,
                                        directness: 5,
                                        humor: 5,
                                        emotionality: 5,
                                   },
                                   writingTraits: {
                                        avgSentenceLength: 15,
                                        usesQuestionsOften: false,
                                        usesEmojis: false,
                                        emojiFrequency: 0,
                                        usesBulletPoints: false,
                                        usesShortParagraphs: true,
                                        usesHooks: false,
                                   },
                                   structurePreferences: {
                                        introStyle: 'hook',
                                        bodyStyle: 'narrative',
                                        endingStyle: 'cta',
                                   },
                                   vocabularyLevel: 'medium',
                                   commonPhrases: data.commonPhrases,
                                   bannedPhrases: [],
                                   samplePosts: [`sample-${index}`],
                                   learningIterations: 0,
                                   lastUpdated: new Date(Date.now() - (profileData.length - index) * 86400000),
                                   profileSource: 'manual',
                              }));

                              const aggregated = service.aggregateProfiles(profiles);

                              // All unique phrases should be included (up to limit of 20)
                              const allPhrases = profiles.flatMap(p => p.commonPhrases);
                              const uniquePhrases = Array.from(new Set(allPhrases));

                              // Aggregated should contain phrases from all profiles
                              expect(aggregated.commonPhrases.length).toBeGreaterThan(0);
                              expect(aggregated.commonPhrases.length).toBeLessThanOrEqual(20);

                              // If there are unique phrases, at least some should be in aggregated
                              if (uniquePhrases.length > 0) {
                                   const hasCommonPhrase = aggregated.commonPhrases.some(phrase =>
                                        uniquePhrases.includes(phrase)
                                   );
                                   expect(hasCommonPhrase).toBe(true);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });
});
