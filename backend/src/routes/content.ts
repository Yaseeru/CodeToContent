import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { defaultRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';
import { validateContentGeneration, validateSaveEdits } from '../middleware/validation';
import { ContentGenerationService } from '../services/ContentGenerationService';
import { Platform, Content } from '../models/Content';
import mongoose from 'mongoose';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/content/generate
 * Generate platform-specific content from analysis
 */
router.post('/generate', strictRateLimiter, validateContentGeneration, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { analysisId, platform, voiceStrength, format, snapshotId } = req.body;

          // Validate required fields
          if (!analysisId || !platform) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'analysisId and platform are required',
               });
          }

          // Validate analysis ID format
          if (!mongoose.Types.ObjectId.isValid(analysisId)) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Invalid analysisId format',
               });
          }

          // Validate platform
          if (platform !== 'x') {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'platform must be "x"',
               });
          }

          // Validate voiceStrength if provided (0-100)
          if (voiceStrength !== undefined) {
               if (typeof voiceStrength !== 'number' || voiceStrength < 0 || voiceStrength > 100) {
                    return res.status(400).json({
                         error: 'Invalid request',
                         message: 'voiceStrength must be a number between 0 and 100',
                    });
               }
          }

          // Validate format if provided (defaults to 'single' for backward compatibility)
          if (format !== undefined) {
               if (!['single', 'mini_thread', 'full_thread'].includes(format)) {
                    return res.status(400).json({
                         error: 'Invalid request',
                         message: 'format must be one of: single, mini_thread, full_thread',
                    });
               }
          }

          // Validate snapshotId if provided
          if (snapshotId !== undefined) {
               if (!mongoose.Types.ObjectId.isValid(snapshotId)) {
                    return res.status(400).json({
                         error: 'Invalid request',
                         message: 'Invalid snapshotId format',
                    });
               }
          }

          // Initialize content generation service
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return res.status(500).json({
                    error: 'Configuration error',
                    message: 'Gemini API key not configured',
               });
          }

          const contentService = new ContentGenerationService(geminiApiKey);

          // Generate content
          const content = await contentService.generateContent({
               analysisId,
               userId: req.user.userId,
               platform: platform as Platform,
               voiceStrength,
               format, // Pass format parameter (defaults to 'single' in service)
               snapshotId, // Pass snapshotId parameter
          });

          // Build response object with contentFormat and tweets (if present)
          const responseContent: any = {
               id: content._id,
               analysisId: content.analysisId,
               platform: content.platform,
               contentFormat: content.contentFormat, // Include contentFormat
               generatedText: content.generatedText,
               editedText: content.editedText,
               version: content.version,
               usedStyleProfile: content.usedStyleProfile,
               voiceStrengthUsed: content.voiceStrengthUsed,
               evolutionScoreAtGeneration: content.evolutionScoreAtGeneration,
               createdAt: content.createdAt,
          };

          // Include tweets array when present (for threads)
          if (content.tweets && content.tweets.length > 0) {
               responseContent.tweets = content.tweets;
          }

          // Include snapshot data if attached
          if (content.snapshotId) {
               responseContent.snapshotId = content.snapshotId;
               // Fetch snapshot to get imageUrl
               const { CodeSnapshot } = await import('../models/CodeSnapshot');
               const snapshot = await CodeSnapshot.findById(content.snapshotId);
               if (snapshot) {
                    responseContent.imageUrl = snapshot.imageUrl;
               }
          }

          res.json({
               message: 'Content generated successfully',
               content: responseContent,
          });
     } catch (error) {
          console.error('Error generating content:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to generate content';

          if (error instanceof Error) {
               if (error.message.includes('Analysis not found')) {
                    statusCode = 404;
                    errorMessage = 'Analysis not found';
               } else if (error.message.includes('Snapshot does not belong to user')) {
                    statusCode = 403;
                    errorMessage = 'You do not have permission to use this snapshot';
               } else if (error.message.includes('Unauthorized')) {
                    statusCode = 401;
                    errorMessage = 'Unauthorized access';
               } else if (error.message.includes('rate limit')) {
                    statusCode = 429;
                    errorMessage = 'API rate limit exceeded';
               } else if (error.message.includes('Gemini')) {
                    statusCode = 503;
                    errorMessage = 'AI service temporarily unavailable';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * POST /api/content/refine
 * Refine existing content based on instructions
 */
router.post('/refine', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { contentId, instruction } = req.body;

          // Validate required fields
          if (!contentId || !instruction) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'contentId and instruction are required',
               });
          }

          // Validate content ID format
          if (!mongoose.Types.ObjectId.isValid(contentId)) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Invalid contentId format',
               });
          }

          // Validate instruction (basic validation - not empty)
          if (typeof instruction !== 'string' || instruction.trim().length === 0) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'instruction must be a non-empty string',
               });
          }

          // Initialize content generation service
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return res.status(500).json({
                    error: 'Configuration error',
                    message: 'Gemini API key not configured',
               });
          }

          const contentService = new ContentGenerationService(geminiApiKey);

          // Refine content
          const refinedContent = await contentService.refineContent({
               contentId,
               userId: req.user.userId,
               instruction: instruction.trim(),
          });

          res.json({
               message: 'Content refined successfully',
               content: {
                    id: refinedContent._id,
                    analysisId: refinedContent.analysisId,
                    platform: refinedContent.platform,
                    generatedText: refinedContent.generatedText,
                    editedText: refinedContent.editedText,
                    version: refinedContent.version,
                    createdAt: refinedContent.createdAt,
               },
          });
     } catch (error) {
          console.error('Error refining content:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to refine content';

          if (error instanceof Error) {
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Content not found';
               } else if (error.message.includes('Unauthorized')) {
                    statusCode = 401;
                    errorMessage = 'Unauthorized access';
               } else if (error.message.includes('rate limit')) {
                    statusCode = 429;
                    errorMessage = 'API rate limit exceeded';
               } else if (error.message.includes('Gemini')) {
                    statusCode = 503;
                    errorMessage = 'AI service temporarily unavailable';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * POST /api/content/:id/save-edits
 * Save user edits and queue asynchronous learning job
 * Supports both single posts (editedText) and threads (editedTweets)
 */
router.post('/:id/save-edits', defaultRateLimiter, validateSaveEdits, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { id: contentId } = req.params;
          const { editedText, editedTweets } = req.body;

          // Validate content ID format
          if (!mongoose.Types.ObjectId.isValid(contentId)) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Invalid contentId format',
               });
          }

          // Retrieve existing content
          const content = await Content.findById(contentId);
          if (!content) {
               return res.status(404).json({
                    error: 'Not found',
                    message: 'Content not found',
               });
          }

          // Verify user owns this content
          if (content.userId.toString() !== req.user.userId) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Unauthorized access to content',
               });
          }

          // Check if content is a thread or single post
          const isThread = content.tweets && content.tweets.length > 0;

          // Validate correct parameter is provided based on content type
          if (isThread && !editedTweets) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'editedTweets is required for thread content',
               });
          }

          if (!isThread && !editedText) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'editedText is required for single post content',
               });
          }

          // Initialize services
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return res.status(500).json({
                    error: 'Configuration error',
                    message: 'Gemini API key not configured',
               });
          }

          const { StyleDeltaExtractionService } = await import('../services/StyleDeltaExtractionService');
          const { FeedbackLearningEngine } = await import('../services/FeedbackLearningEngine');

          const styleDeltaService = new StyleDeltaExtractionService(geminiApiKey);

          if (isThread) {
               // Handle thread edits
               // Update tweets array with edited tweets
               const editedTweetsMap = new Map<number, string>(
                    editedTweets.map((tweet: { position: number; text: string }) => [tweet.position, tweet.text])
               );

               // Update each edited tweet in the content
               for (const tweet of content.tweets!) {
                    const editedTweetText = editedTweetsMap.get(tweet.position);
                    if (editedTweetText !== undefined) {
                         tweet.text = editedTweetText;
                         tweet.characterCount = editedTweetText.length;
                    }
               }

               // Update editedText with concatenated edited tweets
               content.editedText = content.tweets!.map(t => t.text).join('\n\n');

               // Extract style deltas for each edited tweet
               // We'll process the first edited tweet for metadata (simplified approach)
               // In a more sophisticated implementation, we could aggregate deltas from all edits
               const firstEditedTweet = editedTweets[0];
               const originalTweet = content.tweets!.find(t => t.position === firstEditedTweet.position);

               if (originalTweet) {
                    const delta = await styleDeltaService.extractDeltas(
                         originalTweet.text,
                         firstEditedTweet.text
                    );

                    // Store edit metadata
                    content.editMetadata = {
                         originalText: content.generatedText,
                         originalLength: content.generatedText.length,
                         editedLength: content.editedText.length,
                         sentenceLengthDelta: delta.sentenceLengthDelta,
                         emojiChanges: delta.emojiChanges,
                         structureChanges: delta.structureChanges,
                         toneShift: delta.toneShift,
                         vocabularyChanges: delta.vocabularyChanges,
                         phrasesAdded: delta.phrasesAdded,
                         phrasesRemoved: delta.phrasesRemoved,
                         editTimestamp: new Date(),
                         learningProcessed: false,
                    };
               }

               await content.save();

               // Queue learning job for each edited tweet
               try {
                    const learningEngine = new FeedbackLearningEngine(geminiApiKey);
                    // Queue a single learning job for the thread
                    // The learning engine will process all tweet edits together
                    await learningEngine.queueLearningJob(contentId, req.user.userId);
               } catch (learningError) {
                    console.error('Failed to queue learning job:', learningError);
               }

               // Return updated content with tweets
               res.json({
                    message: 'Thread edits saved successfully',
                    content: {
                         id: content._id,
                         analysisId: content.analysisId,
                         platform: content.platform,
                         contentFormat: content.contentFormat,
                         generatedText: content.generatedText,
                         editedText: content.editedText,
                         tweets: content.tweets,
                         version: content.version,
                         snapshotId: content.snapshotId,
                         createdAt: content.createdAt,
                         updatedAt: content.updatedAt,
                    },
               });
          } else {
               // Handle single post edits (existing logic)
               const originalText = content.generatedText;
               const delta = await styleDeltaService.extractDeltas(originalText, editedText.trim());

               // Update content with edited text and metadata
               content.editedText = editedText.trim();
               content.editMetadata = {
                    originalText,
                    originalLength: originalText.length,
                    editedLength: editedText.trim().length,
                    sentenceLengthDelta: delta.sentenceLengthDelta,
                    emojiChanges: delta.emojiChanges,
                    structureChanges: delta.structureChanges,
                    toneShift: delta.toneShift,
                    vocabularyChanges: delta.vocabularyChanges,
                    phrasesAdded: delta.phrasesAdded,
                    phrasesRemoved: delta.phrasesRemoved,
                    editTimestamp: new Date(),
                    learningProcessed: false,
               };

               await content.save();

               // Queue asynchronous learning job
               try {
                    const learningEngine = new FeedbackLearningEngine(geminiApiKey);
                    await learningEngine.queueLearningJob(contentId, req.user.userId);
               } catch (learningError) {
                    console.error('Failed to queue learning job:', learningError);
               }

               // Return updated content
               res.json({
                    message: 'Edits saved successfully',
                    content: {
                         id: content._id,
                         analysisId: content.analysisId,
                         platform: content.platform,
                         contentFormat: content.contentFormat,
                         generatedText: content.generatedText,
                         editedText: content.editedText,
                         version: content.version,
                         snapshotId: content.snapshotId,
                         createdAt: content.createdAt,
                         updatedAt: content.updatedAt,
                    },
               });
          }
     } catch (error) {
          console.error('Error saving edits:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to save edits';

          if (error instanceof Error) {
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Content not found';
               } else if (error.message.includes('Unauthorized')) {
                    statusCode = 401;
                    errorMessage = 'Unauthorized access';
               } else if (error.message.includes('rate limit')) {
                    statusCode = 429;
                    errorMessage = 'API rate limit exceeded';
               } else if (error.message.includes('Gemini')) {
                    statusCode = 503;
                    errorMessage = 'AI service temporarily unavailable';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

export default router;
