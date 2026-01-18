import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { defaultRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';
import { validateTextAnalysis, validateStyleUpdate } from '../middleware/validation';
import { VoiceAnalysisService } from '../services/VoiceAnalysisService';
import { ProfileEvolutionService } from '../services/ProfileEvolutionService';
import { ArchetypeManagementService } from '../services/ArchetypeManagementService';
import { User } from '../models/User';
import mongoose from 'mongoose';
import multer from 'multer';
import { FILE_UPLOAD_CONFIG, VALIDATION_CONFIG } from '../config/constants';

const router = Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
     storage: multer.memoryStorage(),
     limits: {
          fileSize: FILE_UPLOAD_CONFIG.MAX_SIZE_BYTES,
     },
     fileFilter: (req, file, cb) => {
          if (FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
               cb(null, true);
          } else {
               cb(new Error(`Invalid file type. Supported formats: ${FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`));
          }
     },
});

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/profile/analyze-text
 * Analyze text or file upload to create/update style profile
 */
router.post('/analyze-text', strictRateLimiter, upload.single('file'), validateTextAnalysis, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return res.status(500).json({
                    error: 'Configuration error',
                    message: 'Gemini API key not configured',
               });
          }

          const voiceAnalysisService = new VoiceAnalysisService(geminiApiKey);
          const profileEvolutionService = new ProfileEvolutionService();

          let styleProfile;

          // Check if file upload or text input
          if (req.file) {
               // File upload
               styleProfile = await voiceAnalysisService.analyzeFile({
                    fileBuffer: req.file.buffer,
                    fileName: req.file.originalname,
                    mimeType: req.file.mimetype,
               });
          } else if (req.body.text) {
               // Text input
               styleProfile = await voiceAnalysisService.analyzeText({
                    text: req.body.text,
               });
          } else {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Either text or file upload is required',
               });
          }

          // Update user's style profile
          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          // Create version snapshot before updating (if profile exists)
          const { ProfileVersioningService } = await import('../services/ProfileVersioningService');
          if (user.styleProfile) {
               await ProfileVersioningService.createVersionSnapshot(req.user.userId, 'manual');
          }

          user.styleProfile = styleProfile;
          await user.save();

          // Calculate evolution score
          const evolutionScore = await profileEvolutionService.calculateEvolutionScore(req.user.userId);

          res.json({
               message: 'Style profile created successfully',
               profile: styleProfile,
               evolutionScore,
          });
     } catch (error) {
          console.error('Error analyzing text:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to analyze text';

          if (error instanceof Error) {
               if (error.message.includes('Minimum 300 characters')) {
                    statusCode = 400;
                    errorMessage = 'Minimum 300 characters required for text analysis';
               } else if (error.message.includes('Minimum 500 characters') || error.message.includes('File must contain')) {
                    statusCode = 400;
                    errorMessage = 'File must contain at least 500 characters';
               } else if (error.message.includes('Supported formats')) {
                    statusCode = 400;
                    errorMessage = 'Supported formats: .txt, .md, .pdf';
               } else if (error.message.includes('Unable to extract text from PDF')) {
                    statusCode = 400;
                    errorMessage = 'Unable to extract text from PDF';
               } else if (error.message.includes('rate limit')) {
                    statusCode = 429;
                    errorMessage = 'Gemini API rate limit exceeded. Please try again later.';
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
 * GET /api/profile/style
 * Get current user's style profile with evolution score
 */
router.get('/style', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          if (!user.styleProfile) {
               return res.status(404).json({
                    error: 'Profile not found',
                    message: 'User has no style profile',
               });
          }

          const profileEvolutionService = new ProfileEvolutionService();
          const evolutionScore = await profileEvolutionService.calculateEvolutionScore(req.user.userId);

          res.json({
               profile: user.styleProfile,
               evolutionScore,
               voiceStrength: user.voiceStrength,
          });
     } catch (error) {
          console.error('Error retrieving style profile:', error);

          res.status(500).json({
               error: 'Failed to retrieve style profile',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * PUT /api/profile/style
 * Update user's style profile manually
 */
router.put('/style', defaultRateLimiter, validateStyleUpdate, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          if (!user.styleProfile) {
               return res.status(404).json({
                    error: 'Profile not found',
                    message: 'User has no style profile to update',
               });
          }

          const updates = req.body;

          // Validate tone metrics if provided
          if (updates.tone) {
               const toneFields = ['formality', 'enthusiasm', 'directness', 'humor', 'emotionality'];
               for (const field of toneFields) {
                    if (updates.tone[field] !== undefined) {
                         const value = updates.tone[field];
                         if (typeof value !== 'number' || value < 1 || value > 10) {
                              return res.status(400).json({
                                   error: 'Invalid request',
                                   message: `tone.${field} must be a number between 1 and 10`,
                              });
                         }
                    }
               }
          }

          // Validate writing traits if provided
          if (updates.writingTraits) {
               if (updates.writingTraits.emojiFrequency !== undefined) {
                    const value = updates.writingTraits.emojiFrequency;
                    if (typeof value !== 'number' || value < 0 || value > 5) {
                         return res.status(400).json({
                              error: 'Invalid request',
                              message: 'writingTraits.emojiFrequency must be a number between 0 and 5',
                         });
                    }
               }
          }

          // Validate voice strength if provided
          if (updates.voiceStrength !== undefined) {
               const value = updates.voiceStrength;
               if (typeof value !== 'number' || value < 0 || value > 100) {
                    return res.status(400).json({
                         error: 'Invalid request',
                         message: 'voiceStrength must be a number between 0 and 100',
                    });
               }
               user.voiceStrength = value;
          }

          // Update profile fields
          if (updates.tone) {
               user.styleProfile.tone = { ...user.styleProfile.tone, ...updates.tone };
          }
          if (updates.writingTraits) {
               user.styleProfile.writingTraits = { ...user.styleProfile.writingTraits, ...updates.writingTraits };
          }
          if (updates.structurePreferences) {
               user.styleProfile.structurePreferences = { ...user.styleProfile.structurePreferences, ...updates.structurePreferences };
          }
          if (updates.vocabularyLevel) {
               user.styleProfile.vocabularyLevel = updates.vocabularyLevel;
          }
          if (updates.commonPhrases) {
               user.styleProfile.commonPhrases = updates.commonPhrases;
          }
          if (updates.bannedPhrases) {
               user.styleProfile.bannedPhrases = updates.bannedPhrases;
          }
          if (updates.samplePosts) {
               user.styleProfile.samplePosts = updates.samplePosts;
          }

          // Update lastUpdated timestamp
          user.styleProfile.lastUpdated = new Date();

          // Create version snapshot before saving
          const { ProfileVersioningService } = await import('../services/ProfileVersioningService');
          await ProfileVersioningService.createVersionSnapshot(req.user.userId, 'manual');

          // Save manual overrides
          if (!user.manualOverrides) {
               user.manualOverrides = {};
          }
          if (updates.tone) {
               user.manualOverrides.tone = { ...user.manualOverrides.tone, ...updates.tone };
          }
          if (updates.writingTraits) {
               user.manualOverrides.writingTraits = { ...user.manualOverrides.writingTraits, ...updates.writingTraits };
          }
          if (updates.structurePreferences) {
               user.manualOverrides.structurePreferences = { ...user.manualOverrides.structurePreferences, ...updates.structurePreferences };
          }

          await user.save();

          const profileEvolutionService = new ProfileEvolutionService();
          const evolutionScore = await profileEvolutionService.calculateEvolutionScore(req.user.userId);

          res.json({
               message: 'Style profile updated successfully',
               profile: user.styleProfile,
               evolutionScore,
               voiceStrength: user.voiceStrength,
          });
     } catch (error) {
          console.error('Error updating style profile:', error);

          res.status(500).json({
               error: 'Failed to update style profile',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * POST /api/profile/reset
 * Reset user's style profile to defaults
 */
router.post('/reset', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          // Clear style profile and manual overrides
          user.styleProfile = undefined;
          user.manualOverrides = undefined;
          user.voiceStrength = 80; // Reset to default

          await user.save();

          res.json({
               message: 'Style profile reset successfully',
          });
     } catch (error) {
          console.error('Error resetting style profile:', error);

          res.status(500).json({
               error: 'Failed to reset style profile',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * GET /api/profile/archetypes
 * List available voice archetypes
 */
router.get('/archetypes', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const archetypeService = new ArchetypeManagementService();

          // Initialize default archetypes if not already done
          await archetypeService.initializeDefaultArchetypes();

          const archetypes = await archetypeService.listArchetypes();

          res.json({
               archetypes: archetypes.map(archetype => ({
                    id: archetype._id,
                    name: archetype.name,
                    description: archetype.description,
                    category: archetype.category,
                    usageCount: archetype.usageCount,
                    isDefault: archetype.isDefault,
               })),
          });
     } catch (error) {
          console.error('Error listing archetypes:', error);

          res.status(500).json({
               error: 'Failed to list archetypes',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * POST /api/profile/apply-archetype
 * Apply an archetype to user's profile
 */
router.post('/apply-archetype', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { archetypeId } = req.body;

          if (!archetypeId) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'archetypeId is required',
               });
          }

          if (!mongoose.Types.ObjectId.isValid(archetypeId)) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Invalid archetypeId format',
               });
          }

          const archetypeService = new ArchetypeManagementService();
          const profileEvolutionService = new ProfileEvolutionService();

          const appliedProfile = await archetypeService.applyArchetype({
               userId: req.user.userId,
               archetypeId,
          });

          const evolutionScore = await profileEvolutionService.calculateEvolutionScore(req.user.userId);

          res.json({
               message: 'Archetype applied successfully',
               profile: appliedProfile,
               evolutionScore,
          });
     } catch (error) {
          console.error('Error applying archetype:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to apply archetype';

          if (error instanceof Error) {
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = error.message;
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * GET /api/profile/analytics
 * Get profile evolution metrics and statistics
 */
router.get('/analytics', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          if (!user.styleProfile) {
               return res.status(404).json({
                    error: 'Profile not found',
                    message: 'User has no style profile',
               });
          }

          const profileEvolutionService = new ProfileEvolutionService();
          const analytics = await profileEvolutionService.getAnalytics(req.user.userId);

          res.json({
               analytics,
          });
     } catch (error) {
          console.error('Error retrieving analytics:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to retrieve analytics';

          if (error instanceof Error) {
               if (error.message.includes('no style profile')) {
                    statusCode = 404;
                    errorMessage = 'User has no style profile';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * GET /api/profile/evolution-timeline
 * Get profile learning history with milestones
 */
router.get('/evolution-timeline', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          if (!user.styleProfile) {
               return res.status(404).json({
                    error: 'Profile not found',
                    message: 'User has no style profile',
               });
          }

          const profileEvolutionService = new ProfileEvolutionService();
          const timeline = await profileEvolutionService.getEvolutionTimeline(req.user.userId);

          res.json({
               timeline,
          });
     } catch (error) {
          console.error('Error retrieving evolution timeline:', error);

          res.status(500).json({
               error: 'Failed to retrieve evolution timeline',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * GET /api/profile/versions
 * Get profile version history
 */
router.get('/versions', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { ProfileVersioningService } = await import('../services/ProfileVersioningService');
          const versions = await ProfileVersioningService.getVersionHistory(req.user.userId);

          res.json({
               versions,
               count: versions.length,
          });
     } catch (error) {
          console.error('Error retrieving version history:', error);

          res.status(500).json({
               error: 'Failed to retrieve version history',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * POST /api/profile/rollback
 * Rollback to a previous profile version
 */
router.post('/rollback', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { versionIndex } = req.body;

          if (typeof versionIndex !== 'number') {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'versionIndex must be a number',
               });
          }

          const { ProfileVersioningService } = await import('../services/ProfileVersioningService');
          const restoredProfile = await ProfileVersioningService.rollbackToVersion(
               req.user.userId,
               versionIndex
          );

          if (!restoredProfile) {
               return res.status(404).json({
                    error: 'Version not found',
                    message: 'No profile version found at the specified index',
               });
          }

          // Invalidate caches
          const { cacheService } = await import('../services/CacheService');
          await cacheService.invalidateStyleProfile(req.user.userId);
          await cacheService.invalidateEvolutionScore(req.user.userId);

          // Calculate new evolution score
          const profileEvolutionService = new ProfileEvolutionService();
          const evolutionScore = await profileEvolutionService.calculateEvolutionScore(req.user.userId);

          res.json({
               message: 'Profile rolled back successfully',
               profile: restoredProfile,
               evolutionScore,
          });
     } catch (error) {
          console.error('Error rolling back profile:', error);

          if (error instanceof Error && error.message === 'Invalid version index') {
               return res.status(400).json({
                    error: 'Invalid version index',
                    message: error.message,
               });
          }

          res.status(500).json({
               error: 'Failed to rollback profile',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

export default router;

