import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { User, Repository, Analysis, Content, Platform } from '../index';

// Feature: personalized-voice-engine, Property 13: Style Delta Extraction
// Validates: Requirements 11.1, 11.2
// For any saved content edit, the system should extract and store all style delta components:
// sentence length changes, emoji changes, structure changes, tone shifts, vocabulary changes,
// phrases added, and phrases removed.

describe('Property 13: Style Delta Extraction', () => {
     // Clean up between property test iterations to avoid duplicate key errors
     afterEach(async () => {
          const collections = mongoose.connection.collections;
          for (const key in collections) {
               await collections[key].deleteMany({});
          }
     });

     it('should store complete edit metadata with all delta components', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         // User data - use timestamp + uuid for uniqueness
                         githubId: fc.uuid().map(uuid => `${Date.now()}-${Math.random()}-${uuid}`),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         // Repository data
                         githubRepoId: fc.uuid().map(uuid => `${Date.now()}-${Math.random()}-${uuid}`),
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
                         version: fc.integer({ min: 1, max: 10 }),
                         // Edit metadata
                         originalText: fc.string({ minLength: 50, maxLength: 1000 }),
                         editedText: fc.string({ minLength: 50, maxLength: 1000 }),
                         sentenceLengthDelta: fc.float({ min: -50, max: 50 }),
                         emojiAdded: fc.nat({ max: 20 }),
                         emojiRemoved: fc.nat({ max: 20 }),
                         paragraphsAdded: fc.nat({ max: 10 }),
                         paragraphsRemoved: fc.nat({ max: 10 }),
                         bulletsAdded: fc.boolean(),
                         formattingChanges: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { maxLength: 10 }),
                         toneShift: fc.string({ minLength: 5, maxLength: 100 }),
                         wordsSubstituted: fc.array(
                              fc.record({
                                   from: fc.string({ minLength: 3, maxLength: 20 }),
                                   to: fc.string({ minLength: 3, maxLength: 20 }),
                              }),
                              { maxLength: 10 }
                         ),
                         complexityShift: fc.integer({ min: -1, max: 1 }),
                         phrasesAdded: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 10 }),
                         phrasesRemoved: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 10 }),
                         // Voice-aware metadata
                         usedStyleProfile: fc.boolean(),
                         voiceStrengthUsed: fc.integer({ min: 0, max: 100 }),
                         evolutionScoreAtGeneration: fc.integer({ min: 0, max: 100 }),
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

                         // Create content with complete edit metadata
                         const netEmojiChange = data.emojiAdded - data.emojiRemoved;
                         const editTimestamp = new Date();

                         const content = await Content.create({
                              analysisId: analysis._id,
                              userId: user._id,
                              platform: data.platform,
                              tone: data.tone,
                              generatedText: data.generatedText,
                              editedText: data.editedText,
                              version: data.version,
                              editMetadata: {
                                   originalText: data.originalText,
                                   originalLength: data.originalText.length,
                                   editedLength: data.editedText.length,
                                   sentenceLengthDelta: data.sentenceLengthDelta,
                                   emojiChanges: {
                                        added: data.emojiAdded,
                                        removed: data.emojiRemoved,
                                        netChange: netEmojiChange,
                                   },
                                   structureChanges: {
                                        paragraphsAdded: data.paragraphsAdded,
                                        paragraphsRemoved: data.paragraphsRemoved,
                                        bulletsAdded: data.bulletsAdded,
                                        formattingChanges: data.formattingChanges,
                                   },
                                   toneShift: data.toneShift,
                                   vocabularyChanges: {
                                        wordsSubstituted: data.wordsSubstituted,
                                        complexityShift: data.complexityShift,
                                   },
                                   phrasesAdded: data.phrasesAdded,
                                   phrasesRemoved: data.phrasesRemoved,
                                   editTimestamp: editTimestamp,
                                   learningProcessed: false,
                              },
                              usedStyleProfile: data.usedStyleProfile,
                              voiceStrengthUsed: data.voiceStrengthUsed,
                              evolutionScoreAtGeneration: data.evolutionScoreAtGeneration,
                         });

                         // Retrieve content and verify all edit metadata components are stored
                         const savedContent = await Content.findById(content._id);
                         expect(savedContent).not.toBeNull();
                         expect(savedContent!.editMetadata).toBeDefined();

                         const metadata = savedContent!.editMetadata!;

                         // Verify basic text metadata
                         expect(metadata.originalText).toBe(data.originalText);
                         expect(metadata.originalLength).toBe(data.originalText.length);
                         expect(metadata.editedLength).toBe(data.editedText.length);
                         expect(metadata.sentenceLengthDelta).toBe(data.sentenceLengthDelta);

                         // Verify emoji changes (all 3 components)
                         expect(metadata.emojiChanges).toBeDefined();
                         expect(metadata.emojiChanges.added).toBe(data.emojiAdded);
                         expect(metadata.emojiChanges.removed).toBe(data.emojiRemoved);
                         expect(metadata.emojiChanges.netChange).toBe(netEmojiChange);

                         // Verify structure changes (all 4 components)
                         expect(metadata.structureChanges).toBeDefined();
                         expect(metadata.structureChanges.paragraphsAdded).toBe(data.paragraphsAdded);
                         expect(metadata.structureChanges.paragraphsRemoved).toBe(data.paragraphsRemoved);
                         expect(metadata.structureChanges.bulletsAdded).toBe(data.bulletsAdded);
                         expect(metadata.structureChanges.formattingChanges).toEqual(data.formattingChanges);

                         // Verify tone shift
                         expect(metadata.toneShift).toBe(data.toneShift);

                         // Verify vocabulary changes (both components)
                         expect(metadata.vocabularyChanges).toBeDefined();
                         expect(metadata.vocabularyChanges.wordsSubstituted).toEqual(data.wordsSubstituted);
                         expect(metadata.vocabularyChanges.complexityShift).toBe(data.complexityShift);

                         // Verify phrases
                         expect(metadata.phrasesAdded).toEqual(data.phrasesAdded);
                         expect(metadata.phrasesRemoved).toEqual(data.phrasesRemoved);

                         // Verify timestamps and learning status
                         expect(metadata.editTimestamp).toBeInstanceOf(Date);
                         expect(metadata.learningProcessed).toBe(false);

                         // Verify voice-aware generation metadata
                         expect(savedContent!.usedStyleProfile).toBe(data.usedStyleProfile);
                         expect(savedContent!.voiceStrengthUsed).toBe(data.voiceStrengthUsed);
                         expect(savedContent!.evolutionScoreAtGeneration).toBe(data.evolutionScoreAtGeneration);
                    }
               ),
               { numRuns: 5 }
          );
     }, 90000);

     it('should allow content without edit metadata (backward compatibility)', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         // User data - use timestamp + uuid for uniqueness
                         githubId: fc.uuid().map(uuid => `${Date.now()}-${Math.random()}-${uuid}`),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         // Repository data
                         githubRepoId: fc.uuid().map(uuid => `${Date.now()}-${Math.random()}-${uuid}`),
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

                         // Create content WITHOUT edit metadata
                         const content = await Content.create({
                              analysisId: analysis._id,
                              userId: user._id,
                              platform: data.platform,
                              tone: data.tone,
                              generatedText: data.generatedText,
                              version: data.version,
                         });

                         // Retrieve content and verify it works without edit metadata
                         const savedContent = await Content.findById(content._id);
                         expect(savedContent).not.toBeNull();
                         expect(savedContent!.editMetadata).toBeUndefined();
                         expect(savedContent!.usedStyleProfile).toBeUndefined();
                         expect(savedContent!.voiceStrengthUsed).toBeUndefined();
                         expect(savedContent!.evolutionScoreAtGeneration).toBeUndefined();

                         // Verify basic content fields still work
                         expect(savedContent!.generatedText).toBe(data.generatedText);
                         expect(savedContent!.platform).toBe(data.platform);
                         expect(savedContent!.tone).toBe(data.tone);
                    }
               ),
               { numRuns: 5 }
          );
     }, 90000);
});
