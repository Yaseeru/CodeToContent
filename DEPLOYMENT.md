# Deployment Guide

> Comprehensive deployment instructions for CodeToContent with Visual Intelligence

This guide covers deploying CodeToContent to production environments, with special attention to the Visual Intelligence (Code Snapshot Generator) feature which requires Puppeteer/Chromium and additional infrastructure.

## Table of Contents

- [Infrastructure Requirements](#infrastructure-requirements)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Storage Configuration](#storage-configuration)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

## Infrastructure Requirements

### Core Requirements

**Compute Resources:**
- **CPU**: 2+ cores recommended (1 core minimum)
- **Memory**: 2GB minimum, 4GB recommended
  - Base application: ~512MB
  - Puppeteer/Chromium: ~512MB per rendering process
  - Redis: ~100MB
  - MongoDB: ~200MB (if self-hosted)
- **Storage**: 10GB minimum, 50GB+ recommended for snapshots
- **Network**: Outbound HTTPS access for GitHub API, Gemini API

**Runtime Dependencies:**
- **Node.js**: 18+ (LTS recommended)
- **MongoDB**: 4.4+ (Atlas or self-hosted)
- **Redis**: 6.0+ (Cloud or self-hosted)
- **Chromium**: Latest stable (for Puppeteer)

### Visual Intelligence Specific Requirements

**Chromium/Puppeteer Dependencies:**

The Visual Intelligence feature uses Puppeteer to render code snapshots, which requires Chromium and system libraries.

**Ubuntu/Debian:**
```bash
ca-certificates
fonts-liberation
libappindicator3-1
libasound2
libatk-bridge2.0-0
libatk1.0-0
libc6
libcairo2
libcups2
libdbus-1-3
libexpat1
libfontconfig1
libgbm1
libgcc1
libglib2.0-0
libgtk-3-0
libnspr4
libnss3
libpango-1.0-0
libpangocairo-1.0-0
libstdc++6
libx11-6
libx11-xcb1
libxcb1
libxcomposite1
libxcursor1
libxdamage1
libxext6
libxfixes3
libxi6
libxrandr2
libxrender1
libxss1
libxtst6
lsb-release
wget
xdg-utils
```

**Alpine Linux (Docker):**
```bash
chromium
nss
freetype
harfbuzz
ca-certificates
ttf-freefont
```

**Storage Requirements:**
- **Local Storage**: 100MB per 1000 snapshots (estimated)
- **Cloud Storage**: S3/GCS/Azure Blob recommended for production
- **Temporary Files**: 500MB for rendering operations

**Memory Considerations:**
- Each Puppeteer page: ~50-100MB
- Page pool (3 pages): ~150-300MB
- Peak usage during batch generation: ~512MB

## Environment Setup

### Production Environment Variables

Create a production `.env` file with the following configuration:


#### Required Variables

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codetocontent?retryWrites=true&w=majority

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_production_github_client_id
GITHUB_CLIENT_SECRET=your_production_github_client_secret
GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/callback

# JWT Configuration
JWT_SECRET=your_production_jwt_secret_min_64_chars_recommended

# Gemini API Configuration
GEMINI_API_KEY=your_production_gemini_api_key

# Redis Configuration
REDIS_URL=redis://username:password@redis-host:6379

# Server Configuration
PORT=8080
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

#### Visual Intelligence Variables

```bash
# Puppeteer Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true  # Set if using system Chromium

# Snapshot Generation
SNAPSHOT_MAX_SNIPPETS=5
SNAPSHOT_IMAGE_QUALITY=90
SNAPSHOT_SELECTION_TIMEOUT_MS=5000
SNAPSHOT_RENDERING_TIMEOUT_MS=3000
SNAPSHOT_PARALLEL_BATCH_SIZE=5

# Storage Configuration (Choose one)
SNAPSHOT_STORAGE_TYPE=s3  # Options: 'local', 's3', 'gcs', 'azure'

# AWS S3 Configuration (if using S3)
AWS_S3_BUCKET=codetocontent-snapshots-prod
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Google Cloud Storage (if using GCS)
GCS_BUCKET=codetocontent-snapshots-prod
GCS_PROJECT_ID=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Azure Blob Storage (if using Azure)
AZURE_STORAGE_ACCOUNT=youraccountname
AZURE_STORAGE_KEY=your_storage_key
AZURE_CONTAINER_NAME=codetocontent-snapshots

# Caching Configuration
SNAPSHOT_CACHE_TTL_HOURS=24
SNAPSHOT_CLEANUP_AGE_DAYS=30
```

#### Voice Engine Variables (Optional)

```bash
LEARNING_QUEUE_CONCURRENCY=5
LEARNING_RATE_LIMIT_MINUTES=5
EDIT_BATCH_WINDOW_MINUTES=5
PROFILE_CACHE_TTL_SECONDS=3600
EVOLUTION_CACHE_TTL_SECONDS=300
MAX_EDIT_METADATA_PER_USER=50
MAX_PROFILE_VERSIONS=10
GEMINI_TEMPERATURE=0.8
GEMINI_MAX_TOKENS=8000
```

### Environment Variable Validation

The application validates all required environment variables on startup. Missing variables will cause the application to fail fast with clear error messages.

**Validation Script:**
```bash
# Run validation before deployment
cd backend
npm run validate-env
```

## Docker Deployment

### Dockerfile for Puppeteer

The existing Dockerfile needs modifications to support Puppeteer. Create a new `Dockerfile.puppeteer`:


```dockerfile
# Multi-stage Dockerfile for CodeToContent with Puppeteer Support
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend static assets
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install backend dependencies (including dev dependencies for build)
RUN npm ci

# Copy backend source
COPY backend/src ./src

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Runtime with Puppeteer
FROM node:18-bullseye-slim

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
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
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install production dependencies for backend
WORKDIR /app/backend
RUN npm ci --only=production

# Go back to app root
WORKDIR /app

# Copy built backend from builder stage
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directory for local storage
RUN mkdir -p /app/backend/uploads/snapshots && \
    chown -R node:node /app/backend/uploads

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Set working directory to backend
WORKDIR /app/backend

# Start the backend server
CMD ["node", "dist/index.js"]
```

### Docker Compose for Local Testing

Create `docker-compose.yml` for local production testing:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: codetocontent-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: codetocontent

  redis:
    image: redis:7-alpine
    container_name: codetocontent-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  app:
    build:
      context: .
      dockerfile: Dockerfile.puppeteer
    container_name: codetocontent-app
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
      - redis
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/codetocontent
      - REDIS_URL=redis://redis:6379
      - PORT=8080
      - NODE_ENV=production
      # Add other environment variables from .env.production
    env_file:
      - .env.production
    volumes:
      - snapshot_storage:/app/backend/uploads/snapshots
    # Increase shared memory for Chromium
    shm_size: '2gb'

  worker:
    build:
      context: .
      dockerfile: Dockerfile.puppeteer
    container_name: codetocontent-worker
    restart: unless-stopped
    depends_on:
      - mongodb
      - redis
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/codetocontent
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    env_file:
      - .env.production
    command: ["node", "dist/worker.js"]

volumes:
  mongodb_data:
  redis_data:
  snapshot_storage:
```

### Building and Running

```bash
# Build the Docker image
docker build -f Dockerfile.puppeteer -t codetocontent:latest .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Cloud Platform Deployment

### AWS Elastic Beanstalk

**Prerequisites:**
- AWS CLI installed and configured
- Elastic Beanstalk CLI installed

**Steps:**

1. **Initialize Elastic Beanstalk:**
```bash
eb init -p docker codetocontent-app --region us-east-1
```

2. **Create environment:**
```bash
eb create codetocontent-prod \
  --instance-type t3.medium \
  --envvars \
    NODE_ENV=production,\
    MONGODB_URI=$MONGODB_URI,\
    REDIS_URL=$REDIS_URL,\
    GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID,\
    GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET,\
    JWT_SECRET=$JWT_SECRET,\
    GEMINI_API_KEY=$GEMINI_API_KEY,\
    SNAPSHOT_STORAGE_TYPE=s3,\
    AWS_S3_BUCKET=codetocontent-snapshots-prod
```

3. **Deploy:**
```bash
eb deploy
```

4. **Configure Auto Scaling:**
```bash
eb scale 2  # Run 2 instances minimum
```

**Elastic Beanstalk Configuration (.ebextensions/01_packages.config):**
```yaml
packages:
  yum:
    chromium: []
    liberation-fonts: []
```

### Google Cloud Run

**Prerequisites:**
- Google Cloud SDK installed
- Project created with billing enabled

**Steps:**

1. **Build and push to Container Registry:**
```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/codetocontent

# Or use Cloud Build with Dockerfile.puppeteer
gcloud builds submit --config cloudbuild.yaml
```

2. **Deploy to Cloud Run:**
```bash
gcloud run deploy codetocontent \
  --image gcr.io/YOUR_PROJECT_ID/codetocontent \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --concurrency 80 \
  --min-instances 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars MONGODB_URI=$MONGODB_URI \
  --set-env-vars REDIS_URL=$REDIS_URL \
  --set-env-vars SNAPSHOT_STORAGE_TYPE=gcs \
  --set-env-vars GCS_BUCKET=codetocontent-snapshots-prod \
  --allow-unauthenticated
```

3. **Set secrets (recommended for sensitive data):**
```bash
# Create secrets
echo -n "$GITHUB_CLIENT_SECRET" | gcloud secrets create github-client-secret --data-file=-
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Grant access to Cloud Run service
gcloud secrets add-iam-policy-binding github-client-secret \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor

# Update deployment to use secrets
gcloud run services update codetocontent \
  --update-secrets=GITHUB_CLIENT_SECRET=github-client-secret:latest,\
JWT_SECRET=jwt-secret:latest,\
GEMINI_API_KEY=gemini-api-key:latest
```

**cloudbuild.yaml:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'Dockerfile.puppeteer', '-t', 'gcr.io/$PROJECT_ID/codetocontent', '.']
images:
  - 'gcr.io/$PROJECT_ID/codetocontent'
```

### Azure Container Instances

**Prerequisites:**
- Azure CLI installed and logged in

**Steps:**

1. **Create resource group:**
```bash
az group create --name codetocontent-rg --location eastus
```

2. **Create container registry:**
```bash
az acr create --resource-group codetocontent-rg \
  --name codetocontent --sku Basic
```

3. **Build and push image:**
```bash
az acr build --registry codetocontent \
  --image codetocontent:latest \
  --file Dockerfile.puppeteer .
```

4. **Deploy container:**
```bash
az container create \
  --resource-group codetocontent-rg \
  --name codetocontent-app \
  --image codetocontent.azurecr.io/codetocontent:latest \
  --cpu 2 \
  --memory 4 \
  --registry-login-server codetocontent.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label codetocontent \
  --ports 8080 \
  --environment-variables \
    NODE_ENV=production \
    MONGODB_URI=$MONGODB_URI \
    REDIS_URL=$REDIS_URL \
    SNAPSHOT_STORAGE_TYPE=azure \
    AZURE_STORAGE_ACCOUNT=$AZURE_STORAGE_ACCOUNT \
  --secure-environment-variables \
    GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET \
    JWT_SECRET=$JWT_SECRET \
    GEMINI_API_KEY=$GEMINI_API_KEY \
    AZURE_STORAGE_KEY=$AZURE_STORAGE_KEY
```

### Heroku

**Prerequisites:**
- Heroku CLI installed and logged in

**Steps:**

1. **Create Heroku app:**
```bash
heroku create codetocontent-prod
```

2. **Add buildpacks:**
```bash
heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack
heroku buildpacks:add --index 2 heroku/nodejs
```

3. **Add add-ons:**
```bash
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev
```

4. **Set environment variables:**
```bash
heroku config:set \
  NODE_ENV=production \
  GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID \
  GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET \
  JWT_SECRET=$JWT_SECRET \
  GEMINI_API_KEY=$GEMINI_API_KEY \
  SNAPSHOT_STORAGE_TYPE=s3 \
  AWS_S3_BUCKET=codetocontent-snapshots-prod \
  AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
```

5. **Deploy:**
```bash
git push heroku main
```

6. **Scale dynos:**
```bash
heroku ps:scale web=2:standard-2x worker=1:standard-1x
```

## Storage Configuration

### Local Storage (Development/Testing Only)

**Configuration:**
```bash
SNAPSHOT_STORAGE_TYPE=local
SNAPSHOT_STORAGE_PATH=./uploads/snapshots
```

**Setup:**
```bash
mkdir -p backend/uploads/snapshots
chmod 755 backend/uploads/snapshots
```

**Pros:**
- Simple setup
- No external dependencies
- No additional costs

**Cons:**
- Not scalable
- Lost on container restart
- No CDN distribution
- Not suitable for production

### AWS S3 (Recommended for Production)

**Configuration:**
```bash
SNAPSHOT_STORAGE_TYPE=s3
AWS_S3_BUCKET=codetocontent-snapshots-prod
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Setup:**

1. **Create S3 bucket:**
```bash
aws s3 mb s3://codetocontent-snapshots-prod --region us-east-1
```

2. **Configure bucket policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::codetocontent-snapshots-prod/*"
    }
  ]
}
```

3. **Enable CORS:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. **Configure lifecycle policy (optional):**
```json
{
  "Rules": [
    {
      "Id": "DeleteOldSnapshots",
      "Status": "Enabled",
      "Prefix": "",
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
```

5. **Create IAM user with S3 access:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::codetocontent-snapshots-prod",
        "arn:aws:s3:::codetocontent-snapshots-prod/*"
      ]
    }
  ]
}
```

**Pros:**
- Highly scalable
- Automatic CDN via CloudFront
- Durable (99.999999999%)
- Cost-effective
- Lifecycle management

**Cons:**
- Requires AWS account
- Additional configuration
- Costs scale with usage

### Google Cloud Storage

**Configuration:**
```bash
SNAPSHOT_STORAGE_TYPE=gcs
GCS_BUCKET=codetocontent-snapshots-prod
GCS_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Setup:**

1. **Create bucket:**
```bash
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l US gs://codetocontent-snapshots-prod/
```

2. **Make bucket public:**
```bash
gsutil iam ch allUsers:objectViewer gs://codetocontent-snapshots-prod
```

3. **Configure CORS:**
```json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
gsutil cors set cors.json gs://codetocontent-snapshots-prod
```

4. **Create service account:**
```bash
gcloud iam service-accounts create codetocontent-storage \
  --display-name="CodeToContent Storage Service Account"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:codetocontent-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=codetocontent-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**Pros:**
- Integrates with Google Cloud ecosystem
- Automatic CDN via Cloud CDN
- Competitive pricing
- Strong consistency

**Cons:**
- Requires GCP account
- Service account key management

### Azure Blob Storage

**Configuration:**
```bash
SNAPSHOT_STORAGE_TYPE=azure
AZURE_STORAGE_ACCOUNT=youraccountname
AZURE_STORAGE_KEY=your_storage_key
AZURE_CONTAINER_NAME=codetocontent-snapshots
```

**Setup:**

1. **Create storage account:**
```bash
az storage account create \
  --name codetocontent \
  --resource-group codetocontent-rg \
  --location eastus \
  --sku Standard_LRS
```

2. **Create container:**
```bash
az storage container create \
  --name codetocontent-snapshots \
  --account-name codetocontent \
  --public-access blob
```

3. **Configure CORS:**
```bash
az storage cors add \
  --services b \
  --methods GET HEAD \
  --origins https://yourdomain.com \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name codetocontent
```

4. **Get access key:**
```bash
az storage account keys list \
  --account-name codetocontent \
  --resource-group codetocontent-rg
```

**Pros:**
- Integrates with Azure ecosystem
- Azure CDN available
- Competitive pricing

**Cons:**
- Requires Azure account
- Key management required

## Monitoring & Health Checks

### Health Check Endpoints

The application exposes health check endpoints:

```bash
# Main application health
GET /health
Response: { "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" }

# Worker health (if running separately)
GET /worker/health
Response: { "status": "ok", "worker": "running" }

# Database connectivity
GET /health/db
Response: { "mongodb": "connected", "redis": "connected" }
```

### Monitoring Metrics

**Application Metrics:**
- Request rate and latency
- Error rate by endpoint
- Active connections
- Memory usage
- CPU usage

**Visual Intelligence Metrics:**
- Snapshot generation success rate
- Average selection time
- Average rendering time
- Gemini AI fallback rate
- Storage usage
- Cache hit rate
- Puppeteer page pool utilization

**Voice Engine Metrics:**
- Learning job queue length
- Learning job processing time
- Profile cache hit rate
- Edit metadata storage rate

### Logging

**Log Levels:**
- `error`: Critical errors requiring immediate attention
- `warn`: Warning conditions (fallbacks, retries)
- `info`: Informational messages (startup, shutdown)
- `debug`: Detailed debugging information (development only)

**Production Logging:**
```bash
# Set log level
NODE_ENV=production
LOG_LEVEL=info

# Structured JSON logging recommended
LOG_FORMAT=json
```

**Log Aggregation:**
- AWS CloudWatch Logs
- Google Cloud Logging
- Azure Monitor
- Datadog
- New Relic
- Sentry (for error tracking)

### Alerting

**Critical Alerts:**
- Application down (health check fails)
- Database connection lost
- Redis connection lost
- High error rate (>5%)
- High memory usage (>90%)
- Disk space low (<10%)

**Warning Alerts:**
- Gemini AI fallback rate high (>20%)
- Snapshot generation failures (>10%)
- Slow response times (>3s p95)
- Queue backlog growing

## Troubleshooting

### Common Issues

#### 1. Puppeteer/Chromium Issues

**Problem:** `Error: Failed to launch the browser process`

**Solutions:**

**Missing dependencies:**
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# Alpine (Docker)
apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Verify Chromium installation
which chromium-browser
chromium-browser --version
```

**Insufficient shared memory:**
```bash
# Docker: Add to docker-compose.yml
shm_size: '2gb'

# Or mount /dev/shm
volumes:
  - /dev/shm:/dev/shm
```

**Permissions issues:**
```bash
# Run as non-root user
USER node

# Or set sandbox flags
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox
```

**Problem:** `Error: Protocol error (Target.setDiscoverTargets): Target closed`

**Solutions:**
- Increase memory allocation (minimum 2GB)
- Reduce concurrent rendering operations
- Check for memory leaks in page pool
- Restart Puppeteer browser instance

#### 2. Storage Issues

**Problem:** `Error: Failed to upload image to S3`

**Solutions:**

**Check credentials:**
```bash
# Test AWS credentials
aws s3 ls s3://codetocontent-snapshots-prod

# Verify IAM permissions
aws iam get-user
```

**Check bucket policy:**
```bash
aws s3api get-bucket-policy --bucket codetocontent-snapshots-prod
```

**Check CORS configuration:**
```bash
aws s3api get-bucket-cors --bucket codetocontent-snapshots-prod
```

**Problem:** `Error: Local storage path not writable`

**Solutions:**
```bash
# Check directory permissions
ls -la backend/uploads/snapshots

# Fix permissions
chmod 755 backend/uploads/snapshots
chown -R node:node backend/uploads
```

#### 3. Memory Issues

**Problem:** `JavaScript heap out of memory`

**Solutions:**

**Increase Node.js memory:**
```bash
# Set in package.json or command
NODE_OPTIONS=--max-old-space-size=4096 node dist/index.js
```

**Optimize Puppeteer:**
```bash
# Reduce page pool size
PUPPETEER_MAX_PAGES=2

# Close pages after use
# Implement in ImageRenderingService
```

**Monitor memory usage:**
```bash
# Inside container
docker stats codetocontent-app

# Node.js process
node --expose-gc dist/index.js
```

#### 4. Performance Issues

**Problem:** Slow snapshot generation (>10 seconds)

**Solutions:**

**Check Gemini API latency:**
```bash
# Monitor API response times
# Consider caching analysis results
SNAPSHOT_CACHE_TTL_HOURS=24
```

**Optimize rendering:**
```bash
# Reduce image quality
SNAPSHOT_IMAGE_QUALITY=80

# Reduce timeout
SNAPSHOT_RENDERING_TIMEOUT_MS=2000
```

**Use parallel processing:**
```bash
# Increase batch size
SNAPSHOT_PARALLEL_BATCH_SIZE=10
```

**Problem:** High CPU usage

**Solutions:**
- Reduce concurrent Puppeteer instances
- Implement request queuing
- Scale horizontally (add more instances)
- Use CDN for image serving

#### 5. Database Issues

**Problem:** `MongoNetworkError: connection timed out`

**Solutions:**

**Check connection string:**
```bash
# Test MongoDB connection
mongosh "$MONGODB_URI"
```

**Check network access:**
```bash
# MongoDB Atlas: Add IP to whitelist
# Self-hosted: Check firewall rules
```

**Increase connection pool:**
```typescript
// In database.ts
mongoose.connect(uri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

**Problem:** `Redis connection refused`

**Solutions:**

**Check Redis connectivity:**
```bash
redis-cli -h redis-host -p 6379 ping
```

**Check Redis configuration:**
```bash
# Verify REDIS_URL format
redis://username:password@host:port

# Test connection
redis-cli -u "$REDIS_URL" ping
```

#### 6. GitHub API Issues

**Problem:** `API rate limit exceeded`

**Solutions:**

**Use authenticated requests:**
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour

**Implement caching:**
```bash
# Cache repository data
GITHUB_CACHE_TTL_HOURS=1
```

**Check rate limit status:**
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit
```

#### 7. Gemini API Issues

**Problem:** `Error: Gemini API quota exceeded`

**Solutions:**

**Implement fallback:**
```bash
# System automatically falls back to heuristic selection
# Monitor fallback rate
```

**Optimize API usage:**
```bash
# Cache analysis results
SNAPSHOT_CACHE_TTL_HOURS=24

# Reduce max snippets
SNAPSHOT_MAX_SNIPPETS=3
```

**Check quota:**
- Visit [Google AI Studio](https://aistudio.google.com/)
- Check API usage dashboard
- Request quota increase if needed

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Backend
DEBUG=codetocontent:* npm start

# Puppeteer
DEBUG=puppeteer:* npm start

# All
DEBUG=* npm start
```

### Support Resources

**Documentation:**
- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)
- [Redis Documentation](https://redis.io/docs/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

**Community:**
- GitHub Issues: [Report bugs and request features]
- Discord/Slack: [Community support channel]

### Performance Benchmarks

**Expected Performance (2 CPU, 4GB RAM):**
- Snapshot generation: 10-15 seconds for 5 snippets
- Image rendering: 2-3 seconds per snippet
- Content generation: 2-4 seconds with voice profile
- API response time: <500ms (p95)
- Concurrent users: 50-100 simultaneous requests

**Scaling Guidelines:**
- 100 users: 1 instance (2 CPU, 4GB RAM)
- 500 users: 3-5 instances with load balancer
- 1000+ users: Auto-scaling group (5-20 instances)

---

## Quick Start Checklist

- [ ] Install Chromium and dependencies
- [ ] Configure MongoDB (Atlas or self-hosted)
- [ ] Configure Redis (Cloud or self-hosted)
- [ ] Set up storage (S3/GCS/Azure)
- [ ] Create GitHub OAuth app
- [ ] Get Gemini API key
- [ ] Set all environment variables
- [ ] Build Docker image with Puppeteer support
- [ ] Deploy to cloud platform
- [ ] Configure health checks and monitoring
- [ ] Test snapshot generation
- [ ] Set up alerting
- [ ] Configure auto-scaling (if needed)

## Next Steps

After successful deployment:

1. **Monitor application health** using health check endpoints
2. **Review logs** for errors and warnings
3. **Test Visual Intelligence** by generating snapshots
4. **Configure CDN** for image serving (CloudFront/Cloud CDN)
5. **Set up backup strategy** for MongoDB and Redis
6. **Implement CI/CD pipeline** for automated deployments
7. **Configure SSL/TLS** for HTTPS
8. **Set up domain and DNS** records
9. **Enable monitoring and alerting**
10. **Document runbooks** for common operations

For additional support, refer to the main [README.md](README.md) or open an issue on GitHub.
