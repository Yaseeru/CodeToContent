/**
 * Property-Based Tests for Atomic Profile Updates
 * Feature: personalized-voice-engine, Property 28: Atomic Profile Updates
 * Validates: Requirements 13.4
 */

import fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, IUser, StyleProfile } from '../../models/User';
import { atomicProfileUpdateService, ProfileUpdateOperation } from '../AtomicProfileUpdateService';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
     mongoServer = await MongoMemoryServer.create();
     const mongoUri = mongoServer.getUri();
     await mongoose.connect(mongoUri);
});

afterAll(async () => {
     await mongoose.disconnect();
     await mongoServer.stop();
     await atomicProfileUpdateService.close();
});

beforeEach(async () => {
     await User.deleteMany({});
});

/**
 * Helper function to create a test user with a style profile
 */
async function createTestUser(userId: string): Promise<IUser> {
     const user = new User({
          _id: new mongoose.Types.ObjectId(userId.padStart(24, '0')),
          githubId: `github-${userId}`,
          username: `user-${userId}`,
          accessToken: 'test-token',
          avatarUrl: 'https://example.com/avatar.jpg',
          styleProfile: {
               voiceType: 'casual',
               tone: {
                    formality: 5,
                    enthusiasm: 7,
                    directness: 6,
                    humor: 8,
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
               commonPhrases: ['Let me explain', 'Here\'s the thing'],
               bannedPhrases: ['Leverage', 'Synergy'],
               samplePosts: ['Sample post 1', 'Sample post 2'],
               learningIterations: 0,
               lastUpdated: new Date(),
               profileSource: 'manual',
          },
          voiceStrength: 80,
     });

     return await user.save();
}

describe('Atomic Profile Updates - Property Tests', () => {
     /**
      * Property 28: Atomic Profile Updates
      * For any concurrent styleProfile update operations for the same user,
      * the final profile state should be consistent and not corrupted by race conditions.
      */
     describe('Property 28: Atomic Profile Updates', () => {
          it('should handle concurrent updates without corruption (tone metrics)', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.record({
                                   field: fc.constantFrom(
                                        'styleProfile.tone.formality',
                                        'styleProfile.tone.enthusiasm',
                                        'styleProfile.tone.directness',
                                        'styleProfile.tone.humor',
                                        'styleProfile.tone.emotionality'
                                   ),
                                   value: fc.integer({ min: 1, max: 10 }),
                              }),
                              { minLength: 2, maxLength: 5 }
                         ),
                         async (updates) => {
                              // Create test user
                              const userId = '1';
                              const user = await createTestUser(userId);

                              // Apply updates concurrently
                              const updatePromises = updates.map((update) =>
                                   atomicProfileUpdateService.updateField(
                                        user._id.toString(),
                                        update.field,
                                        update.value,
                                        false // Don't use distributed lock for this test
                                   )
                              );

                              const results = await Promise.all(updatePromises);

                              // At least one update should succeed
                              const successCount = results.filter((r) => r.success).length;
                              expect(successCount).toBeGreaterThan(0);

                              // Verify profile is not corrupted
                              const updatedUser = await User.findById(user._id);
                              expect(updatedUser).not.toBeNull();
                              expect(updatedUser!.styleProfile).toBeDefined();

                              // All tone metrics should be in valid range
                              const tone = updatedUser!.styleProfile!.tone;
                              expect(tone.formality).toBeGreaterThanOrEqual(1);
                              expect(tone.formality).toBeLessThanOrEqual(10);
                              expect(tone.enthusiasm).toBeGreaterThanOrEqual(1);
                              expect(tone.enthusiasm).toBeLessThanOrEqual(10);
                              expect(tone.directness).toBeGreaterThanOrEqual(1);
                              expect(tone.directness).toBeLessThanOrEqual(10);
                              expect(tone.humor).toBeGreaterThanOrEqual(1);
                              expect(tone.humor).toBeLessThanOrEqual(10);
                              expect(tone.emotionality).toBeGreaterThanOrEqual(1);
                              expect(tone.emotionality).toBeLessThanOrEqual(10);

                              return true;
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 60000); // 60 second timeout for property test

          it('should handle concurrent updates without corruption (learning iterations)', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.integer({ min: 2, max: 10 }),
                         async (concurrentUpdates) => {
                              // Create test user
                              const userId = '2';
                              const user = await createTestUser(userId);

                              // Apply concurrent increments to learningIterations
                              const updatePromises = Array.from({ length: concurrentUpdates }, () =>
                                   atomicProfileUpdateService.incrementField(
                                        user._id.toString(),
                                        'styleProfile.learningIterations',
                                        1,
                                        false // Don't use distributed lock for this test
                                   )
                              );

                              const results = await Promise.all(updatePromises);

                              // Count successful updates
                              const successCount = results.filter((r) => r.success).length;
                              expect(successCount).toBeGreaterThan(0);

                              // Verify profile is not corrupted
                              const updatedUser = await User.findById(user._id);
                              expect(updatedUser).not.toBeNull();
                              expect(updatedUser!.styleProfile).toBeDefined();

                              // Learning iterations should be >= 0 and <= concurrentUpdates
                              const iterations = updatedUser!.styleProfile!.learningIterations;
                              expect(iterations).toBeGreaterThanOrEqual(0);
                              expect(iterations).toBeLessThanOrEqual(concurrentUpdates);

                              // Due to optimistic locking, some updates may fail
                              // But the final value should be consistent
                              expect(iterations).toBe(successCount);

                              return true;
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 60000);

          it('should handle concurrent updates with distributed lock', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.array(
                              fc.record({
                                   field: fc.constantFrom(
                                        'styleProfile.tone.formality',
                                        'styleProfile.writingTraits.avgSentenceLength'
                                   ),
                                   value: fc.integer({ min: 1, max: 20 }),
                              }),
                              { minLength: 2, maxLength: 5 }
                         ),
                         async (updates) => {
                              // Create test user
                              const userId = '3';
                              const user = await createTestUser(userId);

                              // Apply updates concurrently WITH distributed lock
                              const updatePromises = updates.map((update) =>
                                   atomicProfileUpdateService.updateField(
                                        user._id.toString(),
                                        update.field,
                                        update.value,
                                        true // Use distributed lock
                                   )
                              );

                              const results = await Promise.all(updatePromises);

                              // With distributed lock, only one update should succeed at a time
                              // But all should eventually succeed or fail gracefully
                              const successCount = results.filter((r) => r.success).length;
                              const failureCount = results.filter((r) => !r.success).length;

                              expect(successCount + failureCount).toBe(updates.length);

                              // Verify profile is not corrupted
                              const updatedUser = await User.findById(user._id);
                              expect(updatedUser).not.toBeNull();
                              expect(updatedUser!.styleProfile).toBeDefined();

                              // Tone formality should be in valid range if it was updated
                              const tone = updatedUser!.styleProfile!.tone;
                              expect(tone.formality).toBeGreaterThanOrEqual(1);
                              expect(tone.formality).toBeLessThanOrEqual(10);

                              return true;
                         }
                    ),
                    { numRuns: 50 } // Fewer runs due to distributed lock overhead
               );
          }, 90000); // 90 second timeout

          it('should maintain profile consistency across multiple field updates', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.record({
                              formality: fc.integer({ min: 1, max: 10 }),
                              enthusiasm: fc.integer({ min: 1, max: 10 }),
                              avgSentenceLength: fc.integer({ min: 5, max: 50 }),
                         }),
                         async (values) => {
                              // Create test user
                              const userId = '4';
                              const user = await createTestUser(userId);

                              // Apply multiple field updates concurrently
                              const updates: ProfileUpdateOperation[] = [
                                   { field: 'styleProfile.tone.formality', value: values.formality },
                                   { field: 'styleProfile.tone.enthusiasm', value: values.enthusiasm },
                                   {
                                        field: 'styleProfile.writingTraits.avgSentenceLength',
                                        value: values.avgSentenceLength,
                                   },
                              ];

                              const result = await atomicProfileUpdateService.updateStyleProfileAtomic(
                                   user._id.toString(),
                                   updates,
                                   true
                              );

                              expect(result.success).toBe(true);

                              // Verify all fields were updated correctly
                              const updatedUser = await User.findById(user._id);
                              expect(updatedUser).not.toBeNull();
                              expect(updatedUser!.styleProfile).toBeDefined();

                              expect(updatedUser!.styleProfile!.tone.formality).toBe(values.formality);
                              expect(updatedUser!.styleProfile!.tone.enthusiasm).toBe(values.enthusiasm);
                              expect(updatedUser!.styleProfile!.writingTraits.avgSentenceLength).toBe(
                                   values.avgSentenceLength
                              );

                              return true;
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 60000);
     });
});
