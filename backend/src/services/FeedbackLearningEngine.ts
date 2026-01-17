import mongoose from 'mongoose';
import { User, IUser, StyleProfile, ToneMetrics, WritingTraits, StructurePreferences } from '../models/User';
import { Content, IContent } from '../models/Content';
import { LearningJob, ILearningJob, StyleDelta } from '../models/LearningJob';
import { StyleDeltaExtractionService } from './StyleDeltaExtractionService';
import { queueLearningJob as queueJob } from '../config/queue';

interface PatternDetectionResult {
     sentenceLengthPattern?: number; // Average delta across edits
     emojiPattern?: { shouldUse: boolean; frequency: number };
     ctaPattern?: boolean;
     bannedPhrases: string[];
     commonPhrases: string[];
     tonePattern?: string;
     structurePattern?: Partial<StructurePreferences>;
}

export class FeedbackLearningEngine {
     private styleDeltaService: StyleDeltaExtractionService;
     private rateLimitMap: Map<string, number> = new Map(); // userId -> last update timestamp
     private editBatchMap: Map<string, string[]> = new Map(); // userId -> contentIds in batch

     constructor(geminiApiKey: string) {
          this.styleDeltaService = new StyleDeltaExtractionService(geminiApiKey);
     }

     /**
      * Queue a learning job for asynchronous processing
      * Returns immediately without waiting for processing
      */
     async queueLearningJob(userId: string, contentId: string, priority: number = 0): Promise<void> {
          try {
               // Check if we should batch this edit
               const shouldBatch = this.shouldBatchEdit(userId);

               if (shouldBatch) {
                    // Add to batch
                    const batch = this.editBatchMap.get(userId) || [];
                    batch.push(contentId);
                    this.editBatchMap.set(userId, batch);

                    console.log(`[FeedbackLearning] Added content ${contentId} to batch for user ${userId}`);

                    // Set timer to process batch after 5 minutes
                    setTimeout(() => {
                         this.processBatch(userId);
                    }, 5 * 60 * 1000);

                    return;
               }

               // Create learning job in database
               const learningJob = new LearningJob({
                    userId: new mongoose.Types.ObjectId(userId),
                    contentId: new mongoose.Types.ObjectId(contentId),
                    status: 'pending',
                    priority,
                    attempts: 0,
               });

               await learningJob.save();

               // Queue job for processing
               await queueJob(userId, contentId, priority);

               console.log(`[FeedbackLearning] Queued learning job for user ${userId}, content ${contentId}`);
          } catch (error: any) {
               console.error(`[FeedbackLearning] Failed to queue learning job:`, error.message);
               // Don't throw - learning failures should not block user
          }
     }

     /**
      * Process a learning job (called by worker)
      */
     async processLearningJob(jobId: string): Promise<void> {
          let learningJob: ILearningJob | null = null;

          try {
               // Find the learning job
               learningJob = await LearningJob.findById(jobId);

               if (!learningJob) {
                    throw new Error(`Learning job ${jobId} not found`);
               }

               // Update status to processing
               learningJob.status = 'processing';
               learningJob.processingStarted = new Date();
               learningJob.attempts += 1;
               await learningJob.save();

               console.log(`[FeedbackLearning] Processing job ${jobId} (attempt ${learningJob.attempts})`);

               // Extract style deltas
               const styleDelta = await this.extractStyleDeltas(
                    learningJob.userId.toString(),
                    learningJob.contentId.toString()
               );

               // Store delta in job
               learningJob.styleDelta = styleDelta;
               await learningJob.save();

               // Update profile from deltas
               await this.updateProfileFromDeltas(learningJob.userId.toString(), [styleDelta]);

               // Mark job as completed
               learningJob.status = 'completed';
               learningJob.processingCompleted = new Date();
               await learningJob.save();

               console.log(`[FeedbackLearning] Completed job ${jobId}`);
          } catch (error: any) {
               console.error(`[FeedbackLearning] Job ${jobId} failed:`, error.message);

               if (learningJob) {
                    learningJob.status = 'failed';
                    learningJob.error = error.message;
                    learningJob.processingCompleted = new Date();
                    await learningJob.save();
               }

               throw error; // Re-throw for retry logic
          }
     }

     /**
      * Extract style deltas from a content edit
      */
     async extractStyleDeltas(userId: string, contentId: string): Promise<StyleDelta> {
          // Fetch the content
          const content = await Content.findById(contentId);

          if (!content) {
               throw new Error(`Content ${contentId} not found`);
          }

          if (!content.editMetadata) {
               throw new Error(`Content ${contentId} has no edit metadata`);
          }

          // Use the stored edit metadata (already calculated when content was saved)
          const styleDelta: StyleDelta = {
               sentenceLengthDelta: content.editMetadata.sentenceLengthDelta,
               emojiChanges: content.editMetadata.emojiChanges,
               structureChanges: content.editMetadata.structureChanges,
               toneShift: content.editMetadata.toneShift,
               vocabularyChanges: content.editMetadata.vocabularyChanges,
               phrasesAdded: content.editMetadata.phrasesAdded,
               phrasesRemoved: content.editMetadata.phrasesRemoved,
          };

          console.log(`[FeedbackLearning] Extracted style delta for content ${contentId}`);

          return styleDelta;
     }

     /**
      * Update user profile from style deltas
      */
     async updateProfileFromDeltas(userId: string, deltas: StyleDelta[]): Promise<void> {
          // Check rate limiting
          if (!this.canUpdateProfile(userId)) {
               console.log(`[FeedbackLearning] Rate limit hit for user ${userId}, skipping update`);
               return;
          }

          // Fetch user
          const user = await User.findById(userId);

          if (!user) {
               throw new Error(`User ${userId} not found`);
          }

          // If no profile exists, create a default one
          if (!user.styleProfile) {
               console.log(`[FeedbackLearning] User ${userId} has no profile, skipping learning`);
               return;
          }

          // Get recent edits for pattern detection
          const recentEdits = await this.getRecentEdits(userId, 20);

          // Detect patterns across multiple edits
          const patterns = this.detectPatterns(recentEdits);

          // Check minimum edit threshold for major changes
          const editCount = await this.getEditCount(userId);
          const canMakeMajorChanges = editCount >= 5;

          // Apply weighted updates to profile
          const updatedProfile = this.applyWeightedUpdates(
               user.styleProfile,
               patterns,
               user.manualOverrides,
               canMakeMajorChanges
          );

          // Increment learning iterations
          updatedProfile.learningIterations += 1;
          updatedProfile.lastUpdated = new Date();

          // Save updated profile
          user.styleProfile = updatedProfile;
          await user.save();

          // Update rate limit
          this.rateLimitMap.set(userId, Date.now());

          console.log(`[FeedbackLearning] Updated profile for user ${userId} (iteration ${updatedProfile.learningIterations})`);
     }

     /**
      * Check if edit should be batched (within 5-minute window)
      */
     private shouldBatchEdit(userId: string): boolean {
          const batch = this.editBatchMap.get(userId);

          if (!batch || batch.length === 0) {
               return false;
          }

          // If batch exists, we're within the 5-minute window
          return true;
     }

     /**
      * Process batched edits
      */
     private async processBatch(userId: string): Promise<void> {
          const batch = this.editBatchMap.get(userId);

          if (!batch || batch.length === 0) {
               return;
          }

          console.log(`[FeedbackLearning] Processing batch of ${batch.length} edits for user ${userId}`);

          // Queue all edits in batch
          for (const contentId of batch) {
               await this.queueLearningJob(userId, contentId, 0);
          }

          // Clear batch
          this.editBatchMap.delete(userId);
     }

     /**
      * Check if profile can be updated (rate limiting)
      */
     private canUpdateProfile(userId: string): boolean {
          const lastUpdate = this.rateLimitMap.get(userId);

          if (!lastUpdate) {
               return true;
          }

          const timeSinceLastUpdate = Date.now() - lastUpdate;
          const fiveMinutes = 5 * 60 * 1000;

          return timeSinceLastUpdate >= fiveMinutes;
     }

     /**
      * Get recent edits for pattern detection
      */
     private async getRecentEdits(userId: string, limit: number = 20): Promise<IContent[]> {
          const contents = await Content.find({
               userId: new mongoose.Types.ObjectId(userId),
               editMetadata: { $exists: true },
          })
               .sort({ 'editMetadata.editTimestamp': -1 })
               .limit(limit);

          return contents;
     }

     /**
      * Get total edit count for user
      */
     private async getEditCount(userId: string): Promise<number> {
          const count = await Content.countDocuments({
               userId: new mongoose.Types.ObjectId(userId),
               editMetadata: { $exists: true },
          });

          return count;
     }

     /**
      * Detect patterns across multiple edits
      */
     private detectPatterns(edits: IContent[]): PatternDetectionResult {
          const result: PatternDetectionResult = {
               bannedPhrases: [],
               commonPhrases: [],
          };

          if (edits.length === 0) {
               return result;
          }

          // Apply recency weighting (more recent edits weighted more heavily)
          const weights = this.calculateRecencyWeights(edits.length);

          // Detect sentence length pattern (weighted average)
          const sentenceLengthDeltas = edits
               .filter(e => e.editMetadata)
               .map(e => e.editMetadata!.sentenceLengthDelta);

          if (sentenceLengthDeltas.length >= 3) {
               const weightedAvg = this.weightedAverage(sentenceLengthDeltas, weights);
               if (Math.abs(weightedAvg) > 2) {
                    result.sentenceLengthPattern = weightedAvg;
               }
          }

          // Detect emoji pattern (3+ edits adding emojis)
          const emojiAdditions = edits
               .filter(e => e.editMetadata && e.editMetadata.emojiChanges.added > 0)
               .length;

          if (emojiAdditions >= 3) {
               const avgFrequency = edits
                    .filter(e => e.editMetadata)
                    .reduce((sum, e) => sum + e.editMetadata!.emojiChanges.added, 0) / edits.length;

               result.emojiPattern = {
                    shouldUse: true,
                    frequency: Math.min(5, Math.ceil(avgFrequency)),
               };
          }

          // Detect CTA pattern (3+ edits adding CTAs)
          const ctaAdditions = edits
               .filter(e => e.editMetadata && e.editMetadata.phrasesAdded.some(p =>
                    p.includes('check out') || p.includes('learn more') || p.includes('click') ||
                    p.includes('visit') || p.includes('try') || p.includes('get started')
               ))
               .length;

          if (ctaAdditions >= 3) {
               result.ctaPattern = true;
          }

          // Detect banned phrases (2+ removals)
          const phraseRemovalCounts = new Map<string, number>();

          for (const edit of edits) {
               if (edit.editMetadata) {
                    for (const phrase of edit.editMetadata.phrasesRemoved) {
                         phraseRemovalCounts.set(phrase, (phraseRemovalCounts.get(phrase) || 0) + 1);
                    }
               }
          }

          for (const [phrase, count] of phraseRemovalCounts.entries()) {
               if (count >= 2) {
                    result.bannedPhrases.push(phrase);
               }
          }

          // Detect common phrases (3+ additions)
          const phraseAdditionCounts = new Map<string, number>();

          for (const edit of edits) {
               if (edit.editMetadata) {
                    for (const phrase of edit.editMetadata.phrasesAdded) {
                         phraseAdditionCounts.set(phrase, (phraseAdditionCounts.get(phrase) || 0) + 1);
                    }
               }
          }

          for (const [phrase, count] of phraseAdditionCounts.entries()) {
               if (count >= 3) {
                    result.commonPhrases.push(phrase);
               }
          }

          // Detect tone pattern (most common tone shift)
          const toneShifts = edits
               .filter(e => e.editMetadata && e.editMetadata.toneShift !== 'no change')
               .map(e => e.editMetadata!.toneShift);

          if (toneShifts.length >= 3) {
               const mostCommonTone = this.findMostCommon(toneShifts);
               if (mostCommonTone) {
                    result.tonePattern = mostCommonTone;
               }
          }

          return result;
     }

     /**
      * Apply weighted updates to profile based on patterns
      */
     private applyWeightedUpdates(
          profile: StyleProfile,
          patterns: PatternDetectionResult,
          manualOverrides: any,
          canMakeMajorChanges: boolean
     ): StyleProfile {
          // Deep clone the profile to avoid mutations
          const updated: StyleProfile = {
               ...profile,
               tone: { ...profile.tone },
               writingTraits: { ...profile.writingTraits },
               structurePreferences: { ...profile.structurePreferences },
               commonPhrases: [...profile.commonPhrases],
               bannedPhrases: [...profile.bannedPhrases],
               samplePosts: [...profile.samplePosts],
          };

          // Update sentence length (10-20% adjustment)
          if (patterns.sentenceLengthPattern && !manualOverrides?.writingTraits?.avgSentenceLength) {
               const adjustment = patterns.sentenceLengthPattern * 0.15; // 15% of delta
               updated.writingTraits.avgSentenceLength = Math.max(5, updated.writingTraits.avgSentenceLength + adjustment);
          }

          // Update emoji usage
          if (patterns.emojiPattern && !manualOverrides?.writingTraits?.usesEmojis) {
               updated.writingTraits.usesEmojis = patterns.emojiPattern.shouldUse;
               updated.writingTraits.emojiFrequency = patterns.emojiPattern.frequency;
          }

          // Update ending style for CTA pattern
          if (patterns.ctaPattern && !manualOverrides?.structurePreferences?.endingStyle) {
               updated.structurePreferences.endingStyle = 'cta';
          }

          // Add banned phrases (avoid duplicates)
          if (patterns.bannedPhrases.length > 0) {
               const existingBanned = new Set(updated.bannedPhrases);
               for (const phrase of patterns.bannedPhrases) {
                    if (!existingBanned.has(phrase)) {
                         updated.bannedPhrases.push(phrase);
                    }
               }
               // Limit to 50 phrases
               updated.bannedPhrases = updated.bannedPhrases.slice(-50);
          }

          // Add common phrases (avoid duplicates)
          if (patterns.commonPhrases.length > 0) {
               const existingCommon = new Set(updated.commonPhrases);
               for (const phrase of patterns.commonPhrases) {
                    if (!existingCommon.has(phrase)) {
                         updated.commonPhrases.push(phrase);
                    }
               }
               // Limit to 50 phrases
               updated.commonPhrases = updated.commonPhrases.slice(-50);
          }

          // Update tone based on pattern (only if major changes allowed)
          if (patterns.tonePattern && canMakeMajorChanges && !manualOverrides?.tone) {
               updated.tone = this.adjustToneForPattern(updated.tone, patterns.tonePattern);
          }

          return updated;
     }

     /**
      * Adjust tone metrics based on detected pattern
      */
     private adjustToneForPattern(tone: ToneMetrics, pattern: string): ToneMetrics {
          const adjusted: ToneMetrics = { ...tone };

          switch (pattern) {
               case 'more casual':
                    adjusted.formality = Math.max(1, adjusted.formality - 1);
                    break;
               case 'more professional':
                    adjusted.formality = Math.min(10, adjusted.formality + 1);
                    break;
               case 'more enthusiastic':
                    adjusted.enthusiasm = Math.min(10, adjusted.enthusiasm + 1);
                    break;
               case 'more subdued':
                    adjusted.enthusiasm = Math.max(1, adjusted.enthusiasm - 1);
                    break;
               case 'more direct':
                    adjusted.directness = Math.min(10, adjusted.directness + 1);
                    break;
               case 'more indirect':
                    adjusted.directness = Math.max(1, adjusted.directness - 1);
                    break;
               case 'more humorous':
                    adjusted.humor = Math.min(10, adjusted.humor + 1);
                    break;
               case 'more serious':
                    adjusted.humor = Math.max(1, adjusted.humor - 1);
                    break;
          }

          return adjusted;
     }

     /**
      * Calculate recency weights (more recent = higher weight)
      */
     private calculateRecencyWeights(count: number): number[] {
          const weights: number[] = [];
          for (let i = 0; i < count; i++) {
               // Linear decay: most recent gets weight 1.0, oldest gets weight 0.5
               weights.push(0.5 + (0.5 * i / (count - 1)));
          }
          return weights.reverse(); // Reverse so most recent is first
     }

     /**
      * Calculate weighted average
      */
     private weightedAverage(values: number[], weights: number[]): number {
          if (values.length === 0) return 0;

          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          const normalizedWeights = weights.map(w => w / totalWeight);

          const sum = values.reduce((acc, val, i) => acc + val * normalizedWeights[i], 0);
          return sum;
     }

     /**
      * Find most common element in array
      */
     private findMostCommon<T>(arr: T[]): T | null {
          if (arr.length === 0) return null;

          const counts = new Map<T, number>();
          for (const item of arr) {
               counts.set(item, (counts.get(item) || 0) + 1);
          }

          let maxCount = 0;
          let mostCommon: T | null = null;

          for (const [item, count] of counts.entries()) {
               if (count > maxCount) {
                    maxCount = count;
                    mostCommon = item;
               }
          }

          return mostCommon;
     }
}
