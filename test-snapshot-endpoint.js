/**
 * Test script to diagnose snapshot generation issues
 * Run with: node test-snapshot-endpoint.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// INSTRUCTIONS:
// 1. Log in to the app and get your JWT token from localStorage
// 2. Replace YOUR_JWT_TOKEN below with your actual token
// 3. Replace YOUR_REPOSITORY_ID with an actual repository ID from your account
// 4. Run: node test-snapshot-endpoint.js

const JWT_TOKEN = 'YOUR_JWT_TOKEN'; // Get from browser localStorage
const REPOSITORY_ID = 'YOUR_REPOSITORY_ID'; // Get from your repositories list

async function testSnapshotGeneration() {
     console.log('🧪 Testing Snapshot Generation Endpoint\n');

     try {
          console.log('📤 Sending POST request to /api/snapshots/generate');
          console.log('   Repository ID:', REPOSITORY_ID);
          console.log('   JWT Token:', JWT_TOKEN.substring(0, 20) + '...\n');

          const response = await axios.post(
               `${API_URL}/snapshots/generate`,
               { repositoryId: REPOSITORY_ID },
               {
                    headers: {
                         'Authorization': `Bearer ${JWT_TOKEN}`,
                         'Content-Type': 'application/json'
                    }
               }
          );

          console.log('✅ SUCCESS!');
          console.log('   Status:', response.status);
          console.log('   Snapshots generated:', response.data.count);
          console.log('   Response:', JSON.stringify(response.data, null, 2));

     } catch (error) {
          console.log('❌ ERROR!');

          if (error.response) {
               // Server responded with error
               console.log('   Status:', error.response.status);
               console.log('   Error:', error.response.data.error);
               console.log('   Message:', error.response.data.message);
               console.log('   Full response:', JSON.stringify(error.response.data, null, 2));

               // Provide specific guidance
               if (error.response.status === 401) {
                    console.log('\n💡 SOLUTION: You need to log in. Your JWT token is invalid or expired.');
                    console.log('   1. Open the app in your browser');
                    console.log('   2. Log in with GitHub');
                    console.log('   3. Open DevTools (F12) → Console');
                    console.log('   4. Run: localStorage.getItem("jwt")');
                    console.log('   5. Copy the token and update JWT_TOKEN in this script');
               } else if (error.response.status === 404) {
                    console.log('\n💡 SOLUTION: Repository not found.');
                    console.log('   1. Make sure you\'ve added this repository to your account');
                    console.log('   2. Check that the REPOSITORY_ID is correct');
                    console.log('   3. Go to Dashboard → Repositories to see your repository IDs');
               } else if (error.response.status === 400) {
                    console.log('\n💡 SOLUTION: Repository needs to be analyzed first.');
                    console.log('   1. Go to your repository in the app');
                    console.log('   2. Click "Analyze Repository" button');
                    console.log('   3. Wait for analysis to complete');
                    console.log('   4. Then try generating snapshots');
               } else if (error.response.status === 503) {
                    console.log('\n💡 SOLUTION: Service temporarily unavailable.');
                    console.log('   This could be:');
                    console.log('   - Gemini AI API is down or rate limited');
                    console.log('   - Puppeteer failed to initialize');
                    console.log('   - Check backend logs for more details');
               }

          } else if (error.request) {
               // Request made but no response
               console.log('   No response from server');
               console.log('   Make sure backend is running on port 3001');
               console.log('\n💡 SOLUTION: Start the backend server');
               console.log('   Run: npm run dev:backend');

          } else {
               // Something else went wrong
               console.log('   Error:', error.message);
          }
     }
}

// Check if tokens are set
if (JWT_TOKEN === 'YOUR_JWT_TOKEN' || REPOSITORY_ID === 'YOUR_REPOSITORY_ID') {
     console.log('⚠️  Please update the JWT_TOKEN and REPOSITORY_ID in this script first!\n');
     console.log('How to get your JWT token:');
     console.log('1. Open the app in your browser (http://localhost:3000)');
     console.log('2. Log in with GitHub');
     console.log('3. Open DevTools (F12) → Console tab');
     console.log('4. Run: localStorage.getItem("jwt")');
     console.log('5. Copy the token value\n');
     console.log('How to get a repository ID:');
     console.log('1. Go to Dashboard → Repositories');
     console.log('2. Open DevTools (F12) → Network tab');
     console.log('3. Click on a repository');
     console.log('4. Look at the API requests to see the repository ID');
     process.exit(1);
}

testSnapshotGeneration();
