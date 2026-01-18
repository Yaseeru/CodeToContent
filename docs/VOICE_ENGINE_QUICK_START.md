# Voice Engine Quick Start Guide

Get started with the Personalized Voice Engine in 5 minutes.

## What is the Voice Engine?

The Voice Engine learns your unique writing style and generates content that sounds authentically like you. It learns from:
1. **Writing samples** you provide (optional)
2. **Voice archetypes** you choose (optional)
3. **Edits you make** to AI-generated content (automatic)

## Setup (First Time)

### 1. Install Redis

**macOS:**
```bash
brew install redis
redis-server
```

**Ubuntu:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

### 2. Update Environment Variables

Add to `backend/.env`:
```bash
REDIS_URL=redis://localhost:6379
LEARNING_QUEUE_CONCURRENCY=5
```

### 3. Start Worker Process

**Terminal 1 (Main Server):**
```bash
npm run dev:backend
```

**Terminal 2 (Worker):**
```bash
cd backend
npm run worker
```

### 4. Verify Installation

```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Check health endpoint
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

## User Onboarding (Three Paths)

### Path 1: Quick Start with Samples

**Best for:** Users with existing writing samples

1. User logs in
2. Onboarding modal appears
3. User pastes writing sample (300+ characters)
4. System analyzes and creates profile
5. Evolution Score: 20-40%

**API Call:**
```bash
curl -X POST http://localhost:3001/api/profile/analyze-text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your writing sample here...",
    "source": "manual"
  }'
```

### Path 2: Choose Archetype

**Best for:** Users who want instant results

1. User logs in
2. Onboarding modal appears
3. User selects archetype (Tech Twitter, LinkedIn Leader, Meme Lord, Academic)
4. System applies pre-built profile
5. Evolution Score: 30-50%

**API Call:**
```bash
curl -X POST http://localhost:3001/api/profile/apply-archetype \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "archetypeId": "tech-twitter-influencer"
  }'
```

### Path 3: Skip and Learn

**Best for:** Users who want zero setup

1. User logs in
2. Onboarding modal appears
3. User clicks "Skip"
4. System learns entirely from edits
5. Evolution Score: 0% (grows with use)

## Using Voice-Aware Generation

### Generate Content

```bash
curl -X POST http://localhost:3001/api/content/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "507f1f77bcf86cd799439011",
    "platform": "linkedin",
    "voiceStrength": 80
  }'
```

**Response:**
```json
{
  "success": true,
  "content": {
    "generatedText": "Content in your voice...",
    "usedStyleProfile": true,
    "voiceStrengthUsed": 80,
    "evolutionScoreAtGeneration": 72
  }
}
```

### Save Edits (Triggers Learning)

```bash
curl -X POST http://localhost:3001/api/content/507f1f77bcf86cd799439012/save-edits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "editedText": "Your edited version..."
  }'
```

**Response:**
```json
{
  "success": true,
  "learningQueued": true,
  "message": "Edits saved. Learning from your changes in the background."
}
```

**What happens next:**
1. Edits saved immediately (you can continue working)
2. Learning job queued (background)
3. System analyzes differences (< 5s)
4. Patterns detected across recent edits (< 10s)
5. Profile updated incrementally (< 15s)
6. Evolution score recalculated (< 30s)

## Monitoring Your Profile

### Check Evolution Score

```bash
curl http://localhost:3001/api/profile/analytics \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "analytics": {
    "evolutionScore": 72,
    "statistics": {
      "totalEdits": 47,
      "learningIterations": 15,
      "lastUpdated": "2024-01-15T09:20:00Z"
    },
    "suggestions": [
      "Your profile is well-trained! Keep generating content."
    ]
  }
}
```

### View Profile Details

```bash
curl http://localhost:3001/api/profile/style \
  -H "Authorization: Bearer $TOKEN"
```

### View Learning Timeline

```bash
curl http://localhost:3001/api/profile/evolution-timeline \
  -H "Authorization: Bearer $TOKEN"
```

## Common Tasks

### Adjust Voice Strength

**0%** = Generic tone-based generation (no voice)
**50%** = Balanced blend
**80%** = Recommended (default)
**100%** = Maximum voice matching

```bash
curl -X PUT http://localhost:3001/api/profile/style \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voiceStrength": 90
  }'
```

### Manually Edit Profile

```bash
curl -X PUT http://localhost:3001/api/profile/style \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tone": {
      "formality": 5,
      "enthusiasm": 8
    },
    "commonPhrases": ["let'\''s dive in"],
    "bannedPhrases": ["leverage", "synergy"]
  }'
```

### Reset Profile

```bash
curl -X POST http://localhost:3001/api/profile/reset \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Redis Not Connected

**Error:** `Redis connection failed`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:latest
```

### Worker Not Processing Jobs

**Error:** Queue length growing, no profile updates

**Solution:**
```bash
# Check if worker is running
ps aux | grep worker

# If not, start worker
cd backend
npm run worker
```

### Profile Not Updating

**Possible causes:**
1. **Too soon:** Rate limited to once per 5 minutes
2. **Not enough edits:** Requires 3+ consistent edits for most patterns
3. **Manual override:** Field was manually set and is protected

**Check:**
```bash
# View recent edits
curl http://localhost:3001/api/profile/analytics \
  -H "Authorization: Bearer $TOKEN"

# Check queue
redis-cli llen bull:learning:wait
```

### Low Evolution Score

**Score < 30%:** Early learning phase
- **Action:** Provide initial samples or generate more content

**Score 30-70%:** Active learning
- **Action:** Keep editing content, profile improving

**Score > 70%:** Well-trained
- **Action:** Profile is working well, continue using

## Best Practices

### For Users

1. **Be consistent:** Edit content the same way each time
2. **Edit meaningfully:** Don't just fix typos, adjust style
3. **Use voice strength:** Start at 80%, adjust based on results
4. **Check evolution score:** Monitor learning progress
5. **Provide samples:** Initial samples help bootstrap learning

### For Developers

1. **Monitor queue:** Alert if length > 1000
2. **Cache profiles:** 1-hour TTL recommended
3. **Handle failures gracefully:** Fall back to tone-based generation
4. **Log learning jobs:** Track patterns and updates
5. **Scale workers:** Add more for high load

## Next Steps

- **Full API Reference:** [VOICE_ENGINE_API.md](VOICE_ENGINE_API.md)
- **Learning Algorithm:** [LEARNING_ALGORITHM.md](LEARNING_ALGORITHM.md)
- **Monitoring Guide:** [MONITORING.md](MONITORING.md)
- **Main README:** [README.md](README.md)

## Support

For issues or questions:
- Check [README.md](README.md) for detailed setup
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Open GitHub issue for bugs or feature requests

**Built with ❤️ for developers who want authentic AI-generated content.**
