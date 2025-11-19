import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'
import type { Config } from './config'
import { resourceName, secretName } from './config'
import type { NetworkResources } from './network'

export interface DatabaseResources {
  instance: gcp.sql.DatabaseInstance
  database: gcp.sql.Database
  user: gcp.sql.User
  connectionName: pulumi.Output<string>
  databaseName: string
  userName: string
  dbConnectionStringSecret: gcp.secretmanager.Secret
}

export function createDatabase(
  config: Config,
  network: NetworkResources,
  dbPassword: pulumi.Output<string>,
  provider: gcp.Provider,
): DatabaseResources {
  const instanceName = resourceName(config, 'db')
  const userName = resourceName(config, 'db-user')
  const dbName = 'vencura'
  const dbUser = 'vencura'

  // Cloud SQL Postgres instance with private IP only
  const instance = new gcp.sql.DatabaseInstance(
    instanceName,
    {
      name: instanceName,
      databaseVersion: 'POSTGRES_15',
      region: config.region,
      settings: {
        tier: config.cloudSqlTier,
        availabilityType: config.cloudSqlHaEnabled ? 'REGIONAL' : 'ZONAL',
        backupConfiguration: {
          enabled: config.cloudSqlBackupEnabled,
          startTime: '03:00',
          pointInTimeRecoveryEnabled: config.cloudSqlBackupEnabled,
          backupRetentionSettings: {
            retainedBackups: config.cloudSqlBackupEnabled ? 7 : 0,
            retentionUnit: 'COUNT',
          },
        },
        ipConfiguration: {
          ipv4Enabled: false, // Private IP only
          privateNetwork: network.vpc.id,
          requireSsl: true,
          authorizedNetworks: [], // Empty for private IP
        },
        databaseFlags: [
          {
            name: 'max_connections',
            value: '100',
          },
        ],
        insightsConfig: {
          queryInsightsEnabled: true,
          queryStringLength: 1024,
          recordApplicationTags: true,
          recordClientAddress: true,
        },
      },
      deletionProtection: config.environment === 'prod',
    },
    { provider, dependsOn: [network.privateServiceConnection] },
  )

  // Database
  const database = new gcp.sql.Database(
    dbName,
    {
      name: 'vencura',
      instance: instance.name,
      charset: 'UTF8',
      collation: 'en_US.UTF8',
    },
    { provider, dependsOn: [instance] },
  )

  // Database user
  const user = new gcp.sql.User(
    userName,
    {
      name: 'vencura',
      instance: instance.name,
      password: dbPassword,
      type: 'BUILT_IN',
    },
    { provider, dependsOn: [instance] },
  )

  // Connection name for Cloud Run
  const connectionName = pulumi.interpolate`${config.projectId}:${config.region}:${instance.name}`

  // Create database connection string secret
  // Format: postgresql://user:password@/database?host=/cloudsql/connection-name
  const dbConnectionStringSecret = new gcp.secretmanager.Secret(
    secretName(config, 'db-connection-string'),
    {
      secretId: secretName(config, 'db-connection-string'),
      replication: { auto: {} },
      labels: {
        environment: config.environment,
        app: config.appName,
      },
    },
    { provider, dependsOn: [instance] },
  )

  // Create connection string with password from secret
  const connectionString = pulumi
    .all([connectionName, dbPassword])
    .apply(
      ([connName, password]) =>
        `postgresql://${dbUser}:${password}@/${dbName}?host=/cloudsql/${connName}`,
    )

  new gcp.secretmanager.SecretVersion(
    secretName(config, 'db-connection-string-version'),
    {
      secret: dbConnectionStringSecret.id,
      secretData: connectionString,
    },
    { provider, dependsOn: [user, dbConnectionStringSecret] },
  )

  return {
    instance,
    database,
    user,
    connectionName,
    databaseName: dbName,
    userName: dbUser,
    dbConnectionStringSecret,
  }
}
