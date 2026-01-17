import fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Content } from '../../models/Content';
import { User } from '../../models/User';
import { EditMetadataStorageService } from '../EditMetadataStorageService';

/**
 * Property-Based Tests for Edit Metadata Storage
 * Feature: personalized-voice-engine
 * Property 27: Edit Metadata Storage Limit
 * Validates: Requirements 11.9
 */

describe('Edit Metadata Storage - Property Tests', () => {
     let mongoServer: MongoMemoryServer;

     beforeAll(async () => {
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);
     });

     afterAll(async () => {
          await mongoose.disconnect();
          await mongoServer.stop();
     });

     beforeEach(async () => {
          await Content.deleteMany({});
          await User.deleteMany({});
     });

     /**
      * Property 27: Edit Metadata Storage Limit
      * For any user with more than 50 edits, the system should store only the 50 most recent
      */
     it('should enforce 50 edit limit per user', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.integer({ min: 51, max: 100 }), // Number of edits to create
                    async (numEdits) => {
                         // Create a test user
                         const user = new User({
                              githubId: `test-user-${Date.now()}`,
                              username: 'testuser',
                              accessToken: 'test-token',
                         });
                         await user.save();

                         // Create a test analysis
                         const analysisId = new mongoose.Types.ObjectId();

                         // Create numEdits content items with edit metadata
                         const contentItems = [];
                         for (let i = 0; i < numEdits; i++) {
                              const content = new Content({
                                   analysisId,
                                   userId: user._id,
                                   platform: 'x',
                                   tone: 'casual',
                                   generatedText: `Original text ${i}`,
                                   editedText: `Edited text ${i}`,
                                   version: 1,
                                   editMetadata: {
                                        originalText: `Original text ${i}`,
                                        originalLength: 100 + i,
                                        editedLength: 110 + i,
                                        sentenceLengthDelta: i % 5 - 2,
                                        emojiChanges: {
                                             added: i % 3,
                                             removed: i % 2,
                                             netChange: (i % 3) - (i % 2),
                                        },
                                        structureChanges: {
                                             paragraphsAdded: i % 2,
                                             paragraphsRemoved: i % 3,
                                             bulletsAdded: i % 2 === 0,
                                             formattingChanges: [],
                                        },
                                        toneShift: i % 2 === 0 ? 'more casual' : 'no change',
                                        vocabularyChanges: {
                                             wordsSubstituted: [],
                                             complexityShift: 0,
                                        },
                                        phrasesAdded: [],
                                        phrasesRemoved: [],
                                        editTimestamp: new Date(Date.now() - (numEdits - i) * 1000),
                                        learningProcessed: false,
                                   },
                              });
                              contentItems.push(content);
                         }

                         // Save all content items
                         await Content.insertMany(contentItems);

                         // Verify we created the correct number of edits
                         const countBefore = await EditMetadataStorageService.getEditCount(user._id.toString());
                         expect(countBefore).toBe(numEdits);

                         // Prune old edit metadata
                         await EditMetadataStorageService.pruneOldEditMetadata(user._id.toString());

                         // Verify only 50 most recent edits remain
                         const countAfter = await EditMetadataStorageService.getEditCount(user._id.toString());
                         expect(countAfter).toBeLessThanOrEqual(50);

                         // Verify the remaining edits are the most recent ones
                         const remainingEdits = await EditMetadataStorageService.getRecentEdits({
                              userId: user._id.toString(),
                              limit: 100,
                         });

                         // All remaining edits should have edit metadata
                         expect(remainingEdits.length).toBe(countAfter);
                         expect(remainingEdits.every(e => e.editMetadata !== undefined)).toBe(true);

                         // Verify they are sorted by timestamp (most recent first)
                         for (let i = 1; i < remainingEdits.length; i++) {
                              const prev = remainingEdits[i - 1].editMetadata!.editTimestamp;
                              const curr = remainingEdits[i].editMetadata!.editTimestamp;
                              expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
                         }

                         return true;
                    }
               ),
               {
                    numRuns: 100,
                    timeout: 30000,
               }
          );
     }, 60000);

     /**
      * Property: Edit metadata pruning preserves most recent edits
      * For any set of edits, pruning should keep the most recent ones
      */
     it('should preserve most recent edits when pruning', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.integer({ min: 60, max: 80 }),
                    async (numEdits) => {
                         // Create a test user
                         const user = new User({
                              githubId: `test-user-${Date.now()}`,
                              username: 'testuser',
                              accessToken: 'test-token',
                         });
                         await user.save();

                         const analysisId = new mongoose.Types.ObjectId();

                         // Create edits with specific timestamps
                         const now = Date.now();
                         const contentItems = [];
                         for (let i = 0; i < numEdits; i++) {
                              const content = new Content({
                                   analysisId,
                                   userId: user._id,
                                   platform: 'x',
                                   tone: 'casual',
                                   generatedText: `Text ${i}`,
                                   editedText: `Edited ${i}`,
                                   version: 1,
                                   editMetadata: {
                                        originalText: `Text ${i}`,
                                        originalLength: 100,
                                        editedLength: 110,
                                        sentenceLengthDelta: 0,
                                        emojiChanges: { added: 0, removed: 0, netChange: 0 },
                                        structureChanges: {
                                             paragraphsAdded: 0,
                                             paragraphsRemoved: 0,
                                             bulletsAdded: false,
                                             formattingChanges: [],
                                        },
                                        toneShift: 'no change',
                                        vocabularyChanges: { wordsSubstituted: [], complexityShift: 0 },
                                        phrasesAdded: [],
                                        phrasesRemoved: [],
                                        editTimestamp: new Date(now - (numEdits - i) * 60000), // 1 minute apart
                                        learningProcessed: false,
                                   },
                              });
                              contentItems.push(content);
                         }

                         await Content.insertMany(contentItems);

                         // Get the 50 most recent timestamps before pruning
                         const allEdits = await Content.find({
                              userId: user._id,
                              editMetadata: { $exists: true },
                         })
                              .sort({ 'editMetadata.editTimestamp': -1 })
                              .limit(50);

                         const expectedTimestamps = allEdits.map(e => e.editMetadata!.editTimestamp.getTime());

                         // Prune
                         await EditMetadataStorageService.pruneOldEditMetadata(user._id.toString());

                         // Get remaining edits
                         const remainingEdits = await EditMetadataStorageService.getRecentEdits({
                              userId: user._id.toString(),
                              limit: 100,
                         });

                         const actualTimestamps = remainingEdits.map(e => e.editMetadata!.editTimestamp.getTime());

                         // Verify the timestamps match (most recent 50)
                         expect(actualTimestamps.sort((a, b) => b - a)).toEqual(expectedTimestamps.sort((a, b) => b - a));

                         return true;
                    }
               ),
               {
                    numRuns: 100,
                    timeout: 30000,
               }
          );
     }, 60000);

     /**
      * Property: Pruning with fewer than 50 edits should not delete anything
      * For any user with 50 or fewer edits, pruning should not remove any edit metadata
      */
     it('should not prune when edit count is 50 or less', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.integer({ min: 1, max: 50 }),
                    async (numEdits) => {
                         // Create a test user
                         const user = new User({
                              githubId: `test-user-${Date.now()}`,
                              username: 'testuser',
                              accessToken: 'test-token',
                         });
                         await user.save();

                         const analysisId = new mongoose.Types.ObjectId();

                         // Create edits
                         const contentItems = [];
                         for (let i = 0; i < numEdits; i++) {
                              const content = new Content({
                                   analysisId,
                                   userId: user._id,
                                   platform: 'x',
                                   tone: 'casual',
                                   generatedText: `Text ${i}`,
                                   editedText: `Edited ${i}`,
                                   version: 1,
                                   editMetadata: {
                                        originalText: `Text ${i}`,
                                        originalLength: 100,
                                        editedLength: 110,
                                        sentenceLengthDelta: 0,
                                        emojiChanges: { added: 0, removed: 0, netChange: 0 },
                                        structureChanges: {
                                             paragraphsAdded: 0,
                                             paragraphsRemoved: 0,
                                             bulletsAdded: false,
                                             formattingChanges: [],
                                        },
                                        toneShift: 'no change',
                                        vocabularyChanges: { wordsSubstituted: [], complexityShift: 0 },
                                        phrasesAdded: [],
                                        phrasesRemoved: [],
                                        editTimestamp: new Date(Date.now() - i * 1000),
                                        learningProcessed: false,
                                   },
                              });
                              contentItems.push(content);
                         }

                         await Content.insertMany(contentItems);

                         const countBefore = await EditMetadataStorageService.getEditCount(user._id.toString());

                         // Prune
                         const pruned = await EditMetadataStorageService.pruneOldEditMetadata(user._id.toString());

                         const countAfter = await EditMetadataStorageService.getEditCount(user._id.toString());

                         // No edits should be pruned
                         expect(pruned).toBe(0);
                         expect(countAfter).toBe(countBefore);
                         expect(countAfter).toBe(numEdits);

                         return true;
                    }
               ),
               {
                    numRuns: 100,
                    timeout: 30000,
               }
          );
     }, 60000);
});
