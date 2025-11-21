# Vencura Infrastructure

Production-grade infrastructure-as-code for the Vencura API using Pulumi and Google Cloud Platform.

## Overview

This directory contains Pulumi TypeScript infrastructure code for deploying the Vencura NestJS API to Google Cloud Run with Cloud SQL Postgres, VPC networking, Secret Manager, and secure service accounts.

## Architecture Decisions

- **[ADR 007: Vencura API Infrastructure](/docs/adrs/007-vencura-api-infrastructure)** - Decision to use Google Cloud Run
- **[ADR 010: Vencura Infrastructure Orchestration](/docs/adrs/010-vencura-infra-orchestration)** - Decision to use Pulumi for infrastructure orchestration

## Structure

```
/infra
  /vencura
    Pulumi.yaml                    # Pulumi project config
    Pulumi.dev.yaml               # Dev stack config
    Pulumi.prod.yaml               # Prod stack config
    package.json                   # Pulumi dependencies
    tsconfig.json                  # TypeScript config
    index.ts                       # Main Pulumi program
    /lib
      config.ts                    # Environment-aware configuration
      network.ts                   # VPC, subnet, VPC Connector
      database.ts                  # Cloud SQL Postgres (private IP)
      secrets.ts                   # Secret Manager
      service-accounts.ts         # IAM with least privilege
      artifact-registry.ts         # Artifact Registry repository
      docker-build.ts              # Docker image building and pushing
      cloud-run.ts                 # Cloud Run service
      outputs.ts                   # Stack outputs
    /utils
      helpers.ts                   # Utility functions
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.4.1
- Pulumi CLI (latest)
- Google Cloud SDK (`gcloud`)
- GCP project with billing enabled
- Pulumi Cloud account (or self-hosted state backend)
- GitHub repository with Actions enabled
- GitHub secrets configured (see First-Time Setup below)

**Note**: The infrastructure code uses `dotenv` to load environment variables from `.env` files for local development. The `dotenv` package is included in dependencies and automatically loads `.env` files when running Pulumi commands locally.

## Infrastructure Management Strategy

### 🎯 Overview

**Note**: Google Cloud deployment workflows are currently **disabled**. All systems are deployed on Vercel. The GitHub Actions workflows (`.github/workflows/deploy-*.yml.disabled`) are preserved for future reference but are not active.

**If using Google Cloud**: After initial setup, GitHub Actions workflows would automatically manage all infrastructure changes to keep code and infrastructure in sync. You would not need to run Pulumi commands manually for routine deployments.

### What Would Be Automated by GitHub Workflows (Currently Disabled)

✅ **All infrastructure provisioning and updates**  
✅ **Container image builds and pushes**  
✅ **Cloud Run service deployments**  
✅ **Infrastructure change previews**  
✅ **Stack output retrieval**  
✅ **Health checks (production only)**

### What You Do on Your Computer

🖥️ **One-time initial setup** (see First-Time Setup below)  
🖥️ **Local testing** of infrastructure changes before committing  
🖥️ **Emergency fixes** or troubleshooting  
🖥️ **Destroying infrastructure** (rare, typically for cleanup)

### How It Works

#### 1. Pull Request Deployments (Ephemeral)

- **Trigger**: PR open/update (any push to PR branch triggers redeployment)
- **What Happens**:
  - ✅ Workflow builds Docker image
  - ✅ Workflow pushes to Artifact Registry
  - ✅ Workflow deploys to temporary Cloud Run service (`vencura-pr-{number}`)
  - ✅ Uses PGLite (embedded database) - no Cloud SQL needed
  - ✅ Posts/updates PR comment with deployment URL
  - ✅ Automatically cleaned up when PR is closed/merged
- **Infrastructure Changes**: ❌ None - just deploys the application
- **Manual Steps Required**: ❌ None
- **Redeployment**: ✅ Automatically redeploys on every push to the PR branch
- **PR Comments**: ✅ Service URL is posted in a PR comment (updated on each deployment, not duplicated)

#### 2. Development Deployments (Persistent)

- **Trigger**: Push to `main` branch
- **What Happens**:
  - ✅ Workflow builds Docker image
  - ✅ Workflow pushes to Artifact Registry
  - ✅ Workflow runs `pulumi preview` to show infrastructure changes
  - ✅ Workflow runs `pulumi up --yes` to apply infrastructure changes
  - ✅ Workflow updates Cloud Run service with new container image
  - ✅ Workflow retrieves infrastructure outputs (URLs, connection strings, etc.)
- **Infrastructure Changes**: ✅ Fully automated - infrastructure stays in sync with code
- **Manual Steps Required**: ❌ None (after initial setup)

#### 3. Production Deployments (Persistent)

- **Trigger**: Manual workflow dispatch (requires typing "deploy" to confirm)
- **What Happens**:
  - ✅ Workflow validates confirmation
  - ✅ Workflow builds Docker image
  - ✅ Workflow pushes to Artifact Registry
  - ✅ Workflow runs `pulumi preview` to show infrastructure changes
  - ✅ Workflow runs `pulumi up --yes` to apply infrastructure changes
  - ✅ Workflow updates Cloud Run service with new container image
  - ✅ Workflow runs health checks after deployment
  - ✅ Workflow retrieves infrastructure outputs
- **Infrastructure Changes**: ✅ Fully automated - infrastructure stays in sync with code
- **Manual Steps Required**: ✅ Manual trigger (safety measure)

### Benefits of This Strategy

- ✅ **Infrastructure as Code**: All infrastructure changes are version-controlled
- ✅ **Automatic Sync**: Code and infrastructure always stay in sync
- ✅ **Consistent Deployments**: Same process for all team members
- ✅ **Audit Trail**: All changes tracked in Pulumi state and GitHub
- ✅ **Safe Changes**: Preview runs before applying changes
- ✅ **No Manual Steps**: After setup, everything is automated

## First-Time Setup

> ⚠️ **This is a one-time setup** required before the GitHub workflows can manage infrastructure automatically. After completing these steps, all future infrastructure changes will be handled by GitHub Actions.

### Step 1: Install Dependencies (On Your Computer)

```bash
cd infra/vencura
pnpm install
```

### Step 2: Login to Pulumi (On Your Computer)

```bash
pulumi login
```

This authenticates with Pulumi Cloud (or your self-hosted backend) to store infrastructure state.

### Step 3: Authenticate with Google Cloud (On Your Computer)

Before running Pulumi commands, you need to authenticate with Google Cloud Platform using Application Default Credentials. This allows Pulumi to access your GCP project.

**If you're using WSL (Windows Subsystem for Linux):**

```bash
gcloud auth application-default login
```

This command will:

1. Open a browser window for authentication
2. Store application default credentials that Pulumi can use
3. Allow Pulumi to authenticate with GCP when running `pulumi up`, `pulumi preview`, etc.

**If you haven't set up gcloud in WSL yet:**

1. Install Google Cloud SDK (if not already installed):

   ```bash
   # For Ubuntu/Debian
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. Initialize gcloud:

   ```bash
   gcloud init
   ```

3. Then run the authentication command:
   ```bash
   gcloud auth application-default login
   ```

**Alternative: Using a service account key (not recommended for local dev)**

If you prefer using a service account key file instead:

1. Create/download a service account key from GCP Console
2. Set the environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

However, `gcloud auth application-default login` is the recommended approach for local development.

**Note**: The credentials are stored locally and will be reused for future Pulumi commands. You may need to re-authenticate periodically or if credentials expire.

**Also configure Docker for Artifact Registry** (required for local image building):

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Replace `us-central1` with your actual GCP region. This allows Docker to push images to Artifact Registry when Pulumi builds images locally.

### Step 4: Create Pulumi Stacks (On Your Computer)

Create the dev and prod stacks if they don't already exist:

```bash
# Create dev stack
pulumi stack init dev

# Create prod stack
pulumi stack init prod
```

### Step 5: Configure GCP Project Settings (On Your Computer)

Configure GCP project and region. The infrastructure code reads these values in this priority order:

1. **Environment variables** (`GCP_PROJECT_ID`, `GCP_REGION`) - Highest priority
2. **Pulumi config** (`gcp:project`, `gcp:region`) - Fallback if env vars not set

**Option A: Using .env file (Recommended for Local Development)**

The infrastructure code uses `dotenv` to automatically load environment variables from a `.env` file. Create a `.env` file in `infra/vencura/` directory:

```bash
cd infra/vencura
cat > .env << EOF
GCP_PROJECT_ID=your-gcp-project-id
GCP_REGION=us-central1
CLOUDFLARE_BASE_DOMAIN=gaboesquivel.com
EOF
```

Or copy the sample file:

```bash
cd infra/vencura
cp .env-sample .env
# Then edit .env with your actual values
```

**How it works:**

- The `index.ts` file automatically loads `.env` using `dotenv.config()`
- Environment variables from `.env` are loaded before Pulumi config is read
- This makes local development easy - just create `.env` and run Pulumi commands
- **Important**: Make sure `.env` is in `.gitignore` (it should be by default) - never commit this file

**Option B: Using Pulumi Config (Alternative)**

If you prefer not to use `.env`, you can set values directly in Pulumi config:

```bash
pulumi stack select dev
pulumi config set gcp:project your-gcp-project-id
pulumi config set gcp:region us-central1

pulumi stack select prod
pulumi config set gcp:project your-gcp-project-id
pulumi config set gcp:region us-central1
```

**Note**: The `vencura:environment` setting is already configured in `Pulumi.dev.yaml` and `Pulumi.prod.yaml` - you don't need to change it.

**For CI/CD**: GitHub workflows automatically set `GCP_PROJECT_ID` and `GCP_REGION` as environment variables from GitHub secrets, so no `.env` file is needed in CI/CD.

### Step 6: Set Up Workload Identity Federation (On Your Computer)

Workload Identity Federation (WIF) allows GitHub Actions to authenticate to GCP without storing long-lived service account keys. This is a **one-time setup** that needs to be done before the workflows can run.

#### Prerequisites

- GCP project with billing enabled
- `gcloud` CLI installed and authenticated
- Appropriate permissions to create IAM resources

#### Create WIF Pool and Provider

Run these commands to create the WIF pool and provider for GitHub Actions:

```bash
# Set your project ID (replace with your actual project ID)
PROJECT_ID=$(gcloud config get-value project)

# Create WIF pool
gcloud iam workload-identity-pools create vencura-github-pool \
  --location=global \
  --description="Workload Identity Pool for GitHub Actions" \
  --display-name="Vencura GitHub Pool" \
  --project="$PROJECT_ID"

# Get your repository owner and name
REPO_OWNER="gaboesquivel"  # Replace with your GitHub username or organization
REPO_NAME="dynamic"        # Replace with your repository name

# Create WIF provider for GitHub Actions
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
WIF_PROVIDER_AUDIENCE="https://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/vencura-github-pool/providers/github"

gcloud iam workload-identity-pools providers create-oidc github \
  --location=global \
  --workload-identity-pool=vencura-github-pool \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --allowed-audiences="https://token.actions.githubusercontent.com,${WIF_PROVIDER_AUDIENCE}" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="attribute.repository_owner=='${REPO_OWNER}' && attribute.repository=='${REPO_OWNER}/${REPO_NAME}'" \
  --project="$PROJECT_ID"
```

**Important**: The `--allowed-audiences` must include both:

1. `https://token.actions.githubusercontent.com` - The standard GitHub Actions OIDC token audience
2. `https://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/vencura-github-pool/providers/github` - The WIF provider resource name (used by `google-github-actions/auth@v2` when requesting tokens)

This dual-audience configuration ensures compatibility with how `google-github-actions/auth@v2` requests OIDC tokens from GitHub Actions.

**If you already created the WIF provider with the wrong audience**, update it using:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
WIF_PROVIDER_AUDIENCE="https://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/vencura-github-pool/providers/github"

# Update existing WIF provider with correct audiences
gcloud iam workload-identity-pools providers update-oidc github \
  --workload-identity-pool=vencura-github-pool \
  --location=global \
  --allowed-audiences="https://token.actions.githubusercontent.com,${WIF_PROVIDER_AUDIENCE}" \
  --project="$PROJECT_ID"
```

#### Create Service Account for CI/CD

Create the service account that GitHub Actions will use:

```bash
PROJECT_ID=$(gcloud config get-value project)
SA_NAME="vencura-dev-cicd-sa"

# Create service account
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="Vencura Dev CI/CD Service Account" \
  --description="Service account for GitHub Actions CI/CD deployments to dev environment" \
  --project="$PROJECT_ID"
```

#### Grant IAM Permissions

Grant the necessary permissions to the service account. Pulumi needs broad permissions to create infrastructure resources:

```bash
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="vencura-dev-cicd-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Editor role (required for Pulumi to create VPC, Cloud SQL, and other resources)
# This gives the service account permissions to create and manage all GCP resources
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/editor"

# Grant additional specific roles for CI/CD operations
# Artifact Registry writer (to push Docker images)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

# Cloud Run admin (to deploy services)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

# Secret Manager admin (to manage secrets for PR deployments)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.admin"

# Service Networking admin (required for Private Service Connection to Cloud SQL)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/servicenetworking.serviceAgent"
```

**Note**: The `roles/editor` role is required because Pulumi needs to create various GCP resources including:

- VPC networks and subnets (compute resources)
- Cloud SQL instances (database resources)
- Service accounts (IAM resources)
- VPC connectors (serverless networking)
- And other infrastructure components

For production, consider creating a custom role with only the specific permissions needed, but `roles/editor` is the simplest approach for development environments.

#### Bind Service Account to WIF Provider

Allow the WIF provider to impersonate the service account:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
SA_EMAIL="vencura-dev-cicd-sa@${PROJECT_ID}.iam.gserviceaccount.com"
REPO_OWNER="gaboesquivel"  # Replace with your GitHub username or organization
REPO_NAME="dynamic"        # Replace with your repository name

# Bind service account to WIF provider
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/vencura-github-pool/attribute.repository_owner/${REPO_OWNER}/attribute.repository/${REPO_OWNER}/${REPO_NAME}" \
  --project="$PROJECT_ID"

# Grant service account permission to create tokens for itself (required for Docker authentication)
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --member="serviceAccount:$SA_EMAIL" \
  --project="$PROJECT_ID"
```

#### Get WIF Provider Resource Name

Get the WIF provider resource name that you'll need for GitHub secrets:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/vencura-github-pool/providers/github"
SA_EMAIL="vencura-dev-cicd-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "WIF_PROVIDER: $WIF_PROVIDER"
echo "WIF_SERVICE_ACCOUNT: $SA_EMAIL"
```

**Save these values** - you'll need them in the next step when configuring GitHub secrets.

**Note**: For production deployments, you may want to create a separate service account (`vencura-prod-cicd-sa`) with similar permissions. The setup process is the same, just use a different service account name.

### Step 7: Configure GitHub Secrets (On GitHub Website)

The GitHub workflows require these secrets to be configured in your repository. **Do this on GitHub, not your computer:**

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each secret below

**Required Secrets:**

- `GCP_PROJECT_ID`: Your GCP project ID (e.g., `vencura`)
- `GCP_REGION`: GCP region (default: `us-central1`)
- `GCP_ARTIFACT_REGISTRY`: Artifact Registry repository name (default: `vencura`)
- `PULUMI_ACCESS_TOKEN`: Pulumi access token (get from [Pulumi Cloud](https://app.pulumi.com/account/tokens))
- `WIF_PROVIDER`: Workload Identity Federation provider resource name (from Step 5)
  - Format: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/vencura-github-pool/providers/github`
- `WIF_SERVICE_ACCOUNT`: Workload Identity Federation service account email (from Step 5)
  - Format: `vencura-dev-cicd-sa@PROJECT_ID.iam.gserviceaccount.com`

**Application Secrets (for ephemeral PR deployments):**

- `DYNAMIC_ENVIRONMENT_ID`: Dynamic environment ID
- `DYNAMIC_API_TOKEN`: Dynamic API token
- `ARBITRUM_SEPOLIA_RPC_URL`: Arbitrum Sepolia RPC URL
- `ENCRYPTION_KEY`: Encryption key

**Cloudflare Secrets (for custom domain management):**

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Zone DNS Edit permissions
  - Create at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
  - Permissions needed: Zone → DNS → Edit
  - Zone Resources: Include → Specific zone → your base domain
- `CLOUDFLARE_ZONE_ID`: Zone ID for your base domain
  - **How to find it:**
    1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) and select your domain
    2. On the domain overview page, scroll to the right sidebar
    3. Look for "API" section - the Zone ID is displayed there
    4. **Alternative**: Check the URL when viewing your domain - format is `https://dash.cloudflare.com/{zone_id}/{domain_name}`
       - Example: `https://dash.cloudflare.com/f790d8fe6f11efefca4760eca1eee5b0/gaboesquivel.com`
       - The hexadecimal string (`f790d8fe6f11efefca4760eca1eee5b0`) is your Zone ID
- `CLOUDFLARE_BASE_DOMAIN`: Base domain for custom subdomains (default: `gaboesquivel.com`)
  - **How to find it:**
    1. This is simply your domain name (e.g., `gaboesquivel.com`)
    2. It's the domain you've added to Cloudflare
    3. You can see it in the Cloudflare dashboard domain list
    4. **Optional** - defaults to `gaboesquivel.com` if not set
    5. Used to construct subdomains like `vencura.{base_domain}` and `{branch-name}.vencura.{base_domain}`

### Step 8: Initial Infrastructure Creation

You have two options:

#### Option A: Let GitHub Workflow Create Infrastructure (Recommended)

1. Commit and push your code to `main` branch
2. The workflow will automatically create all infrastructure on first run
3. Monitor the workflow run in GitHub Actions tab to ensure success
4. **No manual Pulumi commands needed** ✅

#### Option B: Create Infrastructure Locally First (For Testing)

If you want to test locally before pushing:

```bash
# Select dev stack
pulumi stack select dev

# Preview what will be created
pulumi preview

# Create infrastructure
pulumi up

# Repeat for prod if needed
pulumi stack select prod
pulumi preview
pulumi up
```

### Step 9: Configure Secrets in Secret Manager (On Your Computer)

After infrastructure is created (either by workflow or locally), update secret values in Google Cloud Secret Manager. The infrastructure creates secrets with placeholder values that need to be updated:

```bash
# For dev environment
gcloud secrets versions add vencura-dev-dynamic-environment-id --data-file=- <<< "your-value"
gcloud secrets versions add vencura-dev-dynamic-api-token --data-file=- <<< "your-value"
gcloud secrets versions add vencura-dev-arbitrum-sepolia-rpc-url --data-file=- <<< "your-value"
gcloud secrets versions add vencura-dev-encryption-key --data-file=- <<< "your-value"

# For prod environment (if created)
gcloud secrets versions add vencura-prod-dynamic-environment-id --data-file=- <<< "your-value"
gcloud secrets versions add vencura-prod-dynamic-api-token --data-file=- <<< "your-value"
gcloud secrets versions add vencura-prod-arbitrum-sepolia-rpc-url --data-file=- <<< "your-value"
gcloud secrets versions add vencura-prod-encryption-key --data-file=- <<< "your-value"
```

**Note**: Database password is auto-generated and stored automatically by Pulumi - no manual step needed.

### Step 10: Verify Setup

1. **Check that stacks exist** (On Your Computer):

   ```bash
   pulumi stack ls
   ```

2. **Verify GitHub workflow can access Pulumi** (On GitHub Website):
   - Push a small change to `main` branch
   - Check the "Deploy to Dev" workflow run
   - It should successfully run `pulumi preview` and `pulumi up`

3. **Verify infrastructure outputs** (On Your Computer):
   ```bash
   pulumi stack select dev
   pulumi stack output
   ```

## Usage

### Manual Commands (For Local Testing)

After initial setup, you typically won't need these, but they're useful for local testing:

#### Preview Changes

```bash
pulumi preview
```

#### Deploy Infrastructure

```bash
pulumi up
```

When you run `pulumi up` locally, Pulumi will:

1. **Automatically build and push the Docker image** to Artifact Registry (if not in CI/CD)
2. Create or update all infrastructure resources
3. Deploy the Cloud Run service with the built image

**Note**: Docker image building is automatically skipped in CI/CD environments (GitHub Actions) since workflows handle image building separately. This only applies to local development.

When you run `pulumi up`, you'll see output showing the resources being created or updated:

![Pulumi Dev Update Output](./pulumi-dev.png)

#### Destroy Infrastructure

```bash
pulumi destroy
```

⚠️ **Warning**: Only destroy infrastructure if you're certain you want to delete everything. This is typically only done for cleanup or testing.

#### View Stack Outputs

```bash
pulumi stack output
```

Or get specific outputs:

```bash
pulumi stack output cloudRunUrl
pulumi stack output databaseConnectionName
```

### GitHub Workflow Commands (Automatic)

Once setup is complete, infrastructure changes happen automatically:

1. **Make changes** to infrastructure code in `infra/vencura/`
2. **Commit and push** to `main` (for dev) or trigger production workflow
3. **GitHub Actions** automatically:
   - Runs `pulumi preview` to show changes
   - Runs `pulumi up` to apply changes
   - Updates Cloud Run service with new image
4. **Monitor** the workflow run in GitHub Actions tab

## Environments

### Development (`dev`)

- **Cloud SQL**: `db-f1-micro` (minimal resources)
- **Cloud Run**: 1 CPU, 512Mi memory, 1-1 instances (always running)
- **Backups**: Disabled
- **HA**: Disabled
- **Deletion Protection**: Disabled
- **Auto-deploy**: On push to `main` branch (✅ Automated by GitHub workflow)

### Production (`prod`)

- **Cloud SQL**: `db-g1-small` (configurable)
- **Cloud Run**: 2 CPU, 1Gi memory, 1-10 instances
- **Backups**: Enabled (7-day retention)
- **HA**: Enabled (regional)
- **Deletion Protection**: Enabled
- **Auto-deploy**: Manual workflow dispatch (requires confirmation) (✅ Automated by GitHub workflow after trigger)

## Security Features

### Private IP & Networking

- Cloud SQL uses **private IP only** (no public IP)
- Dedicated VPC (not default) for isolation
- VPC Connector with minimal egress (Cloud SQL only)
- Private Service Connection for Cloud SQL
- Firewall rules: explicit deny-all, allow Cloud SQL only

### IAM Least Privilege

- **Cloud Run Service Account**:
  - `roles/secretmanager.secretAccessor` (scoped to specific secrets)
  - `roles/cloudsql.client` (Cloud SQL connection only)

- **CI/CD Service Account**:
  - `roles/artifactregistry.writer` (push Docker images)
  - `roles/run.admin` (deploy Cloud Run services)
  - `roles/secretmanager.secretAccessor` (read secrets)
  - `roles/iam.serviceAccountTokenCreator` (on itself - for ephemeral deployments using gcloud commands)
  - `roles/iam.workloadIdentityUser` (bound via WIF pool - allows GitHub Actions to impersonate this service account)

- **No** project-level permissions
- Separate service accounts per environment

### Secrets Handling

- All sensitive values in Secret Manager
- Secrets referenced via `secretAccessor` (not embedded)
- Database password auto-generated and stored in Secret Manager
- IAM conditions on secret access (limit to specific secrets)
- Secret versions for rotation support
- Replication policy (automatic)

## CI/CD Integration

The infrastructure is fully integrated with GitHub Actions workflows. See the [Infrastructure Management Strategy](#infrastructure-management-strategy) section above for details.

### Workflow Files

- **`.github/workflows/deploy-dev.yml`**: Handles dev deployments and PR previews
- **`.github/workflows/deploy-prod.yml`**: Handles production deployments

### How Workflows Handle Configuration

**Configuration Priority (highest to lowest):**

1. **Environment variables** (`GCP_PROJECT_ID`, `GCP_REGION`) - Set by GitHub workflows or `.env` file
2. **Pulumi config** (`gcp:project`, `gcp:region`) - Fallback option

**GitHub Actions workflows:**

- Workflows read `GCP_PROJECT_ID` and `GCP_REGION` from GitHub repository secrets
- These are set as environment variables in the workflow (`env: PROJECT_ID`, `env: REGION`)
- Pulumi commands run with these environment variables set
- The infrastructure code (`lib/config.ts`) reads from `process.env.GCP_PROJECT_ID` and `process.env.GCP_REGION` first

**Local development:**

- Create `.env` file in `infra/vencura/` with `GCP_PROJECT_ID` and `GCP_REGION`
- The `index.ts` file automatically loads `.env` using `dotenv.config()`
- Environment variables from `.env` are loaded before Pulumi config is read

**This means:**

- ✅ **Local development**: Use `.env` file (loaded automatically via dotenv)
- ✅ **CI/CD**: Uses GitHub secrets (set as environment variables in workflows)
- ✅ **No manual Pulumi config needed**: Environment variables take precedence over Pulumi config

### Workflow Behavior

**Ephemeral PR Deployments:**

- **Trigger**: PR open/update (any push to PR branch)
- **What's Automated**: ✅ Builds image, pushes to registry, deploys to Cloud Run, posts/updates PR comment with URL
- **Infrastructure**: Uses `gcloud` CLI directly (no Pulumi), uses PGLite (embedded database)
- **Redeployment**: ✅ Automatically redeploys on every push to PR branch
- **PR Comments**: ✅ Updates existing comment with new deployment URL (prevents comment spam)
- **Manual Steps**: ❌ None - fully automated

**Persistent Dev Deployments:**

- **Trigger**: Push to `main` branch
- **What's Automated**: ✅ Runs `pulumi preview`, runs `pulumi up` (which builds Docker image, pushes to registry, and updates Cloud Run service), retrieves outputs
- **Infrastructure**: Fully managed by Pulumi (provisions/updates all resources including Docker builds)
- **Docker Builds**: Handled automatically by Pulumi during `pulumi up` - no manual build/push steps needed
- **Authentication**: Uses Application Default Credentials (ADC) from WIF via `google-auth-library` - no gcloud commands needed
- **Manual Steps**: ❌ None - fully automated (after initial setup)

**Production Deployments:**

- **Trigger**: Manual workflow dispatch (requires typing "deploy" to confirm)
- **What's Automated**: ✅ Validates confirmation, runs `pulumi preview`, runs `pulumi up` (which builds Docker image, pushes to registry, and updates Cloud Run service), runs health checks, retrieves outputs
- **Infrastructure**: Fully managed by Pulumi (provisions/updates all resources including Docker builds)
- **Docker Builds**: Handled automatically by Pulumi during `pulumi up` - no manual build/push steps needed
- **Authentication**: Uses Application Default Credentials (ADC) from WIF via `google-auth-library` - no gcloud commands needed
- **Manual Steps**: ✅ Manual trigger only (safety measure) - everything else is automated

## Cloudflare Custom Domain Setup

The infrastructure uses Cloudflare in front of Google Cloud Run to provide DDoS protection, SSL/TLS termination, and custom domain management.

### Domain Configuration

- **Base Domain**: Configurable via `CLOUDFLARE_BASE_DOMAIN` environment variable (default: `gaboesquivel.com`)
  - Set in GitHub secrets for CI/CD
  - Set in `.env` file for local development
  - Can also be set in Pulumi config as `cloudflareBaseDomain`
- **Dev Environment**: `vencura.{base_domain}` → Cloud Run dev service
- **PR Deployments**: `{branch-name}.vencura.{base_domain}` → Ephemeral Cloud Run services
  - Branch names are automatically sanitized for DNS compatibility (lowercase, hyphens only, max 63 chars)
  - Example: Branch `feature/auth` becomes `feature-auth.vencura.{base_domain}`

### Cloudflare Proxy Mode

All DNS records are configured with Cloudflare proxy enabled (orange cloud), which provides:

- DDoS protection
- SSL/TLS termination
- Global CDN distribution
- Web Application Firewall (WAF) capabilities

### SSL/TLS Configuration

Cloudflare SSL/TLS mode should be set to **"Full"** (not "Flexible") in the Cloudflare dashboard:

- Cloud Run provides valid SSL certificates
- Cloudflare terminates SSL and forwards to Cloud Run over HTTPS
- This ensures end-to-end encryption

### DNS Record Management

DNS records are automatically managed by GitHub Actions workflows:

- **Dev deployments**: DNS record `vencura.gaboesquivel.com` is created/updated automatically
- **PR deployments**: DNS records `{branch-name}.vencura.gaboesquivel.com` are created on PR open/update
- **PR cleanup**: DNS records are automatically deleted when PRs are closed or merged

### Manual Cloudflare Configuration

One-time setup in Cloudflare dashboard:

1. Verify your base domain (default: `gaboesquivel.com`) is added to Cloudflare
2. Ensure SSL/TLS mode is set to "Full" (not "Flexible")
   - Go to SSL/TLS → Overview → Set mode to "Full"
3. Configure caching rules if needed (APIs typically should not cache)
   - Go to Rules → Page Rules or Cache Rules

**Note**: If using a different base domain, set `CLOUDFLARE_BASE_DOMAIN` in your GitHub secrets and `.env` file.

### Required GitHub Secrets

See [Step 7: Configure GitHub Secrets](#step-7-configure-github-secrets-on-github-website) for details on:

- `CLOUDFLARE_API_TOKEN`: API token with Zone DNS Edit permissions
- `CLOUDFLARE_ZONE_ID`: Zone ID for your base domain
  - Find in Cloudflare dashboard: Select domain → Overview → Right sidebar → API section
  - Or check the URL: `https://dash.cloudflare.com/{zone_id}/{domain_name}` - the hexadecimal string is your Zone ID
- `CLOUDFLARE_BASE_DOMAIN`: Base domain (default: `gaboesquivel.com`, optional)
  - This is your domain name (e.g., `gaboesquivel.com`)
  - The domain you've added to Cloudflare

## Resource Naming

All resources follow the pattern: `{app}-{env}-{resource}`

Examples:

- `vencura-dev-vpc`
- `vencura-dev-db`
- `vencura-dev-api`
- `vencura-prod-vpc`
- `vencura-prod-db`
- `vencura-prod-api`

## Stack Outputs

After deployment, the following outputs are available:

- `cloudRunUrl`: Cloud Run service URL
- `databaseConnectionName`: Cloud SQL connection name (`/cloudsql/{project}:{region}:{instance}`)
- `cloudRunServiceAccountEmail`: Cloud Run service account email
- `cicdServiceAccountEmail`: CI/CD service account email
- `secretNames`: Object with all secret names
- `vpcConnectorName`: VPC Connector name
- `artifactRegistryUrl`: Artifact Registry repository URL
- `environment`: Environment name (dev/prod)
- `projectId`: GCP project ID
- `region`: GCP region

Access outputs:

```bash
pulumi stack output cloudRunUrl
pulumi stack output databaseConnectionName
```

Or view all outputs:

```bash
pulumi stack output
```

**Note**: After GitHub workflow deployments, outputs are automatically retrieved and used by the workflow. You can also view them locally using the commands above.

## Troubleshooting

### Common Issues

**Issue**: `Error: failed to load application credentials` or `Error: google: could not find default credentials` (when running `pulumi up` or `pulumi preview`)

- **Solution**: You need to authenticate with GCP using Application Default Credentials. Run `gcloud auth application-default login` (see [Step 3: Authenticate with Google Cloud](#step-3-authenticate-with-google-cloud-on-your-computer) in the First-Time Setup section). This is required before running any Pulumi commands that interact with GCP.

**Issue**: `Error: failed to create VPC connector`

- **Solution**: Ensure the VPC has proper subnet configuration and private IP ranges

**Issue**: `Error: failed to create Cloud SQL instance`

- **Solution**: Check that Private Service Connection is established and VPC is properly configured

**Issue**: `Error: secret not found`

- **Solution**: Ensure secrets are created in Secret Manager with correct names matching the environment

**Issue**: `Error: service account lacks permissions`

- **Solution**: Verify IAM bindings are correctly applied and service accounts have required roles

**Issue**: `Error: Service account ... already exists` or `Error 409: alreadyExists` (when running `pulumi up`)

- **Solution**: This means the resource exists in GCP but is not in Pulumi's state. You need to import the existing resource into Pulumi state. For example, to import an existing service account:
  ```bash
  cd infra/vencura
  pulumi stack select dev
  pulumi import gcp:serviceaccount/account:Account vencura-dev-cicd-sa projects/PROJECT_ID/serviceAccounts/vencura-dev-cicd-sa@PROJECT_ID.iam.gserviceaccount.com
  ```
  Replace `PROJECT_ID` with your actual GCP project ID. After importing, run `pulumi up` again. The resource will now be managed by Pulumi.

**Issue**: `Error: PULUMI_ACCESS_TOKEN not set` (in GitHub workflow)

- **Solution**: Add `PULUMI_ACCESS_TOKEN` secret to GitHub repository secrets (Settings → Secrets and variables → Actions)

**Issue**: `Error: stack not found` (in GitHub workflow)

- **Solution**: Ensure stacks are created on your computer first (`pulumi stack init dev` and `pulumi stack init prod`)

**Issue**: Workflow fails with authentication errors

- **Solution**: Verify Workload Identity Federation is configured correctly and `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` secrets are set in GitHub

**Issue**: `Error: The audience in ID Token [https://iam.googleapis.com/***] does not match the expected audience https://token.actions.githubusercontent.com` (when using `google-github-actions/auth@v2`)

- **Solution**: This error indicates that the GitHub Actions OIDC token has an audience that doesn't match what the WIF provider expects. The `google-github-actions/auth@v2` action may request tokens with the WIF provider resource name as the audience. Fix by adding both audiences to the allowed list:
  1. **Update WIF provider configuration**: Add both the standard GitHub Actions audience and the WIF provider resource name:

     ```bash
     PROJECT_ID=$(gcloud config get-value project)
     PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
     WIF_PROVIDER_AUDIENCE="https://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/vencura-github-pool/providers/github"

     gcloud iam workload-identity-pools providers update-oidc github \
       --workload-identity-pool=vencura-github-pool \
       --location=global \
       --allowed-audiences="https://token.actions.githubusercontent.com,${WIF_PROVIDER_AUDIENCE}" \
       --project="$PROJECT_ID"
     ```

  2. **Verify workflow permissions**: Ensure your workflow has `id-token: write` permission (this is already set in the workflow ✅).
  3. **Check GitHub secrets**: Verify that `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` secrets are correctly set in GitHub repository settings. The `WIF_PROVIDER` should be in the format:
     ```
     projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/vencura-github-pool/providers/github
     ```
     Get the correct value using:
     ```bash
     PROJECT_ID=$(gcloud config get-value project)
     PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
     echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/vencura-github-pool/providers/github"
     ```
  4. **Verify attribute condition**: Ensure the WIF provider's attribute condition matches your repository. Check with:
     ```bash
     PROJECT_ID=$(gcloud config get-value project)
     gcloud iam workload-identity-pools providers describe github \
       --workload-identity-pool=vencura-github-pool \
       --location=global \
       --project="$PROJECT_ID" \
       --format="value(attributeCondition)"
     ```
     The condition should match your repository owner and name (e.g., `attribute.repository_owner=='gaboesquivel' && attribute.repository=='gaboesquivel/dynamic'`).

  See [Step 6: Set Up Workload Identity Federation](#step-6-set-up-workload-identity-federation-on-your-computer) for more details.

**Issue**: Workflow runs but infrastructure doesn't update

- **Solution**: Check workflow logs for `pulumi preview` output - it will show what changes (if any) will be applied. If no changes are shown, infrastructure is already in sync.

**Issue**: Workflow succeeds but Cloud Run service not accessible

- **Solution**: Check that secrets in Secret Manager have actual values (not placeholders), and verify service account has proper IAM permissions

**Issue**: `Image 'us-central1-docker.pkg.dev/.../vencura:latest' not found` (when running `pulumi up` locally)

- **Solution**: Pulumi automatically builds and pushes Docker images:
  - **Local Development**:
    1. Docker is installed and running
    2. You're authenticated with GCP: `gcloud auth application-default login`
    3. Docker is configured for Artifact Registry: `gcloud auth configure-docker REGION-docker.pkg.dev` (replace REGION with your region, e.g., `us-central1`)
    4. The image will be built automatically during `pulumi up`
    5. Authentication uses `gcloud auth print-access-token` (local gcloud CLI)
  - **CI/CD (Persistent Deployments)**:
    - Pulumi handles Docker builds automatically during `pulumi up`
    - Image tag is set from commit SHA via `GCP_IMAGE_TAG` environment variable
    - Authentication uses Application Default Credentials (ADC) from WIF via `google-auth-library`
    - The `google-github-actions/auth@v2` action sets up ADC automatically
    - No manual Docker build/push steps or gcloud commands needed
  - **CI/CD (Ephemeral PR Deployments)**:
    - Uses `gcloud` commands directly (no Pulumi)
    - Docker authentication handled via `gcloud auth configure-docker` (uses WIF credentials)

## Architecture Diagrams

### Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Dedicated VPC (vencura-{env}-vpc)        │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Private Subnet (10.0.0.0/24)                   │ │  │
│  │  │  ┌───────────────────────────────────────────┐  │ │  │
│  │  │  │  Cloud SQL Postgres (Private IP Only)     │  │ │  │
│  │  │  │  - No public IP                            │  │ │  │
│  │  │  │  - Private Service Connection              │  │ │  │
│  │  │  └───────────────────────────────────────────┘  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  VPC Connector (10.8.0.0/28)                    │ │  │
│  │  │  - Serverless VPC Access                        │ │  │
│  │  │  - Egress: private-ranges-only                 │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cloud Run Service                                    │  │
│  │  - Connected via VPC Connector                       │  │
│  │  - Accesses Cloud SQL via Unix socket                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Secret Manager                                       │  │
│  │  - Environment-prefixed secrets                       │  │
│  │  - Accessed via service account                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Artifact Registry                                    │  │
│  │  - Docker repository                                  │  │
│  │  - Container images                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Resource Relationships

```
┌──────────────┐
│   Config     │
│  (lib/config)│
└──────┬───────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│   Network    │                    │   Secrets    │
│ (lib/network)│                    │(lib/secrets) │
└──────┬───────┘                    └──────┬───────┘
       │                                     │
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────────┐
│  Database    │                    │ Service Accounts │
│(lib/database)│                    │(lib/service-     │
└──────┬───────┘                    │  accounts)       │
       │                            └──────┬───────────┘
       │                                     │
       │                                     │
       ├─────────────────────────────────────┤
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────────┐
│Artifact      │                    │   Cloud Run      │
│Registry      │                    │ (lib/cloud-run)  │
│(lib/artifact-│                    │                  │
│ registry)    │                    └──────────────────┘
└──────────────┘
```

### Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  Determine Deployment Type            │
        └───────────────────────────────────────┘
                    │                    │
        ┌───────────┘                    └───────────┐
        │                                            │
        ▼                                            ▼
┌──────────────┐                          ┌──────────────────┐
│  Ephemeral   │                          │    Persistent    │
│  (PR)        │                          │  (Main/Prod)     │
└──────────────┘                          └──────────────────┘
        │                                            │
        │                                            │
        ▼                                            ▼
┌──────────────┐                          ┌──────────────────┐
│ Build Image  │                          │  Build Image     │
│ (Docker)     │                          │  (Docker)        │
└──────┬───────┘                          └──────┬───────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌──────────────┐                          ┌──────────────────┐
│ Push to AR   │                          │  Push to AR      │
│ (gcloud)     │                          │  (gcloud)        │
└──────┬───────┘                          └──────┬───────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌──────────────┐                          ┌──────────────────┐
│ Deploy CR    │                          │  Pulumi Preview  │
│ (gcloud)     │                          │  (pulumi preview)│
│ - PGLite     │                          └──────┬───────────┘
│ - No infra   │                                 │
└──────────────┘                                 ▼
                                          ┌──────────────────┐
                                          │  Pulumi Update   │
                                          │  (pulumi up)     │
                                          │  - Provision/    │
                                          │    Update infra  │
                                          └──────┬───────────┘
                                                 │
                                                 ▼
                                          ┌──────────────────┐
                                          │  Update CR Image │
                                          │  (gcloud update) │
                                          └──────────────────┘
```

### Data Flow

```
┌──────────────┐
│   Internet   │
└──────┬───────┘
       │
       │ HTTPS
       ▼
┌──────────────┐
│  Cloud Run   │
│   Service    │
│              │
│  ┌────────┐  │
│  │ NestJS │  │
│  │  App   │  │
│  └───┬────┘  │
└──────┼───────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Secret       │  │  Cloud SQL   │  │  Artifact    │
│ Manager      │  │  Postgres    │  │  Registry    │
│              │  │              │  │              │
│ - Env vars   │  │ - Unix socket│  │ - Container  │
│ - API keys   │  │ - Private IP │  │   images     │
│ - DB pass    │  │ - VPC        │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
       │                  │
       │                  │
       └──────────────────┘
              │
              │ Via VPC Connector
              │ (Private Network)
              ▼
```

## Best Practices

1. **Always preview before applying**: Run `pulumi preview` to review changes (automatic in workflows)
2. **Use separate stacks**: Keep dev and prod environments isolated
3. **Rotate secrets regularly**: Update secret versions in Secret Manager
4. **Monitor costs**: Use GCP billing alerts and review resource usage
5. **Review IAM permissions**: Regularly audit service account permissions
6. **Backup strategy**: Ensure backups are enabled for production
7. **Version control**: Commit all infrastructure changes to git
8. **Documentation**: Update this README when making significant changes
9. **Test locally first**: Use `pulumi preview` locally before pushing changes to catch issues early
10. **Monitor workflows**: Check GitHub Actions runs after pushing infrastructure changes to ensure they succeed
11. **Let workflows handle deployments**: After initial setup, rely on GitHub workflows for all infrastructure changes - don't run `pulumi up` manually unless testing locally
12. **Review workflow logs**: If something goes wrong, check the workflow logs in GitHub Actions for detailed error messages

## Additional Resources

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [VPC Connector Documentation](https://cloud.google.com/vpc/docs/configure-serverless-vpc-access)
