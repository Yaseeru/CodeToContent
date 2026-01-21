import mongoose, { Schema, Document } from 'mongoose';

export type Platform = 'x';

export interface IContent extends Document {
     analysisId: mongoose.Types.ObjectId;
     userId: mongoose.Types.ObjectId;
     platform: Platform;
     generatedText: string;
     editedText: string;
     version: number;

     // Edit metadata for learning
     editMetadata?: {
          originalText: string;
          originalLength: number;
          editedLength: number;
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
          editTimestamp: Date;
          learningProcessed: boolean;
     };

     // Voice-aware generation metadata
     usedStyleProfile?: boolean;
     voiceStrengthUsed?: number;
     evolutionScoreAtGeneration?: number;

     createdAt: Date;
     updatedAt: Date;
}

const ContentSchema: Schema = new Schema(
     {
          analysisId: {
               type: Schema.Types.ObjectId,
               ref: 'Analysis',
               required: true,
               index: true,
          },
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               index: true,
          },
          platform: {
               type: String,
               required: true,
               enum: ['x'],
          },
          generatedText: {
               type: String,
               required: true,
          },
          editedText: {
               type: String,
               required: false,
          },
          version: {
               type: Number,
               required: true,
               default: 1,
               min: 1,
          },
          editMetadata: {
               type: {
                    originalText: { type: String, required: true },
                    originalLength: { type: Number, required: true },
                    editedLength: { type: Number, required: true },
                    sentenceLengthDelta: { type: Number, required: true },
                    emojiChanges: {
                         type: {
                              added: { type: Number, required: true },
                              removed: { type: Number, required: true },
                              netChange: { type: Number, required: true },
                         },
                         required: true,
                    },
                    structureChanges: {
                         type: {
                              paragraphsAdded: { type: Number, required: true },
                              paragraphsRemoved: { type: Number, required: true },
                              bulletsAdded: { type: Boolean, required: true },
                              formattingChanges: { type: [String], required: true },
                         },
                         required: true,
                    },
                    toneShift: { type: String, required: true },
                    vocabularyChanges: {
                         type: {
                              wordsSubstituted: {
                                   type: [{ from: String, to: String }],
                                   required: true,
                              },
                              complexityShift: { type: Number, required: true },
                         },
                         required: true,
                    },
                    phrasesAdded: { type: [String], required: true },
                    phrasesRemoved: { type: [String], required: true },
                    editTimestamp: { type: Date, required: true },
                    learningProcessed: { type: Boolean, required: true, default: false },
               },
               required: false,
          },
          usedStyleProfile: {
               type: Boolean,
               required: false,
          },
          voiceStrengthUsed: {
               type: Number,
               required: false,
               min: 0,
               max: 100,
          },
          evolutionScoreAtGeneration: {
               type: Number,
               required: false,
               min: 0,
               max: 100,
          },
     },
     {
          timestamps: true,
     }
);

export const Content = mongoose.model<IContent>('Content', ContentSchema);
