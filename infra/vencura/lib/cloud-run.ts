import * as gcp from '@pulumi/gcp'
import type { Config } from './config'
import { resourceName } from './config'
import type { NetworkResources } from './network'
import type { DatabaseResources } from './database'
import type { SecretResources } from './secrets'
import type { ServiceAccountResources } from './service-accounts'
import type { ArtifactRegistryResources } from './artifact-registry'
import type { DockerBuildResources } from './docker-build'

export interface CloudRunResources {
  service: gcp.cloudrun.Service
}

export function createCloudRun(
  config: Config,
  network: NetworkResources,
  database: DatabaseResources,
  secrets: SecretResources,
  serviceAccounts: ServiceAccountResources,
  artifactRegistry: ArtifactRegistryResources,
  dockerBuild: DockerBuildResources,
  provider: gcp.Provider,
): CloudRunResources {
  const serviceName = resourceName(config, 'api')

  // Cloud Run service
  const service = new gcp.cloudrun.Service(
    serviceName,
    {
      name: serviceName,
      location: config.region,
      template: {
        metadata: {
          annotations: {
            'autoscaling.knative.dev/minScale': config.cloudRunMinInstances.toString(),
            'autoscaling.knative.dev/maxScale': config.cloudRunMaxInstances.toString(),
            'run.googleapis.com/cloudsql-instances': database.connectionName,
            'run.googleapis.com/vpc-access-connector': network.vpcConnector.name,
            'run.googleapis.com/vpc-access-egress': 'private-ranges-only',
          },
          labels: {
            environment: config.environment,
            app: config.appName,
          },
        },
        spec: {
          serviceAccountName: serviceAccounts.cloudRunServiceAccount.email,
          containers: [
            {
              image: dockerBuild.imageName,
              ports: [
                {
                  containerPort: 3077,
                  name: 'http1',
                },
              ],
              envs: [
                {
                  name: 'USE_PGLITE',
                  value: 'false',
                },
                {
                  name: 'NODE_ENV',
                  value: config.environment === 'prod' ? 'production' : 'development',
                },
                {
                  name: 'DYNAMIC_ENVIRONMENT_ID',
                  valueFrom: {
                    secretKeyRef: {
                      name: secrets.secrets.dynamicEnvironmentId.secretId,
                      key: 'latest',
                    },
                  },
                },
                {
                  name: 'DYNAMIC_API_TOKEN',
                  valueFrom: {
                    secretKeyRef: {
                      name: secrets.secrets.dynamicApiToken.secretId,
                      key: 'latest',
                    },
                  },
                },
                {
                  name: 'ARBITRUM_SEPOLIA_RPC_URL',
                  valueFrom: {
                    secretKeyRef: {
                      name: secrets.secrets.arbitrumSepoliaRpcUrl.secretId,
                      key: 'latest',
                    },
                  },
                },
                {
                  name: 'ENCRYPTION_KEY',
                  valueFrom: {
                    secretKeyRef: {
                      name: secrets.secrets.encryptionKey.secretId,
                      key: 'latest',
                    },
                  },
                },
                {
                  name: 'DATABASE_URL',
                  valueFrom: {
                    secretKeyRef: {
                      name: database.dbConnectionStringSecret.secretId,
                      key: 'latest',
                    },
                  },
                },
              ],
              resources: {
                limits: {
                  cpu: config.cloudRunCpu,
                  memory: config.cloudRunMemory,
                },
              },
              livenessProbe: {
                httpGet: {
                  path: '/api',
                  port: 3077,
                },
                initialDelaySeconds: 30,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              startupProbe: {
                httpGet: {
                  path: '/api',
                  port: 3077,
                },
                initialDelaySeconds: 0,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
            },
          ],
          timeoutSeconds: 300,
          containerConcurrency: 80,
        },
      },
      traffics: [
        {
          percent: 100,
          latestRevision: true,
        },
      ],
    },
    {
      provider,
      dependsOn: [
        network.vpcConnector,
        database.instance,
        serviceAccounts.cloudRunServiceAccount,
        artifactRegistry.repository,
        ...(dockerBuild.image ? [dockerBuild.image] : []),
      ],
    },
  )

  // Allow unauthenticated access (can be restricted later with IAM)
  new gcp.cloudrun.IamMember(
    `${serviceName}-public-access`,
    {
      service: service.name,
      location: service.location,
      role: 'roles/run.invoker',
      member: 'allUsers',
    },
    { provider, dependsOn: [service] },
  )

  return {
    service,
  }
}
