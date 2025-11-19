import * as gcp from '@pulumi/gcp'
import * as random from '@pulumi/random'
import * as pulumi from '@pulumi/pulumi'
import type { Config } from './config'
import { secretName } from './config'

export interface SecretResources {
  dbPassword: pulumi.Output<string>
  secrets: {
    dynamicEnvironmentId: gcp.secretmanager.Secret
    dynamicApiToken: gcp.secretmanager.Secret
    arbitrumSepoliaRpcUrl: gcp.secretmanager.Secret
    encryptionKey: gcp.secretmanager.Secret
    dbPassword: gcp.secretmanager.Secret
  }
}

export function createSecrets(config: Config, provider: gcp.Provider): SecretResources {
  // Auto-generate database password
  const dbPassword = new random.RandomPassword(secretName(config, 'db-password-random'), {
    length: 32,
    special: true,
    overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
  })

  // Secret Manager secrets with environment-prefixed names
  const dynamicEnvironmentId = new gcp.secretmanager.Secret(
    secretName(config, 'dynamic-environment-id'),
    {
      secretId: secretName(config, 'dynamic-environment-id'),
      replication: { auto: {} },
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
    { provider },
  )

  // Read secret value from environment variable (required)
  const dynamicEnvironmentIdValue = process.env.DYNAMIC_ENVIRONMENT_ID
  if (!dynamicEnvironmentIdValue) {
    throw new Error(
      'DYNAMIC_ENVIRONMENT_ID environment variable is required. Set it in GitHub Secrets or .env file.',
    )
  }

  // Create secret version with actual value
  new gcp.secretmanager.SecretVersion(
    secretName(config, 'dynamic-environment-id-version'),
    {
      secret: dynamicEnvironmentId.id,
      secretData: dynamicEnvironmentIdValue,
    },
    { provider },
  )

  const dynamicApiToken = new gcp.secretmanager.Secret(
    secretName(config, 'dynamic-api-token'),
    {
      secretId: secretName(config, 'dynamic-api-token'),
      replication: { auto: {} },
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
    { provider },
  )

  const dynamicApiTokenValue = process.env.DYNAMIC_API_TOKEN
  if (!dynamicApiTokenValue) {
    throw new Error(
      'DYNAMIC_API_TOKEN environment variable is required. Set it in GitHub Secrets or .env file.',
    )
  }

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'dynamic-api-token-version'),
    {
      secret: dynamicApiToken.id,
      secretData: dynamicApiTokenValue,
    },
    { provider },
  )

  const arbitrumSepoliaRpcUrl = new gcp.secretmanager.Secret(
    secretName(config, 'arbitrum-sepolia-rpc-url'),
    {
      secretId: secretName(config, 'arbitrum-sepolia-rpc-url'),
      replication: { auto: {} },
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
    { provider },
  )

  const arbitrumSepoliaRpcUrlValue = process.env.ARBITRUM_SEPOLIA_RPC_URL
  if (!arbitrumSepoliaRpcUrlValue) {
    throw new Error(
      'ARBITRUM_SEPOLIA_RPC_URL environment variable is required. Set it in GitHub Secrets or .env file.',
    )
  }

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'arbitrum-sepolia-rpc-url-version'),
    {
      secret: arbitrumSepoliaRpcUrl.id,
      secretData: arbitrumSepoliaRpcUrlValue,
    },
    { provider },
  )

  const encryptionKey = new gcp.secretmanager.Secret(
    secretName(config, 'encryption-key'),
    {
      secretId: secretName(config, 'encryption-key'),
      replication: { auto: {} },
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
    { provider },
  )

  const encryptionKeyValue = process.env.ENCRYPTION_KEY
  if (!encryptionKeyValue) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. Set it in GitHub Secrets or .env file.',
    )
  }

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'encryption-key-version'),
    {
      secret: encryptionKey.id,
      secretData: encryptionKeyValue,
    },
    { provider },
  )

  // Database password secret (auto-generated, no env var needed)
  const dbPasswordSecret = new gcp.secretmanager.Secret(
    secretName(config, 'db-password'),
    {
      secretId: secretName(config, 'db-password'),
      replication: { auto: {} },
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
    { provider },
  )

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'db-password-version'),
    {
      secret: dbPasswordSecret.id,
      secretData: dbPassword.result,
    },
    { provider },
  )

  return {
    dbPassword: dbPassword.result,
    secrets: {
      dynamicEnvironmentId,
      dynamicApiToken,
      arbitrumSepoliaRpcUrl,
      encryptionKey,
      dbPassword: dbPasswordSecret,
    },
  }
}
