import mongoose from 'mongoose';
import { ContentGenerationService } from '../ContentGenerationService';
import { Analysis } from '../../models/Analysis';
import { User } from '../../models/User';
import { Repository } from '../../models/Repository';
import { Content } from '../../models/Content';

// Unit tests for voice-aware content generation
// Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6, 6.2, 6.3, 6.4
describe('ContentGenerationService Voice-Aware Unit Tests', () => {
     let contentService: ContentGenerationService;

     beforeAll(() => {
          process.env.GEMINI_API_KEY = 'test_gemini_api_key';
          contentService = new ContentGenerationService(process.env.GEMINI_API_KEY);
     });

     describe('Profile Check Logic', () => {
          test('should use voice-aware generation when user has styleProfile', async () => {
               // Create test user WITH styleProfile
               const user = new User({
                    githubId: 'github_with_profile',
                    username: 'testuser_with_profile',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 5,
                              enthusiasm: 7,
                              directness: 8,
                              humor: 6,
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
                         commonPhrases: ['let\'s dive in', 'game changer'],
                         bannedPhrases: ['leverage', 'synergy'],
                         samplePosts: ['Sample post 1', 'Sample post 2', 'Sample post 3'],
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_with_profile',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Mock Gemini API
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockResolvedValue('Generated content in user voice');

               try {
                    // Generate content
                    const content = await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                    });

                    // Verify voice-aware generation was used
                    expect(content.usedStyleProfile).toBe(true);
                    expect(content.voiceStrengthUsed).toBe(80);
                    expect(content.evolutionScoreAtGeneration).toBeGreaterThan(0);
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });

          test('should use tone-based generation when user has NO styleProfile', async () => {
               // Create test user WITHOUT styleProfile
               const user = new User({
                    githubId: 'github_no_profile',
                    username: 'testuser_no_profile',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_no_profile',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Mock Gemini API
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockResolvedValue('Generated content with tone');

               try {
                    // Generate content
                    const content = await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                    });

                    // Verify tone-based generation was used (no profile)
                    expect(content.usedStyleProfile).toBe(false);
                    expect(content.voiceStrengthUsed).toBe(80); // Default voiceStrength
                    expect(content.evolutionScoreAtGeneration).toBe(0);
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });
     });

     describe('Sample Selection', () => {
          test('should select all samples when user has 3-6 samples', async () => {
               const samplePosts = ['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4'];

               // Create test user with 4 samples
               const user = new User({
                    githubId: 'github_4_samples',
                    username: 'testuser_4_samples',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 5,
                              enthusiasm: 7,
                              directness: 8,
                              humor: 6,
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
                         samplePosts: samplePosts,
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_4_samples',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Track the prompt
               let capturedPrompt = '';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockImplementation(async (...args: any[]) => {
                         capturedPrompt = args[0] as string;
                         return 'Generated content';
                    });

               try {
                    // Generate content
                    await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                    });

                    // Verify all 4 samples are in the prompt
                    samplePosts.forEach((sample) => {
                         expect(capturedPrompt).toContain(sample);
                    });

                    // Count examples
                    const exampleMatches = capturedPrompt.match(/Example \d+:/g);
                    expect(exampleMatches?.length).toBe(4);
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });

          test('should select exactly 6 samples when user has more than 6 samples', async () => {
               const samplePosts = [
                    'Sample 1',
                    'Sample 2',
                    'Sample 3',
                    'Sample 4',
                    'Sample 5',
                    'Sample 6',
                    'Sample 7',
                    'Sample 8',
                    'Sample 9',
                    'Sample 10',
               ];

               // Create test user with 10 samples
               const user = new User({
                    githubId: 'github_10_samples',
                    username: 'testuser_10_samples',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 5,
                              enthusiasm: 7,
                              directness: 8,
                              humor: 6,
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
                         samplePosts: samplePosts,
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_10_samples',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Track the prompt
               let capturedPrompt = '';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockImplementation(async (...args: any[]) => {
                         capturedPrompt = args[0] as string;
                         return 'Generated content';
                    });

               try {
                    // Generate content
                    await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                    });

                    // Count examples - should be exactly 6
                    const exampleMatches = capturedPrompt.match(/Example \d+:/g);
                    expect(exampleMatches?.length).toBe(6);
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });
     });

     describe('Prompt Construction with Profile Data', () => {
          test('should include tone metrics, writing traits, and structure preferences in prompt', async () => {
               // Create test user with specific profile
               const user = new User({
                    githubId: 'github_prompt_test',
                    username: 'testuser_prompt',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80,
                    styleProfile: {
                         voiceType: 'educational',
                         tone: {
                              formality: 8,
                              enthusiasm: 6,
                              directness: 7,
                              humor: 3,
                              emotionality: 4,
                         },
                         writingTraits: {
                              avgSentenceLength: 20,
                              usesQuestionsOften: true,
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
                         commonPhrases: ['it is important to note', 'consider the following'],
                         bannedPhrases: ['basically', 'literally'],
                         samplePosts: ['Educational sample 1', 'Educational sample 2', 'Educational sample 3'],
                         learningIterations: 10,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_prompt_test',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Track the prompt
               let capturedPrompt = '';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockImplementation(async (...args: any[]) => {
                         capturedPrompt = args[0] as string;
                         return 'Generated content';
                    });

               try {
                    // Generate content
                    await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                    });

                    // Verify voice type
                    expect(capturedPrompt).toContain('educational');

                    // Verify tone metrics
                    expect(capturedPrompt).toContain('Formality:');
                    expect(capturedPrompt).toContain('8/10');
                    expect(capturedPrompt).toContain('Enthusiasm:');
                    expect(capturedPrompt).toContain('6/10');

                    // Verify writing traits
                    expect(capturedPrompt).toContain('20 words');
                    expect(capturedPrompt).toContain('questions');
                    expect(capturedPrompt).toContain('bullet points');

                    // Verify structure preferences
                    expect(capturedPrompt).toContain('problem');
                    expect(capturedPrompt).toContain('analysis');
                    expect(capturedPrompt).toContain('summary');

                    // Verify vocabulary level
                    expect(capturedPrompt).toContain('advanced');

                    // Verify common phrases
                    expect(capturedPrompt).toContain('it is important to note');
                    expect(capturedPrompt).toContain('consider the following');

                    // Verify banned phrases
                    expect(capturedPrompt).toContain('basically');
                    expect(capturedPrompt).toContain('literally');
                    expect(capturedPrompt).toContain('AVOID');
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });
     });

     describe('Voice Strength Blending', () => {
          test('should use tone-based generation when voiceStrength is 0%', async () => {
               // Create test user with styleProfile
               const user = new User({
                    githubId: 'github_voice_0',
                    username: 'testuser_voice_0',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80, // Default, will be overridden
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 3,
                              enthusiasm: 9,
                              directness: 8,
                              humor: 7,
                              emotionality: 6,
                         },
                         writingTraits: {
                              avgSentenceLength: 12,
                              usesQuestionsOften: true,
                              usesEmojis: true,
                              emojiFrequency: 4,
                              usesBulletPoints: false,
                              usesShortParagraphs: true,
                              usesHooks: true,
                         },
                         structurePreferences: {
                              introStyle: 'hook',
                              bodyStyle: 'narrative',
                              endingStyle: 'cta',
                         },
                         vocabularyLevel: 'simple',
                         commonPhrases: [],
                         bannedPhrases: [],
                         samplePosts: ['Sample 1', 'Sample 2', 'Sample 3'],
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_voice_0',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Mock Gemini API
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockResolvedValue('Generated content without voice');

               try {
                    // Generate content with voiceStrength = 0
                    const content = await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                         voiceStrength: 0,
                    });

                    // Verify tone-based generation was used (no profile)
                    expect(content.usedStyleProfile).toBe(false);
                    expect(content.voiceStrengthUsed).toBe(0);
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });

          test('should include blending guidance when voiceStrength is 50%', async () => {
               // Create test user with styleProfile
               const user = new User({
                    githubId: 'github_voice_50',
                    username: 'testuser_voice_50',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 3,
                              enthusiasm: 9,
                              directness: 8,
                              humor: 7,
                              emotionality: 6,
                         },
                         writingTraits: {
                              avgSentenceLength: 12,
                              usesQuestionsOften: true,
                              usesEmojis: true,
                              emojiFrequency: 4,
                              usesBulletPoints: false,
                              usesShortParagraphs: true,
                              usesHooks: true,
                         },
                         structurePreferences: {
                              introStyle: 'hook',
                              bodyStyle: 'narrative',
                              endingStyle: 'cta',
                         },
                         vocabularyLevel: 'simple',
                         commonPhrases: [],
                         bannedPhrases: [],
                         samplePosts: ['Sample 1', 'Sample 2', 'Sample 3'],
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_voice_50',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Track the prompt
               let capturedPrompt = '';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockImplementation(async (...args: any[]) => {
                         capturedPrompt = args[0] as string;
                         return 'Generated content';
                    });

               try {
                    // Generate content with voiceStrength = 50
                    const content = await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                         voiceStrength: 50,
                    });

                    // Verify voice-aware generation was used
                    expect(content.usedStyleProfile).toBe(true);
                    expect(content.voiceStrengthUsed).toBe(50);

                    // Verify blending guidance in prompt
                    expect(capturedPrompt).toContain('Voice Strength: 50%');
                    expect(capturedPrompt).toContain('match the user\'s style while allowing some creative flexibility');
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });

          test('should include strong matching guidance when voiceStrength is 100%', async () => {
               // Create test user with styleProfile
               const user = new User({
                    githubId: 'github_voice_100',
                    username: 'testuser_voice_100',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 3,
                              enthusiasm: 9,
                              directness: 8,
                              humor: 7,
                              emotionality: 6,
                         },
                         writingTraits: {
                              avgSentenceLength: 12,
                              usesQuestionsOften: true,
                              usesEmojis: true,
                              emojiFrequency: 4,
                              usesBulletPoints: false,
                              usesShortParagraphs: true,
                              usesHooks: true,
                         },
                         structurePreferences: {
                              introStyle: 'hook',
                              bodyStyle: 'narrative',
                              endingStyle: 'cta',
                         },
                         vocabularyLevel: 'simple',
                         commonPhrases: [],
                         bannedPhrases: [],
                         samplePosts: ['Sample 1', 'Sample 2', 'Sample 3'],
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_voice_100',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Track the prompt
               let capturedPrompt = '';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockImplementation(async (...args: any[]) => {
                         capturedPrompt = args[0] as string;
                         return 'Generated content';
                    });

               try {
                    // Generate content with voiceStrength = 100
                    const content = await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                         voiceStrength: 100,
                    });

                    // Verify voice-aware generation was used
                    expect(content.usedStyleProfile).toBe(true);
                    expect(content.voiceStrengthUsed).toBe(100);

                    // Verify strong matching guidance in prompt
                    expect(capturedPrompt).toContain('Voice Strength: 100%');
                    expect(capturedPrompt).toContain('closely match the user\'s authentic voice');
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });
     });

     describe('Fallback to Tone-Based Generation', () => {
          test('should fallback to tone-based generation when voice-aware generation fails', async () => {
               // Create test user with styleProfile
               const user = new User({
                    githubId: 'github_fallback',
                    username: 'testuser_fallback',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
                    voiceStrength: 80,
                    styleProfile: {
                         voiceType: 'casual',
                         tone: {
                              formality: 5,
                              enthusiasm: 7,
                              directness: 8,
                              humor: 6,
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
                         samplePosts: ['Sample 1', 'Sample 2', 'Sample 3'],
                         learningIterations: 5,
                         lastUpdated: new Date(),
                         profileSource: 'manual',
                    },
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_fallback',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Mock Gemini API to fail first, then succeed
               let callCount = 0;
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockImplementation(async () => {
                         callCount++;
                         if (callCount === 1) {
                              // First call (voice-aware) fails
                              throw new Error('Voice-aware generation failed');
                         } else {
                              // Second call (tone-based) succeeds
                              return 'Generated content with tone fallback';
                         }
                    });

               try {
                    // Generate content
                    const content = await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                    });

                    // Verify fallback occurred
                    expect(callCount).toBe(2); // Called twice
                    expect(content.generatedText).toBe('Generated content with tone fallback');
                    expect(content.usedStyleProfile).toBe(false); // Fallback doesn't use profile
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });
     });

     describe('Backward Compatibility', () => {
          test('should work identically to existing system when user has no styleProfile', async () => {
               // Create test user WITHOUT styleProfile (backward compatibility)
               const user = new User({
                    githubId: 'github_backward_compat',
                    username: 'testuser_backward_compat',
                    accessToken: 'test_token',
                    avatarUrl: 'https://example.com/avatar.png',
               });
               await user.save();

               // Create test repository
               const repository = new Repository({
                    userId: user._id,
                    githubRepoId: 'repo_backward_compat',
                    name: 'test-repo',
                    fullName: 'owner/test-repo',
                    description: 'Test repository',
                    url: 'https://github.com/owner/test-repo',
               });
               await repository.save();

               // Create analysis
               const analysis = new Analysis({
                    repositoryId: repository._id,
                    userId: user._id,
                    problemStatement: 'Solving a problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature A'],
                    notableFeatures: ['Feature B'],
                    recentChanges: ['Change 1'],
                    integrations: ['API 1'],
                    valueProposition: 'Provides value',
                    rawSignals: {
                         readmeLength: 100,
                         commitCount: 10,
                         prCount: 5,
                         fileStructure: ['README.md'],
                    },
               });
               await analysis.save();

               // Track the prompt
               let capturedPrompt = '';
               const callGeminiSpy = jest
                    .spyOn(contentService as any, 'callGeminiAPI')
                    .mockImplementation(async (...args: any[]) => {
                         capturedPrompt = args[0] as string;
                         return 'Generated content with tone';
                    });

               try {
                    // Generate content
                    const content = await contentService.generateContent({
                         analysisId: analysis._id.toString(),
                         userId: user._id.toString(),
                         platform: 'linkedin',
                         tone: 'Professional',
                    });

                    // Verify tone-based generation was used
                    expect(content.usedStyleProfile).toBe(false);

                    // Verify prompt uses tone-based format (not voice-aware)
                    expect(capturedPrompt).toContain('Tone: Professional');
                    expect(capturedPrompt).not.toContain('Voice Type:');
                    expect(capturedPrompt).not.toContain('Example 1:');

                    // Verify content was generated successfully
                    expect(content.generatedText).toBe('Generated content with tone');
                    expect(content.platform).toBe('linkedin');
                    expect(content.tone).toBe('Professional');
               } finally {
                    callGeminiSpy.mockRestore();
               }
          });
     });
});
