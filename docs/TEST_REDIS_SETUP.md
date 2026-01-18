# Testing Your Redis Setup - Local & Production

Complete guide to test your Redis configuration for both local development and production.

## Your Redis Configuration

### Local Redis (Development)
- **URL:** `redis://localhost:6379`
- **Host:** `localhost`
- **Port:** `6379`
- **Password:** None (local development)

### Production Redis (Redis Cloud)
- **URL:** `redis://default:yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD@redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com:17713`
- **Host:** `redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com`
- **Port:** `17713`
- **Password:** `yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD`

---

## Step 1: Test Local Redis

### 1.1 Check if Local Redis is Running

**If using Docker:**
```bash
docker ps | grep redis
```

Expected output:
```
CONTAINER ID   IMAGE          STATUS         PORTS
abc123def456   redis:latest   Up 5 minutes   0.0.0.0:6379->6379/tcp
```

**If not running, start it:**
```bash
docker start redis-dev

# Or if container doesn't exist, create it:
docker run -d --name redis-dev --restart always -p 6379:6379 redis:latest
```

### 1.2 Test Local Connection

```bash
# Test with redis-cli
redis-cli ping
```

Expected output:
```
PONG
```

**If you get "command not found", test with Docker:**
```bash
docker exec -it redis-dev redis-cli ping
```

Expected output:
```
PONG
```

### 1.3 Test Basic Operations

```bash
# Using Docker
docker exec -it redis-dev redis-cli

# Or if redis-cli is installed locally
redis-cli
```

Inside Redis CLI:
```redis
# Set a test value
SET test:local "Hello from local Redis"

# Get the value
GET test:local

# Should return: "Hello from local Redis"

# Check it expires in 60 seconds
SETEX test:expire 60 "This expires"

# Check time to live
TTL test:expire

# Should return: 59, 58, 57... (counting down)

# Exit
exit
```

✅ **Local Redis is working if all commands succeed!**

---

## Step 2: Test Production Redis (Redis Cloud)

### 2.1 Test Connection from Your Computer

```bash
# Test connection with redis-cli
redis-cli -h redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com -p 17713 -a yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD ping
```

Expected output:
```
PONG
```

**Alternative: Using connection URL**
```bash
redis-cli -u redis://default:yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD@redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com:17713 ping
```

Expected output:
```
PONG
```

### 2.2 Test Basic Operations on Production

```bash
# Connect to production Redis
redis-cli -h redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com -p 17713 -a yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD
```

Inside Redis CLI:
```redis
# Set a test value
SET test:production "Hello from Redis Cloud"

# Get the value
GET test:production

# Should return: "Hello from Redis Cloud"

# Check database info
INFO server

# Check memory usage
INFO memory

# Exit
exit
```

✅ **Production Redis is working if all commands succeed!**

---

## Step 3: Configure Application for Both Environments

### 3.1 Update Local .env File

Your `backend/.env` should already have local Redis configured. Let's verify:

```bash
# Check current configuration
cat backend/.env | grep REDIS
```

Should show:
```
REDIS_URL=redis://localhost:6379
```

✅ **This is correct for local development!**

### 3.2 Create Production .env File

Create `backend/.env.production` with production Redis:

```bash
# MongoDB Configuration (your production MongoDB)
MONGODB_URI=mongodb+srv://admin-abdulhamid:admin-abdulhamid@cluster0.o1kpu.mongodb.net/CodeToContent?retryWrites=true&w=majority&appName=Cluster0

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=Ov23li5n87sCwD3AFWyj
GITHUB_CLIENT_SECRET=3999e60aa63c243d598310a9302cb82bc4af05aa
GITHUB_CALLBACK_URL=https://your-production-domain.com/api/auth/callback

# JWT Configuration
JWT_SECRET=c29550f5ba24201aa5d423581af326ab66f6dfcbf454e0ab94b98831711bcb143696ae4a6031c9db838f85234c61a3a5fdca53e43d8178ab367716c6158ab2cb

# Gemini API Configuration
GEMINI_API_KEY=AIzaSyBQzXGDfHWSkh9C8xa6hzFL9_JYAHytCmI

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://your-production-domain.com

# ============================================
# Production Redis Configuration (Redis Cloud)
# ============================================
REDIS_URL=redis://default:yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD@redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com:17713

# Voice Engine Configuration
LEARNING_QUEUE_CONCURRENCY=10
LEARNING_RATE_LIMIT_MINUTES=5
EDIT_BATCH_WINDOW_MINUTES=5
PROFILE_CACHE_TTL_SECONDS=3600
EVOLUTION_CACHE_TTL_SECONDS=300
ARCHETYPE_CACHE_TTL_SECONDS=86400
MAX_EDIT_METADATA_PER_USER=50
MAX_PROFILE_VERSIONS=10
MIN_TEXT_LENGTH_CHARS=300
MIN_FILE_LENGTH_CHARS=500
GEMINI_TEMPERATURE=0.8
GEMINI_MAX_TOKENS=8000
GEMINI_RETRY_ATTEMPTS=3
GEMINI_RETRY_DELAY_MS=2000
PATTERN_THRESHOLD_SENTENCE_LENGTH=3
PATTERN_THRESHOLD_EMOJI=3
PATTERN_THRESHOLD_STRUCTURE=3
PATTERN_THRESHOLD_COMMON_PHRASE=3
PATTERN_THRESHOLD_BANNED_PHRASE=2
PATTERN_THRESHOLD_MAJOR_CHANGE=5
LOG_LEVEL=warn
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_LEARNING_LOGGING=false
```

---

## Step 4: Test Application with Local Redis

### 4.1 Start Local Redis

```bash
# Make sure local Redis is running
docker ps | grep redis

# If not running:
docker start redis-dev
```

### 4.2 Start Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev
```

Wait for:
```
Server running on port 3001
MongoDB connected
Redis connected
```

```bash
# Terminal 2: Start worker
cd backend
npm run dev:worker
```

Wait for:
```
Worker started
Redis connected
Processing jobs with concurrency: 5
```

### 4.3 Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "gemini": "available",
    "queue": "healthy"
  },
  "metrics": {
    "queueLength": 0,
    "activeWorkers": 5,
    "cacheHitRate": 0
  }
}
```

✅ **Look for `"redis": "connected"`** - This means local Redis is working!

### 4.4 Test Cache Functionality

```bash
# Check Redis keys (should be empty initially)
docker exec -it redis-dev redis-cli keys "*"

# Generate some content to populate cache (replace TOKEN with your JWT)
curl -X POST http://localhost:3001/api/content/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "YOUR_ANALYSIS_ID",
    "platform": "linkedin"
  }'

# Check Redis keys again (should see profile keys)
docker exec -it redis-dev redis-cli keys "*"
```

Expected output:
```
1) "profile:507f1f77bcf86cd799439011"
2) "cache:hits"
3) "cache:misses"
```

### 4.5 Test Queue Functionality

```bash
# Check queue (should be empty)
docker exec -it redis-dev redis-cli llen bull:learning:wait

# Save an edit to trigger learning job
curl -X POST http://localhost:3001/api/content/CONTENT_ID/save-edits \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "editedText": "This is my edited version with my personal style!"
  }'

# Check queue immediately (should have 1 job)
docker exec -it redis-dev redis-cli llen bull:learning:wait

# Wait 5 seconds and check again (should be 0 - job processed)
sleep 5
docker exec -it redis-dev redis-cli llen bull:learning:wait

# Check completed jobs
docker exec -it redis-dev redis-cli llen bull:learning:completed
```

✅ **If queue goes from 1 to 0, the worker is processing jobs correctly!**

---

## Step 5: Test Application with Production Redis

### 5.1 Create Test Script

Create `backend/test-production-redis.js`:

```javascript
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
```

### 5.2 Run Production Test

```bash
cd backend
node test-production-redis.js
```

Expected output:
```
🔍 Testing Production Redis Connection...

📍 Redis URL: redis://default:****@redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com:17713

Test 1: Ping...
✅ Ping response: PONG

Test 2: Set/Get...
✅ Set/Get test: Connected from application!

Test 3: Expiration...
✅ Expiration test: TTL = 9 seconds

Test 4: Server Info...
✅ Redis version: 7.2.4

Test 5: Memory Info...
✅ Used memory: 1.23M

🎉 All tests passed! Production Redis is working correctly!
```

✅ **If you see this output, production Redis is configured correctly!**

---

## Step 6: Test Switching Between Environments

### 6.1 Test Local Environment

```bash
# Make sure .env uses local Redis
cat backend/.env | grep REDIS_URL
# Should show: REDIS_URL=redis://localhost:6379

# Start application
npm run dev

# Check health
curl http://localhost:3001/health | grep redis
# Should show: "redis": "connected"
```

### 6.2 Test Production Environment (Locally)

```bash
# Temporarily use production Redis locally
cd backend

# Copy production env
cp .env.production .env.test

# Start with production Redis
NODE_ENV=production node -r dotenv/config dist/index.js dotenv_config_path=.env.production
```

**Note:** This tests if your app can connect to production Redis, but you should deploy to production server for real testing.

---

## Step 7: Verify Both Configurations

### 7.1 Create Verification Script

Create `backend/verify-redis-setup.js`:

```javascript
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
```

### 7.2 Run Verification

```bash
cd backend
node verify-redis-setup.js
```

Expected output:
```
🔍 Verifying Redis Setup...

📍 Testing LOCAL Redis (localhost:6379)...
✅ Local Redis: CONNECTED

📍 Testing PRODUCTION Redis (Redis Cloud)...
✅ Production Redis: CONNECTED

✅ Verification complete!
```

---

## Step 8: Monitor Redis Activity

### 8.1 Monitor Local Redis

```bash
# Watch commands in real-time
docker exec -it redis-dev redis-cli monitor

# In another terminal, use your app
# You'll see all Redis commands in the monitor window
```

### 8.2 Monitor Production Redis

```bash
# Connect to production Redis
redis-cli -h redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com -p 17713 -a yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD

# Inside Redis CLI
MONITOR

# You'll see all commands from your production app
```

### 8.3 Check Redis Cloud Dashboard

1. Go to: https://app.redislabs.com/
2. Click on your database: `codetocontent-redis`
3. View metrics:
   - Operations per second
   - Memory usage
   - Connected clients
   - Hit rate

---

## Troubleshooting

### Problem: Local Redis "Connection Refused"

**Solution:**
```bash
# Check if Docker container is running
docker ps | grep redis

# If not running, start it
docker start redis-dev

# If container doesn't exist, create it
docker run -d --name redis-dev --restart always -p 6379:6379 redis:latest
```

### Problem: Production Redis "Connection Timeout"

**Solution:**
1. **Check IP Whitelist in Redis Cloud:**
   - Go to Redis Cloud dashboard
   - Click on your database
   - Go to "Security" → "Access Control"
   - Add your IP address or use `0.0.0.0/0` for testing (not recommended for production)

2. **Verify connection string:**
   ```bash
   # Test with redis-cli
   redis-cli -u redis://default:yRBSAlIly3Oyn1ABLHS5lZe877sAMPXD@redis-17713.c13.us-east-1-3.ec2.cloud.redislabs.com:17713 ping
   ```

### Problem: "WRONGPASS invalid username-password pair"

**Solution:**
- Password is incorrect
- Get correct password from Redis Cloud dashboard
- Update `.env.production` file

### Problem: Application shows "redis": "disconnected"

**Solution:**
```bash
# Check REDIS_URL in .env
cat backend/.env | grep REDIS_URL

# Should be: redis://localhost:6379 for local
# Should be: redis://default:password@host:port for production

# Restart application
npm run dev
```

---

## Summary Checklist

### ✅ Local Redis Setup
- [ ] Docker container running (`docker ps | grep redis`)
- [ ] Can ping Redis (`docker exec -it redis-dev redis-cli ping`)
- [ ] `.env` has `REDIS_URL=redis://localhost:6379`
- [ ] Application connects (`curl http://localhost:3001/health`)
- [ ] Cache works (keys appear in Redis)
- [ ] Queue works (jobs processed)

### ✅ Production Redis Setup
- [ ] Redis Cloud database created
- [ ] Can ping from computer (`redis-cli -u ... ping`)
- [ ] `.env.production` has correct connection string
- [ ] Test script passes (`node test-production-redis.js`)
- [ ] IP whitelisted in Redis Cloud (if needed)

### ✅ Application Configuration
- [ ] `backend/.env` configured for local
- [ ] `backend/.env.production` configured for production
- [ ] Both environments tested
- [ ] Verification script passes

---

## Next Steps

1. ✅ **Local development:** Use `.env` with local Redis
2. ✅ **Production deployment:** Use `.env.production` with Redis Cloud
3. 📊 **Monitor:** Check Redis Cloud dashboard regularly
4. 🚀 **Deploy:** Follow deployment guide in [DEPLOYMENT.md](DEPLOYMENT.md)

**Your Redis setup is complete!** 🎉
