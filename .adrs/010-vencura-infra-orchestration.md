# ADR 010: Vencura Infrastructure Orchestration

## Current Status

**Current Deployment**: The Vencura API is currently deployed to **Vercel** for all environments. Vercel provides excellent support for NestJS applications with reduced cold starts, automatic scaling, and seamless integration with our monorepo.

**Google Cloud Option**: We're working on a Google Cloud deployment option using Pulumi and GitHub Actions for production workloads that require enhanced control, security, and extensibility. See [Google Cloud Deployment Option](../../docs/google-cloud-deployment.md) for details.

## Context

We need to select an infrastructure-as-code (IaC) tool for managing Google Cloud Platform resources for the Vencura API deployment (as an alternative to Vercel). The tool must support:

- Type-safe, declarative infrastructure definitions
- Environment-based deployments (dev/prod)
- CI/CD integration with GitHub Actions
- GCP resource management (Cloud Run, Cloud SQL, VPC, Secret Manager)
- Team collaboration and version control
- Support for ephemeral PR deployments and persistent environments

## Considered Options

### Option A – Pulumi (TypeScript)

Infrastructure-as-code platform using TypeScript for declarative resource definitions.

**Pros**

- Type-safe infrastructure code in TypeScript (aligns with our codebase)
- Excellent developer experience with IDE support and autocomplete
- Strong GCP provider support with comprehensive resource coverage
- Composable, reusable components and patterns
- Good documentation and active community
- Supports multiple languages (TypeScript chosen for consistency)
- Strong CI/CD integration with GitHub Actions
- State management via Pulumi Cloud (or self-hosted)
- Preview changes before applying
- Easy rollback capabilities

**Cons**

- Requires Pulumi Cloud account (or self-hosted state management)
- Learning curve for team members new to Pulumi
- Smaller ecosystem than Terraform
- Additional tool dependency

### Option B – Terraform (HCL)

Industry-standard infrastructure-as-code tool using HCL (HashiCorp Configuration Language).

**Pros**

- Industry standard with large ecosystem and community
- Extensive GCP provider modules and resources
- Mature and battle-tested platform
- Large community and extensive documentation
- Wide adoption in enterprise environments
- Self-hosted state management options

**Cons**

- HCL syntax (separate from application codebase)
- Less type safety compared to TypeScript
- More verbose configuration
- Team uses TypeScript, not HCL (context switching)
- Less IDE support compared to TypeScript
- Requires separate tooling and learning

### Option C – GCP CLI Scripts

Bash/Python scripts using `gcloud` CLI and GCP APIs directly.

**Pros**

- Direct GCP API access with full control
- No additional tools required (just gcloud CLI)
- Can be customized for specific needs
- Immediate execution and feedback

**Cons**

- No declarative state management
- Difficult to track infrastructure changes
- Error-prone manual scripting
- Hard to maintain and version control
- No rollback capabilities
- Difficult to test and validate
- No infrastructure drift detection
- Requires extensive error handling
- Not idempotent by default

### Option D – Manual via Google Cloud Console

Manual configuration through Google Cloud Console web interface.

**Pros**

- Visual interface with immediate feedback
- No code or scripts required
- Easy for one-off configurations
- Good for learning and exploration

**Cons**

- Not version controlled
- No reproducibility across environments
- Error-prone manual configuration
- Difficult to maintain consistency
- No automation possible
- No rollback capabilities
- Difficult to document and share
- Not suitable for team collaboration

### Option E – Kubernetes (GKE Autopilot)

Managed Kubernetes orchestration using Google Kubernetes Engine (GKE) Autopilot mode.

**Pros**

- Fully managed cluster (no node management, auto-scaling, auto-upgrades)
- Industry-standard container orchestration platform
- Excellent for complex microservices architectures
- Strong ecosystem with Helm, operators, and Kubernetes-native tools
- Advanced features: service mesh, ingress controllers, horizontal pod autoscaling
- Declarative configuration via YAML manifests
- Version-controlled infrastructure (manifests in Git)
- Strong CI/CD integration with kubectl and GitOps tools
- Multi-cloud portability (Kubernetes runs everywhere)
- Fine-grained control over container scheduling and networking
- Support for stateful workloads and persistent volumes
- Built-in service discovery and load balancing

**Cons**

- More complex than serverless options (Cloud Run)
- Requires Kubernetes knowledge and YAML configuration
- Additional abstraction layer over container runtime
- Higher operational overhead compared to Cloud Run
- More expensive than Cloud Run for simple workloads
- Requires understanding of pods, services, deployments, ingress
- More moving parts to manage and monitor
- Steeper learning curve for team members new to Kubernetes
- Overkill for simple API deployments
- Still requires IaC tool (Pulumi/Terraform) to provision GKE cluster
- Ephemeral PR deployments more complex (namespace management)

## Decision

We will use **Pulumi with TypeScript** for infrastructure orchestration of the Google Cloud deployment option.

**Main reasons:**

- Type-safe infrastructure code aligns with our TypeScript codebase, reducing context switching
- Declarative, version-controlled infrastructure enables reproducibility and collaboration
- Excellent GCP provider support with comprehensive resource coverage
- Composable, reusable patterns for maintainable infrastructure code
- Strong CI/CD integration with GitHub Actions for automated deployments
- Better developer experience than HCL or scripts with IDE support
- Preview and rollback capabilities for safer deployments
- Support for ephemeral PR deployments and environment-based configurations

**Note**: This decision applies to the Google Cloud deployment option. The primary deployment platform is Vercel, which provides excellent developer experience and reduced cold starts for backend APIs. The Google Cloud option is intended for production workloads requiring enhanced security, control, and extensibility.

## Deployment Strategy

### Ephemeral PR Deployments

For pull requests, we deploy ephemeral Cloud Run containers that:

- Use **PGLite** (embedded database) instead of Cloud SQL
- Have unique service names: `vencura-pr-{pr-number}`
- Are automatically cleaned up when PRs are closed or merged
- Use GitHub Secrets for environment variables
- Provide preview URLs for PR reviewers
- Enable isolated testing without database setup overhead

**Benefits:**

- Fast deployment without database provisioning
- Cost-effective (no persistent resources)
- Isolated testing environment per PR
- No risk of affecting shared dev/prod databases

### Dev Environment

The development environment:

- Deploys automatically on merge to `main` branch
- Uses persistent Cloud Run service: `vencura-dev`
- Connects to Cloud SQL Postgres (dev instance)
- Runs database migrations automatically
- Managed via Pulumi infrastructure code
- Uses Secret Manager for sensitive configuration

### Prod Environment

The production environment:

- Code provided but not auto-deployed in demo
- Uses persistent Cloud Run service: `vencura-prod`
- Connects to Cloud SQL Postgres (prod instance with HA)
- Requires manual deployment approval
- Full production-grade infrastructure configuration
- Enhanced monitoring and alerting

## CI/CD Integration

### GitHub Actions Workflows

1. **Quality Tests** (`quality.yml`): Runs on all PRs and pushes
   - Lint, type check, unit tests, E2E tests
   - Must pass before deployment

2. **Dev Deployment** (`deploy-dev.yml`):
   - PRs to main → Ephemeral deployment with PGLite
   - Direct pushes to main → Persistent dev deployment with Cloud SQL

3. **Prod Deployment** (`deploy-prod.yml`):
   - Manual workflow dispatch
   - Full production deployment (code provided, not auto-deployed in demo)

### Authentication

- Workload Identity Federation for secure GCP authentication
- No long-lived service account keys
- Least privilege IAM roles

## Notes

- **Current Deployment**: Vercel is used for all environments (development, production, and PR previews)
- **Google Cloud Option**: Infrastructure code lives in `/infra/vencura` directory (work in progress)
- Separate Pulumi stacks for dev and prod environments
- All sensitive values stored in Secret Manager
- Cloud SQL uses private IP only (no public access)
- VPC Connector enables Cloud Run to access private Cloud SQL
- Service accounts follow least privilege principle
- Ephemeral PR deployments use PGLite to avoid database setup complexity
- Production deployments require manual approval for safety
- Regular infrastructure reviews and updates as requirements evolve

## When to Use Google Cloud vs Vercel

**Use Vercel when:**

- Fast iteration and deployment are priorities
- Standard security and compliance requirements are sufficient
- Cold starts are acceptable (Vercel has significantly reduced cold starts)
- Simplicity and ease of use are important

**Use Google Cloud when:**

- Enhanced security and compliance features are required
- Fine-grained control over infrastructure is needed
- Avoiding cold starts is critical (persistent instances)
- Integration with other GCP services is required
- Custom networking or security policies are needed
- Handling sensitive financial data (wallet API) requires additional controls
