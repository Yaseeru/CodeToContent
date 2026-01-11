import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/github
 * Initiates GitHub OAuth flow
 */
router.post('/github', (req: Request, res: Response) => {
     try {
          const authUrl = authService.generateAuthUrl();
          res.json({ url: authUrl });
     } catch (error) {
          console.error('Error initiating OAuth:', error);
          res.status(500).json({
               error: 'Failed to initiate authentication',
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

/**
 * GET /api/auth/callback
 * Handles GitHub OAuth callback
 */
router.get('/callback', async (req: Request, res: Response) => {
     try {
          const { code, error, error_description } = req.query;

          // Handle OAuth errors (user denied permission, etc.)
          if (error) {
               return res.status(400).json({
                    error: 'OAuth authentication failed',
                    message: error_description || error,
               });
          }

          // Validate code parameter
          if (!code || typeof code !== 'string') {
               return res.status(400).json({
                    error: 'Invalid request',
                    message: 'Authorization code is required',
               });
          }

          // Complete OAuth flow
          const { user, token } = await authService.handleOAuthCallback(code);

          // Return JWT and user information
          res.json({
               token,
               user: {
                    id: user._id,
                    githubId: user.githubId,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
               },
          });
     } catch (error) {
          console.error('Error handling OAuth callback:', error);

          // Determine appropriate status code based on error type
          let statusCode = 500;
          let errorMessage = 'Authentication failed';

          if (error instanceof Error) {
               if (error.message.includes('OAuth') || error.message.includes('GitHub')) {
                    statusCode = 401;
                    errorMessage = 'GitHub authentication failed';
               } else if (error.message.includes('network') || error.message.includes('timeout')) {
                    statusCode = 503;
                    errorMessage = 'Service temporarily unavailable';
               }
          }

          res.status(statusCode).json({
               error: errorMessage,
               message: error instanceof Error ? error.message : 'Unknown error',
          });
     }
});

export default router;
