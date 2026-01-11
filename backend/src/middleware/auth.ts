import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { JWTPayload } from '../services/AuthService';

// Extend Express Request type to include user information
declare global {
     namespace Express {
          interface Request {
               user?: JWTPayload;
          }
     }
}

const authService = new AuthService();

/**
 * Authentication middleware for protected routes
 * Validates JWT from Authorization header and attaches user info to request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
     try {
          // Extract token from Authorization header
          const authHeader = req.headers.authorization;

          if (!authHeader) {
               res.status(401).json({
                    error: 'Unauthorized',
                    message: 'No authorization token provided',
               });
               return;
          }

          // Expected format: "Bearer <token>"
          const parts = authHeader.split(' ');

          if (parts.length !== 2 || parts[0] !== 'Bearer') {
               res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid authorization header format',
               });
               return;
          }

          const token = parts[1];

          // Verify and decode token
          const payload = authService.verifyJWT(token);

          // Attach user information to request
          req.user = payload;

          next();
     } catch (error) {
          console.error('Authentication error:', error);

          if (error instanceof Error) {
               if (error.message === 'Invalid token' || error.message === 'Token expired') {
                    res.status(401).json({
                         error: 'Unauthorized',
                         message: error.message,
                    });
                    return;
               }
          }

          res.status(401).json({
               error: 'Unauthorized',
               message: 'Authentication failed',
          });
     }
};
