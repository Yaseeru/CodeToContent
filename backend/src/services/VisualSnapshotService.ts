import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { CodeSnapshot, ICodeSnapshot } from '../models/CodeSnapshot';
import { Repository } from '../models/Repository';
import { Analysis, IAnalysis } from '../models/Analysis';
import { GitHubService, GitHubContent, GitHubCommit } from './GitHubService';
import { CacheService } from './CacheService';
import { SnippetSelectionService, SnippetCandidate, RepositoryContext } from './SnippetSelectionService';
import { ImageRenderingService } from './ImageRenderingService';
import { LocalStorageService, IStorageService } from './StorageService';
import { SNAPSHOT_CONFIG } from '../config/constants';
import { LoggerService, LogLevel } from './LoggerService';

/**
 * Scored snippet with AI analysis
 */
export interface ScoredSnippet extends SnippetCandidate {
     selectionScore: number; // 0-100
     selectionReason: string;
     complexity?: 'low' | 'medium' | 'high';
     significance?: 'low' | 'medium' | 'high';
     isCoreFunctionality?: boolean;
     isRecentlyChanged?: boolean;
     technicalInterest?: string;
}

/**
 * Options for snapshot generation
 */
export interface GenerationOptions {
     maxSnippets?: number;
     theme?: string;
     showLineNumbers?: boolean;
     fontSize?: number;
     forceRegenerate?: boolean;
}

/**
 * Gemini AI response for code analysis
 */
interface GeminiCodeAnalysisResponse {
     selectionScore: number;
     selectionReason: string;
     complexity: 'low' | 'medium' | 'high';
     significance: 'low' | 'medium' | 'high';
     isCoreFunctionality: boolean;
     isRecentlyChanged: boolean;
     technicalInterest: string;
}

/**
 * Service for generating and managing code snapshot images
 * Leverages Gemini AI for intelligent snippet selection
 */
export class VisualSnapshotService {
     private ai: GoogleGenAI;
     private cacheService: CacheService;
     private snippetSelectionService: SnippetSelectionService;
     private imageRenderingService: ImageRenderingService;
     private storageService: IStorageService;
     private logger: LoggerService;

     constructor(
          geminiApiKey: string,
          cacheService: CacheService,
          storageService?: IStorageService
     ) {
          this.ai = new GoogleGenAI({ apiKey: geminiApiKey });
          this.cacheService = cacheService;
          this.snippetSelectionService = new SnippetSelectionService();
          this.imageRenderingService = new ImageRenderingService();
          this.storageService = storageService || new LocalStorageService();
          this.logger = LoggerService.getInstance();
     }

     /**
      * Initialize the service
      * Must be called before using the service
      */
     async initialize(): Promise<void> {
          this.logger.log(LogLevel.INFO, 'Initializing VisualSnapshotService');

          // Initialize image rendering service
          await this.imageRenderingService.initialize();

          // Initialize storage service if it's LocalStorageService
          if (this.storageService instanceof LocalStorageService) {
               await this.storageService.initialize();
          }

          this.logger.log(LogLevel.INFO, 'VisualSnapshotService initialized successfully');
     }

     /**
      * Cleanup resources
      * Should be called when shutting down the service
      */
     async cleanup(): Promise<void> {
          this.logger.log(LogLevel.INFO, 'Cleaning up VisualSnapshotService');
          await this.imageRenderingService.cleanup();
          this.logger.log(LogLevel.INFO, 'VisualSnapshotService cleanup complete');
     }

     /**
      * Main entry point: Generate snapshots for a repository
      * This method orchestrates the entire snapshot generation process
      */
     async generateSnapshotsForRepository(
          repositoryId: string,
          userId: string,
          githubAccessToken: string,
          options?: GenerationOptions
     ): Promise<ICodeSnapshot[]> {
          try {
               this.logger.log(LogLevel.INFO, 'Starting snapshot generation', {
                    repositoryId,
                    userId
               });

               // Step 1: Fetch repository and analysis data
               const repository = await Repository.findById(repositoryId);
               if (!repository) {
                    throw new Error('Repository not found');
               }

               // Verify user ownership
               if (repository.userId.toString() !== userId) {
                    throw new Error('Unauthorized: User does not own this repository');
               }

               // Fetch latest analysis
               const analysis = await Analysis.findOne({ repositoryId })
                    .sort({ createdAt: -1 })
                    .limit(1);

               if (!analysis) {
                    throw new Error('No analysis found for repository. Please analyze the repository first.');
               }

               // Step 2: Check if we should use cached snapshots
               if (!options?.forceRegenerate) {
                    const existingSnapshots = await this.getSnapshotsForRepository(repositoryId, userId);
                    if (existingSnapshots.length > 0) {
                         this.logger.log(LogLevel.INFO, 'Returning cached snapshots', {
                              count: existingSnapshots.length
                         });
                         return existingSnapshots;
                    }
               }

               // Step 3: Initialize GitHub service and fetch repository data
               const githubService = new GitHubService(githubAccessToken);
               const [owner, repo] = repository.fullName.split('/');

               const [commits, fileStructure] = await Promise.all([
                    githubService.fetchCommitHistory(owner, repo, 50),
                    githubService.fetchAllFiles(owner, repo, 3), // Recursively fetch all files up to depth 3
               ]);

               if (commits.length === 0) {
                    throw new Error('Repository has no commits');
               }

               const latestCommitSha = commits[0].sha;

               // Step 4: Build repository context
               // Detect primary language from file structure
               const primaryLanguage = this.detectPrimaryLanguage(fileStructure);

               const context: RepositoryContext = {
                    repoName: repository.name,
                    repoDescription: repository.description || '',
                    primaryLanguage,
                    recentCommits: commits,
                    fileStructure,
               };

               // PHASE 1: Heuristic filtering (existing)
               this.logger.log(LogLevel.INFO, 'Phase 1: Identifying candidates with heuristic scoring');

               const allCandidates = await this.snippetSelectionService.identifyCandidates(
                    fileStructure,
                    commits,
                    analysis
               );

               this.logger.log(LogLevel.DEBUG, 'Identified candidates before filtering', {
                    count: allCandidates.length,
                    files: allCandidates.slice(0, 5).map(c => ({ path: c.filePath, loc: c.linesOfCode }))
               });

               // Filter boilerplate (existing)
               const filteredCandidates = this.snippetSelectionService.filterBoilerplate(allCandidates);

               this.logger.log(LogLevel.DEBUG, 'Candidates after filtering', {
                    count: filteredCandidates.length,
                    files: filteredCandidates.slice(0, 5).map(c => ({ path: c.filePath, loc: c.linesOfCode }))
               });

               if (filteredCandidates.length === 0) {
                    this.logger.log(LogLevel.WARN, 'No suitable code snippets found', {
                         totalFiles: fileStructure.length,
                         candidatesBeforeFilter: allCandidates.length
                    });
                    return [];
               }

               // Slice to top candidates for code fetching
               const topCandidates = filteredCandidates.slice(0, SNAPSHOT_CONFIG.MAX_CANDIDATES_TO_FETCH);

               this.logger.log(LogLevel.INFO, `Selected ${topCandidates.length} candidates for code fetching`);

               // PHASE 2: Fetch code content (NEW)
               this.logger.log(LogLevel.INFO, 'Phase 2: Fetching code content for top candidates');
               const candidatesWithCode = await this.fetchCodeForCandidates(
                    topCandidates,
                    githubService,
                    owner,
                    repo,
                    latestCommitSha
               );

               // PHASE 3: AI scoring (existing, but now with real code)
               this.logger.log(LogLevel.INFO, 'Phase 3: Scoring candidates with Gemini AI');

               // Check cache first for snippet selection results
               const selectionCacheKey = `${repositoryId}:${latestCommitSha}`;
               let scoredSnippets = await this.getCachedSnippetSelection(selectionCacheKey);

               if (!scoredSnippets) {
                    this.logger.log(LogLevel.INFO, 'Snippet selection cache miss, performing AI scoring');

                    // Score snippets with AI (parallel processing in batches)
                    scoredSnippets = await this.scoreSnippetsInParallel(
                         candidatesWithCode,
                         context
                    );

                    // Cache the scored snippets for future use
                    await this.cacheSnippetSelection(selectionCacheKey, scoredSnippets);
               } else {
                    this.logger.log(LogLevel.INFO, 'Using cached snippet selection results');
               }

               // Select top N snippets for final rendering
               const maxSnippets = options?.maxSnippets || SNAPSHOT_CONFIG.MAX_FINAL_SNIPPETS;
               const topSnippets = scoredSnippets
                    .sort((a, b) => b.selectionScore - a.selectionScore)
                    .slice(0, maxSnippets);

               this.logger.log(LogLevel.INFO, 'Selected top snippets for rendering', {
                    count: topSnippets.length
               });

               // Step 8: Render snippets to images (code already fetched)
               const snapshots: ICodeSnapshot[] = [];

               for (const snippet of topSnippets) {
                    try {
                         this.logger.log(LogLevel.DEBUG, 'Rendering snippet', {
                              filePath: snippet.filePath
                         });

                         // Code is already fetched in Phase 2
                         // Extract the specific lines for this snippet
                         const lines = snippet.code.split('\n');
                         const snippetCode = lines.slice(snippet.startLine - 1, snippet.endLine).join('\n');

                         if (!snippetCode || snippetCode.trim().length === 0) {
                              this.logger.log(LogLevel.WARN, 'Empty code snippet, skipping', {
                                   filePath: snippet.filePath
                              });
                              continue;
                         }

                         // Render code to image
                         const imageBuffer = await this.imageRenderingService.renderCodeToImage(
                              snippetCode,
                              snippet.language,
                              snippet.filePath,
                              options?.theme as any || SNAPSHOT_CONFIG.DEFAULT_THEME
                         );

                         // Store image
                         const imageUrl = await this.storageService.uploadImage(imageBuffer, {
                              userId,
                              repositoryId,
                         });

                         // Get image dimensions from buffer
                         const imageDimensions = await this.getImageDimensions(imageBuffer);

                         // Create snapshot document
                         const snapshot = new CodeSnapshot({
                              repositoryId: new mongoose.Types.ObjectId(repositoryId),
                              analysisId: analysis._id,
                              userId: new mongoose.Types.ObjectId(userId),
                              snippetMetadata: {
                                   filePath: snippet.filePath,
                                   startLine: snippet.startLine,
                                   endLine: snippet.endLine,
                                   functionName: snippet.functionName,
                                   language: snippet.language,
                                   linesOfCode: snippet.linesOfCode,
                              },
                              selectionScore: snippet.selectionScore,
                              selectionReason: snippet.selectionReason,
                              imageUrl,
                              imageSize: imageBuffer.length,
                              imageDimensions,
                              renderOptions: {
                                   theme: options?.theme || SNAPSHOT_CONFIG.DEFAULT_THEME,
                                   showLineNumbers: options?.showLineNumbers ?? SNAPSHOT_CONFIG.DEFAULT_SHOW_LINE_NUMBERS,
                                   fontSize: options?.fontSize || SNAPSHOT_CONFIG.DEFAULT_FONT_SIZE,
                              },
                              isStale: false,
                              lastCommitSha: latestCommitSha,
                         });

                         await snapshot.save();
                         snapshots.push(snapshot);

                         this.logger.log(LogLevel.DEBUG, 'Successfully rendered and stored snapshot', {
                              filePath: snippet.filePath
                         });
                    } catch (error: any) {
                         this.logger.log(LogLevel.ERROR, 'Failed to render snippet', {
                              filePath: snippet.filePath,
                              error: error.message
                         });
                         // Continue with other snippets even if one fails
                    }
               }

               this.logger.log(LogLevel.INFO, 'Successfully generated snapshots', {
                    count: snapshots.length
               });
               return snapshots;
          } catch (error: any) {
               this.logger.log(LogLevel.ERROR, 'Snapshot generation failed', {
                    error: error.message
               });
               throw this.handleError(error);
          }
     }

     /**
      * Fetches actual code content for top-ranked candidates.
      * Uses Promise.allSettled to handle partial failures gracefully.
      * 
      * @param candidates - Top candidates from heuristic scoring
      * @param githubService - GitHub service instance with access token
      * @param owner - Repository owner
      * @param repo - Repository name
      * @param ref - Git reference (branch/commit)
      * @returns Candidates with populated code property
      */
     private async fetchCodeForCandidates(
          candidates: SnippetCandidate[],
          githubService: GitHubService,
          owner: string,
          repo: string,
          ref: string
     ): Promise<SnippetCandidate[]> {
          this.logger.log(LogLevel.INFO, `Fetching code content for ${candidates.length} candidates`, {
               owner,
               repo,
               ref
          });

          // Fetch code in parallel with Promise.allSettled for graceful failure handling
          const fetchPromises = candidates.map(async (candidate) => {
               try {
                    // Validate file size before fetching
                    if (candidate.fileSize && candidate.fileSize > SNAPSHOT_CONFIG.MAX_FILE_SIZE_BYTES) {
                         this.logger.log(LogLevel.WARN, `Skipping large file: ${candidate.filePath}`, {
                              size: candidate.fileSize
                         });
                         return null;
                    }

                    // Fetch file content from GitHub with retry logic
                    const code = await this.retryFetch(async () => {
                         return await githubService.fetchFileContent(owner, repo, candidate.filePath, ref);
                    });

                    // Validate code content
                    if (!code || code.trim().length === 0) {
                         this.logger.log(LogLevel.WARN, `Empty code content: ${candidate.filePath}`);
                         return null;
                    }

                    this.logger.log(LogLevel.DEBUG, `Successfully fetched code for: ${candidate.filePath}`, {
                         codeLength: code.length
                    });

                    return {
                         ...candidate,
                         code
                    };
               } catch (error: any) {
                    this.logger.log(LogLevel.ERROR, `Failed to fetch code for: ${candidate.filePath}`, {
                         error: error.message
                    });
                    return null;
               }
          });

          // Wait for all fetches to complete
          const results = await Promise.allSettled(fetchPromises);

          // Filter successful fetches
          const candidatesWithCode = results
               .filter(
                    (result): result is PromiseFulfilledResult<SnippetCandidate> =>
                         result.status === 'fulfilled' && result.value !== null
               )
               .map(result => result.value);

          const successCount = candidatesWithCode.length;
          const failureCount = candidates.length - successCount;

          this.logger.log(LogLevel.INFO, `Code fetching complete`, {
               total: candidates.length,
               successful: successCount,
               failed: failureCount
          });

          // Require minimum successful fetches
          if (successCount < 3) {
               throw new Error(
                    `Insufficient code snippets fetched (${successCount}/3 minimum required)`
               );
          }

          return candidatesWithCode;
     }

     /**
      * Retries a fetch operation with exponential backoff.
      * 
      * @param operation - Async operation to retry
      * @param maxRetries - Maximum number of retry attempts
      * @returns Result of successful operation
      */
     private async retryFetch<T>(
          operation: () => Promise<T>,
          maxRetries: number = SNAPSHOT_CONFIG.MAX_FETCH_RETRIES
     ): Promise<T> {
          let lastError: Error;

          for (let attempt = 0; attempt <= maxRetries; attempt++) {
               try {
                    return await operation();
               } catch (error: any) {
                    lastError = error;

                    if (attempt < maxRetries) {
                         const delayMs = SNAPSHOT_CONFIG.FETCH_RETRY_DELAY_MS * Math.pow(2, attempt);
                         this.logger.log(LogLevel.DEBUG, `Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms`);
                         await this.delay(delayMs);
                    }
               }
          }

          throw lastError!;
     }

     /**
      * Score snippets in parallel batches
      */
     private async scoreSnippetsInParallel(
          candidates: SnippetCandidate[],
          context: RepositoryContext
     ): Promise<ScoredSnippet[]> {
          const batchSize = SNAPSHOT_CONFIG.PARALLEL_BATCH_SIZE;
          const results: ScoredSnippet[] = [];

          // Process in batches to avoid overwhelming the API
          for (let i = 0; i < candidates.length; i += batchSize) {
               const batch = candidates.slice(i, i + batchSize);

               const batchResults = await Promise.all(
                    batch.map(candidate => this.scoreSnippetWithAI(candidate, context))
               );

               results.push(...batchResults);
          }

          return results;
     }

     /**
      * Get existing snapshots for a repository
      * Returns non-stale snapshots sorted by selection score
      */
     async getSnapshotsForRepository(
          repositoryId: string,
          userId: string
     ): Promise<ICodeSnapshot[]> {
          try {
               this.logger.log(LogLevel.DEBUG, 'Fetching snapshots for repository', {
                    repositoryId
               });

               const snapshots = await CodeSnapshot.find({
                    repositoryId: new mongoose.Types.ObjectId(repositoryId),
                    userId: new mongoose.Types.ObjectId(userId),
                    isStale: false,
               })
                    .sort({ selectionScore: -1 })
                    .exec();

               this.logger.log(LogLevel.DEBUG, 'Found non-stale snapshots', {
                    count: snapshots.length
               });
               return snapshots;
          } catch (error: any) {
               this.logger.log(LogLevel.ERROR, 'Failed to fetch snapshots', {
                    error: error.message
               });
               throw this.handleError(error);
          }
     }

     /**
      * Invalidate stale snapshots when repository is updated
      * Marks snapshots as stale if commit SHA has changed
      */
     async invalidateStaleSnapshots(
          repositoryId: string,
          latestCommitSha: string
     ): Promise<void> {
          try {
               this.logger.log(LogLevel.INFO, 'Invalidating stale snapshots', {
                    repositoryId
               });

               // Mark snapshots as stale if they have a different commit SHA
               const result = await CodeSnapshot.updateMany(
                    {
                         repositoryId: new mongoose.Types.ObjectId(repositoryId),
                         lastCommitSha: { $ne: latestCommitSha },
                         isStale: false,
                    },
                    {
                         $set: { isStale: true },
                    }
               );

               this.logger.log(LogLevel.INFO, 'Marked snapshots as stale', {
                    count: result.modifiedCount
               });

               // Clear Redis cache for this repository
               await this.clearSnapshotCache(repositoryId);
          } catch (error: any) {
               this.logger.log(LogLevel.ERROR, 'Failed to invalidate snapshots', {
                    error: error.message
               });
               throw this.handleError(error);
          }
     }

     /**
      * Clear snapshot cache for a repository
      */
     private async clearSnapshotCache(repositoryId: string): Promise<void> {
          try {
               await this.cacheService.invalidateSnapshotCache(repositoryId);
               this.logger.log(LogLevel.DEBUG, 'Cleared snapshot cache', {
                    repositoryId
               });
          } catch (error: any) {
               this.logger.log(LogLevel.WARN, 'Failed to clear cache', {
                    error: error.message
               });
               // Don't throw - cache clearing failure is not critical
          }
     }

     /**
      * Score a snippet using Gemini AI
      * Falls back to heuristic scoring if AI is unavailable
      * Caches AI analysis results to reduce redundant API calls
      */
     private async scoreSnippetWithAI(
          snippet: SnippetCandidate,
          context: RepositoryContext
     ): Promise<ScoredSnippet> {
          try {
               // Generate cache key from snippet hash
               const snippetHash = this.generateSnippetHash(snippet);
               const cacheKey = `${context.repoName}:${snippetHash}`;

               // Check cache first
               const cachedAnalysis = await this.cacheService.getCachedSnapshotAnalysis(cacheKey);
               if (cachedAnalysis) {
                    this.logger.log(LogLevel.DEBUG, 'Using cached AI analysis', {
                         filePath: snippet.filePath
                    });
                    return {
                         ...snippet,
                         ...cachedAnalysis,
                    };
               }

               // Build the analysis prompt
               const prompt = this.buildCodeAnalysisPrompt(snippet, context);

               // Call Gemini AI with retry logic
               const responseText = await this.retryWithBackoff(async () => {
                    const response = await this.ai.models.generateContent({
                         model: 'gemini-1.5-flash',
                         contents: prompt,
                    });

                    if (!response.text) {
                         throw new Error('Gemini API returned empty response');
                    }

                    return response.text;
               });

               // Parse the response
               const analysis = this.parseGeminiResponse(responseText);

               // Cache the analysis result
               await this.cacheService.cacheSnapshotAnalysis(cacheKey, {
                    selectionScore: analysis.selectionScore,
                    selectionReason: analysis.selectionReason,
                    complexity: analysis.complexity,
                    significance: analysis.significance,
                    isCoreFunctionality: analysis.isCoreFunctionality,
                    isRecentlyChanged: analysis.isRecentlyChanged,
                    technicalInterest: analysis.technicalInterest,
               });

               // Return scored snippet
               return {
                    ...snippet,
                    selectionScore: analysis.selectionScore,
                    selectionReason: analysis.selectionReason,
                    complexity: analysis.complexity,
                    significance: analysis.significance,
                    isCoreFunctionality: analysis.isCoreFunctionality,
                    isRecentlyChanged: analysis.isRecentlyChanged,
                    technicalInterest: analysis.technicalInterest,
               };
          } catch (error: any) {
               this.logger.log(LogLevel.WARN, 'AI scoring failed, falling back to heuristic', {
                    error: error.message
               });

               // Fallback to heuristic scoring
               const heuristicScore = this.snippetSelectionService.calculateHeuristicScore(snippet, context);

               return {
                    ...snippet,
                    selectionScore: heuristicScore,
                    selectionReason: 'Scored using heuristic analysis (AI unavailable)',
               };
          }
     }

     /**
      * Build Gemini AI prompt for code analysis
      */
     private buildCodeAnalysisPrompt(
          snippet: SnippetCandidate,
          context: RepositoryContext
     ): string {
          const recentCommitMessages = context.recentCommits
               .slice(0, 5)
               .map(c => c.commit.message)
               .join(', ');

          return `You are an expert code analyst evaluating code snippets for social media sharing.

Repository Context:
- Name: ${context.repoName}
- Description: ${context.repoDescription || 'No description'}
- Primary Language: ${context.primaryLanguage}
- Recent Changes: ${recentCommitMessages || 'No recent commits'}

Code Snippet:
File: ${snippet.filePath}
Lines: ${snippet.startLine}-${snippet.endLine}
Language: ${snippet.language}
${snippet.functionName ? `Function: ${snippet.functionName}` : ''}

\`\`\`${snippet.language}
${snippet.code}
\`\`\`

Analyze this code snippet and provide a JSON response with the following structure:
{
  "selectionScore": <number 0-100>,
  "selectionReason": "<brief explanation in 1-2 sentences>",
  "complexity": "<low|medium|high>",
  "significance": "<low|medium|high>",
  "isCoreFunctionality": <boolean>,
  "isRecentlyChanged": <boolean>,
  "technicalInterest": "<brief description of what makes this code interesting>"
}

Scoring criteria:
- Cyclomatic complexity (higher = more interesting)
- Architectural centrality (core algorithms score higher)
- Recent additions or refactors (newer = more interesting)
- Technical patterns (design patterns, algorithms, optimizations)
- Code clarity and readability (clearer = better for sharing)

Respond ONLY with valid JSON.`;
     }

     /**
      * Parse Gemini AI response
      */
     private parseGeminiResponse(responseText: string): GeminiCodeAnalysisResponse {
          try {
               // Remove markdown code blocks if present
               const cleanedText = responseText
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();

               const parsed = JSON.parse(cleanedText);

               // Validate required fields
               if (
                    typeof parsed.selectionScore !== 'number' ||
                    typeof parsed.selectionReason !== 'string' ||
                    !['low', 'medium', 'high'].includes(parsed.complexity) ||
                    !['low', 'medium', 'high'].includes(parsed.significance) ||
                    typeof parsed.isCoreFunctionality !== 'boolean' ||
                    typeof parsed.isRecentlyChanged !== 'boolean' ||
                    typeof parsed.technicalInterest !== 'string'
               ) {
                    throw new Error('Invalid response structure');
               }

               // Clamp score to valid range
               parsed.selectionScore = Math.max(
                    SNAPSHOT_CONFIG.SCORE_MIN,
                    Math.min(SNAPSHOT_CONFIG.SCORE_MAX, parsed.selectionScore)
               );

               return parsed as GeminiCodeAnalysisResponse;
          } catch (error: any) {
               throw new Error(`Failed to parse Gemini response: ${error.message}`);
          }
     }

     /**
      * Retry operation with exponential backoff
      */
     private async retryWithBackoff<T>(
          operation: () => Promise<T>,
          maxAttempts: number = SNAPSHOT_CONFIG.MAX_RETRY_ATTEMPTS
     ): Promise<T> {
          let lastError: Error;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
               try {
                    return await operation();
               } catch (error: any) {
                    lastError = error;

                    if (attempt < maxAttempts) {
                         const delayMs = SNAPSHOT_CONFIG.RETRY_DELAYS_MS[attempt - 1] || 4000;
                         this.logger.log(LogLevel.DEBUG, 'Retrying operation', {
                              attempt,
                              maxAttempts,
                              delayMs
                         });
                         await this.delay(delayMs);
                    }
               }
          }

          throw lastError!;
     }

     /**
      * Delay helper for retry logic
      */
     private delay(ms: number): Promise<void> {
          return new Promise(resolve => setTimeout(resolve, ms));
     }

     /**
      * Detect primary language from file structure
      */
     private detectPrimaryLanguage(fileStructure: GitHubContent[]): string {
          const languageCount: Record<string, number> = {};

          for (const file of fileStructure) {
               if (file.type === 'file') {
                    const ext = file.path.split('.').pop()?.toLowerCase();
                    if (ext) {
                         const language = this.extensionToLanguage(ext);
                         languageCount[language] = (languageCount[language] || 0) + 1;
                    }
               }
          }

          // Find most common language
          let maxCount = 0;
          let primaryLanguage = 'unknown';
          for (const [lang, count] of Object.entries(languageCount)) {
               if (count > maxCount) {
                    maxCount = count;
                    primaryLanguage = lang;
               }
          }

          return primaryLanguage;
     }

     /**
      * Map file extension to language name
      */
     private extensionToLanguage(ext: string): string {
          const map: Record<string, string> = {
               ts: 'TypeScript',
               tsx: 'TypeScript',
               js: 'JavaScript',
               jsx: 'JavaScript',
               py: 'Python',
               java: 'Java',
               go: 'Go',
               rs: 'Rust',
               cpp: 'C++',
               c: 'C',
               cs: 'C#',
               rb: 'Ruby',
               php: 'PHP',
               swift: 'Swift',
               kt: 'Kotlin',
               scala: 'Scala',
               dart: 'Dart',
          };
          return map[ext] || 'unknown';
     }

     /**
      * Generate a hash for a snippet to use as cache key
      * Uses file path, line numbers, and code content
      */
     private generateSnippetHash(snippet: SnippetCandidate): string {
          const crypto = require('crypto');
          const content = `${snippet.filePath}:${snippet.startLine}:${snippet.endLine}:${snippet.code}`;
          return crypto.createHash('md5').update(content).digest('hex');
     }

     /**
      * Cache snippet selection results
      */
     private async cacheSnippetSelection(
          cacheKey: string,
          scoredSnippets: ScoredSnippet[]
     ): Promise<void> {
          try {
               await this.cacheService.cacheSnapshotAnalysis(
                    cacheKey,
                    scoredSnippets,
                    SNAPSHOT_CONFIG.SELECTION_CACHE_TTL_SECONDS
               );
               this.logger.log(LogLevel.DEBUG, 'Cached snippet selection results', {
                    cacheKey
               });
          } catch (error: any) {
               this.logger.log(LogLevel.WARN, 'Failed to cache snippet selection', {
                    error: error.message
               });
               // Don't throw - caching is optional
          }
     }

     /**
      * Get cached snippet selection results
      */
     private async getCachedSnippetSelection(cacheKey: string): Promise<ScoredSnippet[] | null> {
          try {
               const cached = await this.cacheService.getCachedSnapshotAnalysis(cacheKey);
               if (cached && Array.isArray(cached)) {
                    this.logger.log(LogLevel.DEBUG, 'Found cached snippet selection', {
                         cacheKey
                    });
                    return cached as ScoredSnippet[];
               }
               return null;
          } catch (error: any) {
               this.logger.log(LogLevel.WARN, 'Failed to get cached snippet selection', {
                    error: error.message
               });
               return null;
          }
     }

     /**
      * Handle and categorize errors
      */
     private handleError(error: any): Error {
          if (error.message?.includes('GitHub')) {
               return new Error('Unable to access repository. Please check permissions.');
          } else if (error.message?.includes('Gemini') || error.message?.includes('AI')) {
               return new Error('AI analysis temporarily unavailable. Using fallback scoring.');
          } else if (error.message?.includes('render') || error.message?.includes('image')) {
               return new Error('Image generation failed. Please try again later.');
          } else if (error.message?.includes('storage') || error.message?.includes('upload')) {
               return new Error('Failed to store snapshot image. Please try again.');
          }

          return new Error('Snapshot generation failed. Please try again later.');
     }

     /**
      * Get image dimensions from buffer
      * Uses sharp to extract width and height
      */
     private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
          try {
               const sharp = require('sharp');
               const metadata = await sharp(buffer).metadata();
               return {
                    width: metadata.width || SNAPSHOT_CONFIG.DEFAULT_IMAGE_WIDTH,
                    height: metadata.height || SNAPSHOT_CONFIG.DEFAULT_IMAGE_HEIGHT,
               };
          } catch (error) {
               this.logger.log(LogLevel.WARN, 'Failed to extract image dimensions, using defaults');
               return {
                    width: SNAPSHOT_CONFIG.DEFAULT_IMAGE_WIDTH,
                    height: SNAPSHOT_CONFIG.DEFAULT_IMAGE_HEIGHT,
               };
          }
     }
}
