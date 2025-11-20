# Vencura Security Documentation

## Overview

This document outlines the comprehensive security architecture for the Vencura custodial wallet system. As a custodial wallet service, Vencura handles sensitive cryptographic material (private keys) and must implement defense-in-depth security measures following zero-trust principles.

## Table of Contents

- [Security Architecture](#security-architecture)
- [Zero Trust Implementation](#zero-trust-implementation)
- [Custodial Wallet Security](#custodial-wallet-security)
- [Encryption and Key Management](#encryption-and-key-management)
- [Authentication and Authorization](#authentication-and-authorization)
- [Network Security](#network-security)
- [Infrastructure Security](#infrastructure-security)
- [Deployment Security](#deployment-security)
- [Alternative Deployment Options](#alternative-deployment-options)
- [Compliance and Audit](#compliance-and-audit)
- [Incident Response](#incident-response)

## Security Architecture

### Defense in Depth

Vencura implements multiple layers of security:

1. **Authentication Layer**: Dynamic Labs JWT-based authentication
2. **Application Layer**: User isolation and authorization checks
3. **Encryption Layer**: AES-256-GCM encryption for private keys
4. **Database Layer**: Portable database (PGLite for dev, Postgres for prod)
5. **Network Layer**: Vercel Edge Network with Cloudflare DDoS protection
6. **Infrastructure Layer**: Vercel's security model with team access controls
7. **Secrets Layer**: Vercel environment variables (portable to any secrets manager)

**Current Deployment**: All systems are deployed on Vercel. The architecture is designed to be **portable by default** - all security measures work on any platform. See [Vercel Portability Strategy](/docs/vercel-portability) for details.

### Current Security Measures

#### Private Key Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Scrypt with salt from encryption key
- **Storage Format**: Encrypted data stored as `iv:authTag:encrypted` hex string
- **Implementation**: `EncryptionService` in `src/common/encryption.service.ts`
- **Key Storage**: Encryption key stored in Vercel environment variables, never in code
- **Portability**: Can migrate to any secrets manager (Google Cloud Secret Manager, AWS Secrets Manager, etc.)

#### Authentication

- **Provider**: Dynamic Labs SDK
- **Method**: JWT tokens signed with RS256 (RSA with SHA-256)
- **Verification**: Public key fetched from Dynamic API and verified server-side
- **User Isolation**: All wallet operations scoped to authenticated user ID
- **Implementation**: `AuthService` and `AuthGuard` in `src/auth/`

#### Database Security

- **Development**: PGLite (embedded PostgreSQL, portable)
- **Production**: External Postgres (can be any provider - Cloud SQL, RDS, Railway, etc.)
- **Encryption at Rest**: Database provider dependent (enabled by default on managed services)
- **Connection**: Standard Postgres connection strings (portable)
- **SSL/TLS**: Required for all connections
- **Access Control**: Database user with minimal privileges
- **Portability**: Standard Postgres - works with any provider

#### Secrets Management

- **Provider**: Vercel environment variables (current deployment)
- **Access Control**: Vercel team permissions and environment-specific configuration
- **Environment Separation**: Production and preview environments have separate secrets
- **Rotation**: Update environment variables in Vercel dashboard
- **Portability**: Standard environment variables - can migrate to any secrets manager
- **Secrets Stored**:
  - `ENCRYPTION_KEY`: Master encryption key for private keys
  - `DYNAMIC_ENVIRONMENT_ID`: Dynamic environment identifier
  - `DYNAMIC_API_TOKEN`: Dynamic API authentication token
  - `RPC_URL_<CHAIN_ID>`: Blockchain RPC endpoints (per-chain configuration)
  - `DATABASE_URL`: Database connection string with credentials (if using external Postgres)
- **Future Option**: Google Cloud Secret Manager available if enhanced security needed (see [Alternative Deployment Options](#alternative-deployment-options))

#### Infrastructure Security

- **Deployment Platform**: Vercel (current)
- **Access Controls**: Vercel team permissions with role-based access
- **Deployment Protection**: Preview/production guardrails
- **Compliance**: SOC 2 Type II, ISO 27001 certified
- **Automatic Updates**: Vercel handles security updates automatically
- **No SSH Access**: Serverless deployment, no shell access
- **Portability**: Can migrate to any platform without code changes

#### Application Security Headers

- **HSTS**: Strict Transport Security with maxAge 31536000, includeSubDomains, and preload
- **X-Frame-Options**: Set to DENY to prevent clickjacking
- **X-Content-Type-Options**: Set to nosniff to prevent MIME sniffing
- **Content-Security-Policy**: Configured for API endpoints with minimal directives
- **Referrer-Policy**: Set to strict-origin-when-cross-origin
- **Implementation**: Helmet.js middleware configured in `src/main.ts`

#### Request Security

- **Request Size Limits**: Maximum 10kb payload size for JSON and URL-encoded requests
- **Request ID Tracing**: Unique X-Request-ID header in all responses for tracing and debugging
- **Error Sanitization**: Error messages sanitized in production to prevent information leakage
- **Implementation**: Custom middleware and error handlers in `src/common/`

#### API Documentation Security

- **Swagger UI Feature Flag**: Swagger UI disabled by default (`ENABLE_SWAGGER_UI=false`)
- **Security Rationale**: Prevents unauthorized access to API documentation in production
- **Configuration**: Controlled via `ENABLE_SWAGGER_UI` environment variable
- **Usage**: Enable only in development or with proper authentication

#### CORS Configuration

- **Default**: Allows all origins (`*`) for development convenience
- **Production**: Should be configured with specific allowed origins via `CORS_ORIGIN` environment variable
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: Enabled for authenticated requests

## Zero Trust Implementation

### Zero Trust Principles

Zero trust means "never trust, always verify." Vencura implements zero trust at multiple levels:

#### 1. Network Zero Trust

- **Edge Network**: Vercel's global edge network (100+ locations)
- **DDoS Protection**: Cloudflare provides DDoS protection in front of the service
- **Automatic SSL/TLS**: All traffic encrypted with automatic certificate management
- **WAF/Firewall**: Vercel's built-in protection against common attacks
- **Portability**: Can add Cloudflare or other CDN/WAF on any platform

#### 2. Identity Zero Trust

- **Team Access**: Vercel team permissions control deployment access
- **GitHub Integration**: Deployments authenticated via GitHub OAuth
- **No Long-Lived Credentials**: GitHub integration eliminates need for API keys
- **JWT Verification**: Every API request requires valid Dynamic JWT token
- **User Isolation**: Database queries always filtered by authenticated user ID

#### 3. Data Zero Trust

- **Encryption at Rest**: All sensitive data encrypted before storage
- **Encryption in Transit**: TLS/SSL for all network communication
- **Secret References**: Secrets referenced, never embedded in code
- **Key Separation**: Encryption keys stored separately from encrypted data
- **No Plaintext Storage**: Private keys never stored in plaintext

#### 4. Application Zero Trust

- **Container Isolation**: Each request runs in isolated container
- **No Persistent Storage**: Containers are stateless, no local file storage
- **In-Memory Decryption**: Private keys decrypted only when needed, in memory
- **Request Validation**: All inputs validated and sanitized
- **Authorization Checks**: Every operation verifies user ownership

## Custodial Wallet Security

### Two-Layer Security Model

Vencura implements a two-layer security model for custodial wallets:

#### Layer 1: Authentication (Dynamic Labs)

- **Purpose**: Verify user identity
- **Method**: JWT token signed by Dynamic Labs
- **Verification**: Public key fetched from Dynamic API
- **Scope**: User identification and session management
- **Protection**: Prevents unauthorized access to API endpoints

#### Layer 2: Encryption (Application-Level)

- **Purpose**: Protect private keys at rest
- **Method**: AES-256-GCM encryption
- **Key Management**: Encryption key stored in Secret Manager
- **Scope**: Private key storage and retrieval
- **Protection**: Prevents data exposure even if database is compromised

### Private Key Storage

#### Key Generation

1. **Wallet Creation**: Dynamic SDK generates wallet using 2-of-2 threshold signature scheme
2. **Key Shares**: Wallet uses threshold cryptography with external server key shares
3. **Key Share Storage**: External server key shares are JSON stringified
4. **Encryption**: Key shares encrypted using `EncryptionService.encrypt()`
5. **Database Storage**: Encrypted data stored in `private_key_encrypted` column

#### Encryption Flow

```
Wallet Creation:
1. Dynamic SDK → Generate 2-of-2 threshold wallet
2. Extract external server key shares (array of strings)
3. JSON.stringify(keyShares) → "["0x...", "0x..."]"
4. EncryptionService.encrypt(jsonString) → "iv:authTag:encrypted"
5. Store encrypted string in database

Key Retrieval:
1. Read encrypted string from database
2. EncryptionService.decrypt(encrypted) → JSON string
3. JSON.parse(jsonString) → key shares array
4. Use key shares with Dynamic SDK for signing
```

#### Decryption and Usage

- **In-Memory Only**: Private keys decrypted only when needed for operations
- **Temporary Storage**: Decrypted keys exist only in memory during request processing
- **No Logging**: Private keys never logged or written to disk
- **Automatic Cleanup**: Memory cleared after request completion

### User Isolation

All wallet operations enforce user isolation:

- **Database Queries**: Always include `userId` filter
- **Authorization Checks**: Verify wallet ownership before operations
- **API Endpoints**: All endpoints require authentication
- **Error Messages**: Generic errors to prevent information leakage

Example from `WalletService`:

```typescript
// All queries include userId filter
.where(
  and(
    eq(schema.wallets.id, walletId),
    eq(schema.wallets.userId, userId)  // User isolation
  )
)
```

### Key Management

#### Encryption Key

- **Location**: Vercel environment variables (current)
- **Access**: Vercel team members with appropriate permissions
- **Rotation**: Update environment variable in Vercel dashboard, redeploy
- **Minimum Length**: 32 characters (enforced by application)
- **Portability**: Can migrate to any secrets manager (Google Cloud Secret Manager, AWS Secrets Manager, etc.)

#### Key Rotation Procedure

1. Generate new encryption key (32+ characters, cryptographically random)
2. Update environment variable in Vercel dashboard
3. Redeploy application (automatic on next push or manual)
4. **Important**: Old wallets remain encrypted with old key
5. **Migration**: Optionally re-encrypt wallets with new key (requires decryption with old key)

#### Dynamic API Keys

- **Environment ID**: Stored in Vercel environment variables
- **API Token**: Stored in Vercel environment variables
- **Rotation**: Update environment variable in Vercel dashboard, redeploy
- **Access**: Vercel team members with appropriate permissions

## Encryption and Key Management

### Encryption Service Implementation

The `EncryptionService` provides symmetric encryption using AES-256-GCM:

#### Algorithm Details

- **Cipher**: AES-256-GCM
- **Key Length**: 32 bytes (256 bits)
- **IV Length**: 16 bytes (128 bits)
- **Auth Tag**: 16 bytes (authentication tag from GCM)
- **Key Derivation**: Scrypt with salt

#### Encryption Process

1. **Key Derivation**:
   - Salt extracted from first 16 characters of encryption key
   - Scrypt used to derive 32-byte key from encryption key + salt

2. **Encryption**:
   - Generate random 16-byte IV
   - Create cipher with AES-256-GCM
   - Encrypt plaintext to hex
   - Extract authentication tag
   - Format: `iv:authTag:encrypted` (all hex)

3. **Decryption**:
   - Parse `iv:authTag:encrypted` format
   - Create decipher with same key and IV
   - Set authentication tag
   - Decrypt and verify authentication tag

#### Security Properties

- **Authenticated Encryption**: GCM provides both confidentiality and authenticity
- **Nonce Reuse Protection**: Random IV prevents nonce reuse attacks
- **Tamper Detection**: Authentication tag detects any modification
- **Key Derivation**: Scrypt provides resistance to brute force attacks

### Database Encryption

#### Database Provider Encryption

- **Encryption at Rest**: Enabled by default on managed Postgres providers
- **Provider-Managed Keys**: Uses provider-managed encryption keys
- **Automatic**: No configuration required for managed services
- **Transparent**: Application code unchanged
- **Portability**: Works with any Postgres provider (Cloud SQL, RDS, Railway, etc.)

#### Application-Level Encryption

- **Additional Layer**: Private keys encrypted before database storage
- **Defense in Depth**: Protects even if database encryption is compromised
- **Key Separation**: Encryption key stored separately from database

## Authentication and Authorization

### Dynamic Labs Authentication

#### JWT Token Flow

1. **Client Request**: Client includes `Authorization: Bearer <jwt-token>` header
2. **Token Extraction**: `AuthGuard` extracts token from header
3. **Public Key Fetch**: `AuthService` fetches Dynamic public key from API
4. **Token Verification**: JWT verified using RS256 algorithm
5. **User Extraction**: User ID extracted from `sub` claim
6. **User Creation**: User record created/verified in database
7. **Request Context**: User object attached to request

#### Token Verification

```typescript
// From AuthService.verifyToken()
const publicKey = await this.getPublicKey() // Fetch from Dynamic API
const decoded = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],
})
const userId = decoded.sub // Extract user ID
```

#### Security Properties

- **Public Key Verification**: Uses Dynamic's public key, not shared secret
- **Algorithm Restriction**: Only RS256 allowed
- **Token Expiration**: Handled by Dynamic Labs
- **Revocation**: Handled by Dynamic Labs

### Authorization

#### User Isolation

All wallet operations enforce user ownership:

- **Create Wallet**: Automatically associated with authenticated user
- **List Wallets**: Only returns wallets for authenticated user
- **Get Balance**: Verifies wallet ownership
- **Sign Message**: Verifies wallet ownership
- **Send Transaction**: Verifies wallet ownership

#### Implementation

```typescript
// Example from WalletService.getBalance()
const [wallet] = await this.db
  .select()
  .from(schema.wallets)
  .where(
    and(
      eq(schema.wallets.id, walletId),
      eq(schema.wallets.userId, userId), // User isolation
    ),
  )
  .limit(1)

if (!wallet) {
  throw new NotFoundException('Wallet not found')
}
```

## Network Security

### Vercel Edge Network

#### Global Distribution

- **Edge Locations**: 100+ locations worldwide
- **Automatic CDN**: Static assets cached globally
- **Edge Functions**: Serverless functions at the edge for ultra-low latency
- **Automatic Scaling**: Handles traffic spikes without configuration

#### DDoS Protection

- **Cloudflare Integration**: Cloudflare provides DDoS protection in front of the service
- **Automatic Mitigation**: Built-in protection against common attacks
- **WAF/Firewall**: Vercel's built-in protection
- **Portability**: Can add Cloudflare or other CDN/WAF on any platform

#### SSL/TLS

- **Automatic Certificates**: SSL/TLS certificates provisioned and renewed automatically
- **HTTPS Enforcement**: All traffic encrypted by default
- **Certificate Management**: No manual certificate management required

### Network Security Best Practices

1. **Environment Separation**: Separate Vercel projects for dev and prod
2. **Custom Domains**: Use custom domains with proper DNS configuration
3. **Monitoring**: Use Vercel Analytics and monitoring tools
4. **DDoS Protection**: Cloudflare provides additional protection
5. **WAF**: Vercel's built-in WAF provides additional protection

## Infrastructure Security

### Vercel Infrastructure Security

#### Access Controls

- **Team Permissions**: Role-based access control (Owner, Member, Developer, Viewer)
- **Project-Level Access**: Fine-grained permissions per project
- **Environment Variables**: Protected by team permissions
- **Deployment Protection**: Preview/production guardrails prevent accidental deployments

#### Compliance and Certifications

- **SOC 2 Type II**: Vercel is SOC 2 Type II certified
- **ISO 27001**: Vercel is ISO 27001 certified
- **GDPR**: Vercel is GDPR compliant
- **HIPAA**: Available for enterprise customers

#### Automatic Security Updates

- **Platform Updates**: Vercel handles security updates automatically
- **Dependency Scanning**: Built-in dependency scanning
- **Vulnerability Management**: Automatic vulnerability detection and patching

#### Monitoring and Logging

- **Deployment Logs**: Comprehensive logging for all deployments
- **Function Logs**: Real-time logs for serverless functions
- **Analytics**: Built-in analytics and monitoring
- **Error Tracking**: Integration with error tracking services (Sentry)

### Portability

All infrastructure security measures are **portable by default**:

- **Standard Environment Variables**: Works with any secrets manager
- **Standard Database Connections**: Works with any Postgres provider
- **Standard Application Code**: No vendor-specific code
- **Migration Path**: Can migrate to any platform without code changes

See [Vercel Portability Strategy](/docs/vercel-portability) for detailed portability documentation.

## Deployment Security

### Signed Commits

#### GitHub Branch Protection

**Recommended Configuration**:

1. **Require Signed Commits**:
   - Enable "Require signed commits" in branch protection
   - All commits to `main` must be signed
   - Prevents unauthorized code changes

2. **Verification**:
   - GitHub verifies GPG signatures
   - Unsigned commits rejected
   - Signature status visible in PR

3. **Setup**:

   ```bash
   # Generate GPG key
   gpg --full-generate-key

   # Add to GitHub
   gpg --armor --export <key-id> | pbcopy
   # Paste in GitHub Settings → SSH and GPG keys

   # Configure Git
   git config --global user.signingkey <key-id>
   git config --global commit.gpgsign true
   ```

### Vercel Deployment Security

#### Git-Based Deployments

- **GitHub Integration**: Automatic deployments from GitHub
- **Branch Protection**: Protected branches require PR review
- **Preview Deployments**: Every PR gets instant production-like preview URL
- **Zero-Downtime Deployments**: Atomic deployments with instant rollback capability

#### Deployment Verification

- **Automatic Builds**: Vercel automatically builds and tests on every push
- **Preview URLs**: Test changes before merging to production
- **Instant Rollback**: One-click rollback to previous deployment
- **Health Checks**: Automatic health checks after deployment

#### Deployment Workflow

1. **Push to Branch**: Automatic deployment trigger
2. **Build**: Vercel builds application using configured build command
3. **Test**: Run tests (if configured)
4. **Deploy**: Deploy to preview (PR) or production (main branch)
5. **Verify**: Automatic health checks and verification
6. **Rollback**: Instant rollback if issues detected

### Code Review and Quality

#### Required Reviews

- **PR Reviews**: All changes require PR review before merging
- **Automated Checks**: Lint, type check, test (via GitHub Actions)
- **Preview Deployments**: Test changes in production-like environment
- **Documentation**: Update docs with code changes

#### Security Best Practices

- **Signed Commits**: Use GPG signing for commits (recommended)
- **Branch Protection**: Protect main branch from direct pushes
- **Dependency Updates**: Regular dependency updates and security patches
- **Security Scanning**: Use GitHub Dependabot or similar for vulnerability scanning

## Compliance and Audit

### Security Compliance

#### Data Protection

- **Encryption**: All sensitive data encrypted
- **Access Control**: Least privilege IAM
- **Audit Logging**: All access logged
- **Data Residency**: Control data location

#### Regulatory Considerations

- **GDPR**: User data handling and deletion
- **SOC 2**: Security controls and monitoring
- **PCI DSS**: If handling payment data
- **Financial Regulations**: If handling financial transactions

### Security Monitoring

#### Recommended Monitoring

1. **Vercel Analytics**: Built-in analytics and monitoring
2. **Error Tracking**: Sentry integration for error tracking
3. **Deployment Logs**: Review deployment logs for issues
4. **Alerting**: Set up alerts for failed deployments or errors

#### Key Metrics

- **Failed Authentication**: Monitor failed login attempts
- **Secret Access**: Unusual secret access patterns
- **Database Queries**: Unusual query patterns
- **API Errors**: High error rates
- **Deployment Activity**: Unauthorized deployments

### Security Audits

#### Regular Audits

1. **IAM Review**: Quarterly review of IAM bindings
2. **Secret Rotation**: Regular secret rotation
3. **Access Review**: Review who has access to what
4. **Code Review**: Security-focused code reviews
5. **Penetration Testing**: Annual penetration tests

#### Audit Checklist

- [ ] IAM permissions reviewed and minimized
- [ ] All secrets rotated in last 90 days
- [ ] All dependencies updated and scanned
- [ ] Security patches applied
- [ ] Access logs reviewed
- [ ] Incident response plan tested

## Incident Response

### Incident Response Plan

#### Preparation

1. **Team**: Designate security response team
2. **Contacts**: Maintain contact list
3. **Tools**: Access to logs, monitoring, etc.
4. **Documentation**: Keep runbooks updated

#### Detection

1. **Monitoring**: Automated alerts for suspicious activity
2. **Logs**: Centralized logging for analysis
3. **Alerts**: Real-time alerting for critical events

#### Response

1. **Containment**: Isolate affected systems
2. **Investigation**: Determine scope and impact
3. **Remediation**: Fix vulnerabilities
4. **Communication**: Notify stakeholders
5. **Documentation**: Document incident and response

#### Recovery

1. **Verification**: Verify systems are secure
2. **Monitoring**: Enhanced monitoring
3. **Review**: Post-incident review
4. **Improvements**: Update security measures

### Security Contacts

- **Security Team**: [Add contact information]
- **On-Call**: [Add on-call rotation]
- **Escalation**: [Add escalation path]

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do Not**: Create public GitHub issues
2. **Do**: Contact security team directly
3. **Include**: Detailed description and steps to reproduce
4. **Response**: Expect response within 48 hours

## Security Best Practices Summary

### For Developers

1. **Never commit secrets**: Use Secret Manager
2. **Sign commits**: Enable GPG signing
3. **Review code**: Security-focused code reviews
4. **Update dependencies**: Regular security updates
5. **Follow principle of least privilege**: Minimize permissions

### For Operations

1. **Separate environments**: Dev and prod isolation in Vercel
2. **Rotate secrets**: Regular rotation schedule for environment variables
3. **Monitor deployments**: Review deployment logs and analytics
4. **Update dependencies**: Keep dependencies updated and scan for vulnerabilities
5. **Test backups**: Regular backup verification (if using external database)

### For Security

1. **Regular audits**: Quarterly security reviews
2. **Penetration testing**: Annual pen tests
3. **Threat modeling**: Regular threat model updates
4. **Incident drills**: Regular incident response practice
5. **Security training**: Team security awareness

## Alternative Deployment Options

### Google Cloud Platform

For production workloads requiring enhanced security and control, Google Cloud Platform is available as an alternative deployment option. This includes:

- **Enhanced Security**: Private networking, VPC isolation, HSM-backed keys
- **Fine-Grained Control**: Full control over infrastructure, scaling, and resource allocation
- **Compliance**: Better support for enterprise security and compliance requirements
- **Private Networking**: Strict egress control and network-level security policies

**Status**: Documented but not currently implemented. All systems are currently deployed on Vercel.

**Documentation**: See [Google Cloud Deployment](/docs/google-cloud) for comprehensive Google Cloud security details.

**When to Consider**: Only if production security requirements demand enhanced control beyond Vercel's capabilities. See [Vercel Portability Strategy](/docs/vercel-portability) for detailed comparison.

## Additional Resources

- [Vercel Portability Strategy](/docs/vercel-portability) - Current deployment strategy
- [Google Cloud Deployment](/docs/google-cloud) - Alternative deployment security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Dynamic Labs Security Documentation](https://docs.dynamic.xyz/)

## Document Maintenance

This security documentation should be reviewed and updated:

- **Quarterly**: Review and update security measures
- **After Incidents**: Update based on lessons learned
- **After Changes**: Update when architecture changes
- **Annually**: Comprehensive security review

Last Updated: [Date]
Version: 1.0
