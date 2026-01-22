import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../index';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content } from '../../models/Content';
import { LearningJob } from '../../models/LearningJob';
import { AuthService } from '../../services/AuthService';

// Integration tests for thread editing functionality
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2
describe('Content API Thread Editing Integration Tests', () => {
     let mongoServer: MongoMemoryServer;
     let authService: AuthService;
     let testUser: any;
     let testToken: string;
     let testRepository: any;
     let testAnalysis: any;

     beforeAll(async () => {
          // Disconnect from any existing connection
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
          await LearningJob.deleteMany({});

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

     describe('POST /api/content/:id/save-edits - Thread Editing', () => {
          let miniThreadContent: any;
          let fullThreadContent: any;
          let singlePostContent: any;

          beforeEach(async () => {
               // Create mini thread content (3 tweets)
               miniThreadContent = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'mini_thread',
                    generatedText: 'Tweet 1 text 1/3\n\nTweet 2 text 2/3\n\nTweet 3 text 3/3',
                    editedText: '',
                    tweets: [
                         { text: 'Tweet 1 text 1/3', position: 1, characterCount: 18 },
                         { text: 'Tweet 2 text 2/3', position: 2, characterCount: 18 },
                         { text: 'Tweet 3 text 3/3', position: 3, characterCount: 18 },
                    ],
                    version: 1,
               });

               // Create full thread content (5 tweets)
               fullThreadContent = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'full_thread',
                    generatedText: 'Tweet 1 1/5\n\nTweet 2 2/5\n\nTweet 3 3/5\n\nTweet 4 4/5\n\nTweet 5 5/5',
                    editedText: '',
                    tweets: [
                         { text: 'Tweet 1 1/5', position: 1, characterCount: 11 },
                         { text: 'Tweet 2 2/5', position: 2, characterCount: 11 },
                         { text: 'Tweet 3 3/5', position: 3, characterCount: 11 },
                         { text: 'Tweet 4 4/5', position: 4, characterCount: 11 },
                         { text: 'Tweet 5 5/5', position: 5, characterCount: 11 },
                    ],
                    version: 1,
               });

               // Create single post content
               singlePostContent = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'This is a single post about testing.',
                    editedText: '',
                    version: 1,
               });
          });

          it('should save edits to mini thread tweets', async () => {
               const editedTweets = [
                    { position: 1, text: 'Edited tweet 1 with new content 1/3' },
                    { position: 3, text: 'Edited tweet 3 with different text 3/3' },
               ];

               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Thread edits saved successfully');
               expect(response.body.content).toHaveProperty('tweets');
               expect(response.body.content.tweets).toHaveLength(3);

               // Verify edited tweets were updated
               expect(response.body.content.tweets[0].text).toBe('Edited tweet 1 with new content 1/3');
               expect(response.body.content.tweets[0].characterCount).toBe(37);
               expect(response.body.content.tweets[2].text).toBe('Edited tweet 3 with different text 3/3');
               expect(response.body.content.tweets[2].characterCount).toBe(41);

               // Verify unedited tweet remains unchanged
               expect(response.body.content.tweets[1].text).toBe('Tweet 2 text 2/3');

               // Verify editedText was updated with concatenated tweets
               expect(response.body.content.editedText).toContain('Edited tweet 1');
               expect(response.body.content.editedText).toContain('Edited tweet 3');
          }, 30000);

          it('should save edits to full thread tweets', async () => {
               const editedTweets = [
                    { position: 2, text: 'Updated tweet 2 2/5' },
                    { position: 4, text: 'Updated tweet 4 4/5' },
               ];

               const response = await request(app)
                    .post(`/api/content/${fullThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Thread edits saved successfully');
               expect(response.body.content.tweets).toHaveLength(5);
               expect(response.body.content.tweets[1].text).toBe('Updated tweet 2 2/5');
               expect(response.body.content.tweets[3].text).toBe('Updated tweet 4 4/5');
          }, 30000);

          it('should store edit metadata for thread edits', async () => {
               const editedTweets = [
                    { position: 1, text: 'Edited tweet 1 with emoji 🚀 1/3' },
               ];

               await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               // Verify edit metadata was stored
               const updatedContent = await Content.findById(miniThreadContent._id);
               expect(updatedContent).toBeTruthy();
               expect(updatedContent!.editMetadata).toBeDefined();
               expect(updatedContent!.editMetadata!.learningProcessed).toBe(false);
               expect(updatedContent!.editMetadata!.emojiChanges).toBeDefined();
          }, 30000);

          it('should queue learning job for thread edits', async () => {
               const editedTweets = [
                    { position: 1, text: 'Edited tweet 1 1/3' },
                    { position: 2, text: 'Edited tweet 2 2/3' },
               ];

               await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               // Wait for async job to be queued
               await new Promise(resolve => setTimeout(resolve, 1000));

               // Verify learning job was created
               const learningJobs = await LearningJob.find({ userId: testUser._id });
               expect(learningJobs.length).toBeGreaterThan(0);
               expect(learningJobs[0].contentId.toString()).toBe(miniThreadContent._id.toString());
               expect(learningJobs[0].status).toBe('pending');
          }, 30000);

          it('should return 400 when editedTweets is missing for thread content', async () => {
               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText: 'Some text' }) // Wrong parameter for thread
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Invalid request');
               expect(response.body.message).toContain('editedTweets is required for thread content');
          });

          it('should return 400 when editedText is missing for single post content', async () => {
               const response = await request(app)
                    .post(`/api/content/${singlePostContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets: [{ position: 1, text: 'Tweet' }] }) // Wrong parameter for single
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Invalid request');
               expect(response.body.message).toContain('editedText is required for single post content');
          });

          it('should validate tweet character limits', async () => {
               const longText = 'a'.repeat(281); // Exceeds 280 character limit
               const editedTweets = [
                    { position: 1, text: longText },
               ];

               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
          });

          it('should validate tweet positions are positive integers', async () => {
               const editedTweets = [
                    { position: 0, text: 'Invalid position' }, // Position must be >= 1
               ];

               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
          });

          it('should handle editing all tweets in a thread', async () => {
               const editedTweets = [
                    { position: 1, text: 'All new tweet 1 1/3' },
                    { position: 2, text: 'All new tweet 2 2/3' },
                    { position: 3, text: 'All new tweet 3 3/3' },
               ];

               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               expect(response.body.content.tweets).toHaveLength(3);
               expect(response.body.content.tweets[0].text).toBe('All new tweet 1 1/3');
               expect(response.body.content.tweets[1].text).toBe('All new tweet 2 2/3');
               expect(response.body.content.tweets[2].text).toBe('All new tweet 3 3/3');
          }, 30000);

          it('should return 401 for unauthorized access to thread content', async () => {
               // Create another user
               const otherUser = await User.create({
                    githubId: '99999',
                    username: 'otheruser',
                    accessToken: 'other-token',
                    avatarUrl: 'https://example.com/other.jpg',
               });

               const otherToken = authService.generateJWT(otherUser);

               const editedTweets = [
                    { position: 1, text: 'Trying to edit' },
               ];

               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${otherToken}`)
                    .send({ editedTweets })
                    .expect(401);

               expect(response.body).toHaveProperty('error', 'Unauthorized');
          });

          it('should include contentFormat in response', async () => {
               const editedTweets = [
                    { position: 1, text: 'Edited tweet 1/3' },
               ];

               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               expect(response.body.content).toHaveProperty('contentFormat', 'mini_thread');
          }, 30000);

          it('should update character counts correctly', async () => {
               const editedTweets = [
                    { position: 1, text: 'Short 1/3' },
                    { position: 2, text: 'This is a much longer tweet with more characters 2/3' },
               ];

               const response = await request(app)
                    .post(`/api/content/${miniThreadContent._id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               expect(response.body.content.tweets[0].characterCount).toBe(9);
               expect(response.body.content.tweets[1].characterCount).toBe(53);
          }, 30000);
     });
});
