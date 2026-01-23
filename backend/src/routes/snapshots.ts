import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { snapshotGenerationRateLimiter } from '../middleware/rateLimiter';
import {
     validateSnapshotGeneration,
     validateRepositoryIdParam,
     validateSnapshotIdParam,
} from '../middleware/validation';
import { ServiceManager } from '../services/ServiceManager';
import { User } from '../models/User';
import { Repository } from '../models/Repository';
import { CodeSnapshot } from '../models/CodeSnapshot';
import mongoose from 'mongoose';
import { LoggerService, LogLevel } from '../services/LoggerService';

const router = Router();
const logger = LoggerService.getInstance();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/snapshots/generate
 * Generate code snapshot images for a repository
 */
router.post('/generate', snapshotGenerationRateLimiter, validateSnapshotGeneration, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { repositoryId } = req.body;

          // Get user from database to retrieve access token
          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          // Verify repository belongs to user (check user access)
          const repository = await Repository.findOne({
               _id: repositoryId,
               userId: req.user.userId,
          });

          if (!repository) {
               return res.status(404).json({
                    error: 'Repository not found',
                    message: 'Repository not found or does not belong to user',
               });
          }

          // Get VisualSnapshotService from ServiceManager
          const serviceManager = ServiceManager.getInstance();
          const visualSnapshotService = serviceManager.getVisualSnapshotService();

          // Call VisualSnapshotService.generateSnapshotsForRepository
          const snapshots = await visualSnapshotService.generateSnapshotsForRepository(
               repositoryId,
               req.user.userId,
               user.accessToken
          );

          // Return generated snapshots with metadata
          res.json({
               message: 'Snapshots generated successfully',
               count: snapshots.length,
               snapshots: snapshots.map((snapshot) => ({
                    id: snapshot._id,
                    repositoryId: snapshot.repositoryId,
                    snippetMetadata: {
                         filePath: snapshot.snippetMetadata.filePath,
                         startLine: snapshot.snippetMetadata.startLine,
                         endLine: snapshot.snippetMetadata.endLine,
                         functionName: snapshot.snippetMetadata.functionName,
                         language: snapshot.snippetMetadata.language,
                         linesOfCode: snapshot.snippetMetadata.linesOfCode,
                    },
                    selectionScore: snapshot.selectionScore,
                    selectionReason: snapshot.selectionReason,
                    imageUrl: snapshot.imageUrl,
                    imageSize: snapshot.imageSize,
                    imageDimensions: snapshot.imageDimensions,
                    createdAt: snapshot.createdAt,
               })),
          });
     } catch (error) {
          logger.log(LogLevel.ERROR, 'Error generating snapshots', {
               error: error instanceof Error ? error.message : String(error),
               repositoryId: req.body.repositoryId
          });

          let statusCode = 500;
          let errorMessage = 'Failed to generate code snapshots';

          if (error instanceof Error) {
               // Handle specific error cases with user-friendly messages
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Repository or analysis not found';
               } else if (error.message.includes('Unauthorized') || error.message.includes('does not own')) {
                    statusCode = 403;
                    errorMessage = 'You do not have access to this repository';
               } else if (error.message.includes('analyze the repository first')) {
                    statusCode = 400;
                    errorMessage = 'Please analyze the repository before generating snapshots';
               } else if (error.message.includes('not initialized')) {
                    statusCode = 503;
                    errorMessage = 'Snapshot service is not available. Please try again later';
               } else if (error.message.includes('rate limit')) {
                    statusCode = 429;
                    errorMessage = 'API rate limit exceeded. Please try again later';
               } else if (error.message.includes('Gemini') || error.message.includes('AI')) {
                    statusCode = 503;
                    errorMessage = 'AI service temporarily unavailable. Please try again later';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * GET /api/snapshots/:repositoryId
 * Get all code snapshots for a repository
 */
router.get('/:repositoryId', validateRepositoryIdParam, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { repositoryId } = req.params;

          // Get VisualSnapshotService from ServiceManager
          const serviceManager = ServiceManager.getInstance();
          const visualSnapshotService = serviceManager.getVisualSnapshotService();

          // Call VisualSnapshotService.getSnapshotsForRepository
          // Filter by user ownership is handled in the service
          const snapshots = await visualSnapshotService.getSnapshotsForRepository(
               repositoryId,
               req.user.userId
          );

          // Return snapshot list with metadata
          res.json({
               count: snapshots.length,
               snapshots: snapshots.map((snapshot) => ({
                    id: snapshot._id,
                    repositoryId: snapshot.repositoryId,
                    snippetMetadata: {
                         filePath: snapshot.snippetMetadata.filePath,
                         startLine: snapshot.snippetMetadata.startLine,
                         endLine: snapshot.snippetMetadata.endLine,
                         functionName: snapshot.snippetMetadata.functionName,
                         language: snapshot.snippetMetadata.language,
                         linesOfCode: snapshot.snippetMetadata.linesOfCode,
                    },
                    selectionScore: snapshot.selectionScore,
                    selectionReason: snapshot.selectionReason,
                    imageUrl: snapshot.imageUrl,
                    imageSize: snapshot.imageSize,
                    imageDimensions: snapshot.imageDimensions,
                    isStale: snapshot.isStale,
                    createdAt: snapshot.createdAt,
               })),
          });
     } catch (error) {
          logger.log(LogLevel.ERROR, 'Error fetching snapshots', {
               error: error instanceof Error ? error.message : String(error),
               repositoryId: req.params.repositoryId
          });

          let statusCode = 500;
          let errorMessage = 'Failed to fetch code snapshots';

          if (error instanceof Error) {
               // Handle specific error cases with user-friendly messages
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Repository not found';
               } else if (error.message.includes('Unauthorized') || error.message.includes('does not own')) {
                    statusCode = 403;
                    errorMessage = 'You do not have access to this repository';
               } else if (error.message.includes('not initialized')) {
                    statusCode = 503;
                    errorMessage = 'Snapshot service is not available. Please try again later';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * GET /api/snapshots/snapshot/:snapshotId
 * Get a single code snapshot by ID
 */
router.get('/snapshot/:snapshotId', validateSnapshotIdParam, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { snapshotId } = req.params;

          // Fetch single snapshot from CodeSnapshot model
          const snapshot = await CodeSnapshot.findById(snapshotId);

          // Return 404 if snapshot not found
          if (!snapshot) {
               return res.status(404).json({
                    error: 'Snapshot not found',
                    message: 'Code snapshot not found',
               });
          }

          // Verify user ownership - return 403 if user doesn't own the snapshot
          if (snapshot.userId.toString() !== req.user.userId) {
               return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this snapshot',
               });
          }

          // Return snapshot details with imageUrl
          res.json({
               snapshot: {
                    id: snapshot._id,
                    repositoryId: snapshot.repositoryId,
                    analysisId: snapshot.analysisId,
                    userId: snapshot.userId,
                    snippetMetadata: {
                         filePath: snapshot.snippetMetadata.filePath,
                         startLine: snapshot.snippetMetadata.startLine,
                         endLine: snapshot.snippetMetadata.endLine,
                         functionName: snapshot.snippetMetadata.functionName,
                         language: snapshot.snippetMetadata.language,
                         linesOfCode: snapshot.snippetMetadata.linesOfCode,
                    },
                    selectionScore: snapshot.selectionScore,
                    selectionReason: snapshot.selectionReason,
                    imageUrl: snapshot.imageUrl,
                    imageSize: snapshot.imageSize,
                    imageDimensions: snapshot.imageDimensions,
                    renderOptions: snapshot.renderOptions,
                    isStale: snapshot.isStale,
                    lastCommitSha: snapshot.lastCommitSha,
                    createdAt: snapshot.createdAt,
                    updatedAt: snapshot.updatedAt,
               },
          });
     } catch (error) {
          logger.log(LogLevel.ERROR, 'Error fetching snapshot', {
               error: error instanceof Error ? error.message : String(error),
               snapshotId: req.params.snapshotId
          });

          let statusCode = 500;
          let errorMessage = 'Failed to fetch code snapshot';

          if (error instanceof Error) {
               // Handle specific error cases with user-friendly messages
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Snapshot not found';
               } else if (error.message.includes('Unauthorized') || error.message.includes('does not own')) {
                    statusCode = 403;
                    errorMessage = 'You do not have access to this snapshot';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * DELETE /api/snapshots/:snapshotId
 * Delete a code snapshot and its associated image
 */
router.delete('/:snapshotId', validateSnapshotIdParam, async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { snapshotId } = req.params;

          // Fetch the snapshot to verify ownership and get imageUrl
          const snapshot = await CodeSnapshot.findById(snapshotId);

          // Return 404 if snapshot not found
          if (!snapshot) {
               return res.status(404).json({
                    error: 'Snapshot not found',
                    message: 'Code snapshot not found',
               });
          }

          // Verify user ownership - return 403 if user doesn't own the snapshot
          if (snapshot.userId.toString() !== req.user.userId) {
               return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this snapshot',
               });
          }

          // Get StorageService from ServiceManager
          const serviceManager = ServiceManager.getInstance();
          const storageService = serviceManager.getStorageService();

          // Delete image from storage
          await storageService.deleteImage(snapshot.imageUrl);

          // Delete CodeSnapshot document from database
          await CodeSnapshot.findByIdAndDelete(snapshotId);

          // Return success response
          res.json({
               success: true,
               message: 'Snapshot deleted successfully',
          });
     } catch (error) {
          logger.log(LogLevel.ERROR, 'Error deleting snapshot', {
               error: error instanceof Error ? error.message : String(error),
               snapshotId: req.params.snapshotId
          });

          let statusCode = 500;
          let errorMessage = 'Failed to delete code snapshot';

          if (error instanceof Error) {
               // Handle specific error cases with user-friendly messages
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Snapshot not found';
               } else if (error.message.includes('Unauthorized') || error.message.includes('does not own')) {
                    statusCode = 403;
                    errorMessage = 'You do not have access to this snapshot';
               } else if (error.message.includes('not initialized')) {
                    statusCode = 503;
                    errorMessage = 'Storage service is not available. Please try again later';
               } else if (error.message.includes('storage') || error.message.includes('delete')) {
                    statusCode = 500;
                    errorMessage = 'Failed to delete snapshot image. Please try again';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

export default router;
