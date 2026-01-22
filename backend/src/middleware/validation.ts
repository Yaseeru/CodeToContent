import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger, LogLevel } from '../services/LoggerService';
import { VALIDATION_CONFIG } from '../config/constants';

/**
 * Validation error handler middleware
 * Processes validation results and returns formatted error responses
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
     const errors = validationResult(req);

     if (!errors.isEmpty()) {
          const formattedErrors = errors.array().map(err => ({
               field: err.type === 'field' ? err.path : err.type,
               message: err.msg
          }));

          logger.log(LogLevel.WARN, 'Validation failed', {
               userId: req.user?.userId,
               endpoint: req.path,
               errors: formattedErrors
          });

          res.status(400).json({
               error: 'Validation failed',
               details: formattedErrors
          });
          return;
     }

     next();
}

/**
 * Validation rules for content generation endpoint
 * Validates: analysisId (MongoDB ObjectId), platform (linkedin/x), voiceStrength (0-100), format (single/mini_thread/full_thread)
 */
export const validateContentGeneration = [
     body('analysisId')
          .notEmpty().withMessage('analysisId is required')
          .custom((value) => mongoose.Types.ObjectId.isValid(value))
          .withMessage('analysisId must be a valid MongoDB ObjectId'),
     body('platform')
          .isIn(['x'])
          .withMessage('platform must be "x"'),
     body('voiceStrength')
          .optional()
          .isInt({ min: VALIDATION_CONFIG.VOICE_STRENGTH_MIN, max: VALIDATION_CONFIG.VOICE_STRENGTH_MAX })
          .withMessage(`voiceStrength must be between ${VALIDATION_CONFIG.VOICE_STRENGTH_MIN} and ${VALIDATION_CONFIG.VOICE_STRENGTH_MAX}`),
     body('format')
          .optional()
          .isIn(['single', 'mini_thread', 'full_thread'])
          .withMessage('format must be one of: "single", "mini_thread", or "full_thread"'),
     handleValidationErrors
];

/**
 * Validation rules for text analysis endpoint
 * Validates: text (min 300 chars) - optional if file is uploaded, source (text/file)
 * Note: File validation is handled by multer middleware
 */
export const validateTextAnalysis = [
     body('text')
          .if((value: any, { req }: any) => !req.file) // Only validate text if no file uploaded
          .notEmpty().withMessage('text is required when no file is uploaded')
          .isLength({ min: VALIDATION_CONFIG.TEXT_ANALYSIS_MIN_CHARS })
          .withMessage(`text must be at least ${VALIDATION_CONFIG.TEXT_ANALYSIS_MIN_CHARS} characters`),
     body('source')
          .optional()
          .isIn(['text', 'file'])
          .withMessage('source must be either "text" or "file"'),
     handleValidationErrors
];

/**
 * Validation rules for style profile update endpoint
 * Validates: tone metrics (1-10 range)
 */
export const validateStyleUpdate = [
     body('tone.professional')
          .optional()
          .isInt({ min: VALIDATION_CONFIG.TONE_METRIC_MIN, max: VALIDATION_CONFIG.TONE_METRIC_MAX })
          .withMessage(`tone.professional must be between ${VALIDATION_CONFIG.TONE_METRIC_MIN} and ${VALIDATION_CONFIG.TONE_METRIC_MAX}`),
     body('tone.casual')
          .optional()
          .isInt({ min: VALIDATION_CONFIG.TONE_METRIC_MIN, max: VALIDATION_CONFIG.TONE_METRIC_MAX })
          .withMessage(`tone.casual must be between ${VALIDATION_CONFIG.TONE_METRIC_MIN} and ${VALIDATION_CONFIG.TONE_METRIC_MAX}`),
     body('tone.enthusiastic')
          .optional()
          .isInt({ min: VALIDATION_CONFIG.TONE_METRIC_MIN, max: VALIDATION_CONFIG.TONE_METRIC_MAX })
          .withMessage(`tone.enthusiastic must be between ${VALIDATION_CONFIG.TONE_METRIC_MIN} and ${VALIDATION_CONFIG.TONE_METRIC_MAX}`),
     body('tone.analytical')
          .optional()
          .isInt({ min: VALIDATION_CONFIG.TONE_METRIC_MIN, max: VALIDATION_CONFIG.TONE_METRIC_MAX })
          .withMessage(`tone.analytical must be between ${VALIDATION_CONFIG.TONE_METRIC_MIN} and ${VALIDATION_CONFIG.TONE_METRIC_MAX}`),
     handleValidationErrors
];

/**
 * Validation rules for saving content edits endpoint
 * Validates: content ID (MongoDB ObjectId), editedText OR editedTweets (mutually exclusive)
 * For single posts: editedText (min 10 chars)
 * For threads: editedTweets array with position and text, each tweet ≤ 280 chars
 */
export const validateSaveEdits = [
     param('id')
          .custom((value) => mongoose.Types.ObjectId.isValid(value))
          .withMessage('Content ID must be a valid MongoDB ObjectId'),

     // Custom validation to ensure either editedText OR editedTweets is provided (not both)
     body()
          .custom((value, { req }) => {
               const hasEditedText = req.body.editedText !== undefined && req.body.editedText !== null;
               const hasEditedTweets = req.body.editedTweets !== undefined && req.body.editedTweets !== null;

               // Must have exactly one of the two
               if (!hasEditedText && !hasEditedTweets) {
                    throw new Error('Either editedText or editedTweets must be provided');
               }

               if (hasEditedText && hasEditedTweets) {
                    throw new Error('Cannot provide both editedText and editedTweets - use only one');
               }

               return true;
          }),

     // Validate editedText if provided (for single posts)
     body('editedText')
          .optional()
          .isString()
          .withMessage('editedText must be a string')
          .isLength({ min: VALIDATION_CONFIG.EDITED_TEXT_MIN_CHARS })
          .withMessage(`editedText must be at least ${VALIDATION_CONFIG.EDITED_TEXT_MIN_CHARS} characters`),

     // Validate editedTweets if provided (for threads)
     body('editedTweets')
          .optional()
          .isArray({ min: 1 })
          .withMessage('editedTweets must be a non-empty array'),

     body('editedTweets.*.position')
          .if(body('editedTweets').exists())
          .isInt({ min: 1 })
          .withMessage('Each tweet position must be a positive integer'),

     body('editedTweets.*.text')
          .if(body('editedTweets').exists())
          .isString()
          .withMessage('Each tweet text must be a string')
          .notEmpty()
          .withMessage('Each tweet text must not be empty')
          .isLength({ max: 280 })
          .withMessage('Each tweet must be 280 characters or less'),

     body('deltas')
          .optional()
          .isArray()
          .withMessage('deltas must be an array'),

     handleValidationErrors
];

/**
 * Validation rules for snapshot generation endpoint
 * Validates: repositoryId (MongoDB ObjectId)
 */
export const validateSnapshotGeneration = [
     body('repositoryId')
          .notEmpty().withMessage('repositoryId is required')
          .custom((value) => mongoose.Types.ObjectId.isValid(value))
          .withMessage('repositoryId must be a valid MongoDB ObjectId'),
     handleValidationErrors
];

/**
 * Validation rules for repository ID parameter
 * Validates: repositoryId (MongoDB ObjectId)
 */
export const validateRepositoryIdParam = [
     param('repositoryId')
          .custom((value) => mongoose.Types.ObjectId.isValid(value))
          .withMessage('repositoryId must be a valid MongoDB ObjectId'),
     handleValidationErrors
];

/**
 * Validation rules for snapshot ID parameter
 * Validates: snapshotId (MongoDB ObjectId)
 */
export const validateSnapshotIdParam = [
     param('snapshotId')
          .custom((value) => mongoose.Types.ObjectId.isValid(value))
          .withMessage('snapshotId must be a valid MongoDB ObjectId'),
     handleValidationErrors
];
