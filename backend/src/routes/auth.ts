import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

const router = Router();
const authService = new AuthService();

/**
 * GET /api/auth/github
 * Initiates GitHub OAuth flow by redirecting to GitHub
 */
router.get('/github', (req: Request, res: Response) => {
     try {
          const authUrl = authService.generateAuthUrl();
          // Redirect directly to GitHub OAuth page
          res.redirect(authUrl);
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
               // Redirect to frontend with error
               const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
               return res.redirect(`${frontendUrl}/?error=${encodeURIComponent(error_description?.toString() || error.toString())}`);
          }

          // Validate code parameter
          if (!code || typeof code !== 'string') {
               const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
               return res.redirect(`${frontendUrl}/?error=${encodeURIComponent('Authorization code is required')}`);
          }

          // Complete OAuth flow
          const { user, token } = await authService.handleOAuthCallback(code);

          // Redirect to frontend with token
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
     } catch (error) {
          console.error('Error handling OAuth callback:', error);

          // Redirect to frontend with error
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          res.redirect(`${frontendUrl}/?error=${encodeURIComponent(errorMessage)}`);
     }
});

export default router;
