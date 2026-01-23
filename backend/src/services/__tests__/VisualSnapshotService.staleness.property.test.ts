import * as fc from 'fast-check';
import { VisualSnapshotService } from '../VisualSnapshotService';
import { CacheService } from '../CacheService';
import { CodeSnapshot } from '../../models/CodeSnapshot';
import { Repository } from '../../models/Repository';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import mongoose from 'mongoose';

// Mock shiki to avoid ESM/CommonJS compatibility issues in Jest
jest.mock('shiki', () => ({
     codeToHtml: jest.fn(async (code: string, options: any) => {
          return `<pre class="shiki"><code>${code}</code></pre>`;
     })
}));

// Mock puppeteer to avoid browser dependencies in tests
jest.mock('puppeteer', () => ({
     launch: jest.fn()
}));

/**
 * Property-based tests for Snapshot Staleness Detection
 * 
 * Property 6: Snapshot Staleness Detection
 * For any repository update with a new commit SHA, existing snapshots with different 
 * lastCommitSha should be marked as stale.
 * 
 * **Validates: Requirements 3.5, 6.4**
 */
describe('VisualSnapshotService - Snapshot Staleness Detection (Property 6)', () => {
     let service: VisualSnapshotService;
     let cacheService: CacheService;
     let testUser: any;
     let testRepository: any;
     let testAnalysis: any;

     beforeAll(async () => {
          // Initialize services (MongoDB connection is handled by test setup)
          cacheService = new CacheService();
          service = new VisualSnapshotService(
               process.env.GEMINI_API_KEY || 'test-api-key',
               cacheService
          );
     }, 60000);

     afterAll(async () => {
          // Close cache service
          if (cacheService) {
               await cacheService.close();
          }
     }, 60000);

     beforeEach(async () => {
          // Clear all collections
          await User.deleteMany({});
          await Repository.deleteMany({});
          await Analysis.deleteMany({});
          await CodeSnapshot.deleteMany({});

          // Create test user
          testUser = await User.create({
               githubId: 'test-github-id',
               username: 'testuser',
               email: 'test@example.com',
               accessToken: 'test-access-token',
          });

          // Create test repository
          testRepository = await Repository.create({
               userId: testUser._id,
               githubRepoId: '12345',
               name: 'test-repo',
               fullName: 'testuser/test-repo',
               description: 'A test repository',
               url: 'https://github.com/testuser/test-repo',
          });

          // Create test analysis
          testAnalysis = await Analysis.create({
               repositoryId: testRepository._id,
               userId: testUser._id,
               problemStatement: 'Test problem statement',
               targetAudience: 'Developers',
               coreFunctionality: ['Feature 1', 'Feature 2'],
               notableFeatures: ['Notable 1'],
               recentChanges: ['Change 1'],
               integrations: ['Integration 1'],
               valueProposition: 'Test value proposition',
               rawSignals: {
                    readmeLength: 1000,
                    commitCount: 50,
                    prCount: 10,
                    fileStructure: ['src/index.ts', 'src/utils.ts'],
               },
          });
     });

     /**
      * Property: Snapshots with different commit SHAs should be marked as stale
      * 
      * For any set of snapshots with various commit SHAs, when invalidateStaleSnapshots
      * is called with a new commit SHA, all snapshots with different SHAs should be
      * marked as stale, while snapshots with matching SHAs should remain fresh.
      */
     describe('Property: Staleness marking correctness', () => {
          it('should mark all snapshots with different commit SHAs as stale', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate array of commit SHAs (40 character hex strings)
                         fc.array(
                              fc.hexaString({ minLength: 40, maxLength: 40 }),
                              { minLength: 1, maxLength: 10 }
                         ),
                         // Generate a new commit SHA that will be used for invalidation
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         async (oldCommitShas, newCommitSha) => {
                              // Create snapshots with various old commit SHAs
                              const createdSnapshots = await Promise.all(
                                   oldCommitShas.map(async (commitSha, index) => {
                                        return await CodeSnapshot.create({
                                             repositoryId: testRepository._id,
                                             analysisId: testAnalysis._id,
                                             userId: testUser._id,
                                             snippetMetadata: {
                                                  filePath: `src/file${index}.ts`,
                                                  startLine: 1,
                                                  endLine: 20,
                                                  language: 'typescript',
                                                  linesOfCode: 20,
                                             },
                                             selectionScore: 80 + index,
                                             selectionReason: `Snapshot ${index}`,
                                             imageUrl: `https://example.com/snapshot${index}.png`,
                                             imageSize: 50000,
                                             imageDimensions: { width: 1200, height: 800 },
                                             renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                                             isStale: false,
                                             lastCommitSha: commitSha,
                                        });
                                   })
                              );

                              // Call invalidateStaleSnapshots with new commit SHA
                              await service.invalidateStaleSnapshots(
                                   testRepository._id.toString(),
                                   newCommitSha
                              );

                              // Verify staleness marking
                              for (let i = 0; i < createdSnapshots.length; i++) {
                                   const snapshot = createdSnapshots[i];
                                   const updatedSnapshot = await CodeSnapshot.findById(snapshot._id);

                                   expect(updatedSnapshot).toBeDefined();

                                   // Property: Snapshot should be stale if and only if its commit SHA differs from new SHA
                                   if (oldCommitShas[i] === newCommitSha) {
                                        expect(updatedSnapshot!.isStale).toBe(false);
                                   } else {
                                        expect(updatedSnapshot!.isStale).toBe(true);
                                   }
                              }

                              // Clean up for next iteration
                              await CodeSnapshot.deleteMany({});
                         }
                    ),
                    { numRuns: 50 }
               );
          });
     });

     /**
      * Property: Staleness detection is idempotent
      * 
      * Calling invalidateStaleSnapshots multiple times with the same commit SHA
      * should produce the same result.
      */
     describe('Property: Staleness detection idempotency', () => {
          it('should produce same result when called multiple times', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate initial commit SHA for snapshots
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         // Generate new commit SHA for invalidation
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         // Generate number of snapshots to create
                         fc.integer({ min: 1, max: 5 }),
                         async (oldCommitSha, newCommitSha, snapshotCount) => {
                              // Create snapshots with old commit SHA
                              const snapshots = await Promise.all(
                                   Array.from({ length: snapshotCount }, async (_, index) => {
                                        return await CodeSnapshot.create({
                                             repositoryId: testRepository._id,
                                             analysisId: testAnalysis._id,
                                             userId: testUser._id,
                                             snippetMetadata: {
                                                  filePath: `src/file${index}.ts`,
                                                  startLine: 1,
                                                  endLine: 20,
                                                  language: 'typescript',
                                                  linesOfCode: 20,
                                             },
                                             selectionScore: 80,
                                             selectionReason: 'Test',
                                             imageUrl: `https://example.com/snapshot${index}.png`,
                                             imageSize: 50000,
                                             imageDimensions: { width: 1200, height: 800 },
                                             renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                                             isStale: false,
                                             lastCommitSha: oldCommitSha,
                                        });
                                   })
                              );

                              // Call invalidateStaleSnapshots first time
                              await service.invalidateStaleSnapshots(
                                   testRepository._id.toString(),
                                   newCommitSha
                              );

                              // Get staleness state after first call
                              const stateAfterFirst = await Promise.all(
                                   snapshots.map(async (s) => {
                                        const updated = await CodeSnapshot.findById(s._id);
                                        return updated!.isStale;
                                   })
                              );

                              // Call invalidateStaleSnapshots second time
                              await service.invalidateStaleSnapshots(
                                   testRepository._id.toString(),
                                   newCommitSha
                              );

                              // Get staleness state after second call
                              const stateAfterSecond = await Promise.all(
                                   snapshots.map(async (s) => {
                                        const updated = await CodeSnapshot.findById(s._id);
                                        return updated!.isStale;
                                   })
                              );

                              // Property: Staleness state should be identical after both calls
                              expect(stateAfterSecond).toEqual(stateAfterFirst);

                              // Clean up for next iteration
                              await CodeSnapshot.deleteMany({});
                         }
                    ),
                    { numRuns: 30 }
               );
          });
     });

     /**
      * Property: Only snapshots for the specified repository are affected
      * 
      * When invalidating snapshots for one repository, snapshots from other
      * repositories should not be affected.
      */
     describe('Property: Repository isolation', () => {
          it('should only affect snapshots for the specified repository', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate commit SHAs
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         async (oldCommitSha, newCommitSha) => {
                              // Create a second repository
                              const otherRepository = await Repository.create({
                                   userId: testUser._id,
                                   githubRepoId: '67890',
                                   name: 'other-repo',
                                   fullName: 'testuser/other-repo',
                                   description: 'Another test repository',
                                   url: 'https://github.com/testuser/other-repo',
                              });

                              // Create snapshot for first repository
                              const snapshot1 = await CodeSnapshot.create({
                                   repositoryId: testRepository._id,
                                   analysisId: testAnalysis._id,
                                   userId: testUser._id,
                                   snippetMetadata: {
                                        filePath: 'src/index.ts',
                                        startLine: 1,
                                        endLine: 20,
                                        language: 'typescript',
                                        linesOfCode: 20,
                                   },
                                   selectionScore: 90,
                                   selectionReason: 'Test',
                                   imageUrl: 'https://example.com/snapshot1.png',
                                   imageSize: 50000,
                                   imageDimensions: { width: 1200, height: 800 },
                                   renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                                   isStale: false,
                                   lastCommitSha: oldCommitSha,
                              });

                              // Create snapshot for second repository
                              const snapshot2 = await CodeSnapshot.create({
                                   repositoryId: otherRepository._id,
                                   analysisId: testAnalysis._id,
                                   userId: testUser._id,
                                   snippetMetadata: {
                                        filePath: 'src/index.js',
                                        startLine: 1,
                                        endLine: 20,
                                        language: 'javascript',
                                        linesOfCode: 20,
                                   },
                                   selectionScore: 85,
                                   selectionReason: 'Test',
                                   imageUrl: 'https://example.com/snapshot2.png',
                                   imageSize: 50000,
                                   imageDimensions: { width: 1200, height: 800 },
                                   renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                                   isStale: false,
                                   lastCommitSha: oldCommitSha,
                              });

                              // Invalidate snapshots for first repository only
                              await service.invalidateStaleSnapshots(
                                   testRepository._id.toString(),
                                   newCommitSha
                              );

                              // Verify first repository snapshot is stale (if SHAs differ)
                              const updatedSnapshot1 = await CodeSnapshot.findById(snapshot1._id);
                              if (oldCommitSha !== newCommitSha) {
                                   expect(updatedSnapshot1!.isStale).toBe(true);
                              }

                              // Property: Second repository snapshot should remain fresh
                              const updatedSnapshot2 = await CodeSnapshot.findById(snapshot2._id);
                              expect(updatedSnapshot2!.isStale).toBe(false);

                              // Clean up
                              await Repository.findByIdAndDelete(otherRepository._id);
                              await CodeSnapshot.deleteMany({});
                         }
                    ),
                    { numRuns: 30 }
               );
          });
     });

     /**
      * Property: Staleness marking preserves other snapshot fields
      * 
      * When marking snapshots as stale, all other fields should remain unchanged.
      */
     describe('Property: Field preservation during staleness marking', () => {
          it('should preserve all other snapshot fields when marking as stale', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         // Generate snapshot data
                         fc.record({
                              filePath: fc.string({ minLength: 1, maxLength: 100 }).map(s => `src/${s}.ts`),
                              startLine: fc.integer({ min: 1, max: 100 }),
                              endLine: fc.integer({ min: 1, max: 100 }),
                              selectionScore: fc.integer({ min: 0, max: 100 }),
                              selectionReason: fc.string({ minLength: 1, maxLength: 200 }),
                              imageSize: fc.integer({ min: 1000, max: 5000000 }),
                         }),
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         async (snapshotData, oldCommitSha, newCommitSha) => {
                              // Ensure endLine >= startLine
                              const startLine = Math.min(snapshotData.startLine, snapshotData.endLine);
                              const endLine = Math.max(snapshotData.startLine, snapshotData.endLine);
                              const linesOfCode = endLine - startLine + 1;

                              // Create snapshot
                              const snapshot = await CodeSnapshot.create({
                                   repositoryId: testRepository._id,
                                   analysisId: testAnalysis._id,
                                   userId: testUser._id,
                                   snippetMetadata: {
                                        filePath: snapshotData.filePath,
                                        startLine,
                                        endLine,
                                        language: 'typescript',
                                        linesOfCode,
                                   },
                                   selectionScore: snapshotData.selectionScore,
                                   selectionReason: snapshotData.selectionReason,
                                   imageUrl: 'https://example.com/snapshot.png',
                                   imageSize: snapshotData.imageSize,
                                   imageDimensions: { width: 1200, height: 800 },
                                   renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                                   isStale: false,
                                   lastCommitSha: oldCommitSha,
                              });

                              // Store original values
                              const originalValues = {
                                   filePath: snapshot.snippetMetadata.filePath,
                                   startLine: snapshot.snippetMetadata.startLine,
                                   endLine: snapshot.snippetMetadata.endLine,
                                   selectionScore: snapshot.selectionScore,
                                   selectionReason: snapshot.selectionReason,
                                   imageUrl: snapshot.imageUrl,
                                   imageSize: snapshot.imageSize,
                                   lastCommitSha: snapshot.lastCommitSha,
                              };

                              // Invalidate snapshots
                              await service.invalidateStaleSnapshots(
                                   testRepository._id.toString(),
                                   newCommitSha
                              );

                              // Verify all fields except isStale remain unchanged
                              const updatedSnapshot = await CodeSnapshot.findById(snapshot._id);
                              expect(updatedSnapshot).toBeDefined();

                              // Property: All non-staleness fields should be preserved
                              expect(updatedSnapshot!.snippetMetadata.filePath).toBe(originalValues.filePath);
                              expect(updatedSnapshot!.snippetMetadata.startLine).toBe(originalValues.startLine);
                              expect(updatedSnapshot!.snippetMetadata.endLine).toBe(originalValues.endLine);
                              expect(updatedSnapshot!.selectionScore).toBe(originalValues.selectionScore);
                              expect(updatedSnapshot!.selectionReason).toBe(originalValues.selectionReason);
                              expect(updatedSnapshot!.imageUrl).toBe(originalValues.imageUrl);
                              expect(updatedSnapshot!.imageSize).toBe(originalValues.imageSize);
                              expect(updatedSnapshot!.lastCommitSha).toBe(originalValues.lastCommitSha);

                              // Clean up
                              await CodeSnapshot.deleteMany({});
                         }
                    ),
                    { numRuns: 30 }
               );
          });
     });

     /**
      * Property: Staleness detection handles edge cases correctly
      * 
      * Tests edge cases like empty repositories, no snapshots, and already stale snapshots.
      */
     describe('Property: Edge case handling', () => {
          it('should handle repository with no snapshots gracefully', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         async (newCommitSha) => {
                              // Property: Should not throw when no snapshots exist
                              await expect(
                                   service.invalidateStaleSnapshots(
                                        testRepository._id.toString(),
                                        newCommitSha
                                   )
                              ).resolves.not.toThrow();
                         }
                    ),
                    { numRuns: 20 }
               );
          });

          it('should handle already stale snapshots correctly', async () => {
               await fc.assert(
                    fc.asyncProperty(
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         fc.hexaString({ minLength: 40, maxLength: 40 }),
                         async (oldCommitSha, newCommitSha) => {
                              // Create snapshot that is already stale
                              const snapshot = await CodeSnapshot.create({
                                   repositoryId: testRepository._id,
                                   analysisId: testAnalysis._id,
                                   userId: testUser._id,
                                   snippetMetadata: {
                                        filePath: 'src/index.ts',
                                        startLine: 1,
                                        endLine: 20,
                                        language: 'typescript',
                                        linesOfCode: 20,
                                   },
                                   selectionScore: 90,
                                   selectionReason: 'Test',
                                   imageUrl: 'https://example.com/snapshot.png',
                                   imageSize: 50000,
                                   imageDimensions: { width: 1200, height: 800 },
                                   renderOptions: { theme: 'nord', showLineNumbers: false, fontSize: 14 },
                                   isStale: true, // Already stale
                                   lastCommitSha: oldCommitSha,
                              });

                              // Invalidate with new commit SHA
                              await service.invalidateStaleSnapshots(
                                   testRepository._id.toString(),
                                   newCommitSha
                              );

                              // Property: Already stale snapshot should remain stale
                              const updatedSnapshot = await CodeSnapshot.findById(snapshot._id);
                              expect(updatedSnapshot!.isStale).toBe(true);

                              // Clean up
                              await CodeSnapshot.deleteMany({});
                         }
                    ),
                    { numRuns: 20 }
               );
          });
     });
});
