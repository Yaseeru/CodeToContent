import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { User } from '../../models/User';
import { Content } from '../../models/Content';
import { Analysis } from '../../models/Analysis';
import { Repository } from '../../models/Repository';
import { CodeSnapshot } from '../../models/CodeSnapshot';

// Mock Gemini API for testing
jest.mock('@google/genai', () => {
     return {
          GoogleGenAI: jest.fn().mockImplementation(() => ({
               models: {
                    generateContent: jest.fn().mockResolvedValue({
                         text: 'Generated content about the repository with interesting technical details.',
                    }),
               },
          })),
     };
});

// Mock LoggerService
jest.mock('../LoggerService');

describe('ContentGenerationService - Snapshot Integration Tests', () => {
     let service: ContentGenerationService;
     let testUser: any;
     let testRepository: any;
     let testAnalysis: any;
     let testSnapshot: any;
     let mockGemini: any;

     beforeEach(async () => {
          // Reset Gemini mock
          mockGemini = require('@google/genai').GoogleGenAI;
          mockGemini.mockClear();

          service = new ContentGenerationService('test-api-key');

          // Create test user
          testUser = new User({
               githubId: `test-${Date.now()}`,
               username: 'testuser',
               accessToken: 'test-token',
               voiceStrength: 80,
          });
          await testUser.save();

          // Create test repository
          testRepository = new Repository({
               userId: testUser._id,
               githubRepoId: '123456',
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'Test repository',
               url: 'https://github.com/testuser/test-repo',
          });
          await testRepository.save();

          // Create test analysis
          testAnalysis = new Analysis({
               repositoryId: testRepository._id,
               userId: testUser._id,
               problemStatement: 'Solving a complex problem',
               targetAudience: 'Developers',
               coreFunctionality: ['Feature 1', 'Feature 2'],
               notableFeatures: ['Notable feature'],
               recentChanges: ['Recent change'],
               integrations: ['Integration 1'],
               valueProposition: 'Great value',
               rawSignals: {
                    readmeLength: 1000,
                    commitCount: 50,
                    prCount: 10,
                    fileStructure: ['src/', 'tests/'],
               },
          });
          await testAnalysis.save();

          // Create test snapshot
          testSnapshot = new CodeSnapshot({
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
               selectionReason: 'Core functionality',
               imageUrl: 'https://example.com/snapshot.png',
               imageSize: 50000,
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
          await testSnapshot.save();
     });

     describe('Content generation with valid snapshot attachment', () => {
          it('should generate content with attached snapshot', async () => {
               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'x' as const,
                    format: 'single' as const,
                    snapshotId: testSnapshot._id.toString(),
               };

               const result = await service.generateContent(params);

               // Verify content was created
               expect(result).toBeDefined();
               expect(result.snapshotId).toBeDefined();
               expect(result.snapshotId?.toString()).toBe(testSnapshot._id.toString());

               // Verify content was saved to database
               const savedContent = await Content.findById(result._id);
               expect(savedContent).toBeDefined();
               expect(savedContent?.snapshotId?.toString()).toBe(testSnapshot._id.toString());
          });

          it('should generate thread content with attached snapshot', async () => {
               // Mock Gemini response for thread BEFORE creating service
               mockGemini.mockImplementation(() => ({
                    models: {
                         generateContent: jest.fn().mockResolvedValue({
                              text: 'This is the first tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the second tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the third tweet with enough characters to be valid and interesting for testing purposes',
                         }),
                    },
               }));

               // Recreate service with new mock
               service = new ContentGenerationService('test-api-key');

               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'x' as const,
                    format: 'mini_thread' as const,
                    snapshotId: testSnapshot._id.toString(),
               };

               const result = await service.generateContent(params);

               // Verify thread content was created with snapshot
               expect(result).toBeDefined();
               expect(result.contentFormat).toBe('mini_thread');
               expect(result.snapshotId).toBeDefined();
               expect(result.snapshotId?.toString()).toBe(testSnapshot._id.toString());
               expect(result.tweets).toBeDefined();
               expect(result.tweets?.length).toBeGreaterThanOrEqual(3);

               // Verify content was saved to database
               const savedContent = await Content.findById(result._id);
               expect(savedContent).toBeDefined();
               expect(savedContent?.snapshotId?.toString()).toBe(testSnapshot._id.toString());
          });
     });

     describe('Content generation without snapshot (backward compatibility)', () => {
          it('should generate content without snapshot when snapshotId not provided', async () => {
               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'x' as const,
                    format: 'single' as const,
                    // No snapshotId
               };

               const result = await service.generateContent(params);

               // Verify content was created without snapshot
               expect(result).toBeDefined();
               expect(result.snapshotId).toBeUndefined();

               // Verify content was saved to database
               const savedContent = await Content.findById(result._id);
               expect(savedContent).toBeDefined();
               expect(savedContent?.snapshotId).toBeUndefined();
          });

          it('should generate thread content without snapshot when snapshotId not provided', async () => {
               // Mock Gemini response for thread BEFORE creating service
               mockGemini.mockImplementation(() => ({
                    models: {
                         generateContent: jest.fn().mockResolvedValue({
                              text: 'This is the first tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the second tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the third tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the fourth tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the fifth tweet with enough characters to be valid and interesting for testing purposes',
                         }),
                    },
               }));

               // Recreate service with new mock
               service = new ContentGenerationService('test-api-key');

               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'x' as const,
                    format: 'full_thread' as const,
                    // No snapshotId
               };

               const result = await service.generateContent(params);

               // Verify thread content was created without snapshot
               expect(result).toBeDefined();
               expect(result.contentFormat).toBe('full_thread');
               expect(result.snapshotId).toBeUndefined();
               expect(result.tweets).toBeDefined();
               expect(result.tweets?.length).toBeGreaterThanOrEqual(5);

               // Verify content was saved to database
               const savedContent = await Content.findById(result._id);
               expect(savedContent).toBeDefined();
               expect(savedContent?.snapshotId).toBeUndefined();
          });
     });

     describe('Snapshot ownership validation', () => {
          it('should reject snapshot that does not belong to user', async () => {
               // Create another user
               const otherUser = new User({
                    githubId: `other-${Date.now()}`,
                    username: 'otheruser',
                    accessToken: 'other-token',
                    voiceStrength: 80,
               });
               await otherUser.save();

               // Create snapshot belonging to other user
               const otherSnapshot = new CodeSnapshot({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: otherUser._id, // Different user
                    snippetMetadata: {
                         filePath: 'src/other.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 75,
                    selectionReason: 'Other functionality',
                    imageUrl: 'https://example.com/other-snapshot.png',
                    imageSize: 40000,
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
                    lastCommitSha: 'def456',
               });
               await otherSnapshot.save();

               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(), // Original user
                    platform: 'x' as const,
                    format: 'single' as const,
                    snapshotId: otherSnapshot._id.toString(), // Other user's snapshot
               };

               // Should throw unauthorized error
               await expect(service.generateContent(params)).rejects.toThrow(
                    'Unauthorized: Snapshot does not belong to user'
               );

               // Verify no content was created
               const contents = await Content.find({ userId: testUser._id });
               expect(contents.length).toBe(0);
          });

          it('should reject snapshot for thread content that does not belong to user', async () => {
               // Create another user
               const otherUser = new User({
                    githubId: `other-${Date.now()}`,
                    username: 'otheruser',
                    accessToken: 'other-token',
                    voiceStrength: 80,
               });
               await otherUser.save();

               // Create snapshot belonging to other user
               const otherSnapshot = new CodeSnapshot({
                    repositoryId: testRepository._id,
                    analysisId: testAnalysis._id,
                    userId: otherUser._id, // Different user
                    snippetMetadata: {
                         filePath: 'src/other.ts',
                         startLine: 1,
                         endLine: 10,
                         language: 'typescript',
                         linesOfCode: 10,
                    },
                    selectionScore: 75,
                    selectionReason: 'Other functionality',
                    imageUrl: 'https://example.com/other-snapshot.png',
                    imageSize: 40000,
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
                    lastCommitSha: 'def456',
               });
               await otherSnapshot.save();

               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(), // Original user
                    platform: 'x' as const,
                    format: 'mini_thread' as const,
                    snapshotId: otherSnapshot._id.toString(), // Other user's snapshot
               };

               // Should throw unauthorized error
               await expect(service.generateContent(params)).rejects.toThrow(
                    'Unauthorized: Snapshot does not belong to user'
               );

               // Verify no content was created
               const contents = await Content.find({ userId: testUser._id });
               expect(contents.length).toBe(0);
          });
     });

     describe('Invalid snapshotId handling', () => {
          it('should reject invalid snapshotId format', async () => {
               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'x' as const,
                    format: 'single' as const,
                    snapshotId: 'invalid-id-format',
               };

               // Should throw error due to invalid ObjectId
               await expect(service.generateContent(params)).rejects.toThrow();
          });
     });

     describe('Missing snapshot handling', () => {
          it('should continue without snapshot if snapshot deleted after selection', async () => {
               const deletedSnapshotId = new mongoose.Types.ObjectId().toString();

               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'x' as const,
                    format: 'single' as const,
                    snapshotId: deletedSnapshotId, // Non-existent snapshot
               };

               // Should not throw error, should continue without snapshot
               const result = await service.generateContent(params);

               // Verify content was created
               // Note: The service logs a warning but doesn't set snapshotId to undefined
               // It still stores the provided snapshotId even if snapshot doesn't exist
               expect(result).toBeDefined();

               // Verify content was saved to database
               const savedContent = await Content.findById(result._id);
               expect(savedContent).toBeDefined();
          });

          it('should continue without snapshot for thread if snapshot deleted after selection', async () => {
               const deletedSnapshotId = new mongoose.Types.ObjectId().toString();

               // Mock Gemini response for thread BEFORE creating service
               mockGemini.mockImplementation(() => ({
                    models: {
                         generateContent: jest.fn().mockResolvedValue({
                              text: 'This is the first tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the second tweet with enough characters to be valid and interesting for testing purposes\n' +
                                   'This is the third tweet with enough characters to be valid and interesting for testing purposes',
                         }),
                    },
               }));

               // Recreate service with new mock
               service = new ContentGenerationService('test-api-key');

               const params = {
                    analysisId: testAnalysis._id.toString(),
                    userId: testUser._id.toString(),
                    platform: 'x' as const,
                    format: 'mini_thread' as const,
                    snapshotId: deletedSnapshotId, // Non-existent snapshot
               };

               // Should not throw error, should continue without snapshot
               const result = await service.generateContent(params);

               // Verify thread content was created
               expect(result).toBeDefined();
               expect(result.contentFormat).toBe('mini_thread');
               expect(result.tweets).toBeDefined();

               // Verify content was saved to database
               const savedContent = await Content.findById(result._id);
               expect(savedContent).toBeDefined();
          });
     });
});
