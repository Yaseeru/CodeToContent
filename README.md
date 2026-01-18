# CodeToContent

> Transform your GitHub repositories into compelling content for LinkedIn and X (Twitter).

CodeToContent is a developer-focused application that analyzes GitHub repositories using AI and generates clear, human-readable content suitable for social media. The system uses deep code understanding to help developers communicate what they're building, why it matters, and what's new—especially to non-technical audiences.

## ✨ Features
 
### Core Features
- **🔐 GitHub OAuth Authentication** - Seamless login with your GitHub account
- **📊 Repository Analysis** - Deep analysis of code structure, commits, PRs, and documentation
- **🤖 AI-Powered Content Generation** - Uses Gemini 3.0 to create compelling narratives
- **🎨 Multi-Platform Support** - Generate optimized content for LinkedIn and X (Twitter)
- **🎭 Tone Customization** - Choose from 7 predefined tones or create your own
- **✏️ Content Refinement** - Edit and refine generated content with AI assistance
- **🌙 Dark Theme UI** - Clean, minimal interface inspired by Raycast
- **💾 Persistent Storage** - MongoDB stores analyses and content for future reference

### 🎙️ Personalized Voice Engine (NEW!)

The Voice Engine transforms CodeToContent from a generic AI content generator into an intelligent writing assistant that learns your unique voice:

- **🧠 Intelligent Learning** - Automatically learns from your writing samples and edits
- **📝 Multi-Source Training** - Paste text, upload files (.txt, .md, .pdf), or learn from edits
- **🎯 Voice Archetypes** - Quick-start with pre-built personas (Tech Twitter, LinkedIn Leader, Meme Lord, Academic)
- **🔄 Feedback Loop** - Continuously improves by analyzing how you edit AI-generated content
- **📊 Evolution Tracking** - Profile Evolution Score (0-100%) shows learning progress
- **🎚️ Voice Strength Control** - Adjust how strongly your personal style is applied (0-100%)
- **⚡ Asynchronous Learning** - Profile updates happen in the background without blocking
- **🔒 Privacy-First** - Only stores anonymized style metrics, never credentials
- **📈 Analytics Dashboard** - View tone distribution, common phrases, and learning timeline
- **↩️ Profile Versioning** - Rollback to previous versions if needed
- **🚀 Zero-Setup Option** - Skip onboarding and let the system learn entirely from your edits

**Quick Start:** Follow the Voice Engine setup instructions in this README for a complete guide.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis (for profile caching and distributed locks)
- **Queue**: Bull/BullMQ (for asynchronous learning jobs)
- **AI**: Google Gemini 3.0 API
- **Authentication**: GitHub OAuth 2.0
- **Testing**: Jest, fast-check (property-based testing), React Testing Library, Supertest

### Project Structure

```
code-to-content/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── RepositoryList.tsx
│   │   │   ├── AnalysisView.tsx
│   │   │   ├── ContentGenerator.tsx
│   │   │   ├── ContentEditor.tsx
│   │   │   ├── ToneSelector.tsx
│   │   │   ├── StyleProfileSetup.tsx      # NEW: Voice onboarding
│   │   │   ├── StyleProfileEditor.tsx     # NEW: Manual profile editing
│   │   │   ├── ProfileAnalytics.tsx       # NEW: Evolution dashboard
│   │   │   └── __tests__/     # Component tests
│   │   ├── utils/
│   │   │   └── apiClient.ts   # API client with auth
│   │   ├── test/              # Test setup
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Express backend API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts    # MongoDB connection
│   │   │   └── queue.ts       # NEW: Bull queue configuration
│   │   ├── models/            # Mongoose models
│   │   │   ├── User.ts        # Extended with styleProfile
│   │   │   ├── Repository.ts
│   │   │   ├── Analysis.ts
│   │   │   ├── Content.ts     # Extended with editMetadata
│   │   │   ├── LearningJob.ts # NEW: Async learning jobs
│   │   │   └── VoiceArchetype.ts # NEW: Pre-built personas
│   │   ├── services/          # Business logic
│   │   │   ├── AuthService.ts
│   │   │   ├── GitHubService.ts
│   │   │   ├── AnalysisService.ts
│   │   │   ├── ContentGenerationService.ts # Enhanced with voice
│   │   │   ├── VoiceAnalysisService.ts    # NEW: Style extraction
│   │   │   ├── FeedbackLearningEngine.ts  # NEW: Primary learning
│   │   │   ├── StyleDeltaExtractionService.ts # NEW: Edit analysis
│   │   │   ├── ProfileEvolutionService.ts # NEW: Score calculation
│   │   │   ├── ArchetypeManagementService.ts # NEW: Personas
│   │   │   ├── CacheService.ts            # NEW: Redis caching
│   │   │   ├── ProfileVersioningService.ts # NEW: Rollback support
│   │   │   ├── AtomicProfileUpdateService.ts # NEW: Concurrency
│   │   │   └── EditMetadataStorageService.ts # NEW: Edit tracking
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts
│   │   │   ├── repositories.ts
│   │   │   ├── content.ts     # Enhanced with save-edits
│   │   │   └── profile.ts     # NEW: Voice profile endpoints
│   │   ├── workers/           # Background workers
│   │   │   └── learningWorker.ts # NEW: Process learning jobs
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT authentication
│   │   ├── test/              # Test setup
│   │   ├── index.ts           # Entry point
│   │   └── worker.ts          # NEW: Worker process entry
│   ├── package.json
│   └── tsconfig.json
│
├── .kiro/                       # Kiro spec files
│   └── specs/
│       ├── code-to-content/
│       │   ├── requirements.md
│       │   ├── design.md
│       │   └── tasks.md
│       └── personalized-voice-engine/  # NEW: Voice Engine spec
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
│
├── package.json                # Root package with scripts
├── README.md                   # This file
├── SECURITY.md                 # Security guidelines
├── DEPLOYMENT.md               # Deployment instructions
└── .gitignore                  # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or MongoDB Atlas)
- **Redis** (local or Redis Cloud) - Required for Voice Engine - See Redis Setup section below
- **GitHub OAuth App** credentials
- **Google Gemini API** key

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd code-to-content
```

2. **Install all dependencies:**
```bash
npm run install:all
```

3. **Set up environment variables:**

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your actual values
```

See [SECURITY.md](SECURITY.md) for detailed configuration instructions.

### Running the Application

**Development mode** (runs both frontend and backend):
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend (port 3001)
npm run dev:backend

# Terminal 2 - Frontend (port 3000)
npm run dev:frontend
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests by Workspace
```bash
npm run test:backend   # Backend tests only
npm run test:frontend  # Frontend tests only
```

### Testing Strategy

The project uses a comprehensive testing approach:

- **Unit Tests**: Specific examples and edge cases
- **Property-Based Tests**: Universal correctness properties using fast-check
- **Integration Tests**: End-to-end API flows and user journeys
- **Component Tests**: React component behavior with React Testing Library

**Test Coverage:**
- ✅ Authentication flow (OAuth, JWT)
- ✅ Repository analysis (GitHub API, Gemini AI)
- ✅ Content generation (multi-platform, tone application)
- ✅ Data persistence (MongoDB models)
- ✅ UI components (user interactions, state management)

## 🔧 Configuration

### Security First! 🔒

**IMPORTANT:** Never commit `.env` files or expose sensitive credentials. See [SECURITY.md](SECURITY.md) for detailed security guidelines.

### GitHub OAuth Setup

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set **Authorization callback URL** to: `http://localhost:3001/api/auth/callback`
4. Copy **Client ID** and **Client Secret** to your `.env` files

### MongoDB Setup

**Option 1: MongoDB Atlas (Recommended)**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Add to `backend/.env` as `MONGODB_URI`

**Option 2: Local MongoDB**
```bash
# Install MongoDB locally
# Use connection string: mongodb://localhost:27017/code-to-content
```

### Gemini API Setup

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `backend/.env` as `GEMINI_API_KEY`

### Environment Variables

All sensitive configuration is stored in `.env` files:

- `backend/.env` - Backend configuration (secrets, API keys)
- `frontend/.env` - Frontend configuration (public values only)

**Never commit these files!** Use `.env.example` as templates.

#### Backend Environment Variables

**Required:**
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/code-to-content

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_min_32_chars

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Redis Configuration (Voice Engine)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Optional (Voice Engine):**
```bash
# Learning Queue Configuration
LEARNING_QUEUE_CONCURRENCY=5          # Number of concurrent learning jobs (default: 5)
LEARNING_RATE_LIMIT_MINUTES=5         # Minutes between profile updates (default: 5)
EDIT_BATCH_WINDOW_MINUTES=5           # Minutes to batch rapid edits (default: 5)
PROFILE_CACHE_TTL_SECONDS=3600        # Profile cache duration (default: 3600 = 1 hour)
EVOLUTION_CACHE_TTL_SECONDS=300       # Evolution score cache duration (default: 300 = 5 min)
MAX_EDIT_METADATA_PER_USER=50         # Max stored edits per user (default: 50)
MAX_PROFILE_VERSIONS=10               # Max profile versions for rollback (default: 10)
GEMINI_TEMPERATURE=0.8                # Gemini temperature for voice generation (default: 0.8)
GEMINI_MAX_TOKENS=8000                # Max prompt tokens (default: 8000)
```

#### Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api

# GitHub OAuth Configuration (must match backend)
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

#### Redis Setup

**Option 1: Local Redis (Development)**
```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
# Windows: Use WSL or Redis for Windows

# Start Redis
redis-server

# Use in .env
REDIS_URL=redis://localhost:6379
```

**Option 2: Redis Cloud (Production)**
1. Create free account at [Redis Cloud](https://redis.com/try-free/)
2. Create database
3. Copy connection string
4. Add to `.env`: `REDIS_URL=redis://username:password@host:port`

**Option 3: Docker Redis**
```bash
docker run -d -p 6379:6379 redis:latest
```

## 📖 How It Works

### 1. Authentication
- User clicks "Continue with GitHub"
- OAuth flow redirects to GitHub for authorization
- Backend exchanges code for access token
- JWT token issued for session management

### 2. Repository Analysis
- User selects a repository from their GitHub account
- System fetches:
  - README content
  - Commit history (last 50)
  - Pull requests (last 30)
  - File structure
  - Package dependencies
- Gemini AI analyzes the data and generates structured summary:
  - Problem statement
  - Target audience
  - Core functionality
  - Notable features
  - Recent changes
  - Integrations
  - Value proposition

### 3. Content Generation
- User selects platform (LinkedIn or X)
- User chooses tone (Professional, Casual, Confident, Funny, Meme, Thoughtful, Educational)
- **NEW:** If user has a Voice Profile, system uses personalized style
- Gemini AI generates platform-specific content
- Content optimized for:
  - LinkedIn: 150-300 words, professional format
  - X: 200-500 characters, concise and engaging

### 4. Content Refinement
- User can edit generated content manually
- **NEW:** System learns from edits to improve future generations
- AI-powered refinement options:
  - "Shorter" - Reduce length by 30-50%
  - "Clearer" - Simplify language and improve flow
  - "More engaging" - Add hooks and compelling language
- One-click copy to clipboard

## 🎙️ Voice Engine Deep Dive

### What is the Voice Engine?

The Voice Engine is an intelligent learning system that transforms CodeToContent into a personalized writing assistant. Instead of generic AI content, it learns your unique voice and generates content that sounds authentically like you.

### How Voice Learning Works

#### 1. Initial Profile Creation (Optional)

**Three Onboarding Paths:**

**Path A: Quick Start with Samples**
- Paste any writing sample (minimum 300 characters)
- Upload files (.txt, .md, .pdf with minimum 500 characters)
- System extracts style metrics using Gemini AI
- Profile Evolution Score starts at 20-40%

**Path B: Choose a Voice Archetype**
- Select from 4 pre-built personas:
  - **Tech Twitter Influencer**: Casual, direct, emoji-heavy, short sentences
  - **LinkedIn Thought Leader**: Professional, thoughtful, storytelling
  - **Meme Lord**: Humorous, very casual, internet slang
  - **Academic Researcher**: Formal, analytical, technical vocabulary
- Customize after application
- Profile Evolution Score starts at 30-50%

**Path C: Skip and Learn from Edits**
- Start with neutral profile
- System learns entirely from how you edit content
- Profile Evolution Score starts at 0%
- Best for users who want zero setup

#### 2. Voice-Aware Content Generation

When you have a Style Profile, content generation uses **Few-Shot Prompting**:

1. System selects 3-6 representative writing samples from your profile
2. Constructs prompt with:
   - Your tone metrics (formality, enthusiasm, directness, humor, emotionality)
   - Writing traits (sentence length, emoji usage, structure preferences)
   - Common phrases you use
   - Phrases you avoid (banned phrases)
   - Sample writings as examples
3. Gemini AI generates content matching your authentic voice
4. Voice Strength control (0-100%) lets you blend personal style with variation

**Fallback:** If profile is missing or generation fails, system uses traditional tone-based generation.

#### 3. Feedback Loop: The Primary Learning Engine

**This is where the magic happens.** Every time you edit AI-generated content, the system learns:

**What the System Analyzes:**
- **Sentence Length Changes**: Do you consistently shorten or lengthen sentences?
- **Emoji Usage**: Do you add or remove emojis?
- **Structure Modifications**: Do you add bullet points, paragraphs, or formatting?
- **Tone Shifts**: Does the emotional tone change? (analyzed by Gemini)
- **Vocabulary Changes**: Do you substitute words or change complexity?
- **Phrase Patterns**: What phrases do you consistently add or remove?

**Learning Rules (Pattern Detection):**
- **3+ consistent edits** → Update sentence length, emoji frequency, structure style, add common phrases
- **2+ consistent edits** → Add to banned phrases (phrases you always remove)
- **5+ edit sessions** → Allow major structural changes (voice type, vocabulary level)

**Profile Updates:**
- Weighted adjustments (10-20% changes, not sudden shifts)
- Recent edits weighted more heavily than older ones
- Manual overrides are never modified by learning
- Learning happens asynchronously (doesn't block your work)
- Rate limited to once per 5 minutes per user
- Multiple rapid edits batched for efficiency

**Result:** Your Profile Evolution Score increases, and future content requires less editing.

### Voice Archetypes

Pre-built personas for quick-start:

| Archetype | Voice Type | Formality | Enthusiasm | Sentence Length | Emoji Usage |
|-----------|------------|-----------|------------|-----------------|-------------|
| **Tech Twitter Influencer** | Casual | 2/10 | 8/10 | Short (10-15 words) | High (3-5 per post) |
| **LinkedIn Thought Leader** | Professional | 7/10 | 6/10 | Medium (15-20 words) | Low (0-1 per post) |
| **Meme Lord** | Casual | 1/10 | 10/10 | Very Short (5-10 words) | Very High (5+ per post) |
| **Academic Researcher** | Analytical | 9/10 | 3/10 | Long (20-30 words) | None |

All archetypes can be customized after application and will evolve through feedback learning.

### Profile Evolution Score

**What it measures (0-100%):**
- **Initial Samples (20 points)**: Did you provide writing samples?
- **Feedback Iterations (40 points)**: How many times has the system learned from your edits?
- **Profile Completeness (20 points)**: Are all profile fields populated?
- **Edit Consistency (20 points)**: Are your edits consistent and pattern-based?

**Score Interpretation:**
- **0-30%**: Early learning phase - provide samples or generate more content
- **30-70%**: Active learning - profile improving with each edit
- **70-100%**: Well-trained - content closely matches your voice

### Voice Strength Control

Adjust how strongly your personal style is applied:

- **0%**: Generic tone-based generation (no voice profile)
- **50%**: Balanced blend of your style and creative variation
- **100%**: Maximum voice matching (closest to your authentic voice)

Default: 80% (recommended for most users)

### Profile Management

**View Your Profile:**
- See all tone metrics, writing traits, and preferences
- View common phrases and banned phrases
- Check sample posts used for few-shot prompting
- Review learning statistics and evolution timeline

**Edit Your Profile:**
- Manually adjust any metric or preference
- Add/remove common phrases and banned phrases
- Update sample posts
- Changes apply immediately to next generation

**Reset Your Profile:**
- Clear all learned data
- Revert to default settings
- Start fresh with new onboarding

**Profile Versioning:**
- System maintains last 10 versions
- Rollback if learning produces poor results
- Version metadata includes timestamp and source

### Privacy & Data Control

**What We Store:**
- Anonymized style metrics (tone, traits, preferences)
- User-provided sample posts (only what you explicitly provide)
- Edit patterns (for learning)

**What We DON'T Store:**
- Social media credentials or access tokens
- Private repository content
- Personal identifying information beyond GitHub username

**Your Control:**
- View exactly what's stored in your profile
- Delete your entire profile anytime
- Profiles are never shared or exported

### Performance & Scalability

**Optimizations:**
- **Redis Caching**: Profiles cached with 1-hour TTL (sub-100ms retrieval)
- **Asynchronous Learning**: All profile updates happen in background
- **Job Queue**: Bull/BullMQ processes learning jobs with priority
- **Concurrency Control**: Atomic updates prevent race conditions
- **Rate Limiting**: Learning updates limited to once per 5 minutes
- **Edit Batching**: Multiple rapid edits aggregated for efficiency

**Performance Targets:**
- Profile retrieval: < 100ms (cached)
- Content generation: < 3s (with profile)
- Learning job processing: < 30s
- Concurrent users: 100+ simultaneous generations

## 🏗️ Development

### Code Style

- **TypeScript** strict mode enabled
- **ESLint** and **Prettier** recommended
- **Dark theme** by default (Raycast-inspired)
- **Minimal design** - no animations, gradients, or bright colors

### API Endpoints

#### Authentication
```
GET  /api/auth/github          # Initiate OAuth flow
GET  /api/auth/callback        # Handle OAuth callback
```

#### Repositories
```
GET  /api/repositories                    # Fetch user's repositories
POST /api/repositories/:id/analyze        # Trigger analysis
GET  /api/repositories/:id/analysis       # Get analysis results
```

#### Content
```
POST /api/content/generate     # Generate content (voice-aware if profile exists)
POST /api/content/refine       # Refine content
POST /api/content/:id/save-edits  # NEW: Save edits and trigger learning
```

#### Voice Profile (NEW)
```
POST /api/profile/analyze-text        # Analyze text/file for style extraction
GET  /api/profile/style               # Get current user's style profile
PUT  /api/profile/style               # Update style profile manually
POST /api/profile/reset               # Reset profile to defaults
GET  /api/profile/archetypes          # List available voice archetypes
POST /api/profile/apply-archetype     # Apply archetype to user profile
GET  /api/profile/analytics           # Get profile evolution metrics
GET  /api/profile/evolution-timeline  # Get learning history with milestones
```

### Data Models

**User**
- GitHub ID, username, access token, avatar URL
- **NEW:** styleProfile (optional) - Complete voice characteristics
  - voiceType, tone metrics, writing traits, structure preferences
  - vocabularyLevel, commonPhrases, bannedPhrases, samplePosts
  - learningIterations, voiceStrength, manualOverrides
  - profileSource, archetypeBase, lastUpdated

**Repository**
- User reference, GitHub repo ID, name, description, last analyzed

**Analysis**
- Repository reference, user reference, structured summary, raw signals

**Content**
- Analysis reference, user reference, platform, tone, generated text, edited text, version
- **NEW:** editMetadata - Comprehensive edit tracking for learning
  - originalText, sentenceLengthDelta, emojiChanges, structureChanges
  - toneShift, vocabularyChanges, phrasesAdded, phrasesRemoved
  - editTimestamp, learningProcessed
- **NEW:** Voice metadata - usedStyleProfile, voiceStrengthUsed, evolutionScoreAtGeneration

**LearningJob (NEW)**
- User reference, content reference, status, priority, attempts
- styleDelta, error, processing timestamps

**VoiceArchetype (NEW)**
- name, description, category, styleProfile template
- usageCount, isDefault, createdBy

## 🔄 Migration Guide for Existing Users

If you're upgrading from a version without the Voice Engine, follow these steps:

### 1. Update Dependencies

```bash
# Install new dependencies
npm run install:all
```

New dependencies added:
- `bull` or `bullmq` - Job queue for asynchronous learning
- `ioredis` - Redis client for caching and distributed locks
- `diff` - Text diffing for edit analysis

### 2. Set Up Redis

The Voice Engine requires Redis for caching and job queue management.

**Development:**
```bash
# Install Redis locally
brew install redis  # macOS
# or
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server
```

**Production:**
- Use Redis Cloud, AWS ElastiCache, or similar managed service
- Update `REDIS_URL` in your `.env` file

### 3. Update Environment Variables

Add to `backend/.env`:
```bash
# Required
REDIS_URL=redis://localhost:6379

# Optional (defaults shown)
LEARNING_QUEUE_CONCURRENCY=5
LEARNING_RATE_LIMIT_MINUTES=5
EDIT_BATCH_WINDOW_MINUTES=5
PROFILE_CACHE_TTL_SECONDS=3600
```

### 4. Database Migration

**No migration required!** The Voice Engine is fully backward compatible:

- `styleProfile` field is optional on User model
- Existing users without profiles continue using tone-based generation
- `editMetadata` field is optional on Content model
- Existing content works without edit tracking

### 5. Start Worker Process

The Voice Engine uses a separate worker process for background learning:

**Development:**
```bash
# Terminal 1: Main server
npm run dev:backend

# Terminal 2: Worker process
cd backend
npm run worker
```

**Production:**
```bash
# Start both processes (use PM2, systemd, or container orchestration)
node dist/index.js      # Main server
node dist/worker.js     # Worker process
```

### 6. Verify Installation

1. **Check Redis connection:**
```bash
redis-cli ping
# Should return: PONG
```

2. **Check health endpoint:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

3. **Test Voice Engine:**
- Log in to the application
- You'll see the Voice Profile onboarding modal
- Try any of the three paths (samples, archetype, or skip)
- Generate content and verify "Using your voice" indicator appears

### 7. Monitoring

Monitor the learning queue:
```bash
# Check queue health
curl http://localhost:3001/api/admin/queue-health

# Check Redis keys
redis-cli keys "profile:*"
redis-cli keys "bull:learning:*"
```

### Rollback Plan

If you need to rollback:

1. **Stop worker process**
2. **Remove Redis dependency** (optional - won't break anything)
3. **Existing users continue with tone-based generation**
4. **No data loss** - styleProfile is optional

The Voice Engine is designed for zero-downtime deployment and graceful degradation.

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Voice Engine Deployment Considerations

#### Infrastructure Requirements

- **MongoDB**: Database for users, content, learning jobs
- **Redis**: Cache and job queue (required for Voice Engine)
- **2 Processes**: Main server + worker process

**Recommended Production Setup:**
- **MongoDB Atlas**: Managed MongoDB (M10+ cluster)
- **Redis Cloud**: Managed Redis (30MB+ free tier sufficient for small deployments)
- **Container Orchestration**: Docker Compose, Kubernetes, or Cloud Run
- **Load Balancer**: For horizontal scaling of main server
- **Process Manager**: PM2, systemd, or container restart policies

#### Docker Deployment

**docker-compose.yml** (example):
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=code-to-content

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/code-to-content
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis

  worker:
    build: .
    command: node dist/worker.js
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/code-to-content
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - mongodb
      - redis

volumes:
  mongodb_data:
  redis_data:
```

#### Cloud Run Deployment (Google Cloud)

**Deploy Main Server:**
```bash
gcloud run deploy codetocontent-api \
  --image gcr.io/PROJECT_ID/codetocontent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="MONGODB_URI=...,REDIS_URL=...,NODE_ENV=production"
```

**Deploy Worker Process:**
```bash
gcloud run deploy codetocontent-worker \
  --image gcr.io/PROJECT_ID/codetocontent \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --command="node,dist/worker.js" \
  --set-env-vars="MONGODB_URI=...,REDIS_URL=...,NODE_ENV=production"
```

#### Scaling Considerations

**Horizontal Scaling:**
- **Main Server**: Scale to N instances (stateless, load balanced)
- **Worker Process**: Scale to M instances (Bull handles job distribution)
- **Redis**: Use Redis Cluster for high availability
- **MongoDB**: Use replica sets for redundancy

**Performance Tuning:**
```bash
# Increase worker concurrency for high load
LEARNING_QUEUE_CONCURRENCY=10

# Reduce cache TTL for frequently changing profiles
PROFILE_CACHE_TTL_SECONDS=1800  # 30 minutes

# Increase rate limit window for heavy users
LEARNING_RATE_LIMIT_MINUTES=10
```

#### Monitoring & Alerts

**Key Metrics to Monitor:**
- Redis connection status
- Bull queue length (alert if > 1000 jobs)
- Learning job processing time (alert if > 60s)
- Profile cache hit rate (should be > 80%)
- Worker process health
- Gemini API rate limits

**Health Checks:**
```bash
# Main server
GET /health

# Worker process (custom endpoint)
GET /worker/health

# Redis
redis-cli ping

# MongoDB
mongosh --eval "db.adminCommand('ping')"
```

#### Backup & Recovery

**Profile Versioning:**
- System maintains last 10 versions per user
- Automatic rollback available via API
- No manual backup needed for profiles

**Database Backup:**
```bash
# MongoDB backup (includes all profiles)
mongodump --uri="$MONGODB_URI" --out=/backup/$(date +%Y%m%d)

# Redis backup (cache only, can be rebuilt)
redis-cli BGSAVE
```

### Quick Deploy to Google Cloud Run

```bash
# Build Docker image
docker build -t codetocontent .

# Deploy to Cloud Run
gcloud run deploy codetocontent \
  --image codetocontent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="MONGODB_URI=your_mongodb_uri,GITHUB_CLIENT_ID=your_client_id,..."
```

## 📝 Scripts

```bash
# Development
npm run dev              # Run both frontend and backend
npm run dev:backend      # Run backend only
npm run dev:frontend     # Run frontend only

# Installation
npm run install:all      # Install all dependencies

# Testing
npm test                 # Run all tests
npm run test:backend     # Run backend tests
npm run test:frontend    # Run frontend tests

# Building
npm run build            # Build both frontend and backend
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 🙏 Acknowledgments

- **Gemini AI** by Google for powerful content generation
- **GitHub** for OAuth and repository API
- **MongoDB** for flexible data storage
- **Raycast** for UI design inspiration

## 📞 Support

For security issues, see [SECURITY.md](SECURITY.md)

For deployment help, see [DEPLOYMENT.md](DEPLOYMENT.md)

For general questions, open an issue on GitHub.

---

**Built with ❤️ for developers who want to share their work with the world.**
