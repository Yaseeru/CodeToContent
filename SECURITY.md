# Security Policy

## Reporting Security Vulnerabilities

We take the security of CodeToContent seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues by emailing: **security@codecontent.example.com**

Include the following information in your report:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Updates**: We will provide regular updates on our progress
- **Credit**: We will credit you in our security advisories (unless you prefer to remain anonymous)
- **Timeline**: We aim to resolve critical vulnerabilities within 7 days

## Security Best Practices

### Environment Variables

Environment variables contain sensitive configuration data and must be protected:

**DO:**
- ✓ Use `.env` files for local development (never commit to git)
- ✓ Use secure secret management services in production (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✓ Generate strong, random values for secrets (minimum 32 characters)
- ✓ Rotate secrets regularly (at least every 90 days)
- ✓ Use different secrets for each environment (dev, staging, production)
- ✓ Restrict access to environment variables to only necessary personnel
- ✓ Copy `.env.example` to `.env` and fill in your values

**DON'T:**
- ✗ Never commit `.env` files to version control
- ✗ Never share secrets via email, Slack, or other insecure channels
- ✗ Never use default or example values in production
- ✗ Never log environment variables or secrets
- ✗ Never hardcode secrets in source code

**Required Environment Variables:**
```bash
MONGODB_URI=mongodb://...          # Database connection string
GITHUB_CLIENT_ID=...               # GitHub OAuth client ID
GITHUB_CLIENT_SECRET=...           # GitHub OAuth client secret (SENSITIVE)
JWT_SECRET=...                     # JWT signing key (SENSITIVE)
GEMINI_API_KEY=...                 # Google Gemini API key (SENSITIVE)
REDIS_URL=redis://...              # Redis connection string
```

### Database Security

MongoDB security is critical for protecting user data:

**Connection Security:**
- ✓ Always use authentication (username/password)
- ✓ Use TLS/SSL for connections in production
- ✓ Use connection string format: `mongodb+srv://username:password@host/database`
- ✓ Never expose MongoDB directly to the internet
- ✓ Use VPC/private networks for database access
- ✓ Implement IP whitelisting for database access

**Access Control:**
- ✓ Create separate database users for different services
- ✓ Grant minimum required permissions (principle of least privilege)
- ✓ Use read-only users for analytics and reporting
- ✓ Regularly audit database access logs
- ✓ Disable the default admin account

**Data Protection:**
- ✓ Enable MongoDB encryption at rest
- ✓ Enable MongoDB encryption in transit (TLS)
- ✓ Implement regular automated backups
- ✓ Test backup restoration procedures
- ✓ Store backups in a separate secure location

**Password Handling:**
- ✓ Redact passwords from logs: `uri.replace(/:[^:]*@/, ':****@')`
- ✓ Never log full connection strings
- ✓ Use URL encoding for special characters in passwords

### API Security

Protect your API endpoints from unauthorized access and abuse:

**HTTPS/TLS:**
- ✓ **REQUIRED**: Use HTTPS in production (never HTTP)
- ✓ Use TLS 1.2 or higher
- ✓ Use valid SSL certificates (Let's Encrypt, commercial CA)
- ✓ Enable HSTS (HTTP Strict Transport Security)
- ✓ Redirect all HTTP traffic to HTTPS

**Authentication & Authorization:**
- ✓ Use JWT tokens for API authentication
- ✓ Implement OAuth 2.0 for third-party integrations (GitHub)
- ✓ Validate tokens on every request
- ✓ Use short token expiration times (15-60 minutes)
- ✓ Implement refresh token rotation
- ✓ Store tokens securely (httpOnly cookies or secure storage)

**Rate Limiting:**
- ✓ Implement rate limiting on all endpoints (100 requests/hour default)
- ✓ Use stricter limits for expensive operations (10 requests/hour)
- ✓ Use user ID for rate limiting (not just IP address)
- ✓ Return HTTP 429 with `Retry-After` header
- ✓ Log rate limit violations for monitoring
- ✓ Use Redis for distributed rate limiting

**Input Validation:**
- ✓ Validate all request inputs (body, query, params)
- ✓ Use schema validation (express-validator)
- ✓ Sanitize user inputs to prevent injection attacks
- ✓ Validate data types, lengths, and formats
- ✓ Return HTTP 400 with detailed error messages
- ✓ Log validation failures for security monitoring

**CORS (Cross-Origin Resource Sharing):**
- ✓ Configure CORS to allow only trusted origins
- ✓ Never use `Access-Control-Allow-Origin: *` in production
- ✓ Specify allowed methods and headers explicitly

**Security Headers:**
```javascript
// Recommended security headers
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
}));
```

### Token Security

GitHub OAuth access tokens require special protection:

**Current Implementation:**
- Tokens are stored in MongoDB User model
- Tokens are used for GitHub API access
- Tokens are associated with user accounts

**Security Measures:**
- ✓ Store tokens in database (not in cookies or localStorage)
- ✓ Use HTTPS for all token transmission
- ✓ Implement token refresh when possible
- ✓ Revoke tokens when users disconnect GitHub
- ✓ Log token usage for audit trails

**TODO - Future Enhancement:**
```
⚠️ IMPORTANT: GitHub access tokens should be encrypted at rest
- Use AES-256-GCM encryption
- Store encryption keys in secure key management service
- Implement key rotation procedures
- Encrypt before storing in database
- Decrypt only when needed for API calls

This is a known limitation and should be addressed before production deployment.
```

**Token Handling Best Practices:**
- ✓ Never log tokens (even partially)
- ✓ Never expose tokens in error messages
- ✓ Never send tokens in URL parameters
- ✓ Implement token expiration and refresh
- ✓ Allow users to revoke tokens manually

### Redis Security

Redis stores sensitive data including rate limiting and job queues:

**Connection Security:**
- ✓ Always use password authentication (`REDIS_URL=redis://:password@host:port`)
- ✓ Use TLS for Redis connections in production
- ✓ Never expose Redis directly to the internet
- ✓ Use VPC/private networks for Redis access
- ✓ Implement IP whitelisting

**Access Control:**
- ✓ Use strong, random passwords (minimum 32 characters)
- ✓ Disable dangerous commands (FLUSHALL, FLUSHDB, CONFIG)
- ✓ Use Redis ACLs for fine-grained access control (Redis 6+)
- ✓ Create separate users for different services

**Data Protection:**
- ✓ Enable Redis persistence (RDB or AOF)
- ✓ Implement regular backups
- ✓ Use Redis encryption at rest (if available)
- ✓ Set appropriate TTLs for cached data
- ✓ Regularly audit Redis keys and data

**Configuration:**
```bash
# Recommended Redis configuration
requirepass <strong-password>
bind 127.0.0.1 ::1  # Only allow local connections
protected-mode yes
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Deployment Security Checklist

Use this checklist before deploying to production:

### Pre-Deployment

- [ ] All environment variables are set and validated
- [ ] All secrets are strong and randomly generated
- [ ] `.env` files are not committed to git
- [ ] Database uses authentication and TLS
- [ ] Redis uses password authentication
- [ ] HTTPS/TLS is configured and tested
- [ ] SSL certificates are valid and not expired
- [ ] Security headers are configured (helmet.js)
- [ ] CORS is configured with specific origins
- [ ] Rate limiting is enabled on all endpoints
- [ ] Input validation is implemented on all endpoints
- [ ] Error messages don't expose sensitive information
- [ ] Logging doesn't include secrets or tokens
- [ ] Dependencies are up to date (no known vulnerabilities)

### Infrastructure

- [ ] Database is not publicly accessible
- [ ] Redis is not publicly accessible
- [ ] Firewall rules are configured (only necessary ports open)
- [ ] VPC/private networks are used for service communication
- [ ] Load balancer is configured with health checks
- [ ] Auto-scaling is configured for high availability
- [ ] Backup procedures are tested and working
- [ ] Monitoring and alerting are configured

### Application

- [ ] Application starts successfully with all validations
- [ ] Health check endpoints are accessible
- [ ] Rate limiting is working (test with 101 requests)
- [ ] Input validation rejects invalid data
- [ ] Authentication is required for protected endpoints
- [ ] Tokens expire and refresh correctly
- [ ] Error handling doesn't crash the application
- [ ] Logs are being collected and monitored

### Post-Deployment

- [ ] Monitor logs for errors and security events
- [ ] Monitor rate limit violations
- [ ] Monitor authentication failures
- [ ] Set up alerts for critical errors
- [ ] Review security logs regularly
- [ ] Test disaster recovery procedures
- [ ] Document incident response procedures

## OWASP Guidelines

We follow OWASP (Open Web Application Security Project) best practices:

### OWASP Top 10 Mitigations

1. **Broken Access Control**
   - Implement authentication on all protected routes
   - Validate user permissions for each action
   - Use JWT tokens with short expiration

2. **Cryptographic Failures**
   - Use HTTPS/TLS for all communications
   - Use strong encryption algorithms (AES-256)
   - Store passwords with bcrypt (cost factor 10+)
   - TODO: Encrypt tokens at rest

3. **Injection**
   - Use parameterized queries (Mongoose ODM)
   - Validate and sanitize all inputs
   - Use express-validator for input validation

4. **Insecure Design**
   - Implement rate limiting to prevent abuse
   - Use fail-fast validation at startup
   - Implement retry logic with exponential backoff

5. **Security Misconfiguration**
   - Validate environment variables at startup
   - Use security headers (helmet.js)
   - Disable unnecessary features and endpoints
   - Keep dependencies up to date

6. **Vulnerable and Outdated Components**
   - Run `npm audit` regularly
   - Update dependencies monthly
   - Monitor security advisories
   - Use automated dependency scanning

7. **Identification and Authentication Failures**
   - Use OAuth 2.0 for authentication
   - Implement token expiration and refresh
   - Log authentication failures
   - Implement account lockout after failed attempts

8. **Software and Data Integrity Failures**
   - Verify package integrity (package-lock.json)
   - Use signed commits in git
   - Implement CI/CD security scanning
   - Validate data before processing

9. **Security Logging and Monitoring Failures**
   - Log all security events (auth, rate limits, validation)
   - Monitor logs for suspicious activity
   - Implement alerting for critical events
   - Retain logs for audit purposes

10. **Server-Side Request Forgery (SSRF)**
    - Validate and sanitize URLs
    - Use allowlists for external API calls
    - Implement network segmentation

### Additional OWASP Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

## Dependency Scanning

Regularly scan dependencies for known vulnerabilities:

### NPM Audit

Run npm audit regularly to check for vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# View detailed report
npm audit --json

# Automatically fix vulnerabilities (use with caution)
npm audit fix

# Fix only production dependencies
npm audit fix --only=prod
```

### Automated Scanning

Implement automated dependency scanning in CI/CD:

**GitHub Dependabot:**
- Enable Dependabot alerts in repository settings
- Configure automatic security updates
- Review and merge Dependabot PRs promptly

**Snyk:**
```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

**OWASP Dependency-Check:**
```bash
# Run dependency check
dependency-check --project "CodeToContent" --scan ./

# Generate report
dependency-check --format HTML --out ./reports
```

### Best Practices

- ✓ Run `npm audit` before every deployment
- ✓ Review security advisories weekly
- ✓ Update dependencies monthly (or more frequently for critical patches)
- ✓ Test thoroughly after updating dependencies
- ✓ Use `npm ci` in production (not `npm install`)
- ✓ Lock dependency versions in package-lock.json
- ✓ Monitor for zero-day vulnerabilities
- ✓ Have a process for emergency security patches

## Security Contacts

- **Security Issues**: security@codecontent.example.com
- **General Support**: support@codecontent.example.com
- **Documentation**: See `/docs` directory

## Version History

- **v1.0.0** (2024-01-18): Initial security policy
  - Vulnerability reporting process
  - Environment variable security
  - Database security requirements
  - API security requirements
  - Token security (with TODO for encryption)
  - Redis security requirements
  - Deployment security checklist
  - OWASP guidelines
  - Dependency scanning procedures

---

**Last Updated**: January 18, 2024

**Note**: This security policy is a living document and will be updated as new security measures are implemented and best practices evolve.
