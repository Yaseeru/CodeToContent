import * as fc from 'fast-check';
import { User, Repository, Analysis, Content, Platform } from '../index';

// Feature: code-to-content, Property 15: Content Persistence
// Validates: Requirements 7.1, 7.2, 7.3
// For any generated or edited content, the system should store it in MongoDB with references 
// to the Analysis, User, platform, tone, and version number.

describe('Property 15: Content Persistence', () => {
     it('should store content with all required references and metadata', async () => {
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
                         // Content data
                         platform: fc.constantFrom<Platform>('linkedin', 'x'),
                         tone: fc.string({ minLength: 3, maxLength: 50 }),
                         generatedText: fc.string({ minLength: 50, maxLength: 1000 }),
                         editedText: fc.option(fc.string({ minLength: 50, maxLength: 1000 }), { nil: undefined }),
                         version: fc.integer({ min: 1, max: 10 }),
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

                         // Create content
                         const content = await Content.create({
                              analysisId: analysis._id,
                              userId: user._id,
                              platform: data.platform,
                              tone: data.tone,
                              generatedText: data.generatedText,
                              editedText: data.editedText,
                              version: data.version,
                         });

                         // Verify content can be retrieved by analysisId
                         const contentByAnalysisId = await Content.findOne({ analysisId: analysis._id });
                         expect(contentByAnalysisId).not.toBeNull();
                         expect(contentByAnalysisId!._id.toString()).toBe(content._id.toString());
                         expect(contentByAnalysisId!.analysisId.toString()).toBe(analysis._id.toString());
                         expect(contentByAnalysisId!.userId.toString()).toBe(user._id.toString());

                         // Verify content can be retrieved by userId
                         const contentByUserId = await Content.findOne({ userId: user._id });
                         expect(contentByUserId).not.toBeNull();
                         expect(contentByUserId!._id.toString()).toBe(content._id.toString());

                         // Verify all metadata fields are persisted correctly
                         expect(contentByAnalysisId!.platform).toBe(data.platform);
                         expect(contentByAnalysisId!.tone).toBe(data.tone);
                         expect(contentByAnalysisId!.generatedText).toBe(data.generatedText);
                         expect(contentByAnalysisId!.editedText).toBe(data.editedText);
                         expect(contentByAnalysisId!.version).toBe(data.version);

                         // Verify content has timestamps
                         expect(contentByAnalysisId!.createdAt).toBeInstanceOf(Date);
                         expect(contentByAnalysisId!.updatedAt).toBeInstanceOf(Date);
                    }
               ),
               { numRuns: 5 }
          );
     }, 90000);
});
