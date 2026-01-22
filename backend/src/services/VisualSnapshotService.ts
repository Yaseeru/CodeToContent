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
     }

     /**
      * Initialize the service
      * Must be called before using the service
      */
     async initialize(): Promise<void> {
          console.log('[VisualSnapshot] Initializing service');

          // Initialize image rendering service
          await this.imageRenderingService.initialize();

          // Initialize storage service if it's LocalStorageService
          if (this.storageService instanceof LocalStorageService) {
               await this.storageService.initialize();
          }

          console.log('[VisualSnapshot] Service initialized successfully');
     }

     /**
      * Cleanup resources
      * Should be called when shutting down the service
      */
     async cleanup(): Promise<void> {
          console.log('[VisualSnapshot] Cleaning up service');
          await this.imageRenderingService.cleanup();
          console.log('[VisualSnapshot] Service cleanup complete');
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
               console.log(`[VisualSnapshot] Starting snapshot generation for repository ${repositoryId}`);

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
                         console.log(`[VisualSnapshot] Returning ${existingSnapshots.length} cached snapshots`);
                         return existingSnapshots;
                    }
               }

               // Step 3: Initialize GitHub service and fetch repository data
               const githubService = new GitHubService(githubAccessToken);
               const [owner, repo] = repository.fullName.split('/');

               const [commits, fileStructure] = await Promise.all([
                    githubService.fetchCommitHistory(owner, repo, 50),
                    githubService.fetchFileStructure(owner, repo),
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

               // Step 5: Identify and filter candidate snippets
               // Check cache first for snippet selection results
               const selectionCacheKey = `${repositoryId}:${latestCommitSha}`;
               let scoredSnippets = await this.getCachedSnippetSelection(selectionCacheKey);

               if (!scoredSnippets) {
                    console.log('[VisualSnapshot] Snippet selection cache miss, performing selection');

                    const candidates = await this.snippetSelectionService.identifyCandidates(
                         fileStructure,
                         commits,
                         analysis
                    );

                    const filteredCandidates = this.snippetSelectionService.filterBoilerplate(candidates);

                    if (filteredCandidates.length === 0) {
                         console.log('[VisualSnapshot] No suitable code snippets found');
                         return [];
                    }

                    // Limit candidates to analyze
                    const candidatesToScore = filteredCandidates.slice(
                         0,
                         SNAPSHOT_CONFIG.MAX_CANDIDATES_TO_SCORE
                    );

                    console.log(`[VisualSnapshot] Scoring ${candidatesToScore.length} candidate snippets`);

                    // Step 6: Score snippets with AI (parallel processing in batches)
                    scoredSnippets = await this.scoreSnippetsInParallel(
                         candidatesToScore,
                         context
                    );

                    // Cache the scored snippets for future use
                    await this.cacheSnippetSelection(selectionCacheKey, scoredSnippets);
               } else {
                    console.log('[VisualSnapshot] Using cached snippet selection results');
               }

               // Step 7: Select top N snippets
               const maxSnippets = options?.maxSnippets || SNAPSHOT_CONFIG.MAX_SNIPPETS_PER_REPOSITORY;
               const topSnippets = scoredSnippets
                    .sort((a, b) => b.selectionScore - a.selectionScore)
                    .slice(0, maxSnippets);

               console.log(`[VisualSnapshot] Selected ${topSnippets.length} top snippets for rendering`);

               // Step 8: Fetch code content and render snippets to images
               const snapshots: ICodeSnapshot[] = [];

               for (const snippet of topSnippets) {
                    try {
                         console.log(`[VisualSnapshot] Rendering snippet from ${snippet.filePath}`);

                         // Fetch the actual code content from GitHub
                         const codeContent = await githubService.fetchFileContent(owner, repo, snippet.filePath);

                         // Extract the specific lines for this snippet
                         const lines = codeContent.split('\n');
                         const snippetCode = lines.slice(snippet.startLine - 1, snippet.endLine).join('\n');

                         if (!snippetCode || snippetCode.trim().length === 0) {
                              console.warn(`[VisualSnapshot] Empty code snippet for ${snippet.filePath}, skipping`);
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

                         console.log(`[VisualSnapshot] Successfully rendered and stored snapshot for ${snippet.filePath}`);
                    } catch (error: any) {
                         console.error(`[VisualSnapshot] Failed to render snippet from ${snippet.filePath}:`, error.message);
                         // Continue with other snippets even if one fails
                    }
               }

               console.log(`[VisualSnapshot] Successfully generated ${snapshots.length} snapshots`);
               return snapshots;
          } catch (error: any) {
               console.error('[VisualSnapshot] Snapshot generation failed:', error.message);
               throw this.handleError(error);
          }
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
               console.log(`[VisualSnapshot] Fetching snapshots for repository ${repositoryId}`);

               const snapshots = await CodeSnapshot.find({
                    repositoryId: new mongoose.Types.ObjectId(repositoryId),
                    userId: new mongoose.Types.ObjectId(userId),
                    isStale: false,
               })
                    .sort({ selectionScore: -1 })
                    .exec();

               console.log(`[VisualSnapshot] Found ${snapshots.length} non-stale snapshots`);
               return snapshots;
          } catch (error: any) {
               console.error('[VisualSnapshot] Failed to fetch snapshots:', error.message);
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
               console.log(`[VisualSnapshot] Invalidating stale snapshots for repository ${repositoryId}`);

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

               console.log(`[VisualSnapshot] Marked ${result.modifiedCount} snapshots as stale`);

               // Clear Redis cache for this repository
               // Cache keys follow pattern: snapshot:analysis:{repositoryId}:{commitSha}
               // We'll implement a simple pattern-based deletion
               await this.clearSnapshotCache(repositoryId);
          } catch (error: any) {
               console.error('[VisualSnapshot] Failed to invalidate snapshots:', error.message);
               throw this.handleError(error);
          }
     }

     /**
      * Clear snapshot cache for a repository
      */
     private async clearSnapshotCache(repositoryId: string): Promise<void> {
          try {
               await this.cacheService.invalidateSnapshotCache(repositoryId);
               console.log(`[VisualSnapshot] Cleared snapshot cache for repository ${repositoryId}`);
          } catch (error: any) {
               console.warn('[VisualSnapshot] Failed to clear cache:', error.message);
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
                    console.log(`[VisualSnapshot] Using cached AI analysis for ${snippet.filePath}`);
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
               console.warn('[VisualSnapshot] AI scoring failed, falling back to heuristic:', error.message);

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
                         console.log(`[VisualSnapshot] Retry attempt ${attempt}/${maxAttempts} after ${delayMs}ms`);
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
               console.log(`[VisualSnapshot] Cached snippet selection results for key ${cacheKey}`);
          } catch (error: any) {
               console.warn('[VisualSnapshot] Failed to cache snippet selection:', error.message);
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
                    console.log(`[VisualSnapshot] Found cached snippet selection for key ${cacheKey}`);
                    return cached as ScoredSnippet[];
               }
               return null;
          } catch (error: any) {
               console.warn('[VisualSnapshot] Failed to get cached snippet selection:', error.message);
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
               console.warn('[VisualSnapshot] Failed to extract image dimensions, using defaults');
               return {
                    width: SNAPSHOT_CONFIG.DEFAULT_IMAGE_WIDTH,
                    height: SNAPSHOT_CONFIG.DEFAULT_IMAGE_HEIGHT,
               };
          }
     }
}
