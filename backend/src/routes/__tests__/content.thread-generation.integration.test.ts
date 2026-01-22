import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../index';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content } from '../../models/Content';
import { AuthService } from '../../services/AuthService';

// Integration tests for thread generation API
// Validates: Requirements 3.1, 3.5, 4.1, 4.8
describe('Content API Thread Generation Integration Tests', () => {
     let authService: AuthService;
     let testUser: any;
     let testToken: string;
     let testRepository: any;
     let testAnalysis: any;

     beforeAll(async () => {
          authService = new AuthService();
     });

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

          // Generate JWT
          testToken = authService.generateJWT(testUser);

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubRepoId: '67890',
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'A test repository for thread generation',
               url: 'https://github.com/testuser/test-repo',
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               problemStatement: 'Solves complex testing problems with innovative approach',
               targetAudience: 'Developers and QA engineers',
               coreFunctionality: ['Testing', 'Integration', 'Automation'],
               notableFeatures: ['Fast execution', 'Reliable results', 'Easy setup'],
               recentChanges: ['Added new test framework', 'Improved performance'],
               integrations: ['Jest', 'Supertest', 'GitHub Actions'],
               valueProposition: 'Makes testing easier and more efficient',
               rawSignals: {
                    readmeLength: 2000,
                    commitCount: 100,
                    prCount: 25,
                    fileStructure: ['src/', 'tests/', 'docs/'],
               },
          });
     });

     describe('POST /api/content/generate - Mini Thread', () => {
          it('should generate mini thread with 3 tweets', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'mini_thread',
                    })
                    .expect(200);

               // Assert response structure
               expect(response.body).toHaveProperty('message', 'Content generated successfully');
               expect(response.body).toHaveProperty('content');

               const content = response.body.content;

               // Assert contentFormat matches request
               expect(content).toHaveProperty('contentFormat', 'mini_thread');

               // Assert tweets array is populated
               expect(content).toHaveProperty('tweets');
               expect(Array.isArray(content.tweets)).toBe(true);
               expect(content.tweets.length).toBe(3);

               // Assert each tweet has correct structure
               content.tweets.forEach((tweet: any, index: number) => {
                    expect(tweet).toHaveProperty('text');
                    expect(tweet).toHaveProperty('position', index + 1);
                    expect(tweet).toHaveProperty('characterCount');

                    // Assert character count is accurate
                    expect(tweet.characterCount).toBe(tweet.text.length);

                    // Assert character limit compliance
                    expect(tweet.text.length).toBeLessThanOrEqual(280);
                    expect(tweet.text.length).toBeGreaterThan(0);
               });

               // Assert generatedText is populated
               expect(content).toHaveProperty('generatedText');
               expect(content.generatedText.length).toBeGreaterThan(0);

               // Assert other required fields
               expect(content).toHaveProperty('id');
               expect(content).toHaveProperty('analysisId', testAnalysis._id.toString());
               expect(content).toHaveProperty('platform', 'x');
               expect(content).toHaveProperty('editedText', '');
               expect(content).toHaveProperty('version', 1);
               expect(content).toHaveProperty('createdAt');
          }, 30000);

          it('should store mini thread correctly in database', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'mini_thread',
                    })
                    .expect(200);

               const contentId = response.body.content.id;

               // Retrieve from database
               const storedContent = await Content.findById(contentId);

               expect(storedContent).toBeTruthy();
               expect(storedContent!.contentFormat).toBe('mini_thread');
               expect(storedContent!.tweets).toBeDefined();
               expect(storedContent!.tweets!.length).toBe(3);

               // Verify sequential positions
               storedContent!.tweets!.forEach((tweet, index) => {
                    expect(tweet.position).toBe(index + 1);
               });
          }, 30000);

          it('should apply voice strength to mini thread when provided', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'mini_thread',
                         voiceStrength: 75,
                    })
                    .expect(200);

               expect(response.body.content).toHaveProperty('voiceStrengthUsed', 75);
               expect(response.body.content).toHaveProperty('tweets');
               expect(response.body.content.tweets.length).toBe(3);
          }, 30000);
     });

     describe('POST /api/content/generate - Full Thread', () => {
          it('should generate full thread with 5-7 tweets', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'full_thread',
                    })
                    .expect(200);

               // Assert response structure
               expect(response.body).toHaveProperty('message', 'Content generated successfully');
               expect(response.body).toHaveProperty('content');

               const content = response.body.content;

               // Assert contentFormat matches request
               expect(content).toHaveProperty('contentFormat', 'full_thread');

               // Assert tweets array is populated
               expect(content).toHaveProperty('tweets');
               expect(Array.isArray(content.tweets)).toBe(true);

               // Assert tweet count is within range (5-7)
               expect(content.tweets.length).toBeGreaterThanOrEqual(5);
               expect(content.tweets.length).toBeLessThanOrEqual(7);

               // Assert each tweet has correct structure
               content.tweets.forEach((tweet: any, index: number) => {
                    expect(tweet).toHaveProperty('text');
                    expect(tweet).toHaveProperty('position', index + 1);
                    expect(tweet).toHaveProperty('characterCount');

                    // Assert character count is accurate
                    expect(tweet.characterCount).toBe(tweet.text.length);

                    // Assert character limit compliance
                    expect(tweet.text.length).toBeLessThanOrEqual(280);
                    expect(tweet.text.length).toBeGreaterThan(0);
               });

               // Assert generatedText is populated
               expect(content).toHaveProperty('generatedText');
               expect(content.generatedText.length).toBeGreaterThan(0);

               // Assert other required fields
               expect(content).toHaveProperty('id');
               expect(content).toHaveProperty('analysisId', testAnalysis._id.toString());
               expect(content).toHaveProperty('platform', 'x');
               expect(content).toHaveProperty('editedText', '');
               expect(content).toHaveProperty('version', 1);
               expect(content).toHaveProperty('createdAt');
          }, 30000);

          it('should store full thread correctly in database', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'full_thread',
                    })
                    .expect(200);

               const contentId = response.body.content.id;

               // Retrieve from database
               const storedContent = await Content.findById(contentId);

               expect(storedContent).toBeTruthy();
               expect(storedContent!.contentFormat).toBe('full_thread');
               expect(storedContent!.tweets).toBeDefined();
               expect(storedContent!.tweets!.length).toBeGreaterThanOrEqual(5);
               expect(storedContent!.tweets!.length).toBeLessThanOrEqual(7);

               // Verify sequential positions
               storedContent!.tweets!.forEach((tweet, index) => {
                    expect(tweet.position).toBe(index + 1);
               });
          }, 30000);

          it('should apply voice strength to full thread when provided', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'full_thread',
                         voiceStrength: 90,
                    })
                    .expect(200);

               expect(response.body.content).toHaveProperty('voiceStrengthUsed', 90);
               expect(response.body.content).toHaveProperty('tweets');
               expect(response.body.content.tweets.length).toBeGreaterThanOrEqual(5);
               expect(response.body.content.tweets.length).toBeLessThanOrEqual(7);
          }, 30000);
     });

     describe('POST /api/content/generate - Format Validation', () => {
          it('should reject invalid format parameter', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'invalid_format',
                    })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body).toHaveProperty('details');
               expect(Array.isArray(response.body.details)).toBe(true);
               expect(response.body.details[0].field).toBe('format');
               expect(response.body.details[0].message).toContain('format must be one of');
          });

          it('should default to single format when format not provided', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                    })
                    .expect(200);

               expect(response.body.content).toHaveProperty('contentFormat', 'single');
               expect(response.body.content.tweets).toBeUndefined();
          }, 30000);

          it('should generate single post when format is explicitly single', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'single',
                    })
                    .expect(200);

               expect(response.body.content).toHaveProperty('contentFormat', 'single');
               expect(response.body.content.tweets).toBeUndefined();
               expect(response.body.content).toHaveProperty('generatedText');
               expect(response.body.content.generatedText.length).toBeGreaterThan(0);
          }, 30000);
     });

     describe('POST /api/content/generate - Error Handling', () => {
          it('should return 401 when not authenticated', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'mini_thread',
                    })
                    .expect(401);

               expect(response.body).toHaveProperty('error', 'Unauthorized');
          });

          it('should return 400 for invalid analysisId', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: 'invalid-id',
                         platform: 'x',
                         format: 'mini_thread',
                    })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body).toHaveProperty('details');
               expect(Array.isArray(response.body.details)).toBe(true);
               expect(response.body.details[0].field).toBe('analysisId');
               expect(response.body.details[0].message).toContain('valid MongoDB ObjectId');
          });

          it('should return 404 for non-existent analysis', async () => {
               const fakeId = new mongoose.Types.ObjectId();

               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: fakeId.toString(),
                         platform: 'x',
                         format: 'mini_thread',
                    })
                    .expect(404);

               expect(response.body).toHaveProperty('error', 'Analysis not found');
          }, 30000);

          it('should return 400 for missing required fields', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         format: 'mini_thread',
                    })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body).toHaveProperty('details');
               expect(Array.isArray(response.body.details)).toBe(true);
               // Should have errors for missing analysisId and platform
               expect(response.body.details.length).toBeGreaterThan(0);
          });
     });

     describe('POST /api/content/generate - Backward Compatibility', () => {
          it('should maintain backward compatibility with existing single post generation', async () => {
               // Generate without format parameter (should default to single)
               const response1 = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                    })
                    .expect(200);

               // Generate with explicit single format
               const response2 = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'single',
                    })
                    .expect(200);

               // Both should produce single posts
               expect(response1.body.content.contentFormat).toBe('single');
               expect(response2.body.content.contentFormat).toBe('single');

               // Neither should have tweets array
               expect(response1.body.content.tweets).toBeUndefined();
               expect(response2.body.content.tweets).toBeUndefined();

               // Both should have generatedText
               expect(response1.body.content.generatedText).toBeTruthy();
               expect(response2.body.content.generatedText).toBeTruthy();
          }, 30000);
     });
});
