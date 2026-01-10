# CodeToContent

> **Turn real code into real content—automatically.**

CodeToContent is a developer-first tool that connects to your GitHub repository, analyzes your actual development activity (commits, PRs, diffs), and uses **Gemini 3's long-context reasoning** to generate authentic, high-quality content for X (Twitter), LinkedIn, and technical blogs.

Unlike generic AI writers, CodeToContent adheres to one core principle:
**"If the code didn't happen, the content shouldn't exist."**

---

## ⚡ The Problem

Developers create immense value daily in the form of code, architectural decisions, and problem-solving. However, most of that value remains locked inside GitHub repositories.

*   **Valuable insights remain invisible:** "I shipped a complex refactor but didn't write about why."
*   **Content creation is high-friction:** Translating diffs to English requires time and storytelling skills.
*   **Inconsistency:** Developers want to build a personal brand but struggle to post regularly.

## 🚀 Core Functionality

CodeToContent automates the pipeline from `git push` to "Published":

1.  **GitHub OAuth Integration**: Securely connects to your repositories without storing your code.
2.  **Development Activity Analyzer**: Filters the noise. It identifies *meaningful* events—feature additions, complex bug fixes, and architectural overhauls—while ignoring basic maintenance or distinct commits.
3.  **Insight Extraction Engine**: The core intelligence layer. It doesn't just summarize; it *understands*.
4.  **Multi-Platform Generation**:
    *   **X (Twitter)**: Threads that hook readers and explain technical concepts concisely.
    *   **LinkedIn**: Professional, narrative-driven posts highlighting business value and lessons learned.
    *   **Blog Posts**: Structured outlines or full drafts for deep dives.

---

## 🧠 The Secret Sauce: Gemini 3 Integration

The heart of CodeToContent is **Gemini 3**. Standard LLMs struggle with the nuance of software development because they lack the context window to see the "whole picture."

**Why Gemini 3 is essential:**

*   **Long-Context Reasoning**: Gemini 3 effectively ingests entire commit histories, large diffs across multiple files, and PR comments simultaneously. It can link a change in `api/auth.ts` to a frontend update in `components/Login.tsx` to understand the *full feature*.
*   **Intent Extraction**: It infers *why* a change happened. It distinguishes between a "hacky fix" and a "strategic refactor" by analyzing the code structure itself.
*   **Audience Adaptation**: It translates raw technical logic (e.g., "Switched from polling to WebSockets") into audience-appropriate narratives (e.g., "How we reduced server load by 90% by rethinking our real-time architecture").

**The Pipeline:**
`Raw GitHub Data` → `Gemini 3 Context Window` → `Reasoning & Insight Extraction` → `Draft Content`

---

## 🛠️ Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **Styling**: Vanilla CSS Modules (Clean, dark-themed, no-nonsense)
*   **AI**: Google Gemini 3 API
*   **Auth**: Auth.js (GitHub Provider)

---

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+ installed
*   A GitHub account
*   A Google account (for Gemini API access)
*   PostgreSQL database (or SQLite for local development)

### Environment Setup

CodeToContent requires several environment variables to function. Follow these steps to configure your environment:

#### 1. Copy the Environment Template

```bash
cp .env.example .env
```

#### 2. Configure Required Variables

Open the `.env` file and fill in the following values:

##### **AUTH_SECRET**
A secret key used by NextAuth for session encryption.

Generate a secure random string:
```bash
openssl rand -base64 32
```

Copy the output and set it as your `AUTH_SECRET`.

##### **GITHUB_ID and GITHUB_SECRET**
OAuth credentials for GitHub authentication.

**To obtain these:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: CodeToContent (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for local development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**
5. Copy the **Client ID** and set it as `GITHUB_ID`
6. Click **"Generate a new client secret"**
7. Copy the **Client Secret** and set it as `GITHUB_SECRET`

**Important:** Keep your client secret secure and never commit it to version control.

##### **GEMINI_API_KEY**
API key for Google's Gemini AI service.

**To obtain this:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select a Google Cloud project (or create a new one)
5. Copy the generated API key and set it as `GEMINI_API_KEY`

**Note:** Gemini API usage may incur costs depending on your usage tier. Check [Google's pricing](https://ai.google.dev/pricing) for details.

##### **DATABASE_URL**
Connection string for your database.

**For PostgreSQL (Production):**
```
DATABASE_URL="postgresql://username:password@host:port/database"
```

**For SQLite (Local Development):**
```
DATABASE_URL="file:./dev.db"
```

If you're using a hosted PostgreSQL service (like Supabase, Railway, or Neon), copy the connection string from your database provider's dashboard.

##### **NODE_ENV**
The application environment. Set to:
- `development` for local development
- `production` for production deployments
- `test` for running tests

#### 3. Install Dependencies

```bash
npm install
```

#### 4. Set Up the Database

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev
```

This will create the necessary tables in your database.

#### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Troubleshooting

**Environment validation errors:**
If you see an error about missing environment variables on startup, ensure all required variables in `.env` are set and non-empty.

**Database connection errors:**
- Verify your `DATABASE_URL` is correct
- For PostgreSQL, ensure the database server is running and accessible
- For SQLite, ensure the application has write permissions in the project directory

**GitHub OAuth errors:**
- Verify your callback URL matches exactly: `http://localhost:3000/api/auth/callback/github`
- Ensure your GitHub OAuth app is not suspended
- Check that `GITHUB_ID` and `GITHUB_SECRET` are correct

---

## 🔮 Roadmap

*   [ ] **MVP**: GitHub connection + Single Repo Analysis + Content Generation.
*   [ ] **V2**: User activity dashboard & History.
*   [ ] **Future**: Automated scheduling and "Style Training" (teach Gemini your writing voice).
