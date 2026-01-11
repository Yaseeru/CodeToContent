import * as fc from 'fast-check';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';

// Feature: code-to-content, Property 3: Authentication Error Handling
// Validates: Requirements 1.5
describe('AuthService Error Handling Property Tests', () => {
     let app: express.Application;

     beforeAll(() => {
          // Set up required environment variables for testing
          process.env.GITHUB_CLIENT_ID = 'test_client_id';
          process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
          process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/api/auth/callback';
          process.env.JWT_SECRET = 'test_jwt_secret_key';

          // Create Express app with auth routes
          app = express();
          app.use(express.json());
          app.use('/api/auth', authRoutes);
     });

     describe('Property 3: Authentication Error Handling', () => {
          test('for any OAuth error response, the system should return appropriate error message and status code', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.oneof(
                              fc.constant('access_denied'),
                              fc.constant('unauthorized_client'),
                              fc.constant('invalid_request'),
                              fc.constant('server_error')
                         ),
                         fc.string({ minLength: 10, maxLength: 100 }), // Error description
                         async (errorCode: string, errorDescription: string) => {
                              // Make request with OAuth error parameters
                              const response = await request(app)
                                   .get('/api/auth/callback')
                                   .query({
                                        error: errorCode,
                                        error_description: errorDescription,
                                   });

                              // Verify error response
                              expect(response.status).toBe(400);
                              expect(response.body).toHaveProperty('error');
                              expect(response.body).toHaveProperty('message');
                              expect(response.body.error).toBe('OAuth authentication failed');
                              expect(response.body.message).toBe(errorDescription);
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          test('for any missing or invalid authorization code, the system should return 400 error', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.oneof(
                              fc.constant(undefined),
                              fc.constant(''),
                              fc.constant(null),
                              fc.integer(), // Invalid type
                              fc.array(fc.string()) // Invalid type
                         ),
                         async (invalidCode: any) => {
                              // Make request with invalid code
                              const response = await request(app)
                                   .get('/api/auth/callback')
                                   .query(invalidCode !== undefined ? { code: invalidCode } : {});

                              // Verify error response
                              expect(response.status).toBe(400);
                              expect(response.body).toHaveProperty('error');
                              expect(response.body).toHaveProperty('message');
                              expect(response.body.error).toBe('Invalid request');
                              expect(response.body.message).toBe('Authorization code is required');
                         }
                    ),
                    { numRuns: 100 }
               );
          });

          test('for any OAuth error without description, the system should use error code as message', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.oneof(
                              fc.constant('access_denied'),
                              fc.constant('unauthorized_client'),
                              fc.constant('invalid_request')
                         ),
                         async (errorCode: string) => {
                              // Make request with OAuth error but no description
                              const response = await request(app)
                                   .get('/api/auth/callback')
                                   .query({ error: errorCode });

                              // Verify error response uses error code as message
                              expect(response.status).toBe(400);
                              expect(response.body).toHaveProperty('error');
                              expect(response.body).toHaveProperty('message');
                              expect(response.body.error).toBe('OAuth authentication failed');
                              expect(response.body.message).toBe(errorCode);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });
});
