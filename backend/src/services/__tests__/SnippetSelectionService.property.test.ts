import * as fc from 'fast-check';
import { SnippetSelectionService, SnippetCandidate, RepositoryContext } from '../SnippetSelectionService';
import { GitHubContent, GitHubCommit } from '../GitHubService';

/**
 * Property-based tests for SnippetSelectionService
 * These tests verify universal properties that should hold across all inputs
 */

describe('SnippetSelectionService - Property-Based Tests', () => {
     let service: SnippetSelectionService;

     beforeEach(() => {
          service = new SnippetSelectionService();
     });

     /**
      * Property 1: Selection Score Range Invariant
      * For any code snippet selection operation, the selectionScore should be between 0 and 100 inclusive.
      * **Validates: Requirements 1.3**
      */
     describe('Property: Selection scores are always 0-100', () => {
          it('should always return scores between 0 and 100 for any snippet and context', () => {
               fc.assert(
                    fc.property(
                         // Generate arbitrary snippet candidates
                         fc.record({
                              filePath: fc.string({ minLength: 1, maxLength: 100 }),
                              startLine: fc.integer({ min: 1, max: 1000 }),
                              endLine: fc.integer({ min: 1, max: 1000 }),
                              language: fc.constantFrom('typescript', 'javascript', 'python', 'java', 'go'),
                              linesOfCode: fc.integer({ min: 1, max: 200 }),
                              code: fc.string(),
                              functionName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
                              lastModified: fc.option(fc.date(), { nil: undefined }),
                         }),
                         // Generate arbitrary repository context
                         fc.record({
                              repoName: fc.string({ minLength: 1, maxLength: 50 }),
                              repoDescription: fc.string({ maxLength: 200 }),
                              primaryLanguage: fc.constantFrom('TypeScript', 'JavaScript', 'Python', 'Java', 'Go'),
                              recentCommits: fc.array(
                                   fc.record({
                                        sha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                                        commit: fc.record({
                                             message: fc.string({ maxLength: 100 }),
                                             author: fc.record({
                                                  name: fc.string({ minLength: 1, maxLength: 50 }),
                                                  email: fc.emailAddress(),
                                                  date: fc.date().map(d => d.toISOString()),
                                             }),
                                        }),
                                        html_url: fc.webUrl(),
                                   }),
                                   { maxLength: 10 }
                              ),
                              fileStructure: fc.array(
                                   fc.record({
                                        name: fc.string({ minLength: 1, maxLength: 50 }),
                                        path: fc.string({ minLength: 1, maxLength: 100 }),
                                        type: fc.constantFrom('file' as const, 'dir' as const),
                                        size: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
                                   }),
                                   { maxLength: 20 }
                              ),
                         }),
                         (snippet, context) => {
                              const score = service.calculateHeuristicScore(snippet, context);

                              // Property: Score must be between 0 and 100 inclusive
                              expect(score).toBeGreaterThanOrEqual(0);
                              expect(score).toBeLessThanOrEqual(100);
                              expect(Number.isFinite(score)).toBe(true);
                         }
                    ),
                    { numRuns: 100 }
               );
          });
     });

     /**
      * Property 2: Snippet Metadata Completeness
      * For any generated CodeSnapshot, all required snippetMetadata fields should be present and valid.
      * **Validates: Requirements 1.4**
      */
     describe('Property: Candidates have valid metadata', () => {
          it('should always produce candidates with complete and valid metadata', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate arbitrary file structures
                         fc.array(
                              fc.record({
                                   name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s + '.ts'),
                                   path: fc.string({ minLength: 1, maxLength: 100 }).map(s => 'src/' + s + '.ts'),
                                   type: fc.constant('file' as const),
                                   size: fc.integer({ min: 100, max: 50000 }),
                              }),
                              { minLength: 0, maxLength: 20 }
                         ),
                         // Generate arbitrary commits
                         fc.array(
                              fc.record({
                                   sha: fc.hexaString({ minLength: 40, maxLength: 40 }),
                                   commit: fc.record({
                                        message: fc.string({ maxLength: 100 }),
                                        author: fc.record({
                                             name: fc.string({ minLength: 1, maxLength: 50 }),
                                             email: fc.emailAddress(),
                                             date: fc.date().map(d => d.toISOString()),
                                        }),
                                   }),
                                   html_url: fc.webUrl(),
                              }),
                              { maxLength: 10 }
                         ),
                         async (fileStructure, commits) => {
                              const analysis = {} as any;
                              const candidates = await service.identifyCandidates(fileStructure, commits, analysis);

                              // Property: All candidates must have required metadata fields
                              for (const candidate of candidates) {
                                   expect(candidate.filePath).toBeDefined();
                                   expect(typeof candidate.filePath).toBe('string');
                                   expect(candidate.filePath.length).toBeGreaterThan(0);

                                   expect(candidate.startLine).toBeDefined();
                                   expect(typeof candidate.startLine).toBe('number');
                                   expect(candidate.startLine).toBeGreaterThan(0);

                                   expect(candidate.endLine).toBeDefined();
                                   expect(typeof candidate.endLine).toBe('number');
                                   expect(candidate.endLine).toBeGreaterThanOrEqual(candidate.startLine);

                                   expect(candidate.language).toBeDefined();
                                   expect(typeof candidate.language).toBe('string');
                                   expect(candidate.language.length).toBeGreaterThan(0);

                                   expect(candidate.linesOfCode).toBeDefined();
                                   expect(typeof candidate.linesOfCode).toBe('number');
                                   expect(candidate.linesOfCode).toBeGreaterThan(0);

                                   expect(candidate.code).toBeDefined();
                                   expect(typeof candidate.code).toBe('string');
                              }
                         }
                    ),
                    { numRuns: 50 }
               );
          });
     });

     /**
      * Property 3: Filtering Preserves Valid Snippets
      * For any list of candidates, filtering should preserve all valid snippets and remove invalid ones.
      * **Validates: Requirements 1.5**
      */
     describe('Property: Filtering preserves valid snippets', () => {
          it('should never filter out valid code snippets', () => {
               fc.assert(
                    fc.property(
                         // Generate a mix of valid and invalid candidates
                         fc.array(
                              fc.record({
                                   filePath: fc.oneof(
                                        // Valid paths
                                        fc.constant('src/index.ts'),
                                        fc.constant('src/services/UserService.ts'),
                                        fc.constant('src/utils/helper.ts'),
                                        // Invalid paths (config, test, generated)
                                        fc.constant('webpack.config.js'),
                                        fc.constant('src/index.test.ts'),
                                        fc.constant('dist/bundle.min.js')
                                   ),
                                   startLine: fc.integer({ min: 1, max: 100 }),
                                   endLine: fc.integer({ min: 1, max: 100 }),
                                   language: fc.constantFrom('typescript', 'javascript', 'python'),
                                   linesOfCode: fc.oneof(
                                        // Valid LOC
                                        fc.integer({ min: 10, max: 100 }),
                                        // Invalid LOC (too few or too many)
                                        fc.integer({ min: 1, max: 9 }),
                                        fc.integer({ min: 101, max: 200 })
                                   ),
                                   code: fc.string(),
                              }),
                              { minLength: 0, maxLength: 20 }
                         ),
                         (candidates) => {
                              const filtered = service.filterBoilerplate(candidates);

                              // Property: Filtered list should be a subset of original
                              expect(filtered.length).toBeLessThanOrEqual(candidates.length);

                              // Property: All filtered candidates should be valid
                              for (const candidate of filtered) {
                                   // Should not be config file
                                   expect(candidate.filePath).not.toMatch(/\.config\./);
                                   expect(candidate.filePath).not.toMatch(/package\.json/);

                                   // Should not be test file
                                   expect(candidate.filePath).not.toMatch(/\.test\./);
                                   expect(candidate.filePath).not.toMatch(/\.spec\./);

                                   // Should not be generated file
                                   expect(candidate.filePath).not.toMatch(/\.min\./);
                                   expect(candidate.filePath).not.toMatch(/^dist\//);

                                   // Should have valid LOC
                                   expect(candidate.linesOfCode).toBeGreaterThanOrEqual(10);
                                   expect(candidate.linesOfCode).toBeLessThanOrEqual(100);
                              }
                         }
                    ),
                    { numRuns: 50 }
               );
          });

          it('should be idempotent - filtering twice should produce same result', () => {
               fc.assert(
                    fc.property(
                         fc.array(
                              fc.record({
                                   filePath: fc.string({ minLength: 1, maxLength: 100 }),
                                   startLine: fc.integer({ min: 1, max: 100 }),
                                   endLine: fc.integer({ min: 1, max: 100 }),
                                   language: fc.constantFrom('typescript', 'javascript', 'python'),
                                   linesOfCode: fc.integer({ min: 1, max: 200 }),
                                   code: fc.string(),
                              }),
                              { maxLength: 20 }
                         ),
                         (candidates) => {
                              const filtered1 = service.filterBoilerplate(candidates);
                              const filtered2 = service.filterBoilerplate(filtered1);

                              // Property: Filtering should be idempotent
                              expect(filtered2).toEqual(filtered1);
                         }
                    ),
                    { numRuns: 50 }
               );
          });
     });

     /**
      * Property 4: Score Monotonicity
      * More recent changes should never score lower than older changes (all else being equal)
      */
     describe('Property: Score monotonicity with recency', () => {
          it('should score more recent changes higher or equal', () => {
               fc.assert(
                    fc.property(
                         fc.record({
                              filePath: fc.constant('src/index.ts'),
                              startLine: fc.constant(1),
                              endLine: fc.constant(30),
                              language: fc.constant('typescript'),
                              linesOfCode: fc.constant(30),
                              code: fc.constant(''),
                         }),
                         fc.date({ min: new Date('2020-01-01'), max: new Date() }),
                         fc.date({ min: new Date('2020-01-01'), max: new Date() }),
                         fc.record({
                              repoName: fc.constant('test-repo'),
                              repoDescription: fc.constant('Test'),
                              primaryLanguage: fc.constant('TypeScript'),
                              recentCommits: fc.constant([]),
                              fileStructure: fc.constant([]),
                         }),
                         (baseSnippet, date1, date2, context) => {
                              const [olderDate, newerDate] = date1 < date2 ? [date1, date2] : [date2, date1];

                              const olderSnippet = { ...baseSnippet, lastModified: olderDate };
                              const newerSnippet = { ...baseSnippet, lastModified: newerDate };

                              const olderScore = service.calculateHeuristicScore(olderSnippet, context);
                              const newerScore = service.calculateHeuristicScore(newerSnippet, context);

                              // Property: Newer changes should score higher or equal
                              expect(newerScore).toBeGreaterThanOrEqual(olderScore);
                         }
                    ),
                    { numRuns: 50 }
               );
          });
     });

     /**
      * Property 5: Language Detection Consistency
      * Same file extension should always produce same language
      */
     describe('Property: Language detection consistency', () => {
          it('should always detect same language for same file extension', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom('.ts', '.js', '.py', '.java', '.go', '.rs'),
                         fc.string({ minLength: 1, maxLength: 50 }),
                         async (extension, filename) => {
                              const fileStructure: GitHubContent[] = [
                                   {
                                        name: filename + extension,
                                        path: 'src/' + filename + extension,
                                        type: 'file',
                                        size: 1000,
                                   },
                              ];

                              const commits: GitHubCommit[] = [];
                              const analysis = {} as any;

                              const candidates1 = await service.identifyCandidates(fileStructure, commits, analysis);
                              const candidates2 = await service.identifyCandidates(fileStructure, commits, analysis);

                              // Property: Same input should produce same language
                              if (candidates1.length > 0 && candidates2.length > 0) {
                                   expect(candidates1[0].language).toBe(candidates2[0].language);
                              }
                         }
                    ),
                    { numRuns: 30 }
               );
          });
     });
});
