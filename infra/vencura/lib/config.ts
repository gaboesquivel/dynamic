import * as pulumi from '@pulumi/pulumi'

export interface Config {
  projectId: string
  region: string
  zone: string
  environment: string
  appName: string
  cloudSqlTier: string
  cloudRunCpu: string
  cloudRunMemory: string
  cloudRunMinInstances: number
  cloudRunMaxInstances: number
  cloudSqlBackupEnabled: boolean
  cloudSqlHaEnabled: boolean
  imageTag: string
  cloudflareBaseDomain: string
}

export function getConfig(): Config {
  const config = new pulumi.Config()
  const gcpConfig = new pulumi.Config('gcp')

  // Read from environment variables first (for CI/CD), then Pulumi config, then defaults
  const projectId =
    process.env.GCP_PROJECT_ID || gcpConfig.get('project') || gcpConfig.require('project')
  const region = process.env.GCP_REGION || gcpConfig.get('region') || 'us-central1'
  const zone = gcpConfig.get('zone') || `${region}-a`
  const environment = config.get('environment') || 'dev'
  const appName = 'vencura'
  const cloudflareBaseDomain =
    process.env.CLOUDFLARE_BASE_DOMAIN || config.get('cloudflareBaseDomain') || 'gaboesquivel.com'

  // imageTag: Read from environment variable (for CI/CD with commit SHA), then Pulumi config, then default
  const imageTag =
    process.env.GCP_IMAGE_TAG ||
    process.env.GITHUB_SHA?.substring(0, 7) ||
    config.get('imageTag') ||
    'latest'

  return {
    projectId,
    region,
    zone,
    environment,
    appName,
    cloudSqlTier: config.get('cloudSqlTier') || 'db-f1-micro',
    cloudRunCpu: config.get('cloudRunCpu') || '1',
    cloudRunMemory: config.get('cloudRunMemory') || '512Mi',
    cloudRunMinInstances:
      config.getNumber('cloudRunMinInstances') ?? (environment === 'dev' ? 1 : 0),
    cloudRunMaxInstances: config.getNumber('cloudRunMaxInstances') ?? 2,
    cloudSqlBackupEnabled: config.getBoolean('cloudSqlBackupEnabled') || false,
    cloudSqlHaEnabled: config.getBoolean('cloudSqlHaEnabled') || false,
    imageTag,
    cloudflareBaseDomain,
  }
}

export function resourceName(config: Config, resource: string): string {
  return `${config.appName}-${config.environment}-${resource}`
}

export function secretName(config: Config, secret: string): string {
  return resourceName(config, secret)
}
