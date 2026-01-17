import { ProfileEvolutionService } from '../ProfileEvolutionService';
import { User, IUser } from '../../models/User';
import { Content, IContent } from '../../models/Content';
import mongoose from 'mongoose';

describe('Profile Evolution Service - Unit Tests', () => {
     let service: ProfileEvolutionService;

     beforeEach(async () => {
          service = new ProfileEvolutionService();
     });

     describe('calculateEvolutionScore', () => {
          it('should return 0 for users without a style profile', async () => {
               const user = new User({
                    githubId: 'test-user-no-profile',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });

               await user.save();

               const score = await service.calculateEvolutionScore(user._id.toString());

               expect(score).toBe(0);
          });

          it('should award 20 points for initial samples', async () => {
               const user = new User({
                    githubId: 'test-user-with-samples',
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
                         samplePosts: ['sample1', 'sample2', 'sample3'],
                         learningIterations: 0,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });

               await user.save();

               const score = await service.calculateEvolutionScore(user._id.toString());

               // Should have at least 20 points from initial samples
               expect(score).toBeGreaterThanOrEqual(20);
          });

          it('should scale feedback iterations from 0 to 40 points', async () => {
               // Create user with 0 iterations
               const user = new User({
                    githubId: 'test-user-iterations',
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

               const score0 = await service.calculateEvolutionScore(user._id.toString());

               // Update to 10 iterations
               user.styleProfile!.learningIterations = 10;
               await user.save();

               const score10 = await service.calculateEvolutionScore(user._id.toString());

               // Score with 10 iterations should be higher than with 0
               expect(score10).toBeGreaterThan(score0);
               // Should have approximately 40 more points (allowing for rounding)
               expect(score10 - score0).toBeGreaterThanOrEqual(35);
          });

          it('should cap score at 100', async () => {
               const user = new User({
                    githubId: 'test-user-max-score',
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
                         commonPhrases: ['phrase1', 'phrase2'],
                         bannedPhrases: ['banned1'],
                         samplePosts: ['sample1', 'sample2', 'sample3'],
                         learningIterations: 50,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });

               await user.save();

               // Create many consistent edits for high consistency score
               const analysisId = new mongoose.Types.ObjectId();
               for (let i = 0; i < 20; i++) {
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
                                   added: 1,
                                   removed: 0,
                                   netChange: 1,
                              },
                              structureChanges: {
                                   paragraphsAdded: 0,
                                   paragraphsRemoved: 0,
                                   bulletsAdded: false,
                                   formattingChanges: [],
                              },
                              toneShift: 'more casual',
                              vocabularyChanges: {
                                   wordsSubstituted: [],
                                   complexityShift: 0,
                              },
                              phrasesAdded: ['common phrase'],
                              phrasesRemoved: [],
                              editTimestamp: new Date(Date.now() - i * 86400000),
                              learningProcessed: true,
                         },
                    });

                    await content.save();
               }

               const score = await service.calculateEvolutionScore(user._id.toString());

               // Score should be capped at 100
               expect(score).toBeLessThanOrEqual(100);
               expect(score).toBeGreaterThanOrEqual(0);
          });
     });

     describe('getEvolutionTimeline', () => {
          it('should return empty array for users without a style profile', async () => {
               const user = new User({
                    githubId: 'test-user-no-profile-timeline',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });

               await user.save();

               const timeline = await service.getEvolutionTimeline(user._id.toString());

               expect(timeline).toEqual([]);
          });

          it('should include profile_created milestone', async () => {
               const user = new User({
                    githubId: 'test-user-timeline-created',
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

               const timeline = await service.getEvolutionTimeline(user._id.toString());

               expect(timeline.length).toBeGreaterThan(0);
               expect(timeline[0].type).toBe('profile_created');
               expect(timeline[0].description).toBe('Voice profile created');
          });

          it('should include milestones for 5, 10, 25, 50 iterations', async () => {
               const user = new User({
                    githubId: 'test-user-timeline-milestones',
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
                         learningIterations: 25,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });

               await user.save();

               // Create 25 edits
               const analysisId = new mongoose.Types.ObjectId();
               for (let i = 0; i < 25; i++) {
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

               const timeline = await service.getEvolutionTimeline(user._id.toString());

               // Should have milestones for: profile_created, first_edit, iterations_5, iterations_10, iterations_25
               expect(timeline.length).toBeGreaterThanOrEqual(5);

               const milestoneTypes = timeline.map(m => m.type);
               expect(milestoneTypes).toContain('profile_created');
               expect(milestoneTypes).toContain('first_edit');
               expect(milestoneTypes).toContain('iterations_5');
               expect(milestoneTypes).toContain('iterations_10');
               expect(milestoneTypes).toContain('iterations_25');
          });
     });

     describe('getAnalytics', () => {
          it('should throw error for users without a style profile', async () => {
               const user = new User({
                    githubId: 'test-user-no-profile-analytics',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });

               await user.save();

               await expect(service.getAnalytics(user._id.toString())).rejects.toThrow(
                    'User has no style profile'
               );
          });

          it('should return comprehensive analytics', async () => {
               const user = new User({
                    githubId: 'test-user-analytics',
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
                              usesEmojis: true,
                              emojiFrequency: 3,
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
                         bannedPhrases: ['obviously', 'clearly'],
                         samplePosts: ['sample1', 'sample2'],
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });

               await user.save();

               // Create some edits
               const analysisId = new mongoose.Types.ObjectId();
               for (let i = 0; i < 3; i++) {
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

               const analytics = await service.getAnalytics(user._id.toString());

               expect(analytics.evolutionScore).toBeGreaterThanOrEqual(0);
               expect(analytics.evolutionScore).toBeLessThanOrEqual(100);
               expect(analytics.totalEdits).toBe(3);
               expect(analytics.learningIterations).toBe(5);
               expect(analytics.toneDistribution.formality).toBe(5);
               expect(analytics.toneDistribution.enthusiasm).toBe(7);
               expect(analytics.commonPhrases).toEqual(['Let me explain', 'Here is the thing']);
               expect(analytics.bannedPhrases).toEqual(['obviously', 'clearly']);
               expect(analytics.writingTraitsSummary.avgSentenceLength).toBe(15);
               expect(analytics.writingTraitsSummary.usesEmojis).toBe(true);
               expect(analytics.writingTraitsSummary.emojiFrequency).toBe(3);
               expect(analytics.profileSource).toBe('manual');
               expect(analytics.hasInitialSamples).toBe(true);
          });
     });

     describe('getBeforeAfterExamples', () => {
          it('should return empty array for users with no edits', async () => {
               const user = new User({
                    githubId: 'test-user-no-edits',
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

               const examples = await service.getBeforeAfterExamples(user._id.toString());

               expect(examples).toEqual([]);
          });

          it('should return before/after examples with improvements', async () => {
               const user = new User({
                    githubId: 'test-user-examples',
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

               // Create edit with significant changes
               const analysisId = new mongoose.Types.ObjectId();
               const content = new Content({
                    analysisId,
                    userId: user._id,
                    platform: 'linkedin',
                    tone: 'casual',
                    generatedText: 'Original text',
                    editedText: 'Edited text with emojis 😀🎉',
                    version: 1,
                    editMetadata: {
                         originalText: 'Original text',
                         originalLength: 13,
                         editedLength: 30,
                         sentenceLengthDelta: 5,
                         emojiChanges: {
                              added: 2,
                              removed: 0,
                              netChange: 2,
                         },
                         structureChanges: {
                              paragraphsAdded: 0,
                              paragraphsRemoved: 0,
                              bulletsAdded: true,
                              formattingChanges: ['added bullets'],
                         },
                         toneShift: 'more casual',
                         vocabularyChanges: {
                              wordsSubstituted: [],
                              complexityShift: 0,
                         },
                         phrasesAdded: ['new phrase'],
                         phrasesRemoved: [],
                         editTimestamp: new Date(),
                         learningProcessed: true,
                    },
               });

               await content.save();

               const examples = await service.getBeforeAfterExamples(user._id.toString(), 5);

               expect(examples.length).toBe(1);
               expect(examples[0].before).toBe('Original text');
               expect(examples[0].after).toBe('Edited text with emojis 😀🎉');
               expect(examples[0].platform).toBe('linkedin');
               expect(examples[0].improvements).toContain('Made sentences longer');
               expect(examples[0].improvements).toContain('Added 2 emojis');
               expect(examples[0].improvements).toContain('Added bullet points');
               expect(examples[0].improvements).toContain('Tone shift: more casual');
               expect(examples[0].improvements).toContain('Added 1 phrases');
          });
     });
});
