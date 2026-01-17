import * as fc from 'fast-check';
import { ProfileEvolutionService } from '../ProfileEvolutionService';
import { User, IUser, StyleProfile } from '../../models/User';
import { Content, IContent } from '../../models/Content';
import mongoose from 'mongoose';

describe('Profile Evolution Service - Property Tests', () => {
     let service: ProfileEvolutionService;

     beforeEach(async () => {
          service = new ProfileEvolutionService();
     });

     // Feature: personalized-voice-engine, Property 24: Profile Evolution Score Range
     // Validates: Requirements 10.1
     // For any user, the calculated Profile Evolution Score should be between 0 and 100 inclusive.
     describe('Property 24: Profile Evolution Score Range', () => {
          it('should always return a score between 0 and 100', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.record({
                              hasInitialSamples: fc.boolean(),
                              learningIterations: fc.integer({ min: 0, max: 100 }),
                              samplePostsCount: fc.integer({ min: 0, max: 10 }),
                              commonPhrasesCount: fc.integer({ min: 0, max: 20 }),
                              bannedPhrasesCount: fc.integer({ min: 0, max: 20 }),
                         }),
                         async (profileData) => {
                              // Create a user with a style profile
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                                   styleProfile: {
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
                                        commonPhrases: Array(profileData.commonPhrasesCount)
                                             .fill(0)
                                             .map((_, i) => `phrase-${i}`),
                                        bannedPhrases: Array(profileData.bannedPhrasesCount)
                                             .fill(0)
                                             .map((_, i) => `banned-${i}`),
                                        samplePosts: profileData.hasInitialSamples
                                             ? Array(profileData.samplePostsCount)
                                                  .fill(0)
                                                  .map((_, i) => `sample-${i}`)
                                             : [],
                                        learningIterations: profileData.learningIterations,
                                        lastUpdated: new Date(),
                                        profileSource: 'manual',
                                   },
                              });

                              await user.save();

                              // Calculate evolution score
                              const score = await service.calculateEvolutionScore(user._id.toString());

                              // Verify score is in valid range
                              expect(score).toBeGreaterThanOrEqual(0);
                              expect(score).toBeLessThanOrEqual(100);
                              expect(Number.isInteger(score)).toBe(true);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should return 0 for users without a style profile', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.string({ minLength: 5, maxLength: 20 }),
                         async (username) => {
                              // Create a user without a style profile
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username,
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                              });

                              await user.save();

                              // Calculate evolution score
                              const score = await service.calculateEvolutionScore(user._id.toString());

                              // Should return 0 for users without profile
                              expect(score).toBe(0);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 25: Evolution Score Components
     // Validates: Requirements 10.2
     // For any Profile Evolution Score calculation, the score should consider:
     // presence of initial samples (20 points), number of feedback iterations (40 points),
     // profile completeness (20 points), and consistency of edits (20 points).
     describe('Property 25: Evolution Score Components', () => {
          it('should award 20 points for initial samples', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.boolean(),
                         async (hasInitialSamples) => {
                              // Create user with or without initial samples
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                                   styleProfile: {
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
                                        commonPhrases: [],
                                        bannedPhrases: [],
                                        samplePosts: hasInitialSamples ? ['sample1', 'sample2', 'sample3'] : [],
                                        learningIterations: 0,
                                        lastUpdated: new Date(),
                                        profileSource: 'manual',
                                   },
                              });

                              await user.save();

                              const score = await service.calculateEvolutionScore(user._id.toString());

                              // With initial samples, score should be at least 20 (from samples)
                              // Without initial samples, score should be less than 20
                              if (hasInitialSamples) {
                                   expect(score).toBeGreaterThanOrEqual(20);
                              } else {
                                   expect(score).toBeLessThan(20);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should scale feedback iterations component from 0 to 40 points', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 0, max: 20 }),
                         async (iterations) => {
                              // Create user with varying iterations
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                                   styleProfile: {
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
                                        commonPhrases: [],
                                        bannedPhrases: [],
                                        samplePosts: [],
                                        learningIterations: iterations,
                                        lastUpdated: new Date(),
                                        profileSource: 'manual',
                                   },
                              });

                              await user.save();

                              const score = await service.calculateEvolutionScore(user._id.toString());

                              // Expected iterations component: min(iterations/10, 1) * 40
                              const expectedIterationsScore = Math.min(iterations / 10, 1) * 40;

                              // Score should include the iterations component
                              // (allowing for other components to add to the total)
                              expect(score).toBeGreaterThanOrEqual(Math.floor(expectedIterationsScore));
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should award up to 20 points for profile completeness', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.record({
                              hasCommonPhrases: fc.boolean(),
                              hasBannedPhrases: fc.boolean(),
                         }),
                         async (profileData) => {
                              // Create user with varying completeness
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                                   styleProfile: {
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
                                        commonPhrases: profileData.hasCommonPhrases ? ['phrase1', 'phrase2'] : [],
                                        bannedPhrases: profileData.hasBannedPhrases ? ['banned1'] : [],
                                        samplePosts: [],
                                        learningIterations: 0,
                                        lastUpdated: new Date(),
                                        profileSource: 'manual',
                                   },
                              });

                              await user.save();

                              const score = await service.calculateEvolutionScore(user._id.toString());

                              // Score should be between 0 and 100
                              expect(score).toBeGreaterThanOrEqual(0);
                              expect(score).toBeLessThanOrEqual(100);

                              // More complete profiles should have higher scores
                              // (This is a weak property but validates the component exists)
                              if (profileData.hasCommonPhrases || profileData.hasBannedPhrases) {
                                   expect(score).toBeGreaterThan(0);
                              }
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });

     // Feature: personalized-voice-engine, Property 26: Edit Session Counter Accuracy
     // Validates: Requirements 10.5
     // For any user, the total number of edit sessions tracked should equal the number of
     // unique content items with editMetadata.learningProcessed = true.
     describe('Property 26: Edit Session Counter Accuracy', () => {
          it('should accurately count edit sessions from content with edit metadata', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 0, max: 20 }),
                         async (editCount) => {
                              // Create a user
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                                   styleProfile: {
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
                                        commonPhrases: [],
                                        bannedPhrases: [],
                                        samplePosts: [],
                                        learningIterations: 0,
                                        lastUpdated: new Date(),
                                        profileSource: 'manual',
                                   },
                              });

                              await user.save();

                              // Create a dummy analysis for content
                              const analysisId = new mongoose.Types.ObjectId();

                              // Create content items with edit metadata
                              for (let i = 0; i < editCount; i++) {
                                   const content = new Content({
                                        analysisId,
                                        userId: user._id,
                                        platform: 'linkedin',
                                        tone: 'casual',
                                        generatedText: `Original text ${i}`,
                                        editedText: `Edited text ${i}`,
                                        version: 1,
                                        editMetadata: {
                                             originalText: `Original text ${i}`,
                                             originalLength: 50,
                                             editedLength: 55,
                                             sentenceLengthDelta: 1,
                                             emojiChanges: {
                                                  added: 0,
                                                  removed: 0,
                                                  netChange: 0,
                                             },
                                             structureChanges: {
                                                  paragraphsAdded: 0,
                                                  paragraphsRemoved: 0,
                                                  bulletsAdded: false,
                                                  formattingChanges: [],
                                             },
                                             toneShift: 'no change',
                                             vocabularyChanges: {
                                                  wordsSubstituted: [],
                                                  complexityShift: 0,
                                             },
                                             phrasesAdded: [],
                                             phrasesRemoved: [],
                                             editTimestamp: new Date(Date.now() - i * 86400000),
                                             learningProcessed: true,
                                        },
                                   });

                                   await content.save();
                              }

                              // Get analytics
                              const analytics = await service.getAnalytics(user._id.toString());

                              // Total edits should match the number of content items with edit metadata
                              expect(analytics.totalEdits).toBe(editCount);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);

          it('should not count content without edit metadata', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.record({
                              withMetadata: fc.integer({ min: 0, max: 10 }),
                              withoutMetadata: fc.integer({ min: 0, max: 10 }),
                         }),
                         async (counts) => {
                              // Create a user
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                                   styleProfile: {
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
                                        commonPhrases: [],
                                        bannedPhrases: [],
                                        samplePosts: [],
                                        learningIterations: 0,
                                        lastUpdated: new Date(),
                                        profileSource: 'manual',
                                   },
                              });

                              await user.save();

                              const analysisId = new mongoose.Types.ObjectId();

                              // Create content with edit metadata
                              for (let i = 0; i < counts.withMetadata; i++) {
                                   const content = new Content({
                                        analysisId,
                                        userId: user._id,
                                        platform: 'linkedin',
                                        tone: 'casual',
                                        generatedText: `Original text ${i}`,
                                        editedText: `Edited text ${i}`,
                                        version: 1,
                                        editMetadata: {
                                             originalText: `Original text ${i}`,
                                             originalLength: 50,
                                             editedLength: 55,
                                             sentenceLengthDelta: 1,
                                             emojiChanges: {
                                                  added: 0,
                                                  removed: 0,
                                                  netChange: 0,
                                             },
                                             structureChanges: {
                                                  paragraphsAdded: 0,
                                                  paragraphsRemoved: 0,
                                                  bulletsAdded: false,
                                                  formattingChanges: [],
                                             },
                                             toneShift: 'no change',
                                             vocabularyChanges: {
                                                  wordsSubstituted: [],
                                                  complexityShift: 0,
                                             },
                                             phrasesAdded: [],
                                             phrasesRemoved: [],
                                             editTimestamp: new Date(),
                                             learningProcessed: true,
                                        },
                                   });

                                   await content.save();
                              }

                              // Create content without edit metadata
                              for (let i = 0; i < counts.withoutMetadata; i++) {
                                   const content = new Content({
                                        analysisId,
                                        userId: user._id,
                                        platform: 'x',
                                        tone: 'professional',
                                        generatedText: `Generated text ${i}`,
                                        editedText: '',
                                        version: 1,
                                   });

                                   await content.save();
                              }

                              // Get analytics
                              const analytics = await service.getAnalytics(user._id.toString());

                              // Should only count content with edit metadata
                              expect(analytics.totalEdits).toBe(counts.withMetadata);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 90000);
     });
});
