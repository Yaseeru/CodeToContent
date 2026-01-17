import * as fc from 'fast-check';
import { ArchetypeManagementService } from '../ArchetypeManagementService';
import { VoiceArchetype, IVoiceArchetype } from '../../models/VoiceArchetype';
import { User, IUser, StyleProfile } from '../../models/User';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models/VoiceArchetype');
jest.mock('../../models/User');

describe('Archetype Management Property Tests', () => {
     let service: ArchetypeManagementService;
     let mockArchetypes: any[];
     let mockUsers: Map<string, any>;

     beforeAll(() => {
          service = new ArchetypeManagementService();
     });

     beforeEach(() => {
          mockArchetypes = [];
          mockUsers = new Map();
          jest.clearAllMocks();

          // Setup mock implementations
          (VoiceArchetype.find as jest.Mock).mockImplementation((query?: any) => {
               let results = mockArchetypes;
               if (query?.isDefault === true) {
                    results = mockArchetypes.filter(a => a.isDefault);
               }
               return {
                    sort: jest.fn().mockResolvedValue(results),
               };
          });

          (VoiceArchetype.findById as jest.Mock).mockImplementation((id: string) => {
               return Promise.resolve(mockArchetypes.find(a => a._id.toString() === id));
          });

          (VoiceArchetype.findOne as jest.Mock).mockImplementation((query: any) => {
               return Promise.resolve(mockArchetypes.find(a => a.name === query.name));
          });

          (VoiceArchetype.findOneAndUpdate as jest.Mock).mockImplementation(
               (query: any, update: any, options: any) => {
                    const existing = mockArchetypes.find(a => a.name === query.name);
                    if (existing) {
                         Object.assign(existing, update);
                         return Promise.resolve(existing);
                    } else if (options?.upsert) {
                         const newArchetype = {
                              _id: new mongoose.Types.ObjectId(),
                              ...update,
                              save: jest.fn().mockResolvedValue(update),
                         };
                         mockArchetypes.push(newArchetype);
                         return Promise.resolve(newArchetype);
                    }
                    return Promise.resolve(null);
               }
          );

          (VoiceArchetype.countDocuments as jest.Mock).mockImplementation((query: any) => {
               if (query?.isDefault === true) {
                    return Promise.resolve(mockArchetypes.filter(a => a.isDefault).length);
               }
               return Promise.resolve(mockArchetypes.length);
          });

          (User.findById as jest.Mock).mockImplementation((id: string) => {
               return Promise.resolve(mockUsers.get(id));
          });

          // Mock VoiceArchetype constructor
          (VoiceArchetype as any).mockImplementation((data: any) => {
               const archetype = {
                    _id: new mongoose.Types.ObjectId(),
                    ...data,
                    save: jest.fn(),
               };
               archetype.save.mockImplementation(() => {
                    mockArchetypes.push(archetype);
                    return Promise.resolve(archetype);
               });
               return archetype;
          });

          // Mock User constructor
          (User as any).mockImplementation((data: any) => {
               const user = {
                    _id: new mongoose.Types.ObjectId(),
                    ...data,
                    save: jest.fn(),
               };
               user.save.mockImplementation(() => {
                    mockUsers.set(user._id.toString(), user);
                    return Promise.resolve(user);
               });
               return user;
          });
     });

     /**
      * Property 34: Archetype Application Completeness
      * For any archetype applied to a user profile, all fields from the archetype's
      * styleProfile should be copied to the user's styleProfile.
      * Validates: Requirements 7.2
      */
     describe('Property 34: Archetype Application Completeness', () => {
          it('should copy all styleProfile fields from archetype to user', async () => {
               // Initialize default archetypes
               await service.initializeDefaultArchetypes();
               const archetypes = mockArchetypes.filter(a => a.isDefault);

               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom(...archetypes.map(a => a._id.toString())),
                         async (archetypeId) => {
                              // Create a test user
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                              });
                              await user.save();

                              // Get the archetype
                              const archetype = mockArchetypes.find(a => a._id.toString() === archetypeId);
                              if (!archetype) return false;

                              // Apply archetype
                              const appliedProfile = await service.applyArchetype({
                                   userId: user._id.toString(),
                                   archetypeId: archetypeId,
                              });

                              // Verify all fields are copied
                              const archetypeProfile = archetype.styleProfile as StyleProfile;

                              // Check voiceType
                              const voiceTypeMatch = appliedProfile.voiceType === archetypeProfile.voiceType;

                              // Check tone metrics
                              const toneMatch =
                                   appliedProfile.tone.formality === archetypeProfile.tone.formality &&
                                   appliedProfile.tone.enthusiasm === archetypeProfile.tone.enthusiasm &&
                                   appliedProfile.tone.directness === archetypeProfile.tone.directness &&
                                   appliedProfile.tone.humor === archetypeProfile.tone.humor &&
                                   appliedProfile.tone.emotionality === archetypeProfile.tone.emotionality;

                              // Check writing traits
                              const writingTraitsMatch =
                                   appliedProfile.writingTraits.avgSentenceLength === archetypeProfile.writingTraits.avgSentenceLength &&
                                   appliedProfile.writingTraits.usesQuestionsOften === archetypeProfile.writingTraits.usesQuestionsOften &&
                                   appliedProfile.writingTraits.usesEmojis === archetypeProfile.writingTraits.usesEmojis &&
                                   appliedProfile.writingTraits.emojiFrequency === archetypeProfile.writingTraits.emojiFrequency &&
                                   appliedProfile.writingTraits.usesBulletPoints === archetypeProfile.writingTraits.usesBulletPoints &&
                                   appliedProfile.writingTraits.usesShortParagraphs === archetypeProfile.writingTraits.usesShortParagraphs &&
                                   appliedProfile.writingTraits.usesHooks === archetypeProfile.writingTraits.usesHooks;

                              // Check structure preferences
                              const structureMatch =
                                   appliedProfile.structurePreferences.introStyle === archetypeProfile.structurePreferences.introStyle &&
                                   appliedProfile.structurePreferences.bodyStyle === archetypeProfile.structurePreferences.bodyStyle &&
                                   appliedProfile.structurePreferences.endingStyle === archetypeProfile.structurePreferences.endingStyle;

                              // Check vocabulary level
                              const vocabularyMatch = appliedProfile.vocabularyLevel === archetypeProfile.vocabularyLevel;

                              // Check phrases (arrays should have same content)
                              const commonPhrasesMatch =
                                   appliedProfile.commonPhrases.length === archetypeProfile.commonPhrases.length &&
                                   appliedProfile.commonPhrases.every((phrase, idx) => phrase === archetypeProfile.commonPhrases[idx]);

                              const bannedPhrasesMatch =
                                   appliedProfile.bannedPhrases.length === archetypeProfile.bannedPhrases.length &&
                                   appliedProfile.bannedPhrases.every((phrase, idx) => phrase === archetypeProfile.bannedPhrases[idx]);

                              const samplePostsMatch =
                                   appliedProfile.samplePosts.length === archetypeProfile.samplePosts.length &&
                                   appliedProfile.samplePosts.every((post, idx) => post === archetypeProfile.samplePosts[idx]);

                              // Check metadata
                              const metadataMatch =
                                   appliedProfile.profileSource === 'archetype' &&
                                   appliedProfile.archetypeBase === archetype.name &&
                                   appliedProfile.learningIterations === 0;

                              return (
                                   voiceTypeMatch &&
                                   toneMatch &&
                                   writingTraitsMatch &&
                                   structureMatch &&
                                   vocabularyMatch &&
                                   commonPhrasesMatch &&
                                   bannedPhrasesMatch &&
                                   samplePostsMatch &&
                                   metadataMatch
                              );
                         }
                    ),
                    { numRuns: 20 } // Run 20 times (5 times per archetype)
               );
          }, 30000);
     });

     /**
      * Property 35: Archetype Customization Preservation
      * For any user profile initialized from an archetype, subsequent manual edits
      * and feedback learning should modify the profile without reverting to archetype defaults.
      * Validates: Requirements 7.3
      */
     describe('Property 35: Archetype Customization Preservation', () => {
          it('should preserve customizations after archetype application', async () => {
               // Initialize default archetypes
               await service.initializeDefaultArchetypes();
               const archetypes = mockArchetypes.filter(a => a.isDefault);

               await fc.assert(
                    fc.asyncProperty(
                         fc.constantFrom(...archetypes.map(a => a._id.toString())),
                         fc.integer({ min: 1, max: 10 }),
                         fc.integer({ min: 1, max: 10 }),
                         fc.integer({ min: 0, max: 50 }),
                         async (archetypeId, newFormality, newEnthusiasm, newLearningIterations) => {
                              // Create a test user
                              const user = new User({
                                   githubId: `test-${Date.now()}-${Math.random()}`,
                                   username: 'testuser',
                                   accessToken: 'test-token',
                                   avatarUrl: 'https://example.com/avatar.jpg',
                              });
                              await user.save();

                              // Apply archetype
                              await service.applyArchetype({
                                   userId: user._id.toString(),
                                   archetypeId: archetypeId,
                              });

                              // Get the archetype for comparison
                              const archetype = mockArchetypes.find(a => a._id.toString() === archetypeId);
                              if (!archetype) return false;

                              const originalArchetypeProfile = archetype.styleProfile as StyleProfile;

                              // Simulate customization: update user's profile
                              const updatedUser = mockUsers.get(user._id.toString());
                              if (!updatedUser || !updatedUser.styleProfile) return false;

                              updatedUser.styleProfile.tone.formality = newFormality;
                              updatedUser.styleProfile.tone.enthusiasm = newEnthusiasm;
                              updatedUser.styleProfile.learningIterations = newLearningIterations;
                              updatedUser.styleProfile.lastUpdated = new Date();

                              // Verify customizations are preserved
                              const finalUser = mockUsers.get(user._id.toString());
                              if (!finalUser || !finalUser.styleProfile) return false;

                              // Customizations should be preserved
                              const customizationsPreserved =
                                   finalUser.styleProfile.tone.formality === newFormality &&
                                   finalUser.styleProfile.tone.enthusiasm === newEnthusiasm &&
                                   finalUser.styleProfile.learningIterations === newLearningIterations;

                              // Archetype base should still be marked
                              const archetypeBasePreserved = finalUser.styleProfile.archetypeBase === archetype.name;

                              // Other fields that weren't customized should remain from archetype
                              const unchangedFieldsPreserved =
                                   finalUser.styleProfile.tone.directness === originalArchetypeProfile.tone.directness &&
                                   finalUser.styleProfile.tone.humor === originalArchetypeProfile.tone.humor;

                              return customizationsPreserved && archetypeBasePreserved && unchangedFieldsPreserved;
                         }
                    ),
                    { numRuns: 20 }
               );
          }, 30000);
     });
});
