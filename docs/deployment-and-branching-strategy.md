# Deployment and Branching Strategy

This document outlines the comprehensive deployment and branching strategy for all systems in the Vencura monorepo, covering GitHub Flow, deployment targets (Vercel and Google Cloud), and hybrid deployment options.

## Overview

The Vencura monorepo uses **GitHub Flow** with `develop` as the primary development branch. All systems (API, Web, Mathler) follow a consistent deployment strategy with multiple deployment target options:

- **Primary**: Vercel (no-lock approach) - all systems deployed to Vercel
- **Alternative**: Google Cloud with Pulumi - full infrastructure-as-code option
- **Hybrid**: Split architecture - thin stateless API layer on Vercel Edge, critical systems (auth, key custody) on Google Cloud

## Branching Strategy: GitHub Flow

### Branch Structure

We use **GitHub Flow** with `develop` as the main development branch:

```
main (production)
  ↑
develop (staging/development)
  ↑
feature/*, fix/*, chore/* (feature branches)
```

### Main Branches

#### `develop` - Primary Development Branch

- **Purpose**: Main development branch, serves as the staging environment
- **Deployment**: Auto-deploys to Vercel Preview (staging environment)
- **Environment**: Staging/testnet configuration
- **Protection**: Should be kept stable and deployable
- **Merges**: Feature branches merge here first for testing

#### `main` - Production Branch

- **Purpose**: Production-ready code
- **Deployment**: Auto-deploys to Vercel Production (production environment)
- **Environment**: Production/mainnet configuration
- **Protection**: Protected branch (requires PR review)
- **Merges**: Only from `develop` or hotfix branches

### Branch Types

#### Feature Branches (`feature/*`)

- **Created from**: `develop`
- **Purpose**: New features and enhancements
- **Workflow**:
  1. Create from `develop`: `git checkout develop && git checkout -b feature/my-feature`
  2. Develop and test locally
  3. Push to GitHub (creates Vercel Preview deployment)
  4. Open PR targeting `develop`
  5. After review, merge to `develop`
  6. After validation on staging, merge `develop` to `main`

#### Fix Branches (`fix/*`)

- **Created from**: `develop` (for non-critical fixes) or `main` (for critical fixes)
- **Purpose**: Bug fixes
- **Workflow**: Same as feature branches

#### Hotfix Branches (`hotfix/*`)

- **Created from**: `main`
- **Purpose**: Critical production fixes that need immediate deployment
- **Workflow**:
  1. Create from `main`: `git checkout main && git checkout -b hotfix/critical-fix`
  2. Fix and test locally
  3. Merge to `main` first (for immediate production deployment)
  4. Merge to `develop` to keep branches in sync
  5. Delete hotfix branch after merge

#### Chore Branches (`chore/*`)

- **Created from**: `develop`
- **Purpose**: Maintenance tasks, dependencies, documentation
- **Workflow**: Same as feature branches

## Deployment Strategy

### Current Approach: Vercel No-Lock

**All systems are currently deployed to Vercel** using a no-lock approach:

- ✅ **No vendor lock-in**: Code remains portable and platform-agnostic
- ✅ **Framework Defined Infrastructure (FDI)**: Uses open frameworks (Next.js, NestJS) without proprietary APIs
- ✅ **Zero-configuration CI/CD**: Git push = automatic deployment
- ✅ **Preview deployments**: Every PR gets instant production-like preview URL
- ✅ **Global distribution**: 100+ edge locations, automatic CDN, edge functions
- ✅ **Monorepo support**: Automatic project detection, no manual configuration

See [Vercel Portability Strategy](./vercel-portability-strategy.md) for detailed portability approach.

### Deployment Targets

#### Vercel Deployments

**All applications** (`apps/api`, `apps/web`, `apps/mathler`) are configured for Vercel deployment:

| Application                  | Production URL               | Staging URL                              | Branch Mapping                             |
| ---------------------------- | ---------------------------- | ---------------------------------------- | ------------------------------------------ |
| **API** (`apps/api`)         | `vencura-api.vercel.app`     | `vencura-api-git-develop.vercel.app`     | `main` → Production<br>`develop` → Preview |
| **Web** (`apps/web`)         | `vencura-web.vercel.app`     | `vencura-web-git-develop.vercel.app`     | `main` → Production<br>`develop` → Preview |
| **Mathler** (`apps/mathler`) | `vencura-mathler.vercel.app` | `vencura-mathler-git-develop.vercel.app` | `main` → Production<br>`develop` → Preview |

**Configuration**: Each app has a `vercel.json` file that configures:

- Build commands (monorepo-aware)
- Output directories
- Framework detection
- Git branch deployment settings

**Example** (`apps/api/vercel.json`):

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter=vencura-api",
  "devCommand": "cd ../.. && pnpm dev --filter=vencura-api",
  "installCommand": "cd ../.. && pnpm install",
  "framework": null,
  "outputDirectory": "dist",
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": true
    }
  }
}
```

#### Google Cloud Deployments (Pulumi)

**Alternative deployment option** using Pulumi infrastructure-as-code:

- **Location**: `infra/vencura/` directory
- **Stack**: Pulumi TypeScript infrastructure
- **Target**: Google Cloud Run with Cloud SQL Postgres
- **Environments**: `dev` and `prod` stacks

**Deployment Workflow**:

1. Infrastructure changes committed to `main` branch
2. GitHub Actions workflow automatically:
   - Runs `pulumi preview` to show changes
   - Runs `pulumi up` to apply infrastructure changes
   - Builds and pushes Docker images to Artifact Registry
   - Updates Cloud Run service with new container image

**When to Use**:

- Production workloads requiring strict data governance
- Enhanced security requirements (HSM-backed keys, private networking)
- Regulatory/compliance requirements
- Need for MPC/threshold signing workflows

See [Infrastructure README](../infra/README.md) for detailed setup and usage.

### Hybrid Deployment Option

**Future option** for production security requirements - split architecture:

#### Architecture Split

**Vercel Edge (Stateless API Layer)**:

- Next.js frontend applications (`apps/web`, `apps/mathler`)
- Thin NestJS adapters for:
  - User authentication facades
  - Dashboards
  - Webhooks
  - Notifications
  - Public API facades
- Leverages Vercel's edge network, CDN, and excellent DX

**Google Cloud (Critical Systems)**:

- NestJS "signer" service on Cloud Run in private VPC
- Key custody and signing operations
- Authentication core (if enhanced security needed)
- Keys in Cloud KMS/HSM (optionally MPC/threshold signing)
- Direct VPC egress control, firewall rules, VPC Flow Logs
- Cloud Armor WAF for public endpoints

**Edge Between the Two**:

- Single public API on GCP protected by mTLS/OAuth SA tokens
- IP allowlisting and Cloud Armor
- Vercel functions call GCP API; everything else stays private

#### When to Consider Hybrid Approach

**Only if production security requirements demand**:

- Regulatory/compliance requirements for HSM-backed key custody
- Need for MPC/threshold signing workflows
- Requirement for private networking and strict egress control
- Enhanced audit trails and compliance beyond Vercel's capabilities
- Enterprise security requirements that exceed Vercel's offerings

**Current Status**: Documented as future option, **not implemented**. Everything stays on Vercel for demo/development phase.

See [Vercel Portability Strategy](./vercel-portability-strategy.md) for detailed hybrid architecture documentation.

## Deployment Workflows

### Standard Development → Staging → Production

#### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Develop locally
pnpm dev:local

# Push to GitHub (creates Vercel Preview deployment)
git push origin feature/my-feature

# Open PR targeting develop
# Vercel automatically creates preview deployment for PR
```

**Result**:

- ✅ Vercel Preview deployment created automatically
- ✅ Preview URL available in PR comments
- ✅ Uses staging/testnet environment variables

#### 2. Merge to Develop (Staging)

```bash
# After PR review and approval
git checkout develop
git merge feature/my-feature
git push origin develop
```

**Result**:

- ✅ Auto-deploys to Vercel Preview (staging environment)
- ✅ All apps (`api`, `web`, `mathler`) deploy to staging
- ✅ Uses staging/testnet configuration
- ✅ Team can validate changes on staging

#### 3. Merge to Main (Production)

```bash
# After validation on staging
git checkout main
git pull origin main
git merge develop
git push origin main
```

**Result**:

- ✅ Auto-deploys to Vercel Production (production environment)
- ✅ All apps (`api`, `web`, `mathler`) deploy to production
- ✅ Uses production/mainnet configuration
- ✅ Zero-downtime deployment with instant rollback capability

### Hotfix Workflow

For critical production fixes:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Fix and test locally
# ... make fixes ...

# Merge to main first (immediate production deployment)
git checkout main
git merge hotfix/critical-fix
git push origin main

# Merge to develop to keep branches in sync
git checkout develop
git merge hotfix/critical-fix
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-fix
git push origin --delete hotfix/critical-fix
```

**Result**:

- ✅ Immediate production deployment from hotfix branch
- ✅ `develop` branch updated to include hotfix
- ✅ Both branches remain in sync

### Google Cloud Deployment (Pulumi)

#### Development Environment (Dev Stack)

**Trigger**: Push to `main` branch

**Workflow**:

1. GitHub Actions workflow detects push to `main`
2. Runs `pulumi preview` (dev stack) to show infrastructure changes
3. Runs `pulumi up --yes` (dev stack) to apply changes
4. Builds Docker image and pushes to Artifact Registry
5. Updates Cloud Run service with new container image
6. Retrieves infrastructure outputs (URLs, connection strings)

**Result**:

- ✅ Infrastructure stays in sync with code
- ✅ Automatic Docker image builds and deployments
- ✅ Dev environment updated automatically

#### Production Environment (Prod Stack)

**Trigger**: Manual workflow dispatch (requires typing "deploy" to confirm)

**Workflow**:

1. Manual trigger from GitHub Actions (safety measure)
2. Validates confirmation
3. Runs `pulumi preview` (prod stack) to show infrastructure changes
4. Runs `pulumi up --yes` (prod stack) to apply changes
5. Builds Docker image and pushes to Artifact Registry
6. Updates Cloud Run service with new container image
7. Runs health checks after deployment
8. Retrieves infrastructure outputs

**Result**:

- ✅ Manual trigger prevents accidental production deployments
- ✅ Infrastructure changes previewed before applying
- ✅ Health checks ensure deployment success
- ✅ Production environment updated safely

See [Infrastructure README](../infra/README.md) for detailed Pulumi setup and configuration.

## Environment Configuration

### Environment Mapping

| Branch           | Environment | Blockchain Network                      | Deployment Target | Vercel Environment |
| ---------------- | ----------- | --------------------------------------- | ----------------- | ------------------ |
| `main`           | Production  | Mainnet (real chains)                   | Vercel Production | Production         |
| `develop`        | Staging     | Testnets (Sepolia, Arbitrum Sepolia)    | Vercel Preview    | Preview            |
| Feature branches | Development | Local Anvil (dev) or Testnets (preview) | Vercel Preview    | Preview            |

### Environment Variables

Environment variables are configured per environment in Vercel dashboard. See [Environment Strategy](./environment-strategy.md) for detailed configuration and required variables.

See [Environment Strategy](./environment-strategy.md) for detailed environment variable configuration.

## Monorepo Deployment Strategy

### All Systems Deployed Together

The monorepo contains multiple deployable applications:

1. **`apps/api`** - NestJS backend API (multichain custodial wallet platform)
2. **`apps/web`** - Next.js frontend for Vencura API
3. **`apps/mathler`** - Next.js Mathler game

**Deployment Approach**: All systems follow the same branching and deployment strategy:

- ✅ Same branch structure (`develop` → `main`)
- ✅ Same deployment triggers (push to branch)
- ✅ Same environment mapping (staging → production)
- ✅ Independent Vercel projects (separate deployments)
- ✅ Shared packages (`packages/*`) built and deployed with apps

### Build Strategy

**Turborepo** orchestrates builds across the monorepo:

- **Caching**: Turborepo caches build outputs for faster deployments
- **Parallel builds**: Packages and apps build in parallel
- **Dependency graph**: Automatically determines build order
- **Filtering**: Vercel uses `--filter` to build only the target app

**Example** (`apps/api/vercel.json`):

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter=vencura-api"
}
```

This ensures:

- ✅ Only the target app is built (not entire monorepo)
- ✅ Shared packages are built as dependencies
- ✅ Build cache is utilized for faster deployments

## Deployment Platforms

### Vercel (Primary - No-Lock Approach)

**Current Status**: All systems deployed to Vercel

**Advantages**:

- ✅ Zero-configuration CI/CD (Git push = deployment)
- ✅ Preview deployments for every PR
- ✅ Global edge network (100+ locations)
- ✅ Automatic SSL/TLS certificates
- ✅ Zero-downtime deployments with instant rollback
- ✅ Monorepo support (automatic project detection)
- ✅ Framework Defined Infrastructure (no vendor lock-in)
- ✅ Excellent developer experience

**Configuration**:

- Each app has `vercel.json` for build configuration
- Vercel dashboard for environment variables
- GitHub integration for automatic deployments

**Portability**: Code remains portable - can migrate to any platform without code changes. See [Vercel Portability Strategy](./vercel-portability-strategy.md).

### Google Cloud (Alternative - Pulumi)

**Status**: Available as alternative deployment option

**Advantages**:

- ✅ Infrastructure-as-code (Pulumi)
- ✅ Enhanced security (private VPC, HSM-backed keys)
- ✅ Strict data governance
- ✅ Regulatory compliance support
- ✅ Private networking and egress control
- ✅ Cloud Armor WAF

**Configuration**:

- Pulumi stacks (`dev`, `prod`) in `infra/vencura/`
- GitHub Actions workflows for automated deployments
- Cloud Run for serverless containers
- Cloud SQL for managed Postgres

**When to Use**:

- Production workloads requiring strict data governance
- Enhanced security requirements
- Regulatory/compliance needs
- MPC/threshold signing workflows

See [Infrastructure README](../infra/README.md) for detailed setup.

### Hybrid Approach (Future Option)

**Status**: Documented but not implemented

**Architecture**:

- **Vercel Edge**: Thin stateless API layer, frontend apps
- **Google Cloud**: Critical systems (auth, key custody, signing)

**When to Consider**:

- Production security requirements demand enhanced control
- Need for HSM-backed key custody
- Requirement for private networking
- Enhanced audit trails and compliance

**Current Status**: Everything stays on Vercel. Hybrid approach is documented as future option only if production security requirements demand it.

See [Vercel Portability Strategy](./vercel-portability-strategy.md) for detailed hybrid architecture.

## CI/CD Integration

### Vercel Deployments

**Automatic Triggers**:

- ✅ Push to `main` → Production deployment
- ✅ Push to `develop` → Staging deployment
- ✅ PR open/update → Preview deployment

**No Manual Steps Required**:

- ✅ GitHub integration handles everything
- ✅ Environment variables configured in Vercel dashboard
- ✅ Build commands configured in `vercel.json`

### Google Cloud Deployments (Pulumi)

**Automatic Triggers**:

- ✅ Push to `main` → Dev stack deployment (via GitHub Actions)
- ✅ Manual workflow dispatch → Prod stack deployment (safety measure)

**Workflow Steps**:

1. GitHub Actions workflow triggered
2. Authenticates with GCP via Workload Identity Federation
3. Runs `pulumi preview` to show infrastructure changes
4. Runs `pulumi up` to apply changes
5. Builds Docker image and pushes to Artifact Registry
6. Updates Cloud Run service
7. Retrieves infrastructure outputs

**Required Setup**:

- Workload Identity Federation configured
- GitHub secrets configured (`GCP_PROJECT_ID`, `PULUMI_ACCESS_TOKEN`, etc.)
- Pulumi stacks created (`dev`, `prod`)

See [Infrastructure README](../infra/README.md) for detailed CI/CD setup.

## Best Practices

### Branching

1. ✅ **Always branch from `develop`** for new features (except hotfixes)
2. ✅ **Keep `develop` stable** - it's the staging environment
3. ✅ **Never push directly to `main`** - use PRs
4. ✅ **Use descriptive branch names**: `feature/description`, `fix/description`, `hotfix/description`
5. ✅ **Merge hotfixes to both `main` and `develop`** to keep branches in sync
6. ✅ **Delete feature branches** after merging

### Deployment

1. ✅ **Test locally first** with `pnpm dev:local`
2. ✅ **Validate on staging** (`develop` branch) before production
3. ✅ **Monitor deployments** in Vercel dashboard or GitHub Actions
4. ✅ **Use preview deployments** for PR validation
5. ✅ **Keep environment variables in sync** across environments
6. ✅ **Document deployment changes** in PR descriptions

### Environment Variables

1. ✅ **Never commit secrets** - use Vercel dashboard or Secret Manager
2. ✅ **Use environment-specific values** (staging vs production)
3. ✅ **Keep `.env.example` files updated** for local development
4. ✅ **Rotate secrets regularly** in production
5. ✅ **Use Secret Manager** for Google Cloud deployments

### Infrastructure (Pulumi)

1. ✅ **Always preview before applying** (`pulumi preview`)
2. ✅ **Use separate stacks** for dev and prod
3. ✅ **Let GitHub workflows handle deployments** after initial setup
4. ✅ **Review workflow logs** after infrastructure changes
5. ✅ **Test locally first** before pushing changes

## Monitoring and Rollback

### Vercel

**Monitoring**:

- ✅ Vercel dashboard for deployment status
- ✅ Real-time logs for each deployment
- ✅ Performance metrics and analytics
- ✅ Error tracking (Sentry integration)

**Rollback**:

- ✅ One-click rollback in Vercel dashboard
- ✅ Instant rollback to previous deployment
- ✅ Zero-downtime rollback

### Google Cloud (Pulumi)

**Monitoring**:

- ✅ Cloud Run logs in GCP Console
- ✅ Health checks after deployment
- ✅ Infrastructure outputs retrieved automatically

**Rollback**:

- ✅ Revert infrastructure changes via `pulumi up` with previous code
- ✅ Rollback Cloud Run service to previous revision
- ✅ Use Pulumi state to track changes

## Troubleshooting

### Deployment Fails

1. Check build logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Check build command in `vercel.json`
4. Verify dependencies are installed correctly

### Environment Variables Not Loading

1. Check `NODE_ENV` is set correctly
2. Verify file names match environment (`.env.development`, `.env.staging`, `.env.production`)
3. Check Vercel dashboard for environment variable configuration
4. Verify variable names match exactly (case-sensitive)

### Blockchain Connection Issues

1. Check RPC URLs are correct for the environment
2. Verify `USE_LOCAL_BLOCKCHAIN` is set correctly (should be `false` for staging/production)
3. Check RPC provider status and rate limits
4. Verify chain IDs match the network

## Related Documentation

- [Vercel Portability Strategy](./vercel-portability-strategy.md) - Portability approach
- [Infrastructure README](../infra/README.md) - Pulumi setup and usage
- [Environment Strategy](./environment-strategy.md) - Environment variable configuration
- [Google Cloud Deployment](./google-cloud-deployment.md) - GCP deployment option

## Summary

The Vencura monorepo uses **GitHub Flow** with `develop` as the primary development branch:

- ✅ **Branching**: `develop` → `main` workflow with feature branches and hotfixes
- ✅ **Deployments**: All systems (`api`, `web`, `mathler`) deploy to Vercel by default
- ✅ **Vercel**: No-lock approach - code remains portable, excellent DX
- ✅ **Google Cloud**: Available as alternative via Pulumi for enhanced security
- ✅ **Hybrid**: Documented as future option for production security requirements
- ✅ **CI/CD**: Fully automated via GitHub integration and GitHub Actions

**Current Status**: All systems deployed to Vercel with no vendor lock-in. Google Cloud and hybrid options available when needed.
