import mongoose, { Schema, Document } from 'mongoose';

export interface IRepository extends Document {
     userId: mongoose.Types.ObjectId;
     githubRepoId: string;
     name: string;
     fullName: string;
     description: string;
     url: string;
     lastAnalyzed: Date;
     createdAt: Date;
     updatedAt: Date;
}

const RepositorySchema: Schema = new Schema(
     {
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               index: true,
          },
          githubRepoId: {
               type: String,
               required: true,
               unique: true,
               index: true,
          },
          name: {
               type: String,
               required: true,
          },
          fullName: {
               type: String,
               required: true,
          },
          description: {
               type: String,
               required: false,
          },
          url: {
               type: String,
               required: true,
          },
          lastAnalyzed: {
               type: Date,
               required: false,
          },
     },
     {
          timestamps: true,
     }
);

export const Repository = mongoose.model<IRepository>('Repository', RepositorySchema);
