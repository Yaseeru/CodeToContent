/**
 * Test script for invalid environment validation
 * Tests that validation properly catches errors
 */

console.log('\n=== Testing INVALID Configuration (should fail) ===\n');

// Set required environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Set INVALID snapshot configuration
process.env.SNAPSHOT_STORAGE_TYPE = 'invalid-type'; // Invalid storage type
process.env.SNAPSHOT_STORAGE_PATH = '../../../etc/passwd'; // Path traversal attempt
process.env.SNAPSHOT_MAX_SNIPPETS = 'not-a-number'; // Invalid number
process.env.SNAPSHOT_IMAGE_QUALITY = '150'; // Out of range

console.log('✓ Invalid configuration set (should be caught by validation)');

// Import and run validation
const { validateEnvironmentVariables } = require('./dist/config/validateEnv');
console.log('\nRunning validation...\n');

try {
     validateEnvironmentVariables();
     console.log('\n❌ Validation should have failed but passed!\n');
     process.exit(1);
} catch (error) {
     if (error.message.includes('process.exit(1)')) {
          console.log('\n✅ Validation correctly caught errors and exited!\n');
          process.exit(0);
     } else {
          console.log('\n❌ Unexpected error:', error.message, '\n');
          process.exit(1);
     }
}
