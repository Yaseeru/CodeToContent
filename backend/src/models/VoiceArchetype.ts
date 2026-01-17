import mongoose, { Schema, Document } from 'mongoose';
import { StyleProfile } from './User';

export type ArchetypeCategory = 'professional' | 'casual' | 'creative' | 'technical';

export interface IVoiceArchetype extends Document {
     name: string;
     description: string;
     category: ArchetypeCategory;
     styleProfile: StyleProfile;
     usageCount: number;
     isDefault: boolean;
     createdBy?: mongoose.Types.ObjectId;
     createdAt: Date;
     updatedAt: Date;
}

const VoiceArchetypeSchema: Schema = new Schema(
     {
          name: {
               type: String,
               required: true,
               unique: true,
          },
          description: {
               type: String,
               required: true,
          },
          category: {
               type: String,
               enum: ['professional', 'casual', 'creative', 'technical'],
               required: true,
          },
          styleProfile: {
               type: Schema.Types.Mixed,
               required: true,
          },
          usageCount: {
               type: Number,
               required: true,
               default: 0,
               min: 0,
          },
          isDefault: {
               type: Boolean,
               required: true,
               default: false,
          },
          createdBy: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: false,
          },
     },
     {
          timestamps: true,
     }
);

export const VoiceArchetype = mongoose.model<IVoiceArchetype>('VoiceArchetype', VoiceArchetypeSchema);
