import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { Analysis, IAnalysis } from '../models/Analysis';
import { Content, IContent, Platform, ContentFormat, Tweet } from '../models/Content';
import { User, StyleProfile } from '../models/User';
import { logger } from './LoggerService';
import { CONTENT_CONFIG, MONITORING_CONFIG, VALIDATION_CONFIG, VOICE_ANALYSIS_CONFIG } from '../config/constants';

/**
 * Parameters for generating content from a repository analysis
 * 
 * @property analysisId - ID of the analysis to generate content from
 * @property userId - ID of the user requesting content generation
 * @property platform - Target platform for content (currently only 'x' supported)
 * @property voiceStrength - Optional voice strength override (0-100). Controls how strongly the user's voice profile is applied
 * @property format - Optional content format. Defaults to 'single' for backward compatibility
 *                    - 'single': Single post (200-280 characters)
 *                    - 'mini_thread': 3-tweet thread with structured narrative
 *                    - 'full_thread': 5-7 tweet thread with comprehensive storytelling
 * @property snapshotId - Optional ID of CodeSnapshot to attach to content
 */
export interface GenerateContentParams {
     analysisId: string;
     userId: string;
     platform: Platform;
     voiceStrength?: number; // Optional voice strength override (0-100)
     format?: ContentFormat; // Optional content format (defaults to 'single')
     snapshotId?: string; // Optional snapshot ID to attach
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
      * Routes to appropriate generation method based on format
      */
     async generateContent(params: GenerateContentParams): Promise<IContent> {
          const { format = 'single' } = params;

          // Route to appropriate generation method based on format
          if (format === 'single') {
               return this.generateSinglePost(params);
          } else if (format === 'mini_thread') {
               return this.generateMiniThread(params);
          } else if (format === 'full_thread') {
               return this.generateFullThread(params);
          } else {
               throw new Error(`Invalid content format: ${format}`);
          }
     }

     /**
      * Generate a single post (existing logic extracted)
      */
     private async generateSinglePost(params: GenerateContentParams): Promise<IContent> {
          const { analysisId, userId, platform, voiceStrength, snapshotId } = params;

          // Retrieve Summary from database
          const analysis = await Analysis.findById(analysisId);
          if (!analysis) {
               throw new Error('Analysis not found');
          }

          // Verify user owns this analysis
          if (analysis.userId.toString() !== userId) {
               throw new Error('Unauthorized: Analysis does not belong to user');
          }

          // If snapshotId provided, validate it exists and belongs to user
          if (snapshotId) {
               const { CodeSnapshot } = await import('../models/CodeSnapshot');
               const snapshot = await CodeSnapshot.findById(snapshotId);

               if (!snapshot) {
                    this.logger.log(LogLevel.WARN, 'Snapshot not found, continuing without snapshot', { snapshotId });
               } else if (snapshot.userId.toString() !== userId) {
                    throw new Error('Unauthorized: Snapshot does not belong to user');
               }
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
                         effectiveVoiceStrength
                    );

                    // Validate prompt size (under 8000 tokens, roughly 6000 words)
                    if (!this.validatePromptSize(prompt)) {
                         this.logger.log(LogLevel.WARN, 'Voice-aware prompt too large, falling back to generic generation');
                         throw new Error('Prompt too large');
                    }

                    // Call Gemini API with voice-aware prompt
                    generatedText = await this.callGeminiAPI(prompt, CONTENT_CONFIG.GEMINI_TEMPERATURE, userId, 'content_generation');
                    usedStyleProfile = true;
               } catch (error) {
                    this.logger.log(LogLevel.ERROR, 'Voice-aware generation failed, falling back to generic', {
                         error: error instanceof Error ? error.message : String(error)
                    });
                    // Fall back to generic generation
                    const prompt = this.constructContentPrompt(analysis, platform);
                    generatedText = await this.callGeminiAPI(prompt, CONTENT_CONFIG.GEMINI_TEMPERATURE, userId, 'content_generation');
               }
          } else {
               // Use generic generation without voice profile
               const prompt = this.constructContentPrompt(analysis, platform);
               generatedText = await this.callGeminiAPI(prompt, CONTENT_CONFIG.GEMINI_TEMPERATURE, userId, 'content_generation');
          }

          // Store generated content with metadata
          // Note: Do NOT set tweets field for single posts - leave it undefined
          const content = new Content({
               analysisId: new mongoose.Types.ObjectId(analysisId),
               userId: new mongoose.Types.ObjectId(userId),
               platform,
               contentFormat: 'single',
               generatedText,
               editedText: '',
               version: 1,
               usedStyleProfile,
               voiceStrengthUsed: effectiveVoiceStrength,
               evolutionScoreAtGeneration,
               snapshotId: snapshotId ? new mongoose.Types.ObjectId(snapshotId) : undefined,
          });

          await content.save();

          // Track content generation
          logger.trackContentGeneration(usedStyleProfile);

          return content;
     }

     /**
      * Generate a mini thread (3 tweets)
      * Builds a mini thread prompt, calls Gemini API, parses response, and creates thread content
      * 
      * @param params - Generation parameters including analysisId, userId, platform, voiceStrength, snapshotId
      * @returns Content document with 3-tweet thread
      * @throws Error if analysis not found, user not found, or generation fails
      */
     private async generateMiniThread(params: GenerateContentParams): Promise<IContent> {
          const { analysisId, userId, snapshotId } = params;

          // Retrieve analysis from database
          const analysis = await Analysis.findById(analysisId);
          if (!analysis) {
               throw new Error('Analysis not found');
          }

          // Verify user owns this analysis
          if (analysis.userId.toString() !== userId) {
               throw new Error('Unauthorized: Analysis does not belong to user');
          }

          // If snapshotId provided, validate it exists and belongs to user
          if (snapshotId) {
               const { CodeSnapshot } = await import('../models/CodeSnapshot');
               const snapshot = await CodeSnapshot.findById(snapshotId);

               if (!snapshot) {
                    this.logger.log(LogLevel.WARN, 'Snapshot not found, continuing without snapshot', { snapshotId });
               } else if (snapshot.userId.toString() !== userId) {
                    throw new Error('Unauthorized: Snapshot does not belong to user');
               }
          }

          // Retrieve user to check for styleProfile
          const user = await User.findById(userId);
          if (!user) {
               throw new Error('User not found');
          }

          // Build mini thread prompt with voice profile integration
          const prompt = await this.buildThreadPrompt(params, 'mini_thread');

          // Validate prompt size (under 8000 tokens, roughly 6000 words)
          if (!this.validatePromptSize(prompt)) {
               throw new Error('Thread prompt too large. Please try with a smaller repository analysis.');
          }

          // Call Gemini API to generate thread
          const response = await this.callGeminiAPI(
               prompt,
               CONTENT_CONFIG.GEMINI_TEMPERATURE,
               userId,
               'content_generation'
          );

          // Parse response expecting exactly 3 tweets
          const tweets = this.parseThreadResponse(response, 3);

          // Create and return thread content
          return this.createThreadContent(params, tweets, 'mini_thread');
     }

     /**
      * Generate a full thread (5-7 tweets)
      * Builds a full thread prompt, calls Gemini API, parses response, and creates thread content
      * 
      * @param params - Generation parameters including analysisId, userId, platform, voiceStrength, snapshotId
      * @returns Content document with 5-7 tweet thread
      * @throws Error if analysis not found, user not found, or generation fails
      */
     private async generateFullThread(params: GenerateContentParams): Promise<IContent> {
          const { analysisId, userId, snapshotId } = params;

          // Retrieve analysis from database
          const analysis = await Analysis.findById(analysisId);
          if (!analysis) {
               throw new Error('Analysis not found');
          }

          // Verify user owns this analysis
          if (analysis.userId.toString() !== userId) {
               throw new Error('Unauthorized: Analysis does not belong to user');
          }

          // If snapshotId provided, validate it exists and belongs to user
          if (snapshotId) {
               const { CodeSnapshot } = await import('../models/CodeSnapshot');
               const snapshot = await CodeSnapshot.findById(snapshotId);

               if (!snapshot) {
                    this.logger.log(LogLevel.WARN, 'Snapshot not found, continuing without snapshot', { snapshotId });
               } else if (snapshot.userId.toString() !== userId) {
                    throw new Error('Unauthorized: Snapshot does not belong to user');
               }
          }

          // Retrieve user to check for styleProfile
          const user = await User.findById(userId);
          if (!user) {
               throw new Error('User not found');
          }

          // Build full thread prompt with voice profile integration
          const prompt = await this.buildThreadPrompt(params, 'full_thread');

          // Validate prompt size (under 8000 tokens, roughly 6000 words)
          if (!this.validatePromptSize(prompt)) {
               throw new Error('Thread prompt too large. Please try with a smaller repository analysis.');
          }

          // Call Gemini API to generate thread
          const response = await this.callGeminiAPI(
               prompt,
               CONTENT_CONFIG.GEMINI_TEMPERATURE,
               userId,
               'content_generation'
          );

          // Parse response expecting 5-7 tweets
          const tweets = this.parseThreadResponse(response, 5, 7);

          // Create and return thread content
          return this.createThreadContent(params, tweets, 'full_thread');
     }

     /**
      * Create and save a Content document for thread content
      * 
      * @param params - Generation parameters including analysisId, userId, platform, voiceStrength, snapshotId
      * @param tweets - Array of Tweet objects with text, position, and characterCount
      * @param format - Content format ('mini_thread' or 'full_thread')
      * @returns Saved Content document with thread data
      * 
      * This method:
      * - Creates a Content document with the tweets array
      * - Concatenates tweets into generatedText field for backward compatibility
      * - Sets contentFormat appropriately
      * - Includes voice metadata (usedStyleProfile, voiceStrengthUsed, evolutionScoreAtGeneration)
      * - Attaches snapshotId if provided
      */
     private async createThreadContent(
          params: GenerateContentParams,
          tweets: Tweet[],
          format: ContentFormat
     ): Promise<IContent> {
          const { analysisId, userId, platform, voiceStrength, snapshotId } = params;

          // If snapshotId provided, validate it exists and belongs to user
          if (snapshotId) {
               const { CodeSnapshot } = await import('../models/CodeSnapshot');
               const snapshot = await CodeSnapshot.findById(snapshotId);

               if (!snapshot) {
                    this.logger.log(LogLevel.WARN, 'Snapshot not found, continuing without snapshot', { snapshotId });
               } else if (snapshot.userId.toString() !== userId) {
                    throw new Error('Unauthorized: Snapshot does not belong to user');
               }
          }

          // Retrieve user to get voice metadata
          const user = await User.findById(userId);
          if (!user) {
               throw new Error('User not found');
          }

          // Determine effective voice strength
          const effectiveVoiceStrength = voiceStrength !== undefined ? voiceStrength : user.voiceStrength;

          // Calculate voice-aware metadata
          let usedStyleProfile = false;
          let evolutionScoreAtGeneration = 0;

          if (user.styleProfile && effectiveVoiceStrength > 0) {
               usedStyleProfile = true;
               evolutionScoreAtGeneration = this.calculateEvolutionScore(user.styleProfile);
          }

          // Concatenate tweets for generatedText field (backward compatibility)
          // Join with double newlines to separate tweets clearly
          const generatedText = tweets.map(t => t.text).join('\n\n');

          // Create Content document with all required fields
          const content = new Content({
               analysisId: new mongoose.Types.ObjectId(analysisId),
               userId: new mongoose.Types.ObjectId(userId),
               platform,
               contentFormat: format,
               generatedText,
               editedText: '',
               tweets,
               version: 1,
               usedStyleProfile,
               voiceStrengthUsed: effectiveVoiceStrength,
               evolutionScoreAtGeneration,
               snapshotId: snapshotId ? new mongoose.Types.ObjectId(snapshotId) : undefined,
          });

          // Save to database
          await content.save();

          // Track content generation
          logger.trackContentGeneration(usedStyleProfile);

          return content;
     }

     /**
      * Get mini thread structure template for prompt construction
      * Returns a formatted string describing the 3-tweet structure
      */
     private getMiniThreadStructure(): string {
          return `
Tweet 1: Hook + Context
- Grab attention with a bold statement or question
- Set up what the project is about
- Create curiosity

Tweet 2: Problem + Solution
- Explain the problem this project solves
- Describe the approach or solution
- Highlight key technical decisions

Tweet 3: Result + CTA
- Share the outcome or current state
- Include a call-to-action (try it, contribute, feedback)
- End with engagement (question or invitation)
`;
     }

     /**
      * Get full thread structure template for prompt construction
      * Returns a formatted string describing the 5-7 tweet structure
      */
     private getFullThreadStructure(): string {
          return `
Tweet 1: Hook / Bold Statement
- Attention-grabbing opening
- Make a claim or pose a compelling question
- Set the stage for the story

Tweet 2: Problem / Why It Matters
- Explain the problem or gap
- Why should people care?
- Context and motivation

Tweet 3: Solution / What Was Built
- Describe the solution or project
- High-level overview of the approach
- Key features or capabilities

Tweet 4: Code Insight / Architecture / Technical Value
- Technical deep dive
- Architecture decisions
- Code examples or patterns used

Tweet 5: CTA / Engagement Question
- Call to action (star, fork, try it)
- Ask for feedback or contributions
- Engagement question

Additional tweets (if needed):
- Extra technical details
- Performance metrics
- Future roadmap
`;
     }

     /**
      * Build thread-specific prompt with voice profile integration
      * Constructs format-specific prompts for mini_thread or full_thread
      * Integrates voice profile section when available
      */
     private async buildThreadPrompt(
          params: GenerateContentParams,
          format: 'mini_thread' | 'full_thread'
     ): Promise<string> {
          const { analysisId, userId, voiceStrength } = params;

          // Retrieve analysis from database
          const analysis = await Analysis.findById(analysisId);
          if (!analysis) {
               throw new Error('Analysis not found');
          }

          // Retrieve user to check for styleProfile
          const user = await User.findById(userId);
          if (!user) {
               throw new Error('User not found');
          }

          // Determine effective voice strength
          const effectiveVoiceStrength = voiceStrength !== undefined ? voiceStrength : user.voiceStrength;

          // Get thread structure based on format
          const threadStructure = format === 'mini_thread'
               ? this.getMiniThreadStructure()
               : this.getFullThreadStructure();

          // Determine tweet count for the format
          const tweetCount = format === 'mini_thread' ? '3' : '5-7';

          // Base repository context from analysis
          const baseContext = this.formatAnalysisContext(analysis);

          // Build voice-aware section if profile exists and voice strength > 0
          let voiceSection = '';
          if (user.styleProfile && effectiveVoiceStrength > 0) {
               voiceSection = this.buildVoiceSection(user.styleProfile, effectiveVoiceStrength);
          }

          // Construct the complete thread prompt
          const prompt = `You are an expert content writer helping a developer communicate their work${user.styleProfile && effectiveVoiceStrength > 0 ? ' in their authentic voice' : ''}.

Repository Context:
${baseContext}

Thread Structure:
${threadStructure}

Requirements:
- Generate exactly ${tweetCount} tweets
- Each tweet must be 200-280 characters (strict limit)
- Maintain consistent ${user.styleProfile && effectiveVoiceStrength > 0 ? 'voice and ' : ''}tone across all tweets
- Use technical details from the repository context
- Make each tweet self-contained but connected to the narrative
- Focus on what's interesting, new, or surprising about this project
- DO NOT add tweet numbers (1/3, 2/3, etc.) - these will be added automatically

${voiceSection}

Output Format:
Return ONLY the tweets, one per line, in order. No explanations, metadata, or additional text.
Each line should contain exactly one complete tweet.
Do not include numbering, bullet points, or any other formatting.

Example format:
[Tweet 1 text here]
[Tweet 2 text here]
[Tweet 3 text here]
`;

          return prompt;
     }

     /**
      * Format analysis context for prompt construction
      * Extracts and formats key information from analysis
      */
     private formatAnalysisContext(analysis: IAnalysis): string {
          return `
Problem: ${analysis.problemStatement}
Target Audience: ${analysis.targetAudience}
Core Functionality: ${analysis.coreFunctionality.join(', ')}
Notable Features: ${analysis.notableFeatures.join(', ')}
Recent Changes: ${analysis.recentChanges.join(', ')}
Integrations: ${analysis.integrations.join(', ')}
Value Proposition: ${analysis.valueProposition}
`.trim();
     }

     /**
      * Parse Gemini thread response into structured Tweet objects
      * Handles various response formats, removes numbering artifacts, validates character limits
      * 
      * @param response - Raw text response from Gemini API
      * @param minTweets - Minimum number of tweets required
      * @param maxTweets - Optional maximum number of tweets (defaults to minTweets)
      * @returns Array of Tweet objects with text, position, and character count
      * @throws Error if minimum tweet count is not met
      */
     private parseThreadResponse(
          response: string,
          minTweets: number,
          maxTweets?: number
     ): Tweet[] {
          // Use minTweets as maxTweets if not specified
          const effectiveMaxTweets = maxTweets || minTweets;

          // Split response into individual lines and clean up
          const lines = response
               .split('\n')
               .map(line => line.trim())
               .filter(line => line.length > 0);

          const tweets: Tweet[] = [];

          for (let i = 0; i < lines.length; i++) {
               let text = lines[i];

               // Remove common numbering artifacts at the start
               // Patterns: "1.", "1)", "1/3", "Tweet 1:", etc.
               text = text.replace(/^(Tweet\s+)?\d+[\.):\-\/]\s*/i, '').trim();

               // Remove position indicators at the end (e.g., "1/3", "2/5")
               text = text.replace(/\s*\d+\/\d+\s*$/, '').trim();

               // Remove bullet points or dashes at the start
               text = text.replace(/^[\-\*•]\s*/, '').trim();

               // Skip if text is too short to be a valid tweet (minimum 50 characters)
               if (text.length < 50) {
                    continue;
               }

               // Validate and truncate if needed (280 character limit)
               if (text.length > 280) {
                    // Truncate with ellipsis, ensuring we stay within limit
                    text = text.substring(0, 277) + '...';
               }

               // Add tweet to array
               tweets.push({
                    text,
                    position: tweets.length + 1,
                    characterCount: text.length,
               });

               // Stop if we've reached max tweets
               if (tweets.length >= effectiveMaxTweets) {
                    break;
               }
          }

          // Ensure we have minimum required tweets
          if (tweets.length < minTweets) {
               throw new Error(
                    `Generated only ${tweets.length} tweets, expected at least ${minTweets}. ` +
                    `Response may be malformed or too short.`
               );
          }

          // Add position indicators (1/3, 2/3, etc.) to each tweet
          const total = tweets.length;
          tweets.forEach((tweet, idx) => {
               const indicator = ` ${idx + 1}/${total}`;

               // Only add indicator if it fits within character limit
               if (tweet.text.length + indicator.length <= 280) {
                    tweet.text += indicator;
                    tweet.characterCount = tweet.text.length;
               }
               // If it doesn't fit, the tweet stays as is (already within 280 chars)
          });

          return tweets;
     }

     /**
      * Build voice-aware section for thread prompts
      * Reuses logic from buildVoiceAwarePrompt but adapted for threads
      */
     private buildVoiceSection(styleProfile: StyleProfile, voiceStrength: number): string {
          // Select representative samples for few-shot learning
          const samples = this.selectRepresentativeSamples(styleProfile.samplePosts);

          let voiceSection = `\nUser's Writing Style (Voice Strength: ${voiceStrength}%):\n\n`;

          // Voice type
          voiceSection += `Voice Type: ${styleProfile.voiceType}\n\n`;

          // Tone characteristics
          const strengthMultiplier = voiceStrength / 100;
          voiceSection += `Tone Characteristics:\n`;
          voiceSection += `- Formality: ${this.describeToneLevel(styleProfile.tone.formality, strengthMultiplier)} (${styleProfile.tone.formality}/10)\n`;
          voiceSection += `- Enthusiasm: ${this.describeToneLevel(styleProfile.tone.enthusiasm, strengthMultiplier)} (${styleProfile.tone.enthusiasm}/10)\n`;
          voiceSection += `- Directness: ${this.describeToneLevel(styleProfile.tone.directness, strengthMultiplier)} (${styleProfile.tone.directness}/10)\n`;
          voiceSection += `- Humor: ${this.describeToneLevel(styleProfile.tone.humor, strengthMultiplier)} (${styleProfile.tone.humor}/10)\n`;
          voiceSection += `- Emotionality: ${this.describeToneLevel(styleProfile.tone.emotionality, strengthMultiplier)} (${styleProfile.tone.emotionality}/10)\n\n`;

          // Writing traits
          voiceSection += `Writing Traits:\n`;
          voiceSection += `- Average sentence length: ${Math.round(styleProfile.writingTraits.avgSentenceLength)} words\n`;
          if (styleProfile.writingTraits.usesQuestionsOften) {
               voiceSection += `- Frequently uses questions to engage readers\n`;
          }
          if (styleProfile.writingTraits.usesEmojis) {
               voiceSection += `- Uses emojis (frequency: ${styleProfile.writingTraits.emojiFrequency}/5)\n`;
          }
          if (styleProfile.writingTraits.usesBulletPoints) {
               voiceSection += `- Prefers bullet points for lists\n`;
          }
          if (styleProfile.writingTraits.usesShortParagraphs) {
               voiceSection += `- Prefers short, digestible paragraphs\n`;
          }
          if (styleProfile.writingTraits.usesHooks) {
               voiceSection += `- Uses attention-grabbing hooks in openings\n`;
          }
          voiceSection += `\n`;

          // Structure preferences
          voiceSection += `Structure Preferences:\n`;
          voiceSection += `- Introduction style: ${styleProfile.structurePreferences.introStyle}\n`;
          voiceSection += `- Body style: ${styleProfile.structurePreferences.bodyStyle}\n`;
          voiceSection += `- Ending style: ${styleProfile.structurePreferences.endingStyle}\n\n`;

          // Vocabulary level
          voiceSection += `Vocabulary Level: ${styleProfile.vocabularyLevel}\n\n`;

          // Few-shot examples if available
          if (samples.length > 0) {
               voiceSection += `Example writings from this user's style:\n\n`;
               samples.forEach((sample, idx) => {
                    voiceSection += `Example ${idx + 1}:\n${sample}\n\n`;
               });
               voiceSection += `These examples demonstrate the user's authentic voice, sentence structure, vocabulary choices, and typical phrasing.\n\n`;
          }

          // Phrases guidance
          if (styleProfile.commonPhrases.length > 0) {
               voiceSection += `Common phrases this user frequently uses:\n`;
               styleProfile.commonPhrases.forEach(phrase => {
                    voiceSection += `- "${phrase}"\n`;
               });
               voiceSection += `Consider incorporating these naturally when appropriate.\n\n`;
          }

          if (styleProfile.bannedPhrases.length > 0) {
               voiceSection += `Phrases to AVOID (user dislikes these):\n`;
               styleProfile.bannedPhrases.forEach(phrase => {
                    voiceSection += `- "${phrase}"\n`;
               });
               voiceSection += `Never use these phrases or similar variations.\n\n`;
          }

          // Voice strength guidance
          if (voiceStrength < CONTENT_CONFIG.VOICE_STRENGTH_LOW_THRESHOLD) {
               voiceSection += `Note: Voice strength is set to ${voiceStrength}%, so blend the user's style with more generic, creative variation.\n`;
          } else if (voiceStrength >= CONTENT_CONFIG.VOICE_STRENGTH_LOW_THRESHOLD && voiceStrength < CONTENT_CONFIG.VOICE_STRENGTH_HIGH_THRESHOLD) {
               voiceSection += `Note: Voice strength is set to ${voiceStrength}%, so match the user's style while allowing some creative flexibility.\n`;
          } else {
               voiceSection += `Note: Voice strength is set to ${voiceStrength}%, so closely match the user's authentic voice and style across all tweets in the thread.\n`;
          }

          return voiceSection;
     }

     /**
      * Construct platform-specific prompts (generic, without voice profile)
      */
     private constructContentPrompt(
          analysis: IAnalysis,
          platform: Platform
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
          const platformGuidelines = `
Platform: X (Twitter)
Guidelines:
- Concise and engaging tone suitable for X audience
- Length: 200-280 characters (single tweet) or up to 500 characters for thread-style
- Structure: Hook in first sentence, key points, call-to-action or insight
- Can be more casual and direct
- Focus on what's interesting, new, or surprising
`;

          const prompt = `You are an expert content writer helping developers communicate their work to broader audiences.

${baseContext}

${platformGuidelines}

Generate ONE coherent narrative post for this repository. Do not create multiple posts or per-commit content.
The content should be clear, engaging, and appropriate for the target platform.

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
          const platformGuidelines = `
Platform: X (Twitter)
Guidelines:
- Concise and engaging tone suitable for X audience
- Length: 200-280 characters (single tweet) or up to 500 characters for thread-style
- Structure: Hook in first sentence, key points, call-to-action or insight
- Can be more casual and direct
- Focus on what's interesting, new, or surprising
`;

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

          // If we have max samples or fewer, use all of them
          if (samplePosts.length <= VOICE_ANALYSIS_CONFIG.FEW_SHOT_SAMPLES_MAX) {
               return samplePosts;
          }

          // If we have more, select evenly distributed samples
          // Prioritize recent samples (assuming they're ordered with most recent first)
          const selectedSamples: string[] = [];
          const step = Math.floor(samplePosts.length / VOICE_ANALYSIS_CONFIG.FEW_SHOT_SAMPLES_MAX);

          for (let i = 0; i < VOICE_ANALYSIS_CONFIG.FEW_SHOT_SAMPLES_MAX; i++) {
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
          if (voiceStrength < CONTENT_CONFIG.VOICE_STRENGTH_LOW_THRESHOLD) {
               description += `\nNote: Voice strength is set to ${voiceStrength}%, so blend the user's style with more generic, creative variation.\n`;
          } else if (voiceStrength >= CONTENT_CONFIG.VOICE_STRENGTH_LOW_THRESHOLD && voiceStrength < CONTENT_CONFIG.VOICE_STRENGTH_HIGH_THRESHOLD) {
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
          // Blend towards neutral based on voice strength
          const blendedLevel = CONTENT_CONFIG.TONE_NEUTRAL_VALUE + (level - CONTENT_CONFIG.TONE_NEUTRAL_VALUE) * strengthMultiplier;

          if (blendedLevel <= CONTENT_CONFIG.TONE_VERY_LOW_MAX) return 'very low';
          if (blendedLevel <= CONTENT_CONFIG.TONE_LOW_MAX) return 'low';
          if (blendedLevel <= CONTENT_CONFIG.TONE_MODERATE_MAX) return 'moderate';
          if (blendedLevel <= CONTENT_CONFIG.TONE_HIGH_MAX) return 'high';
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
          return wordCount < CONTENT_CONFIG.PROMPT_MAX_WORDS;
     }

     /**
      * Calculate evolution score (simplified version)
      * Full implementation should be in ProfileEvolutionService
      */
     private calculateEvolutionScore(styleProfile: StyleProfile): number {
          let score = 0;

          // Initial samples present
          if (styleProfile.samplePosts.length > 0) {
               score += CONTENT_CONFIG.EVOLUTION_SCORE_INITIAL_SAMPLES;
          }

          // Feedback iterations (max points)
          const iterationScore = Math.min(
               (styleProfile.learningIterations / CONTENT_CONFIG.EVOLUTION_SCORE_ITERATIONS_THRESHOLD) * CONTENT_CONFIG.EVOLUTION_SCORE_FEEDBACK_MAX,
               CONTENT_CONFIG.EVOLUTION_SCORE_FEEDBACK_MAX
          );
          score += iterationScore;

          // Profile completeness
          let completenessScore = 0;
          if (styleProfile.commonPhrases.length > 0) completenessScore += 5;
          if (styleProfile.bannedPhrases.length > 0) completenessScore += 5;
          if (styleProfile.samplePosts.length >= VOICE_ANALYSIS_CONFIG.FEW_SHOT_SAMPLES_MIN) completenessScore += 10;
          score += completenessScore;

          // Edit consistency - simplified, assume max if iterations > threshold
          if (styleProfile.learningIterations >= CONTENT_CONFIG.EVOLUTION_SCORE_CONSISTENCY_THRESHOLD) {
               score += CONTENT_CONFIG.EVOLUTION_SCORE_CONSISTENCY_MAX;
          } else {
               score += (styleProfile.learningIterations / CONTENT_CONFIG.EVOLUTION_SCORE_CONSISTENCY_THRESHOLD) * CONTENT_CONFIG.EVOLUTION_SCORE_CONSISTENCY_MAX;
          }

          return Math.min(Math.round(score), CONTENT_CONFIG.EVOLUTION_SCORE_MAX);
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
               existingContent.platform
          );

          // Call Gemini API for refinement
          const refinedText = await this.callGeminiAPI(prompt, CONTENT_CONFIG.GEMINI_TEMPERATURE, userId, 'content_generation');

          // Create new content version with incremented version number
          const refinedContent = new Content({
               analysisId: existingContent.analysisId,
               userId: existingContent.userId,
               platform: existingContent.platform,
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
          platform: Platform
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

Refinement Instruction:
${refinementGuidance}

Provide the refined version of the content. Maintain platform appropriateness while applying the refinement instruction.

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
               const promptTokens = Math.ceil(prompt.split(/\s+/).length * MONITORING_CONFIG.TOKEN_ESTIMATION_MULTIPLIER);
               const completionTokens = Math.ceil(response.text.split(/\s+/).length * MONITORING_CONFIG.TOKEN_ESTIMATION_MULTIPLIER);

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
                    promptTokens: Math.ceil(prompt.split(/\s+/).length * MONITORING_CONFIG.TOKEN_ESTIMATION_MULTIPLIER),
                    completionTokens: 0,
                    totalTokens: Math.ceil(prompt.split(/\s+/).length * MONITORING_CONFIG.TOKEN_ESTIMATION_MULTIPLIER),
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

