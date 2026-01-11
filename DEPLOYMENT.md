# CodeToContent Deployment Guide

This guide covers local development setup and deployment to Google Cloud Run.

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Google Cloud Run Deployment](#google-cloud-run-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)

---

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- GitHub OAuth App credentials
- Google Gemini API key

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd code-to-content

# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### Step 2: Configure Environment Variables

#### Backend Configuration

Create `backend/.env` file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/code-to-content

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration

Create `frontend/.env` file:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` with your values:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# GitHub OAuth Configuration
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### Step 3: Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev
```

This will start:
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:3000`

### Step 4: Verify Setup

1. Open `http://localhost:3000` in your browser
2. Click "Continue with GitHub" to test OAuth flow
3. Check backend health: `http://localhost:3001/health`

---

## Environment Variables

### Required Environment Variables

#### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/code-to-content` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | `abc123def456` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | `secret_key_here` |
| `GITHUB_CALLBACK_URL` | OAuth callback URL | `https://your-app.run.app/auth/callback` |
| `JWT_SECRET` | Secret key for JWT signing | `random_secure_string` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `PORT` | Server port (Cloud Run uses 8080) | `8080` |
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.run.app` |

#### Frontend (Build-time)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-app.run.app/api` |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | `abc123def456` |

**Note:** Frontend environment variables are embedded at build time. For Cloud Run deployment, these are set during the Docker build process.

### Obtaining API Keys

#### GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: `CodeToContent`
   - Homepage URL: Your app URL
   - Authorization callback URL: `https://your-app.run.app/auth/callback`
4. Save the Client ID and Client Secret

#### Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for use in environment variables

#### MongoDB Atlas (for production)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string from "Connect" → "Connect your application"
4. Format: `mongodb+srv://username:password@cluster.mongodb.net/code-to-content`

---

## Google Cloud Run Deployment

### Prerequisites

- Google Cloud account with billing enabled
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
- Docker installed locally (optional, for local testing)

### Step 1: Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create code-to-content-prod --name="CodeToContent"

# Set the project
gcloud config set project code-to-content-prod

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 2: Configure Environment Variables for Cloud Run

Create a file `env.yaml` with your production environment variables:

```yaml
MONGODB_URI: "mongodb+srv://username:password@cluster.mongodb.net/code-to-content"
GITHUB_CLIENT_ID: "your_github_client_id"
GITHUB_CLIENT_SECRET: "your_github_client_secret"
GITHUB_CALLBACK_URL: "https://your-app.run.app/auth/callback"
JWT_SECRET: "your_production_jwt_secret"
GEMINI_API_KEY: "your_gemini_api_key"
PORT: "8080"
NODE_ENV: "production"
FRONTEND_URL: "https://your-app.run.app"
VITE_API_URL: "https://your-app.run.app/api"
VITE_GITHUB_CLIENT_ID: "your_github_client_id"
```

**Important:** Add `env.yaml` to `.gitignore` to avoid committing secrets.

### Step 3: Build and Deploy

#### Option A: Deploy with Cloud Build (Recommended)

```bash
# Deploy directly from source
gcloud run deploy code-to-content \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

#### Option B: Build Docker Image Locally and Deploy

```bash
# Set your project ID
PROJECT_ID=$(gcloud config get-value project)

# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/code-to-content:latest .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/code-to-content:latest

# Deploy to Cloud Run
gcloud run deploy code-to-content \
  --image gcr.io/$PROJECT_ID/code-to-content:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

### Step 4: Get Deployment URL

After deployment completes, Cloud Run will provide a URL:

```bash
# Get the service URL
gcloud run services describe code-to-content \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

Example output: `https://code-to-content-abc123-uc.a.run.app`

---

## Post-Deployment Configuration

### Update GitHub OAuth Callback URL

1. Go to your GitHub OAuth App settings
2. Update the Authorization callback URL to: `https://your-actual-url.run.app/auth/callback`
3. Save changes

### Update Environment Variables

If you need to update environment variables after deployment:

```bash
# Update a single variable
gcloud run services update code-to-content \
  --region us-central1 \
  --update-env-vars GEMINI_API_KEY=new_key

# Or update from file
gcloud run services update code-to-content \
  --region us-central1 \
  --env-vars-file env.yaml
```

### View Logs

```bash
# Stream logs
gcloud run services logs tail code-to-content \
  --region us-central1

# View recent logs
gcloud run services logs read code-to-content \
  --region us-central1 \
  --limit 50
```

### Monitor Service

```bash
# Get service details
gcloud run services describe code-to-content \
  --region us-central1

# List all revisions
gcloud run revisions list \
  --service code-to-content \
  --region us-central1
```

---

## Testing the Deployment

### Health Check

```bash
curl https://your-app.run.app/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "CodeToContent API is running"
}
```

### Full Application Test

1. Visit `https://your-app.run.app`
2. Click "Continue with GitHub"
3. Complete OAuth flow
4. Select a repository
5. Generate content

---

## Troubleshooting

### Common Issues

#### 1. Container fails to start

**Symptom:** Service shows "Revision failed"

**Solution:**
- Check logs: `gcloud run services logs tail code-to-content --region us-central1`
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is accessible from Cloud Run

#### 2. OAuth callback fails

**Symptom:** "Redirect URI mismatch" error

**Solution:**
- Verify `GITHUB_CALLBACK_URL` matches the URL in GitHub OAuth App settings
- Ensure the callback URL uses the correct Cloud Run domain

#### 3. Frontend not loading

**Symptom:** 404 errors or blank page

**Solution:**
- Verify frontend was built correctly in Docker image
- Check that `NODE_ENV=production` is set
- Ensure static files are being served from correct path

#### 4. API requests failing

**Symptom:** CORS errors or 500 responses

**Solution:**
- Verify `FRONTEND_URL` environment variable is set correctly
- Check that API routes are properly mounted
- Review backend logs for specific errors

### Local Docker Testing

Test the Docker image locally before deploying:

```bash
# Build the image
docker build -t code-to-content:local .

# Run with environment variables
docker run -p 8080:8080 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e GITHUB_CLIENT_ID="your_client_id" \
  -e GITHUB_CLIENT_SECRET="your_client_secret" \
  -e JWT_SECRET="your_jwt_secret" \
  -e GEMINI_API_KEY="your_gemini_key" \
  -e NODE_ENV="production" \
  -e PORT="8080" \
  code-to-content:local

# Test
curl http://localhost:8080/health
```

---

## Scaling and Performance

### Auto-scaling Configuration

Cloud Run automatically scales based on traffic. Adjust settings:

```bash
gcloud run services update code-to-content \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80
```

### Resource Allocation

Adjust memory and CPU based on load:

```bash
gcloud run services update code-to-content \
  --region us-central1 \
  --memory 1Gi \
  --cpu 2
```

---

## Security Best Practices

1. **Never commit secrets:** Use `.gitignore` for `.env` and `env.yaml` files
2. **Rotate secrets regularly:** Update JWT_SECRET, API keys periodically
3. **Use Secret Manager:** For production, consider Google Secret Manager:
   ```bash
   gcloud run services update code-to-content \
     --region us-central1 \
     --update-secrets GEMINI_API_KEY=gemini-key:latest
   ```
4. **Enable HTTPS only:** Cloud Run enforces HTTPS by default
5. **Restrict CORS:** Set specific `FRONTEND_URL` instead of wildcard

---

## Cost Optimization

Cloud Run pricing is based on:
- Request count
- CPU and memory allocation
- Execution time

To optimize costs:
1. Set `--min-instances 0` to scale to zero when idle
2. Use appropriate memory/CPU (start with 512Mi/1 CPU)
3. Set reasonable `--timeout` (default 300s)
4. Monitor usage in Google Cloud Console

---

## Support and Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
