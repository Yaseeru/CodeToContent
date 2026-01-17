import { VoiceAnalysisService } from '../VoiceAnalysisService';
import { StyleProfile } from '../../models/User';

// Mock Gemini API
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => {
     return {
          GoogleGenAI: jest.fn().mockImplementation(() => ({
               models: {
                    generateContent: mockGenerateContent,
               },
          })),
     };
});

describe('Voice Analysis Service - Unit Tests', () => {
     let service: VoiceAnalysisService;

     beforeEach(() => {
          service = new VoiceAnalysisService('test-api-key');
          jest.clearAllMocks();
     });

     describe('File Parsing', () => {
          it('should parse .txt files correctly', async () => {
               const content = 'This is a test text file with enough content to pass validation. '.repeat(10);
               const fileBuffer = Buffer.from(content, 'utf-8');

               mockGenerateContent.mockResolvedValue({
                    text: JSON.stringify({
                         voiceType: 'casual',
                         tone: { formality: 5, enthusiasm: 7, directness: 6, humor: 4, emotionality: 5 },
                         writingTraits: {
                              avgSentenceLength: 15,
                              usesQuestionsOften: true,
                              usesEmojis: false,
                              emojiFrequency: 0,
                              usesBulletPoints: false,
                              usesShortParagraphs: true,
                              usesHooks: true,
                         },
                         structurePreferences: { introStyle: 'hook', bodyStyle: 'narrative', endingStyle: 'cta' },
                         vocabularyLevel: 'medium',
                         commonPhrases: ['test phrase'],
                         bannedPhrases: [],
                         sampleExcerpts: ['This is a test', 'Another sample', 'Third sample'],
                    }),
               });

               const result = await service.analyzeFile({
                    fileBuffer,
                    fileName: 'test.txt',
                    mimeType: 'text/plain',
               });

               expect(result).toBeDefined();
               expect(result.voiceType).toBe('casual');
               expect(result.profileSource).toBe('file');
          });

          it('should parse .md files correctly', async () => {
               const content = '# Markdown Test\n\nThis is markdown content with enough text. '.repeat(10);
               const fileBuffer = Buffer.from(content, 'utf-8');

               mockGenerateContent.mockResolvedValue({
                    text: JSON.stringify({
                         voiceType: 'professional',
                         tone: { formality: 8, enthusiasm: 5, directness: 7, humor: 3, emotionality: 4 },
                         writingTraits: {
                              avgSentenceLength: 20,
                              usesQuestionsOften: false,
                              usesEmojis: false,
                              emojiFrequency: 0,
                              usesBulletPoints: true,
                              usesShortParagraphs: false,
                              usesHooks: false,
                         },
                         structurePreferences: { introStyle: 'statement', bodyStyle: 'analysis', endingStyle: 'summary' },
                         vocabularyLevel: 'advanced',
                         commonPhrases: ['furthermore', 'in conclusion'],
                         bannedPhrases: [],
                         sampleExcerpts: ['Markdown sample 1', 'Markdown sample 2', 'Markdown sample 3'],
                    }),
               });

               const result = await service.analyzeFile({
                    fileBuffer,
                    fileName: 'test.md',
                    mimeType: 'text/markdown',
               });

               expect(result).toBeDefined();
               expect(result.voiceType).toBe('professional');
               expect(result.profileSource).toBe('file');
          });

          it('should handle PDF parsing errors gracefully', async () => {
               const fileBuffer = Buffer.from('Invalid PDF content', 'utf-8');

               await expect(
                    service.analyzeFile({
                         fileBuffer,
                         fileName: 'test.pdf',
                         mimeType: 'application/pdf',
                    })
               ).rejects.toThrow('Unable to extract text from PDF');
          });
     });

     describe('Gemini Prompt Construction', () => {
          it('should construct valid prompt for style extraction', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               mockGenerateContent.mockResolvedValue({
                    text: JSON.stringify({
                         voiceType: 'casual',
                         tone: { formality: 5, enthusiasm: 7, directness: 6, humor: 4, emotionality: 5 },
                         writingTraits: {
                              avgSentenceLength: 15,
                              usesQuestionsOften: true,
                              usesEmojis: false,
                              emojiFrequency: 0,
                              usesBulletPoints: false,
                              usesShortParagraphs: true,
                              usesHooks: true,
                         },
                         structurePreferences: { introStyle: 'hook', bodyStyle: 'narrative', endingStyle: 'cta' },
                         vocabularyLevel: 'medium',
                         commonPhrases: ['sample phrase'],
                         bannedPhrases: [],
                         sampleExcerpts: ['Sample 1', 'Sample 2', 'Sample 3'],
                    }),
               });

               await service.analyzeText({ text });

               expect(mockGenerateContent).toHaveBeenCalledTimes(1);
               const callArgs = mockGenerateContent.mock.calls[0][0];
               expect(callArgs.model).toBe('gemini-2.0-flash-exp');
               expect(callArgs.contents).toContain('TEXT TO ANALYZE:');
               expect(callArgs.contents).toContain('voiceType');
               expect(callArgs.contents).toContain('tone');
               expect(callArgs.contents).toContain('writingTraits');
          });
     });

     describe('JSON Response Parsing', () => {
          it('should parse valid Gemini JSON response', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               const validResponse = {
                    voiceType: 'educational',
                    tone: { formality: 6, enthusiasm: 8, directness: 7, humor: 5, emotionality: 6 },
                    writingTraits: {
                         avgSentenceLength: 18,
                         usesQuestionsOften: true,
                         usesEmojis: true,
                         emojiFrequency: 3,
                         usesBulletPoints: true,
                         usesShortParagraphs: true,
                         usesHooks: true,
                    },
                    structurePreferences: { introStyle: 'problem', bodyStyle: 'steps', endingStyle: 'question' },
                    vocabularyLevel: 'medium',
                    commonPhrases: ['let me explain', 'here is how'],
                    bannedPhrases: [],
                    sampleExcerpts: ['Sample excerpt 1', 'Sample excerpt 2', 'Sample excerpt 3'],
               };

               mockGenerateContent.mockResolvedValue({
                    text: JSON.stringify(validResponse),
               });

               const result = await service.analyzeText({ text });

               expect(result.voiceType).toBe('educational');
               expect(result.tone.formality).toBe(6);
               expect(result.writingTraits.avgSentenceLength).toBe(18);
               expect(result.commonPhrases).toContain('let me explain');
          });

          it('should parse JSON response with markdown code blocks', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               const validResponse = {
                    voiceType: 'casual',
                    tone: { formality: 4, enthusiasm: 9, directness: 8, humor: 7, emotionality: 6 },
                    writingTraits: {
                         avgSentenceLength: 12,
                         usesQuestionsOften: false,
                         usesEmojis: true,
                         emojiFrequency: 4,
                         usesBulletPoints: false,
                         usesShortParagraphs: true,
                         usesHooks: true,
                    },
                    structurePreferences: { introStyle: 'hook', bodyStyle: 'narrative', endingStyle: 'cta' },
                    vocabularyLevel: 'simple',
                    commonPhrases: ['check this out', 'pretty cool'],
                    bannedPhrases: [],
                    sampleExcerpts: ['Sample 1', 'Sample 2', 'Sample 3'],
               };

               mockGenerateContent.mockResolvedValue({
                    text: '```json\n' + JSON.stringify(validResponse) + '\n```',
               });

               const result = await service.analyzeText({ text });

               expect(result.voiceType).toBe('casual');
               expect(result.tone.enthusiasm).toBe(9);
          });

          it('should reject invalid JSON response', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               mockGenerateContent.mockResolvedValue({
                    text: 'This is not valid JSON',
               });

               await expect(service.analyzeText({ text })).rejects.toThrow('Failed to parse Gemini response as JSON');
          });

          it('should reject response with missing required fields', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               const invalidResponse = {
                    voiceType: 'casual',
                    // Missing tone field
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: true,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: true,
                         usesHooks: true,
                    },
               };

               mockGenerateContent.mockResolvedValue({
                    text: JSON.stringify(invalidResponse),
               });

               await expect(service.analyzeText({ text })).rejects.toThrow('Missing or invalid tone');
          });

          it('should reject response with tone values out of range', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               const invalidResponse = {
                    voiceType: 'casual',
                    tone: { formality: 15, enthusiasm: 7, directness: 6, humor: 4, emotionality: 5 }, // formality > 10
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: true,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: true,
                         usesHooks: true,
                    },
                    structurePreferences: { introStyle: 'hook', bodyStyle: 'narrative', endingStyle: 'cta' },
                    vocabularyLevel: 'medium',
                    commonPhrases: [],
                    bannedPhrases: [],
                    sampleExcerpts: ['Sample 1', 'Sample 2', 'Sample 3'],
               };

               mockGenerateContent.mockResolvedValue({
                    text: JSON.stringify(invalidResponse),
               });

               await expect(service.analyzeText({ text })).rejects.toThrow('Invalid tone.formality');
          });
     });

     describe('Error Handling for Gemini API Failures', () => {
          it('should retry on Gemini API failure', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               // Fail twice, succeed on third attempt
               mockGenerateContent
                    .mockRejectedValueOnce(new Error('Network error'))
                    .mockRejectedValueOnce(new Error('Timeout'))
                    .mockResolvedValueOnce({
                         text: JSON.stringify({
                              voiceType: 'casual',
                              tone: { formality: 5, enthusiasm: 7, directness: 6, humor: 4, emotionality: 5 },
                              writingTraits: {
                                   avgSentenceLength: 15,
                                   usesQuestionsOften: true,
                                   usesEmojis: false,
                                   emojiFrequency: 0,
                                   usesBulletPoints: false,
                                   usesShortParagraphs: true,
                                   usesHooks: true,
                              },
                              structurePreferences: { introStyle: 'hook', bodyStyle: 'narrative', endingStyle: 'cta' },
                              vocabularyLevel: 'medium',
                              commonPhrases: [],
                              bannedPhrases: [],
                              sampleExcerpts: ['Sample 1', 'Sample 2', 'Sample 3'],
                         }),
                    });

               const result = await service.analyzeText({ text });

               expect(result).toBeDefined();
               expect(mockGenerateContent).toHaveBeenCalledTimes(3);
          }, 15000);

          it('should fail after 3 retry attempts', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               mockGenerateContent.mockRejectedValue(new Error('Persistent error'));

               await expect(service.analyzeText({ text })).rejects.toThrow('Failed to extract style after 3 attempts');
               expect(mockGenerateContent).toHaveBeenCalledTimes(3);
          }, 15000);

          it('should handle rate limit errors', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               mockGenerateContent.mockRejectedValue(new Error('429 rate limit exceeded'));

               await expect(service.analyzeText({ text })).rejects.toThrow('Gemini API rate limit exceeded');
          });

          it('should handle invalid API key errors', async () => {
               const text = 'This is a sample text for analysis. '.repeat(20);

               mockGenerateContent.mockRejectedValue(new Error('401 Invalid API key'));

               await expect(service.analyzeText({ text })).rejects.toThrow('Invalid Gemini API key');
          });
     });

     describe('Profile Aggregation', () => {
          it('should return single profile when only one provided', () => {
               const profile: StyleProfile = {
                    voiceType: 'casual',
                    tone: { formality: 5, enthusiasm: 7, directness: 6, humor: 4, emotionality: 5 },
                    writingTraits: {
                         avgSentenceLength: 15,
                         usesQuestionsOften: true,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: true,
                         usesHooks: true,
                    },
                    structurePreferences: { introStyle: 'hook', bodyStyle: 'narrative', endingStyle: 'cta' },
                    vocabularyLevel: 'medium',
                    commonPhrases: ['test phrase'],
                    bannedPhrases: [],
                    samplePosts: ['sample 1'],
                    learningIterations: 0,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };

               const result = service.aggregateProfiles([profile]);

               expect(result).toEqual(profile);
          });

          it('should throw error when aggregating empty array', () => {
               expect(() => service.aggregateProfiles([])).toThrow('Cannot aggregate empty profile array');
          });

          it('should aggregate tone metrics using weighted average', () => {
               const profile1: StyleProfile = {
                    voiceType: 'casual',
                    tone: { formality: 2, enthusiasm: 3, directness: 4, humor: 5, emotionality: 6 },
                    writingTraits: {
                         avgSentenceLength: 10,
                         usesQuestionsOften: true,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: false,
                         usesShortParagraphs: true,
                         usesHooks: true,
                    },
                    structurePreferences: { introStyle: 'hook', bodyStyle: 'narrative', endingStyle: 'cta' },
                    vocabularyLevel: 'simple',
                    commonPhrases: ['phrase1'],
                    bannedPhrases: [],
                    samplePosts: ['sample1'],
                    learningIterations: 0,
                    lastUpdated: new Date(Date.now() - 86400000),
                    profileSource: 'manual',
               };

               const profile2: StyleProfile = {
                    voiceType: 'professional',
                    tone: { formality: 8, enthusiasm: 7, directness: 6, humor: 5, emotionality: 4 },
                    writingTraits: {
                         avgSentenceLength: 20,
                         usesQuestionsOften: false,
                         usesEmojis: false,
                         emojiFrequency: 0,
                         usesBulletPoints: true,
                         usesShortParagraphs: false,
                         usesHooks: false,
                    },
                    structurePreferences: { introStyle: 'statement', bodyStyle: 'analysis', endingStyle: 'summary' },
                    vocabularyLevel: 'advanced',
                    commonPhrases: ['phrase2'],
                    bannedPhrases: [],
                    samplePosts: ['sample2'],
                    learningIterations: 5,
                    lastUpdated: new Date(),
                    profileSource: 'manual',
               };

               const result = service.aggregateProfiles([profile1, profile2]);

               // More recent profile should have higher weight
               expect(result.tone.formality).toBeGreaterThan(5); // Closer to 8 than 2
               expect(result.voiceType).toBe('professional'); // Most recent
               expect(result.vocabularyLevel).toBe('advanced'); // Most recent
               expect(result.learningIterations).toBe(5); // Max value
          });
     });
});
