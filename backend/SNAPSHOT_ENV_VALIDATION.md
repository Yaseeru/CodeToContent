# Snapshot Environment Variable Validation

This document describes the environment variable validation for the Visual Intelligence (Code Snapshot Generator) feature.

## Overview

The snapshot feature requires several environment variables for configuration. These variables are validated at application startup to ensure proper configuration and fail fast if issues are detected.

## Required Environment Variables

The following variables are **required** for the application to start:

- `MONGODB_URI` - MongoDB connection string
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `JWT_SECRET` - Secret key for JWT token signing
- `GEMINI_API_KEY` - Google Gemini AI API key
- `REDIS_URL` - Redis connection URL

## Snapshot Configuration Variables

All snapshot-related variables are **optional** and have sensible defaults. They are documented in `.env.example`.

### Storage Configuration

| Variable | Default | Valid Values | Description |
|----------|---------|--------------|-------------|
| `SNAPSHOT_STORAGE_TYPE` | `local` | `local`, `s3`, `gcs`, `azure` | Storage backend type |
| `SNAPSHOT_STORAGE_PATH` | `uploads/snapshots` | Relative path | Local storage path (must be relative, no `..` or leading `/`) |

### Image Rendering Configuration

| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `SNAPSHOT_MAX_SNIPPETS` | `5` | 1-20 | Maximum snippets per repository |
| `SNAPSHOT_IMAGE_QUALITY` | `90` | 1-100 | PNG compression quality |
| `SNAPSHOT_MAX_IMAGE_SIZE_MB` | `5` | 1-50 | Maximum image size in MB |

### Performance Configuration

| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `SNAPSHOT_SELECTION_TIMEOUT_MS` | `5000` | 1000-30000 | Snippet selection timeout |
| `SNAPSHOT_RENDERING_TIMEOUT_MS` | `3000` | 1000-10000 | Image rendering timeout per snippet |
| `SNAPSHOT_PARALLEL_BATCH_SIZE` | `5` | 1-10 | Parallel processing batch size |

### Caching Configuration

| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `SNAPSHOT_CACHE_TTL_HOURS` | `24` | 1-168 | Cache TTL for AI analysis results |
| `SNAPSHOT_CLEANUP_AGE_DAYS` | `30` | 1-365 | Delete unused snapshots older than N days |

### Rate Limiting Configuration

| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `SNAPSHOT_MAX_PER_USER` | `50` | 1-1000 | Maximum active snapshots per user |
| `SNAPSHOT_RATE_LIMIT_PER_HOUR` | `5` | 1-100 | Max generations per repository per hour |

### Puppeteer Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PUPPETEER_EXECUTABLE_PATH` | (auto-detected) | Custom Chromium executable path (optional) |

### AWS S3 Configuration

Required only when `SNAPSHOT_STORAGE_TYPE=s3`:

| Variable | Required | Format | Description |
|----------|----------|--------|-------------|
| `AWS_S3_BUCKET` | Yes | 3-63 chars, lowercase, alphanumeric | S3 bucket name |
| `AWS_S3_REGION` | Yes | `xx-xxxx-N` (e.g., `us-east-1`) | AWS region |
| `AWS_ACCESS_KEY_ID` | No* | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | No* | - | AWS secret key |

\* If not provided, the application will attempt to use IAM role or instance profile credentials.

## Validation Rules

### Storage Type Validation

- Must be one of: `local`, `s3`, `gcs`, `azure`
- Invalid values will cause startup failure

### Storage Path Validation

- Must be a relative path (no leading `/`)
- Must not contain `..` (path traversal prevention)
- Must not be empty or whitespace-only

### Numeric Value Validation

- All numeric values must be valid integers
- Values outside the recommended range will generate warnings but won't prevent startup
- Non-numeric values will cause startup failure

### S3 Configuration Validation

When `SNAPSHOT_STORAGE_TYPE=s3`:

- `AWS_S3_BUCKET` is required and must match S3 bucket naming rules
- `AWS_S3_REGION` is required and must match AWS region format
- Missing credentials will generate a warning (IAM role fallback)

### Puppeteer Path Validation

- If provided, must not be empty or whitespace-only
- If not provided, Puppeteer will auto-detect the Chromium executable

## Validation Behavior

### Startup Validation

The `validateEnvironmentVariables()` function is called during application startup:

1. **Required variables**: Missing required variables cause immediate exit with code 1
2. **Snapshot configuration errors**: Invalid snapshot configuration causes exit with code 1
3. **Snapshot configuration warnings**: Out-of-range values generate warnings but allow startup

### Error Messages

Validation errors include:
- List of all validation issues
- Help text pointing to `.env.example`
- Troubleshooting steps

Example error output:
```
[ERROR] ✗ Snapshot configuration errors
{
  "errors": [
    "SNAPSHOT_STORAGE_TYPE must be one of: local, s3, gcs, azure (got: invalid)",
    "SNAPSHOT_STORAGE_PATH must not contain \"..\" (path traversal attempt)",
    "SNAPSHOT_MAX_SNIPPETS must be a valid number (got: not-a-number)"
  ],
  "help": "Check .env.example for valid configuration values",
  "troubleshooting": [
    "1. Review SNAPSHOT_* variables in .env file",
    "2. Ensure all values match the expected format",
    "3. For S3 storage, verify AWS credentials and bucket configuration",
    "4. Check that numeric values are within valid ranges"
  ]
}
```

## Testing

### Unit Tests

Run unit tests for validation logic:
```bash
cd backend
npm test -- validateEnv.test.ts
```

### Manual Testing

Test different storage configurations:
```bash
# Test local storage
node test-env-validation.js local

# Test S3 storage
node test-env-validation.js s3

# Test invalid configuration (should fail)
node test-env-validation-invalid.js

# Test Puppeteer configuration
node test-puppeteer-config.js
```

### Verification Script

Verify all snapshot variables are documented:
```bash
node verify-snapshot-env-vars.js
```

This script checks:
- All variables in `snapshotConfig.ts` are in `.env.example`
- All AWS S3 variables are documented
- Puppeteer configuration is present

## Production Deployment

### Local Storage (Development)

```bash
SNAPSHOT_STORAGE_TYPE=local
SNAPSHOT_STORAGE_PATH=uploads/snapshots
```

### S3 Storage (Production)

```bash
SNAPSHOT_STORAGE_TYPE=s3
AWS_S3_BUCKET=my-production-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### Docker Deployment

When deploying with Docker, ensure:
1. Puppeteer dependencies are installed (Chromium, system libraries)
2. Custom Chromium path is set if needed:
   ```bash
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```

### Environment-Specific Configuration

Use different `.env` files for different environments:
- `.env` - Development (local storage)
- `.env.production` - Production (S3 storage)
- `.env.test` - Testing (in-memory or test database)

## Troubleshooting

### Common Issues

**Issue**: "SNAPSHOT_STORAGE_TYPE must be one of: local, s3, gcs, azure"
- **Solution**: Check spelling and case of storage type value

**Issue**: "SNAPSHOT_STORAGE_PATH must not contain .."
- **Solution**: Use relative paths only, no parent directory references

**Issue**: "S3 storage requires: AWS_S3_BUCKET, AWS_S3_REGION"
- **Solution**: Set required AWS variables when using S3 storage

**Issue**: "SNAPSHOT_MAX_SNIPPETS must be a valid number"
- **Solution**: Ensure numeric values are integers, not strings or decimals

**Issue**: "AWS_S3_BUCKET must be 3-63 characters, lowercase, alphanumeric"
- **Solution**: Follow S3 bucket naming rules (lowercase, no underscores)

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug
ENABLE_PERFORMANCE_LOGGING=true
```

## References

- [.env.example](./env.example) - Complete environment variable documentation
- [validateEnv.ts](./src/config/validateEnv.ts) - Validation implementation
- [snapshotConfig.ts](./src/config/snapshotConfig.ts) - Configuration loading
- [Design Document](../.kiro/specs/visual-intelligence-code-snapshot-generator/design.md) - Feature design
