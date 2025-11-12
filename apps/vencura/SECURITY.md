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
- [Google Cloud Security](#google-cloud-security)
- [Deployment Security](#deployment-security)
- [Compliance and Audit](#compliance-and-audit)
- [Incident Response](#incident-response)

## Security Architecture

### Defense in Depth

Vencura implements multiple layers of security:

1. **Authentication Layer**: Dynamic Labs JWT-based authentication
2. **Application Layer**: User isolation and authorization checks
3. **Encryption Layer**: AES-256-GCM encryption for private keys
4. **Database Layer**: Encrypted at rest, private network access only
5. **Network Layer**: VPC isolation, private IP only
6. **Infrastructure Layer**: Least privilege IAM, service accounts
7. **Secrets Layer**: Google Cloud Secret Manager

### Current Security Measures

#### Private Key Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Scrypt with salt from encryption key
- **Storage Format**: Encrypted data stored as `iv:authTag:encrypted` hex string
- **Implementation**: `EncryptionService` in `src/common/encryption.service.ts`
- **Key Storage**: Encryption key stored in Google Cloud Secret Manager, never in code

#### Authentication

- **Provider**: Dynamic Labs SDK
- **Method**: JWT tokens signed with RS256 (RSA with SHA-256)
- **Verification**: Public key fetched from Dynamic API and verified server-side
- **User Isolation**: All wallet operations scoped to authenticated user ID
- **Implementation**: `AuthService` and `AuthGuard` in `src/auth/`

#### Database Security

- **Encryption at Rest**: Enabled by default in Cloud SQL
- **Network Access**: Private IP only, no public IP
- **Connection**: Unix socket via Cloud SQL Proxy
- **SSL/TLS**: Required for all connections
- **Access Control**: Database user with minimal privileges

#### Secrets Management

- **Provider**: Google Cloud Secret Manager
- **Replication**: Automatic multi-region replication
- **Access**: Service account-based with IAM conditions
- **Rotation**: Supported via secret versions
- **Secrets Stored**:
  - `ENCRYPTION_KEY`: Master encryption key for private keys
  - `DYNAMIC_ENVIRONMENT_ID`: Dynamic environment identifier
  - `DYNAMIC_API_TOKEN`: Dynamic API authentication token
  - `ARBITRUM_SEPOLIA_RPC_URL`: Blockchain RPC endpoint
  - `DATABASE_URL`: Database connection string with credentials

#### Infrastructure Security

- **Service Accounts**: Separate accounts for Cloud Run and CI/CD
- **IAM Roles**: Least privilege principle
- **VPC Isolation**: Dedicated VPC, not default network
- **Private Networking**: All internal communication via private IP
- **No SSH Access**: Containerized deployment, no shell access

## Zero Trust Implementation

### Zero Trust Principles

Zero trust means "never trust, always verify." Vencura implements zero trust at multiple levels:

#### 1. Network Zero Trust

- **Private IP Only**: Cloud SQL uses private IP only, no public endpoint
- **VPC Isolation**: Dedicated VPC separate from default network
- **VPC Connector**: Serverless VPC Access with `private-ranges-only` egress
- **Firewall Rules**: Explicit deny-all, allow only required traffic
- **Private Service Connection**: Direct connection to Cloud SQL via private network

#### 2. Identity Zero Trust

- **No User Accounts**: No human users with direct GCP access
- **Service Accounts Only**: All operations use service accounts
- **Workload Identity Federation**: GitHub Actions authenticate via WIF, no long-lived credentials
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

- **Location**: Google Cloud Secret Manager
- **Naming**: `vencura-{env}-encryption-key`
- **Access**: Cloud Run service account only
- **Rotation**: Create new secret version, update Cloud Run config
- **Minimum Length**: 32 characters (enforced by application)

#### Key Rotation Procedure

1. Generate new encryption key (32+ characters, cryptographically random)
2. Create new secret version in Secret Manager
3. Update Cloud Run service to use new secret version
4. **Important**: Old wallets remain encrypted with old key
5. **Migration**: Optionally re-encrypt wallets with new key (requires decryption with old key)

#### Dynamic API Keys

- **Environment ID**: Stored in Secret Manager
- **API Token**: Stored in Secret Manager
- **Rotation**: Update secret version, restart Cloud Run service
- **Access**: Cloud Run service account only

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

#### Cloud SQL Encryption

- **Encryption at Rest**: Enabled by default
- **Google-Managed Keys**: Uses Google-managed encryption keys
- **Automatic**: No configuration required
- **Transparent**: Application code unchanged

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

### VPC Architecture

#### Network Isolation

- **Dedicated VPC**: Separate VPC for Vencura, not default network
- **Private Subnet**: 10.0.0.0/24 for Cloud SQL
- **VPC Connector**: 10.8.0.0/28 for serverless VPC access
- **No Internet Gateway**: No direct internet access from VPC

#### Private IP Configuration

- **Cloud SQL**: Private IP only, no public IP
- **VPC Connector**: Egress set to `private-ranges-only`
- **Cloud Run**: Connects to Cloud SQL via Unix socket
- **Private Service Connection**: Direct connection to Cloud SQL

#### Firewall Rules

- **Default Deny**: All traffic denied by default
- **Explicit Allow**: Only required traffic allowed
- **Cloud SQL Access**: Only from VPC Connector
- **No Public Access**: No public IPs or internet-facing endpoints

### Network Security Best Practices

1. **Separate Projects**: Dev and prod in separate GCP projects
2. **VPC Peering**: Avoid if possible, use private service connections
3. **Network Monitoring**: Enable VPC Flow Logs
4. **DDoS Protection**: Cloud Armor for Cloud Run (if needed)
5. **WAF**: Consider Web Application Firewall for additional protection

## Google Cloud Security

### Project Organization

#### Separate Projects

**Recommended**: Use separate GCP projects for dev and prod:

- **Benefits**:
  - Complete isolation between environments
  - Separate billing and quotas
  - Independent IAM policies
  - Isolated audit logs
  - Easier compliance and security reviews

- **Implementation**:
  - Dev project: `vencura-dev` or similar
  - Prod project: `vencura-prod` or similar
  - Different project IDs in Pulumi stacks

#### Current Setup

The infrastructure supports separate projects via Pulumi stacks:

- `dev` stack: Development environment
- `prod` stack: Production environment

Each stack can target a different GCP project.

### Service Account Management

#### Service Account Hierarchy

1. **Cloud Run Service Account**:
   - Purpose: Runtime identity for Cloud Run service
   - Permissions:
     - `roles/secretmanager.secretAccessor` (scoped to specific secrets)
     - `roles/cloudsql.client` (Cloud SQL connection only)
   - Naming: `vencura-{env}-cloud-run-sa`

2. **CI/CD Service Account**:
   - Purpose: GitHub Actions deployment
   - Permissions:
     - `roles/artifactregistry.writer` (push images)
     - `roles/run.admin` (deploy services)
     - `roles/secretmanager.secretAccessor` (read secrets for deployment)
   - Naming: `vencura-{env}-cicd-sa`

#### IAM Best Practices

- **Least Privilege**: Minimum permissions required
- **Service Account per Environment**: Separate accounts for dev/prod
- **IAM Conditions**: Limit secret access to specific secrets
- **No Project-Level Roles**: Avoid broad permissions
- **Regular Audits**: Review IAM bindings regularly

### Workload Identity Federation

#### GitHub Actions Authentication

- **Method**: Workload Identity Federation (WIF)
- **Provider**: GitHub OIDC provider
- **Service Account**: CI/CD service account
- **Benefits**:
  - No long-lived credentials
  - Automatic token rotation
  - Fine-grained access control
  - Audit trail

#### Setup Requirements

1. **WIF Provider**: Created in GCP (one-time setup)
2. **WIF Service Account**: CI/CD service account with WIF binding
3. **GitHub Secrets**:
   - `WIF_PROVIDER`: WIF provider resource name
   - `WIF_SERVICE_ACCOUNT`: Service account email

### Secret Manager

#### Secret Organization

- **Naming Convention**: `vencura-{env}-{secret-name}`
- **Replication**: Automatic multi-region
- **Access Control**: IAM-based with conditions
- **Versioning**: Supports multiple versions for rotation

#### Secret Access

- **Service Account Binding**: Each secret has IAM member for service account
- **IAM Conditions**: Can limit access by IP, time, etc.
- **Audit Logging**: All secret access logged
- **Monitoring**: Alert on unusual access patterns

### Audit Logging

#### Recommended Logging

1. **Admin Activity Logs**: All admin actions
2. **Data Access Logs**: Database and secret access
3. **System Event Logs**: System-level events
4. **Access Transparency**: Cloud SQL access logs

#### Log Retention

- **Default**: 30 days (free tier)
- **Recommended**: 1 year for production
- **Compliance**: Adjust based on requirements

### Organization Policies

#### Recommended Policies

1. **Domain Restriction**: Restrict to company domain
2. **Resource Location**: Restrict resource creation to specific regions
3. **Service Account Key Creation**: Disable user-managed keys
4. **Compute Engine VM**: Restrict VM creation
5. **Storage Bucket**: Require uniform bucket-level access

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

### Signed Production Deployments

#### Container Image Signing

**Recommended**: Sign Docker images before deployment:

1. **Cosign Integration**:
   - Sign images with Cosign
   - Store signatures in Artifact Registry
   - Verify signatures before deployment

2. **Workflow Integration**:

   ```yaml
   - name: Sign container image
     run: |
       cosign sign --yes ${{ env.image }}

   - name: Verify signature before deploy
     run: |
       cosign verify ${{ env.image }}
   ```

3. **Policy Enforcement**:
   - Only deploy signed images
   - Reject unsigned images
   - Audit signature verification

#### Deployment Verification

- **Infrastructure as Code**: All changes via Pulumi (auditable)
- **Preview Before Apply**: `pulumi preview` shows changes
- **Approval Required**: Production deployments require manual trigger
- **Health Checks**: Verify deployment success

### Infrastructure as Code

#### Pulumi Security

- **State Management**: Pulumi Cloud or self-hosted backend
- **Secrets**: Use Pulumi secrets for sensitive config
- **Audit Trail**: All infrastructure changes tracked
- **Rollback**: Ability to revert changes

#### Code Review

- **Required Reviews**: All infrastructure changes require PR review
- **Automated Checks**: Lint, type check, test
- **Preview**: Pulumi preview in CI/CD
- **Documentation**: Update docs with infrastructure changes

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

1. **Cloud Monitoring**: GCP Cloud Monitoring
2. **Security Command Center**: Threat detection
3. **Audit Logs**: Review access patterns
4. **Alerting**: Unusual activity alerts

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

1. **Separate projects**: Dev and prod isolation
2. **Rotate secrets**: Regular rotation schedule
3. **Monitor access**: Review audit logs
4. **Update infrastructure**: Keep Pulumi and GCP updated
5. **Test backups**: Regular backup verification

### For Security

1. **Regular audits**: Quarterly security reviews
2. **Penetration testing**: Annual pen tests
3. **Threat modeling**: Regular threat model updates
4. **Incident drills**: Regular incident response practice
5. **Security training**: Team security awareness

## Additional Resources

- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Dynamic Labs Security Documentation](https://docs.dynamic.xyz/)
- [Pulumi Security Best Practices](https://www.pulumi.com/docs/guides/security/)

## Document Maintenance

This security documentation should be reviewed and updated:

- **Quarterly**: Review and update security measures
- **After Incidents**: Update based on lessons learned
- **After Changes**: Update when architecture changes
- **Annually**: Comprehensive security review

Last Updated: [Date]
Version: 1.0
