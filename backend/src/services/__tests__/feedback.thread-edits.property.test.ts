import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as fc from 'fast-check';
import { FeedbackLearningEngine } from '../FeedbackLearningEngine';
import { Content, IContent } from '../../models/Content';
import { User, IUser } from '../../models/User';
import { LearningJob } from '../../models/LearningJob';
import { EditMetadataStorageService } from '../EditMetadataStorageService';

/**
 * Property-Based Tests for Thread Edit Metadata Preservation
 * Validates: Requirements 6.6, 8.1, 8.2 (Property 5)
 */
describe('FeedbackLearningEngine - Thread Edit Metadata Preservation (Property-Based)', () => {
     let mongoServer: MongoMemoryServer;
     let learningEngine: FeedbackLearningEngine;
     let testUser: IUser;

     beforeAll(async () => {
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);

          // Initialize learning engine with test API key
          const apiKey = process.env.GEMINI_API_KEY || 'test-api-key';
          learningEngine = new FeedbackLearningEngine(apiKey);
     });

     afterAll(async () => {
          await mongoose.disconnect();
          await mongoServer.stop();
     });

     beforeEach(async () => {
          // Clear collections
          await User.deleteMany({});
          await Content.deleteMany({});
          await LearningJob.deleteMany({});

          // Create test user with style profile
          testUser = await User.create({
               githubId: 'test-user-pbt',
               username: 'testuserpbt',
               email: 'pbt@example.com',
               accessToken: 'test-token',
               styleProfile: {
                    tone: {
                         formality: 5,
                         enthusiasm: 5,
                         directness: 5,
                         humor: 5,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesHashtags: false,
                         hashtagFrequency: 0,
                    },
                    structurePreferences: {
                         openingStyle: 'direct',
                         endingStyle: 'open',
                         usesThreads: false,
                    },
                    vocabularyLevel: 'intermediate',
                    commonPhrases: [],
                    bannedPhrases: [],
                    voiceType: 'authentic',
                    learningIterations: 0,
                    lastUpdated: new Date(),
               },
          });
     });

     /**
      * **Validates: Requirements 6.6, 8.1, 8.2 (Property 5)**
      * 
      * Property: Edit metadata is stored for each tweet in a thread
      * 
      * For any valid thread with edited tweets:
      * - Edit metadata must be stored in the Content document
      * - Learning jobs must be queued for processing
      * - learningProcessed flag must be false initially
      * - Metadata must include aggregated deltas from all edited tweets
      */
     it('should preserve edit metadata for all thread edits', async () => {
          await fc.assert(
               fc.asyncProperty(
                    // Generate random thread edits (1-7 tweets)
                    fc.array(
                         fc.record({
                              position: fc.integer({ min: 1, max: 7 }),
                              text: fc.string({ minLength: 50, maxLength: 280 }),
                         }),
                         { minLength: 1, maxLength: 7 }
                    ),
                    async (editedTweets) => {
                         // Ensure unique positions
                         const uniqueEdits = Array.from(
                              new Map(editedTweets.map(e => [e.position, e])).values()
                         ).sort((a, b) => a.position - b.position);

                         if (uniqueEdits.length === 0) return;

                         // Create thread content with original tweets
                         const originalTweets = uniqueEdits.map((e, idx) => ({
                              text: `Original tweet ${idx + 1} with some content`,
                              position: e.position,
                              characterCount: 35,
                         }));

                         const content = await Content.create({
                              analysisId: new mongoose.Types.ObjectId(),
                              userId: testUser._id,
                              platform: 'x',
                              contentFormat: uniqueEdits.length <= 3 ? 'mini_thread' : 'full_thread',
                              generatedText: originalTweets.map(t => t.text).join('\n\n'),
                              editedText: '',
                              tweets: originalTweets,
                              version: 1,
                         });

                         // Store thread edit metadata
                         await EditMetadataStorageService.storeThreadEditMetadata(
                              content._id.toString(),
                              uniqueEdits,
                              originalTweets.map(t => ({ position: t.position, text: t.text }))
                         );

                         // Verify edit metadata is stored
                         const updatedContent = await Content.findById(content._id);
                         expect(updatedContent?.editMetadata).toBeDefined();
                         expect(updatedContent?.editMetadata?.learningProcessed).toBe(false);
                         expect(updatedContent?.editMetadata?.originalText).toBeDefined();
                         expect(updatedContent?.editMetadata?.editTimestamp).toBeDefined();

                         // Queue learning job
                         await learningEngine.queueLearningJob(
                              content._id.toString(),
                              testUser._id.toString()
                         );

                         // Verify learning job was queued
                         const jobs = await LearningJob.find({ contentId: content._id });
                         expect(jobs.length).toBeGreaterThan(0);
                         expect(jobs[0].status).toBe('pending');

                         // Clean up for next iteration
                         await Content.deleteOne({ _id: content._id });
                         await LearningJob.deleteMany({ contentId: content._id });
                    }
               ),
               { numRuns: 20 } // Run 20 iterations
          );
     });

     /**
      * Property: Edit metadata aggregation is consistent
      * 
      * For any thread edits, the aggregated metadata should:
      * - Have non-negative emoji counts
      * - Have valid sentence length delta
      * - Have valid structure change counts
      * - Preserve all edited tweet information
      */
     it('should aggregate edit metadata consistently', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              position: fc.integer({ min: 1, max: 5 }),
                              text: fc.string({ minLength: 50, maxLength: 280 }),
                         }),
                         { minLength: 1, maxLength: 5 }
                    ),
                    async (editedTweets) => {
                         // Ensure unique positions
                         const uniqueEdits = Array.from(
                              new Map(editedTweets.map(e => [e.position, e])).values()
                         );

                         if (uniqueEdits.length === 0) return;

                         // Create thread content
                         const originalTweets = uniqueEdits.map((e, idx) => ({
                              text: `Original tweet ${idx + 1} content here`,
                              position: e.position,
                              characterCount: 30,
                         }));

                         const content = await Content.create({
                              analysisId: new mongoose.Types.ObjectId(),
                              userId: testUser._id,
                              platform: 'x',
                              contentFormat: 'mini_thread',
                              generatedText: originalTweets.map(t => t.text).join('\n\n'),
                              editedText: '',
                              tweets: originalTweets,
                              version: 1,
                         });

                         // Store thread edit metadata
                         await EditMetadataStorageService.storeThreadEditMetadata(
                              content._id.toString(),
                              uniqueEdits,
                              originalTweets.map(t => ({ position: t.position, text: t.text }))
                         );

                         // Verify aggregated metadata properties
                         const updatedContent = await Content.findById(content._id);
                         const metadata = updatedContent?.editMetadata;

                         expect(metadata).toBeDefined();

                         // Emoji counts should be non-negative
                         expect(metadata!.emojiChanges.added).toBeGreaterThanOrEqual(0);
                         expect(metadata!.emojiChanges.removed).toBeGreaterThanOrEqual(0);

                         // Sentence length delta should be a number
                         expect(typeof metadata!.sentenceLengthDelta).toBe('number');
                         expect(isFinite(metadata!.sentenceLengthDelta)).toBe(true);

                         // Structure changes should be non-negative
                         expect(metadata!.structureChanges.paragraphsAdded).toBeGreaterThanOrEqual(0);
                         expect(metadata!.structureChanges.paragraphsRemoved).toBeGreaterThanOrEqual(0);

                         // Tone shift should be a string
                         expect(typeof metadata!.toneShift).toBe('string');

                         // Phrases should be arrays
                         expect(Array.isArray(metadata!.phrasesAdded)).toBe(true);
                         expect(Array.isArray(metadata!.phrasesRemoved)).toBe(true);

                         // Clean up
                         await Content.deleteOne({ _id: content._id });
                    }
               ),
               { numRuns: 20 }
          );
     });

     /**
      * Property: Learning jobs are queued for all thread edits
      * 
      * For any thread content with edits:
      * - A learning job must be created
      * - Job must reference the correct content and user
      * - Job status must be 'pending' initially
      * - Job metadata must indicate it's a thread
      */
     it('should queue learning jobs for all thread edits', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              position: fc.integer({ min: 1, max: 5 }),
                              text: fc.string({ minLength: 50, maxLength: 280 }),
                         }),
                         { minLength: 1, maxLength: 5 }
                    ),
                    async (editedTweets) => {
                         // Ensure unique positions
                         const uniqueEdits = Array.from(
                              new Map(editedTweets.map(e => [e.position, e])).values()
                         );

                         if (uniqueEdits.length === 0) return;

                         // Create thread content
                         const originalTweets = uniqueEdits.map((e, idx) => ({
                              text: `Original tweet ${idx + 1}`,
                              position: e.position,
                              characterCount: 20,
                         }));

                         const content = await Content.create({
                              analysisId: new mongoose.Types.ObjectId(),
                              userId: testUser._id,
                              platform: 'x',
                              contentFormat: 'mini_thread',
                              generatedText: originalTweets.map(t => t.text).join('\n\n'),
                              editedText: '',
                              tweets: originalTweets,
                              version: 1,
                         });

                         // Store edit metadata
                         await EditMetadataStorageService.storeThreadEditMetadata(
                              content._id.toString(),
                              uniqueEdits,
                              originalTweets.map(t => ({ position: t.position, text: t.text }))
                         );

                         // Queue learning job
                         await learningEngine.queueLearningJob(
                              content._id.toString(),
                              testUser._id.toString()
                         );

                         // Verify job was queued
                         const jobs = await LearningJob.find({ contentId: content._id });
                         expect(jobs.length).toBeGreaterThan(0);

                         const job = jobs[0];
                         expect(job.userId.toString()).toBe(testUser._id.toString());
                         expect(job.contentId.toString()).toBe(content._id.toString());
                         expect(job.status).toBe('pending');
                         expect(job.metadata?.isThread).toBe(true);
                         expect(job.metadata?.tweetCount).toBe(uniqueEdits.length);

                         // Clean up
                         await Content.deleteOne({ _id: content._id });
                         await LearningJob.deleteMany({ contentId: content._id });
                    }
               ),
               { numRuns: 20 }
          );
     });

     /**
      * Property: learningProcessed flag is false initially
      * 
      * For any thread edit, the learningProcessed flag must be false
      * until the learning job is actually processed
      */
     it('should set learningProcessed to false initially', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.array(
                         fc.record({
                              position: fc.integer({ min: 1, max: 3 }),
                              text: fc.string({ minLength: 50, maxLength: 280 }),
                         }),
                         { minLength: 1, maxLength: 3 }
                    ),
                    async (editedTweets) => {
                         const uniqueEdits = Array.from(
                              new Map(editedTweets.map(e => [e.position, e])).values()
                         );

                         if (uniqueEdits.length === 0) return;

                         const originalTweets = uniqueEdits.map((e, idx) => ({
                              text: `Original ${idx + 1}`,
                              position: e.position,
                              characterCount: 15,
                         }));

                         const content = await Content.create({
                              analysisId: new mongoose.Types.ObjectId(),
                              userId: testUser._id,
                              platform: 'x',
                              contentFormat: 'mini_thread',
                              generatedText: originalTweets.map(t => t.text).join('\n\n'),
                              editedText: '',
                              tweets: originalTweets,
                              version: 1,
                         });

                         await EditMetadataStorageService.storeThreadEditMetadata(
                              content._id.toString(),
                              uniqueEdits,
                              originalTweets.map(t => ({ position: t.position, text: t.text }))
                         );

                         const updatedContent = await Content.findById(content._id);
                         expect(updatedContent?.editMetadata?.learningProcessed).toBe(false);

                         // Clean up
                         await Content.deleteOne({ _id: content._id });
                    }
               ),
               { numRuns: 20 }
          );
     });
});
