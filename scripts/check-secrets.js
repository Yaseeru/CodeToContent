#!/usr/bin/env node

/**
 * Pre-commit hook to prevent accidental credential exposure
 * Only scans files that are staged for commit
 */

const { execSync } = require('child_process');

const SENSITIVE_PATTERNS = [
     { name: 'MongoDB URI with credentials', pattern: /mongodb\+srv:\/\/[^:]+:[^@]+@/g },
     { name: 'Redis URL with password', pattern: /redis:\/\/[^:]*:[^@]+@/g },
     { name: 'Google API Key', pattern: /AIzaSy[a-zA-Z0-9_-]{33}/g },
     { name: 'GitHub Token', pattern: /gh[ops]_[a-zA-Z0-9]{36}/g },
     { name: 'JWT Secret (long)', pattern: /JWT_SECRET\s*=\s*[a-f0-9]{64,}/gi },
];

function checkGitTrackedEnvFiles() {
     try {
          const output = execSync('git ls-files', { encoding: 'utf8' });
          const trackedFiles = output.split('\n');
          const envFiles = trackedFiles.filter(f =>
               f.match(/\.env$|\.env\.production$|\.env\.local$|\.env\.development$/) &&
               !f.includes('.env.example')
          );

          return envFiles;
     } catch (error) {
          return [];
     }
}

function checkStagedFiles() {
     try {
          const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
          const stagedFiles = output.split('\n').filter(f => f.trim());

          const findings = [];

          stagedFiles.forEach(file => {
               if (!file) return;

               try {
                    const content = execSync(`git show :${file}`, { encoding: 'utf8' });

                    SENSITIVE_PATTERNS.forEach(({ name, pattern }) => {
                         const matches = content.match(pattern);
                         if (matches) {
                              findings.push({
                                   file,
                                   type: name,
                                   matches: matches.length,
                              });
                         }
                    });
               } catch (error) {
                    // File might be deleted or binary
               }
          });

          return findings;
     } catch (error) {
          return [];
     }
}

console.log('🔍 Scanning for exposed secrets...\n');

// Check for tracked .env files
const trackedEnvFiles = checkGitTrackedEnvFiles();
if (trackedEnvFiles.length > 0) {
     console.error('❌ CRITICAL: .env files found in git!');
     console.error('These files should NEVER be committed:\n');
     trackedEnvFiles.forEach(f => console.error(`  - ${f}`));
     console.error('\nRun: git rm --cached <file>');
     process.exit(1);
}

// Check staged files for secrets
const findings = checkStagedFiles();

if (findings.length > 0) {
     console.error('❌ POTENTIAL SECRETS IN STAGED FILES:\n');
     findings.forEach(({ file, type, matches }) => {
          console.error(`  ${file}`);
          console.error(`    Type: ${type}`);
          console.error(`    Matches: ${matches}\n`);
     });
     console.error('⚠️  Review these files before committing!');
     console.error('⚠️  If these are example patterns, add file to exclusion list');
     process.exit(1);
}

console.log('✅ No exposed secrets detected');
console.log('✅ No .env files tracked in git');
console.log('\n🔒 Safe to commit\n');
