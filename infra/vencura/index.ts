// Load environment variables from .env file (for local development)
// In CI/CD, these are set via GitHub secrets
import * as dotenv from 'dotenv'
dotenv.config()

// Set GCP provider environment variables from .env BEFORE importing GCP
// The GCP provider reads from GOOGLE_PROJECT, GCLOUD_PROJECT, or GOOGLE_CLOUD_PROJECT
// Priority: GCP_PROJECT_ID env var > gcp:project Pulumi config
if (process.env.GCP_PROJECT_ID) {
  if (!process.env.GOOGLE_PROJECT) {
    process.env.GOOGLE_PROJECT = process.env.GCP_PROJECT_ID
  }
  if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = process.env.GCP_PROJECT_ID
  }
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    process.env.GOOGLE_CLOUD_PROJECT = process.env.GCP_PROJECT_ID
  }
}
if (process.env.GCP_REGION && !process.env.GOOGLE_REGION) {
  process.env.GOOGLE_REGION = process.env.GCP_REGION
}

import * as gcp from '@pulumi/gcp'
import { getConfig } from './lib/config'

// Get configuration (will use env vars or Pulumi config)
const config = getConfig()

// Ensure GCP provider env vars are set from config if not already set
// The Pulumi GCP provider reads from GOOGLE_PROJECT, GCLOUD_PROJECT, or GOOGLE_CLOUD_PROJECT
if (
  !process.env.GOOGLE_PROJECT &&
  !process.env.GCLOUD_PROJECT &&
  !process.env.GOOGLE_CLOUD_PROJECT
) {
  process.env.GOOGLE_PROJECT = config.projectId
  process.env.GCLOUD_PROJECT = config.projectId
  process.env.GOOGLE_CLOUD_PROJECT = config.projectId
}
if (!process.env.GOOGLE_REGION) {
  process.env.GOOGLE_REGION = config.region
}

// Create explicit GCP Provider instance with project and region
// This ensures the project is always set, even if environment variables aren't available
const gcpProvider = new gcp.Provider('gcp-provider', {
  project: config.projectId,
  region: config.region,
})
import { createNetwork } from './lib/network'
import { createDatabase } from './lib/database'
import { createSecrets } from './lib/secrets'
import { createServiceAccounts } from './lib/service-accounts'
import { createArtifactRegistry } from './lib/artifact-registry'
import { createDockerBuild } from './lib/docker-build'
import { createCloudRun } from './lib/cloud-run'
import { createOutputs } from './lib/outputs'

// Create network resources
const network = createNetwork(config, gcpProvider)

// Create secrets (including auto-generated DB password)
const secrets = createSecrets(config, gcpProvider)

// Create service accounts
const serviceAccounts = createServiceAccounts(config, secrets, gcpProvider)

// Create Artifact Registry
const artifactRegistry = createArtifactRegistry(config, serviceAccounts, gcpProvider)

// Build Docker image (conditionally - skips in CI/CD)
const dockerBuild = createDockerBuild(config, artifactRegistry)

// Create database (depends on network and secrets)
const database = createDatabase(config, network, secrets.dbPassword, gcpProvider)

// Grant service accounts access to database connection string secret
// (This must happen after database is created)
const dbConnSecretId = database.dbConnectionStringSecret.secretId
const cloudRunSaName = `${config.appName}-${config.environment}-cloud-run-sa`
const cicdSaName = `${config.appName}-${config.environment}-cicd-sa`

new gcp.secretmanager.SecretIamMember(
  `${cloudRunSaName}-db-conn-secret-access`,
  {
    secretId: dbConnSecretId,
    role: 'roles/secretmanager.secretAccessor',
    member: serviceAccounts.cloudRunServiceAccount.email.apply(email => `serviceAccount:${email}`),
  },
  {
    provider: gcpProvider,
    dependsOn: [serviceAccounts.cloudRunServiceAccount, database.dbConnectionStringSecret],
  },
)

new gcp.secretmanager.SecretIamMember(
  `${cicdSaName}-db-conn-secret-access`,
  {
    secretId: dbConnSecretId,
    role: 'roles/secretmanager.secretAccessor',
    member: serviceAccounts.cicdServiceAccount.email.apply(email => `serviceAccount:${email}`),
  },
  {
    provider: gcpProvider,
    dependsOn: [serviceAccounts.cicdServiceAccount, database.dbConnectionStringSecret],
  },
)

// Create Cloud Run service (depends on all other resources and Docker image)
const cloudRun = createCloudRun(
  config,
  network,
  database,
  secrets,
  serviceAccounts,
  artifactRegistry,
  dockerBuild,
  gcpProvider,
)

// Export outputs
const outputs = createOutputs(
  config,
  cloudRun,
  database,
  serviceAccounts,
  secrets,
  network,
  artifactRegistry,
)

export const cloudRunUrl = outputs.cloudRunUrl
export const databaseConnectionName = outputs.databaseConnectionName
export const cloudRunServiceAccountEmail = outputs.cloudRunServiceAccountEmail
export const cicdServiceAccountEmail = outputs.cicdServiceAccountEmail
export const secretNames = outputs.secretNames
export const vpcConnectorName = outputs.vpcConnectorName
export const artifactRegistryUrl = outputs.artifactRegistryUrl
export const environment = outputs.environment
export const projectId = outputs.projectId
export const region = outputs.region
