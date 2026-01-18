# Redis Setup Tutorial - Step by Step

Complete tutorial for installing and configuring Redis for local development and production deployment.

## Table of Contents

- [Part 1: Local Development Setup](#part-1-local-development-setup)
- [Part 2: Production Setup](#part-2-production-setup)
- [Part 3: Application Configuration](#part-3-application-configuration)
- [Part 4: Verification](#part-4-verification)

---

# Part 1: Local Development Setup

## Windows Users (Recommended: Docker)

### Step 1: Install Docker Desktop

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop
   - Click "Download for Windows"
   - Run the installer (Docker Desktop Installer.exe)

2. **Install Docker:**
   - Follow the installation wizard
   - Accept the license agreement
   - Use WSL 2 (recommended when prompted)
   - Click "Install"
   - Restart your computer when prompted

3. **Verify Docker Installation:**
   ```bash
   # Open PowerShell or Command Prompt
   docker --version
   # Should show: Docker version 24.x.x
   ```

### Step 2: Run Redis Container

1. **Pull Redis Image:**
   ```bash
   docker pull redis:latest
   ```
   
   Expected output:
   ```
   latest: Pulling from library/redis
   Status: Downloaded newer image for redis:latest
   ```

2. **Run Redis Container:**
   ```bash
   docker run -d --name redis-dev -p 6379:6379 redis:latest
   ```
   
   Explanation:
   - `-d` = Run in background (detached mode)
   - `--name redis-dev` = Name the container "redis-dev"
   - `-p 6379:6379` = Map port 6379 (host:container)
   - `redis:latest` = Use latest Redis image

3. **Verify Redis is Running:**
   ```bash
   docker ps
   ```
   
   Expected output:
   ```
   CONTAINER ID   IMAGE          COMMAND                  STATUS         PORTS
   abc123def456   redis:latest   "docker-entrypoint.s…"   Up 2 minutes   0.0.0.0:6379->6379/tcp
   ```

4. **Test Redis Connection:**
   ```bash
   docker exec -it redis-dev redis-cli ping
   ```
   
   Expected output:
   ```
   PONG
   ```

### Step 3: Docker Management Commands

```bash
# Stop Redis
docker stop redis-dev

# Start Redis
docker start redis-dev

# Restart Redis
docker restart redis-dev

# View Redis logs
docker logs redis-dev

# View real-time logs
docker logs -f redis-dev

# Remove Redis container (if you want to start fresh)
docker rm -f redis-dev
```

### Step 4: Auto-Start Redis on Boot

**Option A: Docker Desktop Settings**
1. Open Docker Desktop
2. Go to Settings → General
3. Check "Start Docker Desktop when you log in"
4. Redis container will auto-start if you use `--restart always`:

```bash
# Remove old container
docker rm -f redis-dev

# Create new container with auto-restart
docker run -d --name redis-dev --restart always -p 6379:6379 redis:latest
```

---

## macOS Users

### Step 1: Install Homebrew (if not installed)

```bash
# Check if Homebrew is installed
brew --version

# If not installed, install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install Redis

```bash
# Update Homebrew
brew update

# Install Redis
brew install redis
```

Expected output:
```
==> Downloading redis...
==> Installing redis...
==> Summary
🍺  /usr/local/Cellar/redis/7.x.x: xxx files, xxMB
```

### Step 3: Start Redis

```bash
# Start Redis now
brew services start redis
```

Expected output:
```
==> Successfully started `redis` (label: homebrew.mxcl.redis)
```

### Step 4: Verify Redis is Running

```bash
# Test connection
redis-cli ping
```

Expected output:
```
PONG
```

### Step 5: Redis Management Commands

```bash
# Stop Redis
brew services stop redis

# Restart Redis
brew services restart redis

# Check Redis status
brew services list | grep redis

# View Redis info
redis-cli info server
```

### Step 6: Configuration File Location

```bash
# Redis config file location
/usr/local/etc/redis.conf

# Edit config (optional)
nano /usr/local/etc/redis.conf

# Restart after config changes
brew services restart redis
```

---

## Ubuntu/Debian Linux Users

### Step 1: Update Package List

```bash
sudo apt-get update
```

### Step 2: Install Redis

```bash
sudo apt-get install redis-server -y
```

Expected output:
```
Reading package lists... Done
Building dependency tree... Done
Setting up redis-server...
```

### Step 3: Configure Redis

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf
```

**Important settings to check:**
```conf
# Bind to localhost (security)
bind 127.0.0.1 ::1

# Port
port 6379

# Supervised by systemd
supervised systemd

# Max memory (optional, recommended)
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 4: Start Redis

```bash
# Start Redis
sudo systemctl start redis

# Enable auto-start on boot
sudo systemctl enable redis
```

Expected output:
```
Created symlink /etc/systemd/system/redis.service
```

### Step 5: Verify Redis is Running

```bash
# Check status
sudo systemctl status redis

# Test connection
redis-cli ping
```

Expected output:
```
● redis-server.service - Advanced key-value store
   Active: active (running)
   
PONG
```

### Step 6: Redis Management Commands

```bash
# Stop Redis
sudo systemctl stop redis

# Start Redis
sudo systemctl start redis

# Restart Redis
sudo systemctl restart redis

# Check status
sudo systemctl status redis

# View logs
sudo journalctl -u redis -f
```

---

# Part 2: Production Setup

## Option 1: Redis Cloud (Recommended - Free Tier Available)

### Step 1: Create Account

1. **Go to Redis Cloud:**
   - Visit: https://redis.com/try-free/
   - Click "Get Started Free"

2. **Sign Up:**
   - Enter email and password
   - Or sign up with Google/GitHub
   - Verify your email

### Step 2: Create Database

1. **Click "New Database"**

2. **Select Plan:**
   - Choose "Free" plan (30MB, perfect for small projects)
   - Or choose paid plan for production

3. **Configure Database:**
   - **Name:** `codetocontent-redis`
   - **Region:** Choose closest to your application server
   - **Cloud Provider:** AWS, GCP, or Azure
   - **Eviction Policy:** `allkeys-lru` (recommended)

4. **Click "Activate"**

### Step 3: Get Connection Details

1. **Go to Database Details:**
   - Click on your database name
   - Go to "Configuration" tab

2. **Copy Connection String:**
   ```
   Format: redis://default:password@host:port
   Example: redis://default:abc123xyz@redis-12345.cloud.redislabs.com:12345
   ```

3. **Save Credentials:**
   - **Host:** `redis-12345.cloud.redislabs.com`
   - **Port:** `12345`
   - **Password:** `abc123xyz`

### Step 4: Test Connection

```bash
# Install redis-cli locally (if not installed)
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-tools

# Test connection
redis-cli -h redis-12345.cloud.redislabs.com -p 12345 -a abc123xyz ping
```

Expected output:
```
PONG
```

### Step 5: Security Settings

1. **Enable TLS (Recommended):**
   - In Redis Cloud dashboard
   - Go to Security → TLS
   - Enable TLS/SSL
   - Update connection string to use `rediss://` (note the extra 's')

2. **Whitelist IPs (Optional):**
   - Go to Security → Access Control
   - Add your application server IPs
   - Or use "0.0.0.0/0" for development (not recommended for production)

---

## Option 2: AWS ElastiCache (For AWS Users)

### Step 1: Create ElastiCache Cluster

1. **Go to AWS Console:**
   - Navigate to ElastiCache service
   - Click "Create"

2. **Choose Redis:**
   - Select "Redis"
   - Click "Next"

3. **Configure Cluster:**
   - **Name:** `codetocontent-redis`
   - **Engine version:** Latest (7.x)
   - **Node type:** `cache.t3.micro` (free tier eligible)
   - **Number of replicas:** 0 (for development) or 1+ (for production)

4. **Network Settings:**
   - **VPC:** Same as your application
   - **Subnet group:** Create new or use existing
   - **Security group:** Create new or use existing

5. **Security Group Rules:**
   - **Type:** Custom TCP
   - **Port:** 6379
   - **Source:** Your application security group

6. **Click "Create"**

### Step 2: Get Connection Details

1. **Wait for cluster to be "Available"** (5-10 minutes)

2. **Copy Primary Endpoint:**
   ```
   Example: codetocontent-redis.abc123.0001.use1.cache.amazonaws.com:6379
   ```

3. **Connection String:**
   ```
   redis://codetocontent-redis.abc123.0001.use1.cache.amazonaws.com:6379
   ```

### Step 3: Test Connection (from EC2 instance)

```bash
# Install redis-cli
sudo yum install redis -y

# Test connection
redis-cli -h codetocontent-redis.abc123.0001.use1.cache.amazonaws.com -p 6379 ping
```

---

## Option 3: Self-Hosted Production Server

### Step 1: Install Redis on Production Server

**Ubuntu/Debian:**
```bash
# SSH into your server
ssh user@your-server.com

# Update packages
sudo apt-get update

# Install Redis
sudo apt-get install redis-server -y
```

### Step 2: Configure for Production

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf
```

**Production Settings:**
```conf
# Bind to all interfaces (if needed) or specific IP
bind 0.0.0.0

# Set password (IMPORTANT!)
requirepass your_strong_password_here

# Max memory
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence (save to disk)
save 900 1
save 300 10
save 60 10000

# AOF persistence (more durable)
appendonly yes
appendfilename "appendonly.aof"

# Log file
logfile /var/log/redis/redis-server.log

# Supervised by systemd
supervised systemd
```

### Step 3: Secure Redis

```bash
# Set strong password
sudo redis-cli
> CONFIG SET requirepass "your_strong_password_here"
> AUTH your_strong_password_here
> CONFIG REWRITE
> exit

# Restart Redis
sudo systemctl restart redis
```

### Step 4: Firewall Configuration

```bash
# Allow Redis port only from application server
sudo ufw allow from YOUR_APP_SERVER_IP to any port 6379

# Or use iptables
sudo iptables -A INPUT -p tcp -s YOUR_APP_SERVER_IP --dport 6379 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6379 -j DROP
```

### Step 5: Test Connection

```bash
# From application server
redis-cli -h your-redis-server.com -p 6379 -a your_strong_password_here ping
```

---

# Part 3: Application Configuration

## Step 1: Update Environment Variables

### Local Development (.env)

Your `backend/.env` file should have:

```bash
# Local Redis (Docker or native)
REDIS_URL=redis://localhost:6379

# Voice Engine Configuration
LEARNING_QUEUE_CONCURRENCY=5
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
LOG_LEVEL=info
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_LEARNING_LOGGING=true
```

### Production (.env.production)

Create `backend/.env.production`:

```bash
# Production Redis (Redis Cloud, ElastiCache, or self-hosted)
REDIS_URL=redis://default:your_password@redis-12345.cloud.redislabs.com:12345

# Or with TLS
REDIS_URL=rediss://default:your_password@redis-12345.cloud.redislabs.com:12345

# Or AWS ElastiCache
REDIS_URL=redis://codetocontent-redis.abc123.0001.use1.cache.amazonaws.com:6379

# Or self-hosted with password
REDIS_URL=redis://:your_password@your-redis-server.com:6379

# Production Voice Engine Configuration
LEARNING_QUEUE_CONCURRENCY=10              # More workers for production
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
LOG_LEVEL=warn                             # Less verbose in production
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_LEARNING_LOGGING=false              # Disable in production for performance
```

## Step 2: Environment-Specific Configuration

### Option A: Using Different .env Files

```bash
# Development
npm run dev:backend
# Uses .env

# Production
NODE_ENV=production npm start
# Uses .env.production
```

### Option B: Using Environment Variables (Recommended for Production)

**On your production server or cloud platform:**

```bash
# Set environment variables
export REDIS_URL="redis://default:password@host:port"
export LEARNING_QUEUE_CONCURRENCY=10
export NODE_ENV=production

# Or in your deployment platform (Heroku, Vercel, etc.)
# Set these in the platform's environment variables UI
```

## Step 3: Update package.json Scripts

Add production scripts to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "dev:worker": "nodemon src/worker.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:worker": "node dist/worker.js",
    "start:prod": "NODE_ENV=production node dist/index.js",
    "start:worker:prod": "NODE_ENV=production node dist/worker.js"
  }
}
```

## Step 4: Create Startup Script for Production

Create `backend/start-production.sh`:

```bash
#!/bin/bash

# Load production environment
export NODE_ENV=production

# Start main server in background
node dist/index.js &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Start worker process in background
node dist/worker.js &
WORKER_PID=$!
echo "Worker started with PID: $WORKER_PID"

# Save PIDs for later
echo $SERVER_PID > server.pid
echo $WORKER_PID > worker.pid

echo "Application started successfully!"
```

Make it executable:
```bash
chmod +x backend/start-production.sh
```

## Step 5: Create PM2 Configuration (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Create `backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'codetocontent-api',
      script: './dist/index.js',
      instances: 2,                    // Run 2 instances
      exec_mode: 'cluster',            // Cluster mode for load balancing
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'codetocontent-worker',
      script: './dist/worker.js',
      instances: 2,                    // Run 2 worker instances
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start with PM2:
```bash
# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

---

# Part 4: Verification

## Step 1: Test Local Setup

### 1. Start Redis (if not running)

**Docker:**
```bash
docker start redis-dev
```

**macOS:**
```bash
brew services start redis
```

**Linux:**
```bash
sudo systemctl start redis
```

### 2. Test Redis Connection

```bash
# Test ping
redis-cli ping
# Expected: PONG

# Or with Docker
docker exec -it redis-dev redis-cli ping
# Expected: PONG
```

### 3. Start Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start worker
cd backend
npm run dev:worker
```

### 4. Check Health Endpoint

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

### 5. Test Voice Engine

```bash
# Create a test profile (replace TOKEN with your JWT)
curl -X POST http://localhost:3001/api/profile/analyze-text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test writing sample. I love using emojis! 😊 My sentences are usually short and punchy. I prefer casual language over formal. Let me show you my style through this example.",
    "source": "manual"
  }'

# Check if profile was cached in Redis
redis-cli keys "profile:*"

# Check queue
redis-cli llen bull:learning:wait
```

## Step 2: Test Production Setup

### 1. Test Redis Connection

```bash
# Test connection to production Redis
redis-cli -h YOUR_REDIS_HOST -p YOUR_REDIS_PORT -a YOUR_PASSWORD ping
# Expected: PONG

# Or with URL
redis-cli -u redis://default:password@host:port ping
# Expected: PONG
```

### 2. Deploy Application

**Using PM2:**
```bash
# SSH into production server
ssh user@your-server.com

# Navigate to application
cd /path/to/codetocontent

# Pull latest code
git pull origin main

# Install dependencies
cd backend
npm install

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status
```

### 3. Verify Production Health

```bash
# Check health endpoint
curl https://your-domain.com/health

# Check Redis connection
redis-cli -h YOUR_REDIS_HOST -p YOUR_REDIS_PORT -a YOUR_PASSWORD info server

# Check queue
redis-cli -h YOUR_REDIS_HOST -p YOUR_REDIS_PORT -a YOUR_PASSWORD llen bull:learning:wait
```

### 4. Monitor Logs

```bash
# PM2 logs
pm2 logs

# Redis logs (if self-hosted)
sudo tail -f /var/log/redis/redis-server.log

# Application logs
tail -f logs/app.log
```

## Step 3: Performance Testing

### 1. Test Cache Performance

```bash
# Generate some content to populate cache
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/content/generate \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "analysisId": "YOUR_ANALYSIS_ID",
      "platform": "linkedin"
    }'
done

# Check cache hit rate
redis-cli get cache:hits
redis-cli get cache:misses

# Calculate hit rate
# Hit Rate = hits / (hits + misses)
```

### 2. Test Queue Processing

```bash
# Generate edits to create learning jobs
curl -X POST http://localhost:3001/api/content/CONTENT_ID/save-edits \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "editedText": "Edited version of the content..."
  }'

# Check queue length
redis-cli llen bull:learning:wait

# Wait a few seconds, check again (should decrease)
sleep 5
redis-cli llen bull:learning:wait

# Check completed jobs
redis-cli llen bull:learning:completed
```

### 3. Load Testing (Optional)

Install Apache Bench:
```bash
# macOS
brew install httpd

# Ubuntu
sudo apt-get install apache2-utils
```

Run load test:
```bash
# Test 100 requests with 10 concurrent
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/profile/style
```

---

## Troubleshooting Checklist

### ✅ Redis Not Connecting

- [ ] Is Redis running? (`redis-cli ping` or `docker ps`)
- [ ] Is port 6379 open? (`lsof -i :6379`)
- [ ] Is REDIS_URL correct in .env?
- [ ] Is firewall blocking connection?

### ✅ Queue Not Processing

- [ ] Is worker process running? (`ps aux | grep worker`)
- [ ] Are there jobs in queue? (`redis-cli llen bull:learning:wait`)
- [ ] Check worker logs for errors
- [ ] Restart worker process

### ✅ Cache Not Working

- [ ] Check cache keys exist (`redis-cli keys "profile:*"`)
- [ ] Check TTL values (`redis-cli ttl profile:USER_ID`)
- [ ] Verify cache service is initialized
- [ ] Check for Redis memory issues (`redis-cli info memory`)

### ✅ Production Issues

- [ ] Environment variables set correctly?
- [ ] Redis accessible from application server?
- [ ] Security groups/firewall configured?
- [ ] TLS/SSL configured if required?
- [ ] PM2 processes running? (`pm2 status`)

---

## Summary

### What You've Accomplished

✅ **Installed Redis** locally (Docker, native, or both)
✅ **Configured Redis** for production (Redis Cloud, ElastiCache, or self-hosted)
✅ **Updated .env files** with correct Redis URLs
✅ **Verified connections** with health checks
✅ **Tested Voice Engine** with cache and queue
✅ **Set up monitoring** for production

### Quick Reference

**Local Development:**
```bash
# Start Redis (Docker)
docker start redis-dev

# Start application
npm run dev:backend
npm run dev:worker

# Test
curl http://localhost:3001/health
```

**Production:**
```bash
# Deploy
git pull && npm install && npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 logs
pm2 monit
```

### Next Steps

- [ ] Read [REDIS_GUIDE.md](REDIS_GUIDE.md) for detailed Redis concepts
- [ ] Read [VOICE_ENGINE_QUICK_START.md](VOICE_ENGINE_QUICK_START.md) for usage
- [ ] Read [MONITORING.md](MONITORING.md) for production monitoring
- [ ] Set up alerts for queue backlog and Redis memory

---

**Need help?** Check [REDIS_GUIDE.md](REDIS_GUIDE.md) troubleshooting section or open a GitHub issue.

**Built with ❤️ for developers setting up the Voice Engine.**
