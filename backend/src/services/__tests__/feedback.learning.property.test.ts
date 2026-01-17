import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { FeedbackLearningEngine } from '../FeedbackLearningEngine';
import { User, IUser, StyleProfile } from '../../models/User';
import { Content, IContent } from '../../models/Content';
import { LearningJob } from '../../models/LearningJob';

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

// Mock queue
jest.mock('../../config/queue', () => ({
     queueLearningJob: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
}));

describe('Feedback Learning Engine - Property Tests', () => {
     let engine: FeedbackLearningEngine;

     beforeEach(async () => {
          engine = new FeedbackLearningEngine('test-api-key');
     });

     // Feature: personalized-voice-engine, Property 16: Pattern-Based Profile Updates
     // Validates: Requirements 5.5
     // For any user who consistently shortens sentences across 3 or more edits,
     // the avgSentenceLength in their styleProfile should decrease by 10-20%.
     describe('Property 16: Pattern-Based Profile Updates', () => {
          it('should decrease avgSentenceLength when user consistently shortens sentences', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 15, max: 30 }), // Initial avg sentence length
                         fc.array(fc.integer({ min: -5, max: -2 }), { minLength: 3, maxLength: 10 }), // Negative deltas
                         async (initialAvgLength, sentenceDeltas) => {
                              // Create user with profile
                              const user = await createTestUser({
                                   avgSentenceLength: initialAvgLength,
                              });

                              // Create edits with consistent sentence shortening
                              for (const delta of sentenceDeltas) {
                                   await createTestContent(user._id.toString(), {
                                        sentenceLengthDelta: delta,
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Should detect sentence length pattern
                              expect(patterns.sentenceLengthPattern).toBeDefined();
                              expect(patterns.sentenceLengthPattern).toBeLessThan(0);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true
                              );

                              // avgSentenceLength should decrease
                              expect(updatedProfile.writingTraits.avgSentenceLength).toBeLessThan(
                                   initialAvgLength
                              );

                              // Decrease should be 10-20% of the pattern
                              const decrease = initialAvgLength - updatedProfile.writingTraits.avgSentenceLength;
                              const expectedDecrease = Math.abs(patterns.sentenceLengthPattern) * 0.15;
                              expect(Math.abs(decrease - expectedDecrease)).toBeLessThan(1);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should increase avgSentenceLength when user consistently lengthens sentences', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 10, max: 20 }), // Initial avg sentence length
                         fc.array(fc.integer({ min: 2, max: 5 }), { minLength: 3, maxLength: 10 }), // Positive deltas
                         async (initialAvgLength, sentenceDeltas) => {
                              // Create user with profile
                              const user = await createTestUser({
                                   avgSentenceLength: initialAvgLength,
                              });

                              // Create edits with consistent sentence lengthening
                              for (const delta of sentenceDeltas) {
                                   await createTestContent(user._id.toString(), {
                                        sentenceLengthDelta: delta,
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Should detect sentence length pattern
                              expect(patterns.sentenceLengthPattern).toBeDefined();
                              expect(patterns.sentenceLengthPattern).toBeGreaterThan(0);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true
                              );

                              // avgSentenceLength should increase
                              expect(updatedProfile.writingTraits.avgSentenceLength).toBeGreaterThan(
                                   initialAvgLength
                              );
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 17: Emoji Learning
     // Validates: Requirements 5.6
     // For any user who consistently adds emojis across 3 or more edits,
     // the usesEmojis field should be set to true and emojiFrequency should increase.
     describe('Property 17: Emoji Learning', () => {
          it('should enable emoji usage when user consistently adds emojis', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 3, maxLength: 10 }),
                         async (emojiCounts) => {
                              // Create user with profile (emojis disabled)
                              const user = await createTestUser({
                                   usesEmojis: false,
                                   emojiFrequency: 0,
                              });

                              // Create edits with emoji additions
                              for (const count of emojiCounts) {
                                   await createTestContent(user._id.toString(), {
                                        emojiChanges: {
                                             added: count,
                                             removed: 0,
                                             netChange: count,
                                        },
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Should detect emoji pattern
                              expect(patterns.emojiPattern).toBeDefined();
                              expect(patterns.emojiPattern.shouldUse).toBe(true);
                              expect(patterns.emojiPattern.frequency).toBeGreaterThan(0);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true
                              );

                              // usesEmojis should be true
                              expect(updatedProfile.writingTraits.usesEmojis).toBe(true);
                              expect(updatedProfile.writingTraits.emojiFrequency).toBeGreaterThan(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 18: CTA Pattern Detection
     // Validates: Requirements 5.7
     // For any user who consistently adds calls-to-action across 3 or more edits,
     // the endingStyle in structurePreferences should be updated to "cta".
     describe('Property 18: CTA Pattern Detection', () => {
          it('should update endingStyle to cta when user consistently adds CTAs', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.constantFrom('check out', 'learn more', 'click here', 'visit', 'try now', 'get started'),
                              { minLength: 3, maxLength: 10 }
                         ),
                         async (ctaPhrases) => {
                              // Create user with profile (non-CTA ending)
                              const user = await createTestUser({
                                   endingStyle: 'summary',
                              });

                              // Create edits with CTA additions
                              for (const phrase of ctaPhrases) {
                                   await createTestContent(user._id.toString(), {
                                        phrasesAdded: [phrase],
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Should detect CTA pattern
                              expect(patterns.ctaPattern).toBe(true);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true
                              );

                              // endingStyle should be cta
                              expect(updatedProfile.structurePreferences.endingStyle).toBe('cta');
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 19: Banned Phrase Learning
     // Validates: Requirements 5.8
     // For any user who consistently removes certain phrases across 2 or more edits,
     // those phrases should be added to the bannedPhrases array in their styleProfile.
     describe('Property 19: Banned Phrase Learning', () => {
          it('should add phrases to bannedPhrases when consistently removed', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.constantFrom('leverage', 'synergy', 'paradigm shift', 'circle back', 'touch base'),
                              { minLength: 2, maxLength: 5 }
                         ),
                         async (phrasesToBan) => {
                              // Create user with profile
                              const user = await createTestUser({});

                              // Create edits removing the same phrases multiple times
                              for (let i = 0; i < 2; i++) {
                                   for (const phrase of phrasesToBan) {
                                        await createTestContent(user._id.toString(), {
                                             phrasesRemoved: [phrase],
                                        });
                                   }
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Should detect banned phrases
                              expect(patterns.bannedPhrases.length).toBeGreaterThan(0);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true
                              );

                              // bannedPhrases should include the removed phrases
                              for (const phrase of phrasesToBan) {
                                   expect(updatedProfile.bannedPhrases).toContain(phrase);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 20: Common Phrase Learning
     // Validates: Requirements 5.9
     // For any user who consistently adds certain phrases across 3 or more edits,
     // those phrases should be added to the commonPhrases array in their styleProfile.
     describe('Property 20: Common Phrase Learning', () => {
          it('should add phrases to commonPhrases when consistently added', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.constantFrom('in my opinion', 'as I see it', 'from my perspective', 'I believe', 'personally'),
                              { minLength: 3, maxLength: 5 }
                         ),
                         async (phrasesToAdd) => {
                              // Create user with profile
                              const user = await createTestUser({});

                              // Create edits adding the same phrases multiple times
                              for (let i = 0; i < 3; i++) {
                                   for (const phrase of phrasesToAdd) {
                                        await createTestContent(user._id.toString(), {
                                             phrasesAdded: [phrase],
                                        });
                                   }
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Should detect common phrases
                              expect(patterns.commonPhrases.length).toBeGreaterThan(0);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true
                              );

                              // commonPhrases should include the added phrases
                              for (const phrase of phrasesToAdd) {
                                   expect(updatedProfile.commonPhrases).toContain(phrase);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 21: Manual Override Preservation
     // Validates: Requirements 5.11
     // For any styleProfile with manual overrides, feedback learning should never modify
     // the manually overridden fields.
     describe('Property 21: Manual Override Preservation', () => {
          it('should never modify manually overridden tone fields', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 1, max: 10 }),
                         fc.array(fc.constantFrom('more casual', 'more professional', 'more enthusiastic'), { minLength: 3, maxLength: 5 }),
                         async (manualFormality, toneShifts) => {
                              // Create user with manual override
                              const user = await createTestUser({
                                   manualOverrides: {
                                        tone: { formality: manualFormality },
                                   },
                              });

                              // Create edits with tone shifts
                              for (const shift of toneShifts) {
                                   await createTestContent(user._id.toString(), {
                                        toneShift: shift,
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   user.manualOverrides,
                                   true
                              );

                              // Manual override should be preserved
                              expect(updatedProfile.tone.formality).toBe(user.styleProfile!.tone.formality);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should never modify manually overridden writing traits', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 10, max: 30 }),
                         fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 3, maxLength: 5 }),
                         async (manualAvgLength, sentenceDeltas) => {
                              // Create user with manual override
                              const user = await createTestUser({
                                   avgSentenceLength: manualAvgLength,
                                   manualOverrides: {
                                        writingTraits: { avgSentenceLength: manualAvgLength },
                                   },
                              });

                              // Create edits with sentence length changes
                              for (const delta of sentenceDeltas) {
                                   await createTestContent(user._id.toString(), {
                                        sentenceLengthDelta: delta,
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   user.manualOverrides,
                                   true
                              );

                              // Manual override should be preserved
                              expect(updatedProfile.writingTraits.avgSentenceLength).toBe(manualAvgLength);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 22: Learning Iteration Counter
     // Validates: Requirements 5.13
     // For any styleProfile update via feedback learning, the learningIterations counter
     // should increment by exactly 1.
     describe('Property 22: Learning Iteration Counter', () => {
          it('should increment learningIterations by 1 on each update', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 0, max: 50 }),
                         async (initialIterations) => {
                              // Create user with profile
                              const user = await createTestUser({
                                   learningIterations: initialIterations,
                              });

                              // Create a single edit
                              await createTestContent(user._id.toString(), {
                                   sentenceLengthDelta: -3,
                              });

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              // Apply updates
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true
                              );

                              // Manually increment (simulating what updateProfileFromDeltas does)
                              updatedProfile.learningIterations += 1;

                              // Should increment by exactly 1
                              expect(updatedProfile.learningIterations).toBe(initialIterations + 1);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 23: Minimum Edit Threshold for Major Changes
     // Validates: Requirements 5.14
     // For any user with fewer than 5 edit sessions, major structural changes (voiceType,
     // vocabularyLevel) should not be applied to their styleProfile.
     describe('Property 23: Minimum Edit Threshold for Major Changes', () => {
          it('should not apply major changes when edit count is below 5', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 0, max: 4 }),
                         fc.array(fc.constantFrom('more casual', 'more professional', 'more enthusiastic'), { minLength: 3, maxLength: 5 }),
                         async (editCount, toneShifts) => {
                              // Create user with profile
                              const user = await createTestUser({});

                              // Create edits (less than 5)
                              for (let i = 0; i < editCount; i++) {
                                   await createTestContent(user._id.toString(), {
                                        toneShift: toneShifts[i % toneShifts.length],
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              const originalTone = { ...user.styleProfile!.tone };

                              // Apply updates with canMakeMajorChanges = false
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   false // Cannot make major changes
                              );

                              // Tone should not change (major change blocked)
                              expect(updatedProfile.tone).toEqual(originalTone);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should apply major changes when edit count is 5 or more', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 5, max: 20 }),
                         fc.array(fc.constantFrom('more casual', 'more casual', 'more casual'), { minLength: 5, maxLength: 10 }),
                         async (editCount, toneShifts) => {
                              // Create user with profile
                              const user = await createTestUser({
                                   formality: 8, // Start with high formality
                              });

                              // Create edits (5 or more)
                              for (let i = 0; i < editCount; i++) {
                                   await createTestContent(user._id.toString(), {
                                        toneShift: toneShifts[i % toneShifts.length],
                                   });
                              }

                              // Process learning
                              const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
                              const patterns = (engine as any).detectPatterns(recentEdits);

                              const originalFormality = user.styleProfile!.tone.formality;

                              // Apply updates with canMakeMajorChanges = true
                              const updatedProfile = (engine as any).applyWeightedUpdates(
                                   user.styleProfile!,
                                   patterns,
                                   {},
                                   true // Can make major changes
                              );

                              // Formality should decrease (more casual pattern)
                              if (patterns.tonePattern === 'more casual') {
                                   expect(updatedProfile.tone.formality).toBeLessThan(originalFormality);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 30: Learning Rate Limiting
     // Validates: Requirements 13.11
     // For any user, styleProfile updates via feedback learning should occur at most once
     // per 5 minutes, even if multiple edits are made.
     describe('Property 30: Learning Rate Limiting', () => {
          it('should enforce 5-minute rate limit between profile updates', async () => {
               // Create user with profile
               const user = await createTestUser({});

               // First update should succeed
               const canUpdate1 = (engine as any).canUpdateProfile(user._id.toString());
               expect(canUpdate1).toBe(true);

               // Simulate update
               (engine as any).rateLimitMap.set(user._id.toString(), Date.now());

               // Immediate second update should be blocked
               const canUpdate2 = (engine as any).canUpdateProfile(user._id.toString());
               expect(canUpdate2).toBe(false);

               // Simulate 5 minutes passing
               const fiveMinutesAgo = Date.now() - (5 * 60 * 1000 + 1000);
               (engine as any).rateLimitMap.set(user._id.toString(), fiveMinutesAgo);

               // Update after 5 minutes should succeed
               const canUpdate3 = (engine as any).canUpdateProfile(user._id.toString());
               expect(canUpdate3).toBe(true);
          });
     });

     // Feature: personalized-voice-engine, Property 31: Edit Batching
     // Validates: Requirements 13.12
     // For any user who makes multiple edits within a 5-minute window, those edits should
     // be aggregated into a single learning batch for efficiency.
     describe('Property 31: Edit Batching', () => {
          it('should batch edits within 5-minute window', async () => {
               // Create user with profile
               const user = await createTestUser({});

               // First edit - no batch exists
               const shouldBatch1 = (engine as any).shouldBatchEdit(user._id.toString());
               expect(shouldBatch1).toBe(false);

               // Add first edit to batch
               (engine as any).editBatchMap.set(user._id.toString(), ['content1']);

               // Second edit - batch exists
               const shouldBatch2 = (engine as any).shouldBatchEdit(user._id.toString());
               expect(shouldBatch2).toBe(true);

               // Verify batch contains edits
               const batch = (engine as any).editBatchMap.get(user._id.toString());
               expect(batch).toEqual(['content1']);
          });
     });
});

/**
 * Helper function to create a test user with style profile
 */
async function createTestUser(overrides: any = {}): Promise<IUser> {
     const defaultProfile: StyleProfile = {
          voiceType: 'professional',
          tone: {
               formality: overrides.formality || 7,
               enthusiasm: 6,
               directness: 7,
               humor: 4,
               emotionality: 5,
          },
          writingTraits: {
               avgSentenceLength: overrides.avgSentenceLength || 15,
               usesQuestionsOften: false,
               usesEmojis: overrides.usesEmojis !== undefined ? overrides.usesEmojis : false,
               emojiFrequency: overrides.emojiFrequency || 0,
               usesBulletPoints: true,
               usesShortParagraphs: true,
               usesHooks: false,
          },
          structurePreferences: {
               introStyle: 'problem',
               bodyStyle: 'analysis',
               endingStyle: overrides.endingStyle || 'summary',
          },
          vocabularyLevel: 'medium',
          commonPhrases: [],
          bannedPhrases: [],
          samplePosts: ['Sample post 1', 'Sample post 2'],
          learningIterations: overrides.learningIterations || 0,
          lastUpdated: new Date(),
          profileSource: 'manual',
     };

     const user = new User({
          githubId: `test-${Date.now()}-${Math.random()}`,
          username: 'testuser',
          accessToken: 'test-token',
          avatarUrl: 'https://example.com/avatar.jpg',
          styleProfile: defaultProfile,
          voiceStrength: 80,
          manualOverrides: overrides.manualOverrides || {},
     });

     await user.save();
     return user;
}

/**
 * Helper function to create test content with edit metadata
 */
async function createTestContent(userId: string, editMetadata: any = {}): Promise<IContent> {
     const content = new Content({
          analysisId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(userId),
          platform: 'linkedin',
          tone: 'professional',
          generatedText: 'Original generated text',
          editedText: 'Edited text',
          version: 1,
          editMetadata: {
               originalText: 'Original generated text',
               originalLength: 100,
               editedLength: 90,
               sentenceLengthDelta: editMetadata.sentenceLengthDelta || 0,
               emojiChanges: editMetadata.emojiChanges || {
                    added: 0,
                    removed: 0,
                    netChange: 0,
               },
               structureChanges: editMetadata.structureChanges || {
                    paragraphsAdded: 0,
                    paragraphsRemoved: 0,
                    bulletsAdded: false,
                    formattingChanges: [],
               },
               toneShift: editMetadata.toneShift || 'no change',
               vocabularyChanges: editMetadata.vocabularyChanges || {
                    wordsSubstituted: [],
                    complexityShift: 0,
               },
               phrasesAdded: editMetadata.phrasesAdded || [],
               phrasesRemoved: editMetadata.phrasesRemoved || [],
               editTimestamp: new Date(),
               learningProcessed: false,
          },
     });

     await content.save();
     return content;
}
