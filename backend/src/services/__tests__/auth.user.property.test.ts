import * as fc from 'fast-check';
import { AuthService, GitHubUser } from '../AuthService';
import { User } from '../../models/User';

// Feature: code-to-content, Property 2: Successful OAuth Redirect
// Validates: Requirements 1.3
describe('AuthService User Property Tests', () => {
     let authService: AuthService;

     beforeAll(() => {
          // Set up required environment variables for testing
          process.env.GITHUB_CLIENT_ID = 'test_client_id';
          process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
          process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/api/auth/callback';
          process.env.JWT_SECRET = 'test_jwt_secret_key';

          authService = new AuthService();
     });

     describe('Property 2: Successful OAuth Redirect', () => {
          test('for any valid GitHub user data, the system should create/update user record and generate valid JWT', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.record({
                              id: fc.integer({ min: 1, max: 1000000 }),
                              login: fc.string({ minLength: 3, maxLength: 39 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
                              avatar_url: fc.webUrl(),
                         }),
                         fc.string({ minLength: 20, maxLength: 100 }), // Access token
                         async (githubUser: GitHubUser, accessToken: string) => {
                              // Create or update user
                              const user = await authService.createOrUpdateUser(githubUser, accessToken);

                              // Verify user was created/updated correctly
                              expect(user).toBeDefined();
                              expect(user.githubId).toBe(githubUser.id.toString());
                              expect(user.username).toBe(githubUser.login);
                              expect(user.accessToken).toBe(accessToken);
                              expect(user.avatarUrl).toBe(githubUser.avatar_url);

                              // Generate JWT
                              const token = authService.generateJWT(user);

                              // Verify JWT is valid
                              expect(token).toBeTruthy();
                              expect(typeof token).toBe('string');
                              expect(token.split('.').length).toBe(3); // JWT has 3 parts

                              // Verify JWT can be decoded
                              const decoded = authService.verifyJWT(token);
                              expect(decoded.userId).toBe(user._id.toString());
                              expect(decoded.githubId).toBe(user.githubId);
                              expect(decoded.username).toBe(user.username);

                              // Verify user exists in database
                              const dbUser = await User.findOne({ githubId: githubUser.id.toString() });
                              expect(dbUser).toBeDefined();
                              expect(dbUser!.username).toBe(githubUser.login);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 60000); // 60 second timeout for property test

          test('for any existing user, updating with new data should preserve user ID but update fields', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.record({
                              id: fc.integer({ min: 1, max: 1000000 }),
                              login: fc.string({ minLength: 3, maxLength: 39 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)),
                              avatar_url: fc.webUrl(),
                         }),
                         fc.string({ minLength: 20, maxLength: 100 }),
                         fc.string({ minLength: 3, maxLength: 39 }).filter(s => /^[a-zA-Z0-9-]+$/.test(s)), // New username
                         fc.string({ minLength: 20, maxLength: 100 }), // New access token
                         async (githubUser: GitHubUser, accessToken: string, newUsername: string, newAccessToken: string) => {
                              // Create initial user
                              const initialUser = await authService.createOrUpdateUser(githubUser, accessToken);
                              const initialUserId = initialUser._id.toString();

                              // Update user with new data
                              const updatedGithubUser: GitHubUser = {
                                   ...githubUser,
                                   login: newUsername,
                              };
                              const updatedUser = await authService.createOrUpdateUser(updatedGithubUser, newAccessToken);

                              // Verify user ID remains the same (upsert behavior)
                              expect(updatedUser._id.toString()).toBe(initialUserId);

                              // Verify fields were updated
                              expect(updatedUser.username).toBe(newUsername);
                              expect(updatedUser.accessToken).toBe(newAccessToken);
                              expect(updatedUser.githubId).toBe(githubUser.id.toString());

                              // Verify only one user exists in database
                              const userCount = await User.countDocuments({ githubId: githubUser.id.toString() });
                              expect(userCount).toBe(1);
                         }
                    ),
                    { numRuns: 100 }
               );
          }, 60000); // 60 second timeout for property test
     });
});
