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

*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript 5
*   **Styling**: Tailwind CSS v4 with custom design system
*   **Theme**: Dark/Light mode with next-themes
*   **AI**: Google Gemini 3 API
*   **Auth**: Auth.js (GitHub Provider)
*   **Database**: Prisma ORM with PostgreSQL

---

---

## 🎨 Design System

CodeToContent features a comprehensive design system with:

### Theme System
- **Dark/Light Mode**: Seamless theme switching with automatic persistence
- **System Preference Detection**: Automatically detects and applies browser preference
- **No FOUC**: Prevents flash of unstyled content on page load
- **Smooth Transitions**: 200ms color transitions with reduced-motion support

### Design Tokens
All colors, typography, and spacing are defined as CSS variables that automatically switch between themes:

**Dark Theme** (Default)
- Background: `#121926` (blue-tinted dark)
- Accent: `#4DA1FF` (bright blue)
- Professional developer-focused aesthetic

**Light Theme**
- Background: `#FFFFFF` (clean white)
- Accent: `#2563EB` (blue)
- WCAG AA compliant contrast ratios

### Component Library
- **Button**: 3 variants (primary, secondary, ghost), 3 sizes, loading states
- **Card**: Interactive, outlined, and default variants with hover effects
- **Input**: Focus states, disabled states, proper ARIA labels
- **Icons**: 17+ professional line icons (no emojis)

### Typography Scale
- H1: 36px (page titles)
- H2: 28px (section headings)
- H3: 22px (subsections)
- Body: 16px (content)
- Caption: 14px (metadata)

### Responsive Design
- **Mobile**: <768px (single column, overlay sidebar)
- **Tablet**: 768-1024px (2 columns, collapsed sidebar)
- **Desktop**: >1024px (3 columns, expanded sidebar)

### Accessibility
- WCAG AA compliant contrast ratios
- Full keyboard navigation support
- Screen reader optimized with ARIA labels
- Semantic HTML throughout
- Respects `prefers-reduced-motion`

**📚 Full Documentation**: See [Design System Guide](docs/DESIGN_SYSTEM.md) for complete usage instructions.

### Documentation

- **[Design System Guide](docs/DESIGN_SYSTEM.md)**: Complete design system documentation with examples
- **[Quick Start Guide](docs/QUICK_START.md)**: Quick reference for common patterns
- **[Component API Reference](docs/COMPONENT_API.md)**: Detailed API documentation for all components
- **[Migration Guide](docs/MIGRATION_GUIDE.md)**: Guide for migrating existing code to the design system

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

For more details on database migrations, see the [Database Migrations](#database-migrations) section below.

#### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 📦 Database Migrations

CodeToContent uses Prisma for database management and migrations. Migrations are version-controlled changes to your database schema that ensure consistency across development, staging, and production environments.

### Understanding Migrations

Migrations are stored in the `prisma/migrations/` directory. Each migration:
- Has a timestamp-based folder name (e.g., `20260110130413_initial`)
- Contains a `migration.sql` file with the SQL commands to apply the changes
- Is tracked by Prisma to know which migrations have been applied

### Development Workflow

#### Creating a New Migration

When you modify the Prisma schema (`prisma/schema.prisma`), you need to create a migration:

```bash
npx prisma migrate dev --name descriptive_name
```

This command will:
1. Generate a new migration file based on your schema changes
2. Apply the migration to your development database
3. Regenerate the Prisma Client with the updated types

**Example:**
```bash
# After adding a new field to the User model
npx prisma migrate dev --name add_user_bio_field
```

#### Viewing Migration Status

To see which migrations have been applied:

```bash
npx prisma migrate status
```

#### Resetting the Database (Development Only)

To reset your development database and reapply all migrations:

```bash
npx prisma migrate reset
```

⚠️ **Warning:** This will delete all data in your database!

### Production Deployment

#### Applying Migrations in Production

In production environments, use the `deploy` command instead of `dev`:

```bash
npx prisma migrate deploy
```

This command:
- Applies all pending migrations
- Does NOT create new migrations
- Does NOT reset the database
- Is safe for production use

**Deployment Checklist:**
1. Commit your migration files to version control
2. Deploy your application code
3. Run `npx prisma migrate deploy` on the production server
4. Restart your application

#### Automated Deployment

You can add migration deployment to your CI/CD pipeline:

```yaml
# Example for GitHub Actions
- name: Apply database migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

#### Schema Verification

The application automatically verifies that the database schema matches the Prisma schema on startup in production mode. If migrations haven't been applied, the application will:
- Log an error message
- Exit with a non-zero status code
- Display a helpful message about running `npx prisma migrate deploy`

This prevents the application from running with an outdated schema.

### Common Migration Scenarios

#### Adding a New Table

1. Add the model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_new_table`
3. Commit the migration files

#### Adding a New Field

1. Add the field to the model in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Commit the migration files

#### Modifying an Existing Field

1. Update the field in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name modify_field_name`
3. Review the generated SQL to ensure data isn't lost
4. Commit the migration files

⚠️ **Caution:** Some schema changes (like changing a field type) may require data migration. Review the generated SQL carefully.

#### Rolling Back a Migration

Prisma doesn't have a built-in rollback command. To undo a migration:

1. **Development:** Use `npx prisma migrate reset` to reset and reapply all migrations except the one you want to remove
2. **Production:** Create a new migration that reverses the changes

**Best Practice:** Test migrations thoroughly in development before deploying to production.

### Troubleshooting Migrations

**"Migration failed to apply"**
- Check that your database is accessible
- Verify the SQL in the migration file is valid
- Check for conflicts with existing data

**"Database schema is out of sync"**
- Run `npx prisma migrate deploy` to apply pending migrations
- Check that all migration files are present in `prisma/migrations/`

**"Can't reach database server"**
- Verify your `DATABASE_URL` is correct
- Check that your database server is running
- For Supabase, ensure you're using the direct connection URL (not the pooler) for migrations

---

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
