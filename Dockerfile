# Multi-stage Dockerfile for CodeToContent - Node 20 (Railway Ready)
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

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
FROM node:20-alpine AS backend-builder

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

# Stage 3: Production Runtime
FROM node:20-alpine

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

# Expose port (Cloud Run uses PORT environment variable, default 8080)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Set working directory to backend
WORKDIR /app/backend

# Start the backend server (which will serve frontend static files)
CMD ["node", "dist/index.js"]
