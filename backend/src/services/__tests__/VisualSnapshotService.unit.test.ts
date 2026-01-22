import { VisualSnapshotService, ScoredSnippet, GenerationOptions } from '../VisualSnapshotService';
import { CacheService } from '../CacheService';
import { CodeSnapshot } from '../../models/CodeSnapshot';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { GitHubService } from '../GitHubService';
import { SnippetSelectionService, SnippetCandidate } from '../SnippetSelectionService';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../CacheService');
jest.mock('../../models/CodeSnapshot');
jest.mock('../../models/Repository');
jest.mock('../../models/Analysis');
jest.mock('../GitHubService');
jest.mock('../SnippetSelectionService');
jest.mock('@google/genai');

describe('VisualSnapshotService - Unit Tests', () => {
     let service: VisualSnapshotService;
     let mockCacheService: jest.Mocked<CacheService>;
     let mockSnippetSelectionService: jest.Mocked<SnippetSelectionService>;

     const mockUserId = new mongoose.Types.ObjectId().toString();
     const mockRepositoryId = new mongoose.Types.ObjectId().toString();
     const mockAnalysisId = new mongoose.Types.ObjectId();
     const mockGithubToken = 'mock-github-token';

     beforeEach(() => {
          jest.clearAllMocks();

          // Create mock cache service
          mockCacheService = new CacheService() as jest.Mocked<CacheService>;

          // Create service instance
          service = new VisualSnapshotService('mock-api-key', mockCacheService);

          // Access the private snippetSelectionService through type assertion
          mockSnippetSelectionService = (service as any).snippetSelectionService as jest.Mocked<SnippetSelectionService>;
     });

     describe('getSnapshotsForRepository', () => {
          it('should fetch non-stale snapshots sorted by selection score', async () => {
               const mockSnapshots = [
                    {
                         _id: new mongoose.Types.ObjectId(),
                         repositoryId: new mongoose.Types.ObjectId(mockRepositoryId),
                         userId: new mongoose.Types.ObjectId(mockUserId),
                         selectionScore: 90,
                         isStale: false,
                    },
                    {
                         _id: new mongoose.Types.ObjectId(),
                         repositoryId: new mongoose.Types.ObjectId(mockRepositoryId),
                         userId: new mongoose.Types.ObjectId(mockUserId),
                         selectionScore: 85,
                         isStale: false,
                    },
               ];

               const mockFind = jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                         exec: jest.fn().mockResolvedValue(mockSnapshots),
                    }),
               });

               (CodeSnapshot.find as jest.Mock) = mockFind;

               const result = await service.getSnapshotsForRepository(mockRepositoryId, mockUserId);

               expect(result).toEqual(mockSnapshots);
               expect(mockFind).toHaveBeenCalledWith({
                    repositoryId: expect.any(mongoose.Types.ObjectId),
                    userId: expect.any(mongoose.Types.ObjectId),
                    isStale: false,
               });
          });

          it('should return empty array when no snapshots found', async () => {
               const mockFind = jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                         exec: jest.fn().mockResolvedValue([]),
                    }),
               });

               (CodeSnapshot.find as jest.Mock) = mockFind;

               const result = await service.getSnapshotsForRepository(mockRepositoryId, mockUserId);

               expect(result).toEqual([]);
          });

          it('should handle errors gracefully', async () => {
               const mockFind = jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                         exec: jest.fn().mockRejectedValue(new Error('Database error')),
                    }),
               });

               (CodeSnapshot.find as jest.Mock) = mockFind;

               await expect(
                    service.getSnapshotsForRepository(mockRepositoryId, mockUserId)
               ).rejects.toThrow('Snapshot generation failed');
          });
     });

     describe('invalidateStaleSnapshots', () => {
          it('should mark snapshots as stale when commit SHA differs', async () => {
               const latestCommitSha = 'abc123';
               const mockUpdateResult = { modifiedCount: 3 };

               (CodeSnapshot.updateMany as jest.Mock) = jest.fn().mockResolvedValue(mockUpdateResult);

               await service.invalidateStaleSnapshots(mockRepositoryId, latestCommitSha);

               expect(CodeSnapshot.updateMany).toHaveBeenCalledWith(
                    {
                         repositoryId: expect.any(mongoose.Types.ObjectId),
                         lastCommitSha: { $ne: latestCommitSha },
                         isStale: false,
                    },
                    {
                         $set: { isStale: true },
                    }
               );
          });

          it('should not fail if no snapshots need updating', async () => {
               const latestCommitSha = 'abc123';
               const mockUpdateResult = { modifiedCount: 0 };

               (CodeSnapshot.updateMany as jest.Mock) = jest.fn().mockResolvedValue(mockUpdateResult);

               await expect(
                    service.invalidateStaleSnapshots(mockRepositoryId, latestCommitSha)
               ).resolves.not.toThrow();
          });

          it('should handle database errors', async () => {
               const latestCommitSha = 'abc123';

               (CodeSnapshot.updateMany as jest.Mock) = jest.fn().mockRejectedValue(
                    new Error('Database error')
               );

               await expect(
                    service.invalidateStaleSnapshots(mockRepositoryId, latestCommitSha)
               ).rejects.toThrow('Snapshot generation failed');
          });
     });

     describe('error handling', () => {
          it('should categorize GitHub errors correctly', async () => {
               const mockFind = jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                         exec: jest.fn().mockRejectedValue(new Error('GitHub API error')),
                    }),
               });

               (CodeSnapshot.find as jest.Mock) = mockFind;

               await expect(
                    service.getSnapshotsForRepository(mockRepositoryId, mockUserId)
               ).rejects.toThrow('Unable to access repository');
          });

          it('should categorize AI errors correctly', async () => {
               const mockFind = jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                         exec: jest.fn().mockRejectedValue(new Error('Gemini API unavailable')),
                    }),
               });

               (CodeSnapshot.find as jest.Mock) = mockFind;

               await expect(
                    service.getSnapshotsForRepository(mockRepositoryId, mockUserId)
               ).rejects.toThrow('AI analysis temporarily unavailable');
          });

          it('should provide generic error for unknown errors', async () => {
               const mockFind = jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                         exec: jest.fn().mockRejectedValue(new Error('Unknown error')),
                    }),
               });

               (CodeSnapshot.find as jest.Mock) = mockFind;

               await expect(
                    service.getSnapshotsForRepository(mockRepositoryId, mockUserId)
               ).rejects.toThrow('Snapshot generation failed');
          });
     });

     describe('parseGeminiResponse', () => {
          it('should parse valid JSON response', () => {
               const validResponse = JSON.stringify({
                    selectionScore: 85,
                    selectionReason: 'Complex algorithm with good readability',
                    complexity: 'high',
                    significance: 'high',
                    isCoreFunctionality: true,
                    isRecentlyChanged: true,
                    technicalInterest: 'Implements efficient sorting algorithm',
               });

               const result = (service as any).parseGeminiResponse(validResponse);

               expect(result.selectionScore).toBe(85);
               expect(result.selectionReason).toBe('Complex algorithm with good readability');
               expect(result.complexity).toBe('high');
          });

          it('should handle JSON wrapped in markdown code blocks', () => {
               const wrappedResponse = `\`\`\`json
{
  "selectionScore": 75,
  "selectionReason": "Test reason",
  "complexity": "medium",
  "significance": "medium",
  "isCoreFunctionality": false,
  "isRecentlyChanged": false,
  "technicalInterest": "Test interest"
}
\`\`\``;

               const result = (service as any).parseGeminiResponse(wrappedResponse);

               expect(result.selectionScore).toBe(75);
          });

          it('should clamp selection score to valid range', () => {
               const invalidScoreResponse = JSON.stringify({
                    selectionScore: 150, // Invalid: > 100
                    selectionReason: 'Test',
                    complexity: 'high',
                    significance: 'high',
                    isCoreFunctionality: true,
                    isRecentlyChanged: true,
                    technicalInterest: 'Test',
               });

               const result = (service as any).parseGeminiResponse(invalidScoreResponse);

               expect(result.selectionScore).toBe(100); // Clamped to max
          });

          it('should throw error for invalid JSON', () => {
               const invalidResponse = 'This is not JSON';

               expect(() => {
                    (service as any).parseGeminiResponse(invalidResponse);
               }).toThrow('Failed to parse Gemini response');
          });

          it('should throw error for missing required fields', () => {
               const incompleteResponse = JSON.stringify({
                    selectionScore: 85,
                    // Missing other required fields
               });

               expect(() => {
                    (service as any).parseGeminiResponse(incompleteResponse);
               }).toThrow('Failed to parse Gemini response');
          });
     });

     describe('buildCodeAnalysisPrompt', () => {
          it('should build prompt with all context information', () => {
               const snippet: SnippetCandidate = {
                    filePath: 'src/utils/sort.ts',
                    startLine: 10,
                    endLine: 30,
                    functionName: 'quickSort',
                    language: 'typescript',
                    linesOfCode: 20,
                    code: 'function quickSort(arr: number[]) { ... }',
               };

               const context = {
                    repoName: 'test-repo',
                    repoDescription: 'A test repository',
                    primaryLanguage: 'TypeScript',
                    recentCommits: [
                         {
                              sha: 'abc123',
                              commit: {
                                   message: 'Add sorting algorithm',
                                   author: { name: 'Test', email: 'test@test.com', date: '2024-01-01' },
                              },
                              html_url: 'https://github.com/test/test/commit/abc123',
                         },
                    ],
                    fileStructure: [],
               };

               const prompt = (service as any).buildCodeAnalysisPrompt(snippet, context);

               expect(prompt).toContain('test-repo');
               expect(prompt).toContain('A test repository');
               expect(prompt).toContain('TypeScript');
               expect(prompt).toContain('src/utils/sort.ts');
               expect(prompt).toContain('quickSort');
               expect(prompt).toContain('Add sorting algorithm');
          });

          it('should handle missing optional fields', () => {
               const snippet: SnippetCandidate = {
                    filePath: 'src/index.ts',
                    startLine: 1,
                    endLine: 10,
                    language: 'typescript',
                    linesOfCode: 10,
                    code: 'const app = express();',
               };

               const context = {
                    repoName: 'test-repo',
                    repoDescription: '',
                    primaryLanguage: 'TypeScript',
                    recentCommits: [],
                    fileStructure: [],
               };

               const prompt = (service as any).buildCodeAnalysisPrompt(snippet, context);

               expect(prompt).toContain('No description');
               expect(prompt).toContain('No recent commits');
               expect(prompt).not.toContain('Function:');
          });
     });

     describe('retryWithBackoff', () => {
          it('should succeed on first attempt', async () => {
               const operation = jest.fn().mockResolvedValue('success');

               const result = await (service as any).retryWithBackoff(operation);

               expect(result).toBe('success');
               expect(operation).toHaveBeenCalledTimes(1);
          });

          it('should retry on failure and eventually succeed', async () => {
               const operation = jest.fn()
                    .mockRejectedValueOnce(new Error('Fail 1'))
                    .mockRejectedValueOnce(new Error('Fail 2'))
                    .mockResolvedValue('success');

               const result = await (service as any).retryWithBackoff(operation, 3);

               expect(result).toBe('success');
               expect(operation).toHaveBeenCalledTimes(3);
          });

          it('should throw error after max attempts', async () => {
               const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

               await expect(
                    (service as any).retryWithBackoff(operation, 3)
               ).rejects.toThrow('Always fails');

               expect(operation).toHaveBeenCalledTimes(3);
          });
     });
});
