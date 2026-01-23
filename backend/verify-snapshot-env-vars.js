/**
 * Verification script to ensure all SNAPSHOT_* variables are documented in .env.example
 * and match the validation in validateEnv.ts
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Verifying Snapshot Environment Variables ===\n');

// Read .env.example
const envExamplePath = path.join(__dirname, '.env.example');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

// Read validateEnv.ts
const validateEnvPath = path.join(__dirname, 'src/config/validateEnv.ts');
const validateEnvContent = fs.readFileSync(validateEnvPath, 'utf-8');

// Read snapshotConfig.ts
const snapshotConfigPath = path.join(__dirname, 'src/config/snapshotConfig.ts');
const snapshotConfigContent = fs.readFileSync(snapshotConfigPath, 'utf-8');

// Extract SNAPSHOT_* variables from .env.example
const envExampleVars = [];
const envExampleLines = envExampleContent.split('\n');
envExampleLines.forEach(line => {
     const match = line.match(/^(SNAPSHOT_[A-Z_]+)=/);
     if (match) {
          envExampleVars.push(match[1]);
     }
});

// Extract SNAPSHOT_* variables from snapshotConfig.ts
const snapshotConfigVars = [];
const configMatches = snapshotConfigContent.matchAll(/process\.env\.(SNAPSHOT_[A-Z_]+)/g);
for (const match of configMatches) {
     if (!snapshotConfigVars.includes(match[1])) {
          snapshotConfigVars.push(match[1]);
     }
}

// Extract SNAPSHOT_* variables from validateEnv.ts
const validateEnvVars = [];
const validateMatches = validateEnvContent.matchAll(/process\.env\.(SNAPSHOT_[A-Z_]+)/g);
for (const match of validateMatches) {
     if (!validateEnvVars.includes(match[1])) {
          validateEnvVars.push(match[1]);
     }
}

// Also check for AWS_* variables when S3 is used
const awsVars = ['AWS_S3_BUCKET', 'AWS_S3_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
const envExampleAwsVars = [];
envExampleLines.forEach(line => {
     const match = line.match(/^(AWS_[A-Z_0-9]+)=/);
     if (match && awsVars.includes(match[1])) {
          envExampleAwsVars.push(match[1]);
     }
});

// Check PUPPETEER_EXECUTABLE_PATH
const hasPuppeteerInExample = envExampleContent.includes('PUPPETEER_EXECUTABLE_PATH=');
const hasPuppeteerInValidation = validateEnvContent.includes('PUPPETEER_EXECUTABLE_PATH');

console.log('📋 Variables in .env.example:');
envExampleVars.sort().forEach(v => console.log(`   ✓ ${v}`));

console.log('\n📋 Variables in snapshotConfig.ts:');
snapshotConfigVars.sort().forEach(v => console.log(`   ✓ ${v}`));

console.log('\n📋 Variables validated in validateEnv.ts:');
validateEnvVars.sort().forEach(v => console.log(`   ✓ ${v}`));

console.log('\n📋 AWS S3 variables in .env.example:');
envExampleAwsVars.sort().forEach(v => console.log(`   ✓ ${v}`));

console.log('\n📋 Puppeteer configuration:');
console.log(`   ${hasPuppeteerInExample ? '✓' : '✗'} PUPPETEER_EXECUTABLE_PATH in .env.example`);
console.log(`   ${hasPuppeteerInValidation ? '✓' : '✗'} PUPPETEER_EXECUTABLE_PATH validated`);

// Check for missing variables
console.log('\n🔍 Cross-reference check:');

const missingInExample = snapshotConfigVars.filter(v => !envExampleVars.includes(v));
if (missingInExample.length > 0) {
     console.log('\n❌ Variables in snapshotConfig.ts but missing in .env.example:');
     missingInExample.forEach(v => console.log(`   ✗ ${v}`));
} else {
     console.log('   ✓ All snapshotConfig.ts variables are in .env.example');
}

const missingInValidation = snapshotConfigVars.filter(v => !validateEnvVars.includes(v));
if (missingInValidation.length > 0) {
     console.log('\n⚠️  Variables in snapshotConfig.ts but not validated in validateEnv.ts:');
     missingInValidation.forEach(v => console.log(`   ! ${v}`));
} else {
     console.log('   ✓ All snapshotConfig.ts variables are validated');
}

const missingAwsInExample = awsVars.filter(v => !envExampleAwsVars.includes(v));
if (missingAwsInExample.length > 0) {
     console.log('\n❌ Required AWS variables missing in .env.example:');
     missingAwsInExample.forEach(v => console.log(`   ✗ ${v}`));
} else {
     console.log('   ✓ All required AWS S3 variables are in .env.example');
}

// Summary
console.log('\n' + '='.repeat(50));
if (missingInExample.length === 0 && missingAwsInExample.length === 0 && hasPuppeteerInExample && hasPuppeteerInValidation) {
     console.log('✅ All snapshot environment variables are properly documented and validated!');
     console.log('='.repeat(50) + '\n');
     process.exit(0);
} else {
     console.log('❌ Some issues found - please review the output above');
     console.log('='.repeat(50) + '\n');
     process.exit(1);
}
