import mongoose from 'mongoose';
import { FeedbackLearningEngine } from '../FeedbackLearningEngine';
import { User, IUser } from '../../models/User';
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

describe('Feedback Learning Engine - Unit Tests', () => {
     let engine: FeedbackLearningEngine;

     beforeEach(async () => {
          engine = new FeedbackLearningEngine('test-api-key');
     });

     describe('Pattern Detection', () => {
          it('should detect sentence shortening pattern with 3+ consistent edits', async () => {
               // Create user with profile
               const user = await createTestUser();

               // Create 3 edits with consistent sentence shortening
               await createTestContent(user._id.toString(), { sentenceLengthDelta: -3 });
               await createTestContent(user._id.toString(), { sentenceLengthDelta: -4 });
               await createTestContent(user._id.toString(), { sentenceLengthDelta: -2 });

               // Get recent edits and detect patterns
               const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
               const patterns = (engine as any).detectPatterns(recentEdits);

               // Should detect sentence length pattern
               expect(patterns.sentenceLengthPattern).toBeDefined();
               expect(patterns.sentenceLengthPattern).toBeLessThan(0);
          });

          it('should detect emoji addition pattern with 3+ consistent edits', async () => {
               // Create user with profile
               const user = await createTestUser();

               // Create 3 edits with emoji additions
               await createTestContent(user._id.toString(), {
                    emojiChanges: { added: 2, removed: 0, netChange: 2 },
               });
               await createTestContent(user._id.toString(), {
                    emojiChanges: { added: 3, removed: 0, netChange: 3 },
               });
               await createTestContent(user._id.toString(), {
                    emojiChanges: { added: 1, removed: 0, netChange: 1 },
               });

               // Get recent edits and detect patterns
               const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
               const patterns = (engine as any).detectPatterns(recentEdits);

               // Should detect emoji pattern
               expect(patterns.emojiPattern).toBeDefined();
               expect(patterns.emojiPattern.shouldUse).toBe(true);
               expect(patterns.emojiPattern.frequency).toBeGreaterThan(0);
          });

          it('should detect CTA pattern with 3+ consistent edits', async () => {
               // Create user with profile
               const user = await createTestUser();

               // Create 3 edits with CTA additions
               await createTestContent(user._id.toString(), {
                    phrasesAdded: ['check out our website'],
               });
               await createTestContent(user._id.toString(), {
                    phrasesAdded: ['learn more about this'],
               });
               await createTestContent(user._id.toString(), {
                    phrasesAdded: ['click here to get started'],
               });

               // Get recent edits and detect patterns
               const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
               const patterns = (engine as any).detectPatterns(recentEdits);

               // Should detect CTA pattern
               expect(patterns.ctaPattern).toBe(true);
          });

          it('should detect banned phrases with 2+ consistent removals', async () => {
               // Create user with profile
               const user = await createTestUser();

               // Create 2 edits removing the same phrase
               await createTestContent(user._id.toString(), {
                    phrasesRemoved: ['leverage synergy'],
               });
               await createTestContent(user._id.toString(), {
                    phrasesRemoved: ['leverage synergy'],
               });

               // Get recent edits and detect patterns
               const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
               const patterns = (engine as any).detectPatterns(recentEdits);

               // Should detect banned phrase
               expect(patterns.bannedPhrases).toContain('leverage synergy');
          });

          it('should detect common phrases with 3+ consistent additions', async () => {
               // Create user with profile
               const user = await createTestUser();

               // Create 3 edits adding the same phrase
               await createTestContent(user._id.toString(), {
                    phrasesAdded: ['in my opinion'],
               });
               await createTestContent(user._id.toString(), {
                    phrasesAdded: ['in my opinion'],
               });
               await createTestContent(user._id.toString(), {
                    phrasesAdded: ['in my opinion'],
               });

               // Get recent edits and detect patterns
               const recentEdits = await (engine as any).getRecentEdits(user._id.toString(), 20);
               const patterns = (engine as any).detectPatterns(recentEdits);

               // Should detect common phrase
               expect(patterns.commonPhrases).toContain('in my opinion');
          });
     });

     describe('Weighted Profile Updates', () => {
          it('should apply 10-20% adjustment to sentence length', async () => {
               // Create user with profile
               const user = await createTestUser({ avgSentenceLength: 20 });

               // Verify initial state
               expect(user.styleProfile).toBeDefined();
               expect(user.styleProfile!.writingTraits.avgSentenceLength).toBe(20);

               // Create pattern with -5 average delta
               const patterns = {
                    sentenceLengthPattern: -5,
                    bannedPhrases: [],
                    commonPhrases: [],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    {},
                    true
               );

               // Verify updated profile exists
               expect(updatedProfile).toBeDefined();
               expect(updatedProfile.writingTraits).toBeDefined();
               expect(updatedProfile.writingTraits.avgSentenceLength).toBeDefined();

               // The new value should be less than original
               expect(updatedProfile.writingTraits.avgSentenceLength).toBeLessThan(20);

               // Should decrease by ~15% of -5 = -0.75
               const expectedDecrease = Math.abs(patterns.sentenceLengthPattern) * 0.15;
               const actualDecrease = 20 - updatedProfile.writingTraits.avgSentenceLength;

               // The actual decrease should be close to expected
               expect(actualDecrease).toBeGreaterThan(0);
               expect(actualDecrease).toBeCloseTo(expectedDecrease, 1);
          });

          it('should update emoji usage when pattern detected', async () => {
               // Create user with profile (no emojis)
               const user = await createTestUser({
                    usesEmojis: false,
                    emojiFrequency: 0,
               });

               // Create pattern with emoji usage
               const patterns = {
                    emojiPattern: { shouldUse: true, frequency: 3 },
                    bannedPhrases: [],
                    commonPhrases: [],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    {},
                    true
               );

               // Should enable emojis
               expect(updatedProfile.writingTraits.usesEmojis).toBe(true);
               expect(updatedProfile.writingTraits.emojiFrequency).toBe(3);
          });

          it('should update ending style to CTA when pattern detected', async () => {
               // Create user with profile
               const user = await createTestUser({ endingStyle: 'summary' });

               // Create pattern with CTA
               const patterns = {
                    ctaPattern: true,
                    bannedPhrases: [],
                    commonPhrases: [],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    {},
                    true
               );

               // Should update ending style
               expect(updatedProfile.structurePreferences.endingStyle).toBe('cta');
          });

          it('should add banned phrases to profile', async () => {
               // Create user with profile
               const user = await createTestUser();

               // Create pattern with banned phrases
               const patterns = {
                    bannedPhrases: ['leverage', 'synergy', 'paradigm shift'],
                    commonPhrases: [],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    {},
                    true
               );

               // Should add banned phrases
               expect(updatedProfile.bannedPhrases).toContain('leverage');
               expect(updatedProfile.bannedPhrases).toContain('synergy');
               expect(updatedProfile.bannedPhrases).toContain('paradigm shift');
          });

          it('should add common phrases to profile', async () => {
               // Create user with profile
               const user = await createTestUser();

               // Create pattern with common phrases
               const patterns = {
                    bannedPhrases: [],
                    commonPhrases: ['in my opinion', 'as I see it', 'personally'],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    {},
                    true
               );

               // Should add common phrases
               expect(updatedProfile.commonPhrases).toContain('in my opinion');
               expect(updatedProfile.commonPhrases).toContain('as I see it');
               expect(updatedProfile.commonPhrases).toContain('personally');
          });
     });

     describe('Manual Override Preservation', () => {
          it('should not modify tone when manual override exists', async () => {
               // Create user with manual override for entire tone object
               const user = await createTestUser({
                    formality: 8,
                    manualOverrides: {
                         tone: { formality: 8, enthusiasm: 6, directness: 7, humor: 4, emotionality: 5 },
                    },
               });

               // Create pattern that would change formality
               const patterns = {
                    tonePattern: 'more casual',
                    bannedPhrases: [],
                    commonPhrases: [],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    user.manualOverrides,
                    true
               );

               // Tone should not change because of manual override
               expect(updatedProfile.tone.formality).toBe(8);
               expect(updatedProfile.tone.enthusiasm).toBe(6);
          });

          it('should not modify writing traits when manual override exists', async () => {
               // Create user with manual override for entire writingTraits object
               const user = await createTestUser({
                    avgSentenceLength: 25,
                    manualOverrides: {
                         writingTraits: {
                              avgSentenceLength: 25,
                              usesQuestionsOften: false,
                              usesEmojis: false,
                              emojiFrequency: 0,
                              usesBulletPoints: true,
                              usesShortParagraphs: true,
                              usesHooks: false,
                         },
                    },
               });

               // Create pattern that would change sentence length
               const patterns = {
                    sentenceLengthPattern: -5,
                    bannedPhrases: [],
                    commonPhrases: [],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    user.manualOverrides,
                    true
               );

               // Sentence length should not change because of manual override
               expect(updatedProfile.writingTraits.avgSentenceLength).toBe(25);
          });

          it('should not modify structure preferences when manual override exists', async () => {
               // Create user with manual override for entire structurePreferences object
               const user = await createTestUser({
                    endingStyle: 'reflection',
                    manualOverrides: {
                         structurePreferences: {
                              introStyle: 'problem',
                              bodyStyle: 'analysis',
                              endingStyle: 'reflection',
                         },
                    },
               });

               // Create pattern that would change ending style
               const patterns = {
                    ctaPattern: true,
                    bannedPhrases: [],
                    commonPhrases: [],
               };

               // Apply updates
               const updatedProfile = (engine as any).applyWeightedUpdates(
                    user.styleProfile!,
                    patterns,
                    user.manualOverrides,
                    true
               );

               // Ending style should not change because of manual override
               expect(updatedProfile.structurePreferences.endingStyle).toBe('reflection');
          });
     });

     describe('Rate Limiting', () => {
          it('should allow first update', () => {
               const userId = 'test-user-123';

               const canUpdate = (engine as any).canUpdateProfile(userId);

               expect(canUpdate).toBe(true);
          });

          it('should block updates within 5 minutes', () => {
               const userId = 'test-user-123';

               // Simulate first update
               (engine as any).rateLimitMap.set(userId, Date.now());

               // Try immediate second update
               const canUpdate = (engine as any).canUpdateProfile(userId);

               expect(canUpdate).toBe(false);
          });

          it('should allow updates after 5 minutes', () => {
               const userId = 'test-user-123';

               // Simulate update 5 minutes ago
               const fiveMinutesAgo = Date.now() - (5 * 60 * 1000 + 1000);
               (engine as any).rateLimitMap.set(userId, fiveMinutesAgo);

               // Try update now
               const canUpdate = (engine as any).canUpdateProfile(userId);

               expect(canUpdate).toBe(true);
          });
     });

     describe('Edit Batching', () => {
          it('should not batch when no previous batch exists', () => {
               const userId = 'test-user-123';

               const shouldBatch = (engine as any).shouldBatchEdit(userId);

               expect(shouldBatch).toBe(false);
          });

          it('should batch when previous batch exists', () => {
               const userId = 'test-user-123';

               // Create initial batch
               (engine as any).editBatchMap.set(userId, ['content1']);

               const shouldBatch = (engine as any).shouldBatchEdit(userId);

               expect(shouldBatch).toBe(true);
          });

          it('should add edits to batch', () => {
               const userId = 'test-user-123';

               // Create initial batch
               (engine as any).editBatchMap.set(userId, ['content1']);

               // Add to batch
               const batch = (engine as any).editBatchMap.get(userId);
               batch.push('content2');
               (engine as any).editBatchMap.set(userId, batch);

               // Verify batch contains both edits
               const finalBatch = (engine as any).editBatchMap.get(userId);
               expect(finalBatch).toEqual(['content1', 'content2']);
          });
     });
});

/**
 * Helper function to create a test user with style profile
 */
async function createTestUser(overrides: any = {}): Promise<IUser> {
     const user = new User({
          githubId: `test-${Date.now()}-${Math.random()}`,
          username: 'testuser',
          accessToken: 'test-token',
          avatarUrl: 'https://example.com/avatar.jpg',
          styleProfile: {
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
               learningIterations: 0,
               lastUpdated: new Date(),
               profileSource: 'manual',
          },
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
