/**
 * Snapshot Configuration Constants
 * Centralized configuration for Visual Intelligence (Code Snapshot Generator)
 */

export interface SnapshotConfig {
     // Storage configuration
     storageType: 'local' | 's3' | 'gcs' | 'azure';
     storagePath: string;

     // Image rendering configuration
     maxSnippets: number;
     imageQuality: number;
     maxImageSizeMB: number;

     // Performance configuration
     selectionTimeoutMs: number;
     renderingTimeoutMs: number;
     parallelBatchSize: number;

     // Caching configuration
     cacheTTLHours: number;
     cleanupAgeDays: number;

     // Rate limiting configuration
     maxPerUser: number;
     rateLimitPerHour: number;

     // AWS S3 configuration (optional)
     s3?: {
          bucket: string;
          region: string;
          accessKeyId?: string;
          secretAccessKey?: string;
     };
}

/**
 * Get snapshot configuration from environment variables with defaults
 */
export function getSnapshotConfig(): SnapshotConfig {
     const config: SnapshotConfig = {
          // Storage configuration
          storageType: (process.env.SNAPSHOT_STORAGE_TYPE as any) || 'local',
          storagePath: process.env.SNAPSHOT_STORAGE_PATH || 'uploads/snapshots',

          // Image rendering configuration
          maxSnippets: parseInt(process.env.SNAPSHOT_MAX_SNIPPETS || '5', 10),
          imageQuality: parseInt(process.env.SNAPSHOT_IMAGE_QUALITY || '90', 10),
          maxImageSizeMB: parseInt(process.env.SNAPSHOT_MAX_IMAGE_SIZE_MB || '5', 10),

          // Performance configuration
          selectionTimeoutMs: parseInt(process.env.SNAPSHOT_SELECTION_TIMEOUT_MS || '5000', 10),
          renderingTimeoutMs: parseInt(process.env.SNAPSHOT_RENDERING_TIMEOUT_MS || '3000', 10),
          parallelBatchSize: parseInt(process.env.SNAPSHOT_PARALLEL_BATCH_SIZE || '5', 10),

          // Caching configuration
          cacheTTLHours: parseInt(process.env.SNAPSHOT_CACHE_TTL_HOURS || '24', 10),
          cleanupAgeDays: parseInt(process.env.SNAPSHOT_CLEANUP_AGE_DAYS || '30', 10),

          // Rate limiting configuration
          maxPerUser: parseInt(process.env.SNAPSHOT_MAX_PER_USER || '50', 10),
          rateLimitPerHour: parseInt(process.env.SNAPSHOT_RATE_LIMIT_PER_HOUR || '5', 10),
     };

     // Add S3 configuration if storage type is S3
     if (config.storageType === 's3') {
          config.s3 = {
               bucket: process.env.AWS_S3_BUCKET || '',
               region: process.env.AWS_S3_REGION || 'us-east-1',
               accessKeyId: process.env.AWS_ACCESS_KEY_ID,
               secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          };
     }

     return config;
}

/**
 * Default render options for code snapshot images
 */
export const DEFAULT_RENDER_OPTIONS = {
     theme: 'nord',
     showLineNumbers: false,
     fontSize: 14,
     padding: 24,
     backgroundColor: '#2e3440',
     windowControls: true,
};

/**
 * Supported programming languages for syntax highlighting
 */
export const SUPPORTED_LANGUAGES = [
     'typescript',
     'javascript',
     'python',
     'java',
     'go',
     'rust',
     'cpp',
     'c',
     'csharp',
     'ruby',
     'php',
     'swift',
     'kotlin',
     'scala',
     'html',
     'css',
     'json',
     'yaml',
     'markdown',
     'sql',
     'bash',
     'shell',
];

/**
 * File extension to language mapping
 */
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
     '.ts': 'typescript',
     '.tsx': 'typescript',
     '.js': 'javascript',
     '.jsx': 'javascript',
     '.py': 'python',
     '.java': 'java',
     '.go': 'go',
     '.rs': 'rust',
     '.cpp': 'cpp',
     '.cc': 'cpp',
     '.cxx': 'cpp',
     '.c': 'c',
     '.h': 'c',
     '.cs': 'csharp',
     '.rb': 'ruby',
     '.php': 'php',
     '.swift': 'swift',
     '.kt': 'kotlin',
     '.scala': 'scala',
     '.html': 'html',
     '.css': 'css',
     '.json': 'json',
     '.yaml': 'yaml',
     '.yml': 'yaml',
     '.md': 'markdown',
     '.sql': 'sql',
     '.sh': 'bash',
     '.bash': 'bash',
};

/**
 * Maximum lines of code per snippet (for readability)
 */
export const MAX_SNIPPET_LINES = 50;

/**
 * Minimum lines of code per snippet (avoid trivial snippets)
 */
export const MIN_SNIPPET_LINES = 5;
