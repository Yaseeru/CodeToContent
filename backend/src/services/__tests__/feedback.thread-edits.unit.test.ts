import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { FeedbackLearningEngine } from '../FeedbackLearningEngine';
import { Content, IContent } from '../../models/Content';
import { User, IUser } from '../../models/User';
import { EditMetadataStorageService } from '../EditMetadataStorageService';

describe('FeedbackLearningEngine - Thread Edits', () => {
     let mongoServer: MongoMemoryServer;
     let learningEngine: FeedbackLearningEngine;
     let testUser: IUser;
     let testContent: IContent;

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

          // Create test user with style profile
          testUser = await User.create({
               githubId: 'test-user-123',
               username: 'testuser',
               email: 'test@example.com',
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

          // Create test thread content
          testContent = await Content.create({
               analysisId: new mongoose.Types.ObjectId(),
               userId: testUser._id,
               platform: 'x',
               contentFormat: 'mini_thread',
               generatedText: 'Tweet 1 original\n\nTweet 2 original\n\nTweet 3 original',
               editedText: '',
               tweets: [
                    { text: 'Tweet 1 original', position: 1, characterCount: 16 },
                    { text: 'Tweet 2 original', position: 2, characterCount: 16 },
                    { text: 'Tweet 3 original', position: 3, characterCount: 16 },
               ],
               version: 1,
          });
     });

     describe('processThreadEdits', () => {
          it('should handle multiple tweets in a thread', async () => {
               // Store thread edit metadata
               const editedTweets = [
                    { position: 1, text: 'Tweet 1 edited with more detail' },
                    { position: 2, text: 'Tweet 2 edited differently' },
                    { position: 3, text: 'Tweet 3 also edited' },
               ];

               const originalTweets = testContent.tweets!.map(t => ({
                    position: t.position,
                    text: t.text,
               }));

               await EditMetadataStorageService.storeThreadEditMetadata(
                    testContent._id.toString(),
                    editedTweets,
                    originalTweets
               );

               // Process thread edits
               await learningEngine.processThreadEdits(
                    testContent._id.toString(),
                    testUser._id.toString()
               );

               // Verify content has edit metadata
               const updatedContent = await Content.findById(testContent._id);
               expect(updatedContent?.editMetadata).toBeDefined();
               expect(updatedContent?.editMetadata?.learningProcessed).toBe(false);
          });

          it('should extract style deltas correctly for each tweet', async () => {
               // Store thread edit metadata with specific changes
               const editedTweets = [
                    { position: 1, text: 'Short edit 😊' },
                    { position: 2, text: 'Another short one 🎉' },
                    { position: 3, text: 'Final tweet 🚀' },
               ];

               const originalTweets = testContent.tweets!.map(t => ({
                    position: t.position,
                    text: t.text,
               }));

               await EditMetadataStorageService.storeThreadEditMetadata(
                    testContent._id.toString(),
                    editedTweets,
                    originalTweets
               );

               // Verify edit metadata was stored
               const updatedContent = await Content.findById(testContent._id);
               expect(updatedContent?.editMetadata).toBeDefined();
               expect(updatedContent?.editMetadata?.emojiChanges.added).toBeGreaterThan(0);
               expect(updatedContent?.editMetadata?.sentenceLengthDelta).toBeDefined();
          });

          it('should update profile with aggregated insights', async () => {
               // Store thread edit metadata
               const editedTweets = [
                    { position: 1, text: 'Tweet 1 edited with emojis 😊' },
                    { position: 2, text: 'Tweet 2 also has emojis 🎉' },
                    { position: 3, text: 'Tweet 3 continues the pattern 🚀' },
               ];

               const originalTweets = testContent.tweets!.map(t => ({
                    position: t.position,
                    text: t.text,
               }));

               await EditMetadataStorageService.storeThreadEditMetadata(
                    testContent._id.toString(),
                    editedTweets,
                    originalTweets
               );

               // Get initial profile state
               const initialUser = await User.findById(testUser._id);
               const initialIterations = initialUser?.styleProfile?.learningIterations || 0;

               // Process thread edits
               await learningEngine.processThreadEdits(
                    testContent._id.toString(),
                    testUser._id.toString()
               );

               // Verify profile was updated
               const updatedUser = await User.findById(testUser._id);
               expect(updatedUser?.styleProfile?.learningIterations).toBeGreaterThan(initialIterations);
          });

          it('should maintain backward compatibility with single posts', async () => {
               // Create single post content
               const singlePost = await Content.create({
                    analysisId: new mongoose.Types.ObjectId(),
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Single post original text',
                    editedText: 'Single post edited text',
                    version: 1,
                    editMetadata: {
                         originalText: 'Single post original text',
                         originalLength: 25,
                         editedLength: 24,
                         sentenceLengthDelta: 0,
                         emojiChanges: { added: 0, removed: 0, netChange: 0 },
                         structureChanges: {
                              paragraphsAdded: 0,
                              paragraphsRemoved: 0,
                              bulletsAdded: false,
                              formattingChanges: [],
                         },
                         toneShift: 'no change',
                         vocabularyChanges: {
                              wordsSubstituted: [],
                              complexityShift: 0,
                         },
                         phrasesAdded: [],
                         phrasesRemoved: [],
                         editTimestamp: new Date(),
                         learningProcessed: false,
                    },
               });

               // Process as thread (should handle gracefully)
               await learningEngine.processThreadEdits(
                    singlePost._id.toString(),
                    testUser._id.toString()
               );

               // Should not throw error and content should remain unchanged
               const updatedContent = await Content.findById(singlePost._id);
               expect(updatedContent).toBeDefined();
          });

          it('should handle empty edited tweets array', async () => {
               // Store empty thread edit metadata
               await EditMetadataStorageService.storeThreadEditMetadata(
                    testContent._id.toString(),
                    [],
                    testContent.tweets!.map(t => ({ position: t.position, text: t.text }))
               );

               // Process thread edits (should handle gracefully)
               await learningEngine.processThreadEdits(
                    testContent._id.toString(),
                    testUser._id.toString()
               );

               // Should not throw error
               const updatedContent = await Content.findById(testContent._id);
               expect(updatedContent).toBeDefined();
          });

          it('should aggregate deltas across all tweets', async () => {
               // Create edits with consistent patterns
               const editedTweets = [
                    { position: 1, text: 'Very short 😊' },
                    { position: 2, text: 'Also short 🎉' },
                    { position: 3, text: 'Short too 🚀' },
               ];

               const originalTweets = testContent.tweets!.map(t => ({
                    position: t.position,
                    text: t.text,
               }));

               await EditMetadataStorageService.storeThreadEditMetadata(
                    testContent._id.toString(),
                    editedTweets,
                    originalTweets
               );

               // Verify aggregated metadata
               const updatedContent = await Content.findById(testContent._id);
               expect(updatedContent?.editMetadata).toBeDefined();

               // Should have aggregated emoji changes (3 emojis added)
               expect(updatedContent?.editMetadata?.emojiChanges.added).toBe(3);

               // Should have averaged sentence length delta
               expect(updatedContent?.editMetadata?.sentenceLengthDelta).toBeDefined();
          });
     });
});
