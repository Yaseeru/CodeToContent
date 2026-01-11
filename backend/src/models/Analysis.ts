import mongoose, { Schema, Document } from 'mongoose';

export interface IRawSignals {
     readmeLength: number;
     commitCount: number;
     prCount: number;
     fileStructure: string[];
}

export interface IAnalysis extends Document {
     repositoryId: mongoose.Types.ObjectId;
     userId: mongoose.Types.ObjectId;
     problemStatement: string;
     targetAudience: string;
     coreFunctionality: string[];
     notableFeatures: string[];
     recentChanges: string[];
     integrations: string[];
     valueProposition: string;
     rawSignals: IRawSignals;
     createdAt: Date;
}

const AnalysisSchema: Schema = new Schema(
     {
          repositoryId: {
               type: Schema.Types.ObjectId,
               ref: 'Repository',
               required: true,
               index: true,
          },
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               index: true,
          },
          problemStatement: {
               type: String,
               required: true,
          },
          targetAudience: {
               type: String,
               required: true,
          },
          coreFunctionality: {
               type: [String],
               required: true,
               validate: {
                    validator: (v: string[]) => Array.isArray(v) && v.length > 0,
                    message: 'coreFunctionality must be a non-empty array',
               },
          },
          notableFeatures: {
               type: [String],
               required: true,
          },
          recentChanges: {
               type: [String],
               required: true,
          },
          integrations: {
               type: [String],
               required: true,
          },
          valueProposition: {
               type: String,
               required: true,
          },
          rawSignals: {
               readmeLength: {
                    type: Number,
                    required: true,
               },
               commitCount: {
                    type: Number,
                    required: true,
               },
               prCount: {
                    type: Number,
                    required: true,
               },
               fileStructure: {
                    type: [String],
                    required: true,
               },
          },
     },
     {
          timestamps: { createdAt: true, updatedAt: false },
     }
);

export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
