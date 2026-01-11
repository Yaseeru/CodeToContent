import * as fc from 'fast-check';
import { User, Repository, Analysis } from '../index';

// Feature: code-to-content, Property 9: Analysis Persistence
// Validates: Requirements 3.6
// For any completed analysis, the Summary should be stored in MongoDB with valid references 
// to both the User and Repository, and should be retrievable using either reference.

describe('Property 9: Analysis Persistence', () => {
     it('should store and retrieve analysis by userId and repositoryId', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         // User data
                         githubId: fc.string({ minLength: 1, maxLength: 20 }),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         // Repository data
                         githubRepoId: fc.string({ minLength: 1, maxLength: 20 }),
                         repoName: fc.string({ minLength: 1, maxLength: 50 }),
                         fullName: fc.string({ minLength: 3, maxLength: 100 }),
                         description: fc.string({ maxLength: 200 }),
                         url: fc.webUrl(),
                         // Analysis data
                         problemStatement: fc.string({ minLength: 10, maxLength: 500 }),
                         targetAudience: fc.string({ minLength: 5, maxLength: 200 }),
                         coreFunctionality: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
                         notableFeatures: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 10 }),
                         recentChanges: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 10 }),
                         integrations: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { maxLength: 10 }),
                         valueProposition: fc.string({ minLength: 10, maxLength: 500 }),
                         readmeLength: fc.nat({ max: 100000 }),
                         commitCount: fc.nat({ max: 10000 }),
                         prCount: fc.nat({ max: 1000 }),
                         fileStructure: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 50 }),
                    }),
                    async (data) => {
                         // Create user
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
                         });

                         // Create repository
                         const repository = await Repository.create({
                              userId: user._id,
                              githubRepoId: data.githubRepoId,
                              name: data.repoName,
                              fullName: data.fullName,
                              description: data.description,
                              url: data.url,
                         });

                         // Create analysis
                         const analysis = await Analysis.create({
                              repositoryId: repository._id,
                              userId: user._id,
                              problemStatement: data.problemStatement,
                              targetAudience: data.targetAudience,
                              coreFunctionality: data.coreFunctionality,
                              notableFeatures: data.notableFeatures,
                              recentChanges: data.recentChanges,
                              integrations: data.integrations,
                              valueProposition: data.valueProposition,
                              rawSignals: {
                                   readmeLength: data.readmeLength,
                                   commitCount: data.commitCount,
                                   prCount: data.prCount,
                                   fileStructure: data.fileStructure,
                              },
                         });

                         // Verify analysis can be retrieved by userId
                         const analysisByUserId = await Analysis.findOne({ userId: user._id });
                         expect(analysisByUserId).not.toBeNull();
                         expect(analysisByUserId!._id.toString()).toBe(analysis._id.toString());
                         expect(analysisByUserId!.userId.toString()).toBe(user._id.toString());
                         expect(analysisByUserId!.repositoryId.toString()).toBe(repository._id.toString());

                         // Verify analysis can be retrieved by repositoryId
                         const analysisByRepoId = await Analysis.findOne({ repositoryId: repository._id });
                         expect(analysisByRepoId).not.toBeNull();
                         expect(analysisByRepoId!._id.toString()).toBe(analysis._id.toString());
                         expect(analysisByRepoId!.userId.toString()).toBe(user._id.toString());
                         expect(analysisByRepoId!.repositoryId.toString()).toBe(repository._id.toString());

                         // Verify all fields are persisted correctly
                         expect(analysisByUserId!.problemStatement).toBe(data.problemStatement);
                         expect(analysisByUserId!.targetAudience).toBe(data.targetAudience);
                         expect(analysisByUserId!.coreFunctionality).toEqual(data.coreFunctionality);
                         expect(analysisByUserId!.valueProposition).toBe(data.valueProposition);
                    }
               ),
               { numRuns: 10 }
          );
     }, 60000);
});
