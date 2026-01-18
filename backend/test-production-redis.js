require('dotenv').config({ path: '.env.production' });
const Redis = require('ioredis');

async function testProductionRedis() {
     console.log('🔍 Testing Production Redis Connection...\n');

     const redisUrl = process.env.REDIS_URL;
     console.log('📍 Redis URL:', redisUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

     const redis = new Redis(redisUrl);

     try {
          // Test 1: Ping
          console.log('Test 1: Ping...');
          const pong = await redis.ping();
          console.log('✅ Ping response:', pong);

          // Test 2: Set/Get
          console.log('\nTest 2: Set/Get...');
          await redis.set('test:production:app', 'Connected from application!');
          const value = await redis.get('test:production:app');
          console.log('✅ Set/Get test:', value);

          // Test 3: Expiration
          console.log('\nTest 3: Expiration...');
          await redis.setex('test:production:expire', 10, 'Expires in 10s');
          const ttl = await redis.ttl('test:production:expire');
          console.log('✅ Expiration test: TTL =', ttl, 'seconds');

          // Test 4: Server Info
          console.log('\nTest 4: Server Info...');
          const info = await redis.info('server');
          const version = info.match(/redis_version:([^\r\n]+)/)[1];
          console.log('✅ Redis version:', version);

          // Test 5: Memory Info
          console.log('\nTest 5: Memory Info...');
          const memInfo = await redis.info('memory');
          const usedMemory = memInfo.match(/used_memory_human:([^\r\n]+)/)[1];
          console.log('✅ Used memory:', usedMemory);

          // Cleanup
          await redis.del('test:production:app', 'test:production:expire');

          console.log('\n🎉 All tests passed! Production Redis is working correctly!');

          await redis.quit();
          process.exit(0);
     } catch (error) {
          console.error('\n❌ Production Redis test failed:', error.message);
          console.error('\nTroubleshooting:');
          console.error('1. Check if REDIS_URL is correct in .env.production');
          console.error('2. Verify Redis Cloud database is active');
          console.error('3. Check if your IP is whitelisted in Redis Cloud');
          console.error('4. Ensure password is correct');
          process.exit(1);
     }
}

testProductionRedis();
