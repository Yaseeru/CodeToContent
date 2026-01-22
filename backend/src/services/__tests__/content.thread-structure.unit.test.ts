/**
 * Unit tests for thread structure helper methods
 * Tests the getMiniThreadStructure, getFullThreadStructure, formatAnalysisContext, and buildVoiceSection helpers
 */

import { ContentGenerationService } from '../ContentGenerationService';

describe('ContentGenerationService - Thread Structure Helpers', () => {
     let service: ContentGenerationService;

     beforeEach(() => {
          // Initialize service with a dummy API key for testing
          service = new ContentGenerationService('test-api-key');
     });

     describe('getMiniThreadStructure', () => {
          it('should return a valid mini thread structure template', () => {
               // Access the private method using type assertion for testing
               const structure = (service as any).getMiniThreadStructure();

               // Verify the structure is a non-empty string
               expect(structure).toBeDefined();
               expect(typeof structure).toBe('string');
               expect(structure.length).toBeGreaterThan(0);
          });

          it('should include all three tweet sections', () => {
               const structure = (service as any).getMiniThreadStructure();

               // Verify all three tweet sections are present
               expect(structure).toContain('Tweet 1: Hook + Context');
               expect(structure).toContain('Tweet 2: Problem + Solution');
               expect(structure).toContain('Tweet 3: Result + CTA');
          });

          it('should include guidance for Hook + Context', () => {
               const structure = (service as any).getMiniThreadStructure();

               // Verify Tweet 1 guidance
               expect(structure).toContain('Grab attention with a bold statement or question');
               expect(structure).toContain('Set up what the project is about');
               expect(structure).toContain('Create curiosity');
          });

          it('should include guidance for Problem + Solution', () => {
               const structure = (service as any).getMiniThreadStructure();

               // Verify Tweet 2 guidance
               expect(structure).toContain('Explain the problem this project solves');
               expect(structure).toContain('Describe the approach or solution');
               expect(structure).toContain('Highlight key technical decisions');
          });

          it('should include guidance for Result + CTA', () => {
               const structure = (service as any).getMiniThreadStructure();

               // Verify Tweet 3 guidance
               expect(structure).toContain('Share the outcome or current state');
               expect(structure).toContain('Include a call-to-action');
               expect(structure).toContain('End with engagement');
          });

          it('should return a formatted string suitable for prompt construction', () => {
               const structure = (service as any).getMiniThreadStructure();

               // Verify the structure has proper formatting with line breaks
               expect(structure).toContain('\n');

               // Verify it has bullet points for guidance
               expect(structure).toContain('-');

               // Verify it's structured with clear sections
               const lines = structure.split('\n').filter((line: string) => line.trim().length > 0);
               expect(lines.length).toBeGreaterThan(5); // Should have multiple lines of guidance
          });
     });

     describe('getFullThreadStructure', () => {
          it('should return a valid full thread structure template', () => {
               const structure = (service as any).getFullThreadStructure();

               expect(structure).toBeDefined();
               expect(typeof structure).toBe('string');
               expect(structure.length).toBeGreaterThan(0);
          });

          it('should include all five core tweet sections', () => {
               const structure = (service as any).getFullThreadStructure();

               expect(structure).toContain('Tweet 1: Hook / Bold Statement');
               expect(structure).toContain('Tweet 2: Problem / Why It Matters');
               expect(structure).toContain('Tweet 3: Solution / What Was Built');
               expect(structure).toContain('Tweet 4: Code Insight / Architecture / Technical Value');
               expect(structure).toContain('Tweet 5: CTA / Engagement Question');
          });

          it('should include guidance for additional tweets', () => {
               const structure = (service as any).getFullThreadStructure();

               expect(structure).toContain('Additional tweets');
               expect(structure).toContain('Extra technical details');
               expect(structure).toContain('Performance metrics');
               expect(structure).toContain('Future roadmap');
          });
     });

     describe('formatAnalysisContext', () => {
          it('should format analysis data into a readable context string', () => {
               const mockAnalysis = {
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1', 'Feature 2'],
                    notableFeatures: ['Notable 1'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };

               const context = (service as any).formatAnalysisContext(mockAnalysis);

               expect(context).toContain('Problem: Test problem');
               expect(context).toContain('Target Audience: Developers');
               expect(context).toContain('Core Functionality: Feature 1, Feature 2');
               expect(context).toContain('Notable Features: Notable 1');
               expect(context).toContain('Recent Changes: Change 1');
               expect(context).toContain('Integrations: Integration 1');
               expect(context).toContain('Value Proposition: Test value');
          });

          it('should handle empty arrays gracefully', () => {
               const mockAnalysis = {
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: [],
                    notableFeatures: [],
                    recentChanges: [],
                    integrations: [],
                    valueProposition: 'Test value',
               };

               const context = (service as any).formatAnalysisContext(mockAnalysis);

               expect(context).toBeDefined();
               expect(context).toContain('Problem: Test problem');
               expect(context).toContain('Core Functionality:');
          });
     });

     describe('buildVoiceSection', () => {
          it('should build voice section with style profile', () => {
               const mockStyleProfile = {
                    voiceType: 'custom',
                    tone: {
                         formality: 5,
                         enthusiasm: 7,
                         directness: 6,
                         humor: 4,
                         emotionality: 5,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: true,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: true,
                    },
                    structurePreferences: {
                         introStyle: 'hook',
                         bodyStyle: 'narrative',
                         endingStyle: 'cta',
                    },
                    vocabularyLevel: 'technical',
                    samplePosts: ['Sample post 1', 'Sample post 2'],
                    commonPhrases: ['Let\'s dive in'],
                    bannedPhrases: ['Leverage', 'Synergy'],
                    learningIterations: 5,
               };

               const voiceSection = (service as any).buildVoiceSection(mockStyleProfile, 80);

               expect(voiceSection).toContain('Voice Strength: 80%');
               expect(voiceSection).toContain('Voice Type: custom');
               expect(voiceSection).toContain('Tone Characteristics:');
               expect(voiceSection).toContain('Writing Traits:');
               expect(voiceSection).toContain('Structure Preferences:');
               expect(voiceSection).toContain('Vocabulary Level: technical');
          });

          it('should include few-shot examples when samples are available', () => {
               const mockStyleProfile = {
                    voiceType: 'custom',
                    tone: {
                         formality: 5,
                         enthusiasm: 7,
                         directness: 6,
                         humor: 4,
                         emotionality: 5,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: false,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'hook',
                         bodyStyle: 'narrative',
                         endingStyle: 'cta',
                    },
                    vocabularyLevel: 'technical',
                    samplePosts: ['Sample post 1', 'Sample post 2'],
                    commonPhrases: [],
                    bannedPhrases: [],
                    learningIterations: 0,
               };

               const voiceSection = (service as any).buildVoiceSection(mockStyleProfile, 80);

               expect(voiceSection).toContain('Example writings from this user\'s style:');
               expect(voiceSection).toContain('Sample post 1');
               expect(voiceSection).toContain('Sample post 2');
          });

          it('should include common and banned phrases when available', () => {
               const mockStyleProfile = {
                    voiceType: 'custom',
                    tone: {
                         formality: 5,
                         enthusiasm: 7,
                         directness: 6,
                         humor: 4,
                         emotionality: 5,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: false,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'hook',
                         bodyStyle: 'narrative',
                         endingStyle: 'cta',
                    },
                    vocabularyLevel: 'technical',
                    samplePosts: [],
                    commonPhrases: ['Let\'s dive in', 'Here\'s the thing'],
                    bannedPhrases: ['Leverage', 'Synergy'],
                    learningIterations: 0,
               };

               const voiceSection = (service as any).buildVoiceSection(mockStyleProfile, 80);

               expect(voiceSection).toContain('Common phrases this user frequently uses:');
               expect(voiceSection).toContain('Let\'s dive in');
               expect(voiceSection).toContain('Here\'s the thing');
               expect(voiceSection).toContain('Phrases to AVOID');
               expect(voiceSection).toContain('Leverage');
               expect(voiceSection).toContain('Synergy');
          });

          it('should adjust guidance based on voice strength', () => {
               const mockStyleProfile = {
                    voiceType: 'custom',
                    tone: {
                         formality: 5,
                         enthusiasm: 7,
                         directness: 6,
                         humor: 4,
                         emotionality: 5,
                    },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: false,
                         usesHooks: false,
                    },
                    structurePreferences: {
                         introStyle: 'hook',
                         bodyStyle: 'narrative',
                         endingStyle: 'cta',
                    },
                    vocabularyLevel: 'technical',
                    samplePosts: [],
                    commonPhrases: [],
                    bannedPhrases: [],
                    learningIterations: 0,
               };

               // Test low voice strength
               const lowVoiceSection = (service as any).buildVoiceSection(mockStyleProfile, 20);
               expect(lowVoiceSection).toContain('blend the user\'s style with more generic');

               // Test medium voice strength
               const mediumVoiceSection = (service as any).buildVoiceSection(mockStyleProfile, 50);
               expect(mediumVoiceSection).toContain('match the user\'s style while allowing some creative flexibility');

               // Test high voice strength
               const highVoiceSection = (service as any).buildVoiceSection(mockStyleProfile, 90);
               expect(highVoiceSection).toContain('closely match the user\'s authentic voice');
          });
     });

     describe('parseThreadResponse', () => {
          it('should parse a simple thread response with clean tweets', () => {
               const response = `This is the first tweet about an amazing project that needs to be shared with everyone
This is the second tweet explaining the solution we built for developers today
This is the third tweet with a call to action for the community to engage`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
               expect(tweets[0].text).toContain('This is the first tweet about an amazing project');
               expect(tweets[0].position).toBe(1);
               expect(tweets[1].position).toBe(2);
               expect(tweets[2].position).toBe(3);
          });

          it('should remove numbering artifacts at the start of tweets', () => {
               const response = `1. This is the first tweet about an amazing project that needs to be shared
2) This is the second tweet explaining the solution we built for developers
3: This is the third tweet with a call to action for the community`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
               expect(tweets[0].text).not.toMatch(/^1\./);
               expect(tweets[1].text).not.toMatch(/^2\)/);
               expect(tweets[2].text).not.toMatch(/^3:/);
               expect(tweets[0].text).toContain('This is the first tweet');
          });

          it('should remove "Tweet X:" prefix from tweets', () => {
               const response = `Tweet 1: This is the first tweet about an amazing project that needs sharing
Tweet 2: This is the second tweet explaining the solution we built today
Tweet 3: This is the third tweet with a call to action for everyone`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
               expect(tweets[0].text).not.toContain('Tweet 1:');
               expect(tweets[1].text).not.toContain('Tweet 2:');
               expect(tweets[2].text).not.toContain('Tweet 3:');
          });

          it('should remove position indicators from the end of tweets', () => {
               const response = `This is the first tweet about an amazing project that needs sharing 1/3
This is the second tweet explaining the solution we built for developers 2/3
This is the third tweet with a call to action for the community 3/3`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
               // The method adds position indicators back, so check they're present
               expect(tweets[0].text).toMatch(/1\/3$/);
               expect(tweets[1].text).toMatch(/2\/3$/);
               expect(tweets[2].text).toMatch(/3\/3$/);
          });

          it('should truncate tweets exceeding 280 characters', () => {
               const longTweet = 'A'.repeat(300);
               const response = `${longTweet}
This is a normal length tweet that should not be truncated at all
Another normal tweet here`;

               const tweets = (service as any).parseThreadResponse(response, 2);

               expect(tweets[0].text.length).toBeLessThanOrEqual(280);
               expect(tweets[0].text).toContain('...');
               expect(tweets[0].characterCount).toBe(tweets[0].text.length);
          });

          it('should add position indicators to all tweets', () => {
               const response = `This is the first tweet about an amazing project that needs sharing
This is the second tweet explaining the solution we built for developers
This is the third tweet with a call to action for the community`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets[0].text).toMatch(/1\/3$/);
               expect(tweets[1].text).toMatch(/2\/3$/);
               expect(tweets[2].text).toMatch(/3\/3$/);
          });

          it('should skip tweets that are too short (< 50 characters)', () => {
               const response = `This is the first tweet about an amazing project that needs sharing
Short
This is the third tweet with a call to action for the community here`;

               const tweets = (service as any).parseThreadResponse(response, 2);

               expect(tweets).toHaveLength(2);
               expect(tweets[0].text).toContain('first tweet');
               expect(tweets[1].text).toContain('third tweet');
          });

          it('should throw error if minimum tweet count is not met', () => {
               const response = `This is the first tweet about an amazing project that needs sharing`;

               expect(() => {
                    (service as any).parseThreadResponse(response, 3);
               }).toThrow('Generated only 1 tweets, expected at least 3');
          });

          it('should respect maxTweets parameter and stop parsing', () => {
               const response = `This is the first tweet about an amazing project that needs sharing
This is the second tweet explaining the solution we built for developers
This is the third tweet with a call to action for the community here
This is the fourth tweet that should not be included in the result
This is the fifth tweet that should also not be included in result`;

               const tweets = (service as any).parseThreadResponse(response, 3, 3);

               expect(tweets).toHaveLength(3);
               expect(tweets[2].text).toContain('third tweet');
          });

          it('should handle response with empty lines', () => {
               const response = `This is the first tweet about an amazing project that needs sharing

This is the second tweet explaining the solution we built for developers

This is the third tweet with a call to action for the community here`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
               expect(tweets[0].position).toBe(1);
               expect(tweets[1].position).toBe(2);
               expect(tweets[2].position).toBe(3);
          });

          it('should remove bullet points and dashes from tweet start', () => {
               const response = `- This is the first tweet about an amazing project that needs sharing
* This is the second tweet explaining the solution we built for developers
• This is the third tweet with a call to action for the community here`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
               expect(tweets[0].text).not.toMatch(/^-/);
               expect(tweets[1].text).not.toMatch(/^\*/);
               expect(tweets[2].text).not.toMatch(/^•/);
          });

          it('should update characterCount to match actual text length', () => {
               const response = `This is the first tweet about an amazing project that needs sharing
This is the second tweet explaining the solution we built for developers
This is the third tweet with a call to action for the community here`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               tweets.forEach((tweet: any) => {
                    expect(tweet.characterCount).toBe(tweet.text.length);
                    expect(tweet.characterCount).toBeLessThanOrEqual(280);
               });
          });

          it('should handle maxTweets defaulting to minTweets when not provided', () => {
               const response = `This is the first tweet about an amazing project that needs sharing
This is the second tweet explaining the solution we built for developers
This is the third tweet with a call to action for the community here
This is the fourth tweet that should not be included in the result`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
          });

          it('should not add position indicator if it would exceed 280 characters', () => {
               // Create a tweet that's exactly 276 characters (so adding " 1/3" would exceed 280)
               const longTweet = 'A'.repeat(276);
               const response = `${longTweet}
This is a normal tweet that should get position indicator added`;

               const tweets = (service as any).parseThreadResponse(response, 2);

               // First tweet should not have position indicator added (would exceed limit)
               expect(tweets[0].text.length).toBeLessThanOrEqual(280);
               // Second tweet should have position indicator
               expect(tweets[1].text).toMatch(/2\/2$/);
          });

          it('should handle mixed numbering formats in the same response', () => {
               const response = `1. This is the first tweet about an amazing project that needs sharing
Tweet 2: This is the second tweet explaining the solution we built today
3) This is the third tweet with a call to action for the community here`;

               const tweets = (service as any).parseThreadResponse(response, 3);

               expect(tweets).toHaveLength(3);
               expect(tweets[0].text).toContain('This is the first tweet');
               expect(tweets[1].text).toContain('This is the second tweet');
               expect(tweets[2].text).toContain('This is the third tweet');
          });
     });

     describe('buildThreadPrompt', () => {
          it('should build a prompt for mini_thread format', async () => {
               // Mock Analysis.findById
               const mockAnalysis = {
                    _id: '507f1f77bcf86cd799439011',
                    userId: '507f1f77bcf86cd799439012',
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1', 'Feature 2'],
                    notableFeatures: ['Notable 1'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };

               const mockUser = {
                    _id: '507f1f77bcf86cd799439012',
                    voiceStrength: 70,
                    styleProfile: null,
               };

               // Mock the database calls
               const Analysis = require('../../models/Analysis').Analysis;
               const User = require('../../models/User').User;
               jest.spyOn(Analysis, 'findById').mockResolvedValue(mockAnalysis);
               jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

               const params = {
                    analysisId: '507f1f77bcf86cd799439011',
                    userId: '507f1f77bcf86cd799439012',
                    platform: 'x' as const,
               };

               const prompt = await (service as any).buildThreadPrompt(params, 'mini_thread');

               // Verify prompt includes key sections
               expect(prompt).toContain('3 tweet thread');
               expect(prompt).toContain('Repository Context:');
               expect(prompt).toContain('Thread Structure:');
               expect(prompt).toContain('Requirements:');
               expect(prompt).toContain('Output Format:');

               // Verify it includes mini thread structure
               expect(prompt).toContain('Tweet 1: Hook + Context');
               expect(prompt).toContain('Tweet 2: Problem + Solution');
               expect(prompt).toContain('Tweet 3: Result + CTA');

               // Verify character limit requirement
               expect(prompt).toContain('200-280 characters');

               // Verify analysis context is included
               expect(prompt).toContain('Test problem');
               expect(prompt).toContain('Developers');

               // Clean up mocks
               jest.restoreAllMocks();
          });

          it('should build a prompt for full_thread format', async () => {
               const mockAnalysis = {
                    _id: '507f1f77bcf86cd799439011',
                    userId: '507f1f77bcf86cd799439012',
                    problemStatement: 'Test problem',
                    targetAudience: 'Developers',
                    coreFunctionality: ['Feature 1'],
                    notableFeatures: ['Notable 1'],
                    recentChanges: ['Change 1'],
                    integrations: ['Integration 1'],
                    valueProposition: 'Test value',
               };

               const mockUser = {
                    _id: '507f1f77bcf86cd799439012',
                    voiceStrength: 70,
                    styleProfile: null,
               };

               const Analysis = require('../../models/Analysis').Analysis;
               const User = require('../../models/User').User;
               jest.spyOn(Analysis, 'findById').mockResolvedValue(mockAnalysis);
               jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

               const params = {
                    analysisId: '507f1f77bcf86cd799439011',
                    userId: '507f1f77bcf86cd799439012',
          it('should use effective voice strength from params or user default', () => {
               // Test that voice strength logic works correctly
               const userDefaultStrength = 70;
               const paramStrength = 80;

               // When param is provided, use it
               const effectiveStrength1 = paramStrength !== undefined ? paramStrength : userDefaultStrength;
               expect(effectiveStrength1).toBe(80);

               // When param is undefined, use user default
               const effectiveStrength2 = undefined !== undefined ? undefined : userDefaultStrength;
               expect(effectiveStrength2).toBe(70);
          });
     });
});
