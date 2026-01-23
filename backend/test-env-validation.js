/**
 * Manual test script for environment validation
 * Tests different storage configurations
 * 
 * Usage:
 *   node test-env-validation.js local
 *   node test-env-validation.js s3
 */

const storageType = process.argv[2] || 'local';

console.log(`\n=== Testing ${storageType.toUpperCase()} Storage Configuration ===\n`);

// Set required environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Set snapshot configuration based on storage type
process.env.SNAPSHOT_STORAGE_TYPE = storageType;

if (storageType === 'local') {
     process.env.SNAPSHOT_STORAGE_PATH = 'uploads/snapshots';
     process.env.SNAPSHOT_MAX_SNIPPETS = '5';
     process.env.SNAPSHOT_IMAGE_QUALITY = '90';
     console.log('✓ Local storage configuration set');
} else if (storageType === 's3') {
     process.env.AWS_S3_BUCKET = 'test-bucket-name';
     process.env.AWS_S3_REGION = 'us-east-1';
     process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
     process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
     console.log('✓ S3 storage configuration set');
}

// Optional: Set Puppeteer path
if (process.platform === 'linux') {
     process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium-browser';
     console.log('✓ Puppeteer executable path set for Linux');
}

// Import and run validation
try {
     const { validateEnvironmentVariables } = require('./dist/config/validateEnv');
     console.log('\nRunning validation...\n');
     validateEnvironmentVariables();
     console.log('\n✅ Validation passed successfully!\n');
} catch (error) {
     console.error('\n❌ Validation failed:', error.message, '\n');
     process.exit(1);
}
