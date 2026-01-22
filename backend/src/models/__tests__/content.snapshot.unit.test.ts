/**
 * Unit tests for Content model snapshotId field
 * Tests the optional snapshotId reference to CodeSnapshot
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Content, IContent } from '../Content';
import { User } from '../User';
import { Analysis } from '../Analysis';
import { Repository } from '../Repository';
import { CodeSnapshot } from '../CodeSnapshot';

describe('Content Model - Snapshot Attachment', () => {
     let mongoServer: MongoMemoryServer;
     let testUser: any;
     let testRepository: any;
     let testAnalysis: any;

     beforeAll(async () => {
          mongoServer = await MongoMemoryServer.create();
          const mongoUri = mongoServer.getUri();
          await mongoose.connect(mongoUri);
     });

     afterAll(async () => {
          await mongoose.disconnect();
          await mongoServer.stop();
     });

     beforeEach(async () => {
          // Create test user
          testUser = await User.create({
               githubId: 'test-user-123',
               username: 'testuser',
               email: 'test@example.com',
               accessToken: 'test-token',
          });

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubId: 12345,
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'Test repository',
               url: 'https://github.com/testuser/test-repo',
               language: 'TypeScript',
               isPrivate: false,
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               summary: 'Test analysis',
               keyFeatures: ['Feature 1', 'Feature 2'],
               technicalHighlights: ['Highlight 1'],
               targetAudience: 'developers',
               suggestedAngles: ['Angle 1'],
               toneRecommendations: {
                    technical: 'High technical depth',
                    casual: 'Moderate casualness',
                    enthusiastic: 'High enthusiasm',
               },
          });
     });

     afterEach(async () => {
          const collections = mongoose.connection.collections;
          for (const key in collections) {
               await collections[key].deleteMany({});
          }
     });

     describe('Optional snapshotId field', () => {
          it('should create content without snapshotId', async () => {
               const content = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Test content without snapshot',
               });

               expect(content.snapshotId).toBeUndefined();
               expect(content.generatedText).toBe('Test content without snapshot');
          });

          it('should create content with snapshotId', async () => {
               // Create a test snapshot
               const snapshot = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/test.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 85,
                    selectionReason: 'Core algorithm implementation',
                    imageUrl: 'https://example.com/snapshot.png',
                    imageSize: 102400,
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

               const content = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Test content with snapshot',
                    snapshotId: snapshot._id,
               });

               expect(content.snapshotId).toBeDefined();
               expect(content.snapshotId?.toString()).toBe(snapshot._id.toString());
          });

          it('should populate snapshotId reference', async () => {
               // Create a test snapshot
               const snapshot = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/algorithm.ts',
                         startLine: 15,
                         endLine: 45,
                         functionName: 'processData',
                         language: 'typescript',
                         linesOfCode: 30,
                    },
                    selectionScore: 92,
                    selectionReason: 'Complex algorithm with high technical interest',
                    imageUrl: 'https://example.com/algorithm-snapshot.png',
                    imageSize: 156800,
                    imageDimensions: {
                         width: 1200,
                         height: 900,
                    },
                    renderOptions: {
                         theme: 'nord',
                         showLineNumbers: true,
                         fontSize: 14,
                    },
                    isStale: false,
                    lastCommitSha: 'def456',
               });

               const content = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Check out this algorithm!',
                    snapshotId: snapshot._id,
               });

               // Populate the reference
               const populatedContent = await Content.findById(content._id)
                    .populate('snapshotId')
                    .exec();

               expect(populatedContent).toBeDefined();
               expect(populatedContent!.snapshotId).toBeDefined();

               // TypeScript type assertion for populated document
               const populatedSnapshot = populatedContent!.snapshotId as any;
               expect(populatedSnapshot.imageUrl).toBe('https://example.com/algorithm-snapshot.png');
               expect(populatedSnapshot.selectionScore).toBe(92);
               expect(populatedSnapshot.snippetMetadata.functionName).toBe('processData');
          });

          it('should allow updating snapshotId', async () => {
               const content = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Initial content',
               });

               expect(content.snapshotId).toBeUndefined();

               // Create and attach snapshot
               const snapshot = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/feature.ts',
                         startLine: 1,
                         endLine: 20,
                         language: 'typescript',
                         linesOfCode: 20,
                    },
                    selectionScore: 78,
                    selectionReason: 'New feature implementation',
                    imageUrl: 'https://example.com/feature.png',
                    imageSize: 98304,
                    imageDimensions: {
                         width: 1200,
                         height: 700,
                    },
                    renderOptions: {
                         theme: 'nord',
                         showLineNumbers: false,
                         fontSize: 14,
                    },
                    isStale: false,
                    lastCommitSha: 'ghi789',
               });

               content.snapshotId = snapshot._id;
               await content.save();

               const updatedContent = await Content.findById(content._id);
               expect(updatedContent!.snapshotId?.toString()).toBe(snapshot._id.toString());
          });

          it('should allow removing snapshotId', async () => {
               const snapshot = await CodeSnapshot.create({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    snippetMetadata: {
                         filePath: 'src/temp.ts',
                         startLine: 1,
                         endLine: 5,
                         language: 'typescript',
                         linesOfCode: 5,
                    },
                    selectionScore: 60,
                    selectionReason: 'Temporary code',
                    imageUrl: 'https://example.com/temp.png',
                    imageSize: 51200,
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
                    lastCommitSha: 'jkl012',
               });

               const content = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Content with snapshot',
                    snapshotId: snapshot._id,
               });

               expect(content.snapshotId).toBeDefined();

               // Remove snapshot
               content.snapshotId = undefined;
               await content.save();

               const updatedContent = await Content.findById(content._id);
               expect(updatedContent!.snapshotId).toBeUndefined();
          });
     });

     describe('Backward compatibility', () => {
          it('should work with existing content documents without snapshotId', async () => {
               // Simulate existing document created before snapshotId field was added
               const content = await Content.create({
                    analysisId: testAnalysis._id,
                    userId: testUser._id,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Legacy content',
                    editedText: 'Edited legacy content',
                    version: 2,
               });

               // Verify document can be retrieved and used
               const retrievedContent = await Content.findById(content._id);
               expect(retrievedContent).toBeDefined();
               expect(retrievedContent!.generatedText).toBe('Legacy content');
               expect(retrievedContent!.snapshotId).toBeUndefined();

               // Verify document can be updated without touching snapshotId
               retrievedContent!.editedText = 'Updated edited text';
               await retrievedContent!.save();

               const updatedContent = await Content.findById(content._id);
               expect(updatedContent!.editedText).toBe('Updated edited text');
               expect(updatedContent!.snapshotId).toBeUndefined();
          });
     });
});
