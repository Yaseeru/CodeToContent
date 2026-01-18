# Voice Engine API Documentation

Complete API reference for the Personalized Voice Engine features.

## Table of Contents

- [Authentication](#authentication)
- [Profile Management](#profile-management)
- [Voice Archetypes](#voice-archetypes)
- [Content Generation](#content-generation)
- [Analytics & Evolution](#analytics--evolution)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

## Authentication

All Voice Engine endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Obtain JWT token via GitHub OAuth flow (see main API documentation).

## Profile Management

### Analyze Text for Style Extraction

Extract style profile from user-provided text or file upload.

**Endpoint:** `POST /api/profile/analyze-text`

**Request Body:**
```json
{
  "text": "Your writing sample here (minimum 300 characters)...",
  "source": "manual"
}
```

Or with file upload:
```json
{
  "file": "<base64_encoded_file>",
  "filename": "sample.txt",
  "source": "file"
}
```

**Supported File Formats:** `.txt`, `.md`, `.pdf`

**Response:** `200 OK`
```json
{
  "success": true,
  "profile": {
    "voiceType": "casual",
    "tone": {
      "formality": 3,
      "enthusiasm": 7,
      "directness": 8,
      "humor": 6,
      "emotionality": 5
    },
    "writingTraits": {
      "avgSentenceLength": 15,
      "usesQuestionsOften": true,
      "usesEmojis": true,
      "emojiFrequency": 3,
      "usesBulletPoints": true,
      "usesShortParagraphs": true,
      "usesHooks": true
    },
    "structurePreferences": {
      "introStyle": "hook",
      "bodyStyle": "bullets",
      "endingStyle": "cta"
    },
    "vocabularyLevel": "medium",
    "commonPhrases": ["let's dive in", "here's the thing", "bottom line"],
    "bannedPhrases": ["leverage", "synergy", "paradigm shift"],
    "samplePosts": ["Sample 1...", "Sample 2..."],
    "learningIterations": 0,
    "voiceStrength": 80,
    "profileSource": "manual"
  },
  "evolutionScore": 25
}
```

**Error Responses:**
- `400 Bad Request` - Text too short (< 300 chars) or invalid file format
- `401 Unauthorized` - Missing or invalid JWT token
- `503 Service Unavailable` - Gemini API error

---

### Get Style Profile

Retrieve the current user's style profile.

**Endpoint:** `GET /api/profile/style`

**Response:** `200 OK`
```json
{
  "success": true,
  "profile": {
    "voiceType": "casual",
    "tone": { /* ... */ },
    "writingTraits": { /* ... */ },
    "structurePreferences": { /* ... */ },
    "vocabularyLevel": "medium",
    "commonPhrases": [],
    "bannedPhrases": [],
    "samplePosts": [],
    "learningIterations": 15,
    "lastUpdated": "2024-01-15T10:30:00Z",
    "profileSource": "feedback",
    "voiceStrength": 80
  },
  "evolutionScore": 72,
  "hasProfile": true
}
```

**Response (No Profile):** `200 OK`
```json
{
  "success": true,
  "profile": null,
  "evolutionScore": 0,
  "hasProfile": false
}
```

---

### Update Style Profile

Manually update style profile fields.

**Endpoint:** `PUT /api/profile/style`

**Request Body:** (all fields optional)
```json
{
  "tone": {
    "formality": 5,
    "enthusiasm": 8
  },
  "writingTraits": {
    "avgSentenceLength": 18,
    "usesEmojis": false
  },
  "commonPhrases": ["new phrase to add"],
  "bannedPhrases": ["phrase to avoid"],
  "voiceStrength": 90
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "profile": { /* updated profile */ },
  "evolutionScore": 75
}
```

**Validation Rules:**
- Tone metrics: 1-10 inclusive
- Voice strength: 0-100 inclusive
- Sentence length: 5-50 words
- Emoji frequency: 0-10

**Error Responses:**
- `400 Bad Request` - Invalid values (out of range)
- `401 Unauthorized` - Missing or invalid JWT token

---

### Reset Style Profile

Clear all profile data and revert to defaults.

**Endpoint:** `POST /api/profile/reset`

**Request Body:** (empty)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Style profile reset successfully"
}
```

---

## Voice Archetypes

### List Available Archetypes

Get all pre-built voice archetypes.

**Endpoint:** `GET /api/profile/archetypes`

**Response:** `200 OK`
```json
{
  "success": true,
  "archetypes": [
    {
      "id": "tech-twitter-influencer",
      "name": "Tech Twitter Influencer",
      "description": "Casual, direct, emoji-heavy, short sentences with hooks",
      "category": "casual",
      "usageCount": 1247,
      "preview": {
        "formality": 2,
        "enthusiasm": 8,
        "avgSentenceLength": 12,
        "usesEmojis": true
      }
    },
    {
      "id": "linkedin-thought-leader",
      "name": "LinkedIn Thought Leader",
      "description": "Professional, thoughtful, storytelling with medium-length content",
      "category": "professional",
      "usageCount": 892,
      "preview": { /* ... */ }
    },
    {
      "id": "meme-lord",
      "name": "Meme Lord",
      "description": "Humorous, very casual, internet slang, emoji-heavy",
      "category": "creative",
      "usageCount": 634,
      "preview": { /* ... */ }
    },
    {
      "id": "academic-researcher",
      "name": "Academic Researcher",
      "description": "Formal, analytical, technical vocabulary, long sentences",
      "category": "technical",
      "usageCount": 421,
      "preview": { /* ... */ }
    }
  ]
}
```

---

### Apply Archetype

Apply a pre-built archetype to user's profile.

**Endpoint:** `POST /api/profile/apply-archetype`

**Request Body:**
```json
{
  "archetypeId": "tech-twitter-influencer"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "profile": { /* complete profile from archetype */ },
  "evolutionScore": 35,
  "message": "Archetype applied successfully. You can customize it further."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid archetype ID
- `404 Not Found` - Archetype not found

---

## Content Generation

### Generate Content (Voice-Aware)

Generate platform-specific content using voice profile if available.

**Endpoint:** `POST /api/content/generate`

**Request Body:**
```json
{
  "analysisId": "507f1f77bcf86cd799439011",
  "platform": "linkedin",
  "tone": "professional",
  "voiceStrength": 80
}
```

**Parameters:**
- `analysisId` (required): Repository analysis ID
- `platform` (required): "linkedin" or "x"
- `tone` (optional): Fallback tone if no profile
- `voiceStrength` (optional): 0-100, overrides user's default

**Response:** `200 OK`
```json
{
  "success": true,
  "content": {
    "id": "507f1f77bcf86cd799439012",
    "generatedText": "Generated content here...",
    "platform": "linkedin",
    "usedStyleProfile": true,
    "voiceStrengthUsed": 80,
    "evolutionScoreAtGeneration": 72,
    "createdAt": "2024-01-15T10:35:00Z"
  }
}
```

**Voice Indicators:**
- `usedStyleProfile: true` - Content generated with voice profile
- `usedStyleProfile: false` - Fallback to tone-based generation

---

### Save Content Edits

Save user edits and trigger asynchronous learning.

**Endpoint:** `POST /api/content/:id/save-edits`

**Request Body:**
```json
{
  "editedText": "User's edited version of the content..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "content": {
    "id": "507f1f77bcf86cd799439012",
    "editedText": "User's edited version...",
    "version": 2
  },
  "learningQueued": true,
  "message": "Edits saved. Learning from your changes in the background."
}
```

**Learning Process:**
- Edits saved immediately (non-blocking)
- Learning job queued asynchronously
- Profile updates within 30 seconds
- No user action required

---

## Analytics & Evolution

### Get Profile Analytics

Retrieve profile evolution metrics and statistics.

**Endpoint:** `GET /api/profile/analytics`

**Response:** `200 OK`
```json
{
  "success": true,
  "analytics": {
    "evolutionScore": 72,
    "components": {
      "initialSamples": 20,
      "feedbackIterations": 32,
      "profileCompleteness": 20,
      "editConsistency": 18
    },
    "statistics": {
      "totalEdits": 47,
      "learningIterations": 15,
      "lastUpdated": "2024-01-15T09:20:00Z",
      "profileAge": "23 days",
      "contentGenerated": 89
    },
    "toneDistribution": {
      "formality": 5,
      "enthusiasm": 7,
      "directness": 8,
      "humor": 6,
      "emotionality": 5
    },
    "topCommonPhrases": [
      { "phrase": "let's dive in", "frequency": 12 },
      { "phrase": "here's the thing", "frequency": 8 },
      { "phrase": "bottom line", "frequency": 6 }
    ],
    "bannedPhrases": ["leverage", "synergy", "paradigm shift"],
    "writingTraitsSummary": {
      "avgSentenceLength": 15,
      "emojiUsage": "moderate",
      "structureStyle": "bullets with hooks"
    },
    "suggestions": [
      "Your profile is well-trained! Keep generating content.",
      "Consider adding more sample posts for better accuracy."
    ]
  }
}
```

---

### Get Evolution Timeline

Retrieve learning history with milestones.

**Endpoint:** `GET /api/profile/evolution-timeline`

**Response:** `200 OK`
```json
{
  "success": true,
  "timeline": [
    {
      "date": "2024-01-01T10:00:00Z",
      "event": "Profile created",
      "evolutionScore": 25,
      "source": "manual",
      "details": "Initial samples provided"
    },
    {
      "date": "2024-01-05T14:30:00Z",
      "event": "First learning iteration",
      "evolutionScore": 35,
      "source": "feedback",
      "details": "Learned from 3 edits"
    },
    {
      "date": "2024-01-10T09:15:00Z",
      "event": "Milestone: 10 learning iterations",
      "evolutionScore": 58,
      "source": "feedback",
      "details": "Profile improving consistently"
    },
    {
      "date": "2024-01-15T09:20:00Z",
      "event": "Milestone: Well-trained profile",
      "evolutionScore": 72,
      "source": "feedback",
      "details": "Profile evolution score > 70%"
    }
  ],
  "milestones": {
    "profileCreated": true,
    "firstLearning": true,
    "tenIterations": true,
    "wellTrained": true,
    "expertLevel": false
  }
}
```

---

## Error Handling

### Standard Error Response

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Text must be at least 300 characters",
    "details": {
      "field": "text",
      "provided": 150,
      "required": 300
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `GEMINI_API_ERROR` | 503 | AI service unavailable |
| `INTERNAL_ERROR` | 500 | Server error |

### Graceful Degradation

If Voice Engine features fail:
- Content generation falls back to tone-based generation
- Learning failures don't block content saving
- Profile retrieval errors return empty profile
- System continues functioning without voice features

---

## Rate Limits

### Profile Updates

- **Learning updates**: Once per 5 minutes per user
- **Manual updates**: No limit (immediate)
- **Analysis requests**: 10 per hour per user

### Content Generation

- **With profile**: 100 requests per hour per user
- **Without profile**: 100 requests per hour per user
- **Gemini API**: Subject to Google's rate limits

### Caching

- **Profile cache**: 1 hour TTL
- **Evolution score cache**: 5 minutes TTL
- **Archetype list cache**: 24 hours TTL

---

## Best Practices

### For Frontend Developers

1. **Check profile existence** before showing voice features
2. **Display evolution score** to show learning progress
3. **Handle graceful degradation** if voice features fail
4. **Show "Learning from edits"** indicator when saving
5. **Cache profile data** on client side (1 hour)

### For Backend Developers

1. **Always validate input** before processing
2. **Use async learning** - never block user requests
3. **Implement retry logic** for Gemini API calls
4. **Monitor queue health** - alert if backlog grows
5. **Cache aggressively** - profiles change infrequently

### For DevOps

1. **Monitor Redis health** - critical for Voice Engine
2. **Scale worker processes** independently from API
3. **Set up alerts** for queue length and processing time
4. **Backup MongoDB** regularly (includes profiles)
5. **Use managed Redis** in production for reliability

---

## Examples

### Complete Onboarding Flow

```javascript
// 1. User provides sample text
const response1 = await fetch('/api/profile/analyze-text', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: userSampleText,
    source: 'manual'
  })
});

const { profile, evolutionScore } = await response1.json();
console.log(`Profile created! Evolution score: ${evolutionScore}%`);

// 2. Generate content with voice
const response2 = await fetch('/api/content/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    analysisId: repoAnalysisId,
    platform: 'linkedin',
    voiceStrength: 80
  })
});

const { content } = await response2.json();
console.log(`Generated with voice: ${content.usedStyleProfile}`);

// 3. User edits and saves
const response3 = await fetch(`/api/content/${content.id}/save-edits`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    editedText: userEditedVersion
  })
});

const { learningQueued } = await response3.json();
console.log(`Learning queued: ${learningQueued}`);

// 4. Check evolution progress
const response4 = await fetch('/api/profile/analytics', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { analytics } = await response4.json();
console.log(`New evolution score: ${analytics.evolutionScore}%`);
```

---

## Support

For issues or questions:
- Check [main README](README.md) for setup instructions
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Open GitHub issue for bugs or feature requests

**Built with ❤️ for developers who want authentic AI-generated content.**
