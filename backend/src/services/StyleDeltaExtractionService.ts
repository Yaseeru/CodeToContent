import { GoogleGenAI } from '@google/genai';

export interface StyleDelta {
     sentenceLengthDelta: number;
     emojiChanges: {
          added: number;
          removed: number;
          netChange: number;
     };
     structureChanges: {
          paragraphsAdded: number;
          paragraphsRemoved: number;
          bulletsAdded: boolean;
          formattingChanges: string[];
     };
     toneShift: string;
     vocabularyChanges: {
          wordsSubstituted: Array<{ from: string; to: string }>;
          complexityShift: number;
     };
     phrasesAdded: string[];
     phrasesRemoved: string[];
}

export interface DeltaMetrics {
     totalChanges: number;
     significantChanges: number;
     changeCategories: string[];
}

export class StyleDeltaExtractionService {
     private ai: GoogleGenAI;
     private apiKey: string;

     constructor(apiKey: string) {
          this.apiKey = apiKey;
          this.ai = new GoogleGenAI({ apiKey });
     }

     /**
      * Extract style deltas between original and edited text
      */
     async extractDeltas(original: string, edited: string): Promise<StyleDelta> {
          // Calculate sentence length delta
          const sentenceLengthDelta = this.calculateSentenceLengthDelta(original, edited);

          // Detect emoji changes
          const emojiChanges = this.detectEmojiChanges(original, edited);

          // Detect structure changes
          const structureChanges = this.detectStructureChanges(original, edited);

          // Detect vocabulary changes
          const vocabularyChanges = this.detectVocabularyChanges(original, edited);

          // Extract phrases added and removed
          const { phrasesAdded, phrasesRemoved } = this.extractPhraseChanges(original, edited);

          // Classify tone shift using Gemini
          const toneShift = await this.classifyToneShift(original, edited);

          return {
               sentenceLengthDelta,
               emojiChanges,
               structureChanges,
               toneShift,
               vocabularyChanges,
               phrasesAdded,
               phrasesRemoved,
          };
     }

     /**
      * Calculate metrics from style delta
      */
     calculateMetrics(delta: StyleDelta): DeltaMetrics {
          let totalChanges = 0;
          let significantChanges = 0;
          const changeCategories: string[] = [];

          // Count sentence length changes
          if (Math.abs(delta.sentenceLengthDelta) > 2) {
               totalChanges++;
               significantChanges++;
               changeCategories.push('sentence_length');
          }

          // Count emoji changes
          if (delta.emojiChanges.netChange !== 0) {
               totalChanges++;
               if (Math.abs(delta.emojiChanges.netChange) >= 2) {
                    significantChanges++;
               }
               changeCategories.push('emoji');
          }

          // Count structure changes
          if (delta.structureChanges.paragraphsAdded > 0 || delta.structureChanges.paragraphsRemoved > 0) {
               totalChanges++;
               if (delta.structureChanges.paragraphsAdded > 1 || delta.structureChanges.paragraphsRemoved > 1) {
                    significantChanges++;
               }
               changeCategories.push('structure');
          }

          if (delta.structureChanges.bulletsAdded) {
               totalChanges++;
               significantChanges++;
               changeCategories.push('bullets');
          }

          // Count vocabulary changes
          if (delta.vocabularyChanges.wordsSubstituted.length > 0) {
               totalChanges++;
               if (delta.vocabularyChanges.wordsSubstituted.length >= 3) {
                    significantChanges++;
               }
               changeCategories.push('vocabulary');
          }

          // Count phrase changes
          if (delta.phrasesAdded.length > 0 || delta.phrasesRemoved.length > 0) {
               totalChanges++;
               if (delta.phrasesAdded.length >= 2 || delta.phrasesRemoved.length >= 2) {
                    significantChanges++;
               }
               changeCategories.push('phrases');
          }

          // Count tone shift
          if (delta.toneShift && delta.toneShift !== 'no change') {
               totalChanges++;
               significantChanges++;
               changeCategories.push('tone');
          }

          return {
               totalChanges,
               significantChanges,
               changeCategories,
          };
     }

     /**
      * Calculate sentence length delta (compare averages)
      */
     private calculateSentenceLengthDelta(original: string, edited: string): number {
          const originalAvg = this.calculateAvgSentenceLength(original);
          const editedAvg = this.calculateAvgSentenceLength(edited);
          return editedAvg - originalAvg;
     }

     /**
      * Calculate average sentence length in words
      */
     private calculateAvgSentenceLength(text: string): number {
          if (!text || text.trim().length === 0) {
               return 0;
          }

          // Split into sentences using common sentence terminators
          const sentences = text
               .split(/[.!?]+/)
               .map(s => s.trim())
               .filter(s => s.length > 0);

          if (sentences.length === 0) {
               return 0;
          }

          // Count words in each sentence
          const totalWords = sentences.reduce((sum, sentence) => {
               const words = sentence.split(/\s+/).filter(w => w.length > 0);
               return sum + words.length;
          }, 0);

          return totalWords / sentences.length;
     }

     /**
      * Detect emoji changes (count additions, removals, net change)
      */
     private detectEmojiChanges(original: string, edited: string): {
          added: number;
          removed: number;
          netChange: number;
     } {
          const originalEmojis = this.extractEmojis(original);
          const editedEmojis = this.extractEmojis(edited);

          const added = editedEmojis.length - originalEmojis.length > 0
               ? editedEmojis.length - originalEmojis.length
               : 0;
          const removed = originalEmojis.length - editedEmojis.length > 0
               ? originalEmojis.length - editedEmojis.length
               : 0;
          const netChange = editedEmojis.length - originalEmojis.length;

          return { added, removed, netChange };
     }

     /**
      * Extract emojis from text
      */
     private extractEmojis(text: string): string[] {
          // Emoji regex pattern - matches most common emoji ranges
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu;
          const matches = text.match(emojiRegex);
          return matches || [];
     }

     /**
      * Detect structure changes (paragraphs, bullets, formatting)
      */
     private detectStructureChanges(original: string, edited: string): {
          paragraphsAdded: number;
          paragraphsRemoved: number;
          bulletsAdded: boolean;
          formattingChanges: string[];
     } {
          const originalParagraphs = this.countParagraphs(original);
          const editedParagraphs = this.countParagraphs(edited);

          const paragraphsAdded = Math.max(0, editedParagraphs - originalParagraphs);
          const paragraphsRemoved = Math.max(0, originalParagraphs - editedParagraphs);

          const originalHasBullets = this.hasBulletPoints(original);
          const editedHasBullets = this.hasBulletPoints(edited);
          const bulletsAdded = !originalHasBullets && editedHasBullets;

          const formattingChanges: string[] = [];
          if (bulletsAdded) {
               formattingChanges.push('bullets_added');
          }
          if (originalHasBullets && !editedHasBullets) {
               formattingChanges.push('bullets_removed');
          }

          return {
               paragraphsAdded,
               paragraphsRemoved,
               bulletsAdded,
               formattingChanges,
          };
     }

     /**
      * Count paragraphs in text
      */
     private countParagraphs(text: string): number {
          if (!text || text.trim().length === 0) {
               return 0;
          }

          // Split by double newlines or more
          const paragraphs = text
               .split(/\n\s*\n/)
               .map(p => p.trim())
               .filter(p => p.length > 0);

          return paragraphs.length;
     }

     /**
      * Check if text has bullet points
      */
     private hasBulletPoints(text: string): boolean {
          // Check for common bullet point patterns
          const bulletPatterns = [
               /^\s*[-*•]\s+/m,     // - or * or • at start of line
               /^\s*\d+\.\s+/m,     // numbered lists
               /^\s*[a-z]\.\s+/m,   // lettered lists
          ];

          return bulletPatterns.some(pattern => pattern.test(text));
     }

     /**
      * Detect vocabulary changes (word substitutions, complexity shifts)
      */
     private detectVocabularyChanges(original: string, edited: string): {
          wordsSubstituted: Array<{ from: string; to: string }>;
          complexityShift: number;
     } {
          // Simple word substitution detection using basic diffing
          const originalWords = this.extractWords(original);
          const editedWords = this.extractWords(edited);

          const wordsSubstituted = this.findWordSubstitutions(originalWords, editedWords);

          // Calculate complexity shift based on average word length
          const originalComplexity = this.calculateVocabularyComplexity(original);
          const editedComplexity = this.calculateVocabularyComplexity(edited);

          let complexityShift = 0;
          if (editedComplexity > originalComplexity + 0.5) {
               complexityShift = 1; // More complex
          } else if (editedComplexity < originalComplexity - 0.5) {
               complexityShift = -1; // Simpler
          }

          return {
               wordsSubstituted,
               complexityShift,
          };
     }

     /**
      * Extract words from text
      */
     private extractWords(text: string): string[] {
          return text
               .toLowerCase()
               .split(/\s+/)
               .map(w => w.replace(/[^a-z0-9]/g, ''))
               .filter(w => w.length > 0);
     }

     /**
      * Find word substitutions between two texts
      */
     private findWordSubstitutions(
          originalWords: string[],
          editedWords: string[]
     ): Array<{ from: string; to: string }> {
          const substitutions: Array<{ from: string; to: string }> = [];

          // Simple heuristic: find words that appear in one but not the other
          const originalSet = new Set(originalWords);
          const editedSet = new Set(editedWords);

          const removedWords = originalWords.filter(w => !editedSet.has(w));
          const addedWords = editedWords.filter(w => !originalSet.has(w));

          // Pair up removed and added words (up to 5 substitutions)
          const maxSubstitutions = Math.min(5, Math.min(removedWords.length, addedWords.length));
          for (let i = 0; i < maxSubstitutions; i++) {
               substitutions.push({
                    from: removedWords[i],
                    to: addedWords[i],
               });
          }

          return substitutions;
     }

     /**
      * Calculate vocabulary complexity (average word length)
      */
     private calculateVocabularyComplexity(text: string): number {
          const words = this.extractWords(text);
          if (words.length === 0) {
               return 0;
          }

          const totalLength = words.reduce((sum, word) => sum + word.length, 0);
          return totalLength / words.length;
     }

     /**
      * Extract phrase changes (added and removed phrases)
      */
     private extractPhraseChanges(original: string, edited: string): {
          phrasesAdded: string[];
          phrasesRemoved: string[];
     } {
          // Extract multi-word phrases (2-5 words)
          const originalPhrases = this.extractPhrases(original);
          const editedPhrases = this.extractPhrases(edited);

          const originalSet = new Set(originalPhrases);
          const editedSet = new Set(editedPhrases);

          const phrasesAdded = editedPhrases.filter(p => !originalSet.has(p)).slice(0, 10);
          const phrasesRemoved = originalPhrases.filter(p => !editedSet.has(p)).slice(0, 10);

          return { phrasesAdded, phrasesRemoved };
     }

     /**
      * Extract phrases from text (2-5 word sequences)
      */
     private extractPhrases(text: string): string[] {
          const words = text
               .toLowerCase()
               .split(/\s+/)
               .map(w => w.replace(/[^a-z0-9\s]/g, ''))
               .filter(w => w.length > 0);

          const phrases: string[] = [];

          // Extract 2-5 word phrases
          for (let length = 2; length <= 5; length++) {
               for (let i = 0; i <= words.length - length; i++) {
                    const phrase = words.slice(i, i + length).join(' ');
                    if (phrase.length >= 10) { // Minimum phrase length
                         phrases.push(phrase);
                    }
               }
          }

          return phrases;
     }

     /**
      * Classify tone shift using Gemini
      */
     private async classifyToneShift(original: string, edited: string): Promise<string> {
          try {
               const prompt = this.buildToneShiftPrompt(original, edited);
               const response = await this.callGeminiAPI(prompt);
               return this.parseToneShiftResponse(response);
          } catch (error: any) {
               // If Gemini fails, return a default value
               return 'no change';
          }
     }

     /**
      * Build Gemini prompt for tone shift classification
      */
     private buildToneShiftPrompt(original: string, edited: string): string {
          // Limit text length to avoid token limits
          const maxLength = 1000;
          const originalTruncated = original.substring(0, maxLength);
          const editedTruncated = edited.substring(0, maxLength);

          return `You are an expert at analyzing tone shifts in text edits. Compare the original and edited versions and classify the tone shift.

ORIGINAL TEXT:
${originalTruncated}

EDITED TEXT:
${editedTruncated}

Classify the tone shift in ONE of these categories:
- "more casual" - the edited version is more informal, conversational
- "more professional" - the edited version is more formal, business-like
- "more enthusiastic" - the edited version shows more excitement, energy
- "more subdued" - the edited version is calmer, less emotional
- "more direct" - the edited version is more straightforward, less verbose
- "more indirect" - the edited version is more nuanced, diplomatic
- "more humorous" - the edited version adds humor or wit
- "more serious" - the edited version removes humor, becomes more earnest
- "no change" - no significant tone shift detected

Respond with ONLY the category name, nothing else.`;
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

               if (!response.text) {
                    throw new Error('Gemini API returned empty response');
               }

               return response.text;
          } catch (error: any) {
               throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
          }
     }

     /**
      * Parse tone shift response from Gemini
      */
     private parseToneShiftResponse(response: string): string {
          const cleaned = response.trim().toLowerCase();

          const validCategories = [
               'more casual',
               'more professional',
               'more enthusiastic',
               'more subdued',
               'more direct',
               'more indirect',
               'more humorous',
               'more serious',
               'no change',
          ];

          // Find matching category
          for (const category of validCategories) {
               if (cleaned.includes(category)) {
                    return category;
               }
          }

          // Default to no change if no match
          return 'no change';
     }
}
