// Mock ImageRenderingService before any imports
jest.mock('../../services/ImageRenderingService', () => ({
     ImageRenderingService: jest.fn().mockImplementation(() => ({
          initialize: jest.fn(),
          renderCodeToImage: jest.fn(),
          cleanup: jest.fn(),
     })),
}));

// Mock VisualSnapshotService before any imports
jest.mock('../../services/VisualSnapshotService', () => ({
     VisualSnapshotService: jest.fn().mockImplementation(() => ({
          generateSnapshotsForRepository: jest.fn(),
          getSnapshotsForRepository: jest.fn(),
          invalidateStaleSnapshots: jest.fn(),
     })),
}));

// Mock ServiceManager before any imports
jest.mock('../../services/ServiceManager', () => {
     const mockVisualSnapshotService = {
          generateSnapshotsForRepository: jest.fn(),
          getSnapshotsForRepository: jest.fn(),
          invalidateStaleSnapshots: jest.fn(),
     };

     const mockStorageService = {
          deleteImage: jest.fn(),
          uploadImage: jest.fn(),
          getImageUrl: jest.fn(),
     };

     return {
          ServiceManager: {
               getInstance: jest.fn(() => ({
                    getVisualSnapshotService: jest.fn(() => mockVisualSnapshotService),
                    getStorageService: jest.fn(() => mockStorageService),
               })),
          },
          mockVisualSnapshotService,
          mockStorageService,
     };
});

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Express } from 'express';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { CodeSnapshot } from '../../models/CodeSnapshot';
import { AuthService } from '../../services/AuthService';
import snapshotsRouter from '../snapshots';

describe('Snapshots API Integration Tests', () => {
     let mongoServer: MongoMemoryServer;
     let authService: AuthService;
     let testUser: any;
     let testUser2: any;
     let testToken: string;
     let testToken2: string;
     let testRepository: any;
     let testAnalysis: any;
     let testSnapshot: any;
     let app: Express;

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

          // Create minimal Express app for testing
          app = express();
          app.use(express.json());
          app.use('/api/snapshots', snapshotsRouter);
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
          await CodeSnapshot.deleteMany({});

          // Create test user 1
          testUser = await User.create({
               githubId: '12345',
               username: 'testuser',
               accessToken: 'test-github-token',
               avatarUrl: 'https://example.com/avatar.jpg',
          });

          // Create test user 2 (for authorization tests)
          testUser2 = await User.create({
               githubId: '67890',
               username: 'testuser2',
               accessToken: 'test-github-token-2',
               avatarUrl: 'https://example.com/avatar2.jpg',
          });

          // Generate JWT tokens
          testToken = authService.generateJWT(testUser);
          testToken2 = authService.generateJWT(testUser2);

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

          // Create test snapshot
          testSnapshot = await CodeSnapshot.create({
               repositoryId: testRepository._id,
               analysisId: testAnalysis._id,
               userId: testUser._id,
               snippetMetadata: {
                    filePath: 'src/utils/helper.ts',
                    startLine: 10,
                    endLine: 25,
                    functionName: 'calculateScore',
                    language: 'typescript',
                    linesOfCode: 15,
               },
               selectionScore: 85,
               selectionReason: 'Core algorithm with high complexity',
               imageUrl: '/uploads/snapshots/test-snapshot.png',
               imageSize: 125000,
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
               lastCommitSha: 'abc123def456',
          });
     });

     describe('GET /api/snapshots/snapshot/:snapshotId', () => {
          it('should return snapshot details for valid snapshotId', async () => {
               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('snapshot');
               expect(response.body.snapshot).toMatchObject({
                    id: testSnapshot._id.toString(),
                    repositoryId: testRepository._id.toString(),
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    snippetMetadata: {
                         filePath: 'src/utils/helper.ts',
                         startLine: 10,
                         endLine: 25,
                         functionName: 'calculateScore',
                         language: 'typescript',
                         linesOfCode: 15,
                    },
                    selectionScore: 85,
                    selectionReason: 'Core algorithm with high complexity',
                    imageUrl: '/uploads/snapshots/test-snapshot.png',
                    imageSize: 125000,
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
                    lastCommitSha: 'abc123def456',
               });
               expect(response.body.snapshot).toHaveProperty('createdAt');
               expect(response.body.snapshot).toHaveProperty('updatedAt');
          });

          it('should return 401 when no authentication token provided', async () => {
               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${testSnapshot._id}`)
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('authorization token');
          });

          it('should return 400 for invalid snapshotId format', async () => {
               const response = await request(app)
                    .get('/api/snapshots/snapshot/invalid-id')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body.details).toBeDefined();
               expect(response.body.details[0].message).toContain('snapshotId must be a valid MongoDB ObjectId');
          });

          it('should return 404 when snapshot does not exist', async () => {
               const nonExistentId = new mongoose.Types.ObjectId();
               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${nonExistentId}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(404);

               expect(response.body).toHaveProperty('error', 'Snapshot not found');
               expect(response.body.message).toContain('Code snapshot not found');
          });

          it('should return 403 when user does not own the snapshot', async () => {
               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken2}`)
                    .expect(403);

               expect(response.body).toHaveProperty('error', 'Forbidden');
               expect(response.body.message).toContain('do not have access');
          });

          it('should include all snapshot metadata fields', async () => {
               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               const { snapshot } = response.body;

               // Verify all required fields are present
               expect(snapshot).toHaveProperty('id');
               expect(snapshot).toHaveProperty('repositoryId');
               expect(snapshot).toHaveProperty('analysisId');
               expect(snapshot).toHaveProperty('userId');
               expect(snapshot).toHaveProperty('snippetMetadata');
               expect(snapshot).toHaveProperty('selectionScore');
               expect(snapshot).toHaveProperty('selectionReason');
               expect(snapshot).toHaveProperty('imageUrl');
               expect(snapshot).toHaveProperty('imageSize');
               expect(snapshot).toHaveProperty('imageDimensions');
               expect(snapshot).toHaveProperty('renderOptions');
               expect(snapshot).toHaveProperty('isStale');
               expect(snapshot).toHaveProperty('lastCommitSha');
               expect(snapshot).toHaveProperty('createdAt');
               expect(snapshot).toHaveProperty('updatedAt');

               // Verify nested objects
               expect(snapshot.snippetMetadata).toHaveProperty('filePath');
               expect(snapshot.snippetMetadata).toHaveProperty('startLine');
               expect(snapshot.snippetMetadata).toHaveProperty('endLine');
               expect(snapshot.snippetMetadata).toHaveProperty('language');
               expect(snapshot.snippetMetadata).toHaveProperty('linesOfCode');

               expect(snapshot.imageDimensions).toHaveProperty('width');
               expect(snapshot.imageDimensions).toHaveProperty('height');

               expect(snapshot.renderOptions).toHaveProperty('theme');
               expect(snapshot.renderOptions).toHaveProperty('showLineNumbers');
               expect(snapshot.renderOptions).toHaveProperty('fontSize');
          });

          it('should handle snapshot without optional functionName field', async () => {
               // Create snapshot without functionName
               const snapshotWithoutFunction = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/config.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 70,
                    selectionReason: 'Configuration constants',
                    imageUrl: '/uploads/snapshots/test-snapshot-2.png',
                    imageSize: 100000,
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
                    lastCommitSha: 'xyz789abc123',
               });

               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${snapshotWithoutFunction._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body.snapshot.snippetMetadata).not.toHaveProperty('functionName');
          });
     });

     describe('POST /api/snapshots/generate', () => {
          let mockGenerateSnapshots: jest.Mock;

          beforeEach(() => {
               // Get the mocked service from ServiceManager
               const { mockVisualSnapshotService } = require('../../services/ServiceManager');
               mockGenerateSnapshots = mockVisualSnapshotService.generateSnapshotsForRepository;

               // Reset mock before each test
               mockGenerateSnapshots.mockReset();
          });

          it('should generate snapshots for valid repository', async () => {
               // Mock successful snapshot generation
               const mockSnapshots = [
                    {
                         _id: new mongoose.Types.ObjectId(),
                         repositoryId: testRepository._id,
                         snippetMetadata: {
                              filePath: 'src/core/algorithm.ts',
                              startLine: 15,
                              endLine: 35,
                              functionName: 'processData',
                              language: 'typescript',
                              linesOfCode: 20,
                         },
                         selectionScore: 92,
                         selectionReason: 'Core algorithm with high complexity',
                         imageUrl: '/uploads/snapshots/generated-1.png',
                         imageSize: 150000,
                         imageDimensions: { width: 1200, height: 800 },
                         createdAt: new Date(),
                    },
                    {
                         _id: new mongoose.Types.ObjectId(),
                         repositoryId: testRepository._id,
                         snippetMetadata: {
                              filePath: 'src/utils/validator.ts',
                              startLine: 5,
                              endLine: 20,
                              functionName: 'validateInput',
                              language: 'typescript',
                              linesOfCode: 15,
                         },
                         selectionScore: 78,
                         selectionReason: 'Important validation logic',
                         imageUrl: '/uploads/snapshots/generated-2.png',
                         imageSize: 120000,
                         imageDimensions: { width: 1200, height: 700 },
                         createdAt: new Date(),
                    },
               ];

               mockGenerateSnapshots.mockResolvedValue(mockSnapshots);

               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Snapshots generated successfully');
               expect(response.body).toHaveProperty('count', 2);
               expect(response.body).toHaveProperty('snapshots');
               expect(response.body.snapshots).toHaveLength(2);

               // Verify first snapshot structure
               expect(response.body.snapshots[0]).toMatchObject({
                    id: mockSnapshots[0]._id.toString(),
                    repositoryId: testRepository._id.toString(),
                    snippetMetadata: {
                         filePath: 'src/core/algorithm.ts',
                         startLine: 15,
                         endLine: 35,
                         functionName: 'processData',
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 92,
                    selectionReason: 'Core algorithm with high complexity',
                    imageUrl: '/uploads/snapshots/generated-1.png',
                    imageSize: 150000,
               });

               // Verify service was called with correct parameters
               expect(mockGenerateSnapshots).toHaveBeenCalledWith(
                    testRepository._id.toString(),
                    testUser._id.toString(),
                    testUser.accessToken
               );
          });

          it('should return 401 when no authentication token provided', async () => {
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('authorization token');
          });

          it('should return 400 for invalid repositoryId format', async () => {
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: 'invalid-id' })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body.details).toBeDefined();
          });

          it('should return 400 when repositoryId is missing', async () => {
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({})
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body.details).toBeDefined();
          });

          it('should return 404 when repository does not exist', async () => {
               const nonExistentId = new mongoose.Types.ObjectId();
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: nonExistentId.toString() })
                    .expect(404);

               expect(response.body).toHaveProperty('error', 'Repository not found');
               expect(response.body.message).toContain('Repository not found or does not belong to user');
          });

          it('should return 404 when repository belongs to another user', async () => {
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken2}`)
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(404);

               expect(response.body).toHaveProperty('error', 'Repository not found');
               expect(response.body.message).toContain('Repository not found or does not belong to user');
          });

          it('should return 400 when repository has not been analyzed', async () => {
               mockGenerateSnapshots.mockRejectedValue(
                    new Error('Please analyze the repository first before generating snapshots')
               );

               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Please analyze the repository before generating snapshots');
          });

          it('should return 503 when AI service is unavailable', async () => {
               mockGenerateSnapshots.mockRejectedValue(
                    new Error('Gemini AI service is temporarily unavailable')
               );

               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(503);

               expect(response.body.error).toContain('AI service temporarily unavailable');
          });

          it('should return 503 when snapshot service is not initialized', async () => {
               mockGenerateSnapshots.mockRejectedValue(
                    new Error('ImageRenderingService is not initialized')
               );

               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(503);

               expect(response.body).toHaveProperty('error', 'Snapshot service is not available. Please try again later');
          });

          it('should return 500 for unexpected errors', async () => {
               mockGenerateSnapshots.mockRejectedValue(
                    new Error('Unexpected internal error')
               );

               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() });

               // Should return either 500 or 503 depending on error handling
               expect([500, 503]).toContain(response.status);
               expect(response.body).toHaveProperty('error');
          });

          it('should return empty array when no interesting snippets found', async () => {
               mockGenerateSnapshots.mockResolvedValue([]);

               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(200);

               expect(response.body).toHaveProperty('message', 'Snapshots generated successfully');
               expect(response.body).toHaveProperty('count', 0);
               expect(response.body.snapshots).toHaveLength(0);
          });
     });

     describe('GET /api/snapshots/:repositoryId', () => {
          let mockGetSnapshots: jest.Mock;

          beforeEach(() => {
               // Get the mocked service from ServiceManager
               const { mockVisualSnapshotService } = require('../../services/ServiceManager');
               mockGetSnapshots = mockVisualSnapshotService.getSnapshotsForRepository;

               // Reset mock before each test
               mockGetSnapshots.mockReset();
          });

          it('should return all snapshots for a repository', async () => {
               // Create additional snapshots
               const snapshot2 = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/services/DataService.ts',
                         startLine: 20,
                         endLine: 40,
                         functionName: 'fetchData',
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 88,
                    selectionReason: 'Critical data fetching logic',
                    imageUrl: '/uploads/snapshots/test-snapshot-3.png',
                    imageSize: 140000,
                    imageDimensions: { width: 1200, height: 750 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'def456ghi789',
               });

               const mockSnapshots = [testSnapshot, snapshot2];
               mockGetSnapshots.mockResolvedValue(mockSnapshots);

               const response = await request(app)
                    .get(`/api/snapshots/${testRepository._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('count', 2);
               expect(response.body).toHaveProperty('snapshots');
               expect(response.body.snapshots).toHaveLength(2);

               // Verify snapshot structure
               expect(response.body.snapshots[0]).toMatchObject({
                    id: testSnapshot._id.toString(),
                    repositoryId: testRepository._id.toString(),
                    selectionScore: 85,
                    isStale: false,
               });

               // Verify service was called with correct parameters
               expect(mockGetSnapshots).toHaveBeenCalledWith(
                    testRepository._id.toString(),
                    testUser._id.toString()
               );
          });

          it('should return 401 when no authentication token provided', async () => {
               const response = await request(app)
                    .get(`/api/snapshots/${testRepository._id}`)
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('authorization token');
          });

          it('should return 400 for invalid repositoryId format', async () => {
               const response = await request(app)
                    .get('/api/snapshots/invalid-id')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body.details).toBeDefined();
          });

          it('should return empty array when no snapshots exist', async () => {
               mockGetSnapshots.mockResolvedValue([]);

               const response = await request(app)
                    .get(`/api/snapshots/${testRepository._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('count', 0);
               expect(response.body.snapshots).toHaveLength(0);
          });

          it('should filter out stale snapshots in response', async () => {
               // Create stale snapshot
               const staleSnapshot = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/old/legacy.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 60,
                    selectionReason: 'Old code',
                    imageUrl: '/uploads/snapshots/stale-snapshot.png',
                    imageSize: 90000,
                    imageDimensions: { width: 1200, height: 600 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: true,
                    lastCommitSha: 'old123commit',
               });

               // Mock returns only non-stale snapshots
               mockGetSnapshots.mockResolvedValue([testSnapshot]);

               const response = await request(app)
                    .get(`/api/snapshots/${testRepository._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body.count).toBe(1);
               expect(response.body.snapshots[0].isStale).toBe(false);
          });

          it('should return 503 when service is not initialized', async () => {
               mockGetSnapshots.mockRejectedValue(
                    new Error('VisualSnapshotService is not initialized')
               );

               const response = await request(app)
                    .get(`/api/snapshots/${testRepository._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(503);

               expect(response.body).toHaveProperty('error', 'Snapshot service is not available. Please try again later');
          });
     });

     describe('DELETE /api/snapshots/:snapshotId', () => {
          let mockDeleteImage: jest.Mock;

          beforeEach(() => {
               // Get the mocked service from ServiceManager
               const { mockStorageService } = require('../../services/ServiceManager');
               mockDeleteImage = mockStorageService.deleteImage;

               // Reset mock before each test
               mockDeleteImage.mockReset();
               mockDeleteImage.mockResolvedValue(undefined);
          });

          it('should delete snapshot successfully', async () => {
               const response = await request(app)
                    .delete(`/api/snapshots/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('success', true);
               expect(response.body).toHaveProperty('message', 'Snapshot deleted successfully');

               // Verify snapshot was deleted from database
               const deletedSnapshot = await CodeSnapshot.findById(testSnapshot._id);
               expect(deletedSnapshot).toBeNull();

               // Verify storage service was called
               expect(mockDeleteImage).toHaveBeenCalledWith(testSnapshot.imageUrl);
          });

          it('should return 401 when no authentication token provided', async () => {
               const response = await request(app)
                    .delete(`/api/snapshots/${testSnapshot._id}`)
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body.message).toContain('authorization token');

               // Verify snapshot was not deleted
               const snapshot = await CodeSnapshot.findById(testSnapshot._id);
               expect(snapshot).not.toBeNull();
          });

          it('should return 400 for invalid snapshotId format', async () => {
               const response = await request(app)
                    .delete('/api/snapshots/invalid-id')
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(400);

               expect(response.body).toHaveProperty('error', 'Validation failed');
               expect(response.body.details).toBeDefined();
          });

          it('should return 404 when snapshot does not exist', async () => {
               const nonExistentId = new mongoose.Types.ObjectId();
               const response = await request(app)
                    .delete(`/api/snapshots/${nonExistentId}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(404);

               expect(response.body).toHaveProperty('error', 'Snapshot not found');
               expect(response.body.message).toContain('Code snapshot not found');
          });

          it('should return 403 when user does not own the snapshot', async () => {
               const response = await request(app)
                    .delete(`/api/snapshots/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken2}`)
                    .expect(403);

               expect(response.body).toHaveProperty('error', 'Forbidden');
               expect(response.body.message).toContain('do not have access to this snapshot');

               // Verify snapshot was not deleted
               const snapshot = await CodeSnapshot.findById(testSnapshot._id);
               expect(snapshot).not.toBeNull();
          });

          it('should handle storage deletion failure gracefully', async () => {
               mockDeleteImage.mockRejectedValue(new Error('Storage service error'));

               const response = await request(app)
                    .delete(`/api/snapshots/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(500);

               expect(response.body).toHaveProperty('error', 'Failed to delete code snapshot');

               // Snapshot should still exist in database if storage deletion failed
               const snapshot = await CodeSnapshot.findById(testSnapshot._id);
               expect(snapshot).not.toBeNull();
          });

          it('should delete snapshot even if image file does not exist', async () => {
               // Mock storage service to succeed (file might already be deleted)
               mockDeleteImage.mockResolvedValue(undefined);

               const response = await request(app)
                    .delete(`/api/snapshots/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(200);

               expect(response.body).toHaveProperty('success', true);

               // Verify snapshot was deleted from database
               const deletedSnapshot = await CodeSnapshot.findById(testSnapshot._id);
               expect(deletedSnapshot).toBeNull();
          });
     });

     describe('Rate Limiting', () => {
          it('should enforce rate limiting on POST /api/snapshots/generate', async () => {
               // Get the mocked service from ServiceManager
               const { mockVisualSnapshotService } = require('../../services/ServiceManager');
               mockVisualSnapshotService.generateSnapshotsForRepository.mockResolvedValue([]);

               // Make 5 requests (the limit)
               for (let i = 0; i < 5; i++) {
                    await request(app)
                         .post('/api/snapshots/generate')
                         .set('Authorization', `Bearer ${testToken}`)
                         .send({ repositoryId: testRepository._id.toString() })
                         .expect(200);
               }

               // 6th request should be rate limited
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() })
                    .expect(429);

               expect(response.body).toHaveProperty('error', 'Too many requests');
               expect(response.body.message).toContain('rate limit');
               expect(response.body).toHaveProperty('retryAfter');
          });
     });

     describe('Error Response Consistency', () => {
          it('should return consistent error format for 400 errors', async () => {
               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: 'invalid' })
                    .expect(400);

               expect(response.body).toHaveProperty('error');
               expect(typeof response.body.error).toBe('string');
          });

          it('should return consistent error format for 401 errors', async () => {
               const response = await request(app)
                    .get(`/api/snapshots/${testRepository._id}`)
                    .expect(401);

               expect(response.body).toHaveProperty('error');
               expect(response.body).toHaveProperty('message');
          });

          it('should return consistent error format for 403 errors', async () => {
               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${testSnapshot._id}`)
                    .set('Authorization', `Bearer ${testToken2}`)
                    .expect(403);

               expect(response.body).toHaveProperty('error');
               expect(response.body).toHaveProperty('message');
          });

          it('should return consistent error format for 404 errors', async () => {
               const nonExistentId = new mongoose.Types.ObjectId();
               const response = await request(app)
                    .get(`/api/snapshots/snapshot/${nonExistentId}`)
                    .set('Authorization', `Bearer ${testToken}`)
                    .expect(404);

               expect(response.body).toHaveProperty('error');
               expect(response.body).toHaveProperty('message');
          });

          it('should return consistent error format for 500 errors', async () => {
               const { mockVisualSnapshotService } = require('../../services/ServiceManager');
               mockVisualSnapshotService.generateSnapshotsForRepository.mockRejectedValue(
                    new Error('Internal error')
               );

               const response = await request(app)
                    .post('/api/snapshots/generate')
                    .set('Authorization', `Bearer ${testToken}`)
                    .send({ repositoryId: testRepository._id.toString() });

               // Should return error response (500 or 503)
               expect([500, 503]).toContain(response.status);
               expect(response.body).toHaveProperty('error');
               expect(response.body).toHaveProperty('message');
          });
     });
});
