import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../index';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content } from '../../models/Content';
import { AuthService } from '../../services/AuthService';

describe('API Integration Tests', () => {
     let mongoServer: MongoMemoryServer;
     let authService: AuthService;
     let testUser: any;
     let testToken: string;
     let testRepository: any;
     let testAnalysis: any;

     beforeAll(async () => {
          // Disconnect from any existing connection (from global setup)
          if (mongoose.connection.readyState !== 0) {
               await mongoose.disconnect();
          }

          // Start in-memory MongoDB
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);

          authService = new AuthService();
     }, 60000);

     afterAll(async () => {
          await mongoose.disconnect();
          if (mongoServer) {
               await mongoServer.stop();
          }
     }, 60000);

     beforeEach(async () => {
          // Clear all collections
          await User.deleteMany({});
          await Repository.deleteMany({});
          await Analysis.deleteMany({});
          await Content.deleteMany({});

          // Create test user
          testUser = await User.create({
               githubId: '12345',
               username: 'testuser',
               accessToken: 'test-github-token',
               avatarUrl: 'https://example.com/avatar.jpg',
          });

          // Generate JWT for test user
          testToken = authService.generateJWT(testUser);

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubRepoId: '67890',
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'A test repository',
               url: 'https://github.com/testuser/test-repo',
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               problemStatement: 'Solves testing problems',
               targetAudience: 'Developers',
               coreFunctionality: ['Testing', 'Integration'],
               notableFeatures: ['Fast', 'Reliable'],
               recentChanges: ['Added new tests'],
               integrations: ['Jest', 'Supertest'],
               valueProposition: 'Makes testing easier',
               rawSignals: {
                    readmeLength: 1000,
                    commitCount: 50,
                    prCount: 10,
                    fileStructure: ['src/', 'tests/'],
               },
          });
     });

     describe('Authentication Flow', () => {
          describe('POST /api/auth/github', () => {
               it('should initiate OAuth flow and return authorization URL', async () => {
                    const response = await request(app)
                         .post('/api/auth/github')
                         .expect(200);

                    expect(response.body).toHaveProperty('url');
                    expect(response.body.url).toContain('github.com/login/oauth/authorize');
                    expect(response.body.url).toContain('client_id=');
               });
          });

          describe('GET /api/auth/callback', () => {
               it('should return error when code is missing', async () => {
                    const response = await request(app)
                         .get('/api/auth/callback')
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('Authorization code is required');
               });

               it('should return error when OAuth error is present', async () => {
                    const response = await request(app)
                         .get('/api/auth/callback')
                         .query({ error: 'access_denied', error_description: 'User denied access' })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('User denied access');
               });
          });
     });

     describe('Repository Routes', () => {
          describe('GET /api/repositories', () => {
               it('should return 401 without authentication', async () => {
                    const response = await request(app)
                         .get('/api/repositories')
                         .expect(401);

                    expect(response.body).toHaveProperty('error');
               });

               it('should return 404 when user not found', async () => {
                    // Create a JWT for a non-existent user
                    const fakeUserId = new mongoose.Types.ObjectId();
                    const fakeUser = {
                         _id: fakeUserId,
                         githubId: '99999',
                         username: 'fakeuser',
                         accessToken: 'fake-token',
                         avatarUrl: 'https://example.com/fake.jpg',
                    } as any;
                    const fakeToken = authService.generateJWT(fakeUser);

                    const response = await request(app)
                         .get('/api/repositories')
                         .set('Authorization', `Bearer ${fakeToken}`)
                         .expect(404);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('User account not found');
               });
          });

          describe('POST /api/repositories/:id/analyze', () => {
               it('should return 401 without authentication', async () => {
                    const response = await request(app)
                         .post(`/api/repositories/${testRepository._id}/analyze`)
                         .expect(401);

                    expect(response.body).toHaveProperty('error');
               });

               it('should return 400 for invalid repository ID', async () => {
                    const response = await request(app)
                         .post('/api/repositories/invalid-id/analyze')
                         .set('Authorization', `Bearer ${testToken}`)
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('Invalid repository ID');
               });

               it('should return 404 for non-existent repository', async () => {
                    const fakeRepoId = new mongoose.Types.ObjectId();
                    const response = await request(app)
                         .post(`/api/repositories/${fakeRepoId}/analyze`)
                         .set('Authorization', `Bearer ${testToken}`)
                         .expect(404);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('Repository not found');
               });
          });

          describe('GET /api/repositories/:id/analysis', () => {
               it('should return 401 without authentication', async () => {
                    const response = await request(app)
                         .get(`/api/repositories/${testRepository._id}/analysis`)
                         .expect(401);

                    expect(response.body).toHaveProperty('error');
               });

               it('should return 400 for invalid repository ID', async () => {
                    const response = await request(app)
                         .get('/api/repositories/invalid-id/analysis')
                         .set('Authorization', `Bearer ${testToken}`)
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('Invalid repository ID');
               });

               it('should return 404 for non-existent repository', async () => {
                    const fakeRepoId = new mongoose.Types.ObjectId();
                    const response = await request(app)
                         .get(`/api/repositories/${fakeRepoId}/analysis`)
                         .set('Authorization', `Bearer ${testToken}`)
                         .expect(404);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('Repository not found');
               });

               it('should return 404 when no analysis exists', async () => {
                    // Create a new repository without analysis
                    const newRepo = await Repository.create({
                         userId: testUser._id,
                         githubRepoId: '99999',
                         name: 'no-analysis-repo',
                         fullName: 'testuser/no-analysis-repo',
                         description: 'A repo without analysis',
                         url: 'https://github.com/testuser/no-analysis-repo',
                    });

                    const response = await request(app)
                         .get(`/api/repositories/${newRepo._id}/analysis`)
                         .set('Authorization', `Bearer ${testToken}`)
                         .expect(404);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('No analysis found');
               });
          });
     });

     describe('Content Generation Routes', () => {
          describe('POST /api/content/generate', () => {
               it('should return 401 without authentication', async () => {
                    const response = await request(app)
                         .post('/api/content/generate')
                         .send({
                              analysisId: testAnalysis._id,
                              platform: 'linkedin',
                              tone: 'Professional',
                         })
                         .expect(401);

                    expect(response.body).toHaveProperty('error');
               });

               it('should return 400 when required fields are missing', async () => {
                    const response = await request(app)
                         .post('/api/content/generate')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({
                              platform: 'linkedin',
                         })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('required');
               });

               it('should return 400 for invalid analysisId format', async () => {
                    const response = await request(app)
                         .post('/api/content/generate')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({
                              analysisId: 'invalid-id',
                              platform: 'linkedin',
                              tone: 'Professional',
                         })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('Invalid analysisId format');
               });

               it('should return 400 for invalid platform', async () => {
                    const response = await request(app)
                         .post('/api/content/generate')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({
                              analysisId: testAnalysis._id,
                              platform: 'facebook',
                              tone: 'Professional',
                         })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('platform must be either "linkedin" or "x"');
               });

               it('should return 400 for empty tone', async () => {
                    const response = await request(app)
                         .post('/api/content/generate')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({
                              analysisId: testAnalysis._id,
                              platform: 'linkedin',
                              tone: '',
                         })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('tone must be a non-empty string');
               });
          });

          describe('POST /api/content/refine', () => {
               let testContent: any;

               beforeEach(async () => {
                    // Create test content
                    testContent = await Content.create({
                         analysisId: testAnalysis._id,
                         userId: testUser._id,
                         platform: 'linkedin',
                         tone: 'Professional',
                         generatedText: 'Original content text',
                         editedText: null,
                         version: 1,
                    });
               });

               it('should return 401 without authentication', async () => {
                    const response = await request(app)
                         .post('/api/content/refine')
                         .send({
                              contentId: testContent._id,
                              instruction: 'Make it shorter',
                         })
                         .expect(401);

                    expect(response.body).toHaveProperty('error');
               });

               it('should return 400 when required fields are missing', async () => {
                    const response = await request(app)
                         .post('/api/content/refine')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({
                              contentId: testContent._id,
                         })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('required');
               });

               it('should return 400 for invalid contentId format', async () => {
                    const response = await request(app)
                         .post('/api/content/refine')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({
                              contentId: 'invalid-id',
                              instruction: 'Make it shorter',
                         })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('Invalid contentId format');
               });

               it('should return 400 for empty instruction', async () => {
                    const response = await request(app)
                         .post('/api/content/refine')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({
                              contentId: testContent._id,
                              instruction: '',
                         })
                         .expect(400);

                    expect(response.body).toHaveProperty('error');
                    expect(response.body.message).toContain('instruction must be a non-empty string');
               });
          });
     });

     describe('End-to-End Flows', () => {
          it('should complete authentication flow', async () => {
               // Step 1: Initiate OAuth
               const authResponse = await request(app)
                    .post('/api/auth/github')
                    .expect(200);

               expect(authResponse.body).toHaveProperty('url');
               expect(authResponse.body.url).toContain('github.com/login/oauth/authorize');
          });

          it('should handle repository not found in analysis flow', async () => {
               const fakeRepoId = new mongoose.Types.ObjectId();

               // Try to analyze non-existent repository
               const analyzeResponse = await request(app)
                    .post(`/api/repositories/${fakeRepoId}/analyze`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(404);

               expect(analyzeResponse.body).toHaveProperty('error');
          });

          it('should handle content generation with invalid analysis', async () => {
               const fakeAnalysisId = new mongoose.Types.ObjectId();

               // Try to generate content for non-existent analysis
               const generateResponse = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: fakeAnalysisId,
                         platform: 'linkedin',
                         tone: 'Professional',
                    })
                    .expect(404);

               expect(generateResponse.body).toHaveProperty('error');
          });
     });
});