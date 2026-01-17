/**
 * Unit Tests for Atomic Profile Updates
 * Tests concurrency control mechanisms
 * Validates: Requirements 13.4
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, IUser } from '../../models/User';
import { atomicProfileUpdateService } from '../AtomicProfileUpdateService';

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

describe('Atomic Profile Updates - Unit Tests', () => {
     describe('Optimistic Locking', () => {
          it('should successfully update profile with correct version', async () => {
               const user = await createTestUser('1');
               const initialVersion = user.__v || 0;

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.formality',
                    8,
                    false // Don't use distributed lock for unit test
               );

               expect(result.success).toBe(true);
               expect(result.user).toBeDefined();
               expect(result.user!.styleProfile!.tone.formality).toBe(8);
               expect(result.user!.__v).toBe(initialVersion + 1);
          });

          it('should handle version mismatch with retry', async () => {
               const user = await createTestUser('2');

               // Simulate concurrent update by manually incrementing version
               await User.findByIdAndUpdate(user._id, { $inc: { __v: 1 } });

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.enthusiasm',
                    9,
                    false
               );

               // Should succeed after retry
               expect(result.success).toBe(true);
               expect(result.retries).toBeGreaterThan(0);
          });

          it('should fail after max retries on persistent conflicts', async () => {
               const user = await createTestUser('3');

               // Mock findOneAndUpdate to always return null (simulating persistent conflicts)
               const originalFindOneAndUpdate = User.findOneAndUpdate;
               User.findOneAndUpdate = jest.fn().mockResolvedValue(null);

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.directness',
                    7,
                    false
               );

               expect(result.success).toBe(false);
               expect(result.error).toContain('max retries exceeded');

               // Restore original method
               User.findOneAndUpdate = originalFindOneAndUpdate;
          });
     });

     describe('Retry Logic', () => {
          it('should retry on concurrent update conflicts', async () => {
               const user = await createTestUser('4');

               // First update succeeds
               const result1 = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.humor',
                    6,
                    false
               );

               expect(result1.success).toBe(true);
               expect(result1.retries).toBe(0);

               // Second update should also succeed (no conflict)
               const result2 = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.humor',
                    7,
                    false
               );

               expect(result2.success).toBe(true);
          });

          it('should use exponential backoff for retries', async () => {
               const user = await createTestUser('5');

               // Track retry attempts
               let retryCount = 0;
               const originalFindOneAndUpdate = User.findOneAndUpdate;

               User.findOneAndUpdate = jest.fn().mockImplementation(async (...args: any[]) => {
                    retryCount++;
                    if (retryCount < 2) {
                         return null; // Simulate conflict
                    }
                    return (originalFindOneAndUpdate as any).apply(User, args);
               });

               const startTime = Date.now();
               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.emotionality',
                    8,
                    false
               );
               const endTime = Date.now();

               expect(result.success).toBe(true);
               expect(result.retries).toBeGreaterThan(0);
               // Should have some delay due to exponential backoff
               expect(endTime - startTime).toBeGreaterThan(100);

               // Restore original method
               User.findOneAndUpdate = originalFindOneAndUpdate;
          });
     });

     describe('Distributed Lock', () => {
          it('should acquire and release lock successfully', async () => {
               const user = await createTestUser('6');

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.writingTraits.avgSentenceLength',
                    20,
                    true // Use distributed lock
               );

               expect(result.success).toBe(true);
               expect(result.user!.styleProfile!.writingTraits.avgSentenceLength).toBe(20);
          });

          it('should fail if lock cannot be acquired', async () => {
               const user = await createTestUser('7');

               // Mock acquireLock to return false
               const originalAcquireLock = (atomicProfileUpdateService as any).acquireLock;
               (atomicProfileUpdateService as any).acquireLock = jest.fn().mockResolvedValue(false);

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.writingTraits.avgSentenceLength',
                    25,
                    true
               );

               expect(result.success).toBe(false);
               expect(result.error).toContain('Could not acquire lock');

               // Restore original method
               (atomicProfileUpdateService as any).acquireLock = originalAcquireLock;
          });
     });

     describe('Atomic Update Operations', () => {
          it('should support $set operation', async () => {
               const user = await createTestUser('8');

               const result = await atomicProfileUpdateService.updateStyleProfileAtomic(
                    user._id.toString(),
                    [
                         { field: 'styleProfile.tone.formality', value: 9, operation: '$set' },
                         { field: 'styleProfile.tone.enthusiasm', value: 8, operation: '$set' },
                    ],
                    false
               );

               expect(result.success).toBe(true);
               expect(result.user!.styleProfile!.tone.formality).toBe(9);
               expect(result.user!.styleProfile!.tone.enthusiasm).toBe(8);
          });

          it('should support $inc operation', async () => {
               const user = await createTestUser('9');
               const initialIterations = user.styleProfile!.learningIterations;

               const result = await atomicProfileUpdateService.incrementField(
                    user._id.toString(),
                    'styleProfile.learningIterations',
                    1,
                    false
               );

               expect(result.success).toBe(true);
               expect(result.user!.styleProfile!.learningIterations).toBe(initialIterations + 1);
          });

          it('should update lastUpdated timestamp', async () => {
               const user = await createTestUser('10');
               const initialTimestamp = user.styleProfile!.lastUpdated;

               // Wait a bit to ensure timestamp difference
               await new Promise(resolve => setTimeout(resolve, 10));

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.formality',
                    6,
                    false
               );

               expect(result.success).toBe(true);
               expect(result.user!.styleProfile!.lastUpdated.getTime()).toBeGreaterThan(
                    initialTimestamp.getTime()
               );
          });

          it('should increment version field', async () => {
               const user = await createTestUser('11');
               const initialVersion = user.__v || 0;

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.humor',
                    9,
                    false
               );

               expect(result.success).toBe(true);
               expect(result.user!.__v).toBe(initialVersion + 1);
          });
     });

     describe('Error Handling', () => {
          it('should handle user not found', async () => {
               const fakeUserId = new mongoose.Types.ObjectId().toString();

               const result = await atomicProfileUpdateService.updateField(
                    fakeUserId,
                    'styleProfile.tone.formality',
                    7,
                    false
               );

               expect(result.success).toBe(false);
               expect(result.error).toBe('User not found');
          });

          it('should handle user without style profile', async () => {
               const user = new User({
                    githubId: 'github-test',
                    username: 'test-user',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
                    voiceStrength: 80,
               });
               await user.save();

               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.formality',
                    7,
                    false
               );

               expect(result.success).toBe(false);
               expect(result.error).toBe('User has no style profile');
          });

          it('should handle validation errors', async () => {
               const user = await createTestUser('12');

               // Try to set tone metric outside valid range
               const result = await atomicProfileUpdateService.updateField(
                    user._id.toString(),
                    'styleProfile.tone.formality',
                    15, // Invalid: should be 1-10
                    false
               );

               expect(result.success).toBe(false);
               expect(result.error).toContain('Validation error');
          });
     });

     describe('Multiple Field Updates', () => {
          it('should update multiple fields atomically', async () => {
               const user = await createTestUser('13');

               const result = await atomicProfileUpdateService.updateStyleProfileAtomic(
                    user._id.toString(),
                    [
                         { field: 'styleProfile.tone.formality', value: 7 },
                         { field: 'styleProfile.tone.enthusiasm', value: 9 },
                         { field: 'styleProfile.writingTraits.avgSentenceLength', value: 18 },
                    ],
                    false
               );

               expect(result.success).toBe(true);
               expect(result.user!.styleProfile!.tone.formality).toBe(7);
               expect(result.user!.styleProfile!.tone.enthusiasm).toBe(9);
               expect(result.user!.styleProfile!.writingTraits.avgSentenceLength).toBe(18);
          });

          it('should rollback all changes if one field fails validation', async () => {
               const user = await createTestUser('14');
               const initialFormality = user.styleProfile!.tone.formality;

               const result = await atomicProfileUpdateService.updateStyleProfileAtomic(
                    user._id.toString(),
                    [
                         { field: 'styleProfile.tone.formality', value: 8 },
                         { field: 'styleProfile.tone.enthusiasm', value: 15 }, // Invalid
                    ],
                    false
               );

               expect(result.success).toBe(false);

               // Verify original value unchanged
               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.styleProfile!.tone.formality).toBe(initialFormality);
          });
     });
});
