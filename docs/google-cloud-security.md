# Google Cloud Security Documentation

This document outlines the comprehensive security architecture for deploying Vencura to Google Cloud Platform. This deployment option is documented as a **future option** for production workloads requiring enhanced security and control. Currently, all systems are deployed on Vercel.

**Status**: Documented but not currently implemented. See [Vercel Portability Strategy](./vercel-portability-strategy.md) for current deployment approach.

## Overview

Google Cloud Platform provides enhanced security features for production workloads requiring strict data governance, including:

- Private networking with VPC isolation
- HSM-backed key custody and KMS
- Fine-grained IAM controls
- Enhanced audit logging and compliance
- Private IP database connections

## When to Use Google Cloud

Consider Google Cloud deployment when production security requirements demand:

- Regulatory/compliance requirements for HSM-backed key custody
- Need for MPC/threshold signing workflows
- Requirement for private networking and strict egress control
- Enhanced audit trails and compliance beyond Vercel's capabilities
- Enterprise security requirements that exceed Vercel's offerings

## Security Architecture

### Defense in Depth

Google Cloud deployment implements multiple layers of security:

1. **Authentication Layer**: Dynamic Labs JWT-based authentication
2. **Application Layer**: User isolation and authorization checks
3. **Encryption Layer**: AES-256-GCM encryption for private keys
4. **Database Layer**: Cloud SQL encryption at rest, private IP only
5. **Network Layer**: VPC isolation, private IP only
6. **Infrastructure Layer**: Least privilege IAM, service accounts
7. **Secrets Layer**: Google Cloud Secret Manager

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

## Project Organization

### Separate Projects

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

## Service Account Management

### Service Account Hierarchy

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

### IAM Best Practices

- **Least Privilege**: Minimum permissions required
- **Service Account per Environment**: Separate accounts for dev/prod
- **IAM Conditions**: Limit secret access to specific secrets
- **No Project-Level Roles**: Avoid broad permissions
- **Regular Audits**: Review IAM bindings regularly

## Workload Identity Federation

### GitHub Actions Authentication

- **Method**: Workload Identity Federation (WIF)
- **Provider**: GitHub OIDC provider
- **Service Account**: CI/CD service account
- **Benefits**:
  - No long-lived credentials
  - Automatic token rotation
  - Fine-grained access control
  - Audit trail

### Setup Requirements

1. **WIF Provider**: Created in GCP (one-time setup)
   - Pool: `vencura-github-pool`
   - Provider: `github` (OIDC provider for GitHub Actions)
   - Resource name format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/vencura-github-pool/providers/github`
2. **WIF Service Account**: CI/CD service account with WIF binding
   - Service account: `vencura-dev-cicd-sa@PROJECT_ID.iam.gserviceaccount.com`
   - Permissions: `roles/editor`, `roles/artifactregistry.writer`, `roles/run.admin`, `roles/secretmanager.admin`, `roles/servicenetworking.serviceAgent`
3. **GitHub Secrets**:
   - `WIF_PROVIDER`: Full WIF provider resource name (from Step 5 setup)
   - `WIF_SERVICE_ACCOUNT`: Service account email (from Step 5 setup)

**Setup Instructions**: See [infra/README.md](../infra/README.md#step-5-set-up-workload-identity-federation-on-your-computer) for detailed setup steps.

## Secret Manager

### Secret Organization

- **Naming Convention**: `vencura-{env}-{secret-name}`
- **Replication**: Automatic multi-region
- **Access Control**: IAM-based with conditions
- **Versioning**: Supports multiple versions for rotation

### Secret Access

- **Service Account Binding**: Each secret has IAM member for service account
- **IAM Conditions**: Can limit access by IP, time, etc.
- **Audit Logging**: All secret access logged
- **Monitoring**: Alert on unusual access patterns

### Secrets Stored

- `ENCRYPTION_KEY`: Master encryption key for private keys
- `DYNAMIC_ENVIRONMENT_ID`: Dynamic environment identifier
- `DYNAMIC_API_TOKEN`: Dynamic API authentication token
- `ARBITRUM_SEPOLIA_RPC_URL`: Blockchain RPC endpoint
- `DATABASE_URL`: Database connection string with credentials

## Database Security

### Cloud SQL Encryption

- **Encryption at Rest**: Enabled by default
- **Google-Managed Keys**: Uses Google-managed encryption keys
- **Automatic**: No configuration required
- **Transparent**: Application code unchanged

### Network Access

- **Private IP Only**: Cloud SQL uses private IP only, no public endpoint
- **Connection**: Unix socket via Cloud SQL Proxy
- **SSL/TLS**: Required for all connections
- **Access Control**: Database user with minimal privileges

## Zero Trust Implementation

### Network Zero Trust

- **Private IP Only**: Cloud SQL uses private IP only, no public endpoint
- **VPC Isolation**: Dedicated VPC separate from default network
- **VPC Connector**: Serverless VPC Access with `private-ranges-only` egress
- **Firewall Rules**: Explicit deny-all, allow only required traffic
- **Private Service Connection**: Direct connection to Cloud SQL via private network

### Identity Zero Trust

- **No User Accounts**: No human users with direct GCP access
- **Service Accounts Only**: All operations use service accounts
- **Workload Identity Federation**: GitHub Actions authenticate via WIF, no long-lived credentials
- **JWT Verification**: Every API request requires valid Dynamic JWT token
- **User Isolation**: Database queries always filtered by authenticated user ID

### Data Zero Trust

- **Encryption at Rest**: All sensitive data encrypted before storage
- **Encryption in Transit**: TLS/SSL for all network communication
- **Secret References**: Secrets referenced, never embedded in code
- **Key Separation**: Encryption keys stored separately from encrypted data
- **No Plaintext Storage**: Private keys never stored in plaintext

### Application Zero Trust

- **Container Isolation**: Each request runs in isolated container
- **No Persistent Storage**: Containers are stateless, no local file storage
- **In-Memory Decryption**: Private keys decrypted only when needed, in memory
- **Request Validation**: All inputs validated and sanitized
- **Authorization Checks**: Every operation verifies user ownership

## Key Management

### Encryption Key

- **Location**: Google Cloud Secret Manager
- **Naming**: `vencura-{env}-encryption-key`
- **Access**: Cloud Run service account only
- **Rotation**: Create new secret version, update Cloud Run config
- **Minimum Length**: 32 characters (enforced by application)

### Key Rotation Procedure

1. Generate new encryption key (32+ characters, cryptographically random)
2. Create new secret version in Secret Manager
3. Update Cloud Run service to use new secret version
4. **Important**: Old wallets remain encrypted with old key
5. **Migration**: Optionally re-encrypt wallets with new key (requires decryption with old key)

### Dynamic API Keys

- **Environment ID**: Stored in Secret Manager
- **API Token**: Stored in Secret Manager
- **Rotation**: Update secret version, restart Cloud Run service
- **Access**: Cloud Run service account only

## Audit Logging

### Recommended Logging

1. **Admin Activity Logs**: All admin actions
2. **Data Access Logs**: Database and secret access
3. **System Event Logs**: System-level events
4. **Access Transparency**: Cloud SQL access logs

### Log Retention

- **Default**: 30 days (free tier)
- **Recommended**: 1 year for production
- **Compliance**: Adjust based on requirements

## Organization Policies

### Recommended Policies

1. **Domain Restriction**: Restrict to company domain
2. **Resource Location**: Restrict resource creation to specific regions
3. **Service Account Key Creation**: Disable user-managed keys
4. **Compute Engine VM**: Restrict VM creation
5. **Storage Bucket**: Require uniform bucket-level access

## Deployment Security

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

### Container Image Signing

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

### Deployment Verification

- **Infrastructure as Code**: All changes via Pulumi (auditable)
- **Preview Before Apply**: `pulumi preview` shows changes
- **Approval Required**: Production deployments require manual trigger
- **Health Checks**: Verify deployment success

## Security Monitoring

### Recommended Monitoring

1. **Cloud Monitoring**: GCP Cloud Monitoring
2. **Security Command Center**: Threat detection
3. **Audit Logs**: Review access patterns
4. **Alerting**: Unusual activity alerts

### Key Metrics

- **Failed Authentication**: Monitor failed login attempts
- **Secret Access**: Unusual secret access patterns
- **Database Queries**: Unusual query patterns
- **API Errors**: High error rates
- **Deployment Activity**: Unauthorized deployments

## Security Audits

### Regular Audits

1. **IAM Review**: Quarterly review of IAM bindings
2. **Secret Rotation**: Regular secret rotation
3. **Access Review**: Review who has access to what
4. **Code Review**: Security-focused code reviews
5. **Penetration Testing**: Annual penetration tests

### Audit Checklist

- [ ] IAM permissions reviewed and minimized
- [ ] All secrets rotated in last 90 days
- [ ] All dependencies updated and scanned
- [ ] Security patches applied
- [ ] Access logs reviewed
- [ ] Incident response plan tested

## Additional Resources

- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Vercel Portability Strategy](./vercel-portability-strategy.md) - Current deployment approach
- [Google Cloud Deployment Option](./google-cloud-deployment.md) - Deployment guide
- [Infrastructure README](../infra/README.md) - Infrastructure setup

## Related Documentation

- [Vencura API Security](../apps/api/SECURITY.md) - Main security documentation (Vercel deployment)
- [Vercel Portability Strategy](./vercel-portability-strategy.md) - Current deployment strategy
- [Google Cloud Deployment Option](./google-cloud-deployment.md) - Deployment guide

