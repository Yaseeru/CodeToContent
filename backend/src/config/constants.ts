/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers
 */

// Database Configuration
export const DATABASE_CONFIG = {
     MAX_RETRIES: 3,
     RETRY_DELAYS_MS: [1000, 2000, 4000], // Exponential backoff: 1s, 2s, 4s
} as const;

// Queue Configuration
export const QUEUE_CONFIG = {
     BACKOFF_DELAY_MS: 1000,
     MAX_ATTEMPTS: 3,
     COMPLETED_JOB_RETENTION_SECONDS: 24 * 3600, // 24 hours
     COMPLETED_JOB_MAX_COUNT: 1000,
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
     DEFAULT_WINDOW_MS: 60 * 60 * 1000, // 1 hour
     DEFAULT_MAX_REQUESTS: 100,
     STRICT_MAX_REQUESTS: 10,
} as const;

// Validation Configuration
export const VALIDATION_CONFIG = {
     TEXT_ANALYSIS_MIN_CHARS: 300,
     FILE_ANALYSIS_MIN_CHARS: 500,
     EDITED_TEXT_MIN_CHARS: 10,
     VOICE_STRENGTH_MIN: 0,
     VOICE_STRENGTH_MAX: 100,
     TONE_METRIC_MIN: 1,
     TONE_METRIC_MAX: 10,
     EMOJI_FREQUENCY_MIN: 0,
     EMOJI_FREQUENCY_MAX: 5,
     BEARER_TOKEN_PARTS: 2,
} as const;

// Voice Analysis Configuration
export const VOICE_ANALYSIS_CONFIG = {
     MAX_COMMON_PHRASES: 20,
     MAX_BANNED_PHRASES: 20,
     MAX_SAMPLE_POSTS: 10,
     TEXT_TRUNCATION_LIMIT: 5000,
     FEW_SHOT_SAMPLES_MIN: 3,
     FEW_SHOT_SAMPLES_MAX: 6,
} as const;

// Learning Engine Configuration
export const LEARNING_CONFIG = {
     RATE_LIMIT_MS: 5 * 60 * 1000, // 5 minutes
     BATCH_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
     MIN_EDITS_FOR_MAJOR_CHANGES: 5,
     MIN_EDITS_FOR_PATTERN_DETECTION: 3,
     MIN_EDITS_FOR_BANNED_PHRASES: 2,
     RECENT_EDITS_LIMIT: 20,
     MAX_EDIT_METADATA_PER_USER: 50,
     ADJUSTMENT_PERCENTAGE: 0.15, // 15% adjustment for weighted updates
     SENTENCE_LENGTH_MIN: 5,
     SENTENCE_LENGTH_MAX: 50,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
     PROFILE_TTL_SECONDS: 3600, // 1 hour
     EVOLUTION_SCORE_TTL_SECONDS: 300, // 5 minutes
     ARCHETYPE_LIST_TTL_SECONDS: 86400, // 24 hours
} as const;

// Content Generation Configuration
export const CONTENT_CONFIG = {
     LINKEDIN_MIN_WORDS: 150,
     LINKEDIN_MAX_WORDS: 300,
     TWITTER_MIN_CHARS: 200,
     TWITTER_MAX_CHARS: 500,
     PROMPT_MAX_WORDS: 6000, // ~8000 tokens
     GEMINI_TEMPERATURE: 0.8,
     EVOLUTION_SCORE_MAX: 100,
     EVOLUTION_SCORE_INITIAL_SAMPLES: 20,
     EVOLUTION_SCORE_FEEDBACK_MAX: 40,
     EVOLUTION_SCORE_COMPLETENESS_MAX: 20,
     EVOLUTION_SCORE_CONSISTENCY_MAX: 20,
     EVOLUTION_SCORE_ITERATIONS_THRESHOLD: 10,
     EVOLUTION_SCORE_CONSISTENCY_THRESHOLD: 5,
     VOICE_STRENGTH_LOW_THRESHOLD: 50,
     VOICE_STRENGTH_HIGH_THRESHOLD: 80,
     TONE_NEUTRAL_VALUE: 5,
     TONE_VERY_LOW_MAX: 2,
     TONE_LOW_MAX: 4,
     TONE_MODERATE_MAX: 6,
     TONE_HIGH_MAX: 8,
} as const;

// GitHub API Configuration
export const GITHUB_CONFIG = {
     DEFAULT_PAGE: 1,
     DEFAULT_PER_PAGE: 100,
     COMMIT_HISTORY_LIMIT: 50,
     PULL_REQUEST_LIMIT: 50,
     RECENT_COMMITS_FOR_ANALYSIS: 10,
     RECENT_PRS_FOR_ANALYSIS: 10,
     README_TRUNCATION_LIMIT: 2000,
     DEPENDENCIES_DISPLAY_LIMIT: 15,
} as const;

// Authentication Configuration
export const AUTH_CONFIG = {
     JWT_EXPIRY: '7d',
     STATE_LENGTH: 30, // Combined length from two random strings
} as const;

// File Upload Configuration
export const FILE_UPLOAD_CONFIG = {
     MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
     ALLOWED_MIME_TYPES: ['text/plain', 'text/markdown', 'application/pdf'],
     ALLOWED_EXTENSIONS: ['txt', 'md', 'pdf'],
} as const;

// Monitoring Configuration
export const MONITORING_CONFIG = {
     MAX_LOGS_IN_MEMORY: 500,
     TOKEN_ESTIMATION_MULTIPLIER: 1.3, // Words to tokens approximation
} as const;

// Worker Configuration
export const WORKER_CONFIG = {
     HEALTH_CHECK_PORT: 3002,
} as const;

// Redis Configuration
export const REDIS_CONFIG = {
     DEFAULT_HOST: 'localhost',
     DEFAULT_PORT: 6379,
     MAX_RETRY_DELAY_MS: 2000,
     RETRY_DELAY_BASE_MS: 50,
} as const;

// Profile Versioning Configuration
export const PROFILE_VERSION_CONFIG = {
     MAX_VERSIONS_STORED: 10,
} as const;
