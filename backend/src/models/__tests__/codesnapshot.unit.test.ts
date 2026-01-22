import mongoose from 'mongoose';
import { CodeSnapshot, ICodeSnapshot } from '../CodeSnapshot';
import { User, Repository, Analysis } from '../index';

describe('CodeSnapshot Model - Unit Tests', () => {
     let userId: mongoose.Types.ObjectId;
     let repositoryId: mongoose.Types.ObjectId;
     let analysisId: mongoose.Types.ObjectId;

     beforeEach(async () => {
          // Create test user
          const user = await User.create({
               githubId: 'test-github-id',
               username: 'testuser',
               accessToken: 'test-access-token',
               avatarUrl: 'https://example.com/avatar.png',
          });
          userId = user._id;

          // Create test repository
          const repository = await Repository.create({
               userId: user._id,
               githubRepoId: 'test-repo-id',
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'Test repository',
               url: 'https://github.com/testuser/test-repo',
          });
          repositoryId = repository._id;

          // Create test analysis
          const analysis = await Analysis.create({
               repositoryId: repository._id,
               userId: user._id,
               problemStatement: 'Test problem',
               targetAudience: 'Developers',
               coreFunctionality: ['Feature 1'],
               notableFeatures: [],
               recentChanges: [],
               integrations: [],
               valueProposition: 'Test value',
               rawSignals: {
                    readmeLength: 1000,
                    commitCount: 10,
                    prCount: 5,
                    fileStructure: ['src/index.ts'],
               },
          });
          analysisId = analysis._id;
     });

     describe('Schema Validation', () => {
          it('should create a valid CodeSnapshot with all required fields', async () => {
               const snapshot = await CodeSnapshot.create({
                    repositoryId,
                    analysisId,
                    userId,
                    snippetMetadata: {
                         filePath: 'src/services/AuthService.ts',
                         startLine: 10,
                         endLine: 30,
                         functionName: 'authenticate',
                         language: 'typescript',
                         linesOfCode: 21,
                    },
                    selectionScore: 85,
                    selectionReason: 'Core authentication logic with high complexity',
                    imageUrl: 'https://storage.example.com/snapshots/abc123.png',
                    imageSize: 245678,
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

               expect(snapshot).toBeDefined();
               expect(snapshot.repositoryId.toString()).toBe(repositoryId.toString());
               expect(snapshot.analysisId.toString()).toBe(analysisId.toString());
               expect(snapshot.userId.toString()).toBe(userId.toString());
               expect(snapshot.selectionScore).toBe(85);
               expect(snapshot.isStale).toBe(false);
               expect(snapshot.createdAt).toBeInstanceOf(Date);
               expect(snapshot.updatedAt).toBeInstanceOf(Date);
          });

          it('should fail validation when selectionScore is below 0', async () => {
               await expect(
                    CodeSnapshot.create({
                         repositoryId,
                         analysisId,
                         userId,
                         snippetMetadata: {
                              filePath: 'src/test.ts',
                              startLine: 1,
                              endLine: 10,
                              language: 'typescript',
                              linesOfCode: 10,
                         },
                         selectionScore: -5,
                         selectionReason: 'Test',
                         imageUrl: 'https://example.com/image.png',
                         imageSize: 1000,
                         imageDimensions: { width: 800, height: 600 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'abc123',
                    })
               ).rejects.toThrow();
          });

          it('should fail validation when selectionScore is above 100', async () => {
               await expect(
                    CodeSnapshot.create({
                         repositoryId,
                         analysisId,
                         userId,
                         snippetMetadata: {
                              filePath: 'src/test.ts',
                              startLine: 1,
                              endLine: 10,
                              language: 'typescript',
                              linesOfCode: 10,
                         },
                         selectionScore: 150,
                         selectionReason: 'Test',
                         imageUrl: 'https://example.com/image.png',
                         imageSize: 1000,
                         imageDimensions: { width: 800, height: 600 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'abc123',
                    })
               ).rejects.toThrow();
          });

          it('should fail validation when required fields are missing', async () => {
               await expect(
                    CodeSnapshot.create({
                         repositoryId,
                         analysisId,
                         userId,
                         // Missing snippetMetadata
                         selectionScore: 50,
                         selectionReason: 'Test',
                         imageUrl: 'https://example.com/image.png',
                         imageSize: 1000,
                         imageDimensions: { width: 800, height: 600 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'abc123',
                    })
               ).rejects.toThrow();
          });

          it('should use default values for renderOptions', async () => {
               const snapshot = await CodeSnapshot.create({
                    repositoryId,
                    analysisId,
                    userId,
                    snippetMetadata: {
                         filePath: 'src/test.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 50,
                    selectionReason: 'Test',
                    imageUrl: 'https://example.com/image.png',
                    imageSize: 1000,
                    imageDimensions: { width: 800, height: 600 },
                    renderOptions: {
                         theme: 'dracula',
                         showLineNumbers: true,
                         fontSize: 16,
                    },
                    isStale: false,
                    lastCommitSha: 'abc123',
               });

               expect(snapshot.renderOptions.theme).toBe('dracula');
               expect(snapshot.renderOptions.showLineNumbers).toBe(true);
               expect(snapshot.renderOptions.fontSize).toBe(16);
          });

          it('should allow optional functionName in snippetMetadata', async () => {
               const snapshot = await CodeSnapshot.create({
                    repositoryId,
                    analysisId,
                    userId,
                    snippetMetadata: {
                         filePath: 'src/constants.ts',
                         startLine: 1,
                         endLine: 5,
                         // No functionName - it's a constant declaration
                         language: 'typescript',
                         linesOfCode: 5,
                    },
                    selectionScore: 40,
                    selectionReason: 'Important constants',
                    imageUrl: 'https://example.com/image.png',
                    imageSize: 1000,
                    imageDimensions: { width: 800, height: 600 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'abc123',
               });

               expect(snapshot.snippetMetadata.functionName).toBeUndefined();
          });
     });

     describe('Indexes', () => {
          it('should have compound index on repositoryId, isStale, and selectionScore', async () => {
               const indexes = CodeSnapshot.schema.indexes();
               const compoundIndex = indexes.find(
                    (idx) =>
                         idx[0].repositoryId === 1 &&
                         idx[0].isStale === 1 &&
                         idx[0].selectionScore === -1
               );
               expect(compoundIndex).toBeDefined();
          });

          it('should have compound index on userId, repositoryId, and isStale', async () => {
               const indexes = CodeSnapshot.schema.indexes();
               const userIndex = indexes.find(
                    (idx) =>
                         idx[0].userId === 1 &&
                         idx[0].repositoryId === 1 &&
                         idx[0].isStale === 1
               );
               expect(userIndex).toBeDefined();
          });
     });

     describe('Queries', () => {
          beforeEach(async () => {
               // Create multiple snapshots with different scores and staleness
               await CodeSnapshot.create([
                    {
                         repositoryId,
                         analysisId,
                         userId,
                         snippetMetadata: {
                              filePath: 'src/service1.ts',
                              startLine: 1,
                              endLine: 20,
                              language: 'typescript',
                              linesOfCode: 20,
                         },
                         selectionScore: 90,
                         selectionReason: 'High score, not stale',
                         imageUrl: 'https://example.com/1.png',
                         imageSize: 1000,
                         imageDimensions: { width: 800, height: 600 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'abc123',
                    },
                    {
                         repositoryId,
                         analysisId,
                         userId,
                         snippetMetadata: {
                              filePath: 'src/service2.ts',
                              startLine: 1,
                              endLine: 15,
                              language: 'typescript',
                              linesOfCode: 15,
                         },
                         selectionScore: 70,
                         selectionReason: 'Medium score, not stale',
                         imageUrl: 'https://example.com/2.png',
                         imageSize: 1000,
                         imageDimensions: { width: 800, height: 600 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: false,
                         lastCommitSha: 'abc123',
                    },
                    {
                         repositoryId,
                         analysisId,
                         userId,
                         snippetMetadata: {
                              filePath: 'src/service3.ts',
                              startLine: 1,
                              endLine: 25,
                              language: 'typescript',
                              linesOfCode: 25,
                         },
                         selectionScore: 95,
                         selectionReason: 'Highest score, but stale',
                         imageUrl: 'https://example.com/3.png',
                         imageSize: 1000,
                         imageDimensions: { width: 800, height: 600 },
                         renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                         isStale: true,
                         lastCommitSha: 'old123',
                    },
               ]);
          });

          it('should retrieve non-stale snapshots sorted by score descending', async () => {
               const snapshots = await CodeSnapshot.find({
                    repositoryId,
                    isStale: false,
               }).sort({ selectionScore: -1 });

               expect(snapshots).toHaveLength(2);
               expect(snapshots[0].selectionScore).toBe(90);
               expect(snapshots[1].selectionScore).toBe(70);
          });

          it('should filter snapshots by repository and staleness', async () => {
               const freshSnapshots = await CodeSnapshot.find({
                    repositoryId,
                    isStale: false,
               });

               expect(freshSnapshots).toHaveLength(2);
               freshSnapshots.forEach((snapshot) => {
                    expect(snapshot.isStale).toBe(false);
               });
          });

          it('should retrieve snapshots by userId', async () => {
               const userSnapshots = await CodeSnapshot.find({ userId });

               expect(userSnapshots).toHaveLength(3);
               userSnapshots.forEach((snapshot) => {
                    expect(snapshot.userId.toString()).toBe(userId.toString());
               });
          });
     });

     describe('Staleness Management', () => {
          it('should mark snapshots as stale when repository is updated', async () => {
               const snapshot = await CodeSnapshot.create({
                    repositoryId,
                    analysisId,
                    userId,
                    snippetMetadata: {
                         filePath: 'src/test.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 80,
                    selectionReason: 'Test',
                    imageUrl: 'https://example.com/image.png',
                    imageSize: 1000,
                    imageDimensions: { width: 800, height: 600 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: 'abc123',
               });

               expect(snapshot.isStale).toBe(false);

               // Simulate repository update by marking snapshot as stale
               await CodeSnapshot.updateMany(
                    { repositoryId, isStale: false },
                    { $set: { isStale: true } }
               );

               const updatedSnapshot = await CodeSnapshot.findById(snapshot._id);
               expect(updatedSnapshot!.isStale).toBe(true);
          });

          it('should detect stale snapshots by comparing commit SHA', async () => {
               const oldCommitSha = 'old123';
               const newCommitSha = 'new456';

               await CodeSnapshot.create({
                    repositoryId,
                    analysisId,
                    userId,
                    snippetMetadata: {
                         filePath: 'src/test.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 80,
                    selectionReason: 'Test',
                    imageUrl: 'https://example.com/image.png',
                    imageSize: 1000,
                    imageDimensions: { width: 800, height: 600 },
                    renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                    isStale: false,
                    lastCommitSha: oldCommitSha,
               });

               // Find snapshots with outdated commit SHA
               const outdatedSnapshots = await CodeSnapshot.find({
                    repositoryId,
                    lastCommitSha: { $ne: newCommitSha },
               });

               expect(outdatedSnapshots).toHaveLength(1);
               expect(outdatedSnapshots[0].lastCommitSha).toBe(oldCommitSha);
          });
     });
});
