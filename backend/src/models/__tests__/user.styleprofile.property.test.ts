import * as fc from 'fast-check';
import { User, IUser } from '../User';
import { StyleProfile, ToneMetrics, WritingTraits, StructurePreferences } from '../User';

// Feature: personalized-voice-engine, Property 2: Tone Metrics Range Invariant
// Validates: Requirements 1.3
// For any styleProfile operation (create, update, aggregate), all tone metric values 
// (formality, enthusiasm, directness, humor, emotionality) should remain between 1 and 10 inclusive.

describe('Property 2: Tone Metrics Range Invariant', () => {
     it('should enforce tone metrics between 1 and 10 for profile creation', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         formality: fc.integer({ min: 1, max: 10 }),
                         enthusiasm: fc.integer({ min: 1, max: 10 }),
                         directness: fc.integer({ min: 1, max: 10 }),
                         humor: fc.integer({ min: 1, max: 10 }),
                         emotionality: fc.integer({ min: 1, max: 10 }),
                    }),
                    async (data) => {
                         // Create user with styleProfile
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
                              styleProfile: {
                                   voiceType: 'casual',
                                   tone: {
                                        formality: data.formality,
                                        enthusiasm: data.enthusiasm,
                                        directness: data.directness,
                                        humor: data.humor,
                                        emotionality: data.emotionality,
                                   },
                                   writingTraits: {
                                        avgSentenceLength: 15,
                                        usesQuestionsOften: true,
                                        usesEmojis: true,
                                        emojiFrequency: 3,
                                        usesBulletPoints: false,
                                        usesShortParagraphs: true,
                                        usesHooks: true,
                                   },
                                   structurePreferences: {
                                        introStyle: 'hook',
                                        bodyStyle: 'narrative',
                                        endingStyle: 'cta',
                                   },
                                   vocabularyLevel: 'medium',
                                   commonPhrases: ['Let me explain', 'Here\'s the thing'],
                                   bannedPhrases: ['Delve into', 'Leverage'],
                                   samplePosts: ['Sample post 1', 'Sample post 2'],
                                   learningIterations: 0,
                                   lastUpdated: new Date(),
                                   profileSource: 'manual',
                              },
                         });

                         // Retrieve and verify tone metrics are within range
                         const savedUser = await User.findById(user._id);
                         expect(savedUser).not.toBeNull();
                         expect(savedUser!.styleProfile).toBeDefined();

                         const tone = savedUser!.styleProfile!.tone;
                         expect(tone.formality).toBeGreaterThanOrEqual(1);
                         expect(tone.formality).toBeLessThanOrEqual(10);
                         expect(tone.enthusiasm).toBeGreaterThanOrEqual(1);
                         expect(tone.enthusiasm).toBeLessThanOrEqual(10);
                         expect(tone.directness).toBeGreaterThanOrEqual(1);
                         expect(tone.directness).toBeLessThanOrEqual(10);
                         expect(tone.humor).toBeGreaterThanOrEqual(1);
                         expect(tone.humor).toBeLessThanOrEqual(10);
                         expect(tone.emotionality).toBeGreaterThanOrEqual(1);
                         expect(tone.emotionality).toBeLessThanOrEqual(10);
                    }
               ),
               { numRuns: 100 }
          );
     }, 90000);

     it('should reject tone metrics outside 1-10 range', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         invalidValue: fc.oneof(
                              fc.integer({ max: 0 }),
                              fc.integer({ min: 11 })
                         ),
                    }),
                    async (data) => {
                         // Attempt to create user with invalid tone metric
                         await expect(
                              User.create({
                                   githubId: data.githubId,
                                   username: data.username,
                                   accessToken: data.accessToken,
                                   avatarUrl: data.avatarUrl,
                                   styleProfile: {
                                        voiceType: 'casual',
                                        tone: {
                                             formality: data.invalidValue,
                                             enthusiasm: 5,
                                             directness: 5,
                                             humor: 5,
                                             emotionality: 5,
                                        },
                                        writingTraits: {
                                             avgSentenceLength: 15,
                                             usesQuestionsOften: true,
                                             usesEmojis: true,
                                             emojiFrequency: 3,
                                             usesBulletPoints: false,
                                             usesShortParagraphs: true,
                                             usesHooks: true,
                                        },
                                        structurePreferences: {
                                             introStyle: 'hook',
                                             bodyStyle: 'narrative',
                                             endingStyle: 'cta',
                                        },
                                        vocabularyLevel: 'medium',
                                        commonPhrases: [],
                                        bannedPhrases: [],
                                        samplePosts: [],
                                        learningIterations: 0,
                                        lastUpdated: new Date(),
                                        profileSource: 'manual',
                                   },
                              })
                         ).rejects.toThrow();
                    }
               ),
               { numRuns: 100 }
          );
     }, 90000);
});

// Feature: personalized-voice-engine, Property 3: Style Profile Completeness
// Validates: Requirements 1.2
// For any newly created styleProfile, all required fields (voiceType, tone metrics, 
// writing traits, structure preferences, vocabulary level, common phrases, banned phrases, 
// sample posts) should be present and non-null.

describe('Property 3: Style Profile Completeness', () => {
     it('should ensure all required fields are present in styleProfile', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                         voiceType: fc.constantFrom('educational', 'storytelling', 'opinionated', 'analytical', 'casual', 'professional'),
                         formality: fc.integer({ min: 1, max: 10 }),
                         enthusiasm: fc.integer({ min: 1, max: 10 }),
                         directness: fc.integer({ min: 1, max: 10 }),
                         humor: fc.integer({ min: 1, max: 10 }),
                         emotionality: fc.integer({ min: 1, max: 10 }),
                         avgSentenceLength: fc.integer({ min: 5, max: 50 }),
                         usesQuestionsOften: fc.boolean(),
                         usesEmojis: fc.boolean(),
                         emojiFrequency: fc.integer({ min: 0, max: 5 }),
                         usesBulletPoints: fc.boolean(),
                         usesShortParagraphs: fc.boolean(),
                         usesHooks: fc.boolean(),
                         introStyle: fc.constantFrom('hook', 'story', 'problem', 'statement'),
                         bodyStyle: fc.constantFrom('steps', 'narrative', 'analysis', 'bullets'),
                         endingStyle: fc.constantFrom('cta', 'reflection', 'summary', 'question'),
                         vocabularyLevel: fc.constantFrom('simple', 'medium', 'advanced'),
                         commonPhrases: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { maxLength: 10 }),
                         bannedPhrases: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { maxLength: 10 }),
                         samplePosts: fc.array(fc.string({ minLength: 50, maxLength: 500 }), { minLength: 1, maxLength: 10 }),
                         profileSource: fc.constantFrom('manual', 'file', 'feedback', 'archetype'),
                    }),
                    async (data) => {
                         // Create user with complete styleProfile
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
                              styleProfile: {
                                   voiceType: data.voiceType,
                                   tone: {
                                        formality: data.formality,
                                        enthusiasm: data.enthusiasm,
                                        directness: data.directness,
                                        humor: data.humor,
                                        emotionality: data.emotionality,
                                   },
                                   writingTraits: {
                                        avgSentenceLength: data.avgSentenceLength,
                                        usesQuestionsOften: data.usesQuestionsOften,
                                        usesEmojis: data.usesEmojis,
                                        emojiFrequency: data.emojiFrequency,
                                        usesBulletPoints: data.usesBulletPoints,
                                        usesShortParagraphs: data.usesShortParagraphs,
                                        usesHooks: data.usesHooks,
                                   },
                                   structurePreferences: {
                                        introStyle: data.introStyle,
                                        bodyStyle: data.bodyStyle,
                                        endingStyle: data.endingStyle,
                                   },
                                   vocabularyLevel: data.vocabularyLevel,
                                   commonPhrases: data.commonPhrases,
                                   bannedPhrases: data.bannedPhrases,
                                   samplePosts: data.samplePosts,
                                   learningIterations: 0,
                                   lastUpdated: new Date(),
                                   profileSource: data.profileSource,
                              },
                         });

                         // Retrieve and verify all required fields are present
                         const savedUser = await User.findById(user._id);
                         expect(savedUser).not.toBeNull();
                         expect(savedUser!.styleProfile).toBeDefined();

                         const profile = savedUser!.styleProfile!;

                         // Verify voiceType
                         expect(profile.voiceType).toBeDefined();
                         expect(profile.voiceType).toBe(data.voiceType);

                         // Verify tone metrics (all 5 fields)
                         expect(profile.tone).toBeDefined();
                         expect(profile.tone.formality).toBeDefined();
                         expect(profile.tone.enthusiasm).toBeDefined();
                         expect(profile.tone.directness).toBeDefined();
                         expect(profile.tone.humor).toBeDefined();
                         expect(profile.tone.emotionality).toBeDefined();

                         // Verify writing traits (all 7 fields)
                         expect(profile.writingTraits).toBeDefined();
                         expect(profile.writingTraits.avgSentenceLength).toBeDefined();
                         expect(profile.writingTraits.usesQuestionsOften).toBeDefined();
                         expect(profile.writingTraits.usesEmojis).toBeDefined();
                         expect(profile.writingTraits.emojiFrequency).toBeDefined();
                         expect(profile.writingTraits.usesBulletPoints).toBeDefined();
                         expect(profile.writingTraits.usesShortParagraphs).toBeDefined();
                         expect(profile.writingTraits.usesHooks).toBeDefined();

                         // Verify structure preferences (all 3 fields)
                         expect(profile.structurePreferences).toBeDefined();
                         expect(profile.structurePreferences.introStyle).toBeDefined();
                         expect(profile.structurePreferences.bodyStyle).toBeDefined();
                         expect(profile.structurePreferences.endingStyle).toBeDefined();

                         // Verify vocabulary level
                         expect(profile.vocabularyLevel).toBeDefined();
                         expect(profile.vocabularyLevel).toBe(data.vocabularyLevel);

                         // Verify phrases arrays (should be defined, even if empty)
                         expect(profile.commonPhrases).toBeDefined();
                         expect(Array.isArray(profile.commonPhrases)).toBe(true);
                         expect(profile.bannedPhrases).toBeDefined();
                         expect(Array.isArray(profile.bannedPhrases)).toBe(true);

                         // Verify sample posts
                         expect(profile.samplePosts).toBeDefined();
                         expect(Array.isArray(profile.samplePosts)).toBe(true);
                         expect(profile.samplePosts.length).toBeGreaterThan(0);

                         // Verify learning metadata
                         expect(profile.learningIterations).toBeDefined();
                         expect(profile.lastUpdated).toBeDefined();
                         expect(profile.profileSource).toBeDefined();
                    }
               ),
               { numRuns: 100 }
          );
     }, 90000);

     it('should allow users without styleProfile (backward compatibility)', async () => {
          await fc.assert(
               fc.asyncProperty(
                    fc.record({
                         githubId: fc.uuid(),
                         username: fc.string({ minLength: 1, maxLength: 30 }),
                         accessToken: fc.string({ minLength: 10, maxLength: 50 }),
                         avatarUrl: fc.webUrl(),
                    }),
                    async (data) => {
                         // Create user without styleProfile
                         const user = await User.create({
                              githubId: data.githubId,
                              username: data.username,
                              accessToken: data.accessToken,
                              avatarUrl: data.avatarUrl,
                         });

                         // Retrieve and verify user exists without styleProfile
                         const savedUser = await User.findById(user._id);
                         expect(savedUser).not.toBeNull();
                         expect(savedUser!.styleProfile).toBeUndefined();

                         // Verify voiceStrength has default value
                         expect(savedUser!.voiceStrength).toBe(80);
                    }
               ),
               { numRuns: 100 }
          );
     }, 90000);
});
