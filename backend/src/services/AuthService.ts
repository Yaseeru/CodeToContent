import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User, IUser } from '../models/User';
import { AUTH_CONFIG } from '../config/constants';

export interface GitHubUser {
     id: number;
     login: string;
     avatar_url: string;
}

export interface JWTPayload {
     userId: string;
     githubId: string;
     username: string;
}

export class AuthService {
     private clientId: string;
     private clientSecret: string;
     private callbackUrl: string;
     private jwtSecret: string;

     constructor() {
          this.clientId = process.env.GITHUB_CLIENT_ID || '';
          this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
          this.callbackUrl = process.env.GITHUB_CALLBACK_URL || '';
          this.jwtSecret = process.env.JWT_SECRET || '';

          if (!this.clientId || !this.clientSecret || !this.callbackUrl || !this.jwtSecret) {
               throw new Error('Missing required environment variables for AuthService');
          }
     }

     /**
      * Generate GitHub OAuth authorization URL
      */
     generateAuthUrl(state?: string): string {
          const params = new URLSearchParams({
               client_id: this.clientId,
               redirect_uri: this.callbackUrl,
               scope: 'read:user,repo',
               state: state || this.generateRandomState(),
          });

          return `https://github.com/login/oauth/authorize?${params.toString()}`;
     }

     /**
      * Exchange authorization code for access token
      */
     async exchangeCodeForToken(code: string): Promise<string> {
          try {
               const response = await axios.post(
                    'https://github.com/login/oauth/access_token',
                    {
                         client_id: this.clientId,
                         client_secret: this.clientSecret,
                         code,
                         redirect_uri: this.callbackUrl,
                    },
                    {
                         headers: {
                              Accept: 'application/json',
                         },
                    }
               );

               if (response.data.error) {
                    throw new Error(response.data.error_description || 'OAuth token exchange failed');
               }

               return response.data.access_token;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    throw new Error(`GitHub OAuth error: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Fetch GitHub user information using access token
      */
     async fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
          try {
               const response = await axios.get<GitHubUser>('https://api.github.com/user', {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                         Accept: 'application/vnd.github.v3+json',
                    },
               });

               return response.data;
          } catch (error) {
               if (axios.isAxiosError(error)) {
                    throw new Error(`Failed to fetch GitHub user: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Create or update user in database
      */
     async createOrUpdateUser(githubUser: GitHubUser, accessToken: string): Promise<IUser> {
          try {
               const user = await User.findOneAndUpdate(
                    { githubId: githubUser.id.toString() },
                    {
                         githubId: githubUser.id.toString(),
                         username: githubUser.login,
                         accessToken: accessToken, // TODO: Encrypt this in production
                         avatarUrl: githubUser.avatar_url,
                    },
                    {
                         upsert: true,
                         new: true,
                    }
               );

               return user;
          } catch (error) {
               throw new Error(`Failed to create/update user: ${error}`);
          }
     }

     /**
      * Generate JWT token for authenticated user
      */
     generateJWT(user: IUser): string {
          const payload: JWTPayload = {
               userId: user._id.toString(),
               githubId: user.githubId,
               username: user.username,
          };

          return jwt.sign(payload, this.jwtSecret, {
               expiresIn: AUTH_CONFIG.JWT_EXPIRY,
          });
     }

     /**
      * Verify and decode JWT token
      */
     verifyJWT(token: string): JWTPayload {
          try {
               return jwt.verify(token, this.jwtSecret) as JWTPayload;
          } catch (error) {
               if (error instanceof jwt.JsonWebTokenError) {
                    throw new Error('Invalid token');
               }
               if (error instanceof jwt.TokenExpiredError) {
                    throw new Error('Token expired');
               }
               throw error;
          }
     }

     /**
      * Complete OAuth flow: exchange code, fetch user, create/update user, generate JWT
      */
     async handleOAuthCallback(code: string): Promise<{ user: IUser; token: string }> {
          try {
               // Exchange code for access token
               const accessToken = await this.exchangeCodeForToken(code);

               // Fetch GitHub user information
               const githubUser = await this.fetchGitHubUser(accessToken);

               // Create or update user in database
               const user = await this.createOrUpdateUser(githubUser, accessToken);

               // Generate JWT
               const token = this.generateJWT(user);

               return { user, token };
          } catch (error) {
               throw error;
          }
     }

     /**
      * Generate random state for CSRF protection
      */
     private generateRandomState(): string {
          return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
     }
}
