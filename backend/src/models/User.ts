import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
     githubId: string;
     username: string;
     accessToken: string;
     avatarUrl: string;
     createdAt: Date;
     updatedAt: Date;
}

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
     },
     {
          timestamps: true,
     }
);

export const User = mongoose.model<IUser>('User', UserSchema);
