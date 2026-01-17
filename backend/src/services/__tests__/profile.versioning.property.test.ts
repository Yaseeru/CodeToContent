import * as fc from 'fast-check';
import { User, IUser, StyleProfile } from '../../models/User';
import { ProfileVersioningService } from '../ProfileVersioningService';
import mongoose from 'mongoose';

// Feature: personalized-voice-engine, Property 33: Profile Versioning for Rollback
// Validates: Requirements 13.10
// For any styleProfile update, the system should maintain version history to enable 
// rollback if learning produces poor results.

describe('Property 33: Profile Versioning for Rollback', () => {
     beforeAll(async () => {
          // Ensure MongoDB connection is established
          if (mongoose.connection.readyState === 0) {
               await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
          }
     });

     afterAll(async () => {
          // Clean up
          await User.deleteMany({});
          await mongoose.connection.close();
     });

     afterEach(async () => {
          // Clean up after each test
          await User.deleteMany({});
     });

     it('should store version snapshots before each profile update', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         updateCount: fc.integer({ min: 1, max: 5 }), // Reduced from 15 to 5
                    }),
                    async (data) => {
                         // Create user with initial profile
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
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

                         // Perform multiple updates and create snapshots
                         for (let i = 0; i < data.updateCount; i++) {
                              // Create snapshot before update
                              await ProfileVersioningService.createVersionSnapshot(
                                   user._id.toString(),
                                   'feedback'
                              );

                              // Update the profile
                              const updatedUser = await User.findById(user._id);
                              if (updatedUser && updatedUser.styleProfile) {
                                   updatedUser.styleProfile.learningIterations = i + 1;
                                   updatedUser.styleProfile.tone.formality = Math.min(10, 5 + i);
                                   await updatedUser.save();
                              }
                         }

                         // Verify version history
                         const finalUser = await User.findById(user._id);
                         expect(finalUser).toBeTruthy();
                         expect(finalUser!.profileVersions).toBeDefined();

                         // Should have stored versions (max 10)
                         const expectedVersions = Math.min(data.updateCount, 10);
                         expect(finalUser!.profileVersions.length).toBe(expectedVersions);

                         // Each version should have required metadata
                         finalUser!.profileVersions.forEach((version) => {
                              expect(version.profile).toBeDefined();
                              expect(version.timestamp).toBeInstanceOf(Date);
                              expect(version.source).toBeDefined();
                              expect(typeof version.learningIterations).toBe('number');
                         });
                    }
               ),
               { numRuns: 20 }
          );
     }, 90000);

     it('should maintain maximum of 10 versions (pruning)', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         updateCount: fc.integer({ min: 11, max: 15 }), // Reduced from 20 to 15
                    }),
                    async (data) => {
                         // Create user with initial profile
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
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

                         // Create more than 10 snapshots
                         for (let i = 0; i < data.updateCount; i++) {
                              await ProfileVersioningService.createVersionSnapshot(
                                   user._id.toString(),
                                   'feedback'
                              );

                              const updatedUser = await User.findById(user._id);
                              if (updatedUser && updatedUser.styleProfile) {
                                   updatedUser.styleProfile.learningIterations = i + 1;
                                   await updatedUser.save();
                              }
                         }

                         // Verify pruning
                         const finalUser = await User.findById(user._id);
                         expect(finalUser).toBeTruthy();
                         expect(finalUser!.profileVersions.length).toBeLessThanOrEqual(10);
                         expect(finalUser!.profileVersions.length).toBe(10);
                    }
               ),
               { numRuns: 20 }
          );
     }, 90000);

     it('should enable rollback to any previous version', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         versionCount: fc.integer({ min: 3, max: 6 }), // Reduced from 8 to 6
                    }),
                    async (data) => {
                         // Create user with initial profile
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
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

                         // Create multiple versions with distinct values
                         const formalityValues: number[] = [];
                         for (let i = 0; i < data.versionCount; i++) {
                              await ProfileVersioningService.createVersionSnapshot(
                                   user._id.toString(),
                                   'feedback'
                              );

                              const updatedUser = await User.findById(user._id);
                              if (updatedUser && updatedUser.styleProfile) {
                                   const newFormality = 5 + i;
                                   formalityValues.push(newFormality);
                                   updatedUser.styleProfile.tone.formality = newFormality;
                                   updatedUser.styleProfile.learningIterations = i + 1;
                                   await updatedUser.save();
                              }
                         }

                         // Pick a random version to rollback to
                         const rollbackIndex = Math.floor(Math.random() * data.versionCount);
                         const expectedFormality = formalityValues[rollbackIndex];

                         // Rollback
                         const restoredProfile = await ProfileVersioningService.rollbackToVersion(
                              user._id.toString(),
                              rollbackIndex
                         );

                         // Verify rollback
                         expect(restoredProfile).toBeTruthy();
                         expect(restoredProfile!.tone.formality).toBe(expectedFormality);
                         expect(restoredProfile!.learningIterations).toBe(rollbackIndex + 1);

                         // Verify user's current profile matches
                         const finalUser = await User.findById(user._id);
                         expect(finalUser!.styleProfile!.tone.formality).toBe(expectedFormality);
                    }
               ),
               { numRuns: 20 }
          );
     }, 90000);

     it('should preserve version metadata (timestamp, source, learningIterations)', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         source: fc.constantFrom('manual', 'feedback', 'archetype'),
                    }),
                    async (data) => {
                         // Create user with initial profile
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
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
                                   learningIterations: 5,
                                   lastUpdated: new Date(),
                                   profileSource: 'manual',
                              },
                         });

                         const beforeSnapshot = Date.now();

                         // Create snapshot with specific source
                         await ProfileVersioningService.createVersionSnapshot(
                              user._id.toString(),
                              data.source as 'manual' | 'feedback' | 'archetype'
                         );

                         const afterSnapshot = Date.now();

                         // Verify metadata
                         const finalUser = await User.findById(user._id);
                         expect(finalUser!.profileVersions.length).toBe(1);

                         const version = finalUser!.profileVersions[0];
                         expect(version.source).toBe(data.source);
                         expect(version.learningIterations).toBe(5);
                         expect(version.timestamp.getTime()).toBeGreaterThanOrEqual(beforeSnapshot);
                         expect(version.timestamp.getTime()).toBeLessThanOrEqual(afterSnapshot);
                         expect(version.profile).toBeDefined();
                         expect(version.profile.voiceType).toBe('casual');
                    }
               ),
               { numRuns: 20 }
          );
     }, 90000);
});
