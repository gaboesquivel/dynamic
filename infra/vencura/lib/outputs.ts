import * as pulumi from '@pulumi/pulumi'
import type { CloudRunResources } from './cloud-run'
import type { DatabaseResources } from './database'
import type { ServiceAccountResources } from './service-accounts'
import type { SecretResources } from './secrets'
import type { NetworkResources } from './network'
import type { ArtifactRegistryResources } from './artifact-registry'
import type { Config } from './config'

export function createOutputs(
  config: Config,
  cloudRun: CloudRunResources,
  database: DatabaseResources,
  serviceAccounts: ServiceAccountResources,
  secrets: SecretResources,
  network: NetworkResources,
  artifactRegistry: ArtifactRegistryResources,
): Record<string, pulumi.Output<any>> {
  return {
    // Cloud Run service URL (safe array access)
    cloudRunUrl: cloudRun.service.statuses.apply(statuses =>
      statuses && statuses.length > 0 ? (statuses[0]?.url ?? '') : '',
    ),

    // Database connection name
    databaseConnectionName: database.connectionName,

    // Service account emails
    cloudRunServiceAccountEmail: serviceAccounts.cloudRunServiceAccount.email,
    cicdServiceAccountEmail: serviceAccounts.cicdServiceAccount.email,

    // Secret names (for CI/CD)
    secretNames: pulumi.output({
      dynamicEnvironmentId: secrets.secrets.dynamicEnvironmentId.secretId,
      dynamicApiToken: secrets.secrets.dynamicApiToken.secretId,
      arbitrumSepoliaRpcUrl: secrets.secrets.arbitrumSepoliaRpcUrl.secretId,
      encryptionKey: secrets.secrets.encryptionKey.secretId,
      dbPassword: secrets.secrets.dbPassword.secretId,
      dbConnectionString: database.dbConnectionStringSecret.secretId,
    }),

    // VPC Connector name
    vpcConnectorName: network.vpcConnector.name,

    // Artifact Registry repository URL
    artifactRegistryUrl: pulumi.interpolate`${config.region}-docker.pkg.dev/${config.projectId}/${artifactRegistry.repository.repositoryId}`,

    // Environment
    environment: pulumi.output(config.environment),

    // Project ID
    projectId: pulumi.output(config.projectId),

    // Region
    region: pulumi.output(config.region),
  }
}
