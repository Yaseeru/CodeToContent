import * as fc from 'fast-check';
import { User, Repository, Analysis, CodeSnapshot } from '../index';

// Feature: Visual Intelligence (Code Snapshot Generator)
// Property 1: Selection Score Range Invariant
// **Validates: Requirements 1.3**
// For any code snippet selection operation, the selectionScore should be between 0 and 100 inclusive.

describe('Property 1: Selection Score Range Invariant', () => {
  it('should always store selectionScore between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          githubId: fc.string({ minLength: 1, maxLength: 20 }),
          username: fc.string({ minLength: 1, maxLength: 30 }),
          accessToken: fc.string({ minLength: 10, maxLength: 50 }),
          githubRepoId: fc.string({ minLength: 1, maxLength: 20 }),
          repoName: fc.string({ minLength: 1, maxLength: 50 }),
          fullName: fc.string({ minLength: 3, maxLength: 100 }),
          url: fc.webUrl(),
          problemStatement: fc.string({ minLength: 10, maxLength: 500 }),
          targetAudience: fc.string({ minLength: 5, maxLength: 200 }),
          coreFunctionality: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
          valueProposition: fc.string({ minLength: 10, maxLength: 500 }),
          filePath: fc.string({ minLength: 5, maxLength: 100 }),
          startLine: fc.integer({ min: 1, max: 1000 }),
          linesOfCode: fc.integer({ min: 1, max: 200 }),
          language: fc.constantFrom('typescript', 'javascript', 'python', 'java', 'go', 'rust'),
          selectionScore: fc.integer({ min: 0, max: 100 }),
          selectionReason: fc.string({ minLength: 10, maxLength: 200 }),
          imageUrl: fc.webUrl(),
          imageSize: fc.integer({ min: 1000, max: 5000000 }),
          lastCommitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
        }),
        async (data) => {
          const endLine = data.startLine + data.linesOfCode - 1;

          const user = await User.create({
            githubId: data.githubId,
            username: data.username,
            accessToken: data.accessToken,
          });

          const repository = await Repository.create({
            userId: user._id,
            githubRepoId: data.githubRepoId,
            name: data.repoName,
            fullName: data.fullName,
            url: data.url,
          });

          const analysis = await Analysis.create({
            repositoryId: repository._id,
            userId: user._id,
            problemStatement: data.problemStatement,
            targetAudience: data.targetAudience,
            coreFunctionality: data.coreFunctionality,
            notableFeatures: [],
            recentChanges: [],
            integrations: [],
            valueProposition: data.valueProposition,
            rawSignals: {
              readmeLength: 1000,
              commitCount: 10,
              prCount: 5,
              fileStructure: ['src/index.ts'],
            },
          });

          const snapshot = await CodeSnapshot.create({
            repositoryId: repository._id,
            analysisId: analysis._id,
            userId: user._id,
            snippetMetadata: {
              filePath: data.filePath,
              startLine: data.startLine,
              endLine: endLine,
              language: data.language,
              linesOfCode: data.linesOfCode,
            },
            selectionScore: data.selectionScore,
            selectionReason: data.selectionReason,
            imageUrl: data.imageUrl,
            imageSize: data.imageSize,
            imageDimensions: { width: 1200, height: 800 },
            renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
            isStale: false,
            lastCommitSha: data.lastCommitSha,
          });

          expect(snapshot.selectionScore).toBeGreaterThanOrEqual(0);
          expect(snapshot.selectionScore).toBeLessThanOrEqual(100);

          const retrieved = await CodeSnapshot.findById(snapshot._id);
          expect(retrieved).not.toBeNull();
          expect(retrieved!.selectionScore).toBe(data.selectionScore);
        }
      ),
      { numRuns: 10 }
    );
  }, 90000);
});

// Feature: Visual Intelligence (Code Snapshot Generator)
// Property 2: Snippet Metadata Completeness
// **Validates: Requirements 1.4**
// For any generated CodeSnapshot, all required snippetMetadata fields should be present and valid.

describe('Property 2: Snippet Metadata Completeness', () => {
  it('should always have complete and valid snippetMetadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          githubId: fc.string({ minLength: 1, maxLength: 20 }),
          username: fc.string({ minLength: 1, maxLength: 30 }),
          accessToken: fc.string({ minLength: 10, maxLength: 50 }),
          githubRepoId: fc.string({ minLength: 1, maxLength: 20 }),
          repoName: fc.string({ minLength: 1, maxLength: 50 }),
          fullName: fc.string({ minLength: 3, maxLength: 100 }),
          url: fc.webUrl(),
          problemStatement: fc.string({ minLength: 10, maxLength: 500 }),
          coreFunctionality: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
          valueProposition: fc.string({ minLength: 10, maxLength: 500 }),
          filePath: fc.string({ minLength: 5, maxLength: 100 }),
          startLine: fc.integer({ min: 1, max: 500 }),
          linesOfCode: fc.integer({ min: 1, max: 100 }),
          language: fc.constantFrom('typescript', 'javascript', 'python', 'java'),
          selectionScore: fc.integer({ min: 0, max: 100 }),
          imageUrl: fc.webUrl(),
          imageSize: fc.integer({ min: 1000, max: 5000000 }),
          lastCommitSha: fc.hexaString({ minLength: 40, maxLength: 40 }),
        }),
        async (data) => {
          const endLine = data.startLine + data.linesOfCode - 1;

          const user = await User.create({
            githubId: data.githubId,
            username: data.username,
            accessToken: data.accessToken,
          });

          const repository = await Repository.create({
            userId: user._id,
            githubRepoId: data.githubRepoId,
            name: data.repoName,
            fullName: data.fullName,
            url: data.url,
          });

          const analysis = await Analysis.create({
            repositoryId: repository._id,
            userId: user._id,
            problemStatement: data.problemStatement,
            targetAudience: 'Developers',
            coreFunctionality: data.coreFunctionality,
            notableFeatures: [],
            recentChanges: [],
            integrations: [],
            valueProposition: data.valueProposition,
            rawSignals: {
              readmeLength: 1000,
              commitCount: 10,
              prCount: 5,
              fileStructure: ['src/index.ts'],
            },
          });

          const snapshot = await CodeSnapshot.create({
            repositoryId: repository._id,
            analysisId: analysis._id,
            userId: user._id,
            snippetMetadata: {
              filePath: data.filePath,
              startLine: data.startLine,
              endLine: endLine,
              language: data.language,
              linesOfCode: data.linesOfCode,
            },
            selectionScore: data.selectionScore,
            selectionReason: 'Test reason',
            imageUrl: data.imageUrl,
            imageSize: data.imageSize,
            imageDimensions: { width: 1200, height: 800 },
            renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
            isStale: false,
            lastCommitSha: data.lastCommitSha,
          });

          expect(snapshot.snippetMetadata).toBeDefined();
          expect(snapshot.snippetMetadata.filePath).toBe(data.filePath);
          expect(snapshot.snippetMetadata.startLine).toBeGreaterThan(0);
          expect(snapshot.snippetMetadata.endLine).toBeGreaterThanOrEqual(snapshot.snippetMetadata.startLine);
          expect(snapshot.snippetMetadata.language).toBe(data.language);
          expect(snapshot.snippetMetadata.linesOfCode).toBeGreaterThan(0);

          const calculatedLOC = snapshot.snippetMetadata.endLine - snapshot.snippetMetadata.startLine + 1;
          expect(snapshot.snippetMetadata.linesOfCode).toBe(calculatedLOC);
        }
      ),
      { numRuns: 10 }
    );
  }, 90000);
});
