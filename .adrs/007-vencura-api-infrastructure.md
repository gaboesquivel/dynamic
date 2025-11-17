# ADR 007: Vencura API Infrastructure

## Context

We need to select a deployment platform for the NestJS Vencura API that:

- Supports containerized deployments (Docker)
- Handles WebSocket connections for real-time features
- Provides auto-scaling capabilities
- Offers cost-effective pricing with pay-per-use model
- Integrates well with CI/CD pipelines
- Supports environment variable management
- Provides good observability and monitoring
- Enables global distribution and low latency
- Works well with our monorepo structure

## Considered Options

### Option A – Google Cloud Run with Docker and Cloudflare

Serverless container platform with Cloudflare as CDN and DDoS protection.

**Pros**

- Fully managed serverless containers with auto-scaling to zero
- Pay only for what you use (per-request billing)
- Native Docker support with simple deployment
- Built-in HTTPS and custom domains
- Excellent WebSocket support for long-lived connections
- Global distribution with Cloudflare's edge network
- DDoS protection and security features via Cloudflare
- Cloudflare's free SSL/TLS certificates
- Easy integration with Google Cloud services (Cloud SQL, Pub/Sub, etc.)
- Good CI/CD integration with Cloud Build
- Built-in request logging and monitoring
- Supports environment variables and secrets management
- Cold start optimization for containers
- Can handle traffic spikes automatically

**Cons**

- Requires Docker knowledge for containerization
- Cold starts can add latency (mitigated by Cloudflare caching)
- Vendor lock-in to Google Cloud ecosystem
- Cloudflare configuration adds complexity
- Need to manage two services (Cloud Run + Cloudflare)

### Option B – AWS ECS (Elastic Container Service) with Application Load Balancer

Container orchestration service on AWS.

**Pros**

- Mature and widely used platform
- Full control over infrastructure
- Good integration with AWS services
- Supports long-running containers
- Flexible scaling options

**Cons**

- More complex setup and management
- Higher operational overhead
- More expensive for low to medium traffic
- Requires managing clusters, tasks, and services
- Less suitable for serverless workloads
- WebSocket support requires ALB configuration

### Option C – AWS Lambda with API Gateway

Serverless compute service.

**Pros**

- True serverless with automatic scaling
- Pay per request
- No infrastructure management

**Cons**

- Limited execution time (15 minutes max)
- WebSocket support is complex and limited
- Cold starts can be significant
- Not ideal for long-running connections
- NestJS requires adaptation for Lambda
- API Gateway can be expensive at scale

### Option D – Azure Container Apps

Serverless container platform on Azure.

**Pros**

- Serverless containers with auto-scaling
- Built-in Dapr support for microservices
- Good integration with Azure services
- Supports WebSockets

**Cons**

- Smaller ecosystem compared to AWS/GCP
- Less documentation and community resources
- More complex configuration
- Team has less experience with Azure
- Pricing can be less transparent

### Option E – Vercel

Serverless platform optimized for Next.js and Node.js, with significant 2024 improvements for backend support.

**Pros**

- Excellent developer experience
- Simple deployment process
- Built-in CI/CD
- Good performance for serverless functions
- **2024 Backend Improvements:**
  - Zero-configuration support for NestJS (no manual setup required)
  - Fluid Compute with Active CPU pricing (automatic scaling, pay-for-what-you-use)
  - Significantly reduced cold starts for backend APIs
  - Native support for long-running backend applications
- Seamless integration with monorepo structure
- MCP integration for AI-assisted deployment workflows

**Cons**

- Limited WebSocket support (improved but still has limitations)
- Function execution time limits (mitigated by Fluid Compute)
- More expensive at scale compared to Cloud Run
- Less suitable for workloads requiring strict data governance (custodial wallet security)
- Vendor-specific features can create lock-in if not managed carefully

### Option F – Railway

Modern platform for deploying applications.

**Pros**

- Simple deployment process
- Good developer experience
- Automatic HTTPS
- Supports Docker

**Cons**

- Smaller platform with less enterprise features
- Limited global distribution
- Less mature monitoring and observability
- Pricing can be unpredictable at scale
- WebSocket support may be limited

### Option G – Render

Cloud platform for deploying applications.

**Pros**

- Simple deployment
- Automatic HTTPS
- Supports Docker
- Good for small to medium applications

**Cons**

- Less suitable for high-scale applications
- Limited global distribution
- WebSocket support may have limitations
- Less enterprise-grade features

### Option H – Fly.io

Global application platform.

**Pros**

- Global distribution
- Good performance
- Supports Docker
- Good for edge deployments

**Cons**

- Smaller platform
- Less enterprise features
- Team has less experience
- Pricing can be complex

## Decision

We will deploy the NestJS Vencura API on **Google Cloud Run with Docker containers**, with **Cloudflare** in front of it for CDN, DDoS protection, and global distribution. We will configure Cloud Run with a **minimum instance count of 1** to eliminate cold starts and ensure consistent performance.

**Main reasons:**

- Serverless containers provide auto-scaling with pay-per-use pricing, making it cost-effective
- Native Docker support simplifies deployment and aligns with containerization best practices
- Excellent WebSocket support for real-time features required by the Vencura API
- Cloudflare provides global edge network, DDoS protection, and free SSL/TLS certificates
- Minimum instance of 1 eliminates cold starts and ensures consistent response times
- Good integration with Google Cloud services for future expansion (Cloud SQL, Pub/Sub, etc.)
- Built-in monitoring and logging capabilities
- Simple CI/CD integration with Cloud Build and GitHub Actions
- Cloudflare's caching layer reduces latency and improves performance globally

## Notes

- Docker images should be optimized for size and performance
- Cloudflare should be configured with appropriate caching rules for API responses
- Environment variables and secrets should be managed through Google Cloud Secret Manager
- Monitor Cloud Run metrics and Cloudflare analytics for optimization opportunities
- Consider Cloudflare Workers for edge computing needs in the future
- Review pricing regularly as traffic scales to optimize costs

## Portable-by-Default Architecture

**Critical architectural principle**: Our infrastructure is designed for portability:

- **Default approach**: Avoid vendor-specific features to maintain portability
- **Pragmatic exceptions**: Leverage vendor-specific features (e.g., Vercel edge functions, Cloud Run features) when scaling/performance needs justify from product/business perspective
- **Platform-agnostic**: Stack can run on any Linux distribution and be deployed to any containerized platform (Docker, Kubernetes, etc.)
- **Vercel as convenience**: Vercel is chosen for rapid deployment and excellent developer experience, not as a requirement
- **All core components** can be migrated to any platform without code changes

**For custodial wallet security**: Google Cloud + Pulumi provides enhanced control and security over sensitive financial data, making it preferred for production workloads requiring strict data governance. Vercel is suitable for development and rapid iteration, while Google Cloud offers the enhanced security and control needed for handling sensitive financial data.
