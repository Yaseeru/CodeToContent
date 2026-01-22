import { SnippetSelectionService, SnippetCandidate, RepositoryContext } from '../SnippetSelectionService';
import { GitHubContent, GitHubCommit } from '../GitHubService';
import { IAnalysis } from '../../models/Analysis';

describe('SnippetSelectionService', () => {
     let service: SnippetSelectionService;

     beforeEach(() => {
          service = new SnippetSelectionService();
     });

     describe('identifyCandidates', () => {
          it('should identify code files from file structure', async () => {
               const fileStructure: GitHubContent[] = [
                    { name: 'index.ts', path: 'src/index.ts', type: 'file', size: 1000 },
                    { name: 'utils.ts', path: 'src/utils.ts', type: 'file', size: 500 },
                    { name: 'README.md', path: 'README.md', type: 'file', size: 2000 },
               ];

               const commits: GitHubCommit[] = [
                    {
                         sha: 'abc123',
                         commit: {
                              message: 'Initial commit',
                              author: {
                                   name: 'Test User',
                                   email: 'test@example.com',
                                   date: new Date().toISOString(),
                              },
                         },
                         html_url: 'https://github.com/test/repo/commit/abc123',
                    },
               ];

               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates.length).toBe(2); // Only .ts files
               expect(candidates[0].filePath).toBe('src/index.ts');
               expect(candidates[1].filePath).toBe('src/utils.ts');
          });

          it('should skip files that are too small', async () => {
               const fileStructure: GitHubContent[] = [
                    { name: 'tiny.ts', path: 'src/tiny.ts', type: 'file', size: 50 },
                    { name: 'normal.ts', path: 'src/normal.ts', type: 'file', size: 1000 },
               ];

               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates.length).toBe(1);
               expect(candidates[0].filePath).toBe('src/normal.ts');
          });

          it('should skip files that are too large', async () => {
               const fileStructure: GitHubContent[] = [
                    { name: 'huge.ts', path: 'src/huge.ts', type: 'file', size: 100000 },
                    { name: 'normal.ts', path: 'src/normal.ts', type: 'file', size: 1000 },
               ];

               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates.length).toBe(1);
               expect(candidates[0].filePath).toBe('src/normal.ts');
          });

          it('should detect language from file extension', async () => {
               const fileStructure: GitHubContent[] = [
                    { name: 'app.ts', path: 'src/app.ts', type: 'file', size: 1000 },
                    { name: 'main.py', path: 'src/main.py', type: 'file', size: 1000 },
                    { name: 'server.go', path: 'src/server.go', type: 'file', size: 1000 },
               ];

               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates[0].language).toBe('typescript');
               expect(candidates[1].language).toBe('python');
               expect(candidates[2].language).toBe('go');
          });

          it('should handle empty file structure', async () => {
               const fileStructure: GitHubContent[] = [];
               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates).toEqual([]);
          });

          it('should handle directories in file structure', async () => {
               const fileStructure: GitHubContent[] = [
                    { name: 'src', path: 'src', type: 'dir' },
                    { name: 'index.ts', path: 'src/index.ts', type: 'file', size: 1000 },
               ];

               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates.length).toBe(1);
               expect(candidates[0].filePath).toBe('src/index.ts');
          });
     });

     describe('filterBoilerplate', () => {
          it('should filter out config files', () => {
               const candidates: SnippetCandidate[] = [
                    {
                         filePath: 'webpack.config.js',
                         startLine: 1,
                         endLine: 50,
                         language: 'javascript',
                         linesOfCode: 50,
                         code: '',
                    },
                    {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 50,
                         language: 'typescript',
                         linesOfCode: 50,
                         code: '',
                    },
               ];

               const filtered = service.filterBoilerplate(candidates);

               expect(filtered.length).toBe(1);
               expect(filtered[0].filePath).toBe('src/index.ts');
          });

          it('should filter out test files', () => {
               const candidates: SnippetCandidate[] = [
                    {
                         filePath: 'src/index.test.ts',
                         startLine: 1,
                         endLine: 50,
                         language: 'typescript',
                         linesOfCode: 50,
                         code: '',
                    },
                    {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 50,
                         language: 'typescript',
                         linesOfCode: 50,
                         code: '',
                    },
               ];

               const filtered = service.filterBoilerplate(candidates);

               expect(filtered.length).toBe(1);
               expect(filtered[0].filePath).toBe('src/index.ts');
          });

          it('should filter out generated files', () => {
               const candidates: SnippetCandidate[] = [
                    {
                         filePath: 'dist/bundle.min.js',
                         startLine: 1,
                         endLine: 50,
                         language: 'javascript',
                         linesOfCode: 50,
                         code: '',
                    },
                    {
                         filePath: 'src/index.ts',
                         startLine: 1,
                         endLine: 50,
                         language: 'typescript',
                         linesOfCode: 50,
                         code: '',
                    },
               ];

               const filtered = service.filterBoilerplate(candidates);

               expect(filtered.length).toBe(1);
               expect(filtered[0].filePath).toBe('src/index.ts');
          });

          it('should filter out snippets with too few lines', () => {
               const candidates: SnippetCandidate[] = [
                    {
                         filePath: 'src/tiny.ts',
                         startLine: 1,
                         endLine: 5,
                         language: 'typescript',
                         linesOfCode: 5,
                         code: '',
                    },
                    {
                         filePath: 'src/normal.ts',
                         startLine: 1,
                         endLine: 50,
                         language: 'typescript',
                         linesOfCode: 50,
                         code: '',
                    },
               ];

               const filtered = service.filterBoilerplate(candidates);

               expect(filtered.length).toBe(1);
               expect(filtered[0].filePath).toBe('src/normal.ts');
          });

          it('should filter out snippets with too many lines', () => {
               const candidates: SnippetCandidate[] = [
                    {
                         filePath: 'src/huge.ts',
                         startLine: 1,
                         endLine: 150,
                         language: 'typescript',
                         linesOfCode: 150,
                         code: '',
                    },
                    {
                         filePath: 'src/normal.ts',
                         startLine: 1,
                         endLine: 50,
                         language: 'typescript',
                         linesOfCode: 50,
                         code: '',
                    },
               ];

               const filtered = service.filterBoilerplate(candidates);

               expect(filtered.length).toBe(1);
               expect(filtered[0].filePath).toBe('src/normal.ts');
          });

          it('should handle empty candidate list', () => {
               const candidates: SnippetCandidate[] = [];
               const filtered = service.filterBoilerplate(candidates);
               expect(filtered).toEqual([]);
          });
     });

     describe('calculateHeuristicScore', () => {
          const createContext = (): RepositoryContext => ({
               repoName: 'test-repo',
               repoDescription: 'Test repository',
               primaryLanguage: 'TypeScript',
               recentCommits: [
                    {
                         sha: 'abc123',
                         commit: {
                              message: 'Recent commit',
                              author: {
                                   name: 'Test User',
                                   email: 'test@example.com',
                                   date: new Date().toISOString(),
                              },
                         },
                         html_url: 'https://github.com/test/repo/commit/abc123',
                    },
               ],
               fileStructure: [],
          });

          it('should score recent changes higher', () => {
               const context = createContext();

               const recentSnippet: SnippetCandidate = {
                    filePath: 'src/index.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
                    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
               };

               const oldSnippet: SnippetCandidate = {
                    filePath: 'src/old.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
                    lastModified: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
               };

               const recentScore = service.calculateHeuristicScore(recentSnippet, context);
               const oldScore = service.calculateHeuristicScore(oldSnippet, context);

               expect(recentScore).toBeGreaterThan(oldScore);
          });

          it('should score optimal LOC (20-50 lines) highest', () => {
               const context = createContext();

               const optimalSnippet: SnippetCandidate = {
                    filePath: 'src/optimal.ts',
                    startLine: 1,
                    endLine: 35,
                    language: 'typescript',
                    linesOfCode: 35,
                    code: '',
               };

               const tooShortSnippet: SnippetCandidate = {
                    filePath: 'src/short.ts',
                    startLine: 1,
                    endLine: 15,
                    language: 'typescript',
                    linesOfCode: 15,
                    code: '',
               };

               const optimalScore = service.calculateHeuristicScore(optimalSnippet, context);
               const shortScore = service.calculateHeuristicScore(tooShortSnippet, context);

               expect(optimalScore).toBeGreaterThan(shortScore);
          });

          it('should score core files higher', () => {
               const context = createContext();

               const coreSnippet: SnippetCandidate = {
                    filePath: 'src/index.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
               };

               const utilSnippet: SnippetCandidate = {
                    filePath: 'src/utils/helper.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
               };

               const coreScore = service.calculateHeuristicScore(coreSnippet, context);
               const utilScore = service.calculateHeuristicScore(utilSnippet, context);

               expect(coreScore).toBeGreaterThan(utilScore);
          });

          it('should score public API functions higher', () => {
               const context = createContext();

               const apiSnippet: SnippetCandidate = {
                    filePath: 'src/api.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
                    functionName: 'getUserData',
               };

               const noFunctionSnippet: SnippetCandidate = {
                    filePath: 'src/api.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
               };

               const apiScore = service.calculateHeuristicScore(apiSnippet, context);
               const noFunctionScore = service.calculateHeuristicScore(noFunctionSnippet, context);

               expect(apiScore).toBeGreaterThan(noFunctionScore);
          });

          it('should return score between 0 and 100', () => {
               const context = createContext();

               const snippet: SnippetCandidate = {
                    filePath: 'src/index.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
                    functionName: 'calculateComplexScore',
                    lastModified: new Date(),
               };

               const score = service.calculateHeuristicScore(snippet, context);

               expect(score).toBeGreaterThanOrEqual(0);
               expect(score).toBeLessThanOrEqual(100);
          });

          it('should handle snippet without lastModified date', () => {
               const context = createContext();

               const snippet: SnippetCandidate = {
                    filePath: 'src/index.ts',
                    startLine: 1,
                    endLine: 30,
                    language: 'typescript',
                    linesOfCode: 30,
                    code: '',
               };

               const score = service.calculateHeuristicScore(snippet, context);

               expect(score).toBeGreaterThanOrEqual(0);
               expect(score).toBeLessThanOrEqual(100);
          });
     });

     describe('edge cases', () => {
          it('should handle repository with no recent changes', async () => {
               const fileStructure: GitHubContent[] = [
                    { name: 'index.ts', path: 'src/index.ts', type: 'file', size: 1000 },
               ];

               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates.length).toBe(1);
               expect(candidates[0].lastModified).toBeUndefined();
          });

          it('should handle empty repository', async () => {
               const fileStructure: GitHubContent[] = [];
               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates).toEqual([]);
          });

          it('should handle repository with only non-code files', async () => {
               const fileStructure: GitHubContent[] = [
                    { name: 'README.md', path: 'README.md', type: 'file', size: 1000 },
                    { name: 'LICENSE', path: 'LICENSE', type: 'file', size: 500 },
                    { name: 'package.json', path: 'package.json', type: 'file', size: 300 },
               ];

               const commits: GitHubCommit[] = [];
               const analysis = {} as IAnalysis;

               const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

               expect(candidates).toEqual([]);
          });
     });
});
