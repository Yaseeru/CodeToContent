import mongoose, { Schema, Document } from 'mongoose';

export type Platform = 'linkedin' | 'x';

export interface IContent extends Document {
     analysisId: mongoose.Types.ObjectId;
     userId: mongoose.Types.ObjectId;
     platform: Platform;
     tone: string;
     generatedText: string;
     editedText: string;
     version: number;
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
               enum: ['linkedin', 'x'],
          },
          tone: {
               type: String,
               required: true,
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
     },
     {
          timestamps: true,
     }
);

export const Content = mongoose.model<IContent>('Content', ContentSchema);
