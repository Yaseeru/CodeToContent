import mongoose, { Schema, Document } from 'mongoose';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

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

export interface ILearningJob extends Document {
     userId: mongoose.Types.ObjectId;
     contentId: mongoose.Types.ObjectId;
     status: JobStatus;
     priority: number;
     attempts: number;
     error?: string;
     styleDelta?: StyleDelta;
     metadata?: {
          isThread?: boolean;
          contentFormat?: string;
          tweetCount?: number;
     };
     processingStarted?: Date;
     processingCompleted?: Date;
     createdAt: Date;
     updatedAt: Date;
}

const StyleDeltaSchema = new Schema({
     sentenceLengthDelta: { type: Number, required: true },
     emojiChanges: {
          type: {
               added: { type: Number, required: true },
               removed: { type: Number, required: true },
               netChange: { type: Number, required: true },
          },
          required: true,
          _id: false,
     },
     structureChanges: {
          type: {
               paragraphsAdded: { type: Number, required: true },
               paragraphsRemoved: { type: Number, required: true },
               bulletsAdded: { type: Boolean, required: true },
               formattingChanges: { type: [String], required: true },
          },
          required: true,
          _id: false,
     },
     toneShift: { type: String, required: true },
     vocabularyChanges: {
          type: {
               wordsSubstituted: {
                    type: [{
                         from: { type: String, required: true },
                         to: { type: String, required: true },
                    }],
                    required: true,
               },
               complexityShift: { type: Number, required: true },
          },
          required: true,
          _id: false,
     },
     phrasesAdded: { type: [String], required: true },
     phrasesRemoved: { type: [String], required: true },
}, { _id: false });

const LearningJobSchema: Schema = new Schema(
     {
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               index: true,
          },
          contentId: {
               type: Schema.Types.ObjectId,
               ref: 'Content',
               required: true,
          },
          status: {
               type: String,
               enum: ['pending', 'processing', 'completed', 'failed'],
               required: true,
               default: 'pending',
               index: true,
          },
          priority: {
               type: Number,
               required: true,
               default: 0,
          },
          attempts: {
               type: Number,
               required: true,
               default: 0,
               min: 0,
          },
          error: {
               type: String,
               required: false,
          },
          styleDelta: {
               type: StyleDeltaSchema,
               required: false,
          },
          metadata: {
               type: {
                    isThread: { type: Boolean, required: false },
                    contentFormat: { type: String, required: false },
                    tweetCount: { type: Number, required: false },
               },
               required: false,
               _id: false,
          },
          processingStarted: {
               type: Date,
               required: false,
          },
          processingCompleted: {
               type: Date,
               required: false,
          },
     },
     {
          timestamps: true,
     }
);

// Compound index for efficient queue processing
LearningJobSchema.index({ userId: 1, status: 1 });

export const LearningJob = mongoose.model<ILearningJob>('LearningJob', LearningJobSchema);
