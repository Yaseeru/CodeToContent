# CodeToContent

> Create authentic, personalized X (Twitter) content with AI assistance.

CodeToContent is a developer-focused application that helps you create compelling social media content that sounds authentically like you—not generic AI. The system analyzes your GitHub repositories and learns your unique writing style to help you communicate what you're building, why it matters, and what's new to both technical and non-technical audiences.

## ✨ Features
 
### Core Features
- **🔐 GitHub OAuth Authentication** - Seamless login with your GitHub account
- **📊 Repository Analysis** - Deep analysis of code structure, commits, PRs, and documentation
- **🤖 AI-Powered Content Generation** - Uses Gemini 3.0 to create compelling narratives
- **🎨 X (Twitter) Optimized** - Generate optimized content for X (Twitter)
- **🎤 Voice Profile** - Personalized content generation using your unique writing style
- **✏️ Content Refinement** - Edit and refine generated content with AI assistance
- **📸 Visual Intelligence** - Generate beautiful code snapshot images (NEW!)
- **🌙 Dark Theme UI** - Clean, minimal interface inspired by Raycast
- **💾 Persistent Storage** - MongoDB stores analyses and content for future reference

### 🎙️ Personalized Voice Engine (NEW!)

The Voice Engine transforms CodeToContent from a generic AI content generator into an intelligent writing assistant that learns your unique voice. **Note:** Quality personalization requires some initial setup and ongoing refinement, but the result is content that sounds authentically like you.

- **🧠 Intelligent Learning** - Learns from your writing samples and edits over time
- **📝 Multi-Source Training** - Paste text, upload files (.txt, .md, .pdf), or learn from edits
- **🎯 Voice Archetypes** - Quick-start with pre-built personas (Tech Twitter, Meme Lord, Academic)
- **🔄 Feedback Loop** - Continuously improves by analyzing how you edit AI-generated content
- **📊 Evolution Tracking** - Profile Evolution Score (0-100%) shows learning progress
- **🎚️ Voice Strength Control** - Adjust how strongly your personal style is applied (0-100%)
- **⚡ Asynchronous Learning** - Profile updates happen in the background without blocking
- **🔒 Privacy-First** - Only stores anonymized style metrics, never credentials
- **📈 Analytics Dashboard** - View tone distribution, common phrases, and learning timeline
- **↩️ Profile Versioning** - Rollback to previous versions if needed
- **🚀 Zero-Setup Option** - Skip onboarding and let the system learn entirely from your edits

**Reality Check:** The Voice Engine improves over time. Early content may need editing, but each edit teaches the system your preferences. Expect 5-10 generations before seeing significant personalization.

### 📸 Visual Intelligence (Code Snapshot Generator) (NEW!)

Transform your code into beautiful, shareable images that boost engagement on X (Twitter). Posts with visuals get significantly more engagement, and Visual Intelligence uses AI to automatically select the most interesting code snippets from your repositories and render them as professional, syntax-highlighted images.

- **🤖 AI-Powered Selection** - Gemini AI analyzes your code to identify the most interesting snippets
- **🎨 Beautiful Rendering** - Carbon.now.sh-style aesthetics with syntax highlighting
- **⚡ Smart Caching** - Generated snapshots are cached and reused efficiently
- **🔄 Staleness Detection** - Automatically invalidates outdated snapshots when code changes
- **📎 Seamless Integration** - Attach snapshots to your content with one click
- **🎯 Intelligent Scoring** - Prioritizes new functions, refactored logic, and core algorithms
- **🖼️ Optimized for X** - Images under 5MB, perfect dimensions for social media
- **🔍 Heuristic Fallback** - Works even when AI is unavailable

**How It Works:**
1. Select a repository and click "Generate Snapshots"
2. AI analyzes your code and selects 5 most interesting snippets
3. Snippets are rendered as beautiful code images
4. Click "Add Visual" when generating content to attach a snapshot
5. Your X post now includes a compelling code visual

**Perfect For:**
- Showcasing new features or refactored code
- Sharing interesting algorithms or patterns
- Making technical posts more engaging
- Highlighting code quality and craftsmanship

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
│   │   │   ├── StyleProfileSetup.tsx      # NEW: Voice onboarding
│   │   │   ├── StyleProfileEditor.tsx     # NEW: Manual profile editing
│   │   │   ├── ProfileAnalytics.tsx       # NEW: Evolution dashboard
│   │   │   ├── SnapshotSelector.tsx       # NEW: Snapshot selection modal
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
│   │   │   ├── Content.ts     # Extended with editMetadata & snapshotId
│   │   │   ├── CodeSnapshot.ts # NEW: Code snapshot metadata
│   │   │   ├── LearningJob.ts # NEW: Async learning jobs
│   │   │   └── VoiceArchetype.ts # NEW: Pre-built personas
│   │   ├── services/          # Business logic
│   │   │   ├── AuthService.ts
│   │   │   ├── GitHubService.ts
│   │   │   ├── AnalysisService.ts
│   │   │   ├── ContentGenerationService.ts # Enhanced with voice & snapshots
│   │   │   ├── VoiceAnalysisService.ts    # NEW: Style extraction
│   │   │   ├── FeedbackLearningEngine.ts  # NEW: Primary learning
│   │   │   ├── StyleDeltaExtractionService.ts # NEW: Edit analysis
│   │   │   ├── ProfileEvolutionService.ts # NEW: Score calculation
│   │   │   ├── ArchetypeManagementService.ts # NEW: Personas
│   │   │   ├── CacheService.ts            # NEW: Redis caching
│   │   │   ├── ProfileVersioningService.ts # NEW: Rollback support
│   │   │   ├── AtomicProfileUpdateService.ts # NEW: Concurrency
│   │   │   ├── EditMetadataStorageService.ts # NEW: Edit tracking
│   │   │   ├── VisualSnapshotService.ts   # NEW: Snapshot generation
│   │   │   ├── SnippetSelectionService.ts # NEW: Code snippet selection
│   │   │   ├── ImageRenderingService.ts   # NEW: Code image rendering
│   │   │   └── StorageService.ts          # NEW: Image storage
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts
│   │   │   ├── repositories.ts
│   │   │   ├── content.ts     # Enhanced with save-edits & snapshots
│   │   │   ├── profile.ts     # NEW: Voice profile endpoints
│   │   │   └── snapshots.ts   # NEW: Snapshot endpoints
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
│       ├── personalized-voice-engine/  # NEW: Voice Engine spec
│       │   ├── requirements.md
│       │   ├── design.md
│       │   └── tasks.md
│       └── visual-intelligence-code-snapshot-generator/  # NEW: Visual Intelligence spec
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
- **Puppeteer Dependencies** - Required for Visual Intelligence (Chromium, system libraries)
- **GitHub OAuth App** credentials
- **Google Gemini API** key

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd code-to-content
```

2. **Install Puppeteer dependencies (for Visual Intelligence):**

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

**macOS:**
```bash
# Puppeteer will download Chromium automatically
# No additional dependencies needed
```

**Windows:**
```bash
# Puppeteer will download Chromium automatically
# Ensure Visual C++ Redistributable is installed
```

3. **Install all dependencies:**
```bash
npm run install:all
```

4. **Set up environment variables:**

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
- ✅ Content generation (multi-platform, voice-aware)
- ✅ Voice Engine (learning, profile evolution, archetypes)
- ✅ Visual Intelligence (snapshot generation, image rendering, storage)
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

**Optional (Visual Intelligence):**
```bash
# Image Rendering Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser  # Path to Chromium (auto-detected if omitted)
SNAPSHOT_MAX_SNIPPETS=5               # Max snippets per repository (default: 5)
SNAPSHOT_IMAGE_QUALITY=90             # PNG quality 0-100 (default: 90)
SNAPSHOT_SELECTION_TIMEOUT_MS=5000    # Selection timeout in ms (default: 5000)
SNAPSHOT_RENDERING_TIMEOUT_MS=3000    # Rendering timeout in ms (default: 3000)
SNAPSHOT_PARALLEL_BATCH_SIZE=5        # Parallel AI scoring batch size (default: 5)

# Storage Configuration
SNAPSHOT_STORAGE_TYPE=local           # Storage type: 'local' or 's3' (default: local)
SNAPSHOT_STORAGE_PATH=./uploads/snapshots  # Local storage path (default: ./uploads/snapshots)

# AWS S3 Configuration (if SNAPSHOT_STORAGE_TYPE=s3)
AWS_S3_BUCKET=codetocontent-snapshots # S3 bucket name
AWS_S3_REGION=us-east-1               # S3 region
AWS_ACCESS_KEY_ID=your_access_key     # AWS access key
AWS_SECRET_ACCESS_KEY=your_secret_key # AWS secret key

# Caching Configuration
SNAPSHOT_CACHE_TTL_HOURS=24           # Gemini analysis cache TTL (default: 24)
SNAPSHOT_CLEANUP_AGE_DAYS=30          # Delete unused snapshots after N days (default: 30)
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
- User selects repository
- If user has a Voice Profile, system uses personalized style
- Gemini AI generates platform-specific content
- Content optimized for X: 200-500 characters, concise and engaging
- **First-time users:** Content will be generic until you train your voice profile

### 4. Content Refinement & Learning
- User edits generated content to match their style
- **System learns from your edits** to improve future generations
- AI-powered refinement options:
  - "Shorter" - Reduce length by 30-50%
  - "Clearer" - Simplify language and improve flow
  - "More engaging" - Add hooks and compelling language
- One-click copy to clipboard
- **Each edit improves your voice profile** - expect better results after 5-10 generations

### 5. Visual Intelligence (Code Snapshots)
- User clicks "Generate Snapshots" for a repository
- System analyzes code structure and recent changes
- Gemini AI scores snippets based on:
  - Cyclomatic complexity
  - Architectural centrality
  - Recent additions or refactors
  - Technical patterns and best practices
- Top 5 snippets rendered as beautiful code images
- User clicks "Add Visual" when generating content
- Select snapshot from modal to attach to post
- Generated content includes imageUrl for display
- Snapshots cached and reused until code changes

**Usage Example:**
```
1. Select repository "my-awesome-project"
2. Click "Generate Snapshots" button
3. Wait 10-15 seconds for AI analysis
4. View 5 generated snapshot thumbnails
5. Click "Generate Content" for the repository
6. Click "Add Visual" button
7. Select a snapshot from the modal
8. Preview shows code image attached
9. Generate content with visual included
10. Copy and post to X (Twitter)
```

## 🎙️ Voice Engine Deep Dive

### What is the Voice Engine?

The Voice Engine is an intelligent learning system that transforms CodeToContent into a personalized writing assistant. Instead of generic AI content, it learns your unique voice and generates content that sounds authentically like you.

**Important:** The Voice Engine requires initial setup and ongoing refinement. It's not fully automatic—you guide the AI by providing samples and editing outputs. The payoff is content that genuinely sounds like you, not a generic bot.

### How Voice Learning Works

#### 1. Initial Profile Creation (Optional)

**Three Onboarding Paths:**

**Path A: Quick Start with Samples**
- Paste any writing sample (minimum 300 characters)
- Upload files (.txt, .md, .pdf with minimum 500 characters)
- System extracts style metrics using Gemini AI
- Profile Evolution Score starts at 20-40%

**Path B: Choose a Voice Archetype**
- Select from 3 pre-built personas:
  - **Tech Twitter Influencer**: Casual, direct, emoji-heavy, short sentences
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

**Fallback:** If profile is missing or generation fails, system uses generic generation.

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

**Result:** Your Profile Evolution Score increases, and future content requires less editing. This is a gradual process—expect to invest time upfront for long-term quality gains.

### Voice Archetypes

Pre-built personas for quick-start:

| Archetype | Voice Type | Formality | Enthusiasm | Sentence Length | Emoji Usage |
|-----------|------------|-----------|------------|-----------------|-------------|
| **Tech Twitter Influencer** | Casual | 2/10 | 8/10 | Short (10-15 words) | High (3-5 per post) |
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
- **0-30%**: Early learning phase - provide samples or generate more content (expect significant editing needed)
- **30-70%**: Active learning - profile improving with each edit (still requires review and refinement)
- **70-100%**: Well-trained - content closely matches your voice (minor edits typically needed)

### Voice Strength Control

Adjust how strongly your personal style is applied:

- **0%**: Generic generation (no voice profile)
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

#### Code Snapshots (NEW)
```
POST /api/snapshots/generate          # Generate snapshots for repository
GET  /api/snapshots/:repositoryId     # Get snapshots for repository
GET  /api/snapshots/snapshot/:snapshotId  # Get single snapshot by ID
DELETE /api/snapshots/:snapshotId     # Delete snapshot
```

**Snapshot Generation Request:**
```json
POST /api/snapshots/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "repositoryId": "507f191e810c19729de860ea"
}
```

**Snapshot Generation Response:**
```json
{
  "message": "Snapshots generated successfully",
  "snapshots": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "repositoryId": "507f191e810c19729de860ea",
      "snippetMetadata": {
        "filePath": "src/services/AuthService.ts",
        "startLine": 45,
        "endLine": 68,
        "functionName": "authenticateUser",
        "language": "typescript",
        "linesOfCode": 23
      },
      "selectionScore": 92,
      "selectionReason": "Core authentication logic with JWT token generation",
      "imageUrl": "http://localhost:3001/uploads/snapshots/507f1f77bcf86cd799439011.png",
      "imageSize": 245678,
      "imageDimensions": {
        "width": 1200,
        "height": 800
      },
      "isStale": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Get Snapshots Response:**
```json
GET /api/snapshots/:repositoryId
Authorization: Bearer <jwt_token>

{
  "snapshots": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "selectionScore": 92,
      "imageUrl": "http://localhost:3001/uploads/snapshots/507f1f77bcf86cd799439011.png",
      "snippetMetadata": {
        "filePath": "src/services/AuthService.ts",
        "functionName": "authenticateUser"
      },
      "isStale": false
    }
  ]
}
```

**Error Codes:**
- **400 Bad Request**: Invalid repositoryId format or missing required fields
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User doesn't have access to repository
- **404 Not Found**: Repository or snapshot not found
- **500 Internal Server Error**: Snapshot generation failed (AI unavailable, rendering error, storage error)

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
- Analysis reference, user reference, platform, generated text, edited text, version
- **NEW:** editMetadata - Comprehensive edit tracking for learning
  - originalText, sentenceLengthDelta, emojiChanges, structureChanges
  - toneShift, vocabularyChanges, phrasesAdded, phrasesRemoved
  - editTimestamp, learningProcessed
- **NEW:** Voice metadata - usedStyleProfile, voiceStrengthUsed, evolutionScoreAtGeneration
- **NEW:** snapshotId (optional) - Reference to attached CodeSnapshot

**CodeSnapshot (NEW)**
- Repository reference, analysis reference, user reference
- snippetMetadata - filePath, startLine, endLine, functionName, language, linesOfCode
- selectionScore (0-100), selectionReason
- imageUrl, imageSize, imageDimensions (width, height)
- renderOptions - theme, showLineNumbers, fontSize
- isStale (staleness tracking), lastCommitSha
- createdAt, updatedAt

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
- Existing users without profiles continue using generic generation
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
3. **Existing users continue with generic generation**
4. **No data loss** - styleProfile is optional

The Voice Engine is designed for zero-downtime deployment and graceful degradation.

## 🔧 Troubleshooting

### Visual Intelligence Issues

#### Puppeteer/Chromium Issues

**Problem: "Failed to launch browser" or "Chromium not found"**

**Solution:**
```bash
# Ubuntu/Debian: Install Chromium and dependencies
sudo apt-get update
sudo apt-get install -y chromium-browser

# Set executable path in .env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Or let Puppeteer download Chromium
cd backend
npx puppeteer browsers install chrome
```

**Problem: "Error: Failed to launch the browser process"**

**Solution (Docker):**
```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libappindicator3-1 \
    libasound2

# Run with --no-sandbox flag
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"
```

**Problem: "Navigation timeout exceeded"**

**Solution:**
```bash
# Increase timeout in .env
SNAPSHOT_RENDERING_TIMEOUT_MS=10000  # 10 seconds

# Or check network connectivity
ping google.com
```

#### Storage Issues

**Problem: "Failed to save image" or "ENOENT: no such file or directory"**

**Solution:**
```bash
# Ensure uploads directory exists
mkdir -p backend/uploads/snapshots

# Check permissions
chmod 755 backend/uploads
chmod 755 backend/uploads/snapshots

# Verify in .env
SNAPSHOT_STORAGE_PATH=./uploads/snapshots
```

**Problem: "Image URL returns 404"**

**Solution:**
```bash
# Verify Express static middleware is configured
# Check backend/src/index.ts for:
app.use('/uploads', express.static('uploads'));

# Verify file exists
ls -la backend/uploads/snapshots/
```

**Problem: "S3 upload failed" (when using cloud storage)**

**Solution:**
```bash
# Verify AWS credentials
aws s3 ls s3://your-bucket-name

# Check .env configuration
SNAPSHOT_STORAGE_TYPE=s3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Verify bucket permissions (allow PutObject, GetObject)
```

#### Snapshot Generation Issues

**Problem: "No snapshots generated" or "Empty snapshot list"**

**Solution:**
```bash
# Check repository has analyzable code files
# Supported languages: TypeScript, JavaScript, Python, Go, Java, etc.

# Verify Gemini API key is valid
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models

# Check logs for errors
tail -f backend/logs/error.log

# Try with heuristic fallback (disable AI temporarily)
# System will use file-based scoring
```

**Problem: "Snapshot generation timeout"**

**Solution:**
```bash
# Increase timeout in .env
SNAPSHOT_SELECTION_TIMEOUT_MS=10000  # 10 seconds

# Reduce max snippets for large repos
SNAPSHOT_MAX_SNIPPETS=3

# Check Gemini API rate limits
# Free tier: 60 requests per minute
```

**Problem: "Images are too large (>5MB)"**

**Solution:**
```bash
# Reduce image quality in .env
SNAPSHOT_IMAGE_QUALITY=80  # Lower quality (default: 90)

# Limit code snippet length
# System automatically limits to 100 lines per snippet

# Check image dimensions
# Default: 1200x800 (optimized for X/Twitter)
```

#### Staleness Detection Issues

**Problem: "Snapshots not invalidated after code changes"**

**Solution:**
```bash
# Manually invalidate snapshots
curl -X POST http://localhost:3001/api/snapshots/invalidate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repositoryId": "507f191e810c19729de860ea"}'

# Or delete and regenerate
curl -X DELETE http://localhost:3001/api/snapshots/:snapshotId \
  -H "Authorization: Bearer $JWT_TOKEN"

# Then regenerate
curl -X POST http://localhost:3001/api/snapshots/generate \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"repositoryId": "507f191e810c19729de860ea"}'
```

### Voice Engine Issues

**Problem: "Redis connection failed"**

**Solution:**
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Verify REDIS_URL in .env
REDIS_URL=redis://localhost:6379

# Check Redis logs
redis-cli INFO
```

**Problem: "Learning jobs not processing"**

**Solution:**
```bash
# Verify worker process is running
ps aux | grep worker

# Start worker if not running
cd backend
npm run worker

# Check queue health
curl http://localhost:3001/api/admin/queue-health
```

### General Issues

**Problem: "Gemini API rate limit exceeded"**

**Solution:**
```bash
# Free tier limits:
# - 60 requests per minute
# - 1500 requests per day

# Reduce concurrent operations
LEARNING_QUEUE_CONCURRENCY=2
SNAPSHOT_PARALLEL_BATCH_SIZE=2

# Increase cache TTL to reduce API calls
SNAPSHOT_CACHE_TTL_HOURS=48
PROFILE_CACHE_TTL_SECONDS=7200
```

**Problem: "MongoDB connection timeout"**

**Solution:**
```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Verify MONGODB_URI in .env
MONGODB_URI=mongodb://localhost:27017/code-to-content

# Check network connectivity
ping your-mongodb-host
```

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

### Visual Intelligence Deployment Considerations

#### Infrastructure Requirements

- **Chromium**: Headless browser for rendering (included with Puppeteer)
- **System Libraries**: Font libraries, graphics libraries (see installation section)
- **Storage**: Local filesystem or cloud storage (S3, GCS, Azure Blob)
- **Memory**: 512MB minimum per rendering process
- **Disk Space**: 100MB per 1000 snapshots (estimated)

**Recommended Production Setup:**
- **Cloud Storage**: AWS S3, Google Cloud Storage, or Azure Blob Storage
- **CDN**: CloudFront, Cloud CDN, or Azure CDN for image delivery
- **Container**: Docker with Chromium pre-installed
- **Resource Limits**: Set memory limits to prevent OOM (1GB recommended)

#### Docker Configuration for Visual Intelligence

**Dockerfile:**
```dockerfile
FROM node:18-slim

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build backend
RUN npm run build:backend

# Create uploads directory
RUN mkdir -p backend/uploads/snapshots

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
```

**docker-compose.yml with Visual Intelligence:**
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
    volumes:
      - ./backend/uploads:/app/backend/uploads  # Persist snapshots
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/code-to-content
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
      - SNAPSHOT_STORAGE_TYPE=local
      - SNAPSHOT_STORAGE_PATH=./uploads/snapshots
    depends_on:
      - mongodb
      - redis
    deploy:
      resources:
        limits:
          memory: 1G  # Prevent OOM from Chromium

  worker:
    build: .
    command: node backend/dist/worker.js
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
- **Snapshot generation success rate** (NEW)
- **Average selection time** (NEW - should be < 5s)
- **Average rendering time** (NEW - should be < 3s)
- **Gemini AI fallback rate** (NEW - should be < 10%)
- **Storage usage** (NEW - track disk/S3 usage)
- **Image rendering failures** (NEW - alert if > 5%)
- **Puppeteer crashes** (NEW - alert immediately)

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

## 🎯 Philosophy

CodeToContent is built on the belief that **quality content requires human input**. We don't promise fully automatic content generation—we promise AI assistance that learns from you and gets better over time. You invest time upfront (providing samples, editing outputs) to get authentic, personalized content that sounds like you, not a generic bot.

**Built with ❤️ for developers who want to share their work authentically.**
