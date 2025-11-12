# Google Cloud Deployment Option (Work in Progress)

This document describes the Google Cloud deployment option for the Vencura API, which provides enhanced control, security, and extensibility for production workloads.

## Overview

We're working on deploying the Vencura API to **Google Cloud Run** with infrastructure managed by **Pulumi** and automated via **GitHub Actions**. This deployment option is designed for production workloads that require:

- **Enhanced Security**: Private networking, VPC isolation, and fine-grained IAM controls
- **More Control**: Full control over infrastructure, scaling, and resource allocation
- **Avoid Cold Starts**: Persistent Cloud Run services with minimum instances
- **Extensibility**: Easy integration with other GCP services (Cloud SQL, Secret Manager, etc.)
- **Compliance**: Better support for enterprise security and compliance requirements

## Status

⚠️ **Work in Progress** - This deployment option is currently under development. The infrastructure code exists in `/infra/vencura` but is not yet fully integrated into the deployment pipeline.

## Architecture

### Infrastructure Components

- **Cloud Run**: Serverless container platform for running the NestJS API
- **Cloud SQL Postgres**: Managed PostgreSQL database with private IP
- **VPC Network**: Dedicated VPC for network isolation
- **VPC Connector**: Serverless VPC access for Cloud Run to connect to Cloud SQL
- **Secret Manager**: Secure storage for API keys, encryption keys, and database credentials
- **Artifact Registry**: Docker image repository
- **Cloudflare**: DDoS protection, SSL/TLS termination, and custom domain management

### Network Topology

```
Internet → Cloudflare → Cloud Run → VPC Connector → Cloud SQL (Private IP)
```

All database connections use private IP addresses only, ensuring no public exposure.

## Why Google Cloud?

### Advantages Over Vercel

1. **Enhanced Security**
   - Private networking with VPC isolation
   - Fine-grained IAM controls
   - Private IP database connections
   - Network-level security policies

2. **More Control**
   - Full control over infrastructure configuration
   - Custom scaling policies
   - Resource allocation control
   - Network topology control

3. **Avoid Cold Starts**
   - Persistent Cloud Run services with minimum instances
   - Always-on option for critical workloads
   - Predictable performance

4. **Extensibility**
   - Easy integration with other GCP services
   - Support for complex architectures
   - Custom networking and security policies
   - Advanced monitoring and logging

5. **Enterprise Features**
   - Compliance certifications (SOC 2, ISO 27001, etc.)
   - Advanced security features
   - Audit logging
   - Enterprise support options

### When to Use Google Cloud

Consider using the Google Cloud deployment option when:

- You need enhanced security and compliance features
- You require fine-grained control over infrastructure
- You need to avoid cold starts for critical workloads
- You want to integrate with other GCP services
- You need custom networking or security policies
- You're handling sensitive financial data (wallet API)

## Infrastructure as Code

The infrastructure is defined using **Pulumi** with TypeScript, providing:

- Type-safe infrastructure definitions
- Version-controlled infrastructure
- Environment-based deployments (dev/prod)
- Preview changes before applying
- Rollback capabilities

See [ADR 010](../.adrs/010-vencura-infra-orchestration.md) for infrastructure orchestration details.

## Deployment Environments

### Development Environment (`vencura-dev`)

- **Deployment**: Automatic on merge to `main` branch
- **Database**: Cloud SQL Postgres (dev instance)
- **Service**: Persistent Cloud Run service
- **Scaling**: 1-1 instances (always running)
- **Custom Domain**: `vencura.{base_domain}` via Cloudflare

### Production Environment (`vencura-prod`)

- **Deployment**: Manual workflow dispatch (requires confirmation)
- **Database**: Cloud SQL Postgres (prod instance with HA)
- **Service**: Persistent Cloud Run service
- **Scaling**: 1-10 instances with auto-scaling
- **Backups**: Enabled (7-day retention)
- **HA**: Enabled (regional)
- **Custom Domain**: `vencura.{base_domain}` via Cloudflare

### Ephemeral PR Deployments (`vencura-pr-{number}`)

- **Deployment**: Automatic on PR creation/update
- **Database**: PGLite (embedded, no Cloud SQL)
- **Service**: Ephemeral Cloud Run service
- **Lifetime**: Auto-deleted on PR close/merge
- **Custom Domain**: `{branch-name}.vencura.{base_domain}` via Cloudflare

## CI/CD Integration

### GitHub Actions Workflows

1. **Quality Checks**: Runs on all PRs and pushes
   - Lint, type check, unit tests, E2E tests

2. **Dev Deployment**: Automatic on merge to `main`
   - Infrastructure provisioning via Pulumi
   - Docker image build and push
   - Cloud Run service update

3. **Prod Deployment**: Manual workflow dispatch
   - Full production deployment
   - Database migrations
   - Health checks

### Authentication

- **Workload Identity Federation**: Secure GCP authentication without service account keys
- **Least Privilege IAM**: Service accounts with minimal required permissions
- **Secret Management**: All secrets stored in Google Cloud Secret Manager

## Setup

For detailed setup instructions, see [infra/README.md](../infra/README.md).

### Quick Start

1. **Prerequisites**
   - GCP project with billing enabled
   - Pulumi Cloud account
   - GitHub repository with Actions enabled

2. **Initial Setup**

   ```bash
   cd infra/vencura
   pnpm install
   pulumi login
   gcloud auth application-default login
   ```

3. **Configure Infrastructure**
   - Set up Workload Identity Federation
   - Configure GitHub secrets
   - Create Pulumi stacks (dev/prod)

4. **Deploy**
   - Push to `main` branch for dev deployment
   - Use workflow dispatch for production

## Security Features

### Network Security

- **Private IP Only**: Cloud SQL uses private IP addresses only
- **VPC Isolation**: Dedicated VPC for the application
- **Firewall Rules**: Explicit deny-all, allow Cloud SQL only
- **Private Service Connection**: Secure connection to Cloud SQL

### IAM Security

- **Least Privilege**: Service accounts with minimal required permissions
- **Workload Identity Federation**: No long-lived service account keys
- **Secret Access**: Scoped access to specific secrets only

### Data Security

- **Encryption at Rest**: Cloud SQL encryption enabled
- **Encryption in Transit**: TLS for all connections
- **Secret Management**: All secrets in Secret Manager
- **Key Rotation**: Supported via Secret Manager versions

## Monitoring and Observability

- **Cloud Logging**: Centralized logging for all services
- **Cloud Monitoring**: Metrics and alerting
- **Error Reporting**: Automatic error tracking
- **Trace**: Distributed tracing support

## Cost Considerations

### Development Environment

- Cloud Run: ~$10-20/month (1 instance always running)
- Cloud SQL: ~$10-15/month (db-f1-micro)
- VPC Connector: ~$5/month
- **Total**: ~$25-40/month

### Production Environment

- Cloud Run: Variable based on traffic
- Cloud SQL: ~$50-100/month (db-g1-small with HA)
- VPC Connector: ~$5/month
- **Total**: Variable, typically $100-200/month for moderate traffic

## Migration from Vercel

When ready to migrate to Google Cloud:

1. Set up infrastructure using Pulumi
2. Configure GitHub Actions workflows
3. Set up secrets in Secret Manager
4. Deploy to dev environment first
5. Test thoroughly
6. Deploy to production
7. Update DNS records to point to Cloud Run

## Documentation

- [Infrastructure README](../infra/README.md) - Detailed setup and usage
- [ADR 010](../.adrs/010-vencura-infra-orchestration.md) - Infrastructure orchestration decision
- [ADR 007](../.adrs/007-vencura-api-infrastructure.md) - Infrastructure platform decision

## Support

For questions or issues with the Google Cloud deployment:

1. Check the [infra/README.md](../infra/README.md) troubleshooting section
2. Review GitHub Actions workflow logs
3. Check Pulumi stack outputs
4. Review Cloud Run service logs
