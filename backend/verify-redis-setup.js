const Redis = require('ioredis');

async function verifySetup() {
     console.log('🔍 Verifying Redis Setup...\n');

     // Test Local Redis
     console.log('📍 Testing LOCAL Redis (localhost:6379)...');
     const localRedis = new Redis('redis://localhost:6379');

     try {
          await localRedis.ping();
          console.log('✅ Local Redis: CONNECTED\n');
          await localRedis.quit();
     } catch (error) {
          console.log('❌ Local Redis: FAILED -', error.message);
          console.log('   Make sure Docker container is running: docker start redis-dev\n');
     }

     // Test Production Redis
     console.log('📍 Testing PRODUCTION Redis (Redis Cloud)...');
     const prodRedis = new Redis('redis://default:yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD@redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com:17713');

     try {
          await prodRedis.ping();
          console.log('✅ Production Redis: CONNECTED\n');
          await prodRedis.quit();
     } catch (error) {
          console.log('❌ Production Redis: FAILED -', error.message);
          console.log('   Check Redis Cloud dashboard and IP whitelist\n');
     }

     console.log('✅ Verification complete!');
     process.exit(0);
}

verifySetup();
