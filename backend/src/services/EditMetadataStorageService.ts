import mongoose from 'mongoose';
import { Content, IContent } from '../models/Content';

export interface EditMetadataQuery {
     userId: string;
     limit?: number;
     includeProcessed?: boolean;
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
}
