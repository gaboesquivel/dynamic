# Vencura Security Review Report

**Date**: 2024-12-19  
**Reviewer**: Security Assessment  
**Scope**: Complete system security review (Infrastructure, Application, Deployment, Frontend, Architecture)

## Executive Summary

This security review assessed the Vencura custodial wallet system across infrastructure, application code, deployment workflows, frontend, and architecture. The system demonstrates strong security fundamentals with AES-256-GCM encryption, Dynamic Labs authentication, and zero-trust network architecture. However, several critical and high-priority security issues were identified that require immediate attention, particularly around public access controls, secret management in CI/CD, and input validation.

**Overall Security Posture**: Good foundation with critical gaps requiring immediate remediation.

### Risk Summary

- **Critical**: 1 issue (1 fixed ✅)
- **High**: 5 issues (2 fixed ✅, 1 accepted, 2 remaining)
- **Medium**: 8 issues
- **Low**: 6 issues

**Note**: Public access to Cloud Run is intentional - Cloudflare provides DDoS protection in front of the service.

---

### CRIT-002: Secrets Exposed in Ephemeral PR Deployment Environment Variables ✅ FIXED

**Location**: `.github/workflows/deploy-dev.yml:82-176`

**Issue**: Ephemeral PR deployments expose sensitive secrets as plaintext environment variables in Cloud Run service configuration.

**Status**: ✅ **FIXED** - Secrets are now stored in Secret Manager and referenced via `--set-secrets` instead of `--set-env-vars`.

```yaml
--set-env-vars "PORT=3000,DYNAMIC_ENVIRONMENT_ID=${{ secrets.DYNAMIC_ENVIRONMENT_ID }},DYNAMIC_API_TOKEN=${{ secrets.DYNAMIC_API_TOKEN }},ARBITRUM_SEPOLIA_RPC_URL=${{ secrets.ARBITRUM_SEPOLIA_RPC_URL }},ENCRYPTION_KEY=${{ secrets.ENCRYPTION_KEY }},USE_PGLITE=true"
```

**Impact**:

- Secrets visible in Cloud Run service configuration (readable by anyone with Cloud Run viewer permissions)
- Secrets visible in deployment logs
- Secrets exposed in PR comments/deployment URLs
- Violates secret management best practices

**Recommendation**:

- Use Secret Manager for all secrets, even in ephemeral deployments
- Reference secrets via `--set-secrets` instead of `--set-env-vars`
- Create temporary secrets in Secret Manager for PR deployments
- Clean up secrets after PR closure

**Remediation**: ✅ **IMPLEMENTED**

- Temporary secrets are created in Secret Manager with naming pattern `vencura-pr-{number}-{secret-name}`
- Secrets are referenced via `--set-secrets` instead of `--set-env-vars`
- Secrets are automatically cleaned up when PR is closed
- CI/CD service account granted `roles/secretmanager.admin` for managing temporary secrets

**Implementation Details**:

- Secrets created in "Create temporary secrets for PR deployment" step
- Cloud Run default compute service account granted access to temporary secrets
- Cleanup step deletes both Cloud Run service and temporary secrets on PR close
- Service account permissions updated in `infra/vencura/lib/service-accounts.ts`

**Priority**: Immediate ✅ RESOLVED

---

## High Priority Findings

### HIGH-001: Missing Input Validation on Ethereum Address Format ✅ FIXED

**Location**: `apps/vencura/src/wallet/dto/send-transaction.dto.ts`

**Issue**: The `to` field in `SendTransactionDto` only validated that it's a non-empty string, but didn't validate Ethereum address format.

**Status**: ✅ **FIXED** - Ethereum address format validation added using `@Matches()` decorator.

**Remediation**: ✅ **IMPLEMENTED**

- Added `@Matches(/^0x[a-fA-F0-9]{40}$/)` decorator to validate Ethereum address format
- Validates 0x-prefixed 40-character hexadecimal addresses
- Provides clear error message for invalid addresses

**Priority**: High ✅ RESOLVED

---

### HIGH-002: Missing Rate Limiting ✅ FIXED

**Location**: Application-wide

**Issue**: No rate limiting was implemented on API endpoints, particularly sensitive operations like wallet creation, signing, and transaction sending.

**Status**: ✅ **FIXED** - Rate limiting implemented using `@nestjs/throttler` with endpoint-specific limits.

**Remediation**: ✅ **IMPLEMENTED**

- Installed and configured `@nestjs/throttler`
- Global rate limit: 100 requests per minute for general endpoints
- Wallet creation: 10 requests per minute
- Sign operations: 30 requests per minute
- Transaction sending: 20 requests per minute
- Rate limiting applied globally via `ThrottlerGuard`
- **Note**: Cloudflare provides additional DDoS protection in front of the service

**Priority**: High ✅ RESOLVED

---

### HIGH-003: No Network Parameter Validation

**Location**: `apps/vencura/src/wallet/dto/create-wallet.dto.ts`

**Issue**: Network parameter is optional and not validated against allowed values.

```typescript
export class CreateWalletDto {
  @ApiProperty({
    example: 'arbitrum-sepolia',
    description: 'Blockchain network',
  })
  network?: string // ⚠️ No validation
}
```

**Impact**:

- Invalid network values could cause errors
- Potential for injection attacks
- No protection against unsupported networks

**Recommendation**:

- Add validation to ensure network is from allowed list
- Use enum or `@IsIn()` decorator
- Default to 'arbitrum-sepolia' if not provided

**Remediation**:

```typescript
import { IsOptional, IsIn } from 'class-validator';

@IsOptional()
@IsIn(['arbitrum-sepolia'], {
  message: 'Network must be arbitrum-sepolia'
})
network?: string = 'arbitrum-sepolia';
```

**Priority**: High (1 week)

---

### HIGH-004: Missing CORS Configuration ✅ ACCEPTED

**Location**: `apps/vencura/src/main.ts`

**Issue**: No CORS configuration visible in the application.

**Status**: ✅ **ACCEPTED** - CORS left open intentionally for now. Will be configured as needed.

**Decision**: CORS configuration deferred. The application will handle CORS requirements as they arise during frontend integration.

**Priority**: High ✅ ACCEPTED (Deferred)

---

### HIGH-005: No Request Size Limits

**Location**: Application-wide

**Issue**: No explicit request body size limits configured, which could allow:

- Large payload attacks
- Memory exhaustion
- DoS attacks via large requests

**Impact**:

- Potential for DoS attacks
- Memory exhaustion
- Resource consumption attacks

**Recommendation**:

- Configure Express body parser limits
- Set reasonable limits for JSON payloads
- Monitor and alert on large requests

**Remediation**:

```typescript
// In main.ts or app configuration
app.use(express.json({ limit: '10kb' })) // Reasonable limit for API
```

**Priority**: High (1 week)

---

## Medium Priority Findings

### MED-001: Missing Image Signing in CI/CD

**Location**: `.github/workflows/deploy-dev.yml`, `.github/workflows/deploy-prod.yml`

**Issue**: Docker images are not signed before deployment, making it impossible to verify image integrity.

**Impact**:

- Cannot verify image authenticity
- Risk of deploying tampered images
- No protection against supply chain attacks

**Recommendation**:

- Implement Cosign for image signing
- Verify signatures before deployment
- Store signatures in Artifact Registry

**Priority**: Medium (1 month)

---

### MED-002: No Dependency Security Scanning

**Location**: CI/CD workflows

**Issue**: No automated dependency vulnerability scanning in CI/CD pipelines.

**Impact**:

- Vulnerable dependencies may be deployed
- No automated detection of known vulnerabilities
- Manual dependency review required

**Recommendation**:

- Add `npm audit` or `pnpm audit` to quality workflow
- Integrate Snyk or Dependabot
- Fail builds on high/critical vulnerabilities

**Priority**: Medium (1 month)

---

### MED-003: Missing Database Connection Pooling Configuration

**Location**: Database connection setup

**Issue**: No explicit connection pooling configuration visible, which could lead to:

- Connection exhaustion
- Performance issues
- Resource leaks

**Impact**:

- Potential for connection pool exhaustion
- Performance degradation under load
- Resource management issues

**Recommendation**:

- Configure connection pool limits
- Set connection timeout values
- Monitor connection pool usage

**Priority**: Medium (1 month)

---

### MED-004: Error Messages May Leak Information

**Location**: `apps/vencura/src/wallet/wallet.service.ts`, `apps/vencura/src/auth/auth.service.ts`

**Issue**: Some error messages may provide information that could be useful to attackers.

**Examples**:

- "Dynamic configuration is not set" - reveals internal configuration
- "ARBITRUM_SEPOLIA_RPC_URL is not set" - reveals environment variable names

**Impact**:

- Information disclosure
- Potential for reconnaissance
- Helps attackers understand system architecture

**Recommendation**:

- Use generic error messages in production
- Log detailed errors server-side only
- Don't expose internal configuration details

**Remediation**:

```typescript
// Instead of:
throw new Error('ARBITRUM_SEPOLIA_RPC_URL is not set')

// Use:
throw new InternalServerErrorException('Configuration error')
// Log detailed error server-side
```

**Priority**: Medium (1 month)

---

### MED-005: No Request ID/Tracing

**Location**: Application-wide

**Issue**: No request ID or tracing implemented, making it difficult to:

- Track requests across services
- Debug security incidents
- Audit user actions

**Impact**:

- Difficult to trace security incidents
- Limited audit trail
- Harder to debug issues

**Recommendation**:

- Implement request ID middleware
- Add correlation IDs to logs
- Include request IDs in error responses

**Priority**: Medium (1 month)

---

### MED-006: Missing Security Headers

**Location**: `apps/vencura/src/main.ts`

**Issue**: No security headers configured (e.g., HSTS, CSP, X-Frame-Options).

**Impact**:

- Missing protection against common web vulnerabilities
- No HSTS for HTTPS enforcement
- Missing clickjacking protection

**Recommendation**:

- Add helmet.js or configure security headers manually
- Set appropriate security headers
- Configure HSTS for production

**Remediation**:

```typescript
import helmet from 'helmet'

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
)
```

**Priority**: Medium (1 month)

---

### MED-007: No Separate GCP Projects Enforced

**Location**: Infrastructure configuration

**Issue**: While the infrastructure supports separate projects, there's no enforcement or validation that dev and prod use different projects.

**Impact**:

- Risk of deploying to wrong environment
- Potential for cross-environment access
- Configuration errors could affect production

**Recommendation**:

- Add validation in Pulumi config
- Enforce project separation via organization policies
- Add checks in CI/CD workflows

**Priority**: Medium (1 month)

---

### MED-008: Ephemeral Deployment Cleanup May Fail Silently

**Location**: `.github/workflows/deploy-dev.yml:196-203`

**Issue**: Cleanup of ephemeral deployments uses `|| true`, which means failures are silently ignored.

```yaml
gcloud run services delete $SERVICE_NAME \
--region ${{ env.REGION }} \
--quiet || true # ⚠️ Silently ignores failures
```

**Impact**:

- Failed cleanups may leave resources running
- Cost implications
- Resource leakage

**Recommendation**:

- Log cleanup failures
- Alert on cleanup failures
- Implement retry logic
- Monitor for orphaned resources

**Priority**: Medium (1 month)

---

## Low Priority Findings

### LOW-001: Console.log in Production Code

**Location**: `apps/vencura/src/main.ts:42-43`

**Issue**: Console.log statements in production code.

**Impact**:

- Minor: Logs may contain sensitive information
- Not ideal for production logging

**Recommendation**:

- Use proper logging library (e.g., Winston, Pino)
- Configure log levels
- Remove console.log from production code

**Priority**: Low

---

### LOW-002: Missing Health Check Endpoint Authentication

**Location**: `infra/vencura/lib/cloud-run.ts:127-146`

**Issue**: Health check endpoints (`/api`) may be publicly accessible if service is public.

**Impact**:

- Minor: Health check information disclosure
- Could be used for reconnaissance

**Recommendation**:

- Use dedicated health check endpoint
- Consider authentication for health checks
- Limit information exposed in health checks

**Priority**: Low

---

### LOW-003: No Explicit Timeout Configuration for External Calls

**Location**: `apps/vencura/src/auth/auth.service.ts:27-34`, `apps/vencura/src/wallet/wallet.service.ts`

**Issue**: External API calls (Dynamic API, RPC calls) don't have explicit timeout configuration.

**Impact**:

- Potential for hanging requests
- Resource exhaustion
- Poor user experience

**Recommendation**:

- Add timeout configuration to fetch calls
- Use AbortController for timeouts
- Configure reasonable timeouts

**Priority**: Low

---

### LOW-004: Missing Input Sanitization Documentation

**Location**: DTOs and validation

**Issue**: While validation exists, there's no explicit documentation about input sanitization.

**Impact**:

- Minor: Unclear security boundaries
- May lead to future vulnerabilities

**Recommendation**:

- Document input sanitization approach
- Add explicit sanitization if needed
- Review all user inputs

**Priority**: Low

---

### LOW-005: No Explicit Database Query Timeout

**Location**: Database queries

**Issue**: No explicit timeout configuration for database queries.

**Impact**:

- Potential for hanging queries
- Resource exhaustion
- Poor performance

**Recommendation**:

- Configure query timeouts
- Set reasonable timeout values
- Monitor query performance

**Priority**: Low

---

### LOW-006: Missing API Versioning

**Location**: API endpoints

**Issue**: No API versioning strategy implemented.

**Impact**:

- Minor: Future breaking changes may affect clients
- No clear deprecation path

**Recommendation**:

- Implement API versioning (e.g., `/v1/wallets`)
- Plan for future API changes
- Document versioning strategy

**Priority**: Low

---

## Positive Security Findings

### ✅ Strong Encryption Implementation

- AES-256-GCM encryption properly implemented
- Key derivation using Scrypt
- Authenticated encryption with IV and auth tags
- Encryption key stored in Secret Manager

### ✅ Zero Trust Network Architecture

- Private IP only for Cloud SQL
- VPC isolation
- Private service connections
- VPC Connector with private-ranges-only egress

### ✅ Least Privilege IAM

- Service accounts with minimal permissions
- Scoped secret access
- Separate service accounts for different purposes

### ✅ Input Validation

- DTO validation using class-validator
- ValidationPipe with whitelist and forbidNonWhitelisted
- Type checking and validation

### ✅ Authentication Implementation

- JWT verification with public key
- User isolation enforced
- Proper error handling for authentication failures

### ✅ Secrets Management

- Secrets stored in Secret Manager
- Secrets referenced, not embedded
- Environment-based secret naming

---

## Recommendations Summary

### Immediate Actions (Critical)

1. ✅ **Fix secret exposure in PR deployments** - Use Secret Manager references instead of env vars (COMPLETED)
2. **Note**: Public access to Cloud Run is intentional - Cloudflare provides DDoS protection in front of the service

### High Priority (1 week)

1. ✅ Add Ethereum address format validation (COMPLETED)
2. ✅ Implement rate limiting (COMPLETED)
3. Validate network parameter
4. ✅ Configure CORS properly (ACCEPTED - deferred)
5. Add request size limits

### Medium Priority (1 month)

1. Implement image signing
2. Add dependency scanning
3. Configure connection pooling
4. Improve error message handling
5. Add request tracing
6. Configure security headers
7. Enforce separate GCP projects
8. Improve cleanup error handling

### Low Priority (Best Practices)

1. Replace console.log with proper logging
2. Secure health check endpoints
3. Add timeouts to external calls
4. Document input sanitization
5. Configure query timeouts
6. Implement API versioning

---

## Security Testing Recommendations

1. **Penetration Testing**: Conduct professional penetration testing
2. **Dependency Scanning**: Implement automated dependency scanning
3. **SAST**: Add static application security testing
4. **DAST**: Consider dynamic application security testing
5. **Security Monitoring**: Implement security event monitoring
6. **Incident Response**: Test incident response procedures

---

## Compliance Considerations

- **SOC 2**: Review against SOC 2 requirements
- **GDPR**: Ensure user data handling compliance
- **Financial Regulations**: Consider if handling financial transactions
- **Audit Logging**: Ensure comprehensive audit logging

---

## Next Steps

1. ✅ **Critical Issues**: CRIT-002 fixed, CRIT-001 is intentional (Cloudflare provides DDoS protection)
2. ✅ **High Priority Issues**: HIGH-001 and HIGH-002 fixed, HIGH-004 accepted
3. **Create Remediation Plan**: Assign owners and timelines for remaining findings
4. **Implement Monitoring**: Add security monitoring and alerting
5. **Regular Reviews**: Schedule quarterly security reviews
6. **Security Training**: Ensure team is aware of security best practices

---

## Conclusion

The Vencura system demonstrates a strong security foundation with proper encryption, authentication, and network isolation. However, critical issues around public access and secret management require immediate attention. Addressing the critical and high-priority findings will significantly improve the security posture of the system.

**Overall Assessment**: Good security foundation with critical gaps requiring immediate remediation.

---

**Report Version**: 1.0  
**Next Review Date**: 2025-03-19 (Quarterly)
