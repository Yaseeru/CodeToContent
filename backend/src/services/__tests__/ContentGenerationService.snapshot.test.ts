import { ContentGenerationService } from '../ContentGenerationService';
import { Content } from '../../models/Content';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import { CodeSnapshot } from '../../models/CodeSnapshot';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../models/Content');
jest.mock('../../models/Analysis');
jest.mock('../../models/User');
jest.mock('../../models/CodeSnapshot');
jest.mock('../LoggerService');

describe('ContentGenerationService - Snapshot Integration', () => {
     let service: ContentGenerationService;
     const mockApiKey = 'test-api-key';
     const mockUserId = new mongoose.Types.ObjectId().toString();
     const mockAnalysisId = new mongoose.Types.ObjectId().toString();
     const mockSnapshotId = new mongoose.Types.ObjectId().toString();

     beforeEach(() => {
          service = new ContentGenerationService(mockApiKey);
          jest.clearAllMocks();
     });

     describe('generateContent with snapshotId', () => {
          it('should attach snapshotId to content when valid snapshot is provided', async () => {
               // Mock analysis
               const mockAnalysis = {
                    _id: mockAnalysisId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: ['Feature 2'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };
               (Analysis.findById as jest.Mock).mockResolvedValue(mockAnalysis);

               // Mock user without style profile
               const mockUser = {
                    _id: mockUserId,
                    voiceStrength: 80,
                    styleProfile: null,
               };
               (User.findById as jest.Mock).mockResolvedValue(mockUser);

               // Mock snapshot
               const mockSnapshot = {
                    _id: mockSnapshotId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    imageUrl: 'https://example.com/snapshot.png',
               };
               (CodeSnapshot.findById as jest.Mock).mockResolvedValue(mockSnapshot);

               // Mock content save
               const mockContent = {
                    _id: new mongoose.Types.ObjectId(),
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Test content',
                    snapshotId: mockSnapshotId,
                    save: jest.fn().mockResolvedValue(true),
               };
               (Content as any).mockImplementation(() => mockContent);

               // Mock Gemini API call
               const callGeminiAPISpy = jest.spyOn(service as any, 'callGeminiAPI');
               callGeminiAPISpy.mockResolvedValue('Generated content text');

               const params = {
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x' as const,
                    format: 'single' as const,
                    snapshotId: mockSnapshotId,
               };

               const result = await service.generateContent(params);

               // Verify snapshot was validated
               expect(CodeSnapshot.findById).toHaveBeenCalledWith(mockSnapshotId);

               // Verify content was created with snapshotId
               expect(Content).toHaveBeenCalledWith(
                    expect.objectContaining({
                         snapshotId: expect.any(mongoose.Types.ObjectId),
                    })
               );
          });

          it('should reject snapshot that does not belong to user', async () => {
               const differentUserId = new mongoose.Types.ObjectId().toString();

               // Mock analysis
               const mockAnalysis = {
                    _id: mockAnalysisId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: ['Feature 2'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };
               (Analysis.findById as jest.Mock).mockResolvedValue(mockAnalysis);

               // Mock user
               const mockUser = {
                    _id: mockUserId,
                    voiceStrength: 80,
                    styleProfile: null,
               };
               (User.findById as jest.Mock).mockResolvedValue(mockUser);

               // Mock snapshot belonging to different user
               const mockSnapshot = {
                    _id: mockSnapshotId,
                    userId: new mongoose.Types.ObjectId(differentUserId),
                    imageUrl: 'https://example.com/snapshot.png',
               };
               (CodeSnapshot.findById as jest.Mock).mockResolvedValue(mockSnapshot);

               const params = {
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x' as const,
                    format: 'single' as const,
                    snapshotId: mockSnapshotId,
               };

               await expect(service.generateContent(params)).rejects.toThrow(
                    'Unauthorized: Snapshot does not belong to user'
               );
          });

          it('should continue without snapshot if snapshot not found', async () => {
               // Mock analysis
               const mockAnalysis = {
                    _id: mockAnalysisId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: ['Feature 2'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };
               (Analysis.findById as jest.Mock).mockResolvedValue(mockAnalysis);

               // Mock user
               const mockUser = {
                    _id: mockUserId,
                    voiceStrength: 80,
                    styleProfile: null,
               };
               (User.findById as jest.Mock).mockResolvedValue(mockUser);

               // Mock snapshot not found
               (CodeSnapshot.findById as jest.Mock).mockResolvedValue(null);

               // Mock content save
               const mockContent = {
                    _id: new mongoose.Types.ObjectId(),
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Test content',
                    snapshotId: undefined,
                    save: jest.fn().mockResolvedValue(true),
               };
               (Content as any).mockImplementation(() => mockContent);

               // Mock Gemini API call
               const callGeminiAPISpy = jest.spyOn(service as any, 'callGeminiAPI');
               callGeminiAPISpy.mockResolvedValue('Generated content text');

               const params = {
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x' as const,
                    format: 'single' as const,
                    snapshotId: mockSnapshotId,
               };

               const result = await service.generateContent(params);

               // Verify snapshot was checked
               expect(CodeSnapshot.findById).toHaveBeenCalledWith(mockSnapshotId);

               // Verify content was still created (without snapshot)
               expect(mockContent.save).toHaveBeenCalled();
          });

          it('should work without snapshotId (backward compatibility)', async () => {
               // Mock analysis
               const mockAnalysis = {
                    _id: mockAnalysisId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: ['Feature 2'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };
               (Analysis.findById as jest.Mock).mockResolvedValue(mockAnalysis);

               // Mock user
               const mockUser = {
                    _id: mockUserId,
                    voiceStrength: 80,
                    styleProfile: null,
               };
               (User.findById as jest.Mock).mockResolvedValue(mockUser);

               // Mock content save
               const mockContent = {
                    _id: new mongoose.Types.ObjectId(),
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x',
                    contentFormat: 'single',
                    generatedText: 'Test content',
                    snapshotId: undefined,
                    save: jest.fn().mockResolvedValue(true),
               };
               (Content as any).mockImplementation(() => mockContent);

               // Mock Gemini API call
               const callGeminiAPISpy = jest.spyOn(service as any, 'callGeminiAPI');
               callGeminiAPISpy.mockResolvedValue('Generated content text');

               const params = {
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x' as const,
                    format: 'single' as const,
                    // No snapshotId provided
               };

               const result = await service.generateContent(params);

               // Verify CodeSnapshot was not queried
               expect(CodeSnapshot.findById).not.toHaveBeenCalled();

               // Verify content was created without snapshotId
               expect(Content).toHaveBeenCalledWith(
                    expect.objectContaining({
                         snapshotId: undefined,
                    })
               );
          });

          it('should attach snapshotId to thread content when valid snapshot is provided', async () => {
               // Mock analysis
               const mockAnalysis = {
                    _id: mockAnalysisId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: ['Feature 2'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };
               (Analysis.findById as jest.Mock).mockResolvedValue(mockAnalysis);

               // Mock user without style profile
               const mockUser = {
                    _id: mockUserId,
                    voiceStrength: 80,
                    styleProfile: null,
               };
               (User.findById as jest.Mock).mockResolvedValue(mockUser);

               // Mock snapshot
               const mockSnapshot = {
                    _id: mockSnapshotId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    imageUrl: 'https://example.com/snapshot.png',
               };
               (CodeSnapshot.findById as jest.Mock).mockResolvedValue(mockSnapshot);

               // Mock content save
               const mockContent = {
                    _id: new mongoose.Types.ObjectId(),
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x',
                    contentFormat: 'mini_thread',
                    generatedText: 'Tweet 1\n\nTweet 2\n\nTweet 3',
                    tweets: [
                         { text: 'Tweet 1 1/3', position: 1, characterCount: 11 },
                         { text: 'Tweet 2 2/3', position: 2, characterCount: 11 },
                         { text: 'Tweet 3 3/3', position: 3, characterCount: 11 },
                    ],
                    snapshotId: mockSnapshotId,
                    save: jest.fn().mockResolvedValue(true),
               };
               (Content as any).mockImplementation(() => mockContent);

               // Mock Gemini API call with properly formatted response
               const callGeminiAPISpy = jest.spyOn(service as any, 'callGeminiAPI');
               callGeminiAPISpy.mockResolvedValue(
                    'This is the first tweet with enough characters to be valid and interesting\n' +
                    'This is the second tweet with enough characters to be valid and interesting\n' +
                    'This is the third tweet with enough characters to be valid and interesting'
               );

               const params = {
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x' as const,
                    format: 'mini_thread' as const,
                    snapshotId: mockSnapshotId,
               };

               const result = await service.generateContent(params);

               // Verify snapshot was validated
               expect(CodeSnapshot.findById).toHaveBeenCalledWith(mockSnapshotId);

               // Verify content was created with snapshotId
               expect(Content).toHaveBeenCalledWith(
                    expect.objectContaining({
                         snapshotId: expect.any(mongoose.Types.ObjectId),
                         contentFormat: 'mini_thread',
                    })
               );
          });

          it('should reject snapshot for thread content that does not belong to user', async () => {
               const differentUserId = new mongoose.Types.ObjectId().toString();

               // Mock analysis
               const mockAnalysis = {
                    _id: mockAnalysisId,
                    userId: new mongoose.Types.ObjectId(mockUserId),
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: ['Feature 2'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };
               (Analysis.findById as jest.Mock).mockResolvedValue(mockAnalysis);

               // Mock user
               const mockUser = {
                    _id: mockUserId,
                    voiceStrength: 80,
                    styleProfile: null,
               };
               (User.findById as jest.Mock).mockResolvedValue(mockUser);

               // Mock snapshot belonging to different user
               const mockSnapshot = {
                    _id: mockSnapshotId,
                    userId: new mongoose.Types.ObjectId(differentUserId),
                    imageUrl: 'https://example.com/snapshot.png',
               };
               (CodeSnapshot.findById as jest.Mock).mockResolvedValue(mockSnapshot);

               // Mock Gemini API call (should not be reached)
               const callGeminiAPISpy = jest.spyOn(service as any, 'callGeminiAPI');
               callGeminiAPISpy.mockResolvedValue(
                    'This is the first tweet with enough characters to be valid and interesting\n' +
                    'This is the second tweet with enough characters to be valid and interesting\n' +
                    'This is the third tweet with enough characters to be valid and interesting\n' +
                    'This is the fourth tweet with enough characters to be valid and interesting\n' +
                    'This is the fifth tweet with enough characters to be valid and interesting'
               );

               const params = {
                    analysisId: mockAnalysisId,
                    userId: mockUserId,
                    platform: 'x' as const,
                    format: 'full_thread' as const,
                    snapshotId: mockSnapshotId,
               };

               await expect(service.generateContent(params)).rejects.toThrow(
                    'Unauthorized: Snapshot does not belong to user'
               );

               // Verify Gemini API was not called (error thrown before)
               expect(callGeminiAPISpy).not.toHaveBeenCalled();
          });
     });
});
