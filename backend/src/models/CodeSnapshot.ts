import mongoose, { Schema, Document } from 'mongoose';

export interface SnippetMetadata {
     filePath: string;
     startLine: number;
     endLine: number;
     functionName?: string;
     language: string;
     linesOfCode: number;
}

export interface ImageDimensions {
     width: number;
     height: number;
}

export interface RenderOptions {
     theme: string;
     showLineNumbers: boolean;
     fontSize: number;
}

export interface ICodeSnapshot extends Document {
     repositoryId: mongoose.Types.ObjectId;
     analysisId: mongoose.Types.ObjectId;
     userId: mongoose.Types.ObjectId;

     // Snippet metadata
     snippetMetadata: SnippetMetadata;

     // Selection scoring
     selectionScore: number; // 0-100
     selectionReason: string; // Why this snippet was selected

     // Image data
     imageUrl: string; // URL to stored PNG image
     imageSize: number; // File size in bytes
     imageDimensions: ImageDimensions;

     // Rendering options used
     renderOptions: RenderOptions;

     // Caching and staleness
     isStale: boolean; // True if repository has been updated since generation
     lastCommitSha: string; // Commit SHA at time of generation

     createdAt: Date;
     updatedAt: Date;
}

const SnippetMetadataSchema = new Schema({
     filePath: {
          type: String,
          required: true,
     },
     startLine: {
          type: Number,
          required: true,
          min: 1,
     },
     endLine: {
          type: Number,
          required: true,
          min: 1,
     },
     functionName: {
          type: String,
          required: false,
     },
     language: {
          type: String,
          required: true,
     },
     linesOfCode: {
          type: Number,
          required: true,
          min: 1,
     },
}, { _id: false });

const ImageDimensionsSchema = new Schema({
     width: {
          type: Number,
          required: true,
          min: 1,
     },
     height: {
          type: Number,
          required: true,
          min: 1,
     },
}, { _id: false });

const RenderOptionsSchema = new Schema({
     theme: {
          type: String,
          required: true,
          default: 'nord',
     },
     showLineNumbers: {
          type: Boolean,
          required: true,
          default: false,
     },
     fontSize: {
          type: Number,
          required: true,
          default: 14,
          min: 8,
          max: 24,
     },
}, { _id: false });

const CodeSnapshotSchema: Schema = new Schema(
     {
          repositoryId: {
               type: Schema.Types.ObjectId,
               ref: 'Repository',
               required: true,
               index: true,
          },
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
          snippetMetadata: {
               type: SnippetMetadataSchema,
               required: true,
          },
          selectionScore: {
               type: Number,
               required: true,
               min: 0,
               max: 100,
          },
          selectionReason: {
               type: String,
               required: true,
          },
          imageUrl: {
               type: String,
               required: true,
          },
          imageSize: {
               type: Number,
               required: true,
               min: 0,
          },
          imageDimensions: {
               type: ImageDimensionsSchema,
               required: true,
          },
          renderOptions: {
               type: RenderOptionsSchema,
               required: true,
          },
          isStale: {
               type: Boolean,
               required: true,
               default: false,
               index: true,
          },
          lastCommitSha: {
               type: String,
               required: true,
          },
     },
     {
          timestamps: true,
     }
);

// Compound index for efficient queries: find non-stale snapshots for a repository, sorted by score
CodeSnapshotSchema.index({ repositoryId: 1, isStale: 1, selectionScore: -1 });

// Additional compound index for user-specific queries
CodeSnapshotSchema.index({ userId: 1, repositoryId: 1, isStale: 1 });

export const CodeSnapshot = mongoose.model<ICodeSnapshot>('CodeSnapshot', CodeSnapshotSchema);
