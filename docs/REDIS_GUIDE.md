# Redis Guide for Beginners

Complete guide to understanding and setting up Redis for the Voice Engine.

## Table of Contents

- [What is Redis?](#what-is-redis)
- [Why We Need Redis](#why-we-need-redis)
- [How Redis Works in This Application](#how-redis-works-in-this-application)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Testing & Verification](#testing--verification)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

---

## What is Redis?

### Simple Explanation

**Redis** = **RE**mote **DI**ctionary **S**erver

Think of Redis as a **super-fast notepad in your computer's memory** that multiple programs can read from and write to simultaneously.

### Key Concepts

1. **In-Memory Database**
   - Stores data in RAM (not on disk like MongoDB)
   - **Why?** RAM is 100x faster than disk
   - **Trade-off:** Data is temporary (unless you configure persistence)

2. **Key-Value Store**
   - Works like a JavaScript object or Python dictionary
   - Store data with a key, retrieve it with the same key
   ```
   Key: "user:123:profile"
   Value: { name: "John", age: 30 }
   ```

3. **Data Structures**
   - Strings: `"hello world"`
   - Lists: `["item1", "item2", "item3"]`
   - Sets: `{"unique", "values", "only"}`
   - Hashes: `{ field1: "value1", field2: "value2" }`
   - Sorted Sets: Items with scores for ranking

### Real-World Analogy

Imagine a library:
- **MongoDB** = The main library with all books (permanent storage)
- **Redis** = A small desk with frequently-used books (quick access)
- **Your App** = The librarian who checks the desk first before going to the main library

---

## Why We Need Redis

### Problem Without Redis

```
User requests profile → App queries MongoDB → Wait 50-100ms → Return data
User requests profile → App queries MongoDB → Wait 50-100ms → Return data
User requests profile → App queries MongoDB → Wait 50-100ms → Return data
```

**Issues:**
- Slow (50-100ms per request)
- MongoDB gets overloaded with repeated queries
- Expensive database operations

### Solution With Redis

```
User requests profile → App checks Redis → Found! → Return data (< 5ms)
User requests profile → App checks Redis → Found! → Return data (< 5ms)
User requests profile → App checks Redis → Not found → Query MongoDB → Store in Redis → Return data
```

**Benefits:**
- **Fast:** < 5ms response time (10-20x faster)
- **Reduced Load:** MongoDB handles fewer queries
- **Scalable:** Can handle thousands of requests per second

### Two Main Uses in Voice Engine

#### 1. **Caching** (Speed Up Reads)

Store frequently accessed data temporarily:

```javascript
// First request: Slow (MongoDB)
const profile = await User.findById(userId);
await redis.set(`profile:${userId}`, JSON.stringify(profile), 'EX', 3600); // Cache for 1 hour

// Subsequent requests: Fast (Redis)
const cached = await redis.get(`profile:${userId}`);
if (cached) {
  return JSON.parse(cached); // < 5ms
}
```

**What we cache:**
- User style profiles (1 hour)
- Evolution scores (5 minutes)
- Archetype lists (24 hours)

#### 2. **Job Queue** (Background Processing)

Manage asynchronous tasks:

```javascript
// User saves edit
await saveContent(editedText); // Immediate

// Queue learning job (background)
await learningQueue.add('process-edit', {
  userId,
  contentId,
  originalText,
  editedText
}); // Returns immediately

// Worker process picks up job later
// User doesn't wait!
```

**What we queue:**
- Learning jobs (analyze edits, update profiles)
- Style delta extraction
- Pattern detection

---

## How Redis Works in This Application

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                          │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  Main Server │         │    Worker    │                 │
│  │   (API)      │         │   Process    │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                         │                          │
│         │                         │                          │
│         ▼                         ▼                          │
│  ┌─────────────────────────────────────────┐               │
│  │              Redis                       │               │
│  │  ┌──────────────┐  ┌─────────────────┐ │               │
│  │  │    Cache     │  │   Job Queue     │ │               │
│  │  │              │  │                 │ │               │
│  │  │ profile:123  │  │ bull:learning:  │ │               │
│  │  │ profile:456  │  │   - job1        │ │               │
│  │  │ evolution:123│  │   - job2        │ │               │
│  │  └──────────────┘  └─────────────────┘ │               │
│  └─────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 1. Caching Implementation

**File:** `backend/src/services/CacheService.ts`

```typescript
class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Store profile in cache
  async setProfile(userId: string, profile: StyleProfile): Promise<void> {
    const key = `profile:${userId}`;
    const ttl = parseInt(process.env.PROFILE_CACHE_TTL_SECONDS || '3600', 10);
    
    await this.redis.setex(
      key,
      ttl,
      JSON.stringify(profile)
    );
  }

  // Get profile from cache
  async getProfile(userId: string): Promise<StyleProfile | null> {
    const key = `profile:${userId}`;
    const cached = await this.redis.get(key);
    
    return cached ? JSON.parse(cached) : null;
  }

  // Invalidate cache when profile updates
  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

**How it works:**

1. **User requests profile:**
   ```
   GET /api/profile/style
   ↓
   Check Redis: profile:123
   ↓
   Found? → Return (< 5ms)
   Not found? → Query MongoDB → Store in Redis → Return
   ```

2. **User updates profile:**
   ```
   PUT /api/profile/style
   ↓
   Update MongoDB
   ↓
   Delete from Redis (invalidate cache)
   ↓
   Next request will fetch fresh data
   ```

### 2. Job Queue Implementation

**File:** `backend/src/config/queue.ts`

```typescript
import Bull from 'bull';

// Create queue connected to Redis
export const learningQueue = new Bull('learning', {
  redis: {
    host: process.env.REDIS_URL?.split(':')[0] || 'localhost',
    port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379', 10)
  }
});
```

**File:** `backend/src/workers/learningWorker.ts`

```typescript
// Worker process listens for jobs
learningQueue.process('process-edit', CONCURRENCY, async (job) => {
  const { userId, originalText, editedText } = job.data;
  
  // 1. Extract style deltas
  const deltas = await extractStyleDeltas(originalText, editedText);
  
  // 2. Detect patterns
  const patterns = await detectPatterns(userId, deltas);
  
  // 3. Update profile
  await updateProfile(userId, patterns);
  
  // 4. Recalculate evolution score
  await recalculateEvolutionScore(userId);
});
```

**How it works:**

1. **User saves edited content:**
   ```
   POST /api/content/:id/save-edits
   ↓
   Save to MongoDB (immediate)
   ↓
   Add job to Redis queue (immediate)
   ↓
   Return success to user (< 100ms)
   ```

2. **Worker processes job (background):**
   ```
   Worker checks Redis queue
   ↓
   Job found? → Process it
   ↓
   Extract deltas → Detect patterns → Update profile
   ↓
   Mark job complete in Redis
   ```

### 3. Distributed Locks

**File:** `backend/src/services/AtomicProfileUpdateService.ts`

```typescript
// Prevent concurrent updates from corrupting profile
async function updateProfileWithLock(userId: string, updates: any) {
  const lock = await redlock.lock(`profile:lock:${userId}`, 5000);
  
  try {
    // Only one process can update at a time
    await updateProfile(userId, updates);
  } finally {
    await lock.unlock();
  }
}
```

**Why needed:**
- Multiple workers might try to update same profile
- Without locks: Race condition → corrupted data
- With locks: One at a time → safe updates

### Data Stored in Redis

**Cache Keys:**
```
profile:507f1f77bcf86cd799439011          # User profile (1 hour TTL)
evolution:507f1f77bcf86cd799439011        # Evolution score (5 min TTL)
archetypes:list                           # Archetype list (24 hour TTL)
cache:hits                                # Cache hit counter
cache:misses                              # Cache miss counter
```

**Queue Keys:**
```
bull:learning:wait                        # Pending jobs
bull:learning:active                      # Currently processing
bull:learning:completed                   # Finished jobs
bull:learning:failed                      # Failed jobs
bull:learning:id                          # Job ID counter
```

**Lock Keys:**
```
profile:lock:507f1f77bcf86cd799439011     # Distributed lock
```

---

## Installation Guide

### Option 1: Local Installation (Recommended for Development)

#### macOS

```bash
# Install using Homebrew
brew install redis

# Start Redis server
brew services start redis

# Verify it's running
redis-cli ping
# Should return: PONG
```

#### Ubuntu/Debian Linux

```bash
# Update package list
sudo apt-get update

# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis

# Enable auto-start on boot
sudo systemctl enable redis

# Verify it's running
redis-cli ping
# Should return: PONG
```

#### Windows

**Option A: WSL (Recommended)**
```bash
# Install WSL first, then follow Ubuntu instructions above
wsl --install
```

**Option B: Redis for Windows (Unofficial)**
```bash
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use Chocolatey:
choco install redis-64
```

### Option 2: Docker (Cross-Platform)

```bash
# Pull Redis image
docker pull redis:latest

# Run Redis container
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest

# Verify it's running
docker exec -it redis redis-cli ping
# Should return: PONG

# View logs
docker logs redis

# Stop Redis
docker stop redis

# Start Redis
docker start redis
```

### Option 3: Redis Cloud (Production)

**Free Tier:** 30MB storage, perfect for small projects

1. **Sign up:** https://redis.com/try-free/
2. **Create database:**
   - Click "New Database"
   - Select "Free" plan
   - Choose region closest to your app
3. **Get connection string:**
   - Format: `redis://username:password@host:port`
   - Example: `redis://default:abc123@redis-12345.cloud.redislabs.com:12345`
4. **Update `.env`:**
   ```bash
   REDIS_URL=redis://default:your_password@your-host.cloud.redislabs.com:12345
   ```

---

## Configuration

### 1. Update `.env` File

Your `.env` file already has the configuration (I added it earlier):

```bash
# Redis Configuration (Required for Voice Engine)
REDIS_URL=redis://localhost:6379

# Learning Queue Configuration
LEARNING_QUEUE_CONCURRENCY=5
LEARNING_RATE_LIMIT_MINUTES=5
EDIT_BATCH_WINDOW_MINUTES=5

# Cache Configuration
PROFILE_CACHE_TTL_SECONDS=3600
EVOLUTION_CACHE_TTL_SECONDS=300
ARCHETYPE_CACHE_TTL_SECONDS=86400
```

### 2. Redis Configuration File (Optional)

For advanced configuration, create `redis.conf`:

```bash
# /usr/local/etc/redis.conf (macOS)
# /etc/redis/redis.conf (Linux)

# Bind to localhost only (security)
bind 127.0.0.1

# Port
port 6379

# Max memory (prevent Redis from using all RAM)
maxmemory 256mb

# Eviction policy (remove old data when memory full)
maxmemory-policy allkeys-lru

# Persistence (save data to disk)
save 900 1      # Save after 900 seconds if 1 key changed
save 300 10     # Save after 300 seconds if 10 keys changed
save 60 10000   # Save after 60 seconds if 10000 keys changed

# Log level
loglevel notice

# Log file
logfile /var/log/redis/redis-server.log
```

**Apply configuration:**
```bash
# macOS
redis-server /usr/local/etc/redis.conf

# Linux
sudo systemctl restart redis

# Docker
docker run -d -p 6379:6379 -v /path/to/redis.conf:/usr/local/etc/redis/redis.conf redis redis-server /usr/local/etc/redis/redis.conf
```

---

## Testing & Verification

### 1. Check Redis is Running

```bash
# Test connection
redis-cli ping
# Expected: PONG

# Check Redis info
redis-cli info server
```

### 2. Test Basic Operations

```bash
# Open Redis CLI
redis-cli

# Set a value
SET test:key "Hello Redis"
# Expected: OK

# Get the value
GET test:key
# Expected: "Hello Redis"

# Set with expiration (10 seconds)
SETEX test:expire 10 "This will expire"

# Check time to live
TTL test:expire
# Expected: 9, 8, 7... (counting down)

# Delete a key
DEL test:key
# Expected: (integer) 1

# Exit CLI
exit
```

### 3. Test Application Connection

Create a test script: `backend/test-redis.js`

```javascript
const Redis = require('ioredis');

async function testRedis() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  try {
    // Test connection
    const pong = await redis.ping();
    console.log('✅ Redis connection:', pong);
    
    // Test set/get
    await redis.set('test:app', 'Connected!');
    const value = await redis.get('test:app');
    console.log('✅ Set/Get test:', value);
    
    // Test expiration
    await redis.setex('test:expire', 5, 'Expires in 5s');
    const ttl = await redis.ttl('test:expire');
    console.log('✅ Expiration test: TTL =', ttl, 'seconds');
    
    // Cleanup
    await redis.del('test:app', 'test:expire');
    console.log('✅ All tests passed!');
    
    await redis.quit();
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    process.exit(1);
  }
}

testRedis();
```

**Run test:**
```bash
cd backend
node test-redis.js
```

### 4. Test Voice Engine Integration

```bash
# Start your application
npm run dev:backend

# In another terminal, check health endpoint
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "redis": "connected",    # ← Should show "connected"
    "gemini": "available",
    "queue": "healthy"
  }
}
```

### 5. Monitor Redis Activity

```bash
# Watch commands in real-time
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys
redis-cli keys "*"

# Count keys
redis-cli dbsize

# Check queue length
redis-cli llen bull:learning:wait
```

---

## Common Commands

### Redis CLI Commands

```bash
# Connection
redis-cli                    # Connect to local Redis
redis-cli -h host -p port    # Connect to remote Redis
redis-cli -u redis://url     # Connect using URL

# Keys
KEYS *                       # List all keys (don't use in production!)
KEYS profile:*               # List keys matching pattern
SCAN 0 MATCH profile:*       # Safer way to list keys
EXISTS key                   # Check if key exists
DEL key                      # Delete key
TTL key                      # Time to live (seconds)
EXPIRE key 3600              # Set expiration (1 hour)

# Strings
SET key value                # Set value
GET key                      # Get value
SETEX key 60 value          # Set with expiration
INCR counter                 # Increment number
DECR counter                 # Decrement number

# Lists (for queues)
LPUSH list value             # Add to left
RPUSH list value             # Add to right
LPOP list                    # Remove from left
RPOP list                    # Remove from right
LLEN list                    # List length
LRANGE list 0 -1            # Get all items

# Server
INFO                         # Server information
DBSIZE                       # Number of keys
FLUSHDB                      # Delete all keys (careful!)
SAVE                         # Save to disk
SHUTDOWN                     # Stop Redis server
```

### Application Commands

```bash
# Check queue status
redis-cli llen bull:learning:wait        # Pending jobs
redis-cli llen bull:learning:active      # Processing jobs
redis-cli llen bull:learning:completed   # Finished jobs
redis-cli llen bull:learning:failed      # Failed jobs

# Check cache
redis-cli keys "profile:*"               # All cached profiles
redis-cli get "profile:507f1f77bcf86cd799439011"  # Specific profile
redis-cli ttl "profile:507f1f77bcf86cd799439011"  # Time until expiration

# Clear cache
redis-cli del "profile:507f1f77bcf86cd799439011"  # Single profile
redis-cli keys "profile:*" | xargs redis-cli del  # All profiles

# Monitor performance
redis-cli --stat                         # Real-time stats
redis-cli --latency                      # Latency monitoring
```

---

## Troubleshooting

### Problem: "Connection refused"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**

1. **Check if Redis is running:**
```bash
redis-cli ping
# If error, Redis is not running
```

2. **Start Redis:**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker start redis
```

3. **Check port:**
```bash
# See what's using port 6379
lsof -i :6379

# If nothing, Redis isn't running
# If something else, change port in .env
```

### Problem: "Out of memory"

**Error:**
```
OOM command not allowed when used memory > 'maxmemory'
```

**Solutions:**

1. **Increase max memory:**
```bash
redis-cli config set maxmemory 512mb
```

2. **Set eviction policy:**
```bash
redis-cli config set maxmemory-policy allkeys-lru
```

3. **Clear old data:**
```bash
redis-cli flushdb
```

### Problem: "Too many connections"

**Error:**
```
Error: Maximum number of clients reached
```

**Solutions:**

1. **Increase max clients:**
```bash
redis-cli config set maxclients 10000
```

2. **Check for connection leaks:**
```bash
redis-cli info clients
```

3. **Restart application:**
```bash
# Kill all node processes
pkill -f node

# Restart
npm run dev:backend
```

### Problem: Queue not processing

**Symptoms:**
- Jobs piling up in queue
- Profile not updating

**Solutions:**

1. **Check worker is running:**
```bash
ps aux | grep worker
```

2. **Start worker if not running:**
```bash
cd backend
npm run worker
```

3. **Check for stuck jobs:**
```bash
redis-cli llen bull:learning:active
# If > 0 for long time, jobs are stuck
```

4. **Clear stuck jobs:**
```bash
redis-cli del bull:learning:active
```

### Problem: Cache not working

**Symptoms:**
- Slow profile retrieval
- High MongoDB load

**Solutions:**

1. **Check cache hit rate:**
```bash
redis-cli get cache:hits
redis-cli get cache:misses
```

2. **Check TTL:**
```bash
redis-cli ttl profile:507f1f77bcf86cd799439011
# If -2, key doesn't exist
# If -1, key has no expiration
# If > 0, seconds until expiration
```

3. **Verify cache is being set:**
```bash
redis-cli monitor | grep profile
# Should see SET commands
```

---

## Best Practices

### Development

1. **Use local Redis** for development
2. **Monitor queue length** during testing
3. **Clear cache** when testing profile updates
4. **Check logs** for Redis errors

### Production

1. **Use managed Redis** (Redis Cloud, AWS ElastiCache)
2. **Enable persistence** (save to disk)
3. **Set max memory** to prevent OOM
4. **Monitor metrics** (memory, connections, latency)
5. **Set up alerts** for queue backlog
6. **Use Redis Cluster** for high availability

### Security

1. **Bind to localhost** in development
2. **Use password** in production:
```bash
redis-cli config set requirepass your_password
REDIS_URL=redis://:your_password@localhost:6379
```
3. **Use TLS** for remote connections
4. **Firewall rules** to restrict access

---

## Summary

### What You Learned

✅ **Redis is a fast in-memory database** used for caching and job queues
✅ **Caching speeds up reads** by 10-20x (< 5ms vs 50-100ms)
✅ **Job queues enable background processing** without blocking users
✅ **Installation is simple** (brew/apt/docker)
✅ **Configuration is in `.env`** file
✅ **Testing is straightforward** with `redis-cli`

### Quick Start Checklist

- [ ] Install Redis (`brew install redis` or `docker run redis`)
- [ ] Start Redis (`brew services start redis`)
- [ ] Test connection (`redis-cli ping`)
- [ ] Verify `.env` has `REDIS_URL=redis://localhost:6379`
- [ ] Start application (`npm run dev:backend`)
- [ ] Start worker (`cd backend && npm run worker`)
- [ ] Test health endpoint (`curl http://localhost:3001/health`)
- [ ] Generate content and save edits to test learning

### Next Steps

- Read [VOICE_ENGINE_QUICK_START.md](VOICE_ENGINE_QUICK_START.md) for Voice Engine usage
- Read [MONITORING.md](MONITORING.md) for production monitoring
- Check [README.md](README.md) for full application documentation

---

**Need help?** Open a GitHub issue or check the troubleshooting section above.

**Built with ❤️ for developers learning Redis and the Voice Engine.**
