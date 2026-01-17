/**
 * Unit Tests for Edit Metadata Storage Service
 * Tests metadata storage, storage limit enforcement, pruning, and aggregation queries
 * Validates: Requirements 11.9, 11.10
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Content, IContent } from '../../models/Content';
import { User } from '../../models/User';
import { EditMetadataStorageService } from '../EditMetadataStorageService';

describe('EditMetadataStorageService Unit Tests', () => {
     let mongoServer: MongoMemoryServer;
     let testUserId: mongoose.Types.ObjectId;
     let testAnalysisId: mongoose.Types.ObjectId;

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

          // Create a test user
          const user = new User({
               githubId: 'test-user-123',
               username: 'testuser',
               accessToken: 'test-token',
          });
          await user.save();
          testUserId = user._id;
          testAnalysisId = new mongoose.Types.ObjectId();
     });

     describe('Metadata Storage', () => {
          test('should store edit metadata correctly', async () => {
               const content = new Content({
                    analysisId: testAnalysisId,
                    userId: testUserId,
                    platform: 'x',
                    tone: 'casual',
                    generatedText: 'Original text here',
                    editedText: 'Edited text here with changes',
                    version: 1,
                    editMetadata: {
                         originalText: 'Original text here',
                         originalLength: 18,
                         editedLength: 32,
                         sentenceLengthDelta: 2.5,
                         emojiChanges: {
                              added: 2,
                              removed: 1,
                              netChange: 1,
                         },
                         structureChanges: {
                              paragraphsAdded: 1,
                              paragraphsRemoved: 0,
                              bulletsAdded: true,
                              formattingChanges: ['added bold'],
                         },
                         toneShift: 'more casual',
                         vocabularyChanges: {
                              wordsSubstituted: [{ from: 'utilize', to: 'use' }],
                              complexityShift: -1,
                         },
                         phrasesAdded: ['Let me explain'],
                         phrasesRemoved: ['In conclusion'],
                         editTimestamp: new Date(),
                         learningProcessed: false,
                    },
               });

               await content.save();

               // Retrieve and verify
               const retrieved = await Content.findById(content._id);
               expect(retrieved).not.toBeNull();
               expect(retrieved!.editMetadata).toBeDefined();
               expect(retrieved!.editMetadata!.originalText).toBe('Original text here');
               expect(retrieved!.editMetadata!.sentenceLengthDelta).toBe(2.5);
               expect(retrieved!.editMetadata!.emojiChanges.netChange).toBe(1);
               expect(retrieved!.editMetadata!.toneShift).toBe('more casual');
               expect(retrieved!.editMetadata!.phrasesAdded).toContain('Let me explain');
          });

          test('should retrieve recent edits for a user', async () => {
               // Create multiple content items with edit metadata
               const now = Date.now();
               for (let i = 0; i < 5; i++) {
                    await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 10 + i,
                              editedLength: 15 + i,
                              sentenceLengthDelta: i * 0.5,
                              emojiChanges: { added: i, removed: 0, netChange: i },
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
                              editTimestamp: new Date(now - i * 60000), // 1 minute apart
                              learningProcessed: false,
                         },
                    });
               }

               const edits = await EditMetadataStorageService.getRecentEdits({
                    userId: testUserId.toString(),
                    limit: 3,
               });

               expect(edits).toHaveLength(3);
               // Should be sorted by most recent first
               expect(edits[0].editMetadata!.originalText).toBe('Text 0');
               expect(edits[1].editMetadata!.originalText).toBe('Text 1');
               expect(edits[2].editMetadata!.originalText).toBe('Text 2');
          });

          test('should filter unprocessed edits', async () => {
               // Create some processed and unprocessed edits
               await Content.create({
                    analysisId: testAnalysisId,
                    userId: testUserId,
                    platform: 'x',
                    tone: 'casual',
                    generatedText: 'Text 1',
                    editedText: 'Edited 1',
                    version: 1,
                    editMetadata: {
                         originalText: 'Text 1',
                         originalLength: 10,
                         editedLength: 15,
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
                         editTimestamp: new Date(),
                         learningProcessed: true, // Processed
                    },
               });

               await Content.create({
                    analysisId: testAnalysisId,
                    userId: testUserId,
                    platform: 'x',
                    tone: 'casual',
                    generatedText: 'Text 2',
                    editedText: 'Edited 2',
                    version: 1,
                    editMetadata: {
                         originalText: 'Text 2',
                         originalLength: 10,
                         editedLength: 15,
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
                         editTimestamp: new Date(),
                         learningProcessed: false, // Unprocessed
                    },
               });

               const unprocessed = await EditMetadataStorageService.getUnprocessedEdits(
                    testUserId.toString()
               );

               expect(unprocessed).toHaveLength(1);
               expect(unprocessed[0].editMetadata!.originalText).toBe('Text 2');
               expect(unprocessed[0].editMetadata!.learningProcessed).toBe(false);
          });

          test('should mark edits as processed', async () => {
               const content1 = await Content.create({
                    analysisId: testAnalysisId,
                    userId: testUserId,
                    platform: 'x',
                    tone: 'casual',
                    generatedText: 'Text 1',
                    editedText: 'Edited 1',
                    version: 1,
                    editMetadata: {
                         originalText: 'Text 1',
                         originalLength: 10,
                         editedLength: 15,
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
                         editTimestamp: new Date(),
                         learningProcessed: false,
                    },
               });

               const content2 = await Content.create({
                    analysisId: testAnalysisId,
                    userId: testUserId,
                    platform: 'x',
                    tone: 'casual',
                    generatedText: 'Text 2',
                    editedText: 'Edited 2',
                    version: 1,
                    editMetadata: {
                         originalText: 'Text 2',
                         originalLength: 10,
                         editedLength: 15,
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
                         editTimestamp: new Date(),
                         learningProcessed: false,
                    },
               });

               const marked = await EditMetadataStorageService.markEditsAsProcessed([
                    content1._id.toString(),
                    content2._id.toString(),
               ]);

               expect(marked).toBe(2);

               // Verify they are marked as processed
               const updated1 = await Content.findById(content1._id);
               const updated2 = await Content.findById(content2._id);

               expect(updated1!.editMetadata!.learningProcessed).toBe(true);
               expect(updated2!.editMetadata!.learningProcessed).toBe(true);
          });
     });

     describe('Storage Limit Enforcement', () => {
          test('should enforce 50 edit limit per user', async () => {
               // Create 60 edits
               const now = Date.now();
               for (let i = 0; i < 60; i++) {
                    await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 10,
                              editedLength: 15,
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
                              editTimestamp: new Date(now - (60 - i) * 1000), // Older to newer
                              learningProcessed: false,
                         },
                    });
               }

               const countBefore = await EditMetadataStorageService.getEditCount(
                    testUserId.toString()
               );
               expect(countBefore).toBe(60);

               // Prune old edits
               const pruned = await EditMetadataStorageService.pruneOldEditMetadata(
                    testUserId.toString()
               );

               expect(pruned).toBe(10); // Should prune 10 oldest edits

               const countAfter = await EditMetadataStorageService.getEditCount(
                    testUserId.toString()
               );
               expect(countAfter).toBe(50);
          });

          test('should not prune when edit count is below limit', async () => {
               // Create 30 edits
               for (let i = 0; i < 30; i++) {
                    await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 10,
                              editedLength: 15,
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
               }

               const countBefore = await EditMetadataStorageService.getEditCount(
                    testUserId.toString()
               );
               expect(countBefore).toBe(30);

               const pruned = await EditMetadataStorageService.pruneOldEditMetadata(
                    testUserId.toString()
               );

               expect(pruned).toBe(0); // Should not prune anything

               const countAfter = await EditMetadataStorageService.getEditCount(
                    testUserId.toString()
               );
               expect(countAfter).toBe(30);
          });
     });

     describe('Pruning Logic', () => {
          test('should delete oldest edits when limit exceeded', async () => {
               const now = Date.now();
               const timestamps: number[] = [];

               // Create 55 edits with known timestamps
               for (let i = 0; i < 55; i++) {
                    const timestamp = now - (55 - i) * 60000; // 1 minute apart, oldest first
                    timestamps.push(timestamp);

                    await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 10,
                              editedLength: 15,
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
                              editTimestamp: new Date(timestamp),
                              learningProcessed: false,
                         },
                    });
               }

               // Prune
               await EditMetadataStorageService.pruneOldEditMetadata(testUserId.toString());

               // Get remaining edits
               const remaining = await EditMetadataStorageService.getRecentEdits({
                    userId: testUserId.toString(),
                    limit: 100,
               });

               expect(remaining).toHaveLength(50);

               // Verify the remaining edits are the 50 most recent
               const remainingTimestamps = remaining.map(e =>
                    e.editMetadata!.editTimestamp.getTime()
               );

               // The 50 most recent timestamps should be the last 50 in our array
               const expected50MostRecent = timestamps.slice(-50).sort((a, b) => b - a);
               const actualSorted = remainingTimestamps.sort((a, b) => b - a);

               expect(actualSorted).toEqual(expected50MostRecent);
          });

          test('should preserve content but remove edit metadata', async () => {
               // Create 60 edits
               const contentIds: string[] = [];
               for (let i = 0; i < 60; i++) {
                    const content = await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 10,
                              editedLength: 15,
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
                              editTimestamp: new Date(Date.now() - (60 - i) * 1000),
                              learningProcessed: false,
                         },
                    });
                    contentIds.push(content._id.toString());
               }

               // Prune
               await EditMetadataStorageService.pruneOldEditMetadata(testUserId.toString());

               // Verify all content still exists
               const allContent = await Content.find({ userId: testUserId });
               expect(allContent).toHaveLength(60);

               // Verify only 50 have edit metadata
               const withMetadata = allContent.filter(c => c.editMetadata !== undefined);
               expect(withMetadata).toHaveLength(50);

               // Verify the oldest 10 don't have edit metadata
               const withoutMetadata = allContent.filter(c => c.editMetadata === undefined);
               expect(withoutMetadata).toHaveLength(10);
          });
     });

     describe('Aggregation Queries', () => {
          test('should aggregate edit patterns correctly', async () => {
               // Create edits with various patterns
               const edits = [
                    {
                         sentenceLengthDelta: -2,
                         emojiChanges: { added: 2, removed: 0, netChange: 2 },
                         toneShift: 'more casual',
                         phrasesAdded: ['Let me explain', 'Here\'s the thing'],
                         phrasesRemoved: ['In conclusion'],
                    },
                    {
                         sentenceLengthDelta: -3,
                         emojiChanges: { added: 1, removed: 0, netChange: 1 },
                         toneShift: 'more casual',
                         phrasesAdded: ['Let me explain'],
                         phrasesRemoved: ['Furthermore'],
                    },
                    {
                         sentenceLengthDelta: -1,
                         emojiChanges: { added: 3, removed: 1, netChange: 2 },
                         toneShift: 'no change',
                         phrasesAdded: ['Here\'s the thing'],
                         phrasesRemoved: ['In conclusion'],
                    },
               ];

               for (let i = 0; i < edits.length; i++) {
                    const edit = edits[i];
                    await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 100,
                              editedLength: 110,
                              sentenceLengthDelta: edit.sentenceLengthDelta,
                              emojiChanges: edit.emojiChanges,
                              structureChanges: {
                                   paragraphsAdded: i,
                                   paragraphsRemoved: 0,
                                   bulletsAdded: i % 2 === 0,
                                   formattingChanges: [],
                              },
                              toneShift: edit.toneShift,
                              vocabularyChanges: { wordsSubstituted: [], complexityShift: 0 },
                              phrasesAdded: edit.phrasesAdded,
                              phrasesRemoved: edit.phrasesRemoved,
                              editTimestamp: new Date(Date.now() - (3 - i) * 1000),
                              learningProcessed: false,
                         },
                    });
               }

               const patterns = await EditMetadataStorageService.aggregateEditPatterns(
                    testUserId.toString()
               );

               expect(patterns.totalEdits).toBe(3);

               // Average sentence length delta: (-2 + -3 + -1) / 3 = -2
               expect(patterns.avgSentenceLengthDelta).toBeCloseTo(-2, 1);

               // Total emoji changes: (2+1+3) added, (0+0+1) removed, (2+1+2) net
               expect(patterns.totalEmojiChanges.added).toBe(6);
               expect(patterns.totalEmojiChanges.removed).toBe(1);
               expect(patterns.totalEmojiChanges.netChange).toBe(5);

               // Common tone shifts: 'more casual' appears 2 times
               expect(patterns.commonToneShifts).toHaveLength(1);
               expect(patterns.commonToneShifts[0].shift).toBe('more casual');
               expect(patterns.commonToneShifts[0].count).toBe(2);

               // Common phrases added: 'Let me explain' (2), 'Here's the thing' (2)
               expect(patterns.commonPhrasesAdded.length).toBeGreaterThanOrEqual(2);
               const letMeExplain = patterns.commonPhrasesAdded.find(p => p.phrase === 'Let me explain');
               expect(letMeExplain?.count).toBe(2);

               // Common phrases removed: 'In conclusion' (2), 'Furthermore' (1)
               expect(patterns.commonPhrasesRemoved.length).toBeGreaterThanOrEqual(2);
               const inConclusion = patterns.commonPhrasesRemoved.find(p => p.phrase === 'In conclusion');
               expect(inConclusion?.count).toBe(2);

               // Structure changes: paragraphs added (0+1+2=3), bullets added (2 times)
               expect(patterns.structureChangeFrequency.paragraphsAdded).toBe(3);
               expect(patterns.structureChangeFrequency.bulletsAdded).toBe(2);
          });

          test('should return empty patterns for user with no edits', async () => {
               const patterns = await EditMetadataStorageService.aggregateEditPatterns(
                    testUserId.toString()
               );

               expect(patterns.totalEdits).toBe(0);
               expect(patterns.avgSentenceLengthDelta).toBe(0);
               expect(patterns.totalEmojiChanges.added).toBe(0);
               expect(patterns.commonToneShifts).toHaveLength(0);
               expect(patterns.commonPhrasesAdded).toHaveLength(0);
               expect(patterns.commonPhrasesRemoved).toHaveLength(0);
          });

          test('should limit aggregation to specified number of edits', async () => {
               // Create 20 edits
               for (let i = 0; i < 20; i++) {
                    await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 100,
                              editedLength: 110,
                              sentenceLengthDelta: 1,
                              emojiChanges: { added: 1, removed: 0, netChange: 1 },
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
               }

               // Aggregate only 10 most recent
               const patterns = await EditMetadataStorageService.aggregateEditPatterns(
                    testUserId.toString(),
                    10
               );

               expect(patterns.totalEdits).toBe(10);
               expect(patterns.totalEmojiChanges.added).toBe(10); // 1 per edit * 10 edits
          });
     });

     describe('Edit Count', () => {
          test('should return correct edit count for user', async () => {
               // Create 15 edits
               for (let i = 0; i < 15; i++) {
                    await Content.create({
                         analysisId: testAnalysisId,
                         userId: testUserId,
                         platform: 'x',
                         tone: 'casual',
                         generatedText: `Text ${i}`,
                         editedText: `Edited ${i}`,
                         version: 1,
                         editMetadata: {
                              originalText: `Text ${i}`,
                              originalLength: 10,
                              editedLength: 15,
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
                              editTimestamp: new Date(),
                              learningProcessed: false,
                         },
                    });
               }

               const count = await EditMetadataStorageService.getEditCount(testUserId.toString());
               expect(count).toBe(15);
          });

          test('should return 0 for user with no edits', async () => {
               const count = await EditMetadataStorageService.getEditCount(testUserId.toString());
               expect(count).toBe(0);
          });

          test('should not count content without edit metadata', async () => {
               // Create content without edit metadata
               await Content.create({
                    analysisId: testAnalysisId,
                    userId: testUserId,
                    platform: 'x',
                    tone: 'casual',
                    generatedText: 'Text without metadata',
                    editedText: 'Edited without metadata',
                    version: 1,
               });

               // Create content with edit metadata
               await Content.create({
                    analysisId: testAnalysisId,
                    userId: testUserId,
                    platform: 'x',
                    tone: 'casual',
                    generatedText: 'Text with metadata',
                    editedText: 'Edited with metadata',
                    version: 1,
                    editMetadata: {
                         originalText: 'Text with metadata',
                         originalLength: 10,
                         editedLength: 15,
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
                         editTimestamp: new Date(),
                         learningProcessed: false,
                    },
               });

               const count = await EditMetadataStorageService.getEditCount(testUserId.toString());
               expect(count).toBe(1); // Only the one with metadata
          });
     });
});
