import * as fc from 'fast-check';
import { AuthService } from '../AuthService';

// Feature: code-to-content, Property 1: OAuth Flow Initiation
// Validates: Requirements 1.2
describe('AuthService OAuth Property Tests', () => {
     let authService: AuthService;

     beforeAll(() => {
          // Set up required environment variables for testing
          process.env.GITHUB_CLIENT_ID = 'test_client_id';
          process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
          process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/api/auth/callback';
          process.env.JWT_SECRET = 'test_jwt_secret_key';

          authService = new AuthService();
     });

     describe('Property 1: OAuth Flow Initiation', () => {
          test('for any authenticated user action, the system should generate a valid GitHub OAuth URL with correct parameters', () => {
               fc.assert(
                    fc.property(
                         fc.string({ minLength: 10, maxLength: 50 }), // Random state string
                         (state) => {
                              // Generate OAuth URL
                              const authUrl = authService.generateAuthUrl(state);

                              // Verify URL is valid
                              expect(authUrl).toBeTruthy();
                              expect(typeof authUrl).toBe('string');

                              // Parse URL
                              const url = new URL(authUrl);

                              // Verify base URL
                              expect(url.origin).toBe('https://github.com');
                              expect(url.pathname).toBe('/login/oauth/authorize');

                              // Verify required parameters
                              const params = url.searchParams;
                              expect(params.get('client_id')).toBe('test_client_id');
                              expect(params.get('redirect_uri')).toBe('http://localhost:3000/api/auth/callback');
                              expect(params.get('scope')).toBe('read:user,repo');
                              expect(params.get('state')).toBe(state);

                              // Verify URL is properly formatted
                              expect(authUrl).toContain('github.com/login/oauth/authorize');
                              expect(authUrl).toContain('client_id=');
                              expect(authUrl).toContain('redirect_uri=');
                              expect(authUrl).toContain('scope=');
                              expect(authUrl).toContain('state=');
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          test('for any call without state parameter, the system should generate a valid OAuth URL with random state', () => {
               fc.assert(
                    fc.property(
                         fc.constant(undefined), // No state provided
                         () => {
                              // Generate OAuth URL without state
                              const authUrl = authService.generateAuthUrl();

                              // Verify URL is valid
                              expect(authUrl).toBeTruthy();
                              expect(typeof authUrl).toBe('string');

                              // Parse URL
                              const url = new URL(authUrl);

                              // Verify state parameter exists and is not empty
                              const state = url.searchParams.get('state');
                              expect(state).toBeTruthy();
                              expect(state!.length).toBeGreaterThan(0);

                              // Verify other required parameters
                              expect(url.searchParams.get('client_id')).toBe('test_client_id');
                              expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/callback');
                              expect(url.searchParams.get('scope')).toBe('read:user,repo');
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});
