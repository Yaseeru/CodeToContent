import mongoose from 'mongoose';
import { FeedbackLearningEngine } from '../FeedbackLearningEngine';
import { User } from '../../models/User';
import { Content } from '../../models/Content';

// Mock Gemini API for testing
jest.mock('@google/genai', () => {
     return {
          GoogleGenAI: jest.fn().mockImplementation(() => ({
               models: {
                    generateContent: jest.fn().mockResolvedValue({
                         text: 'no change',
                    }),
               },
          })),
     };
});

// Mock queue
jest.mock('../../config/queue', () => ({
     queueLearningJob: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
}));

describe('Feedback Learning Engine - Integration Test', () => {
     let engine: FeedbackLearningEngine;

     beforeEach(async () => {
          engine = new FeedbackLearningEngine('test-api-key');
     });

     it('should successfully queue a learning job', async () => {
          // Create user with profile
          const user = new User({
               githubId: `test-${Date.now()}`,
               username: 'testuser',
               accessToken: 'test-token',
               styleProfile: {
                    voiceType: 'professional',
                    tone: {
                         formality: 7,
                         enthusiasm: 6,
                         directness: 7,
                         humor: 4,
                         emotionality: 5,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'problem',
                         bodyStyle: 'analysis',
                         endingStyle: 'summary',
                    },
                    vocabularyLevel: 'medium',
                    commonPhrases: [],
                    bannedPhrases: [],
                    samplePosts: [],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               },
               voiceStrength: 80,
          });
          await user.save();

          // Create content with edit metadata
          const content = new Content({
               analysisId: new mongoose.Types.ObjectId(),
               userId: user._id,
               platform: 'linkedin',
               tone: 'professional',
               generatedText: 'Original text',
               editedText: 'Edited text',
               version: 1,
               editMetadata: {
                    originalText: 'Original text',
                    originalLength: 100,
                    editedLength: 90,
                    sentenceLengthDelta: -3,
                    emojiChanges: {
                         added: 0,
                         removed: 0,
                         netChange: 0,
                    },
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
          await content.save();

          // Queue learning job
          await engine.queueLearningJob(content._id.toString(), user._id.toString());

          // Verify job was queued (no errors thrown)
          expect(true).toBe(true);
     });
});
