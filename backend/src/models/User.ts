import mongoose, { Schema, Document } from 'mongoose';

// Style Profile Types
export type VoiceType = 'educational' | 'storytelling' | 'opinionated' | 'analytical' | 'casual' | 'professional';
export type IntroStyle = 'hook' | 'story' | 'problem' | 'statement';
export type BodyStyle = 'steps' | 'narrative' | 'analysis' | 'bullets';
export type EndingStyle = 'cta' | 'reflection' | 'summary' | 'question';
export type VocabularyLevel = 'simple' | 'medium' | 'advanced';
export type ProfileSource = 'manual' | 'file' | 'feedback' | 'archetype';

export interface ToneMetrics {
     formality: number;        // 1-10: 1 = very casual, 10 = very formal
     enthusiasm: number;       // 1-10: 1 = subdued, 10 = very enthusiastic
     directness: number;       // 1-10: 1 = indirect, 10 = very direct
     humor: number;            // 1-10: 1 = serious, 10 = very humorous
     emotionality: number;     // 1-10: 1 = detached, 10 = very emotional
}

export interface WritingTraits {
     avgSentenceLength: number;           // Average words per sentence
     usesQuestionsOften: boolean;         // Frequently uses questions
     usesEmojis: boolean;                 // Uses emojis in writing
     emojiFrequency: number;              // 0-5 scale
     usesBulletPoints: boolean;           // Prefers bullet lists
     usesShortParagraphs: boolean;        // Prefers short paragraphs
     usesHooks: boolean;                  // Uses attention-grabbing openings
}

export interface StructurePreferences {
     introStyle: IntroStyle;
     bodyStyle: BodyStyle;
     endingStyle: EndingStyle;
}

export interface ManualOverrides {
     tone?: Partial<ToneMetrics>;
     writingTraits?: Partial<WritingTraits>;
     structurePreferences?: Partial<StructurePreferences>;
}

export interface StyleProfile {
     // Core voice characteristics
     voiceType: VoiceType;

     // Tone metrics (1-10 scale)
     tone: ToneMetrics;

     // Writing traits
     writingTraits: WritingTraits;

     // Structure preferences
     structurePreferences: StructurePreferences;

     // Vocabulary and phrases
     vocabularyLevel: VocabularyLevel;
     commonPhrases: string[];              // Phrases user frequently uses
     bannedPhrases: string[];              // Phrases user avoids/removes

     // Sample writings for few-shot prompting
     samplePosts: string[];                // 3-10 representative samples

     // Learning metadata
     learningIterations: number;           // Number of feedback updates
     lastUpdated: Date;                    // Last profile update
     profileSource: ProfileSource;
     archetypeBase?: string;               // If started from archetype
}

export interface ProfileVersion {
     profile: StyleProfile;
     timestamp: Date;
     source: 'manual' | 'feedback' | 'archetype' | 'rollback';
     learningIterations: number;
}

export interface IUser extends Document {
     githubId: string;
     username: string;
     accessToken: string;
     avatarUrl: string;

     // Style Profile (optional for backward compatibility)
     styleProfile?: StyleProfile;

     // Profile version history (store last 10 versions)
     profileVersions: ProfileVersion[];

     // Voice strength preference (0-100, default 80)
     voiceStrength: number;

     // Emoji preference (default true)
     emojiPreference: boolean;

     // Manual overrides (protected from feedback learning)
     manualOverrides?: ManualOverrides;

     // Optimistic locking version field for concurrency control
     __v?: number;

     createdAt: Date;
     updatedAt: Date;
}

const ToneMetricsSchema = new Schema({
     formality: { type: Number, min: 1, max: 10, required: true },
     enthusiasm: { type: Number, min: 1, max: 10, required: true },
     directness: { type: Number, min: 1, max: 10, required: true },
     humor: { type: Number, min: 1, max: 10, required: true },
     emotionality: { type: Number, min: 1, max: 10, required: true },
}, { _id: false });

const WritingTraitsSchema = new Schema({
     avgSentenceLength: { type: Number, required: true },
     usesQuestionsOften: { type: Boolean, required: true },
     usesEmojis: { type: Boolean, required: true },
     emojiFrequency: { type: Number, min: 0, max: 5, required: true },
     usesBulletPoints: { type: Boolean, required: true },
     usesShortParagraphs: { type: Boolean, required: true },
     usesHooks: { type: Boolean, required: true },
}, { _id: false });

const StructurePreferencesSchema = new Schema({
     introStyle: {
          type: String,
          enum: ['hook', 'story', 'problem', 'statement'],
          required: true
     },
     bodyStyle: {
          type: String,
          enum: ['steps', 'narrative', 'analysis', 'bullets'],
          required: true
     },
     endingStyle: {
          type: String,
          enum: ['cta', 'reflection', 'summary', 'question'],
          required: true
     },
}, { _id: false });

const StyleProfileSchema = new Schema({
     voiceType: {
          type: String,
          enum: ['educational', 'storytelling', 'opinionated', 'analytical', 'casual', 'professional'],
          required: true,
     },
     tone: {
          type: ToneMetricsSchema,
          required: true,
     },
     writingTraits: {
          type: WritingTraitsSchema,
          required: true,
     },
     structurePreferences: {
          type: StructurePreferencesSchema,
          required: true,
     },
     vocabularyLevel: {
          type: String,
          enum: ['simple', 'medium', 'advanced'],
          required: true,
     },
     commonPhrases: {
          type: [String],
          default: [],
     },
     bannedPhrases: {
          type: [String],
          default: [],
     },
     samplePosts: {
          type: [String],
          default: [],
     },
     learningIterations: {
          type: Number,
          default: 0,
     },
     lastUpdated: {
          type: Date,
          default: Date.now,
     },
     profileSource: {
          type: String,
          enum: ['manual', 'file', 'feedback', 'archetype'],
          required: true,
     },
     archetypeBase: {
          type: String,
          required: false,
     },
}, { _id: false });

const ProfileVersionSchema = new Schema({
     profile: {
          type: StyleProfileSchema,
          required: true,
     },
     timestamp: {
          type: Date,
          required: true,
          default: Date.now,
     },
     source: {
          type: String,
          enum: ['manual', 'feedback', 'archetype', 'rollback'],
          required: true,
     },
     learningIterations: {
          type: Number,
          required: true,
     },
}, { _id: false });

const ManualOverridesSchema = new Schema({
     tone: {
          type: Schema.Types.Mixed,
          required: false,
     },
     writingTraits: {
          type: Schema.Types.Mixed,
          required: false,
     },
     structurePreferences: {
          type: Schema.Types.Mixed,
          required: false,
     },
}, { _id: false });

const UserSchema: Schema = new Schema(
     {
          githubId: {
               type: String,
               required: true,
               unique: true,
               index: true,
          },
          username: {
               type: String,
               required: true,
          },
          accessToken: {
               type: String,
               required: true,
          },
          avatarUrl: {
               type: String,
               required: false,
          },
          styleProfile: {
               type: StyleProfileSchema,
               required: false,
          },
          profileVersions: {
               type: [ProfileVersionSchema],
               default: [],
          },
          voiceStrength: {
               type: Number,
               min: 0,
               max: 100,
               default: 80,
          },
          emojiPreference: {
               type: Boolean,
               default: true,
          },
          manualOverrides: {
               type: ManualOverridesSchema,
               required: false,
          },
     },
     {
          timestamps: true,
     }
);

export const User = mongoose.model<IUser>('User', UserSchema);
