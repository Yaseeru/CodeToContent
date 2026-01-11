import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import { Analysis, IAnalysis } from '../models/Analysis';
import { Content, IContent, Platform } from '../models/Content';

export interface GenerateContentParams {
     analysisId: string;
     userId: string;
     platform: Platform;
     tone: string;
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
          const { analysisId, userId, platform, tone } = params;

          // Retrieve Summary from database
          const analysis = await Analysis.findById(analysisId);
          if (!analysis) {
               throw new Error('Analysis not found');
          }

          // Verify user owns this analysis
          if (analysis.userId.toString() !== userId) {
               throw new Error('Unauthorized: Analysis does not belong to user');
          }

          // Construct platform-specific prompt
          const prompt = this.constructContentPrompt(analysis, platform, tone);

          // Call Gemini API for content generation
          const generatedText = await this.callGeminiAPI(prompt);

          // Store generated content with metadata
          const content = new Content({
               analysisId: new mongoose.Types.ObjectId(analysisId),
               userId: new mongoose.Types.ObjectId(userId),
               platform,
               tone,
               generatedText,
               editedText: '',
               version: 1,
          });

          await content.save();

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
          const refinedText = await this.callGeminiAPI(prompt);

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
      */
     private async callGeminiAPI(prompt: string): Promise<string> {
          try {
               const response = await this.ai.models.generateContent({
                    model: 'gemini-2.0-flash-exp',
                    contents: prompt,
               });

               return response.text.trim();
          } catch (error: any) {
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
