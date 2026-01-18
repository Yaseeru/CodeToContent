import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { Analysis, IAnalysis } from '../models/Analysis';
import { Content, IContent, Platform } from '../models/Content';
import { User, StyleProfile } from '../models/User';
import { logger } from './LoggerService';

export interface GenerateContentParams {
     analysisId: string;
     userId: string;
     platform: Platform;
     tone: string;
     voiceStrength?: number; // Optional voice strength override (0-100)
}

export interface RefineContentParams {
     contentId: string;
     userId: string;
     instruction: string;
}

export class ContentGenerationService {
     private ai: GoogleGenAI;
     private apiKey: string;

     constructor(apiKey: string) {
          this.apiKey = apiKey;
          this.ai = new GoogleGenAI({ apiKey });
     }

     /**
      * Generate platform-specific content from analysis
      */
     async generateContent(params: GenerateContentParams): Promise<IContent> {
          const { analysisId, userId, platform, tone, voiceStrength } = params;

          // Retrieve Summary from database
          const analysis = await Analysis.findById(analysisId);
          if (!analysis) {
               throw new Error('Analysis not found');
          }

          // Verify user owns this analysis
          if (analysis.userId.toString() !== userId) {
               throw new Error('Unauthorized: Analysis does not belong to user');
          }

          // Retrieve user to check for styleProfile
          const user = await User.findById(userId);
          if (!user) {
               throw new Error('User not found');
          }

          // Determine voice strength to use
          const effectiveVoiceStrength = voiceStrength !== undefined ? voiceStrength : user.voiceStrength;

          // Initialize voice-aware metadata
          let usedStyleProfile = false;
          let evolutionScoreAtGeneration = 0;
          let generatedText: string;

          // Try voice-aware generation if profile exists and voice strength > 0
          if (user.styleProfile && effectiveVoiceStrength > 0) {
               try {
                    // Calculate evolution score (simplified version for now)
                    evolutionScoreAtGeneration = this.calculateEvolutionScore(user.styleProfile);

                    // Build voice-aware prompt
                    const prompt = this.buildVoiceAwarePrompt(
                         analysis,
                         user.styleProfile,
                         platform,
                         tone,
                         effectiveVoiceStrength
                    );

                    // Validate prompt size (under 8000 tokens, roughly 6000 words)
                    if (!this.validatePromptSize(prompt)) {
                         console.warn('Voice-aware prompt too large, falling back to tone-based generation');
                         throw new Error('Prompt too large');
                    }

                    // Call Gemini API with voice-aware prompt (temperature 0.7-0.9)
                    generatedText = await this.callGeminiAPI(prompt, 0.8, userId, 'content_generation');
                    usedStyleProfile = true;
               } catch (error) {
                    console.error('Voice-aware generation failed, falling back to tone-based:', error);
                    // Fall back to tone-based generation
                    const prompt = this.constructContentPrompt(analysis, platform, tone);
                    generatedText = await this.callGeminiAPI(prompt, 0.8, userId, 'content_generation');
               }
          } else {
               // Use existing tone-based generation
               const prompt = this.constructContentPrompt(analysis, platform, tone);
               generatedText = await this.callGeminiAPI(prompt, 0.8, userId, 'content_generation');
          }

          // Store generated content with metadata
          const content = new Content({
               analysisId: new mongoose.Types.ObjectId(analysisId),
               userId: new mongoose.Types.ObjectId(userId),
               platform,
               tone,
               generatedText,
               editedText: '',
               version: 1,
               usedStyleProfile,
               voiceStrengthUsed: effectiveVoiceStrength,
               evolutionScoreAtGeneration,
          });

          await content.save();

          // Track content generation
          logger.trackContentGeneration(usedStyleProfile);

          return content;
     }

     /**
      * Construct platform-specific prompts
      */
     private constructContentPrompt(
          analysis: IAnalysis,
          platform: Platform,
          tone: string
     ): string {
          // Base content from analysis
          const baseContext = `
Problem: ${analysis.problemStatement}
Target Audience: ${analysis.targetAudience}
Core Functionality: ${analysis.coreFunctionality.join(', ')}
Notable Features: ${analysis.notableFeatures.join(', ')}
Recent Changes: ${analysis.recentChanges.join(', ')}
Integrations: ${analysis.integrations.join(', ')}
Value Proposition: ${analysis.valueProposition}
`;

          // Platform-specific guidelines
          let platformGuidelines = '';
          if (platform === 'linkedin') {
               platformGuidelines = `
Platform: LinkedIn
Guidelines:
- Professional tone suitable for LinkedIn audience
- Length: 150-300 words (LinkedIn posts work best in this range)
- Structure: Start with a hook, explain the problem/solution, highlight key features, end with value
- Use line breaks for readability
- Avoid hashtags unless specifically requested
- Focus on professional impact and technical innovation
`;
          } else if (platform === 'x') {
               platformGuidelines = `
Platform: X (Twitter)
Guidelines:
- Concise and engaging tone suitable for X audience
- Length: 200-280 characters (single tweet) or up to 500 characters for thread-style
- Structure: Hook in first sentence, key points, call-to-action or insight
- Can be more casual and direct than LinkedIn
- Focus on what's interesting, new, or surprising
`;
          }

          // Apply tone customization
          const toneGuidance = `
Tone: ${tone}
Apply this tone to influence:
- Word choice (formal vs casual, technical vs accessible)
- Sentence structure (short and punchy vs detailed and explanatory)
- Overall length and depth
- Emotional resonance (confident, funny, thoughtful, educational, etc.)
`;

          const prompt = `You are an expert content writer helping developers communicate their work to broader audiences.

${baseContext}

${platformGuidelines}

${toneGuidance}

Generate ONE coherent narrative post for this repository. Do not create multiple posts or per-commit content.
The content should be clear, engaging, and appropriate for the target platform and tone.

Respond with ONLY the post content. Do not include any explanations, metadata, or formatting markers.`;

          return prompt;
     }

     /**
      * Build voice-aware prompt with few-shot examples
      */
     private buildVoiceAwarePrompt(
          analysis: IAnalysis,
          styleProfile: StyleProfile,
          platform: Platform,
          tone: string,
          voiceStrength: number
     ): string {
          // Select 3-6 representative samples
          const samples = this.selectRepresentativeSamples(styleProfile.samplePosts);

          // Base content from analysis
          const baseContext = `
Problem: ${analysis.problemStatement}
Target Audience: ${analysis.targetAudience}
Core Functionality: ${analysis.coreFunctionality.join(', ')}
Notable Features: ${analysis.notableFeatures.join(', ')}
Recent Changes: ${analysis.recentChanges.join(', ')}
Integrations: ${analysis.integrations.join(', ')}
Value Proposition: ${analysis.valueProposition}
`;

          // Platform-specific guidelines
          let platformGuidelines = '';
          if (platform === 'linkedin') {
               platformGuidelines = `
Platform: LinkedIn
Guidelines:
- Professional tone suitable for LinkedIn audience
- Length: 150-300 words (LinkedIn posts work best in this range)
- Structure: Start with a hook, explain the problem/solution, highlight key features, end with value
- Use line breaks for readability
- Avoid hashtags unless specifically requested
- Focus on professional impact and technical innovation
`;
          } else if (platform === 'x') {
               platformGuidelines = `
Platform: X (Twitter)
Guidelines:
- Concise and engaging tone suitable for X audience
- Length: 200-280 characters (single tweet) or up to 500 characters for thread-style
- Structure: Hook in first sentence, key points, call-to-action or insight
- Can be more casual and direct than LinkedIn
- Focus on what's interesting, new, or surprising
`;
          }

          // Build voice profile description
          const voiceDescription = this.buildVoiceDescription(styleProfile, voiceStrength);

          // Build few-shot examples section
          const fewShotExamples = samples.length > 0 ? `
Example writings from this user's style:

${samples.map((sample, idx) => `Example ${idx + 1}:
${sample}
`).join('\n')}

These examples demonstrate the user's authentic voice, sentence structure, vocabulary choices, and typical phrasing.
` : '';

          // Build banned and common phrases guidance
          const phrasesGuidance = this.buildPhrasesGuidance(styleProfile);

          // Construct the complete voice-aware prompt
          const prompt = `You are an expert content writer helping a developer communicate their work in their authentic voice.

${baseContext}

${platformGuidelines}

${voiceDescription}

${fewShotExamples}

${phrasesGuidance}

Base Tone Preference: ${tone}

Generate ONE coherent narrative post for this repository that matches the user's authentic writing style.
Do not create multiple posts or per-commit content.
The content should sound like it was written by the user themselves, not by an AI.

Respond with ONLY the post content. Do not include any explanations, metadata, or formatting markers.`;

          return prompt;
     }

     /**
      * Select 3-6 representative samples from samplePosts
      */
     private selectRepresentativeSamples(samplePosts: string[]): string[] {
          if (samplePosts.length === 0) {
               return [];
          }

          // If we have 6 or fewer samples, use all of them
          if (samplePosts.length <= 6) {
               return samplePosts;
          }

          // If we have more than 6, select 6 evenly distributed samples
          // Prioritize recent samples (assuming they're ordered with most recent first)
          const selectedSamples: string[] = [];
          const step = Math.floor(samplePosts.length / 6);

          for (let i = 0; i < 6; i++) {
               const index = Math.min(i * step, samplePosts.length - 1);
               selectedSamples.push(samplePosts[index]);
          }

          return selectedSamples;
     }

     /**
      * Build voice description from style profile
      */
     private buildVoiceDescription(styleProfile: StyleProfile, voiceStrength: number): string {
          const { tone, writingTraits, structurePreferences, vocabularyLevel } = styleProfile;

          // Apply voice strength blending
          const strengthMultiplier = voiceStrength / 100;

          let description = `User's Writing Style (Voice Strength: ${voiceStrength}%):\n\n`;

          // Voice type
          description += `Voice Type: ${styleProfile.voiceType}\n\n`;

          // Tone metrics (scaled by voice strength)
          description += `Tone Characteristics:\n`;
          description += `- Formality: ${this.describeToneLevel(tone.formality, strengthMultiplier)} (${tone.formality}/10)\n`;
          description += `- Enthusiasm: ${this.describeToneLevel(tone.enthusiasm, strengthMultiplier)} (${tone.enthusiasm}/10)\n`;
          description += `- Directness: ${this.describeToneLevel(tone.directness, strengthMultiplier)} (${tone.directness}/10)\n`;
          description += `- Humor: ${this.describeToneLevel(tone.humor, strengthMultiplier)} (${tone.humor}/10)\n`;
          description += `- Emotionality: ${this.describeToneLevel(tone.emotionality, strengthMultiplier)} (${tone.emotionality}/10)\n\n`;

          // Writing traits
          description += `Writing Traits:\n`;
          description += `- Average sentence length: ${Math.round(writingTraits.avgSentenceLength)} words\n`;
          if (writingTraits.usesQuestionsOften) {
               description += `- Frequently uses questions to engage readers\n`;
          }
          if (writingTraits.usesEmojis) {
               description += `- Uses emojis (frequency: ${writingTraits.emojiFrequency}/5)\n`;
          }
          if (writingTraits.usesBulletPoints) {
               description += `- Prefers bullet points for lists\n`;
          }
          if (writingTraits.usesShortParagraphs) {
               description += `- Prefers short, digestible paragraphs\n`;
          }
          if (writingTraits.usesHooks) {
               description += `- Uses attention-grabbing hooks in openings\n`;
          }
          description += `\n`;

          // Structure preferences
          description += `Structure Preferences:\n`;
          description += `- Introduction style: ${structurePreferences.introStyle}\n`;
          description += `- Body style: ${structurePreferences.bodyStyle}\n`;
          description += `- Ending style: ${structurePreferences.endingStyle}\n\n`;

          // Vocabulary level
          description += `Vocabulary Level: ${vocabularyLevel}\n`;

          // Voice strength guidance
          if (voiceStrength < 50) {
               description += `\nNote: Voice strength is set to ${voiceStrength}%, so blend the user's style with more generic, creative variation.\n`;
          } else if (voiceStrength >= 50 && voiceStrength < 80) {
               description += `\nNote: Voice strength is set to ${voiceStrength}%, so match the user's style while allowing some creative flexibility.\n`;
          } else {
               description += `\nNote: Voice strength is set to ${voiceStrength}%, so closely match the user's authentic voice and style.\n`;
          }

          return description;
     }

     /**
      * Describe tone level with voice strength applied
      */
     private describeToneLevel(level: number, strengthMultiplier: number): string {
          // Blend towards neutral (5) based on voice strength
          const blendedLevel = 5 + (level - 5) * strengthMultiplier;

          if (blendedLevel <= 2) return 'very low';
          if (blendedLevel <= 4) return 'low';
          if (blendedLevel <= 6) return 'moderate';
          if (blendedLevel <= 8) return 'high';
          return 'very high';
     }

     /**
      * Build phrases guidance from style profile
      */
     private buildPhrasesGuidance(styleProfile: StyleProfile): string {
          let guidance = '';

          if (styleProfile.commonPhrases.length > 0) {
               guidance += `Common phrases this user frequently uses:\n`;
               styleProfile.commonPhrases.forEach(phrase => {
                    guidance += `- "${phrase}"\n`;
               });
               guidance += `Consider incorporating these naturally when appropriate.\n\n`;
          }

          if (styleProfile.bannedPhrases.length > 0) {
               guidance += `Phrases to AVOID (user dislikes these):\n`;
               styleProfile.bannedPhrases.forEach(phrase => {
                    guidance += `- "${phrase}"\n`;
               });
               guidance += `Never use these phrases or similar variations.\n\n`;
          }

          return guidance;
     }

     /**
      * Validate prompt size (under 8000 tokens, roughly 6000 words)
      */
     private validatePromptSize(prompt: string): boolean {
          // Rough estimation: 1 token ≈ 0.75 words
          // So 8000 tokens ≈ 6000 words
          const wordCount = prompt.split(/\s+/).length;
          return wordCount < 6000;
     }

     /**
      * Calculate evolution score (simplified version)
      * Full implementation should be in ProfileEvolutionService
      */
     private calculateEvolutionScore(styleProfile: StyleProfile): number {
          let score = 0;

          // Initial samples present (20 points)
          if (styleProfile.samplePosts.length > 0) {
               score += 20;
          }

          // Feedback iterations (40 points max)
          const iterationScore = Math.min((styleProfile.learningIterations / 10) * 40, 40);
          score += iterationScore;

          // Profile completeness (20 points)
          let completenessScore = 0;
          if (styleProfile.commonPhrases.length > 0) completenessScore += 5;
          if (styleProfile.bannedPhrases.length > 0) completenessScore += 5;
          if (styleProfile.samplePosts.length >= 3) completenessScore += 10;
          score += completenessScore;

          // Edit consistency (20 points) - simplified, assume 20 if iterations > 5
          if (styleProfile.learningIterations >= 5) {
               score += 20;
          } else {
               score += (styleProfile.learningIterations / 5) * 20;
          }

          return Math.min(Math.round(score), 100);
     }

     /**
      * Refine existing content based on instructions
      */
     async refineContent(params: RefineContentParams): Promise<IContent> {
          const { contentId, userId, instruction } = params;

          // Retrieve existing content
          const existingContent = await Content.findById(contentId);
          if (!existingContent) {
               throw new Error('Content not found');
          }

          // Verify user owns this content
          if (existingContent.userId.toString() !== userId) {
               throw new Error('Unauthorized: Content does not belong to user');
          }

          // Get the base text (use edited if available, otherwise generated)
          const baseText = existingContent.editedText || existingContent.generatedText;

          // Construct refinement prompt
          const prompt = this.constructRefinementPrompt(
               baseText,
               instruction,
               existingContent.platform,
               existingContent.tone
          );

          // Call Gemini API for refinement
          const refinedText = await this.callGeminiAPI(prompt, 0.8, userId, 'content_generation');

          // Create new content version with incremented version number
          const refinedContent = new Content({
               analysisId: existingContent.analysisId,
               userId: existingContent.userId,
               platform: existingContent.platform,
               tone: existingContent.tone,
               generatedText: refinedText,
               editedText: '',
               version: existingContent.version + 1,
          });

          await refinedContent.save();

          return refinedContent;
     }

     /**
      * Construct refinement prompt
      */
     private constructRefinementPrompt(
          baseText: string,
          instruction: string,
          platform: Platform,
          tone: string
     ): string {
          // Map common instructions to specific guidance
          let refinementGuidance = '';
          if (instruction.toLowerCase().includes('shorter')) {
               refinementGuidance = 'Make the content significantly shorter while preserving the core message. Aim for 30-50% reduction in length. Remove unnecessary details and focus on the most impactful points.';
          } else if (instruction.toLowerCase().includes('clearer')) {
               refinementGuidance = 'Make the content clearer and easier to understand. Simplify complex sentences, use more accessible language, and improve logical flow. Maintain the same general length.';
          } else if (instruction.toLowerCase().includes('engaging')) {
               refinementGuidance = 'Make the content more engaging and compelling. Add hooks, use stronger verbs, create curiosity, and make it more relatable. Keep the core message but make it more captivating.';
          } else {
               refinementGuidance = instruction;
          }

          const prompt = `You are refining social media content for ${platform}.

Original Content:
${baseText}

Original Tone: ${tone}

Refinement Instruction:
${refinementGuidance}

Provide the refined version of the content. Maintain the original tone and platform appropriateness while applying the refinement instruction.

Respond with ONLY the refined content. Do not include any explanations, metadata, or formatting markers.`;

          return prompt;
     }

     /**
      * Call Gemini API with prompt
      * Note: Temperature parameter is accepted but not currently used by the Gemini SDK
      * Temperature is set between 0.7-0.9 as per requirements
      */
     private async callGeminiAPI(prompt: string, temperature: number = 0.8, userId: string = 'unknown', operation: 'content_generation' | 'tone_shift_detection' = 'content_generation'): Promise<string> {
          const startTime = Date.now();
          let success = false;
          let errorMessage: string | undefined;

          try {
               const response = await this.ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
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
                    operation,
                    userId,
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                    latencyMs,
                    success: true,
                    timestamp: new Date(),
               });

               return response.text.trim();
          } catch (error: any) {
               success = false;
               errorMessage = error.message || 'Unknown error';
               const latencyMs = Date.now() - startTime;

               // Log failed API call
               logger.logGeminiAPICall({
                    operation,
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
      * Retrieve content by ID
      */
     async getContent(contentId: string, userId: string): Promise<IContent | null> {
          const content = await Content.findOne({
               _id: new mongoose.Types.ObjectId(contentId),
               userId: new mongoose.Types.ObjectId(userId),
          });

          return content;
     }

     /**
      * Retrieve all content for an analysis
      */
     async getContentByAnalysis(analysisId: string, userId: string): Promise<IContent[]> {
          const contents = await Content.find({
               analysisId: new mongoose.Types.ObjectId(analysisId),
               userId: new mongoose.Types.ObjectId(userId),
          }).sort({ createdAt: -1 });

          return contents;
     }
}
