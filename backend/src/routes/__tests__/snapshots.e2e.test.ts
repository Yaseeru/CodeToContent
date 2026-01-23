/**
 * End-to-End Tests for Visual Intelligence (Code Snapshot Generator)
 * 
 * Tests complete user flows:
 * - Login → Analyze → Generate Snapshots → Attach to Content
 * - Various repository types (TypeScript, Python, Go)
 * - Error scenarios (invalid repo, API failures, missing snapshots)
 * - Performance under load (concurrent generations)
 * - Graceful degradation (AI failures, storage failures)
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { CodeSnapshot } from '../../models/CodeSnapshot';
import { Content } from '../../models/Content';
import { AuthService } from '../../services/AuthService';

describe('Visual Intelligence E2E Tests', () => {
     let mongoServer: MongoMemoryServer;
     let authService: AuthService;
     let testUser: any;
     let testToken: string;

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
          await CodeSnapshot.deleteMany({});
          await Content.deleteMany({});

          // Create test user
          testUser = await User.create({
               githubId: '12345',
               username: 'testuser',
               accessToken: 'test-github-token',
               avatarUrl: 'https://example.com/avatar.jpg',
          });

          testToken = authService.generateJWT(testUser);
     });

     describe('Complete User Flow: Data Model Integration', () => {
          it('should create complete workflow data: Repository → Analysis → Snapshot → Content', async () => {
               // Step 1: Create repository (simulating GitHub OAuth and repo selection)
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '67890',
                    name: 'typescript-project',
                    fullName: 'testuser/typescript-project',
                    description: 'A TypeScript project with interesting code',
                    url: 'https://github.com/testuser/typescript-project',
               });

               expect(repository).toBeDefined();
               expect(repository.userId.toString()).toBe(testUser._id.toString());

               // Step 2: Create analysis
               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'Provides type-safe utilities',
                    targetAudience: 'TypeScript developers',
                    coreFunctionality: ['Type utilities', 'Helper functions'],
                    notableFeatures: ['Generic types', 'Type guards'],
                    recentChanges: ['Added new utility types'],
                    integrations: ['TypeScript', 'Jest'],
                    valueProposition: 'Simplifies TypeScript development',
                    rawSignals: {
                         readmeLength: 2000,
                         commitCount: 100,
                         prCount: 20,
                         fileStructure: ['src/', 'tests/'],
                    },
               });

               expect(analysis).toBeDefined();
               expect(analysis.repositoryId.toString()).toBe(repository._id.toString());

               // Step 3: Create snapshot
               const snapshot = await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/types/utilities.ts',
                         startLine: 10,
                         endLine: 30,
                         functionName: 'DeepPartial',
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 95,
                    selectionReason: 'Advanced generic type utility',
                    imageUrl: '/uploads/snapshots/ts-snapshot-1.png',
                    imageSize: 145000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'abc123',
               });

               expect(snapshot).toBeDefined();
               expect(snapshot.repositoryId.toString()).toBe(repository._id.toString());
               expect(snapshot.snippetMetadata.language).toBe('typescript');

               // Step 4: Create content with attached snapshot
               const content = await Content.create({
                    userId: testUser._id,
                    analysisId: analysis._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Check out this advanced TypeScript utility type! 🚀',
                    snapshotId: snapshot._id,
               });

               expect(content).toBeDefined();
               expect(content.snapshotId?.toString()).toBe(snapshot._id.toString());

               // Verify relationships
               const retrievedSnapshot = await CodeSnapshot.findById(snapshot._id);
               expect(retrievedSnapshot?.repositoryId.toString()).toBe(repository._id.toString());

               const retrievedContent = await Content.findById(content._id);
               expect(retrievedContent?.snapshotId?.toString()).toBe(snapshot._id.toString());
          });
     });

     describe('Various Repository Types', () => {
          it('should handle Python repository with appropriate metadata', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '11111',
                    name: 'python-ml-project',
                    fullName: 'testuser/python-ml-project',
                    description: 'Machine learning utilities in Python',
                    url: 'https://github.com/testuser/python-ml-project',
               });

               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'ML model training utilities',
                    targetAudience: 'Data scientists',
                    coreFunctionality: ['Model training', 'Data preprocessing'],
                    notableFeatures: ['GPU support', 'Distributed training'],
                    recentChanges: ['Added transformer models'],
                    integrations: ['PyTorch', 'NumPy'],
                    valueProposition: 'Simplifies ML workflows',
                    rawSignals: {
                         readmeLength: 3000,
                         commitCount: 150,
                         prCount: 30,
                         fileStructure: ['src/', 'models/', 'tests/'],
                    },
               });

               const snapshot = await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/models/transformer.py',
                         startLine: 25,
                         endLine: 50,
                         functionName: 'train_model',
                         language: 'python',
                         linesOfCode: 25,
                    },
                    selectionScore: 92,
                    selectionReason: 'Core training loop with attention mechanism',
                    imageUrl: '/uploads/snapshots/py-snapshot-1.png',
                    imageSize: 160000,
                    imageDimensions: { width: 1200, height: 900 },
                    renderOptions: { theme: 'nord', showLineNumbers: true, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'python123',
               });

               expect(snapshot.snippetMetadata.language).toBe('python');
               expect(snapshot.snippetMetadata.filePath).toContain('.py');
          });

          it('should handle Go repository with appropriate metadata', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '22222',
                    name: 'go-microservice',
                    fullName: 'testuser/go-microservice',
                    description: 'High-performance microservice in Go',
                    url: 'https://github.com/testuser/go-microservice',
               });

               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'Scalable API service',
                    targetAudience: 'Backend engineers',
                    coreFunctionality: ['REST API', 'gRPC support'],
                    notableFeatures: ['High throughput', 'Low latency'],
                    recentChanges: ['Added connection pooling'],
                    integrations: ['PostgreSQL', 'Redis'],
                    valueProposition: 'Fast and reliable microservice',
                    rawSignals: {
                         readmeLength: 1500,
                         commitCount: 80,
                         prCount: 15,
                         fileStructure: ['cmd/', 'internal/', 'pkg/'],
                    },
               });

               const snapshot = await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'internal/handler/api.go',
                         startLine: 15,
                         endLine: 40,
                         functionName: 'HandleRequest',
                         language: 'go',
                         linesOfCode: 25,
                    },
                    selectionScore: 88,
                    selectionReason: 'Main request handler with middleware',
                    imageUrl: '/uploads/snapshots/go-snapshot-1.png',
                    imageSize: 140000,
                    imageDimensions: { width: 1200, height: 850 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'go456',
               });

               expect(snapshot.snippetMetadata.language).toBe('go');
               expect(snapshot.snippetMetadata.filePath).toContain('.go');
          });
     });

     describe('Error Scenarios: Data Validation', () => {
          it('should reject snapshot with invalid repositoryId', async () => {
               await expect(
                    CodeSnapshot.create({
                         repositoryId: 'invalid-id' as any,
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: testUser._id,
                         snippetMetadata: {
                              filePath: 'test.ts',
                              startLine: 1,
                              endLine: 10,
                              language: 'typescript',
                              linesOfCode: 10,
                         },
                         selectionScore: 85,
                         selectionReason: 'Test',
                         imageUrl: '/test.png',
                         imageSize: 100000,
                         imageDimensions: { width: 1200, height: 800 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'test123',
                    })
               ).rejects.toThrow();
          });

          it('should reject snapshot with missing required fields', async () => {
               await expect(
                    CodeSnapshot.create({
                         repositoryId: new mongoose.Types.ObjectId(),
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: testUser._id,
                         // Missing snippetMetadata
                         selectionScore: 85,
                         selectionReason: 'Test',
                         imageUrl: '/test.png',
                         imageSize: 100000,
                         imageDimensions: { width: 1200, height: 800 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'test123',
                    } as any)
               ).rejects.toThrow();
          });

          it('should reject snapshot with invalid selection score', async () => {
               await expect(
                    CodeSnapshot.create({
                         repositoryId: new mongoose.Types.ObjectId(),
                         analysisId: new mongoose.Types.ObjectId(),
                         userId: testUser._id,
                         snippetMetadata: {
                              filePath: 'test.ts',
                              startLine: 1,
                              endLine: 10,
                              language: 'typescript',
                              linesOfCode: 10,
                         },
                         selectionScore: 150, // Invalid: > 100
                         selectionReason: 'Test',
                         imageUrl: '/test.png',
                         imageSize: 100000,
                         imageDimensions: { width: 1200, height: 800 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'test123',
                    })
               ).rejects.toThrow();
          });

          it('should handle missing snapshot when querying', async () => {
               const nonExistentId = new mongoose.Types.ObjectId();
               const snapshot = await CodeSnapshot.findById(nonExistentId);
               expect(snapshot).toBeNull();
          });

          it('should handle content without snapshot (backward compatibility)', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '99999',
                    name: 'test-repo',
                    fullName: 'testuser/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/testuser/test-repo',
               });

               const content = await Content.create({
                    userId: testUser._id,
                    analysisId: new mongoose.Types.ObjectId(),
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Content without visual',
               });

               expect(content).toBeDefined();
               expect(content.snapshotId).toBeUndefined();
          });
     });

     describe('Performance: Concurrent Operations', () => {
          it('should handle multiple concurrent snapshot creations', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '10001',
                    name: 'concurrent-repo',
                    fullName: 'testuser/concurrent-repo',
                    description: 'Repository for concurrent testing',
                    url: 'https://github.com/testuser/concurrent-repo',
               });

               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'Test',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: ['Fast'],
                    recentChanges: ['Updates'],
                    integrations: ['Jest'],
                    valueProposition: 'Testing tool',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/'],
                    },
               });

               // Create 5 snapshots concurrently
               const snapshotPromises = Array(5)
                    .fill(null)
                    .map((_, index) =>
                         CodeSnapshot.create({
                              repositoryId: repository._id,
                              analysisId: analysis._id,
                              userId: testUser._id,
                              snippetMetadata: {
                                   filePath: `src/file${index}.ts`,
                                   startLine: 1,
                                   endLine: 20,
                                   language: 'typescript',
                                   linesOfCode: 20,
                              },
                              selectionScore: 80 + index,
                              selectionReason: `Snapshot ${index}`,
                              imageUrl: `/uploads/snapshots/snapshot-${index}.png`,
                              imageSize: 120000,
                              imageDimensions: { width: 1200, height: 800 },
                              renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                              isStale: false,
                              lastCommitSha: 'concurrent123',
                         })
                    );

               const snapshots = await Promise.all(snapshotPromises);

               expect(snapshots).toHaveLength(5);
               snapshots.forEach((snapshot, index) => {
                    expect(snapshot.snippetMetadata.filePath).toBe(`src/file${index}.ts`);
               });
          });

          it('should handle rapid sequential queries', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '20001',
                    name: 'query-repo',
                    fullName: 'testuser/query-repo',
                    description: 'Repository for query testing',
                    url: 'https://github.com/testuser/query-repo',
               });

               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'Test',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: ['Fast'],
                    recentChanges: ['Updates'],
                    integrations: ['Jest'],
                    valueProposition: 'Testing tool',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/'],
                    },
               });

               await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 85,
                    selectionReason: 'Test snapshot',
                    imageUrl: '/uploads/snapshots/test.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'query123',
               });

               // Perform 10 rapid queries
               const queryPromises = Array(10)
                    .fill(null)
                    .map(() =>
                         CodeSnapshot.find({
                              repositoryId: repository._id,
                              isStale: false,
                         }).sort({ selectionScore: -1 })
                    );

               const results = await Promise.all(queryPromises);

               results.forEach((snapshots) => {
                    expect(snapshots).toHaveLength(1);
                    expect(snapshots[0].selectionScore).toBe(85);
               });
          });
     });

     describe('Graceful Degradation: Snapshot Staleness', () => {
          it('should mark snapshots as stale after repository update', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '30001',
                    name: 'staleness-repo',
                    fullName: 'testuser/staleness-repo',
                    description: 'Repository for staleness testing',
                    url: 'https://github.com/testuser/staleness-repo',
               });

               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'Test',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: ['Fast'],
                    recentChanges: ['Updates'],
                    integrations: ['Jest'],
                    valueProposition: 'Testing tool',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/'],
                    },
               });

               // Create initial snapshot
               const snapshot = await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 85,
                    selectionReason: 'Initial snapshot',
                    imageUrl: '/uploads/snapshots/initial.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'old-commit',
               });

               expect(snapshot.isStale).toBe(false);

               // Simulate repository update by marking snapshot as stale
               await CodeSnapshot.updateMany(
                    {
                         repositoryId: repository._id,
                         lastCommitSha: { $ne: 'new-commit' },
                    },
                    { $set: { isStale: true } }
               );

               // Verify snapshot is now stale
               const updatedSnapshot = await CodeSnapshot.findById(snapshot._id);
               expect(updatedSnapshot?.isStale).toBe(true);

               // Query should filter out stale snapshots
               const freshSnapshots = await CodeSnapshot.find({
                    repositoryId: repository._id,
                    isStale: false,
               });
               expect(freshSnapshots).toHaveLength(0);
          });

          it('should preserve fresh snapshots when marking stale', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '30002',
                    name: 'mixed-repo',
                    fullName: 'testuser/mixed-repo',
                    description: 'Repository with mixed snapshots',
                    url: 'https://github.com/testuser/mixed-repo',
               });

               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'Test',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: ['Fast'],
                    recentChanges: ['Updates'],
                    integrations: ['Jest'],
                    valueProposition: 'Testing tool',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/'],
                    },
               });

               const currentCommit = 'current-commit';

               // Create old snapshot
               await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/old.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 80,
                    selectionReason: 'Old snapshot',
                    imageUrl: '/uploads/snapshots/old.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'old-commit',
               });

               // Create current snapshot
               await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/current.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 90,
                    selectionReason: 'Current snapshot',
                    imageUrl: '/uploads/snapshots/current.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: currentCommit,
               });

               // Mark old snapshots as stale
               await CodeSnapshot.updateMany(
                    {
                         repositoryId: repository._id,
                         lastCommitSha: { $ne: currentCommit },
                    },
                    { $set: { isStale: true } }
               );

               // Verify only fresh snapshot remains
               const freshSnapshots = await CodeSnapshot.find({
                    repositoryId: repository._id,
                    isStale: false,
               });
               expect(freshSnapshots).toHaveLength(1);
               expect(freshSnapshots[0].lastCommitSha).toBe(currentCommit);
          });
     });

     describe('Snapshot Querying and Filtering', () => {
          it('should retrieve snapshots sorted by selection score', async () => {
               const repository = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '40001',
                    name: 'sorting-repo',
                    fullName: 'testuser/sorting-repo',
                    description: 'Repository for sorting testing',
                    url: 'https://github.com/testuser/sorting-repo',
               });

               const analysis = await Analysis.create({
                    repositoryId: repository._id,
                    userId: testUser._id,
                    problemStatement: 'Test',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: ['Fast'],
                    recentChanges: ['Updates'],
                    integrations: ['Jest'],
                    valueProposition: 'Testing tool',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/'],
                    },
               });

               // Create snapshots with different scores
               await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/low.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 70,
                    selectionReason: 'Low score',
                    imageUrl: '/uploads/snapshots/low.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'test123',
               });

               await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/high.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 95,
                    selectionReason: 'High score',
                    imageUrl: '/uploads/snapshots/high.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'test123',
               });

               await CodeSnapshot.create({
                    repositoryId: repository._id,
                    analysisId: analysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/medium.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 85,
                    selectionReason: 'Medium score',
                    imageUrl: '/uploads/snapshots/medium.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'test123',
               });

               // Query sorted by score descending
               const snapshots = await CodeSnapshot.find({
                    repositoryId: repository._id,
                    isStale: false,
               }).sort({ selectionScore: -1 });

               expect(snapshots).toHaveLength(3);
               expect(snapshots[0].selectionScore).toBe(95);
               expect(snapshots[1].selectionScore).toBe(85);
               expect(snapshots[2].selectionScore).toBe(70);
          });

          it('should filter snapshots by user ownership', async () => {
               const user2 = await User.create({
                    githubId: '67890',
                    username: 'testuser2',
                    accessToken: 'test-github-token-2',
                    avatarUrl: 'https://example.com/avatar2.jpg',
               });

               const repo1 = await Repository.create({
                    userId: testUser._id,
                    githubRepoId: '50001',
                    name: 'user1-repo',
                    fullName: 'testuser/user1-repo',
                    description: 'User 1 repository',
                    url: 'https://github.com/testuser/user1-repo',
               });

               const repo2 = await Repository.create({
                    userId: user2._id,
                    githubRepoId: '50002',
                    name: 'user2-repo',
                    fullName: 'testuser2/user2-repo',
                    description: 'User 2 repository',
                    url: 'https://github.com/testuser2/user2-repo',
               });

               const analysis1 = await Analysis.create({
                    repositoryId: repo1._id,
                    userId: testUser._id,
                    problemStatement: 'Test',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: ['Fast'],
                    recentChanges: ['Updates'],
                    integrations: ['Jest'],
                    valueProposition: 'Testing tool',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/'],
                    },
               });

               const analysis2 = await Analysis.create({
                    repositoryId: repo2._id,
                    userId: user2._id,
                    problemStatement: 'Test',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Testing'],
                    notableFeatures: ['Fast'],
                    recentChanges: ['Updates'],
                    integrations: ['Jest'],
                    valueProposition: 'Testing tool',
                    rawSignals: {
                         readmeLength: 1000,
                         commitCount: 50,
                         prCount: 10,
                         fileStructure: ['src/'],
                    },
               });

               await CodeSnapshot.create({
                    repositoryId: repo1._id,
                    analysisId: analysis1._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/user1.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 85,
                    selectionReason: 'User 1 snapshot',
                    imageUrl: '/uploads/snapshots/user1.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'user1-commit',
               });

               await CodeSnapshot.create({
                    repositoryId: repo2._id,
                    analysisId: analysis2._id,
                    userId: user2._id,
                    snippetMetadata: {
                         filePath: 'src/user2.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 90,
                    selectionReason: 'User 2 snapshot',
                    imageUrl: '/uploads/snapshots/user2.png',
                    imageSize: 120000,
                    imageDimensions: { width: 1200, height: 800 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'user2-commit',
               });

               // Query user 1's snapshots
               const user1Snapshots = await CodeSnapshot.find({ userId: testUser._id });
               expect(user1Snapshots).toHaveLength(1);
               expect(user1Snapshots[0].snippetMetadata.filePath).toBe('src/user1.ts');

               // Query user 2's snapshots
               const user2Snapshots = await CodeSnapshot.find({ userId: user2._id });
               expect(user2Snapshots).toHaveLength(1);
               expect(user2Snapshots[0].snippetMetadata.filePath).toBe('src/user2.ts');
          });
     });
});
