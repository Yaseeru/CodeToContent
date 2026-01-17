import { ArchetypeManagementService } from '../ArchetypeManagementService';
import { VoiceArchetype, IVoiceArchetype } from '../../models/VoiceArchetype';
import { User, IUser, StyleProfile } from '../../models/User';
import mongoose from 'mongoose';

// Mock the models
jest.mock('../../models/VoiceArchetype');
jest.mock('../../models/User');

describe('Archetype Management Service - Unit Tests', () => {
     let service: ArchetypeManagementService;
     let mockArchetypes: any[];
     let mockUsers: Map<string, any>;

     beforeEach(() => {
          service = new ArchetypeManagementService();
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
      * Test archetype listing
      * Validates: Requirements 7.1, 7.4
      */
     describe('listArchetypes', () => {
          it('should return all archetypes sorted by usage count', async () => {
               // Initialize default archetypes
               await service.initializeDefaultArchetypes();

               // List archetypes
               const archetypes = await service.listArchetypes();

               expect(archetypes).toBeDefined();
               expect(archetypes.length).toBe(4);
               expect(archetypes.every(a => a.isDefault)).toBe(true);
          });

          it('should return empty array when no archetypes exist', async () => {
               const archetypes = await service.listArchetypes();
               expect(archetypes).toEqual([]);
          });

          it('should include all required fields for each archetype', async () => {
               await service.initializeDefaultArchetypes();
               const archetypes = await service.listArchetypes();

               archetypes.forEach(archetype => {
                    expect(archetype.name).toBeDefined();
                    expect(archetype.description).toBeDefined();
                    expect(archetype.category).toBeDefined();
                    expect(archetype.styleProfile).toBeDefined();
                    expect(archetype.usageCount).toBeDefined();
                    expect(archetype.isDefault).toBeDefined();
               });
          });
     });

     /**
      * Test archetype application
      * Validates: Requirements 7.2, 7.3
      */
     describe('applyArchetype', () => {
          it('should apply archetype to user profile', async () => {
               // Initialize default archetypes
               await service.initializeDefaultArchetypes();
               const archetypes = mockArchetypes.filter(a => a.isDefault);
               const archetype = archetypes[0];

               // Create a test user
               const user = new User({
                    githubId: 'test-user',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });
               await user.save();

               // Apply archetype
               const appliedProfile = await service.applyArchetype({
                    userId: user._id.toString(),
                    archetypeId: archetype._id.toString(),
               });

               expect(appliedProfile).toBeDefined();
               expect(appliedProfile.voiceType).toBe(archetype.styleProfile.voiceType);
               expect(appliedProfile.profileSource).toBe('archetype');
               expect(appliedProfile.archetypeBase).toBe(archetype.name);
               expect(appliedProfile.learningIterations).toBe(0);
          });

          it('should increment archetype usage count', async () => {
               await service.initializeDefaultArchetypes();
               const archetypes = mockArchetypes.filter(a => a.isDefault);
               const archetype = archetypes[0];
               const initialUsageCount = archetype.usageCount;

               const user = new User({
                    githubId: 'test-user',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });
               await user.save();

               await service.applyArchetype({
                    userId: user._id.toString(),
                    archetypeId: archetype._id.toString(),
               });

               expect(archetype.usageCount).toBe(initialUsageCount + 1);
          });

          it('should throw error when archetype not found', async () => {
               const user = new User({
                    githubId: 'test-user',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });
               await user.save();

               await expect(
                    service.applyArchetype({
                         userId: user._id.toString(),
                         archetypeId: new mongoose.Types.ObjectId().toString(),
                    })
               ).rejects.toThrow('Archetype not found');
          });

          it('should throw error when user not found', async () => {
               await service.initializeDefaultArchetypes();
               const archetypes = mockArchetypes.filter(a => a.isDefault);
               const archetype = archetypes[0];

               await expect(
                    service.applyArchetype({
                         userId: new mongoose.Types.ObjectId().toString(),
                         archetypeId: archetype._id.toString(),
                    })
               ).rejects.toThrow('User not found');
          });
     });

     /**
      * Test profile customization after archetype
      * Validates: Requirements 7.3
      */
     describe('profile customization after archetype', () => {
          it('should allow customization after archetype application', async () => {
               await service.initializeDefaultArchetypes();
               const archetypes = mockArchetypes.filter(a => a.isDefault);
               const archetype = archetypes[0];

               const user = new User({
                    githubId: 'test-user',
                    username: 'testuser',
                    accessToken: 'test-token',
                    avatarUrl: 'https://example.com/avatar.jpg',
               });
               await user.save();

               // Apply archetype
               await service.applyArchetype({
                    userId: user._id.toString(),
                    archetypeId: archetype._id.toString(),
               });

               // Customize profile
               const updatedUser = mockUsers.get(user._id.toString());
               updatedUser.styleProfile.tone.formality = 8;
               updatedUser.styleProfile.learningIterations = 5;

               // Verify customizations are preserved
               expect(updatedUser.styleProfile.tone.formality).toBe(8);
               expect(updatedUser.styleProfile.learningIterations).toBe(5);
               expect(updatedUser.styleProfile.archetypeBase).toBe(archetype.name);
          });
     });

     /**
      * Test usage count tracking
      * Validates: Requirements 7.5
      */
     describe('usage count tracking', () => {
          it('should track usage count for each archetype', async () => {
               await service.initializeDefaultArchetypes();
               const archetypes = mockArchetypes.filter(a => a.isDefault);
               const archetype = archetypes[0];

               // Create multiple users and apply archetype
               for (let i = 0; i < 3; i++) {
                    const user = new User({
                         githubId: `test-user-${i}`,
                         username: `testuser${i}`,
                         accessToken: 'test-token',
                         avatarUrl: 'https://example.com/avatar.jpg',
                    });
                    await user.save();

                    await service.applyArchetype({
                         userId: user._id.toString(),
                         archetypeId: archetype._id.toString(),
                    });
               }

               expect(archetype.usageCount).toBe(3);
          });
     });

     /**
      * Test custom archetype creation
      * Validates: Requirements 7.6
      */
     describe('createCustomArchetype', () => {
          it('should create a custom archetype', async () => {
               const customProfile: StyleProfile = {
                    voiceType: 'casual',
                    tone: {
                         formality: 5,
                         enthusiasm: 7,
                         directness: 6,
                         humor: 8,
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
                    commonPhrases: ['Let me explain', 'Here is the thing'],
                    bannedPhrases: ['synergy', 'leverage'],
                    samplePosts: ['Sample post 1', 'Sample post 2'],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'archetype',
               };

               const archetype = await service.createCustomArchetype({
                    name: 'Custom Archetype',
                    description: 'A custom archetype for testing',
                    category: 'creative',
                    styleProfile: customProfile,
                    createdBy: new mongoose.Types.ObjectId().toString(),
               });

               expect(archetype).toBeDefined();
               expect(archetype.name).toBe('Custom Archetype');
               expect(archetype.description).toBe('A custom archetype for testing');
               expect(archetype.category).toBe('creative');
               expect(archetype.isDefault).toBe(false);
               expect(archetype.usageCount).toBe(0);
          });

          it('should throw error when archetype name already exists', async () => {
               await service.initializeDefaultArchetypes();

               const customProfile: StyleProfile = {
                    voiceType: 'casual',
                    tone: {
                         formality: 5,
                         enthusiasm: 7,
                         directness: 6,
                         humor: 8,
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
                    profileSource: 'archetype',
               };

               await expect(
                    service.createCustomArchetype({
                         name: 'Tech Twitter Influencer', // Already exists
                         description: 'Duplicate name',
                         category: 'casual',
                         styleProfile: customProfile,
                         createdBy: new mongoose.Types.ObjectId().toString(),
                    })
               ).rejects.toThrow('Archetype with this name already exists');
          });
     });

     /**
      * Test default archetypes initialization
      * Validates: Requirements 7.1
      */
     describe('initializeDefaultArchetypes', () => {
          it('should initialize 4 default archetypes', async () => {
               await service.initializeDefaultArchetypes();

               expect(mockArchetypes.length).toBe(4);
               expect(mockArchetypes.every(a => a.isDefault)).toBe(true);
          });

          it('should not duplicate archetypes on multiple initializations', async () => {
               await service.initializeDefaultArchetypes();
               const firstCount = mockArchetypes.length;

               await service.initializeDefaultArchetypes();
               const secondCount = mockArchetypes.length;

               expect(secondCount).toBe(firstCount);
          });

          it('should create archetypes with correct names', async () => {
               await service.initializeDefaultArchetypes();

               const names = mockArchetypes.map(a => a.name);
               expect(names).toContain('Tech Twitter Influencer');
               expect(names).toContain('LinkedIn Thought Leader');
               expect(names).toContain('Meme Lord');
               expect(names).toContain('Academic Researcher');
          });

          it('should create archetypes with complete style profiles', async () => {
               await service.initializeDefaultArchetypes();

               mockArchetypes.forEach(archetype => {
                    expect(archetype.styleProfile).toBeDefined();
                    expect(archetype.styleProfile.voiceType).toBeDefined();
                    expect(archetype.styleProfile.tone).toBeDefined();
                    expect(archetype.styleProfile.writingTraits).toBeDefined();
                    expect(archetype.styleProfile.structurePreferences).toBeDefined();
                    expect(archetype.styleProfile.vocabularyLevel).toBeDefined();
                    expect(Array.isArray(archetype.styleProfile.commonPhrases)).toBe(true);
                    expect(Array.isArray(archetype.styleProfile.bannedPhrases)).toBe(true);
                    expect(Array.isArray(archetype.styleProfile.samplePosts)).toBe(true);
               });
          });
     });
});
