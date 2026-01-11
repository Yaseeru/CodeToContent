import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { GitHubService } from '../services/GitHubService';
import { AnalysisService } from '../services/AnalysisService';
import { Repository } from '../models/Repository';
import { User } from '../models/User';
import mongoose from 'mongoose';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/repositories
 * Fetch user's GitHub repositories
 */
router.get('/', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          // Get user from database to retrieve access token
          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          // Initialize GitHub service with user's access token
          const githubService = new GitHubService(user.accessToken);

          // Fetch repositories from GitHub
          const githubRepos = await githubService.fetchUserRepositories();

          // Store/update repositories in database
          const repositories = await Promise.all(
               githubRepos.map(async (repo) => {
                    const repository = await Repository.findOneAndUpdate(
                         { githubRepoId: repo.id.toString() },
                         {
                              userId: user._id,
                              githubRepoId: repo.id.toString(),
                              name: repo.name,
                              fullName: repo.full_name,
                              description: repo.description || '',
                              url: repo.html_url,
                         },
                         {
                              upsert: true,
                              new: true,
                         }
                    );
                    return repository;
               })
          );

          res.json({
               repositories: repositories.map((repo) => ({
                    id: repo._id,
                    name: repo.name,
                    fullName: repo.fullName,
                    description: repo.description,
                    url: repo.url,
                    lastAnalyzed: repo.lastAnalyzed,
               })),
          });
     } catch (error) {
          console.error('Error fetching repositories:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to fetch repositories';

          if (error instanceof Error) {
               if (error.message.includes('authentication') || error.message.includes('Token')) {
                    statusCode = 401;
                    errorMessage = 'GitHub authentication failed';
               } else if (error.message.includes('rate limit')) {
                    statusCode = 429;
                    errorMessage = 'GitHub API rate limit exceeded';
               } else if (error.message.includes('forbidden')) {
                    statusCode = 403;
                    errorMessage = 'Access forbidden';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * POST /api/repositories/:id/analyze
 * Trigger repository analysis
 */
router.post('/:id/analyze', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { id } = req.params;

          // Validate repository ID
          if (!mongoose.Types.ObjectId.isValid(id)) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Invalid repository ID',
               });
          }

          // Get user from database to retrieve access token
          const user = await User.findById(req.user.userId);
          if (!user) {
               return res.status(404).json({
                    error: 'User not found',
                    message: 'User account not found',
               });
          }

          // Verify repository belongs to user
          const repository = await Repository.findOne({
               _id: id,
               userId: req.user.userId,
          });

          if (!repository) {
               return res.status(404).json({
                    error: 'Repository not found',
                    message: 'Repository not found or does not belong to user',
               });
          }

          // Initialize analysis service
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return res.status(500).json({
                    error: 'Configuration error',
                    message: 'Gemini API key not configured',
               });
          }

          const analysisService = new AnalysisService(geminiApiKey);

          // Trigger analysis (this is async but we return immediately)
          const analysis = await analysisService.analyzeRepository(
               id,
               req.user.userId,
               user.accessToken
          );

          res.json({
               message: 'Analysis completed',
               analysisId: analysis._id,
               analysis: {
                    id: analysis._id,
                    repositoryId: analysis.repositoryId,
                    problemStatement: analysis.problemStatement,
                    targetAudience: analysis.targetAudience,
                    coreFunctionality: analysis.coreFunctionality,
                    notableFeatures: analysis.notableFeatures,
                    recentChanges: analysis.recentChanges,
                    integrations: analysis.integrations,
                    valueProposition: analysis.valueProposition,
                    createdAt: analysis.createdAt,
               },
          });
     } catch (error) {
          console.error('Error analyzing repository:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to analyze repository';

          if (error instanceof Error) {
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Repository not found';
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
 * GET /api/repositories/:id/analysis
 * Get analysis results for a repository
 */
router.get('/:id/analysis', async (req: Request, res: Response) => {
     try {
          if (!req.user) {
               return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'User not authenticated',
               });
          }

          const { id } = req.params;

          // Validate repository ID
          if (!mongoose.Types.ObjectId.isValid(id)) {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Invalid repository ID',
               });
          }

          // Verify repository belongs to user
          const repository = await Repository.findOne({
               _id: id,
               userId: req.user.userId,
          });

          if (!repository) {
               return res.status(404).json({
                    error: 'Repository not found',
                    message: 'Repository not found or does not belong to user',
               });
          }

          // Initialize analysis service
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (!geminiApiKey) {
               return res.status(500).json({
                    error: 'Configuration error',
                    message: 'Gemini API key not configured',
               });
          }

          const analysisService = new AnalysisService(geminiApiKey);

          // Get analysis
          const analysis = await analysisService.getAnalysis(id, req.user.userId);

          if (!analysis) {
               return res.status(404).json({
                    error: 'Analysis not found',
                    message: 'No analysis found for this repository',
               });
          }

          res.json({
               analysis: {
                    id: analysis._id,
                    repositoryId: analysis.repositoryId,
                    problemStatement: analysis.problemStatement,
                    targetAudience: analysis.targetAudience,
                    coreFunctionality: analysis.coreFunctionality,
                    notableFeatures: analysis.notableFeatures,
                    recentChanges: analysis.recentChanges,
                    integrations: analysis.integrations,
                    valueProposition: analysis.valueProposition,
                    createdAt: analysis.createdAt,
               },
          });
     } catch (error) {
          console.error('Error retrieving analysis:', error);

          let statusCode = 500;
          let errorMessage = 'Failed to retrieve analysis';

          if (error instanceof Error) {
               if (error.message.includes('not found')) {
                    statusCode = 404;
                    errorMessage = 'Analysis not found';
               } else if (error.message.includes('Unauthorized')) {
                    statusCode = 401;
                    errorMessage = 'Unauthorized access';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

export default router;
