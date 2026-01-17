import { User, IUser, StyleProfile } from '../../models/User';
import { ProfileVersioningService } from '../ProfileVersioningService';
import mongoose from 'mongoose';

describe('ProfileVersioningService - Unit Tests', () => {
     beforeAll(async () => {
          if (mongoose.connection.readyState === 0) {
               await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
          }
     });

     afterAll(async () => {
          await User.deleteMany({});
          await mongoose.connection.close();
     });

     afterEach(async () => {
          await User.deleteMany({});
     });

     const createTestUser = async (githubId: string = 'test-123'): Promise<IUser> => {
          return await User.create({
               githubId,
               username: 'testuser',
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
                    commonPhrases: ['Let me explain'],
                    bannedPhrases: ['Delve into'],
                    samplePosts: ['Sample post 1'],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               },
          });
     };

     describe('createVersionSnapshot', () => {
          it('should create a version snapshot with correct metadata', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(
                    user._id.toString(),
                    'manual'
               );

               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(1);

               const version = updatedUser!.profileVersions[0];
               expect(version.source).toBe('manual');
               expect(version.learningIterations).toBe(0);
               expect(version.timestamp).toBeInstanceOf(Date);
               expect(version.profile).toBeDefined();
               expect(version.profile.voiceType).toBe('casual');
          });

          it('should not create snapshot if user has no profile', async () => {
               const user = await User.create({
                    githubId: 'test-no-profile',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });

               await ProfileVersioningService.createVersionSnapshot(
                    user._id.toString(),
                    'manual'
               );

               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(0);
          });

          it('should create multiple snapshots', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'manual');
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'feedback');
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'archetype');

               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(3);
               expect(updatedUser!.profileVersions[0].source).toBe('manual');
               expect(updatedUser!.profileVersions[1].source).toBe('feedback');
               expect(updatedUser!.profileVersions[2].source).toBe('archetype');
          });
     });

     describe('version pruning', () => {
          it('should prune versions when exceeding 10', async () => {
               const user = await createTestUser();

               // Create 12 snapshots
               for (let i = 0; i < 12; i++) {
                    await ProfileVersioningService.createVersionSnapshot(
                         user._id.toString(),
                         'feedback'
                    );
               }

               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(10);
          });

          it('should keep the most recent 10 versions', async () => {
               const user = await createTestUser();

               // Create 15 snapshots with different learning iterations
               for (let i = 0; i < 15; i++) {
                    const u = await User.findById(user._id);
                    if (u && u.styleProfile) {
                         u.styleProfile.learningIterations = i;
                         await u.save();
                    }

                    await ProfileVersioningService.createVersionSnapshot(
                         user._id.toString(),
                         'feedback'
                    );
               }

               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(10);

               // Verify we kept the last 10 (iterations 5-14)
               const iterations = updatedUser!.profileVersions.map(v => v.learningIterations);
               expect(Math.min(...iterations)).toBeGreaterThanOrEqual(5);
          });

          it('should use pruneVersions method', async () => {
               const user = await createTestUser();

               // Create 15 snapshots
               for (let i = 0; i < 15; i++) {
                    await ProfileVersioningService.createVersionSnapshot(
                         user._id.toString(),
                         'feedback'
                    );
               }

               // Manually prune to 5
               const pruned = await ProfileVersioningService.pruneVersions(user._id.toString(), 5);
               expect(pruned).toBe(10); // Pruned 10 versions (15 - 5)

               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(5);
          });
     });

     describe('rollbackToVersion', () => {
          it('should rollback to a specific version', async () => {
               const user = await createTestUser();

               // Create 3 versions with different formality values
               for (let i = 0; i < 3; i++) {
                    await ProfileVersioningService.createVersionSnapshot(
                         user._id.toString(),
                         'feedback'
                    );

                    const u = await User.findById(user._id);
                    if (u && u.styleProfile) {
                         u.styleProfile.tone.formality = 5 + i + 1;
                         await u.save();
                    }
               }

               // Rollback to version 1 (formality should be 6)
               const restoredProfile = await ProfileVersioningService.rollbackToVersion(
                    user._id.toString(),
                    1
               );

               expect(restoredProfile).toBeTruthy();
               expect(restoredProfile!.tone.formality).toBe(6);

               // Verify user's current profile
               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.styleProfile!.tone.formality).toBe(6);
          });

          it('should handle negative indices', async () => {
               const user = await createTestUser();

               // Create 3 versions
               for (let i = 0; i < 3; i++) {
                    await ProfileVersioningService.createVersionSnapshot(
                         user._id.toString(),
                         'feedback'
                    );

                    const u = await User.findById(user._id);
                    if (u && u.styleProfile) {
                         u.styleProfile.tone.formality = 5 + i + 1;
                         await u.save();
                    }
               }

               // Rollback to last version using -1
               const restoredProfile = await ProfileVersioningService.rollbackToVersion(
                    user._id.toString(),
                    -1
               );

               expect(restoredProfile).toBeTruthy();
               expect(restoredProfile!.tone.formality).toBe(7); // Last version
          });

          it('should return null for user without versions', async () => {
               const user = await createTestUser();

               const result = await ProfileVersioningService.rollbackToVersion(
                    user._id.toString(),
                    0
               );

               expect(result).toBeNull();
          });

          it('should throw error for invalid version index', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(
                    user._id.toString(),
                    'manual'
               );

               await expect(
                    ProfileVersioningService.rollbackToVersion(user._id.toString(), 10)
               ).rejects.toThrow('Invalid version index');
          });

          it('should create a rollback snapshot before restoring', async () => {
               const user = await createTestUser();

               // Create 2 versions
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'manual');
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'feedback');

               // Rollback to version 0
               await ProfileVersioningService.rollbackToVersion(user._id.toString(), 0);

               // Should now have 3 versions (original 2 + rollback snapshot)
               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(3);
               expect(updatedUser!.profileVersions[2].source).toBe('rollback');
          });
     });

     describe('getVersionHistory', () => {
          it('should return all versions', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'manual');
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'feedback');

               const history = await ProfileVersioningService.getVersionHistory(user._id.toString());

               expect(history.length).toBe(2);
               expect(history[0].source).toBe('manual');
               expect(history[1].source).toBe('feedback');
          });

          it('should return empty array for user without versions', async () => {
               const user = await createTestUser();

               const history = await ProfileVersioningService.getVersionHistory(user._id.toString());

               expect(history).toEqual([]);
          });
     });

     describe('getVersion', () => {
          it('should return a specific version', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'manual');
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'feedback');

               const version = await ProfileVersioningService.getVersion(user._id.toString(), 1);

               expect(version).toBeTruthy();
               expect(version!.source).toBe('feedback');
          });

          it('should handle negative indices', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'manual');
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'feedback');

               const version = await ProfileVersioningService.getVersion(user._id.toString(), -1);

               expect(version).toBeTruthy();
               expect(version!.source).toBe('feedback');
          });

          it('should return null for invalid index', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'manual');

               const version = await ProfileVersioningService.getVersion(user._id.toString(), 10);

               expect(version).toBeNull();
          });
     });

     describe('clearVersionHistory', () => {
          it('should delete all versions', async () => {
               const user = await createTestUser();

               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'manual');
               await ProfileVersioningService.createVersionSnapshot(user._id.toString(), 'feedback');

               const deleted = await ProfileVersioningService.clearVersionHistory(user._id.toString());

               expect(deleted).toBe(2);

               const updatedUser = await User.findById(user._id);
               expect(updatedUser!.profileVersions.length).toBe(0);
          });

          it('should return 0 for user without versions', async () => {
               const user = await createTestUser();

               const deleted = await ProfileVersioningService.clearVersionHistory(user._id.toString());

               expect(deleted).toBe(0);
          });
     });
});
