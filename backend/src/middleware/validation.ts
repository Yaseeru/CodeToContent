import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger, LogLevel } from '../services/LoggerService';

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
               userId: req.user?.id,
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
 * Validates: analysisId (MongoDB ObjectId), platform (linkedin/x), voiceStrength (0-100)
 */
export const validateContentGeneration = [
     body('analysisId')
          .notEmpty().withMessage('analysisId is required')
          .custom((value) => mongoose.Types.ObjectId.isValid(value))
          .withMessage('analysisId must be a valid MongoDB ObjectId'),
     body('platform')
          .isIn(['linkedin', 'x'])
          .withMessage('platform must be either "linkedin" or "x"'),
     body('voiceStrength')
          .optional()
          .isInt({ min: 0, max: 100 })
          .withMessage('voiceStrength must be between 0 and 100'),
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
          .isLength({ min: 300 })
          .withMessage('text must be at least 300 characters'),
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
          .isInt({ min: 1, max: 10 })
          .withMessage('tone.professional must be between 1 and 10'),
     body('tone.casual')
          .optional()
          .isInt({ min: 1, max: 10 })
          .withMessage('tone.casual must be between 1 and 10'),
     body('tone.enthusiastic')
          .optional()
          .isInt({ min: 1, max: 10 })
          .withMessage('tone.enthusiastic must be between 1 and 10'),
     body('tone.analytical')
          .optional()
          .isInt({ min: 1, max: 10 })
          .withMessage('tone.analytical must be between 1 and 10'),
     handleValidationErrors
];

/**
 * Validation rules for saving content edits endpoint
 * Validates: content ID (MongoDB ObjectId), editedText (min 10 chars), deltas (array)
 */
export const validateSaveEdits = [
     param('id')
          .custom((value) => mongoose.Types.ObjectId.isValid(value))
          .withMessage('Content ID must be a valid MongoDB ObjectId'),
     body('editedText')
          .notEmpty().withMessage('editedText is required')
          .isLength({ min: 10 })
          .withMessage('editedText must be at least 10 characters'),
     body('deltas')
          .optional()
          .isArray()
          .withMessage('deltas must be an array'),
     handleValidationErrors
];
