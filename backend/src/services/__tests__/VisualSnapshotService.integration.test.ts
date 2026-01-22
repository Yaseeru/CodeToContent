import { VisualSnapshotService } from '../VisualSnapshotService';
import { CacheService } from '../CacheService';
import { CodeSnapshot } from '../../models/CodeSnapshot';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Integration tests for VisualSnapshotService
 * Tests end-to-end snapshot generation with real database
 * 
 * Note: These tests use mocked GitHub and Gemini AI services
 * to avoid external API dependencies
 */
describe('VisualSnapshotService - Integration Tests', () => {
     let mongoServer: MongoMemoryServer;
     let service: VisualSnapshotService;
     let cacheService: CacheService;
     let testUser: any;
     let testRepository: any;
     let testAnalysis: any;

     beforeAll(async () => {
          // Start in-memory MongoDB
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);

          // Initialize services
          cacheService = new CacheService();
          service = new VisualSnapshotService(
               process.env.GEMINI_API_KEY || 'test-api-key',
               cacheService
          );
     });

     afterAll(async () => {
          await mongoose.disconnect();
          await mongoServer.stop();
          await cacheService.close();
     });

     beforeEach(async () => {
          // Clear all collections
          await User.deleteMany({});
          await Repository.deleteMany({});
          await Analysis.deleteMany({});
          await CodeSnapshot.deleteMany({});

          // Create test user
          testUser = await User.create({
               githubId: 'test-github-id',
               username: 'testuser',
               email: 'test@example.com',
               accessToken: 'test-access-token',
          });

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubId: 12345,
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'A test repository',
               language: 'TypeScript',
               private: false,
               htmlUrl: 'https://github.com/testuser/test-repo',
               updatedAt: new Date(),
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               summary: 'Test repository analysis',
               keyFeatures: ['Feature 1', 'Feature 2'],
               techStack: ['TypeScript', 'Node.js'],
               recentActivity: 'Recent commits',
               codeQuality: 'Good',
               dependencies: [],
               status: 'completed',
          });
     });

     describe('getSnapshotsForRepository', () => {
          it('should retrieve snapshots for a repository', async () => {
               // Create test snapshots
               const snapshot1 = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 90,
                    selectionReason: 'Core application entry point',
                    imageUrl: 'https://example.com/snapshot1.png',
                    imageSize: 50000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'abc123',
               });

               const snapshot2 = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/utils.ts',
                         startLine: 10,
                         endLine: 30,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 85,
                    selectionReason: 'Utility functions',
                    imageUrl: 'https://example.com/snapshot2.png',
                    imageSize: 45000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'abc123',
               });

               // Retrieve snapshots
               const snapshots = await service.getSnapshotsForRepository(
                    testRepository._id.toString(),
                    testUser._id.toString()
               );

               expect(snapshots).toHaveLength(2);
               expect(snapshots[0].selectionScore).toBe(90); // Sorted by score descending
               expect(snapshots[1].selectionScore).toBe(85);
          });

          it('should filter out stale snapshots', async () => {
               // Create fresh snapshot
               await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 90,
                    selectionReason: 'Fresh snapshot',
                    imageUrl: 'https://example.com/snapshot1.png',
                    imageSize: 50000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'abc123',
               });

               // Create stale snapshot
               await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/old.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 95,
                    selectionReason: 'Stale snapshot',
                    imageUrl: 'https://example.com/snapshot2.png',
                    imageSize: 50000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: true, // Marked as stale
                    lastCommitSha: 'old123',
               });

               const snapshots = await service.getSnapshotsForRepository(
                    testRepository._id.toString(),
                    testUser._id.toString()
               );

               expect(snapshots).toHaveLength(1);
               expect(snapshots[0].isStale).toBe(false);
          });

          it('should return empty array when no snapshots exist', async () => {
               const snapshots = await service.getSnapshotsForRepository(
                    testRepository._id.toString(),
                    testUser._id.toString()
               );

               expect(snapshots).toHaveLength(0);
          });
     });

     describe('invalidateStaleSnapshots', () => {
          it('should mark snapshots as stale when commit SHA changes', async () => {
               // Create snapshots with old commit SHA
               const snapshot1 = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 90,
                    selectionReason: 'Test',
                    imageUrl: 'https://example.com/snapshot1.png',
                    imageSize: 50000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'old-commit-sha',
               });

               const snapshot2 = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/utils.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 85,
                    selectionReason: 'Test',
                    imageUrl: 'https://example.com/snapshot2.png',
                    imageSize: 50000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'old-commit-sha',
               });

               // Invalidate with new commit SHA
               await service.invalidateStaleSnapshots(
                    testRepository._id.toString(),
                    'new-commit-sha'
               );

               // Verify snapshots are marked as stale
               const updatedSnapshot1 = await CodeSnapshot.findById(snapshot1._id);
               const updatedSnapshot2 = await CodeSnapshot.findById(snapshot2._id);

               expect(updatedSnapshot1?.isStale).toBe(true);
               expect(updatedSnapshot2?.isStale).toBe(true);
          });

          it('should not mark snapshots with matching commit SHA as stale', async () => {
               const currentCommitSha = 'current-commit-sha';

               // Create snapshot with current commit SHA
               const snapshot = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 90,
                    selectionReason: 'Test',
                    imageUrl: 'https://example.com/snapshot.png',
                    imageSize: 50000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: currentCommitSha,
               });

               // Invalidate with same commit SHA
               await service.invalidateStaleSnapshots(
                    testRepository._id.toString(),
                    currentCommitSha
               );

               // Verify snapshot is still fresh
               const updatedSnapshot = await CodeSnapshot.findById(snapshot._id);
               expect(updatedSnapshot?.isStale).toBe(false);
          });

          it('should handle repository with no snapshots', async () => {
               await expect(
                    service.invalidateStaleSnapshots(
                         testRepository._id.toString(),
                         'new-commit-sha'
                    )
               ).resolves.not.toThrow();
          });
     });

     describe('snapshot lifecycle', () => {
          it('should maintain snapshot integrity through create-retrieve-invalidate cycle', async () => {
               // Create snapshot
               const snapshot = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 90,
                    selectionReason: 'Core functionality',
                    imageUrl: 'https://example.com/snapshot.png',
                    imageSize: 50000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'commit-v1',
               });

               // Retrieve snapshot
               let snapshots = await service.getSnapshotsForRepository(
                    testRepository._id.toString(),
                    testUser._id.toString()
               );
               expect(snapshots).toHaveLength(1);
               expect(snapshots[0].isStale).toBe(false);

               // Invalidate snapshot
               await service.invalidateStaleSnapshots(
                    testRepository._id.toString(),
                    'commit-v2'
               );

               // Verify snapshot is now stale and not returned
               snapshots = await service.getSnapshotsForRepository(
                    testRepository._id.toString(),
                    testUser._id.toString()
               );
               expect(snapshots).toHaveLength(0);

               // Verify snapshot still exists but is marked stale
               const staleSnapshot = await CodeSnapshot.findById(snapshot._id);
               expect(staleSnapshot?.isStale).toBe(true);
          });
     });
});
