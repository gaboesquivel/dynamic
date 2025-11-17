# Vercel Portability Strategy

This document outlines the portability strategy for the Vencura API, ensuring that the application can be deployed to any platform without vendor lock-in while still allowing pragmatic use of Vercel-specific features when justified.

## Core Principle: Portable by Default

**Critical architectural principle**: Our stack is designed for portability and runs on any Linux distribution:

- **Default approach**: Avoid vendor-specific features to maintain portability
- **Pragmatic exceptions**: Can leverage vendor features (e.g., Vercel edge functions, optimizations) when scaling/performance needs justify from product/business perspective
- **Platform-agnostic**: Can be deployed to any containerized platform (Docker, Kubernetes, etc.)
- **Vercel as convenience**: Vercel is chosen for rapid deployment and excellent developer experience, not as a requirement
- **All core components** can be migrated to any platform without code changes

## Current Strategy: All on Vercel

**Important**: We are currently deploying everything on Vercel. We are NOT splitting the architecture now. This unified approach leverages Vercel's unparalleled shipping and distribution capabilities.

### Why Vercel's Shipping & Distribution is Priceless

**1. Framework Defined Infrastructure (FDI) - Anti-Vendor Lock-In:**

- Build with open frameworks (Next.js, NestJS) without proprietary APIs
- Code remains portable and adaptable across platforms
- Vercel automatically provisions infrastructure based on framework conventions
- Reduces vendor dependency while maintaining excellent DX

**2. Unmatched Deployment & Shipping Experience:**

- **Zero-Configuration CI/CD**: Git push = automatic deployment (GitHub integration)
- **Preview Deployments**: Every PR gets instant production-like preview URL
- **Zero-Downtime Deployments**: Atomic deployments with instant rollback capability
- **Monorepo Support**: Automatic project detection, no manual configuration
- **Instant Rollbacks**: One-click revert to previous deployment
- **Automatic SSL/TLS**: Certificates provisioned and renewed automatically
- **Spend Controls**: Built-in cost caps and alerts prevent runaway billing

**3. Global Distribution & Performance:**

- **100+ Edge Locations**: Content served from locations closest to users worldwide
- **Automatic CDN**: Static assets cached globally, reducing latency
- **Edge Functions**: Serverless functions at the edge for ultra-low latency
- **Incremental Static Regeneration (ISR)**: Update content without full rebuilds
- **On-Demand Image Optimization**: Automatic WebP conversion, responsive sizing
- **Edge Caching**: `stale-while-revalidate` strategies for instant responses
- **Automatic Scaling**: Handles traffic spikes without configuration

**4. Developer Experience Advantages:**

- **MCP Integration**: AI-assisted deployment workflows via Cursor
- **Vercel Workflows**: Stateful workflows for complex orchestrations
- **Feature Flags**: Built-in support for safe feature rollouts
- **Usage Dashboard**: Real-time insights into builds, functions, edge requests
- **Deployment Logs**: Comprehensive logging for debugging
- **Analytics Integration**: Performance monitoring built-in

**5. Security & Compliance:**

- **Automatic HTTPS**: All deployments encrypted by default
- **WAF/Firewall**: Built-in protection against common attacks
- **Deployment Protection**: Preview/production guardrails
- **SOC 2 Type II, ISO 27001**: Enterprise-grade compliance
- **Environment Variables**: Secure secrets management
- **Access Controls**: Fine-grained permissions for team members

**6. Cost Efficiency:**

- **Pay-Per-Use**: Only pay for what you use
- **Free Tier**: Generous free tier for development
- **Automatic Optimization**: Reduces unnecessary edge requests and builds
- **Spend Controls**: Prevent unexpected costs with caps and alerts

**Rationale for Staying on Vercel:**

- **Priceless Shipping Experience**: The combination of zero-configuration deployment, instant previews, global distribution, and seamless GitHub integration creates an unparalleled shipping experience that accelerates development cycles
- **Framework Portability**: FDI approach means we're not locked in - code works anywhere
- **2024 Backend Improvements**: Zero-config NestJS, Fluid Compute, reduced cold starts, long-running support
- **All-in-One Platform**: UI, API, edge functions, workflows, monitoring - everything in one place
- **Rapid Iteration**: Preview deployments enable fast feedback loops and confident shipping
- **Portable by Default**: Can migrate when needed, but Vercel's DX makes it unnecessary for now

## Future Production Security Option (Documented, Not Implemented)

**Important**: We are NOT splitting now. Everything stays on Vercel for the demo/development phase. This split architecture is documented as a potential future option ONLY if production security requirements demand it.

### Potential Split Architecture (For Future Production Security Needs)

**If production security requirements necessitate it, we may consider:**

**UI + Stateless API Glue on Vercel:**
- Next.js frontend applications
- Thin NestJS adapters for user auth, dashboards, webhooks, notifications
- Public API facades
- Leverages Vercel's excellent DX, edge network, and integrations

**Key-Custody & Signing Core on Google Cloud (Only if needed):**
- NestJS "signer" service on Cloud Run in private VPC
- Keys in Cloud KMS/HSM (optionally MPC/threshold signing)
- Direct VPC egress control, firewall rules, VPC Flow Logs
- Cloud Armor WAF for public endpoints
- Org-wide controls (IAM conditions, service perimeters, CMEK)

**Edge Between the Two:**
- Single public API on GCP protected by mTLS/OAuth SA tokens
- IP allowlisting and Cloud Armor
- Vercel functions call GCP API; everything else stays private

### When This Split Might Be Considered

**Only if production security requirements demand:**
- Regulatory/compliance requirements for HSM-backed key custody
- Need for MPC/threshold signing workflows
- Requirement for private networking and strict egress control
- Enhanced audit trails and compliance beyond Vercel's capabilities
- Enterprise security requirements that exceed Vercel's offerings

**Vercel's Current Security (Sufficient for Demo/Development):**
- Mature platform security (SOC 2 Type II, ISO 27001)
- WAF/Firewall, deployment protection
- Automatic HTTPS, SSL/TLS
- Secure environment variables
- Access controls and audit logs

**Google Cloud Advantages (Only if needed for production):**
- HSM-backed keys & KMS with ECDSA support, rotation, IAM, audit logs
- Option for MPC/threshold flows with Confidential Space + KMS co-signers
- Private networking & egress control on Cloud Run
- VPC egress, firewall rules, VPC Flow Logs
- Cloud Armor WAF in front of public edges
- Org-wide controls (IAM conditions, service perimeters, CMEK)
- Standard supply-chain hardening (Artifact Registry, Binary Auth)

## Portable Features

All of these features work identically on any platform:

### Application Code

- **NestJS Application**: Standard NestJS application with no Vercel-specific code
- **API Endpoints**: All endpoints use standard Express/NestJS patterns
- **Authentication**: Dynamic Labs JWT authentication (works everywhere)
- **Database**: DrizzleORM with PGLite (dev) or Postgres (prod) - platform agnostic
- **Encryption Service**: AES-256-GCM encryption using Node.js crypto (standard)
- **Error Handling**: Standard NestJS exception filters
- **Validation**: class-validator for DTOs, zod for env vars (standard libraries)

### Infrastructure Components

- **Docker Support**: Application can be containerized and run anywhere
- **Environment Variables**: Standard process.env (works on all platforms)
- **Secrets Management**: Can use any secrets manager (Vercel, GCP Secret Manager, AWS Secrets Manager, etc.)
- **Database Connections**: Standard Postgres connection strings
- **Logging**: Standard console.log (can be replaced with any logger)

### Security Features

- **Security Headers**: Helmet.js (works on any Express app)
- **Request Size Limits**: Express body parser limits (standard)
- **CORS**: NestJS CORS configuration (standard)
- **Request ID Middleware**: Custom middleware using standard Express patterns
- **Rate Limiting**: @nestjs/throttler (works on any NestJS app)

## Vercel-Specific Features (Optional)

These features are Vercel-specific but are **optional** and can be replaced with portable alternatives:

### Vercel Edge Functions

- **Status**: Not used in this application
- **Alternative**: Standard Node.js serverless functions (AWS Lambda, Cloud Functions, etc.)
- **Migration**: No migration needed - not used

### Vercel Analytics

- **Status**: Not used
- **Alternative**: Any analytics solution (Google Analytics, Mixpanel, etc.)
- **Migration**: No migration needed - not used

### Vercel Speed Insights

- **Status**: Not used
- **Alternative**: Any performance monitoring (New Relic, Datadog, etc.)
- **Migration**: No migration needed - not used

### Vercel KV/Postgres

- **Status**: Not used - we use standard Postgres
- **Alternative**: Any Postgres database (Cloud SQL, RDS, etc.)
- **Migration**: Already using portable Postgres

### Vercel Environment Variables

- **Status**: Used for configuration
- **Alternative**: Any environment variable management (GCP Secret Manager, AWS Secrets Manager, etc.)
- **Migration**: Standard process.env - works everywhere

## Migration Paths

### To Google Cloud Run

Already documented in [Google Cloud Deployment Option](./google-cloud-deployment.md):

1. Use existing Dockerfile
2. Deploy to Cloud Run using Pulumi
3. Use Cloud SQL for Postgres
4. Use Secret Manager for secrets
5. No code changes required

### To AWS Lambda/ECS

1. **Lambda**: Wrap NestJS app in Lambda handler (use `@nestjs/platform-express` adapter)
2. **ECS**: Use existing Dockerfile, deploy to ECS Fargate
3. **Database**: Use RDS Postgres
4. **Secrets**: Use AWS Secrets Manager
5. **Code Changes**: Minimal - mainly deployment configuration

### To Railway/Render/Fly.io

1. Use existing Dockerfile
2. Configure environment variables in platform dashboard
3. Connect to Postgres database (platform-managed or external)
4. Deploy via Git push or Docker image
5. **Code Changes**: None required

### To Self-Hosted Docker

1. Use existing Dockerfile
2. Run with `docker run` or docker-compose
3. Configure environment variables
4. Connect to Postgres database
5. **Code Changes**: None required

## Vercel Configuration

The `vercel.json` configuration file (if present) contains:

```json
{
  "buildCommand": "pnpm build --filter=vencura",
  "outputDirectory": "apps/vencura/dist",
  "framework": null,
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.js"
    }
  ]
}
```

**Migration Note**: This configuration is Vercel-specific but doesn't affect code portability. When migrating to other platforms:

- **Google Cloud Run**: Use Dockerfile, no vercel.json needed
- **AWS Lambda**: Use Lambda-specific configuration
- **Railway/Render**: Use platform-specific configuration files
- **Self-hosted**: Use Dockerfile directly

## Code Portability Checklist

When adding new features, ensure they are portable:

- ✅ Use standard Node.js APIs
- ✅ Use standard npm packages (not Vercel-specific)
- ✅ Avoid Vercel-specific imports or APIs
- ✅ Use environment variables for configuration
- ✅ Use standard Express/NestJS patterns
- ✅ Test with Docker locally
- ❌ Avoid Vercel Edge Runtime APIs
- ❌ Avoid Vercel-specific environment variables (unless optional)
- ❌ Avoid Vercel KV or other Vercel-only services

## When to Use Vercel-Specific Features

Use Vercel-specific features when:

1. **Performance Justification**: Feature provides significant performance improvement
2. **Business Justification**: Feature enables important business functionality
3. **Cost Justification**: Feature reduces costs significantly
4. **Documented Decision**: Decision is documented in ADR with migration path

**Example**: Using Vercel Edge Functions for a high-traffic endpoint that benefits from edge caching - acceptable if documented and migration path exists.

## Testing Portability

To verify portability:

1. **Docker Test**: Build and run Docker image locally
2. **Environment Variables**: Test with standard env vars (not Vercel-specific)
3. **Database**: Test with standard Postgres connection string
4. **No Vercel Imports**: Ensure no Vercel-specific imports in code

## Summary

The Vencura API is designed to be **portable by default**:

- ✅ All core features work on any platform
- ✅ No Vercel-specific code in application
- ✅ Standard Dockerfile for containerization
- ✅ Standard environment variables
- ✅ Standard database connections
- ✅ Migration paths documented for major platforms

**Current Deployment**: Everything is deployed on Vercel, leveraging its priceless shipping and distribution capabilities for rapid development and iteration.

**Future Option**: If production security requirements demand it, we may consider a split architecture with UI/API on Vercel and key-custody on Google Cloud. This is documented but not planned for implementation.

Vercel is used for **convenience and developer experience**, not as a requirement. The application can be migrated to any platform with minimal code changes.
