import mongoose from 'mongoose';
import { Content, IContent } from '../models/Content';
import { LEARNING_CONFIG } from '../config/constants';

export interface EditMetadataQuery {
     userId: string;
     limit?: number;
     includeProcessed?: boolean;
}

export interface EditedTweet {
     position: number;
     text: string;
}

export interface AggregatedEditPatterns {
     totalEdits: number;
     avgSentenceLengthDelta: number;
     totalEmojiChanges: {
          added: number;
          removed: number;
          netChange: number;
     };
     commonToneShifts: Array<{ shift: string; count: number }>;
     commonPhrasesAdded: Array<{ phrase: string; count: number }>;
     commonPhrasesRemoved: Array<{ phrase: string; count: number }>;
     structureChangeFrequency: {
          paragraphsAdded: number;
          paragraphsRemoved: number;
          bulletsAdded: number;
     };
}

export class EditMetadataStorageService {
     private static readonly MAX_EDITS_PER_USER = 50;

     /**
      * Prune old edit metadata for a user, keeping only the 50 most recent
      */
     static async pruneOldEditMetadata(userId: string): Promise<number> {
          try {
               console.log(`[EditMetadataStorage] Pruning old edit metadata for user ${userId}`);

               // Get all content with edit metadata for this user, sorted by edit timestamp
               const allEdits = await Content.find({
                    userId: new mongoose.Types.ObjectId(userId),
                    editMetadata: { $exists: true },
               })
                    .sort({ 'editMetadata.editTimestamp': -1 })
                    .select('_id editMetadata.editTimestamp');

               // If we have more than MAX_EDITS_PER_USER, delete the oldest ones
               if (allEdits.length > this.MAX_EDITS_PER_USER) {
                    const editsToKeep = allEdits.slice(0, this.MAX_EDITS_PER_USER);
                    const editsToDelete = allEdits.slice(this.MAX_EDITS_PER_USER);

                    const idsToDelete = editsToDelete.map(e => e._id);

                    // Remove edit metadata from old content (but keep the content itself)
                    const result = await Content.updateMany(
                         { _id: { $in: idsToDelete } },
                         { $unset: { editMetadata: '' } }
                    );

                    console.log(`[EditMetadataStorage] Pruned ${result.modifiedCount} old edit metadata entries for user ${userId}`);
                    return result.modifiedCount;
               }

               console.log(`[EditMetadataStorage] No pruning needed for user ${userId} (${allEdits.length} edits)`);
               return 0;
          } catch (error: any) {
               console.error(`[EditMetadataStorage] Failed to prune edit metadata:`, error.message);
               throw error;
          }
     }

     /**
      * Get recent edits for a user
      */
     static async getRecentEdits(query: EditMetadataQuery): Promise<IContent[]> {
          try {
               const { userId, limit = 20, includeProcessed = true } = query;

               const filter: any = {
                    userId: new mongoose.Types.ObjectId(userId),
                    editMetadata: { $exists: true },
               };

               // Optionally filter by processed status
               if (!includeProcessed) {
                    filter['editMetadata.learningProcessed'] = false;
               }

               const edits = await Content.find(filter)
                    .sort({ 'editMetadata.editTimestamp': -1 })
                    .limit(limit);

               console.log(`[EditMetadataStorage] Retrieved ${edits.length} recent edits for user ${userId}`);
               return edits;
          } catch (error: any) {
               console.error(`[EditMetadataStorage] Failed to get recent edits:`, error.message);
               throw error;
          }
     }

     /**
      * Get unprocessed edits for learning
      */
     static async getUnprocessedEdits(userId: string, limit: number = 20): Promise<IContent[]> {
          return this.getRecentEdits({
               userId,
               limit,
               includeProcessed: false,
          });
     }

     /**
      * Mark edits as processed
      */
     static async markEditsAsProcessed(contentIds: string[]): Promise<number> {
          try {
               const objectIds = contentIds.map(id => new mongoose.Types.ObjectId(id));

               const result = await Content.updateMany(
                    { _id: { $in: objectIds } },
                    { $set: { 'editMetadata.learningProcessed': true } }
               );

               console.log(`[EditMetadataStorage] Marked ${result.modifiedCount} edits as processed`);
               return result.modifiedCount;
          } catch (error: any) {
               console.error(`[EditMetadataStorage] Failed to mark edits as processed:`, error.message);
               throw error;
          }
     }

     /**
      * Aggregate edit patterns for learning
      */
     static async aggregateEditPatterns(userId: string, limit: number = 50): Promise<AggregatedEditPatterns> {
          try {
               console.log(`[EditMetadataStorage] Aggregating edit patterns for user ${userId}`);

               const edits = await this.getRecentEdits({ userId, limit });

               if (edits.length === 0) {
                    return {
                         totalEdits: 0,
                         avgSentenceLengthDelta: 0,
                         totalEmojiChanges: { added: 0, removed: 0, netChange: 0 },
                         commonToneShifts: [],
                         commonPhrasesAdded: [],
                         commonPhrasesRemoved: [],
                         structureChangeFrequency: {
                              paragraphsAdded: 0,
                              paragraphsRemoved: 0,
                              bulletsAdded: 0,
                         },
                    };
               }

               // Calculate average sentence length delta
               const sentenceDeltas = edits
                    .filter(e => e.editMetadata)
                    .map(e => e.editMetadata!.sentenceLengthDelta);
               const avgSentenceLengthDelta = sentenceDeltas.length > 0
                    ? sentenceDeltas.reduce((sum, d) => sum + d, 0) / sentenceDeltas.length
                    : 0;

               // Aggregate emoji changes
               const totalEmojiChanges = edits
                    .filter(e => e.editMetadata)
                    .reduce(
                         (acc, e) => ({
                              added: acc.added + e.editMetadata!.emojiChanges.added,
                              removed: acc.removed + e.editMetadata!.emojiChanges.removed,
                              netChange: acc.netChange + e.editMetadata!.emojiChanges.netChange,
                         }),
                         { added: 0, removed: 0, netChange: 0 }
                    );

               // Count tone shifts
               const toneShiftCounts: Record<string, number> = {};
               edits.filter(e => e.editMetadata).forEach(e => {
                    const shift = e.editMetadata!.toneShift;
                    if (shift && shift !== 'no change') {
                         toneShiftCounts[shift] = (toneShiftCounts[shift] || 0) + 1;
                    }
               });
               const commonToneShifts = Object.entries(toneShiftCounts)
                    .map(([shift, count]) => ({ shift, count }))
                    .sort((a, b) => b.count - a.count);

               // Count phrases added
               const phrasesAddedCounts: Record<string, number> = {};
               edits.filter(e => e.editMetadata).forEach(e => {
                    e.editMetadata!.phrasesAdded.forEach(phrase => {
                         phrasesAddedCounts[phrase] = (phrasesAddedCounts[phrase] || 0) + 1;
                    });
               });
               const commonPhrasesAdded = Object.entries(phrasesAddedCounts)
                    .map(([phrase, count]) => ({ phrase, count }))
                    .sort((a, b) => b.count - a.count);

               // Count phrases removed
               const phrasesRemovedCounts: Record<string, number> = {};
               edits.filter(e => e.editMetadata).forEach(e => {
                    e.editMetadata!.phrasesRemoved.forEach(phrase => {
                         phrasesRemovedCounts[phrase] = (phrasesRemovedCounts[phrase] || 0) + 1;
                    });
               });
               const commonPhrasesRemoved = Object.entries(phrasesRemovedCounts)
                    .map(([phrase, count]) => ({ phrase, count }))
                    .sort((a, b) => b.count - a.count);

               // Aggregate structure changes
               const structureChangeFrequency = edits
                    .filter(e => e.editMetadata)
                    .reduce(
                         (acc, e) => ({
                              paragraphsAdded: acc.paragraphsAdded + e.editMetadata!.structureChanges.paragraphsAdded,
                              paragraphsRemoved: acc.paragraphsRemoved + e.editMetadata!.structureChanges.paragraphsRemoved,
                              bulletsAdded: acc.bulletsAdded + (e.editMetadata!.structureChanges.bulletsAdded ? 1 : 0),
                         }),
                         { paragraphsAdded: 0, paragraphsRemoved: 0, bulletsAdded: 0 }
                    );

               const patterns: AggregatedEditPatterns = {
                    totalEdits: edits.length,
                    avgSentenceLengthDelta,
                    totalEmojiChanges,
                    commonToneShifts,
                    commonPhrasesAdded,
                    commonPhrasesRemoved,
                    structureChangeFrequency,
               };

               console.log(`[EditMetadataStorage] Aggregated patterns from ${edits.length} edits`);
               return patterns;
          } catch (error: any) {
               console.error(`[EditMetadataStorage] Failed to aggregate edit patterns:`, error.message);
               throw error;
          }
     }

     /**
      * Get edit count for a user
      */
     static async getEditCount(userId: string): Promise<number> {
          try {
               const count = await Content.countDocuments({
                    userId: new mongoose.Types.ObjectId(userId),
                    editMetadata: { $exists: true },
               });

               return count;
          } catch (error: any) {
               console.error(`[EditMetadataStorage] Failed to get edit count:`, error.message);
               throw error;
          }
     }

     /**
      * Store edit metadata for thread edits
      * Handles multiple edited tweets and stores aggregated metadata
      * Maintains backward compatibility with single post edits
      */
     static async storeThreadEditMetadata(
          contentId: string,
          editedTweets: EditedTweet[],
          originalTweets: Array<{ position: number; text: string }>
     ): Promise<void> {
          try {
               console.log(`[EditMetadataStorage] Storing thread edit metadata for content ${contentId}`);

               const content = await Content.findById(contentId);
               if (!content) {
                    throw new Error(`Content ${contentId} not found`);
               }

               // Aggregate metadata from all edited tweets
               let totalSentenceLengthDelta = 0;
               let totalEmojiAdded = 0;
               let totalEmojiRemoved = 0;
               let totalParagraphsAdded = 0;
               let totalParagraphsRemoved = 0;
               let allPhrasesAdded: string[] = [];
               let allPhrasesRemoved: string[] = [];
               let toneShifts: string[] = [];
               let allWordsSubstituted: Array<{ from: string; to: string }> = [];
               let totalComplexityShift = 0;
               let bulletsAddedCount = 0;
               let formattingChanges: string[] = [];

               // Concatenate all original and edited texts for aggregated metadata
               const originalText = originalTweets.map(t => t.text).join('\n\n');
               const editedText = editedTweets.map(t => t.text).join('\n\n');

               // Import StyleDeltaExtractionService for delta extraction
               const { StyleDeltaExtractionService } = await import('./StyleDeltaExtractionService');
               const apiKey = process.env.GEMINI_API_KEY || '';
               const deltaService = new StyleDeltaExtractionService(apiKey);

               // Extract deltas for each edited tweet
               for (const editedTweet of editedTweets) {
                    const originalTweet = originalTweets.find(t => t.position === editedTweet.position);
                    if (!originalTweet) {
                         console.warn(`[EditMetadataStorage] Original tweet at position ${editedTweet.position} not found`);
                         continue;
                    }

                    // Extract style deltas for this tweet
                    const delta = await deltaService.extractDeltas(originalTweet.text, editedTweet.text);

                    // Aggregate deltas
                    totalSentenceLengthDelta += delta.sentenceLengthDelta;
                    totalEmojiAdded += delta.emojiChanges.added;
                    totalEmojiRemoved += delta.emojiChanges.removed;
                    totalParagraphsAdded += delta.structureChanges.paragraphsAdded;
                    totalParagraphsRemoved += delta.structureChanges.paragraphsRemoved;
                    if (delta.structureChanges.bulletsAdded) {
                         bulletsAddedCount++;
                    }
                    formattingChanges.push(...delta.structureChanges.formattingChanges);
                    allPhrasesAdded.push(...delta.phrasesAdded);
                    allPhrasesRemoved.push(...delta.phrasesRemoved);
                    if (delta.toneShift && delta.toneShift !== 'no change') {
                         toneShifts.push(delta.toneShift);
                    }
                    allWordsSubstituted.push(...delta.vocabularyChanges.wordsSubstituted);
                    totalComplexityShift += delta.vocabularyChanges.complexityShift;
               }

               // Calculate averages
               const avgSentenceLengthDelta = editedTweets.length > 0
                    ? totalSentenceLengthDelta / editedTweets.length
                    : 0;
               const avgComplexityShift = editedTweets.length > 0
                    ? Math.round(totalComplexityShift / editedTweets.length)
                    : 0;

               // Determine most common tone shift
               const toneShiftCounts: Record<string, number> = {};
               toneShifts.forEach(shift => {
                    toneShiftCounts[shift] = (toneShiftCounts[shift] || 0) + 1;
               });
               const mostCommonToneShift = Object.entries(toneShiftCounts)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'no change';

               // Remove duplicates from phrases
               const uniquePhrasesAdded = [...new Set(allPhrasesAdded)];
               const uniquePhrasesRemoved = [...new Set(allPhrasesRemoved)];
               const uniqueFormattingChanges = [...new Set(formattingChanges)];

               // Limit word substitutions to top 10
               const limitedWordsSubstituted = allWordsSubstituted.slice(0, 10);

               // Store aggregated metadata
               content.editMetadata = {
                    originalText,
                    originalLength: originalText.length,
                    editedLength: editedText.length,
                    sentenceLengthDelta: avgSentenceLengthDelta,
                    emojiChanges: {
                         added: totalEmojiAdded,
                         removed: totalEmojiRemoved,
                         netChange: totalEmojiAdded - totalEmojiRemoved,
                    },
                    structureChanges: {
                         paragraphsAdded: totalParagraphsAdded,
                         paragraphsRemoved: totalParagraphsRemoved,
                         bulletsAdded: bulletsAddedCount > 0,
                         formattingChanges: uniqueFormattingChanges,
                    },
                    toneShift: mostCommonToneShift,
                    vocabularyChanges: {
                         wordsSubstituted: limitedWordsSubstituted,
                         complexityShift: avgComplexityShift,
                    },
                    phrasesAdded: uniquePhrasesAdded.slice(0, 10),
                    phrasesRemoved: uniquePhrasesRemoved.slice(0, 10),
                    editTimestamp: new Date(),
                    learningProcessed: false,
               };

               // Update editedText with concatenated edited tweets
               content.editedText = editedText;

               await content.save();

               console.log(`[EditMetadataStorage] Thread edit metadata stored successfully for content ${contentId}`);
               console.log(`[EditMetadataStorage] Aggregated ${editedTweets.length} tweet edits`);
          } catch (error: any) {
               console.error(`[EditMetadataStorage] Failed to store thread edit metadata:`, error.message);
               throw error;
          }
     }
}
