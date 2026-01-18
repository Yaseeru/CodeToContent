# Voice Engine Monitoring & Operations Guide

Comprehensive guide for monitoring, troubleshooting, and maintaining the Voice Engine in production.

## Table of Contents

- [Health Checks](#health-checks)
- [Key Metrics](#key-metrics)
- [Alerts & Thresholds](#alerts--thresholds)
- [Dashboard Setup](#dashboard-setup)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)
- [Incident Response](#incident-response)

## Health Checks

### System Health Endpoint

**Endpoint:** `GET /health`

**Response:**
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
    "queueLength": 23,
    "activeWorkers": 5,
    "cacheHitRate": 0.87
  }
}
```

**Status Codes:**
- `200 OK` - All systems operational
- `503 Service Unavailable` - One or more critical services down

### Component Health Checks

#### MongoDB Health
```bash
# Check connection
mongosh --eval "db.adminCommand('ping')"

# Check replica set status
mongosh --eval "rs.status()"

# Check database size
mongosh --eval "db.stats()"
```

#### Redis Health
```bash
# Check connection
redis-cli ping
# Expected: PONG

# Check memory usage
redis-cli info memory

# Check connected clients
redis-cli info clients

# Check queue keys
redis-cli keys "bull:learning:*"
```

#### Worker Process Health
```bash
# Check if worker is running
ps aux | grep "node.*worker.js"

# Check worker logs
tail -f logs/worker.log

# Check worker CPU/memory
top -p $(pgrep -f "node.*worker.js")
```

#### Gemini API Health
```bash
# Test API connectivity
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-3.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

## Key Metrics

### Learning Queue Metrics

**Queue Length**
- **What:** Number of pending learning jobs
- **Target:** < 100 jobs
- **Warning:** > 500 jobs
- **Critical:** > 1000 jobs
- **Query:**
```javascript
const queueLength = await learningQueue.count();
```

**Processing Time**
- **What:** Average time to process a learning job
- **Target:** < 15 seconds
- **Warning:** > 30 seconds
- **Critical:** > 60 seconds
- **Query:**
```javascript
const jobs = await learningQueue.getCompleted(100);
const avgTime = jobs.reduce((sum, job) => 
  sum + (job.finishedOn - job.processedOn), 0) / jobs.length;
```

**Job Failure Rate**
- **What:** Percentage of jobs that fail after all retries
- **Target:** < 1%
- **Warning:** > 5%
- **Critical:** > 10%
- **Query:**
```javascript
const failed = await learningQueue.getFailed();
const completed = await learningQueue.getCompleted();
const failureRate = failed.length / (failed.length + completed.length);
```

### Cache Metrics

**Cache Hit Rate**
- **What:** Percentage of profile requests served from cache
- **Target:** > 80%
- **Warning:** < 60%
- **Critical:** < 40%
- **Query:**
```javascript
const hits = await redis.get('cache:hits');
const misses = await redis.get('cache:misses');
const hitRate = hits / (hits + misses);
```

**Cache Memory Usage**
- **What:** Redis memory consumption
- **Target:** < 80% of allocated memory
- **Warning:** > 90%
- **Critical:** > 95%
- **Query:**
```bash
redis-cli info memory | grep used_memory_human
```

### Profile Metrics

**Profile Creation Rate**
- **What:** New profiles created per hour
- **Target:** Varies by user growth
- **Query:**
```javascript
const count = await User.countDocuments({
  'styleProfile.lastUpdated': {
    $gte: new Date(Date.now() - 3600000)
  }
});
```

**Average Evolution Score**
- **What:** Mean evolution score across all users
- **Target:** > 50%
- **Query:**
```javascript
const users = await User.find({ 'styleProfile': { $exists: true } });
const scores = await Promise.all(
  users.map(u => calculateEvolutionScore(u.id))
);
const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
```

**Learning Iterations Distribution**
- **What:** Distribution of learning iterations across users
- **Query:**
```javascript
const distribution = await User.aggregate([
  { $match: { 'styleProfile': { $exists: true } } },
  { $group: {
    _id: {
      $switch: {
        branches: [
          { case: { $lt: ['$styleProfile.learningIterations', 5] }, then: '0-4' },
          { case: { $lt: ['$styleProfile.learningIterations', 10] }, then: '5-9' },
          { case: { $lt: ['$styleProfile.learningIterations', 20] }, then: '10-19' },
          { case: { $gte: ['$styleProfile.learningIterations', 20] }, then: '20+' }
        ]
      }
    },
    count: { $sum: 1 }
  }}
]);
```

### Content Generation Metrics

**Voice-Aware Generation Rate**
- **What:** Percentage of content generated with voice profiles
- **Target:** Increases over time as users onboard
- **Query:**
```javascript
const total = await Content.countDocuments();
const voiceAware = await Content.countDocuments({ usedStyleProfile: true });
const rate = voiceAware / total;
```

**Generation Latency**
- **What:** Time to generate content (with profile)
- **Target:** < 3 seconds
- **Warning:** > 5 seconds
- **Critical:** > 10 seconds
- **Query:**
```javascript
// Track in application logs
logger.info('Content generated', {
  duration: Date.now() - startTime,
  usedProfile: true
});
```

### Gemini API Metrics

**API Call Volume**
- **What:** Number of Gemini API calls per hour
- **Target:** Within quota limits
- **Query:**
```javascript
const calls = await redis.get('gemini:calls:hour');
```

**Token Usage**
- **What:** Total tokens consumed per hour
- **Target:** Within budget
- **Query:**
```javascript
// Track in application
logger.info('Gemini API call', {
  inputTokens: response.usageMetadata.promptTokenCount,
  outputTokens: response.usageMetadata.candidatesTokenCount
});
```

**API Error Rate**
- **What:** Percentage of Gemini API calls that fail
- **Target:** < 1%
- **Warning:** > 5%
- **Critical:** > 10%
- **Query:**
```javascript
const errors = await redis.get('gemini:errors:hour');
const total = await redis.get('gemini:calls:hour');
const errorRate = errors / total;
```

## Alerts & Thresholds

### Critical Alerts (Page Immediately)

**Redis Down**
```yaml
alert: RedisDown
expr: redis_up == 0
for: 1m
severity: critical
message: "Redis is down - Voice Engine will fail"
```

**MongoDB Down**
```yaml
alert: MongoDBDown
expr: mongodb_up == 0
for: 1m
severity: critical
message: "MongoDB is down - Application will fail"
```

**Worker Process Crashed**
```yaml
alert: WorkerProcessDown
expr: worker_process_up == 0
for: 2m
severity: critical
message: "Worker process is down - Learning jobs not processing"
```

**Queue Backlog Critical**
```yaml
alert: QueueBacklogCritical
expr: learning_queue_length > 1000
for: 5m
severity: critical
message: "Learning queue has >1000 jobs - investigate immediately"
```

### Warning Alerts (Investigate Soon)

**High Queue Length**
```yaml
alert: HighQueueLength
expr: learning_queue_length > 500
for: 10m
severity: warning
message: "Learning queue growing - may need more workers"
```

**Slow Job Processing**
```yaml
alert: SlowJobProcessing
expr: avg_job_processing_time > 30
for: 5m
severity: warning
message: "Learning jobs taking >30s - investigate performance"
```

**Low Cache Hit Rate**
```yaml
alert: LowCacheHitRate
expr: cache_hit_rate < 0.6
for: 15m
severity: warning
message: "Cache hit rate <60% - check Redis or TTL settings"
```

**High Gemini Error Rate**
```yaml
alert: HighGeminiErrorRate
expr: gemini_error_rate > 0.05
for: 5m
severity: warning
message: "Gemini API error rate >5% - check API status"
```

**High Redis Memory**
```yaml
alert: HighRedisMemory
expr: redis_memory_usage > 0.9
for: 10m
severity: warning
message: "Redis memory >90% - may need to increase limit or reduce TTL"
```

### Info Alerts (Monitor Trends)

**Profile Creation Spike**
```yaml
alert: ProfileCreationSpike
expr: rate(profile_creations[1h]) > 100
for: 30m
severity: info
message: "Unusual spike in profile creations - monitor for abuse"
```

**Low Evolution Scores**
```yaml
alert: LowEvolutionScores
expr: avg_evolution_score < 40
for: 1h
severity: info
message: "Average evolution score <40% - users may need guidance"
```

## Dashboard Setup

### Grafana Dashboard (Recommended)

**Panels to Include:**

1. **System Health Overview**
   - MongoDB status (green/red)
   - Redis status (green/red)
   - Worker status (green/red)
   - Gemini API status (green/red)

2. **Learning Queue**
   - Queue length (line chart, last 24h)
   - Processing time (line chart, last 24h)
   - Job failure rate (line chart, last 24h)
   - Jobs processed per hour (bar chart)

3. **Cache Performance**
   - Hit rate (gauge, 0-100%)
   - Memory usage (gauge, 0-100%)
   - Keys count (number)
   - Evictions per hour (line chart)

4. **Profile Metrics**
   - Total profiles (number)
   - Average evolution score (gauge, 0-100%)
   - Learning iterations distribution (pie chart)
   - Profile creations per hour (line chart)

5. **Content Generation**
   - Voice-aware generation rate (gauge, 0-100%)
   - Generation latency (line chart, p50/p95/p99)
   - Generations per hour (line chart)
   - Platform distribution (pie chart)

6. **Gemini API**
   - API calls per hour (line chart)
   - Token usage per hour (line chart)
   - Error rate (line chart)
   - Latency (line chart, p50/p95/p99)

### Example Prometheus Queries

```promql
# Queue length
learning_queue_length

# Average processing time
rate(learning_job_duration_seconds_sum[5m]) / rate(learning_job_duration_seconds_count[5m])

# Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# Profile creation rate
rate(profile_creations_total[1h])

# Gemini error rate
rate(gemini_errors_total[5m]) / rate(gemini_calls_total[5m])
```

### Custom Monitoring Script

```javascript
// monitor.js - Run every 5 minutes via cron
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');

async function collectMetrics() {
  const mongo = await MongoClient.connect(process.env.MONGODB_URI);
  const redis = new Redis(process.env.REDIS_URL);
  
  const metrics = {
    timestamp: new Date(),
    
    // Queue metrics
    queueLength: await redis.llen('bull:learning:wait'),
    activeJobs: await redis.llen('bull:learning:active'),
    
    // Profile metrics
    totalProfiles: await mongo.db().collection('users')
      .countDocuments({ 'styleProfile': { $exists: true } }),
    
    // Cache metrics
    cacheKeys: await redis.dbsize(),
    cacheMemory: await redis.info('memory'),
    
    // Content metrics
    voiceAwareContent: await mongo.db().collection('contents')
      .countDocuments({ usedStyleProfile: true })
  };
  
  // Send to monitoring service (Datadog, CloudWatch, etc.)
  await sendMetrics(metrics);
  
  await mongo.close();
  await redis.quit();
}

collectMetrics().catch(console.error);
```

## Troubleshooting

### Queue Backlog Growing

**Symptoms:**
- Queue length increasing over time
- Learning jobs taking longer to process
- Users not seeing profile updates

**Diagnosis:**
```bash
# Check queue length
redis-cli llen bull:learning:wait

# Check active jobs
redis-cli llen bull:learning:active

# Check failed jobs
redis-cli llen bull:learning:failed

# Check worker process
ps aux | grep worker
```

**Solutions:**
1. **Scale workers horizontally:**
```bash
# Start additional worker processes
node dist/worker.js &
node dist/worker.js &
```

2. **Increase concurrency:**
```bash
# In .env
LEARNING_QUEUE_CONCURRENCY=10
```

3. **Check for stuck jobs:**
```javascript
const stuck = await learningQueue.getActive();
stuck.forEach(job => {
  if (Date.now() - job.processedOn > 60000) {
    job.moveToFailed({ message: 'Stuck job' });
  }
});
```

### Low Cache Hit Rate

**Symptoms:**
- Cache hit rate < 60%
- Slow profile retrieval
- High MongoDB load

**Diagnosis:**
```bash
# Check cache stats
redis-cli info stats

# Check TTL distribution
redis-cli --scan --pattern "profile:*" | xargs -L 1 redis-cli ttl

# Check eviction policy
redis-cli config get maxmemory-policy
```

**Solutions:**
1. **Increase cache TTL:**
```bash
# In .env
PROFILE_CACHE_TTL_SECONDS=7200  # 2 hours
```

2. **Increase Redis memory:**
```bash
redis-cli config set maxmemory 512mb
```

3. **Check invalidation logic:**
```javascript
// Ensure cache is invalidated only when necessary
await cacheService.invalidate(`profile:${userId}`);
```

### Slow Job Processing

**Symptoms:**
- Average processing time > 30s
- Queue backlog growing
- Worker CPU at 100%

**Diagnosis:**
```bash
# Check worker CPU/memory
top -p $(pgrep -f worker)

# Check Gemini API latency
tail -f logs/worker.log | grep "Gemini API"

# Check MongoDB query performance
mongosh --eval "db.contents.find({userId: ObjectId('...')}).explain('executionStats')"
```

**Solutions:**
1. **Optimize database queries:**
```javascript
// Add indexes
await Content.collection.createIndex({ userId: 1, createdAt: -1 });
await User.collection.createIndex({ _id: 1, 'styleProfile.lastUpdated': 1 });
```

2. **Reduce Gemini API calls:**
```javascript
// Skip tone detection if not critical
if (changePercentage < 0.3) {
  toneShift = 'no significant change';
} else {
  toneShift = await detectToneShift(original, edited);
}
```

3. **Batch processing:**
```javascript
// Process multiple edits together
const batchedEdits = await getBatchedEdits(userId);
const aggregatedDelta = aggregateDeltas(batchedEdits);
```

### Gemini API Errors

**Symptoms:**
- High Gemini error rate
- Content generation failures
- 503 errors in logs

**Diagnosis:**
```bash
# Check Gemini API status
curl https://generativelanguage.googleapis.com/v1/models

# Check error logs
tail -f logs/app.log | grep "Gemini"

# Check rate limits
redis-cli get gemini:calls:hour
```

**Solutions:**
1. **Implement exponential backoff:**
```javascript
async function callGeminiWithRetry(prompt, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await gemini.generateContent(prompt);
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

2. **Check API quota:**
```bash
# View quota usage in Google Cloud Console
gcloud alpha services quota list --service=generativelanguage.googleapis.com
```

3. **Implement circuit breaker:**
```javascript
const breaker = new CircuitBreaker(callGemini, {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
```

### Profile Corruption

**Symptoms:**
- User reports poor content quality
- Evolution score decreasing
- Inconsistent profile data

**Diagnosis:**
```javascript
// Check profile validity
const user = await User.findById(userId);
const profile = user.styleProfile;

// Validate ranges
if (profile.tone.formality < 1 || profile.tone.formality > 10) {
  console.error('Invalid tone metric');
}

// Check for null values
if (!profile.voiceType || !profile.vocabularyLevel) {
  console.error('Missing required fields');
}
```

**Solutions:**
1. **Rollback to previous version:**
```javascript
await rollbackProfile(userId, -1);  // Last version
```

2. **Reset profile:**
```javascript
await resetProfile(userId);
```

3. **Manual correction:**
```javascript
await User.updateOne(
  { _id: userId },
  { $set: { 'styleProfile.tone.formality': 5 } }
);
```

## Performance Tuning

### Database Optimization

**Indexes:**
```javascript
// User collection
db.users.createIndex({ _id: 1, 'styleProfile.lastUpdated': 1 });
db.users.createIndex({ 'styleProfile.learningIterations': 1 });

// Content collection
db.contents.createIndex({ userId: 1, createdAt: -1 });
db.contents.createIndex({ userId: 1, 'editMetadata.learningProcessed': 1 });

// LearningJob collection
db.learningjobs.createIndex({ userId: 1, status: 1 });
db.learningjobs.createIndex({ status: 1, priority: -1, createdAt: 1 });
```

**Query Optimization:**
```javascript
// Use lean() for read-only queries
const profiles = await User.find({ 'styleProfile': { $exists: true } })
  .select('styleProfile')
  .lean();

// Use projection to limit fields
const users = await User.find()
  .select('_id username styleProfile.evolutionScore')
  .limit(100);
```

### Redis Optimization

**Memory Management:**
```bash
# Set eviction policy
redis-cli config set maxmemory-policy allkeys-lru

# Set max memory
redis-cli config set maxmemory 1gb

# Enable compression
redis-cli config set list-compress-depth 1
```

**Connection Pooling:**
```javascript
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
});
```

### Worker Optimization

**Concurrency Tuning:**
```javascript
// Adjust based on CPU cores and workload
const concurrency = Math.max(1, os.cpus().length - 1);

learningQueue.process('process-edit', concurrency, async (job) => {
  // Process job
});
```

**Job Prioritization:**
```javascript
// Higher priority for recent edits
const priority = Date.now() - editTimestamp < 3600000 ? 1 : 2;

await learningQueue.add('process-edit', data, { priority });
```

## Incident Response

### Runbook: Redis Outage

**Impact:** Voice Engine unavailable, content generation falls back to tone-based

**Steps:**
1. **Verify outage:**
```bash
redis-cli ping
```

2. **Check Redis logs:**
```bash
tail -f /var/log/redis/redis-server.log
```

3. **Restart Redis:**
```bash
sudo systemctl restart redis
```

4. **Verify recovery:**
```bash
redis-cli ping
curl http://localhost:3001/health
```

5. **Monitor queue:**
```bash
redis-cli llen bull:learning:wait
```

**Estimated Recovery Time:** 5-10 minutes

### Runbook: Worker Process Crash

**Impact:** Learning jobs not processing, queue backlog growing

**Steps:**
1. **Verify crash:**
```bash
ps aux | grep worker
```

2. **Check logs:**
```bash
tail -f logs/worker.log
```

3. **Restart worker:**
```bash
cd backend
npm run worker
```

4. **Verify recovery:**
```bash
ps aux | grep worker
redis-cli llen bull:learning:active
```

5. **Monitor processing:**
```bash
watch -n 5 'redis-cli llen bull:learning:wait'
```

**Estimated Recovery Time:** 2-5 minutes

### Runbook: Queue Backlog Critical

**Impact:** Profile updates delayed, users not seeing improvements

**Steps:**
1. **Assess backlog:**
```bash
redis-cli llen bull:learning:wait
```

2. **Check worker health:**
```bash
ps aux | grep worker
top -p $(pgrep -f worker)
```

3. **Scale workers:**
```bash
# Start 3 additional workers
for i in {1..3}; do
  node dist/worker.js &
done
```

4. **Monitor progress:**
```bash
watch -n 10 'redis-cli llen bull:learning:wait'
```

5. **Investigate root cause:**
```javascript
const failed = await learningQueue.getFailed();
console.log(failed.map(j => j.failedReason));
```

**Estimated Recovery Time:** 30-60 minutes

---

## Summary

Effective monitoring of the Voice Engine requires:

1. **Proactive monitoring** of queue, cache, and API metrics
2. **Alerting** on critical thresholds
3. **Dashboard** for real-time visibility
4. **Runbooks** for common incidents
5. **Performance tuning** based on observed patterns

Regular review of metrics and logs will help identify issues before they impact users.

**For support, see [README.md](README.md) or open a GitHub issue.**
