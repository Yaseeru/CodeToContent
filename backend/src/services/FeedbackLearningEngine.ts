import mongoose from 'mongoose';
import { User, IUser, StyleProfile, ManualOverrides } from '../models/User';
import { Content, IContent } from '../models/Content';
import { LearningJob, ILearningJob, StyleDelta } from '../models/LearningJob';
import { StyleDeltaExtractionService } from './StyleDeltaExtractionService';
import { EditMetadataStorageService } from './EditMetadataStorageService';
import { queueLearningJob as queueJob } from '../config/queue';
import { cacheService } from './CacheService';

interface DetectedPatterns {
     sentenceLengthPattern?: number;
     emojiPattern?: {
          shouldUse: boolean;
          frequency: number;
     };
     ctaPattern?: boolean;
     tonePattern?: string;
     bannedPhrases: string[];
     commonPhrases: string[];
}

export class FeedbackLearningEngine {
     private styleDeltaService: StyleDeltaExtractionService;
     private rateLimitMap: Map<string, number>;
     private editBatchMap: Map<string, string[]>;
     private readonly RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
     private readonly BATCH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
     private readonly MIN_EDITS_FOR_MAJOR_CHANGES = 5;

     constructor(apiKey: string) {
          this.styleDeltaService = new StyleDeltaExtractionService(apiKey);
          this.rateLimitMap = new Map();
          this.editBatchMap = new Map();
     }

     /**
      * Queue a learning job for asynchronous processing
      * Returns immediately without waiting for processing
      */
     async queueLearningJob(contentId: string, userId: string): Promise<void> {
          try {
               console.log(`[FeedbackLearning] Queuing learning job for user ${userId}, content ${contentId}`);

               // Check if we should batch this edit
               if (this.shouldBatchEdit(userId)) {
                    console.log(`[FeedbackLearning] Batching edit for user ${userId}`);
                    const batch = this.editBatchMap.get(userId) || [];
                    batch.push(contentId);
                    this.editBatchMap.set(userId, batch);
                    return;
               }

               // Start a new batch
               this.editBatchMap.set(userId, [contentId]);

               // Create learning job in database
               const job = new LearningJob({
                    userId: new mongoose.Types.ObjectId(userId),
                    contentId: new mongoose.Types.ObjectId(contentId),
                    status: 'pending',
                    priority: 0,
                    attempts: 0,
               });

               await job.save();

               // Queue job for processing
               await queueJob(userId, contentId, 0);

               console.log(`[FeedbackLearning] Learning job queued successfully: ${job._id}`);
          } catch (error: any) {
               console.error(`[FeedbackLearning] Failed to queue learning job:`, error.message);
               // Don't throw - we don't want to block the user
          }
     }

     /**
      * Process a learning job
      * Extracts style deltas and updates user profile
      */
     async processLearningJob(jobId: string): Promise<void> {
          let job: ILearningJob | null = null;

          try {
               // Get job from database
               job = await LearningJob.findById(jobId);
               if (!job) {
                    console.error(`[FeedbackLearning] Job ${jobId} not found`);
                    return;
               }

               console.log(`[FeedbackLearning] Processing job ${jobId} for user ${job.userId}`);

               // Update job status
               job.status = 'processing';
               job.processingStarted = new Date();
               job.attempts += 1;
               await job.save();

               // Extract style deltas
               const styleDelta = await this.extractStyleDeltas(job.contentId.toString());

               // Store delta in job
               job.styleDelta = styleDelta;
               await job.save();

               // Update profile from deltas
               await this.updateProfileFromDeltas(job.userId.toString(), [styleDelta]);

               // Mark job as completed
               job.status = 'completed';
               job.processingCompleted = new Date();
               await job.save();

               console.log(`[FeedbackLearning] Job ${jobId} completed successfully`);
          } catch (error: any) {
               console.error(`[FeedbackLearning] Job ${jobId} failed:`, error.message);

               if (job) {
                    job.status = 'failed';
                    job.error = error.message;
                    await job.save();
               }

               throw error;
          }
     }

     /**
      * Extract style deltas from content edit
      */
     async extractStyleDeltas(contentId: string): Promise<StyleDelta> {
          try {
               // Get content with edit metadata
               const content = await Content.findById(contentId);
               if (!content || !content.editMetadata) {
                    throw new Error(`Content ${contentId} not found or has no edit metadata`);
               }

               // Extract deltas using StyleDeltaExtractionService
               const delta = await this.styleDeltaService.extractDeltas(
                    content.editMetadata.originalText,
                    content.editedText
               );

               console.log(`[FeedbackLearning] Extracted style deltas for content ${contentId}:`, {
                    sentenceLengthDelta: delta.sentenceLengthDelta,
                    emojiNetChange: delta.emojiChanges.netChange,
                    toneShift: delta.toneShift,
               });

               return delta;
          } catch (error: any) {
               console.error(`[FeedbackLearning] Failed to extract style deltas:`, error.message);
               throw error;
          }
     }

     /**
      * Update user profile from style deltas
      * Implements pattern detection and weighted updates
      */
     async updateProfileFromDeltas(userId: string, deltas: StyleDelta[]): Promise<void> {
          try {
               console.log(`[FeedbackLearning] Updating profile for user ${userId} from ${deltas.length} deltas`);

               // Check rate limiting
               if (!this.canUpdateProfile(userId)) {
                    console.log(`[FeedbackLearning] Rate limit hit for user ${userId}, skipping update`);
                    return;
               }

               // Get user with profile
               const user = await User.findById(userId);
               if (!user || !user.styleProfile) {
                    console.log(`[FeedbackLearning] User ${userId} has no style profile, skipping update`);
                    return;
               }

               // Get recent edits for pattern detection
               const recentEdits = await EditMetadataStorageService.getRecentEdits({
                    userId,
                    limit: 20,
               });

               // Prune old edit metadata (keep only 50 most recent)
               await EditMetadataStorageService.pruneOldEditMetadata(userId);

               // Detect patterns across edits
               const patterns = this.detectPatterns(recentEdits);

               console.log(`[FeedbackLearning] Detected patterns:`, {
                    sentenceLengthPattern: patterns.sentenceLengthPattern,
                    emojiPattern: patterns.emojiPattern,
                    ctaPattern: patterns.ctaPattern,
                    tonePattern: patterns.tonePattern,
                    bannedPhrasesCount: patterns.bannedPhrases.length,
                    commonPhrasesCount: patterns.commonPhrases.length,
               });

               // Determine if we can make major changes (requires 5+ edits)
               const canMakeMajorChanges = recentEdits.length >= this.MIN_EDITS_FOR_MAJOR_CHANGES;

               // Apply weighted updates to profile
               const updatedProfile = this.applyWeightedUpdates(
                    user.styleProfile,
                    patterns,
                    user.manualOverrides || {},
                    canMakeMajorChanges
               );

               // Increment learning iterations
               updatedProfile.learningIterations += 1;
               updatedProfile.lastUpdated = new Date();

               // Create version snapshot before updating
               const { ProfileVersioningService } = await import('./ProfileVersioningService');
               await ProfileVersioningService.createVersionSnapshot(userId, 'feedback');

               // Save updated profile
               user.styleProfile = updatedProfile;
               await user.save();

               // Invalidate cache
               await cacheService.invalidateStyleProfile(userId);
               await cacheService.invalidateEvolutionScore(userId);

               // Update rate limit
               this.rateLimitMap.set(userId, Date.now());

               // Clear edit batch
               this.editBatchMap.delete(userId);

               console.log(`[FeedbackLearning] Profile updated successfully for user ${userId}`);
               console.log(`[FeedbackLearning] Learning iterations: ${updatedProfile.learningIterations}`);
          } catch (error: any) {
               console.error(`[FeedbackLearning] Failed to update profile:`, error.message);
               throw error;
          }
     }

     /**
      * Get recent edits for a user (deprecated - use EditMetadataStorageService)
      * @deprecated Use EditMetadataStorageService.getRecentEdits instead
      */
     private async getRecentEdits(userId: string, limit: number): Promise<IContent[]> {
          return EditMetadataStorageService.getRecentEdits({ userId, limit });
     }

     /**
      * Detect patterns across multiple edits
      * Implements minimum thresholds: 3 for most patterns, 2 for banned phrases
      */
     private detectPatterns(edits: IContent[]): DetectedPatterns {
          const patterns: DetectedPatterns = {
               bannedPhrases: [],
               commonPhrases: [],
          };

          if (edits.length === 0) {
               return patterns;
          }

          // Detect sentence length pattern (requires 3+ edits)
          if (edits.length >= 3) {
               const sentenceDeltas = edits
                    .filter(e => e.editMetadata)
                    .map(e => e.editMetadata!.sentenceLengthDelta);

               if (sentenceDeltas.length >= 3) {
                    const avgDelta = sentenceDeltas.reduce((sum, d) => sum + d, 0) / sentenceDeltas.length;

                    // Only consider significant patterns (avg delta > 1 or < -1)
                    if (Math.abs(avgDelta) > 1) {
                         patterns.sentenceLengthPattern = avgDelta;
                    }
               }
          }

          // Detect emoji pattern (requires 3+ edits)
          if (edits.length >= 3) {
               const emojiChanges = edits
                    .filter(e => e.editMetadata)
                    .map(e => e.editMetadata!.emojiChanges);

               if (emojiChanges.length >= 3) {
                    const totalAdded = emojiChanges.reduce((sum, c) => sum + c.added, 0);
                    const totalRemoved = emojiChanges.reduce((sum, c) => sum + c.removed, 0);

                    // If user consistently adds emojis
                    if (totalAdded > totalRemoved && totalAdded >= 3) {
                         const avgFrequency = Math.min(5, Math.ceil(totalAdded / emojiChanges.length));
                         patterns.emojiPattern = {
                              shouldUse: true,
                              frequency: avgFrequency,
                         };
                    }
               }
          }

          // Detect CTA pattern (requires 3+ edits with CTA keywords)
          if (edits.length >= 3) {
               const ctaKeywords = ['check out', 'learn more', 'click here', 'visit', 'try now', 'get started', 'sign up', 'download'];
               let ctaCount = 0;

               for (const edit of edits) {
                    if (edit.editMetadata) {
                         const phrasesAdded = edit.editMetadata.phrasesAdded.join(' ').toLowerCase();
                         if (ctaKeywords.some(keyword => phrasesAdded.includes(keyword))) {
                              ctaCount++;
                         }
                    }
               }

               if (ctaCount >= 3) {
                    patterns.ctaPattern = true;
               }
          }

          // Detect tone pattern (requires 3+ edits with same tone shift)
          if (edits.length >= 3) {
               const toneShifts = edits
                    .filter(e => e.editMetadata && e.editMetadata.toneShift !== 'no change')
                    .map(e => e.editMetadata!.toneShift);

               if (toneShifts.length >= 3) {
                    // Find most common tone shift
                    const toneCounts: Record<string, number> = {};
                    for (const shift of toneShifts) {
                         toneCounts[shift] = (toneCounts[shift] || 0) + 1;
                    }

                    const mostCommon = Object.entries(toneCounts)
                         .sort((a, b) => b[1] - a[1])[0];

                    if (mostCommon && mostCommon[1] >= 3) {
                         patterns.tonePattern = mostCommon[0];
                    }
               }
          }

          // Detect banned phrases (requires 2+ removals)
          const phraseRemovalCounts: Record<string, number> = {};
          for (const edit of edits) {
               if (edit.editMetadata) {
                    for (const phrase of edit.editMetadata.phrasesRemoved) {
                         phraseRemovalCounts[phrase] = (phraseRemovalCounts[phrase] || 0) + 1;
                    }
               }
          }

          patterns.bannedPhrases = Object.entries(phraseRemovalCounts)
               .filter(([_, count]) => count >= 2)
               .map(([phrase, _]) => phrase);

          // Detect common phrases (requires 3+ additions)
          const phraseAdditionCounts: Record<string, number> = {};
          for (const edit of edits) {
               if (edit.editMetadata) {
                    for (const phrase of edit.editMetadata.phrasesAdded) {
                         phraseAdditionCounts[phrase] = (phraseAdditionCounts[phrase] || 0) + 1;
                    }
               }
          }

          patterns.commonPhrases = Object.entries(phraseAdditionCounts)
               .filter(([_, count]) => count >= 3)
               .map(([phrase, _]) => phrase);

          return patterns;
     }

     /**
      * Apply weighted updates to profile based on detected patterns
      * Implements 10-20% adjustments and manual override preservation
      */
     private applyWeightedUpdates(
          profile: StyleProfile,
          patterns: DetectedPatterns,
          manualOverrides: ManualOverrides,
          canMakeMajorChanges: boolean
     ): StyleProfile {
          // Deep clone profile to avoid mutations
          const updated: StyleProfile = JSON.parse(JSON.stringify(profile));

          // Apply sentence length adjustment (10-20% of pattern)
          if (patterns.sentenceLengthPattern !== undefined) {
               // Check if avgSentenceLength is manually overridden
               const isOverridden = manualOverrides.writingTraits?.avgSentenceLength !== undefined;

               if (!isOverridden) {
                    const adjustment = patterns.sentenceLengthPattern * 0.15; // 15% adjustment
                    updated.writingTraits.avgSentenceLength = Math.max(
                         5,
                         Math.min(50, updated.writingTraits.avgSentenceLength + adjustment)
                    );
               }
          }

          // Apply emoji pattern
          if (patterns.emojiPattern) {
               // Check if emoji settings are manually overridden
               const isOverridden = manualOverrides.writingTraits?.usesEmojis !== undefined ||
                    manualOverrides.writingTraits?.emojiFrequency !== undefined;

               if (!isOverridden) {
                    updated.writingTraits.usesEmojis = patterns.emojiPattern.shouldUse;
                    updated.writingTraits.emojiFrequency = patterns.emojiPattern.frequency;
               }
          }

          // Apply CTA pattern
          if (patterns.ctaPattern) {
               // Check if endingStyle is manually overridden
               const isOverridden = manualOverrides.structurePreferences?.endingStyle !== undefined;

               if (!isOverridden) {
                    updated.structurePreferences.endingStyle = 'cta';
               }
          }

          // Apply tone pattern (only if major changes allowed)
          if (patterns.tonePattern && canMakeMajorChanges) {
               // Check if tone is manually overridden
               const isOverridden = manualOverrides.tone !== undefined;

               if (!isOverridden) {
                    // Adjust tone based on pattern
                    if (patterns.tonePattern === 'more casual') {
                         updated.tone.formality = Math.max(1, updated.tone.formality - 1);
                    } else if (patterns.tonePattern === 'more professional') {
                         updated.tone.formality = Math.min(10, updated.tone.formality + 1);
                    } else if (patterns.tonePattern === 'more enthusiastic') {
                         updated.tone.enthusiasm = Math.min(10, updated.tone.enthusiasm + 1);
                    } else if (patterns.tonePattern === 'more subdued') {
                         updated.tone.enthusiasm = Math.max(1, updated.tone.enthusiasm - 1);
                    } else if (patterns.tonePattern === 'more direct') {
                         updated.tone.directness = Math.min(10, updated.tone.directness + 1);
                    } else if (patterns.tonePattern === 'more indirect') {
                         updated.tone.directness = Math.max(1, updated.tone.directness - 1);
                    } else if (patterns.tonePattern === 'more humorous') {
                         updated.tone.humor = Math.min(10, updated.tone.humor + 1);
                    } else if (patterns.tonePattern === 'more serious') {
                         updated.tone.humor = Math.max(1, updated.tone.humor - 1);
                    }
               }
          }

          // Add banned phrases (always apply, not affected by manual overrides)
          for (const phrase of patterns.bannedPhrases) {
               if (!updated.bannedPhrases.includes(phrase)) {
                    updated.bannedPhrases.push(phrase);
               }
          }

          // Add common phrases (always apply, not affected by manual overrides)
          for (const phrase of patterns.commonPhrases) {
               if (!updated.commonPhrases.includes(phrase)) {
                    updated.commonPhrases.push(phrase);
               }
          }

          return updated;
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
          return timeSinceLastUpdate >= this.RATE_LIMIT_MS;
     }

     /**
      * Check if edit should be batched
      */
     private shouldBatchEdit(userId: string): boolean {
          return this.editBatchMap.has(userId);
     }
}
