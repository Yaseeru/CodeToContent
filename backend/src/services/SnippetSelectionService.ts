import { GitHubContent, GitHubCommit } from './GitHubService';
import { IAnalysis } from '../models/Analysis';

/**
 * Represents a candidate code snippet for visualization
 */
export interface SnippetCandidate {
     filePath: string;
     startLine: number;
     endLine: number;
     functionName?: string;
     language: string;
     linesOfCode: number;
     code: string;
     lastModified?: Date;
}

/**
 * Context about the repository for scoring
 */
export interface RepositoryContext {
     repoName: string;
     repoDescription: string;
     primaryLanguage: string;
     recentCommits: GitHubCommit[];
     fileStructure: GitHubContent[];
}

/**
 * Service for selecting interesting code snippets from repositories
 * Uses heuristic-based scoring as fallback when AI is unavailable
 */
export class SnippetSelectionService {
     /**
      * Identify candidate code snippets from repository files
      */
     async identifyCandidates(
          fileStructure: GitHubContent[],
          commits: GitHubCommit[],
          analysis: IAnalysis
     ): Promise<SnippetCandidate[]> {
          const candidates: SnippetCandidate[] = [];

          // Filter to only code files (exclude configs, tests, etc.)
          const codeFiles = this.filterCodeFiles(fileStructure);

          // For each code file, create snippet candidates
          for (const file of codeFiles) {
               // Skip files that are too large or too small
               if (!file.size || file.size < 100 || file.size > 50000) {
                    continue;
               }

               // Determine if file was recently modified
               const lastModified = this.getLastModifiedDate(file.path, commits);

               // Create a candidate for the file
               // In a real implementation, we would fetch the file content and parse functions
               // For now, we'll create a placeholder candidate
               const candidate: SnippetCandidate = {
                    filePath: file.path,
                    startLine: 1,
                    endLine: this.estimateLines(file.size),
                    language: this.detectLanguage(file.path),
                    linesOfCode: this.estimateLines(file.size),
                    code: '', // Would be fetched from GitHub
                    lastModified,
               };

               candidates.push(candidate);
          }

          return candidates;
     }

     /**
      * Filter out boilerplate and uninteresting code
      */
     filterBoilerplate(candidates: SnippetCandidate[]): SnippetCandidate[] {
          return candidates.filter(candidate => {
               // Filter out config files
               if (this.isConfigFile(candidate.filePath)) {
                    return false;
               }

               // Filter out test files
               if (this.isTestFile(candidate.filePath)) {
                    return false;
               }

               // Filter out generated files
               if (this.isGeneratedFile(candidate.filePath)) {
                    return false;
               }

               // Filter out files with too few or too many lines
               if (candidate.linesOfCode < 10 || candidate.linesOfCode > 100) {
                    return false;
               }

               return true;
          });
     }

     /**
      * Calculate heuristic score for a snippet (0-100)
      * Used as fallback when Gemini AI is unavailable
      */
     calculateHeuristicScore(
          snippet: SnippetCandidate,
          context: RepositoryContext
     ): number {
          let score = 0;

          // Recency score (0-30 points)
          score += this.calculateRecencyScore(snippet, context.recentCommits);

          // Complexity/LOC score (0-30 points)
          score += this.calculateComplexityScore(snippet);

          // File type score (0-20 points)
          score += this.calculateFileTypeScore(snippet, context);

          // Function name score (0-20 points)
          score += this.calculateFunctionNameScore(snippet);

          return Math.min(score, 100);
     }

     /**
      * Calculate recency score based on last modification (0-30 points)
      */
     private calculateRecencyScore(
          snippet: SnippetCandidate,
          commits: GitHubCommit[]
     ): number {
          if (!snippet.lastModified) {
               return 0;
          }

          const daysSinceChange = this.getDaysSinceLastChange(snippet, commits);

          if (daysSinceChange <= 7) {
               return 30; // Very recent
          } else if (daysSinceChange <= 30) {
               return 20; // Recent
          } else if (daysSinceChange <= 90) {
               return 10; // Somewhat recent
          }

          return 0; // Old
     }

     /**
      * Calculate complexity score based on lines of code (0-30 points)
      */
     private calculateComplexityScore(snippet: SnippetCandidate): number {
          const loc = snippet.linesOfCode;

          // Sweet spot: 20-50 lines
          if (loc >= 20 && loc <= 50) {
               return 30;
          } else if (loc >= 10 && loc < 20) {
               return 20;
          } else if (loc > 50 && loc <= 100) {
               return 15;
          }

          return 5;
     }

     /**
      * Calculate file type score (0-20 points)
      */
     private calculateFileTypeScore(
          snippet: SnippetCandidate,
          context: RepositoryContext
     ): number {
          if (this.isCoreFile(snippet.filePath, context)) {
               return 20; // Core application files
          } else if (this.isServiceFile(snippet.filePath)) {
               return 15; // Service/business logic files
          } else if (this.isUtilityFile(snippet.filePath)) {
               return 10; // Utility files
          }

          return 5; // Other files
     }

     /**
      * Calculate function name score (0-20 points)
      */
     private calculateFunctionNameScore(snippet: SnippetCandidate): number {
          if (!snippet.functionName) {
               return 5; // No function name
          }

          if (this.isPublicAPI(snippet.functionName)) {
               return 20; // Public API methods
          } else if (this.isComplexFunction(snippet.functionName)) {
               return 15; // Complex functions
          }

          return 10; // Regular functions
     }

     /**
      * Get days since last change for a file
      */
     private getDaysSinceLastChange(
          snippet: SnippetCandidate,
          commits: GitHubCommit[]
     ): number {
          if (!snippet.lastModified) {
               return Infinity;
          }

          const now = new Date();
          const diffMs = now.getTime() - snippet.lastModified.getTime();
          return Math.floor(diffMs / (1000 * 60 * 60 * 24));
     }

     /**
      * Get last modified date for a file from commit history
      */
     private getLastModifiedDate(
          filePath: string,
          commits: GitHubCommit[]
     ): Date | undefined {
          // Find the most recent commit that modified this file
          // In a real implementation, we would check commit file changes
          // For now, return the most recent commit date if available
          if (commits.length > 0) {
               return new Date(commits[0].commit.author.date);
          }
          return undefined;
     }

     /**
      * Filter to only code files (exclude configs, tests, etc.)
      */
     private filterCodeFiles(fileStructure: GitHubContent[]): GitHubContent[] {
          return fileStructure.filter(file => {
               if (file.type !== 'file') {
                    return false;
               }

               const ext = this.getFileExtension(file.path);
               const codeExtensions = [
                    'ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'h',
                    'cs', 'rb', 'php', 'swift', 'kt', 'scala', 'dart'
               ];

               return codeExtensions.includes(ext);
          });
     }

     /**
      * Check if file is a config file
      */
     private isConfigFile(filePath: string): boolean {
          const configPatterns = [
               /\.config\.(ts|js)$/,
               /^\..*rc$/,
               /package\.json$/,
               /tsconfig\.json$/,
               /webpack\.config/,
               /vite\.config/,
               /jest\.config/,
               /\.env/,
          ];

          return configPatterns.some(pattern => pattern.test(filePath));
     }

     /**
      * Check if file is a test file
      */
     private isTestFile(filePath: string): boolean {
          const testPatterns = [
               /\.test\.(ts|tsx|js|jsx)$/,
               /\.spec\.(ts|tsx|js|jsx)$/,
               /__tests__\//,
               /test\//,
               /tests\//,
          ];

          return testPatterns.some(pattern => pattern.test(filePath));
     }

     /**
      * Check if file is generated
      */
     private isGeneratedFile(filePath: string): boolean {
          const generatedPatterns = [
               /\.generated\./,
               /\.min\.(js|css)$/,
               /dist\//,
               /build\//,
               /node_modules\//,
          ];

          return generatedPatterns.some(pattern => pattern.test(filePath));
     }

     /**
      * Check if file is a core application file
      */
     private isCoreFile(filePath: string, context: RepositoryContext): boolean {
          // Check if file is in main source directory
          const corePatterns = [
               /^src\/index\./,
               /^src\/main\./,
               /^src\/app\./,
               /^src\/server\./,
               /^index\./,
               /^main\./,
          ];

          return corePatterns.some(pattern => pattern.test(filePath));
     }

     /**
      * Check if file is a service file
      */
     private isServiceFile(filePath: string): boolean {
          return /service|controller|handler|api/i.test(filePath);
     }

     /**
      * Check if file is a utility file
      */
     private isUtilityFile(filePath: string): boolean {
          return /util|helper|lib|common/i.test(filePath);
     }

     /**
      * Check if function name suggests public API
      */
     private isPublicAPI(functionName: string): boolean {
          // Public API methods often start with verbs like get, set, create, update, delete
          const apiPatterns = [
               /^(get|set|create|update|delete|fetch|save|remove)/i,
               /^handle/i,
               /^process/i,
          ];

          return apiPatterns.some(pattern => pattern.test(functionName));
     }

     /**
      * Check if function name suggests complexity
      */
     private isComplexFunction(functionName: string): boolean {
          // Complex functions often have longer names or specific keywords
          return (
               functionName.length > 15 ||
               /calculate|compute|analyze|process|transform|validate/i.test(functionName)
          );
     }

     /**
      * Detect programming language from file path
      */
     private detectLanguage(filePath: string): string {
          const ext = this.getFileExtension(filePath);
          const languageMap: Record<string, string> = {
               ts: 'typescript',
               tsx: 'tsx',
               js: 'javascript',
               jsx: 'jsx',
               py: 'python',
               java: 'java',
               go: 'go',
               rs: 'rust',
               cpp: 'cpp',
               c: 'c',
               h: 'c',
               cs: 'csharp',
               rb: 'ruby',
               php: 'php',
               swift: 'swift',
               kt: 'kotlin',
               scala: 'scala',
               dart: 'dart',
          };

          return languageMap[ext] || 'text';
     }

     /**
      * Get file extension from path
      */
     private getFileExtension(filePath: string): string {
          const parts = filePath.split('.');
          return parts.length > 1 ? parts[parts.length - 1] : '';
     }

     /**
      * Estimate lines of code from file size
      */
     private estimateLines(fileSize: number): number {
          // Rough estimate: 40 bytes per line on average
          return Math.floor(fileSize / 40);
     }
}
