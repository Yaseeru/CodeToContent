import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
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
router.post('/generate', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { analysisId, platform, tone, voiceStrength } = req.body;

          // Validate required fields
          if (!analysisId || !platform || !tone) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'analysisId, platform, and tone are required',
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
          if (platform !== 'linkedin' && platform !== 'x') {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'platform must be either "linkedin" or "x"',
               });
          }

          // Validate tone (basic validation - not empty)
          if (typeof tone !== 'string' || tone.trim().length === 0) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'tone must be a non-empty string',
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
               tone: tone.trim(),
               voiceStrength,
          });

          res.json({
               message: 'Content generated successfully',
               content: {
                    id: content._id,
                    analysisId: content.analysisId,
                    platform: content.platform,
                    tone: content.tone,
                    generatedText: content.generatedText,
                    editedText: content.editedText,
                    version: content.version,
                    usedStyleProfile: content.usedStyleProfile,
                    voiceStrengthUsed: content.voiceStrengthUsed,
                    evolutionScoreAtGeneration: content.evolutionScoreAtGeneration,
                    createdAt: content.createdAt,
               },
          });
     } catch (error) {
          console.error('Error generating content:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to generate content';

          if (error instanceof Error) {
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Analysis not found';
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
                    tone: refinedContent.tone,
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
 */
router.post('/:id/save-edits', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { id: contentId } = req.params;
          const { editedText } = req.body;

          // Validate content ID format
          if (!mongoose.Types.ObjectId.isValid(contentId)) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Invalid contentId format',
               });
          }

          // Validate editedText
          if (!editedText || typeof editedText !== 'string' || editedText.trim().length === 0) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'editedText is required and must be a non-empty string',
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

          // Initialize content generation service for delta extraction
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return res.status(500).json({
                    error: 'Configuration error',
                    message: 'Gemini API key not configured',
               });
          }

          // Import services
          const { StyleDeltaExtractionService } = await import('../services/StyleDeltaExtractionService');
          const { FeedbackLearningEngine } = await import('../services/FeedbackLearningEngine');

          const styleDeltaService = new StyleDeltaExtractionService(geminiApiKey);

          // Calculate and store edit metadata
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

          // Queue asynchronous learning job (don't wait for it)
          try {
               const learningEngine = new FeedbackLearningEngine(geminiApiKey);
               await learningEngine.queueLearningJob(contentId, req.user.userId);
          } catch (learningError) {
               // Log error but don't block the save
               console.error('Failed to queue learning job:', learningError);
          }

          // Return immediately without waiting for learning
          res.json({
               message: 'Edits saved successfully',
               content: {
                    id: content._id,
                    analysisId: content.analysisId,
                    platform: content.platform,
                    tone: content.tone,
                    generatedText: content.generatedText,
                    editedText: content.editedText,
                    version: content.version,
                    createdAt: content.createdAt,
                    updatedAt: content.updatedAt,
               },
          });
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
