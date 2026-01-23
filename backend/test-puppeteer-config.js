/**
 * Test script for Puppeteer executable path configuration
 * Tests that custom Puppeteer paths are properly validated
 */

console.log('\n=== Testing Puppeteer Configuration ===\n');

// Set required environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SNAPSHOT_STORAGE_TYPE = 'local';

// Test 1: Valid custom Puppeteer path
console.log('Test 1: Valid custom Puppeteer path');
process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium-browser';

try {
     const { validateEnvironmentVariables } = require('./dist/config/validateEnv');
     validateEnvironmentVariables();
     console.log('✅ Valid Puppeteer path accepted\n');
} catch (error) {
     console.log('❌ Valid Puppeteer path rejected:', error.message, '\n');
     process.exit(1);
}

// Test 2: Empty Puppeteer path (should fail)
console.log('Test 2: Empty Puppeteer path (should fail)');
delete require.cache[require.resolve('./dist/config/validateEnv')];
process.env.PUPPETEER_EXECUTABLE_PATH = '   ';

try {
     const { validateEnvironmentVariables } = require('./dist/config/validateEnv');
     validateEnvironmentVariables();
     console.log('❌ Empty Puppeteer path should have been rejected\n');
     process.exit(1);
} catch (error) {
     if (error.message.includes('process.exit(1)')) {
          console.log('✅ Empty Puppeteer path correctly rejected\n');
     } else {
          console.log('❌ Unexpected error:', error.message, '\n');
          process.exit(1);
     }
}

// Test 3: No Puppeteer path (should pass - it's optional)
console.log('Test 3: No Puppeteer path (optional, should pass)');
delete require.cache[require.resolve('./dist/config/validateEnv')];
delete process.env.PUPPETEER_EXECUTABLE_PATH;

try {
     const { validateEnvironmentVariables } = require('./dist/config/validateEnv');
     validateEnvironmentVariables();
     console.log('✅ No Puppeteer path accepted (optional)\n');
} catch (error) {
     console.log('❌ Should accept missing Puppeteer path:', error.message, '\n');
     process.exit(1);
}

console.log('='.repeat(50));
console.log('✅ All Puppeteer configuration tests passed!');
console.log('='.repeat(50) + '\n');
