import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'
import type { Config } from './config'
import { resourceName } from './config'
import type { SecretResources } from './secrets'

export interface ServiceAccountResources {
  cloudRunServiceAccount: gcp.serviceaccount.Account
  cicdServiceAccount: gcp.serviceaccount.Account
}

export function createServiceAccounts(
  config: Config,
  secrets: SecretResources,
  provider: gcp.Provider,
): ServiceAccountResources {
  const cloudRunSaName = resourceName(config, 'cloud-run-sa')
  const cicdSaName = resourceName(config, 'cicd-sa')

  // Cloud Run service account
  const cloudRunServiceAccount = new gcp.serviceaccount.Account(
    cloudRunSaName,
    {
      accountId: cloudRunSaName,
      displayName: `Cloud Run service account for ${config.environment}`,
      description: `Service account for Vencura Cloud Run service in ${config.environment}`,
    },
    { provider },
  )

  // IAM binding: Secret Manager accessor (with IAM conditions to limit to specific secrets)
  // Note: dbConnectionStringSecret is added in database module, so we'll add it separately
  new gcp.secretmanager.SecretIamMember(
    `${cloudRunSaName}-secret-dynamic-environment-id`,
    {
      secretId: secrets.secrets.dynamicEnvironmentId.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cloudRunServiceAccount.email}`,
    },
    { provider, dependsOn: [cloudRunServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cloudRunSaName}-secret-dynamic-api-token`,
    {
      secretId: secrets.secrets.dynamicApiToken.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cloudRunServiceAccount.email}`,
    },
    { provider, dependsOn: [cloudRunServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cloudRunSaName}-secret-arbitrum-sepolia-rpc-url`,
    {
      secretId: secrets.secrets.arbitrumSepoliaRpcUrl.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cloudRunServiceAccount.email}`,
    },
    { provider, dependsOn: [cloudRunServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cloudRunSaName}-secret-encryption-key`,
    {
      secretId: secrets.secrets.encryptionKey.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cloudRunServiceAccount.email}`,
    },
    { provider, dependsOn: [cloudRunServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cloudRunSaName}-secret-db-password`,
    {
      secretId: secrets.secrets.dbPassword.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cloudRunServiceAccount.email}`,
    },
    { provider, dependsOn: [cloudRunServiceAccount] },
  )

  // IAM binding: Cloud SQL client
  new gcp.projects.IAMMember(
    `${cloudRunSaName}-cloudsql-client`,
    {
      project: config.projectId,
      role: 'roles/cloudsql.client',
      member: pulumi.interpolate`serviceAccount:${cloudRunServiceAccount.email}`,
    },
    { provider, dependsOn: [cloudRunServiceAccount] },
  )

  // CI/CD service account (for GitHub Actions)
  const cicdServiceAccount = new gcp.serviceaccount.Account(
    cicdSaName,
    {
      accountId: cicdSaName,
      displayName: `CI/CD service account for ${config.environment}`,
      description: `Service account for GitHub Actions CI/CD in ${config.environment}`,
    },
    { provider },
  )

  // IAM binding: Artifact Registry writer
  new gcp.projects.IAMMember(
    `${cicdSaName}-artifact-registry-writer`,
    {
      project: config.projectId,
      role: 'roles/artifactregistry.writer',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  // IAM binding: Cloud Run admin
  new gcp.projects.IAMMember(
    `${cicdSaName}-run-admin`,
    {
      project: config.projectId,
      role: 'roles/run.admin',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  // IAM binding: Secret Manager accessor (for reading secrets during deployment)
  new gcp.secretmanager.SecretIamMember(
    `${cicdSaName}-secret-dynamic-environment-id`,
    {
      secretId: secrets.secrets.dynamicEnvironmentId.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cicdSaName}-secret-dynamic-api-token`,
    {
      secretId: secrets.secrets.dynamicApiToken.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cicdSaName}-secret-arbitrum-sepolia-rpc-url`,
    {
      secretId: secrets.secrets.arbitrumSepoliaRpcUrl.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cicdSaName}-secret-encryption-key`,
    {
      secretId: secrets.secrets.encryptionKey.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  new gcp.secretmanager.SecretIamMember(
    `${cicdSaName}-secret-db-password`,
    {
      secretId: secrets.secrets.dbPassword.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  // IAM binding: Secret Manager admin (for creating/deleting temporary secrets in PR deployments)
  // This allows CI/CD to create ephemeral secrets for PR preview deployments
  new gcp.projects.IAMMember(
    `${cicdSaName}-secretmanager-admin`,
    {
      project: config.projectId,
      role: 'roles/secretmanager.admin',
      member: pulumi.interpolate`serviceAccount:${cicdServiceAccount.email}`,
    },
    { provider, dependsOn: [cicdServiceAccount] },
  )

  return {
    cloudRunServiceAccount,
    cicdServiceAccount,
  }
}
