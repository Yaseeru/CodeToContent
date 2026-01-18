import { GoogleGenAI } from '@google/genai';
import { StyleProfile, VoiceType, VocabularyLevel, ProfileSource } from '../models/User';
import { logger } from './LoggerService';
const pdfParse = require('pdf-parse');

export interface AnalyzeTextParams {
     text: string;
     userId?: string;
}

export interface AnalyzeFileParams {
     fileBuffer: Buffer;
     fileName: string;
     mimeType: string;
     userId?: string;
}

export interface GeminiStyleResponse {
     voiceType: VoiceType;
     tone: {
          formality: number;
          enthusiasm: number;
          directness: number;
          humor: number;
          emotionality: number;
     };
     writingTraits: {
          avgSentenceLength: number;
          usesQuestionsOften: boolean;
          usesEmojis: boolean;
          emojiFrequency: number;
          usesBulletPoints: boolean;
          usesShortParagraphs: boolean;
          usesHooks: boolean;
     };
     structurePreferences: {
          introStyle: 'hook' | 'story' | 'problem' | 'statement';
          bodyStyle: 'steps' | 'narrative' | 'analysis' | 'bullets';
          endingStyle: 'cta' | 'reflection' | 'summary' | 'question';
     };
     vocabularyLevel: VocabularyLevel;
     commonPhrases: string[];
     bannedPhrases: string[];
     sampleExcerpts: string[];
}

export class VoiceAnalysisService {
     private ai: GoogleGenAI;
     private apiKey: string;

     constructor(apiKey: string) {
          this.apiKey = apiKey;
          this.ai = new GoogleGenAI({ apiKey });
     }

     /**
      * Analyze text input and extract style profile
      */
     async analyzeText(params: AnalyzeTextParams): Promise<StyleProfile> {
          const { text, userId = 'unknown' } = params;

          // Validate minimum character requirement
          if (text.length < 300) {
               throw new Error('Minimum 300 characters required for text analysis');
          }

          // Extract style using Gemini with retry logic
          const geminiResponse = await this.extractStyleWithRetry(text, userId);

          // Track profile creation
          logger.trackProfileCreation();

          // Convert to StyleProfile
          const styleProfile: StyleProfile = {
               voiceType: geminiResponse.voiceType,
               tone: geminiResponse.tone,
               writingTraits: geminiResponse.writingTraits,
               structurePreferences: geminiResponse.structurePreferences,
               vocabularyLevel: geminiResponse.vocabularyLevel,
               commonPhrases: geminiResponse.commonPhrases,
               bannedPhrases: geminiResponse.bannedPhrases,
               samplePosts: geminiResponse.sampleExcerpts,
               learningIterations: 0,
               lastUpdated: new Date(),
               profileSource: 'manual' as ProfileSource,
          };

          return styleProfile;
     }

     /**
      * Analyze file upload and extract style profile
      */
     async analyzeFile(params: AnalyzeFileParams): Promise<StyleProfile> {
          const { fileBuffer, fileName, mimeType, userId = 'unknown' } = params;

          // Validate file format
          const fileExtension = fileName.toLowerCase().split('.').pop();
          if (!fileExtension || !['txt', 'md', 'pdf'].includes(fileExtension)) {
               throw new Error('Supported formats: .txt, .md, .pdf');
          }

          // Extract text from file
          const extractedText = await this.extractTextFromFile(fileBuffer, fileExtension, mimeType);

          // Validate minimum character requirement for files
          if (extractedText.length < 500) {
               throw new Error('File must contain at least 500 characters');
          }

          // Extract style using Gemini with retry logic
          const geminiResponse = await this.extractStyleWithRetry(extractedText, userId);

          // Track profile creation
          logger.trackProfileCreation();

          // Convert to StyleProfile
          const styleProfile: StyleProfile = {
               voiceType: geminiResponse.voiceType,
               tone: geminiResponse.tone,
               writingTraits: geminiResponse.writingTraits,
               structurePreferences: geminiResponse.structurePreferences,
               vocabularyLevel: geminiResponse.vocabularyLevel,
               commonPhrases: geminiResponse.commonPhrases,
               bannedPhrases: geminiResponse.bannedPhrases,
               samplePosts: geminiResponse.sampleExcerpts,
               learningIterations: 0,
               lastUpdated: new Date(),
               profileSource: 'file' as ProfileSource,
          };

          return styleProfile;
     }

     /**
      * Aggregate multiple style profiles with recency weighting
      */
     aggregateProfiles(profiles: StyleProfile[], weights?: number[]): StyleProfile {
          if (profiles.length === 0) {
               throw new Error('Cannot aggregate empty profile array');
          }

          if (profiles.length === 1) {
               return profiles[0];
          }

          // If no weights provided, use recency bias (more recent = higher weight)
          const profileWeights = weights || this.calculateRecencyWeights(profiles.length);

          // Normalize weights to sum to 1
          const totalWeight = profileWeights.reduce((sum, w) => sum + w, 0);
          const normalizedWeights = profileWeights.map(w => w / totalWeight);

          // Aggregate tone metrics (weighted average)
          const aggregatedTone = {
               formality: this.weightedAverage(profiles.map(p => p.tone.formality), normalizedWeights),
               enthusiasm: this.weightedAverage(profiles.map(p => p.tone.enthusiasm), normalizedWeights),
               directness: this.weightedAverage(profiles.map(p => p.tone.directness), normalizedWeights),
               humor: this.weightedAverage(profiles.map(p => p.tone.humor), normalizedWeights),
               emotionality: this.weightedAverage(profiles.map(p => p.tone.emotionality), normalizedWeights),
          };

          // Aggregate writing traits (weighted average for numbers, majority vote for booleans)
          const aggregatedWritingTraits = {
               avgSentenceLength: this.weightedAverage(
                    profiles.map(p => p.writingTraits.avgSentenceLength),
                    normalizedWeights
               ),
               usesQuestionsOften: this.weightedMajority(
                    profiles.map(p => p.writingTraits.usesQuestionsOften),
                    normalizedWeights
               ),
               usesEmojis: this.weightedMajority(
                    profiles.map(p => p.writingTraits.usesEmojis),
                    normalizedWeights
               ),
               emojiFrequency: this.weightedAverage(
                    profiles.map(p => p.writingTraits.emojiFrequency),
                    normalizedWeights
               ),
               usesBulletPoints: this.weightedMajority(
                    profiles.map(p => p.writingTraits.usesBulletPoints),
                    normalizedWeights
               ),
               usesShortParagraphs: this.weightedMajority(
                    profiles.map(p => p.writingTraits.usesShortParagraphs),
                    normalizedWeights
               ),
               usesHooks: this.weightedMajority(
                    profiles.map(p => p.writingTraits.usesHooks),
                    normalizedWeights
               ),
          };

          // For categorical fields, use the most recent (highest weight)
          const mostRecentIndex = normalizedWeights.indexOf(Math.max(...normalizedWeights));
          const mostRecentProfile = profiles[mostRecentIndex];

          // Aggregate phrases (union of all, prioritizing recent)
          const allCommonPhrases = profiles.flatMap(p => p.commonPhrases);
          const allBannedPhrases = profiles.flatMap(p => p.bannedPhrases);
          const allSamplePosts = profiles.flatMap(p => p.samplePosts);

          // Remove duplicates, keeping most recent
          const uniqueCommonPhrases = Array.from(new Set(allCommonPhrases.reverse())).reverse();
          const uniqueBannedPhrases = Array.from(new Set(allBannedPhrases.reverse())).reverse();
          const uniqueSamplePosts = Array.from(new Set(allSamplePosts.reverse())).reverse();

          return {
               voiceType: mostRecentProfile.voiceType,
               tone: aggregatedTone,
               writingTraits: aggregatedWritingTraits,
               structurePreferences: mostRecentProfile.structurePreferences,
               vocabularyLevel: mostRecentProfile.vocabularyLevel,
               commonPhrases: uniqueCommonPhrases.slice(0, 20), // Limit to 20
               bannedPhrases: uniqueBannedPhrases.slice(0, 20), // Limit to 20
               samplePosts: uniqueSamplePosts.slice(0, 10), // Limit to 10
               learningIterations: Math.max(...profiles.map(p => p.learningIterations)),
               lastUpdated: new Date(),
               profileSource: 'manual' as ProfileSource,
          };
     }

     /**
      * Extract text from file based on format
      */
     private async extractTextFromFile(
          fileBuffer: Buffer,
          fileExtension: string,
          mimeType: string
     ): Promise<string> {
          try {
               if (fileExtension === 'txt' || fileExtension === 'md') {
                    // Simple text extraction for .txt and .md
                    return fileBuffer.toString('utf-8');
               } else if (fileExtension === 'pdf') {
                    // PDF parsing
                    try {
                         const pdfData = await pdfParse(fileBuffer);
                         return pdfData.text;
                    } catch (error) {
                         throw new Error('Unable to extract text from PDF');
                    }
               }

               throw new Error(`Unsupported file format: ${fileExtension}`);
          } catch (error: any) {
               if (error.message.includes('Unable to extract text from PDF')) {
                    throw error;
               }
               throw new Error(`File processing error: ${error.message}`);
          }
     }

     /**
      * Extract style from text using Gemini with retry logic
      */
     private async extractStyleWithRetry(
          text: string,
          userId: string = 'unknown',
          maxAttempts: number = 3
     ): Promise<GeminiStyleResponse> {
          let lastError: Error | null = null;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
               try {
                    const prompt = this.buildStyleExtractionPrompt(text);
                    const response = await this.callGeminiAPI(prompt, userId);
                    const parsed = this.parseGeminiStyleResponse(response);
                    return parsed;
               } catch (error: any) {
                    lastError = error;

                    // Don't retry on validation errors
                    if (error.message.includes('Minimum') || error.message.includes('Supported formats')) {
                         throw error;
                    }

                    // Exponential backoff: 1s, 2s, 4s
                    if (attempt < maxAttempts) {
                         const backoffMs = Math.pow(2, attempt - 1) * 1000;
                         await new Promise(resolve => setTimeout(resolve, backoffMs));
                    }
               }
          }

          throw new Error(`Failed to extract style after ${maxAttempts} attempts: ${lastError?.message}`);
     }

     /**
      * Build Gemini prompt for style extraction
      */
     private buildStyleExtractionPrompt(text: string): string {
          // Limit text to first 5000 characters to avoid token limits
          const analyzableText = text.substring(0, 5000);

          const prompt = `You are an expert writing style analyst. Analyze the following text and extract a comprehensive style profile.

TEXT TO ANALYZE:
${analyzableText}

Provide a detailed analysis in the following JSON format. Respond ONLY with valid JSON, no markdown formatting:

{
  "voiceType": "educational" | "storytelling" | "opinionated" | "analytical" | "casual" | "professional",
  "tone": {
    "formality": <number 1-10, where 1=very casual, 10=very formal>,
    "enthusiasm": <number 1-10, where 1=subdued, 10=very enthusiastic>,
    "directness": <number 1-10, where 1=indirect, 10=very direct>,
    "humor": <number 1-10, where 1=serious, 10=very humorous>,
    "emotionality": <number 1-10, where 1=detached, 10=very emotional>
  },
  "writingTraits": {
    "avgSentenceLength": <average words per sentence>,
    "usesQuestionsOften": <boolean>,
    "usesEmojis": <boolean>,
    "emojiFrequency": <number 0-5>,
    "usesBulletPoints": <boolean>,
    "usesShortParagraphs": <boolean, true if avg paragraph < 4 sentences>,
    "usesHooks": <boolean, true if uses attention-grabbing openings>
  },
  "structurePreferences": {
    "introStyle": "hook" | "story" | "problem" | "statement",
    "bodyStyle": "steps" | "narrative" | "analysis" | "bullets",
    "endingStyle": "cta" | "reflection" | "summary" | "question"
  },
  "vocabularyLevel": "simple" | "medium" | "advanced",
  "commonPhrases": [<array of 3-10 phrases the author frequently uses>],
  "bannedPhrases": [],
  "sampleExcerpts": [<array of 3-6 representative sentences or short paragraphs from the text>]
}

IMPORTANT:
- All tone metrics must be integers between 1 and 10
- avgSentenceLength should be calculated from the actual text
- emojiFrequency should be 0-5 based on emoji usage
- sampleExcerpts should be actual quotes from the provided text
- commonPhrases should be phrases that appear multiple times or are distinctive
- bannedPhrases should be empty for initial analysis`;

          return prompt;
     }

     /**
      * Call Gemini API with prompt
      */
     private async callGeminiAPI(prompt: string, userId: string = 'unknown'): Promise<string> {
          const startTime = Date.now();
          let success = false;
          let errorMessage: string | undefined;

          try {
               const response = await this.ai.models.generateContent({
                    model: 'gemini-2.0-flash-exp',
                    contents: prompt,
               });

               if (!response.text) {
                    throw new Error('Gemini API returned empty response');
               }

               success = true;
               const latencyMs = Date.now() - startTime;

               // Estimate token usage (rough approximation)
               const promptTokens = Math.ceil(prompt.split(/\s+/).length * 1.3);
               const completionTokens = Math.ceil(response.text.split(/\s+/).length * 1.3);

               // Log Gemini API call
               logger.logGeminiAPICall({
                    operation: 'style_analysis',
                    userId,
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                    latencyMs,
                    success: true,
                    timestamp: new Date(),
               });

               return response.text;
          } catch (error: any) {
               success = false;
               errorMessage = error.message || 'Unknown error';
               const latencyMs = Date.now() - startTime;

               // Log failed API call
               logger.logGeminiAPICall({
                    operation: 'style_analysis',
                    userId,
                    promptTokens: Math.ceil(prompt.split(/\s+/).length * 1.3),
                    completionTokens: 0,
                    totalTokens: Math.ceil(prompt.split(/\s+/).length * 1.3),
                    latencyMs,
                    success: false,
                    error: errorMessage,
                    timestamp: new Date(),
               });

               if (error.message?.includes('429')) {
                    throw new Error('Gemini API rate limit exceeded. Please try again later.');
               }
               if (error.message?.includes('401') || error.message?.includes('API key')) {
                    throw new Error('Invalid Gemini API key.');
               }
               throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
          }
     }

     /**
      * Parse Gemini response into GeminiStyleResponse
      */
     private parseGeminiStyleResponse(response: string): GeminiStyleResponse {
          try {
               // Remove markdown code blocks if present
               let cleanedResponse = response.trim();
               if (cleanedResponse.startsWith('```json')) {
                    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
               } else if (cleanedResponse.startsWith('```')) {
                    cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
               }

               const parsed = JSON.parse(cleanedResponse);

               // Validate required fields
               this.validateGeminiResponse(parsed);

               return parsed as GeminiStyleResponse;
          } catch (error) {
               if (error instanceof SyntaxError) {
                    throw new Error(`Failed to parse Gemini response as JSON: ${error.message}`);
               }
               throw error;
          }
     }

     /**
      * Validate Gemini response structure
      */
     private validateGeminiResponse(parsed: any): void {
          if (!parsed.voiceType || typeof parsed.voiceType !== 'string') {
               throw new Error('Missing or invalid voiceType');
          }

          if (!parsed.tone || typeof parsed.tone !== 'object') {
               throw new Error('Missing or invalid tone');
          }

          const toneFields = ['formality', 'enthusiasm', 'directness', 'humor', 'emotionality'];
          for (const field of toneFields) {
               if (typeof parsed.tone[field] !== 'number' || parsed.tone[field] < 1 || parsed.tone[field] > 10) {
                    throw new Error(`Invalid tone.${field}: must be number between 1 and 10`);
               }
          }

          if (!parsed.writingTraits || typeof parsed.writingTraits !== 'object') {
               throw new Error('Missing or invalid writingTraits');
          }

          if (!parsed.structurePreferences || typeof parsed.structurePreferences !== 'object') {
               throw new Error('Missing or invalid structurePreferences');
          }

          if (!parsed.vocabularyLevel || typeof parsed.vocabularyLevel !== 'string') {
               throw new Error('Missing or invalid vocabularyLevel');
          }

          if (!Array.isArray(parsed.commonPhrases)) {
               throw new Error('Missing or invalid commonPhrases');
          }

          if (!Array.isArray(parsed.bannedPhrases)) {
               throw new Error('Missing or invalid bannedPhrases');
          }

          if (!Array.isArray(parsed.sampleExcerpts) || parsed.sampleExcerpts.length === 0) {
               throw new Error('Missing or invalid sampleExcerpts');
          }
     }

     /**
      * Calculate recency weights (more recent = higher weight)
      */
     private calculateRecencyWeights(count: number): number[] {
          const weights: number[] = [];
          for (let i = 0; i < count; i++) {
               // Linear decay: most recent gets weight 1.0, oldest gets weight 0.5
               weights.push(0.5 + (0.5 * i / (count - 1)));
          }
          return weights;
     }

     /**
      * Calculate weighted average
      */
     private weightedAverage(values: number[], weights: number[]): number {
          const sum = values.reduce((acc, val, i) => acc + val * weights[i], 0);
          return Math.round(sum * 10) / 10; // Round to 1 decimal place
     }

     /**
      * Calculate weighted majority for boolean values
      */
     private weightedMajority(values: boolean[], weights: number[]): boolean {
          const trueWeight = values.reduce((acc, val, i) => acc + (val ? weights[i] : 0), 0);
          const falseWeight = values.reduce((acc, val, i) => acc + (!val ? weights[i] : 0), 0);
          return trueWeight > falseWeight;
     }
}
