import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { Content } from '../../models/Content';
import { CodeSnapshot } from '../../models/CodeSnapshot';
import { AuthService } from '../../services/AuthService';

// Mock the services that use ESM modules (shiki, puppeteer)
jest.mock('../../services/ImageRenderingService');
jest.mock('../../services/VisualSnapshotService');

// Import app after mocking
import app from '../../index';

// Integration tests for snapshot attachment in content generation
// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 8.1
describe('Content API Snapshot Integration Tests', () => {
     let mongoServer: MongoMemoryServer;
     let authService: AuthService;
     let testUser: any;
     let otherUser: any;
     let testToken: string;
     let otherUserToken: string;
     let testRepository: any;
     let testAnalysis: any;
     let testSnapshot: any;
     let otherUserSnapshot: any;

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
          await CodeSnapshot.deleteMany({});

          // Create test users
          testUser = await User.create({
               githubId: '12345',
               username: 'testuser',
               accessToken: 'test-github-token',
               avatarUrl: 'https://example.com/avatar.jpg',
          });

          otherUser = await User.create({
               githubId: '67890',
               username: 'otheruser',
               accessToken: 'other-github-token',
               avatarUrl: 'https://example.com/avatar2.jpg',
          });

          // Generate test tokens
          testToken = authService.generateJWT(testUser);
          otherUserToken = authService.generateJWT(otherUser);

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubRepoId: 123456,
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'A test repository',
               url: 'https://github.com/testuser/test-repo',
               language: 'TypeScript',
               stars: 10,
               forks: 2,
               isPrivate: false,
               lastAnalyzedAt: new Date(),
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               problemStatement: 'Test problem statement',
               targetAudience: 'Developers',
               coreFunctionality: ['Feature 1', 'Feature 2'],
               notableFeatures: ['Notable 1'],
               recentChanges: ['Change 1'],
               integrations: ['Integration 1'],
               valueProposition: 'Test value proposition',
               status: 'completed',
               rawSignals: {
                    prCount: 5,
                    commitCount: 20,
                    readmeLength: 1000,
               },
          });

          // Create test snapshot for testUser
          testSnapshot = await CodeSnapshot.create({
               repositoryId: testRepository._id,
               analysisId: testAnalysis._id,
               userId: testUser._id,
               snippetMetadata: {
                    filePath: 'src/index.ts',
                    startLine: 1,
                    endLine: 20,
                    functionName: 'main',
                    language: 'typescript',
                    linesOfCode: 20,
               },
               selectionScore: 85,
               selectionReason: 'Core application entry point',
               imageUrl: 'https://example.com/snapshots/test-snapshot.png',
               imageSize: 150000,
               imageDimensions: {
                    width: 1200,
                    height: 800,
               },
               renderOptions: {
                    theme: 'nord',
                    showLineNumbers: false,
                    fontSize: 14,
               },
               isStale: false,
               lastCommitSha: 'abc123',
          });

          // Create snapshot for otherUser
          const otherRepository = await Repository.create({
               userId: otherUser._id,
               githubRepoId: 789012,
               name: 'other-repo',
               fullName: 'otheruser/other-repo',
               description: 'Another test repository',
               url: 'https://github.com/otheruser/other-repo',
               language: 'JavaScript',
               stars: 5,
               forks: 1,
               isPrivate: false,
               lastAnalyzedAt: new Date(),
          });

          const otherAnalysis = await Analysis.create({
               repositoryId: otherRepository._id,
               userId: otherUser._id,
               problemStatement: 'Other problem statement',
               targetAudience: 'Users',
               coreFunctionality: ['Feature A'],
               notableFeatures: ['Notable A'],
               recentChanges: ['Change A'],
               integrations: ['Integration A'],
               valueProposition: 'Other value proposition',
               status: 'completed',
               rawSignals: {
                    prCount: 3,
                    commitCount: 15,
                    readmeLength: 800,
               },
          });

          otherUserSnapshot = await CodeSnapshot.create({
               repositoryId: otherRepository._id,
               analysisId: otherAnalysis._id,
               userId: otherUser._id,
               snippetMetadata: {
                    filePath: 'src/app.js',
                    startLine: 1,
                    endLine: 15,
                    language: 'javascript',
                    linesOfCode: 15,
               },
               selectionScore: 75,
               selectionReason: 'Main application logic',
               imageUrl: 'https://example.com/snapshots/other-snapshot.png',
               imageSize: 120000,
               imageDimensions: {
                    width: 1200,
                    height: 600,
               },
               renderOptions: {
                    theme: 'nord',
                    showLineNumbers: false,
                    fontSize: 14,
               },
               isStale: false,
               lastCommitSha: 'def456',
          });
     });

     describe('POST /api/content/generate - Snapshot Attachment', () => {
          it('should generate content with valid snapshot attachment', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: testSnapshot._id.toString(),
                    })
                    .expect(200);

               expect(response.body.message).toBe('Content generated successfully');
               expect(response.body.content).toBeDefined();
               expect(response.body.content.snapshotId).toBe(testSnapshot._id.toString());
               expect(response.body.content.imageUrl).toBe(testSnapshot.imageUrl);
               expect(response.body.content.generatedText).toBeDefined();

               // Verify content was saved with snapshotId
               const savedContent = await Content.findById(response.body.content.id);
               expect(savedContent).toBeDefined();
               expect(savedContent!.snapshotId?.toString()).toBe(testSnapshot._id.toString());
          });

          it('should generate content without snapshot (backward compatibility)', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                    })
                    .expect(200);

               expect(response.body.message).toBe('Content generated successfully');
               expect(response.body.content).toBeDefined();
               expect(response.body.content.snapshotId).toBeUndefined();
               expect(response.body.content.imageUrl).toBeUndefined();
               expect(response.body.content.generatedText).toBeDefined();

               // Verify content was saved without snapshotId
               const savedContent = await Content.findById(response.body.content.id);
               expect(savedContent).toBeDefined();
               expect(savedContent!.snapshotId).toBeUndefined();
          });

          it('should reject invalid snapshotId format', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: 'invalid-snapshot-id',
                    })
                    .expect(400);

               expect(response.body.error).toBe('Invalid request');
               expect(response.body.message).toBe('Invalid snapshotId format');
          });

          it('should reject snapshot that does not belong to user', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: otherUserSnapshot._id.toString(),
                    })
                    .expect(403);

               expect(response.body.error).toBe('You do not have permission to use this snapshot');
          });

          it('should handle missing snapshot gracefully', async () => {
               const fakeSnapshotId = new mongoose.Types.ObjectId();

               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: fakeSnapshotId.toString(),
                    })
                    .expect(200);

               // Should succeed but without snapshot data
               expect(response.body.message).toBe('Content generated successfully');
               expect(response.body.content).toBeDefined();
               expect(response.body.content.snapshotId).toBeUndefined();
               expect(response.body.content.imageUrl).toBeUndefined();
          });

          it('should generate mini_thread with snapshot attachment', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'mini_thread',
                         snapshotId: testSnapshot._id.toString(),
                    })
                    .expect(200);

               expect(response.body.message).toBe('Content generated successfully');
               expect(response.body.content).toBeDefined();
               expect(response.body.content.contentFormat).toBe('mini_thread');
               expect(response.body.content.snapshotId).toBe(testSnapshot._id.toString());
               expect(response.body.content.imageUrl).toBe(testSnapshot.imageUrl);
               expect(response.body.content.tweets).toBeDefined();
               expect(response.body.content.tweets.length).toBeGreaterThanOrEqual(3);
          });

          it('should generate full_thread with snapshot attachment', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'full_thread',
                         snapshotId: testSnapshot._id.toString(),
                    })
                    .expect(200);

               expect(response.body.message).toBe('Content generated successfully');
               expect(response.body.content).toBeDefined();
               expect(response.body.content.contentFormat).toBe('full_thread');
               expect(response.body.content.snapshotId).toBe(testSnapshot._id.toString());
               expect(response.body.content.imageUrl).toBe(testSnapshot.imageUrl);
               expect(response.body.content.tweets).toBeDefined();
               expect(response.body.content.tweets.length).toBeGreaterThanOrEqual(5);
          });
     });

     describe('POST /api/content/:id/save-edits - Snapshot Preservation', () => {
          let contentWithSnapshot: any;

          beforeEach(async () => {
               // Generate content with snapshot
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: testSnapshot._id.toString(),
                    });

               contentWithSnapshot = response.body.content;
          });

          it('should preserve snapshotId when saving edits', async () => {
               const editedText = 'This is my edited content with a snapshot attached.';

               const response = await request(app)
                    .post(`/api/content/${contentWithSnapshot.id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedText })
                    .expect(200);

               expect(response.body.message).toBe('Edits saved successfully');
               expect(response.body.content.snapshotId).toBe(testSnapshot._id.toString());

               // Verify in database
               const savedContent = await Content.findById(contentWithSnapshot.id);
               expect(savedContent).toBeDefined();
               expect(savedContent!.snapshotId?.toString()).toBe(testSnapshot._id.toString());
               expect(savedContent!.editedText).toBe(editedText);
          });

          it('should preserve snapshotId when editing thread tweets', async () => {
               // Generate thread with snapshot
               const threadResponse = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         format: 'mini_thread',
                         snapshotId: testSnapshot._id.toString(),
                    });

               const threadContent = threadResponse.body.content;

               const editedTweets = [
                    { position: 1, text: 'Edited tweet 1 with snapshot' },
                    { position: 2, text: 'Edited tweet 2 with snapshot' },
                    { position: 3, text: 'Edited tweet 3 with snapshot' },
               ];

               const response = await request(app)
                    .post(`/api/content/${threadContent.id}/save-edits`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ editedTweets })
                    .expect(200);

               expect(response.body.message).toBe('Thread edits saved successfully');
               expect(response.body.content.snapshotId).toBe(testSnapshot._id.toString());

               // Verify in database
               const savedContent = await Content.findById(threadContent.id);
               expect(savedContent).toBeDefined();
               expect(savedContent!.snapshotId?.toString()).toBe(testSnapshot._id.toString());
          });
     });

     describe('Snapshot Validation Edge Cases', () => {
          it('should handle null snapshotId gracefully', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: null,
                    })
                    .expect(200);

               expect(response.body.content.snapshotId).toBeUndefined();
          });

          it('should handle empty string snapshotId', async () => {
               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: '',
                    })
                    .expect(400);

               expect(response.body.error).toBe('Invalid request');
               expect(response.body.message).toBe('Invalid snapshotId format');
          });

          it('should handle stale snapshot attachment', async () => {
               // Mark snapshot as stale
               testSnapshot.isStale = true;
               await testSnapshot.save();

               const response = await request(app)
                    .post('/api/content/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({
                         analysisId: testAnalysis._id.toString(),
                         platform: 'x',
                         snapshotId: testSnapshot._id.toString(),
                    })
                    .expect(200);

               // Should still attach stale snapshot (user's choice)
               expect(response.body.content.snapshotId).toBe(testSnapshot._id.toString());
               expect(response.body.content.imageUrl).toBe(testSnapshot.imageUrl);
          });
     });
});
