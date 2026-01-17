import { VoiceArchetype, IVoiceArchetype, ArchetypeCategory } from '../models/VoiceArchetype';
import { User, IUser, StyleProfile, ProfileSource } from '../models/User';
import mongoose from 'mongoose';
import { cacheService } from './CacheService';

export interface ApplyArchetypeParams {
     userId: string;
     archetypeId: string;
}

export interface CreateCustomArchetypeParams {
     name: string;
     description: string;
     category: ArchetypeCategory;
     styleProfile: StyleProfile;
     createdBy: string;
}

export class ArchetypeManagementService {
     /**
      * List all available archetypes
      * Uses cache with 24-hour TTL (rarely changes)
      */
     async listArchetypes(): Promise<IVoiceArchetype[]> {
          try {
               // Check cache first
               const cachedArchetypes = await cacheService.getArchetypeList();
               if (cachedArchetypes) {
                    return cachedArchetypes;
               }

               // Fetch from database
               const archetypes = await VoiceArchetype.find().sort({ usageCount: -1, name: 1 });

               // Cache the result
               await cacheService.setArchetypeList(archetypes);

               return archetypes;
          } catch (error: any) {
               throw new Error(`Failed to list archetypes: ${error.message}`);
          }
     }

     /**
      * Apply an archetype to a user's profile
      * Invalidates user's profile cache
      */
     async applyArchetype(params: ApplyArchetypeParams): Promise<StyleProfile> {
          const { userId, archetypeId } = params;

          try {
               // Find the archetype
               const archetype = await VoiceArchetype.findById(archetypeId);
               if (!archetype) {
                    throw new Error('Archetype not found');
               }

               // Find the user
               const user = await User.findById(userId);
               if (!user) {
                    throw new Error('User not found');
               }

               // Copy the archetype's styleProfile to the user
               const appliedProfile: StyleProfile = {
                    ...archetype.styleProfile,
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'archetype' as ProfileSource,
                    archetypeBase: archetype.name,
               };

               // Update user with the new profile
               user.styleProfile = appliedProfile;
               await user.save();

               // Invalidate user's profile cache
               await cacheService.invalidateStyleProfile(userId);
               await cacheService.invalidateEvolutionScore(userId);

               // Increment archetype usage count
               archetype.usageCount += 1;
               await archetype.save();

               // Invalidate archetype list cache (usage count changed)
               await cacheService.invalidateArchetypeList();

               return appliedProfile;
          } catch (error: any) {
               if (error.message.includes('not found')) {
                    throw error;
               }
               throw new Error(`Failed to apply archetype: ${error.message}`);
          }
     }

     /**
      * Create a custom archetype
      * Invalidates archetype list cache
      */
     async createCustomArchetype(params: CreateCustomArchetypeParams): Promise<IVoiceArchetype> {
          const { name, description, category, styleProfile, createdBy } = params;

          try {
               // Check if archetype with this name already exists
               const existing = await VoiceArchetype.findOne({ name });
               if (existing) {
                    throw new Error('Archetype with this name already exists');
               }

               // Create new archetype
               const archetype = new VoiceArchetype({
                    name,
                    description,
                    category,
                    styleProfile,
                    usageCount: 0,
                    isDefault: false,
                    createdBy: new mongoose.Types.ObjectId(createdBy),
               });

               await archetype.save();

               // Invalidate archetype list cache
               await cacheService.invalidateArchetypeList();

               return archetype;
          } catch (error: any) {
               if (error.message.includes('already exists')) {
                    throw error;
               }
               throw new Error(`Failed to create custom archetype: ${error.message}`);
          }
     }

     /**
      * Initialize default archetypes in the database
      */
     async initializeDefaultArchetypes(): Promise<void> {
          try {
               // Check if default archetypes already exist
               const existingCount = await VoiceArchetype.countDocuments({ isDefault: true });
               if (existingCount >= 4) {
                    return; // Already initialized
               }

               const defaultArchetypes = this.getDefaultArchetypes();

               // Insert or update each archetype
               for (const archetype of defaultArchetypes) {
                    await VoiceArchetype.findOneAndUpdate(
                         { name: archetype.name },
                         archetype,
                         { upsert: true, new: true }
                    );
               }
          } catch (error: any) {
               throw new Error(`Failed to initialize default archetypes: ${error.message}`);
          }
     }

     /**
      * Get the 4 pre-built default archetypes
      */
     private getDefaultArchetypes(): Partial<IVoiceArchetype>[] {
          return [
               {
                    name: 'Tech Twitter Influencer',
                    description: 'Casual, direct, emoji-heavy style perfect for engaging tech Twitter threads. Short punchy sentences with hooks and CTAs.',
                    category: 'casual' as ArchetypeCategory,
                    isDefault: true,
                    usageCount: 0,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 2,
                              enthusiasm: 8,
                              directness: 9,
                              humor: 7,
                              emotionality: 6,
                         },
                         writingTraits: {
                              avgSentenceLength: 12,
                              usesQuestionsOften: true,
                              usesEmojis: true,
                              emojiFrequency: 4,
                              usesBulletPoints: true,
                              usesShortParagraphs: true,
                              usesHooks: true,
                         },
                         structurePreferences: {
                              introStyle: 'hook',
                              bodyStyle: 'bullets',
                              endingStyle: 'cta',
                         },
                         vocabularyLevel: 'simple',
                         commonPhrases: [
                              'Here\'s the thing',
                              'Let me break this down',
                              'This is huge',
                              'Game changer',
                              'Hot take',
                              'Thread 🧵',
                         ],
                         bannedPhrases: [
                              'leverage',
                              'synergy',
                              'paradigm shift',
                              'circle back',
                         ],
                         samplePosts: [
                              '🚀 Just shipped a new feature that cuts build time by 50%. Here\'s how we did it...',
                              'Hot take: Most developers overthink architecture. Start simple, iterate fast. 💡',
                              'Thread 🧵 on why I switched from X to Y and never looked back:',
                         ],
                         learningIterations: 0,
                         lastUpdated: new Date(),
                         profileSource: 'archetype',
                    },
               },
               {
                    name: 'LinkedIn Thought Leader',
                    description: 'Professional yet approachable style for LinkedIn posts. Storytelling with insights, medium-length thoughtful content.',
                    category: 'professional' as ArchetypeCategory,
                    isDefault: true,
                    usageCount: 0,
                    styleProfile: {
                         voiceType: 'storytelling',
                         tone: {
                              formality: 6,
                              enthusiasm: 6,
                              directness: 7,
                              humor: 4,
                              emotionality: 5,
                         },
                         writingTraits: {
                              avgSentenceLength: 18,
                              usesQuestionsOften: true,
                              usesEmojis: false,
                              emojiFrequency: 1,
                              usesBulletPoints: true,
                              usesShortParagraphs: false,
                              usesHooks: true,
                         },
                         structurePreferences: {
                              introStyle: 'story',
                              bodyStyle: 'narrative',
                              endingStyle: 'reflection',
                         },
                         vocabularyLevel: 'medium',
                         commonPhrases: [
                              'In my experience',
                              'What I\'ve learned',
                              'The key insight',
                              'This taught me',
                              'Looking back',
                              'Here\'s what matters',
                         ],
                         bannedPhrases: [
                              'crushing it',
                              'hustle culture',
                              'grind',
                              'beast mode',
                         ],
                         samplePosts: [
                              'Three years ago, I made a decision that changed my career trajectory. Here\'s what I learned about taking calculated risks...',
                              'The best advice I ever received came from an unexpected source. It taught me that leadership isn\'t about having all the answers.',
                              'We just hit a major milestone, but the journey taught me more than the destination. Here are the key lessons...',
                         ],
                         learningIterations: 0,
                         lastUpdated: new Date(),
                         profileSource: 'archetype',
                    },
               },
               {
                    name: 'Meme Lord',
                    description: 'Humorous, very casual style with heavy emoji use and internet slang. Perfect for fun, engaging social content.',
                    category: 'creative' as ArchetypeCategory,
                    isDefault: true,
                    usageCount: 0,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 1,
                              enthusiasm: 9,
                              directness: 8,
                              humor: 10,
                              emotionality: 7,
                         },
                         writingTraits: {
                              avgSentenceLength: 8,
                              usesQuestionsOften: true,
                              usesEmojis: true,
                              emojiFrequency: 5,
                              usesBulletPoints: false,
                              usesShortParagraphs: true,
                              usesHooks: true,
                         },
                         structurePreferences: {
                              introStyle: 'hook',
                              bodyStyle: 'narrative',
                              endingStyle: 'question',
                         },
                         vocabularyLevel: 'simple',
                         commonPhrases: [
                              'no cap',
                              'fr fr',
                              'this hits different',
                              'not gonna lie',
                              'big mood',
                              'chef\'s kiss',
                         ],
                         bannedPhrases: [
                              'professional',
                              'corporate',
                              'enterprise',
                              'stakeholder',
                         ],
                         samplePosts: [
                              'POV: you just discovered a bug in production 💀💀💀',
                              'me: gonna write clean code today. also me: *copies from stackoverflow* 😂',
                              'that feeling when your code works on the first try 🎉 (it never happens fr fr)',
                         ],
                         learningIterations: 0,
                         lastUpdated: new Date(),
                         profileSource: 'archetype',
                    },
               },
               {
                    name: 'Academic Researcher',
                    description: 'Formal, analytical style with technical vocabulary. Long, well-structured sentences perfect for detailed technical content.',
                    category: 'technical' as ArchetypeCategory,
                    isDefault: true,
                    usageCount: 0,
                    styleProfile: {
                         voiceType: 'analytical',
                         tone: {
                              formality: 9,
                              enthusiasm: 4,
                              directness: 6,
                              humor: 2,
                              emotionality: 3,
                         },
                         writingTraits: {
                              avgSentenceLength: 25,
                              usesQuestionsOften: false,
                              usesEmojis: false,
                              emojiFrequency: 0,
                              usesBulletPoints: true,
                              usesShortParagraphs: false,
                              usesHooks: false,
                         },
                         structurePreferences: {
                              introStyle: 'problem',
                              bodyStyle: 'analysis',
                              endingStyle: 'summary',
                         },
                         vocabularyLevel: 'advanced',
                         commonPhrases: [
                              'Our findings indicate',
                              'The data suggests',
                              'It is worth noting',
                              'Furthermore',
                              'In conclusion',
                              'The implications of this',
                         ],
                         bannedPhrases: [
                              'awesome',
                              'cool',
                              'stuff',
                              'things',
                         ],
                         samplePosts: [
                              'Our recent analysis of distributed systems performance reveals several counterintuitive patterns that challenge conventional wisdom in the field.',
                              'The implementation demonstrates a novel approach to consensus algorithms, with particular emphasis on fault tolerance under Byzantine conditions.',
                              'This paper presents a comprehensive evaluation of machine learning architectures, examining their computational complexity and practical applicability.',
                         ],
                         learningIterations: 0,
                         lastUpdated: new Date(),
                         profileSource: 'archetype',
                    },
               },
          ];
     }
}
