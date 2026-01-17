import mongoose from 'mongoose';
import { User, IUser, StyleProfile } from '../models/User';
import { Content, IContent } from '../models/Content';
import { cacheService } from './CacheService';

export interface EvolutionMilestone {
     timestamp: Date;
     type: 'profile_created' | 'first_edit' | 'iterations_5' | 'iterations_10' | 'iterations_25' | 'iterations_50';
     description: string;
     score: number;
}

export interface ProfileAnalytics {
     evolutionScore: number;
     totalEdits: number;
     learningIterations: number;
     lastUpdated: Date;
     toneDistribution: {
          formality: number;
          enthusiasm: number;
          directness: number;
          humor: number;
          emotionality: number;
     };
     commonPhrases: string[];
     bannedPhrases: string[];
     writingTraitsSummary: {
          avgSentenceLength: number;
          usesEmojis: boolean;
          emojiFrequency: number;
          usesBulletPoints: boolean;
          usesShortParagraphs: boolean;
          usesHooks: boolean;
     };
     profileSource: string;
     hasInitialSamples: boolean;
}

export interface BeforeAfterExample {
     contentId: string;
     platform: string;
     before: string;
     after: string;
     timestamp: Date;
     improvements: string[];
}

export class ProfileEvolutionService {
     /**
      * Calculate Profile Evolution Score (0-100)
      * Scoring algorithm: 20/40/20/20 weighting
      * - Initial samples: 20 points
      * - Feedback iterations: 40 points (min(iterations/10, 1) * 40)
      * - Profile completeness: 20 points
      * - Edit consistency: 20 points
      * 
      * Uses cache with 5-minute TTL for performance
      */
     async calculateEvolutionScore(userId: string): Promise<number> {
          try {
               // Check cache first
               const cachedScore = await cacheService.getEvolutionScore(userId);
               if (cachedScore !== null) {
                    return cachedScore;
               }

               const user = await User.findById(userId);
               if (!user || !user.styleProfile) {
                    return 0;
               }

               const profile = user.styleProfile;
               let score = 0;

               // Component 1: Initial samples (20 points)
               const hasInitialSamples = profile.samplePosts && profile.samplePosts.length > 0;
               if (hasInitialSamples) {
                    score += 20;
               }

               // Component 2: Feedback iterations (40 points)
               // Scale: 0 iterations = 0 points, 10+ iterations = 40 points
               const iterationsScore = Math.min(profile.learningIterations / 10, 1) * 40;
               score += iterationsScore;

               // Component 3: Profile completeness (20 points)
               const completenessScore = this.calculateProfileCompleteness(profile);
               score += completenessScore;

               // Component 4: Edit consistency (20 points)
               const consistencyScore = await this.calculateEditConsistency(userId);
               score += consistencyScore;

               // Ensure score is between 0 and 100
               const finalScore = Math.max(0, Math.min(100, Math.round(score)));

               // Cache the result
               await cacheService.setEvolutionScore(userId, finalScore);

               return finalScore;
          } catch (error: any) {
               console.error(`[ProfileEvolution] Failed to calculate evolution score:`, error.message);
               throw error;
          }
     }

     /**
      * Get evolution timeline with milestones
      */
     async getEvolutionTimeline(userId: string): Promise<EvolutionMilestone[]> {
          try {
               const user = await User.findById(userId);
               if (!user || !user.styleProfile) {
                    return [];
               }

               const milestones: EvolutionMilestone[] = [];
               const profile = user.styleProfile;

               // Get all content with edit metadata to track timeline
               const edits = await Content.find({
                    userId: new mongoose.Types.ObjectId(userId),
                    editMetadata: { $exists: true },
               }).sort({ 'editMetadata.editTimestamp': 1 });

               // Milestone 1: Profile created
               milestones.push({
                    timestamp: profile.lastUpdated,
                    type: 'profile_created',
                    description: 'Voice profile created',
                    score: await this.calculateEvolutionScore(userId),
               });

               // Milestone 2: First edit
               if (edits.length > 0) {
                    milestones.push({
                         timestamp: edits[0].editMetadata!.editTimestamp,
                         type: 'first_edit',
                         description: 'First content edit - learning begins',
                         score: await this.calculateEvolutionScore(userId),
                    });
               }

               // Milestone 3: 5 iterations
               if (profile.learningIterations >= 5 && edits.length >= 5) {
                    const fifthEdit = edits[4];
                    milestones.push({
                         timestamp: fifthEdit.editMetadata!.editTimestamp,
                         type: 'iterations_5',
                         description: '5 learning iterations completed',
                         score: await this.calculateEvolutionScore(userId),
                    });
               }

               // Milestone 4: 10 iterations
               if (profile.learningIterations >= 10 && edits.length >= 10) {
                    const tenthEdit = edits[9];
                    milestones.push({
                         timestamp: tenthEdit.editMetadata!.editTimestamp,
                         type: 'iterations_10',
                         description: '10 learning iterations - voice well-trained',
                         score: await this.calculateEvolutionScore(userId),
                    });
               }

               // Milestone 5: 25 iterations
               if (profile.learningIterations >= 25 && edits.length >= 25) {
                    const twentyFifthEdit = edits[24];
                    milestones.push({
                         timestamp: twentyFifthEdit.editMetadata!.editTimestamp,
                         type: 'iterations_25',
                         description: '25 learning iterations - expert voice matching',
                         score: await this.calculateEvolutionScore(userId),
                    });
               }

               // Milestone 6: 50 iterations
               if (profile.learningIterations >= 50 && edits.length >= 50) {
                    const fiftiethEdit = edits[49];
                    milestones.push({
                         timestamp: fiftiethEdit.editMetadata!.editTimestamp,
                         type: 'iterations_50',
                         description: '50 learning iterations - master level',
                         score: await this.calculateEvolutionScore(userId),
                    });
               }

               return milestones;
          } catch (error: any) {
               console.error(`[ProfileEvolution] Failed to get evolution timeline:`, error.message);
               throw error;
          }
     }

     /**
      * Get comprehensive profile analytics
      */
     async getAnalytics(userId: string): Promise<ProfileAnalytics> {
          try {
               const user = await User.findById(userId);
               if (!user || !user.styleProfile) {
                    throw new Error('User has no style profile');
               }

               const profile = user.styleProfile;

               // Count total edits
               const totalEdits = await Content.countDocuments({
                    userId: new mongoose.Types.ObjectId(userId),
                    editMetadata: { $exists: true },
               });

               // Calculate evolution score
               const evolutionScore = await this.calculateEvolutionScore(userId);

               // Build analytics
               const analytics: ProfileAnalytics = {
                    evolutionScore,
                    totalEdits,
                    learningIterations: profile.learningIterations,
                    lastUpdated: profile.lastUpdated,
                    toneDistribution: {
                         formality: profile.tone.formality,
                         enthusiasm: profile.tone.enthusiasm,
                         directness: profile.tone.directness,
                         humor: profile.tone.humor,
                         emotionality: profile.tone.emotionality,
                    },
                    commonPhrases: profile.commonPhrases,
                    bannedPhrases: profile.bannedPhrases,
                    writingTraitsSummary: {
                         avgSentenceLength: profile.writingTraits.avgSentenceLength,
                         usesEmojis: profile.writingTraits.usesEmojis,
                         emojiFrequency: profile.writingTraits.emojiFrequency,
                         usesBulletPoints: profile.writingTraits.usesBulletPoints,
                         usesShortParagraphs: profile.writingTraits.usesShortParagraphs,
                         usesHooks: profile.writingTraits.usesHooks,
                    },
                    profileSource: profile.profileSource,
                    hasInitialSamples: profile.samplePosts && profile.samplePosts.length > 0,
               };

               return analytics;
          } catch (error: any) {
               console.error(`[ProfileEvolution] Failed to get analytics:`, error.message);
               throw error;
          }
     }

     /**
      * Get before/after examples showing improvement
      */
     async getBeforeAfterExamples(userId: string, limit: number = 5): Promise<BeforeAfterExample[]> {
          try {
               // Get recent edits with significant changes
               const edits = await Content.find({
                    userId: new mongoose.Types.ObjectId(userId),
                    editMetadata: { $exists: true },
               })
                    .sort({ 'editMetadata.editTimestamp': -1 })
                    .limit(limit);

               const examples: BeforeAfterExample[] = [];

               for (const edit of edits) {
                    if (!edit.editMetadata) continue;

                    const improvements: string[] = [];

                    // Identify improvements
                    if (edit.editMetadata.sentenceLengthDelta !== 0) {
                         const direction = edit.editMetadata.sentenceLengthDelta > 0 ? 'longer' : 'shorter';
                         improvements.push(`Made sentences ${direction}`);
                    }

                    if (edit.editMetadata.emojiChanges.netChange > 0) {
                         improvements.push(`Added ${edit.editMetadata.emojiChanges.added} emojis`);
                    }

                    if (edit.editMetadata.structureChanges.bulletsAdded) {
                         improvements.push('Added bullet points');
                    }

                    if (edit.editMetadata.toneShift !== 'no change') {
                         improvements.push(`Tone shift: ${edit.editMetadata.toneShift}`);
                    }

                    if (edit.editMetadata.phrasesAdded.length > 0) {
                         improvements.push(`Added ${edit.editMetadata.phrasesAdded.length} phrases`);
                    }

                    examples.push({
                         contentId: edit._id.toString(),
                         platform: edit.platform,
                         before: edit.editMetadata.originalText,
                         after: edit.editedText,
                         timestamp: edit.editMetadata.editTimestamp,
                         improvements,
                    });
               }

               return examples;
          } catch (error: any) {
               console.error(`[ProfileEvolution] Failed to get before/after examples:`, error.message);
               throw error;
          }
     }

     /**
      * Calculate profile completeness score (0-20 points)
      */
     private calculateProfileCompleteness(profile: StyleProfile): number {
          let score = 0;

          // Check if all required fields are present and meaningful
          // Each component worth ~4 points

          // Tone metrics (4 points)
          if (profile.tone) {
               score += 4;
          }

          // Writing traits (4 points)
          if (profile.writingTraits && profile.writingTraits.avgSentenceLength > 0) {
               score += 4;
          }

          // Structure preferences (4 points)
          if (profile.structurePreferences) {
               score += 4;
          }

          // Vocabulary level (4 points)
          if (profile.vocabularyLevel) {
               score += 4;
          }

          // Phrases (4 points)
          if (profile.commonPhrases.length > 0 || profile.bannedPhrases.length > 0) {
               score += 4;
          }

          return score;
     }

     /**
      * Calculate edit consistency score (0-20 points)
      * Measures how consistent user edits are (more consistent = better learning)
      */
     private async calculateEditConsistency(userId: string): Promise<number> {
          try {
               // Get recent edits
               const edits = await Content.find({
                    userId: new mongoose.Types.ObjectId(userId),
                    editMetadata: { $exists: true },
               })
                    .sort({ 'editMetadata.editTimestamp': -1 })
                    .limit(20);

               if (edits.length === 0) {
                    return 0;
               }

               // Calculate consistency metrics
               let consistencyScore = 0;

               // 1. Sentence length consistency (5 points)
               const sentenceDeltas = edits
                    .filter(e => e.editMetadata)
                    .map(e => e.editMetadata!.sentenceLengthDelta);

               if (sentenceDeltas.length > 0) {
                    const avgDelta = sentenceDeltas.reduce((sum, d) => sum + d, 0) / sentenceDeltas.length;
                    const variance = sentenceDeltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / sentenceDeltas.length;
                    const stdDev = Math.sqrt(variance);

                    // Lower standard deviation = more consistent
                    // Scale: stdDev < 2 = 5 points, stdDev > 10 = 0 points
                    const sentenceConsistency = Math.max(0, Math.min(5, 5 - (stdDev / 2)));
                    consistencyScore += sentenceConsistency;
               }

               // 2. Emoji usage consistency (5 points)
               const emojiChanges = edits
                    .filter(e => e.editMetadata)
                    .map(e => e.editMetadata!.emojiChanges.netChange);

               if (emojiChanges.length > 0) {
                    const positiveChanges = emojiChanges.filter(c => c > 0).length;
                    const negativeChanges = emojiChanges.filter(c => c < 0).length;
                    const totalChanges = emojiChanges.length;

                    // Consistent direction = higher score
                    const emojiConsistency = Math.max(positiveChanges, negativeChanges) / totalChanges * 5;
                    consistencyScore += emojiConsistency;
               }

               // 3. Tone shift consistency (5 points)
               const toneShifts = edits
                    .filter(e => e.editMetadata && e.editMetadata.toneShift !== 'no change')
                    .map(e => e.editMetadata!.toneShift);

               if (toneShifts.length > 0) {
                    // Count most common tone shift
                    const toneCounts: Record<string, number> = {};
                    for (const shift of toneShifts) {
                         toneCounts[shift] = (toneCounts[shift] || 0) + 1;
                    }

                    const maxCount = Math.max(...Object.values(toneCounts));
                    const toneConsistency = (maxCount / toneShifts.length) * 5;
                    consistencyScore += toneConsistency;
               }

               // 4. Phrase consistency (5 points)
               const phrasesAdded = edits
                    .filter(e => e.editMetadata)
                    .flatMap(e => e.editMetadata!.phrasesAdded);

               if (phrasesAdded.length > 0) {
                    // Count phrase repetitions
                    const phraseCounts: Record<string, number> = {};
                    for (const phrase of phrasesAdded) {
                         phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
                    }

                    const repeatedPhrases = Object.values(phraseCounts).filter(count => count > 1).length;
                    const phraseConsistency = Math.min(5, (repeatedPhrases / 3) * 5);
                    consistencyScore += phraseConsistency;
               }

               return Math.round(consistencyScore);
          } catch (error: any) {
               console.error(`[ProfileEvolution] Failed to calculate edit consistency:`, error.message);
               return 0;
          }
     }
}
