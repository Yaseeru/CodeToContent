# Worker Process Information

## What is the Worker Process?

The **worker process** is a background service that handles asynchronous learning jobs for the Voice Engine. It runs separately from the main API server to ensure that learning operations don't block user requests.

## What Does It Do?

The worker process:
1. **Monitors the Redis job queue** for new learning jobs
2. **Processes edit analysis** when users save edited content
3. **Extracts style deltas** (differences between original and edited content)
4. **Detects patterns** across multiple edits
5. **Updates user profiles** incrementally based on learning
6. **Recalculates evolution scores** after profile updates

## Automatic Startup ✅

**Good news!** The worker process now starts automatically when you run:

```bash
npm run dev
```

This will start **3 processes simultaneously**:
- **BACKEND** (blue) - Main API server on port 3001
- **WORKER** (yellow) - Learning job processor
- **FRONTEND** (green) - React app on port 3000

## Terminal Output

When you run `npm run dev`, you'll see color-coded output:

```
[BACKEND] Backend server running on port 3001
[BACKEND] MongoDB connected successfully
[BACKEND] [Cache] Redis connected successfully

[WORKER] Worker started
[WORKER] Redis connected
[WORKER] Processing jobs with concurrency: 5

[FRONTEND] VITE v5.4.21 ready in 745 ms
[FRONTEND] ➜  Local:   http://localhost:3000/
```

## How to Identify Worker Activity

Look for these log messages from the **WORKER** process:

### When a Learning Job is Queued:
```
[BACKEND] [Learning] Job queued for user 696cae8efd3758d987acdcb8
```

### When Worker Processes the Job:
```
[WORKER] [Learning] Processing job 12345
[WORKER] [Learning] Extracting style deltas...
[WORKER] [Learning] Detected patterns: sentence length change
[WORKER] [Learning] Updating profile for user 696cae8efd3758d987acdcb8
[WORKER] [Learning] Profile updated successfully
[WORKER] [Learning] Evolution score: 45% → 52%
```

### When Job Completes:
```
[WORKER] [Learning] Job 12345 completed in 2.3s
```

## Manual Control (If Needed)

If you want to run processes separately:

### Development:
```bash
# Terminal 1: Backend only
npm run dev:backend

# Terminal 2: Worker only
npm run dev:worker

# Terminal 3: Frontend only
npm run dev:frontend
```

### Production:
```bash
# Start both backend and worker
npm start

# Or separately:
npm run start:backend
npm run start:worker
```

## Monitoring Worker Activity

### Check Queue Length
```bash
# See pending jobs
docker exec -it redis-dev redis-cli llen bull:learning:wait

# See active jobs
docker exec -it redis-dev redis-cli llen bull:learning:active

# See completed jobs
docker exec -it redis-dev redis-cli llen bull:learning:completed

# See failed jobs
docker exec -it redis-dev redis-cli llen bull:learning:failed
```

### Watch Redis Activity
```bash
# Monitor all Redis commands in real-time
docker exec -it redis-dev redis-cli monitor
```

### Check Worker Health
```bash
# Health endpoint includes queue status
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "gemini": "available",
    "queue": "healthy"
  },
  "metrics": {
    "queueLength": 0,
    "activeWorkers": 5,
    "cacheHitRate": 0.87
  }
}
```

## Troubleshooting

### Worker Not Processing Jobs

**Symptoms:**
- Queue length keeps growing
- No worker logs appearing
- Profile not updating after edits

**Solutions:**

1. **Check if worker is running:**
   ```bash
   # Look for WORKER logs in terminal
   # Should see: [WORKER] Worker started
   ```

2. **Check Redis connection:**
   ```bash
   docker ps | findstr redis
   # Should show redis-dev container running
   ```

3. **Restart application:**
   ```bash
   # Stop with Ctrl+C
   # Start again
   npm run dev
   ```

4. **Check for errors:**
   - Look for red error messages in WORKER logs
   - Check if Redis is accessible
   - Verify REDIS_URL in .env

### Queue Backlog Growing

**Symptoms:**
- Queue length > 100 jobs
- Worker processing slowly

**Solutions:**

1. **Check worker concurrency:**
   ```bash
   # In backend/.env
   LEARNING_QUEUE_CONCURRENCY=5  # Increase to 10 for more throughput
   ```

2. **Check for stuck jobs:**
   ```bash
   # Clear active jobs if stuck
   docker exec -it redis-dev redis-cli del bull:learning:active
   ```

3. **Monitor processing time:**
   - Worker logs show processing time per job
   - Should be < 30 seconds per job
   - If slower, check Gemini API latency

## Performance Expectations

### Normal Operation:
- **Queue length:** 0-10 jobs
- **Processing time:** 5-30 seconds per job
- **Concurrency:** 5 workers (development), 10 (production)
- **Throughput:** 10-20 jobs per minute

### Under Load:
- **Queue length:** 10-100 jobs
- **Processing time:** May increase to 30-60 seconds
- **Auto-scaling:** Consider increasing concurrency

## Configuration

### Environment Variables

In `backend/.env`:

```bash
# Worker Configuration
LEARNING_QUEUE_CONCURRENCY=5          # Number of concurrent workers
LEARNING_RATE_LIMIT_MINUTES=5         # Minutes between profile updates
EDIT_BATCH_WINDOW_MINUTES=5           # Minutes to batch rapid edits

# Pattern Detection Thresholds
PATTERN_THRESHOLD_SENTENCE_LENGTH=3   # Edits needed to detect pattern
PATTERN_THRESHOLD_EMOJI=3
PATTERN_THRESHOLD_STRUCTURE=3
PATTERN_THRESHOLD_COMMON_PHRASE=3
PATTERN_THRESHOLD_BANNED_PHRASE=2
PATTERN_THRESHOLD_MAJOR_CHANGE=5
```

### Adjusting Concurrency

**Low traffic (development):**
```bash
LEARNING_QUEUE_CONCURRENCY=5
```

**Medium traffic:**
```bash
LEARNING_QUEUE_CONCURRENCY=10
```

**High traffic (production):**
```bash
LEARNING_QUEUE_CONCURRENCY=20
```

## Production Deployment

### Using PM2 (Recommended)

Create `backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'codetocontent-api',
      script: './dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'codetocontent-worker',
      script: './dist/worker.js',
      instances: 2,
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
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - redis
      - mongodb

  worker:
    build: .
    command: node dist/worker.js
    environment:
      - NODE_ENV=production
    depends_on:
      - redis
      - mongodb

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
```

## Summary

✅ **Worker starts automatically** with `npm run dev`
✅ **Color-coded logs** for easy identification
✅ **Processes learning jobs** in background
✅ **Updates profiles** based on user edits
✅ **Monitors queue** for new jobs
✅ **Scales with concurrency** settings

**No manual intervention needed!** Just run `npm run dev` and everything works! 🚀

---

For more information:
- [REDIS_GUIDE.md](REDIS_GUIDE.md) - Redis basics
- [LEARNING_ALGORITHM.md](LEARNING_ALGORITHM.md) - How learning works
- [MONITORING.md](MONITORING.md) - Production monitoring
