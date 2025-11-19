import * as gcp from '@pulumi/gcp'
import type { Config } from './config'
import { resourceName } from './config'

export interface NetworkResources {
  vpc: gcp.compute.Network
  subnet: gcp.compute.Subnetwork
  vpcConnector: gcp.vpcaccess.Connector
  privateServiceRange: gcp.compute.GlobalAddress
  privateServiceConnection: gcp.servicenetworking.Connection
}

export function createNetwork(config: Config, provider: gcp.Provider): NetworkResources {
  const vpcName = resourceName(config, 'vpc')
  const subnetName = resourceName(config, 'subnet')
  const connectorName = resourceName(config, 'vpc-connector')

  // Dedicated VPC for isolation
  const vpc = new gcp.compute.Network(
    vpcName,
    {
      name: vpcName,
      autoCreateSubnetworks: false,
      description: `VPC for ${config.environment} environment`,
    },
    { provider },
  )

  // Private subnet with secondary IP range for Cloud SQL
  const subnet = new gcp.compute.Subnetwork(
    subnetName,
    {
      name: subnetName,
      ipCidrRange: '10.0.0.0/24',
      region: config.region,
      network: vpc.id,
      privateIpGoogleAccess: true,
      secondaryIpRanges: [
        {
          rangeName: 'pods',
          ipCidrRange: '10.1.0.0/16',
        },
        {
          rangeName: 'services',
          ipCidrRange: '10.2.0.0/16',
        },
      ],
    },
    { provider, dependsOn: [vpc] },
  )

  // VPC Connector for serverless VPC access
  const vpcConnector = new gcp.vpcaccess.Connector(
    connectorName,
    {
      name: connectorName,
      region: config.region,
      network: vpc.name,
      ipCidrRange: '10.8.0.0/28',
      minInstances: 2,
      maxInstances: 3,
      machineType: 'e2-micro',
    },
    { provider, dependsOn: [subnet] },
  )

  // Allocate IP range for Private Service Connection
  const privateServiceRange = new gcp.compute.GlobalAddress(
    resourceName(config, 'private-service-range'),
    {
      name: resourceName(config, 'private-service-range'),
      purpose: 'VPC_PEERING',
      addressType: 'INTERNAL',
      prefixLength: 16,
      network: vpc.id,
    },
    { provider, dependsOn: [vpc] },
  )

  // Private Service Connection for Cloud SQL
  const privateServiceConnection = new gcp.servicenetworking.Connection(
    resourceName(config, 'private-service-connection'),
    {
      network: vpc.id,
      service: 'servicenetworking.googleapis.com',
      reservedPeeringRanges: [privateServiceRange.name],
    },
    { provider, dependsOn: [subnet, privateServiceRange] },
  )

  // Firewall rule: Allow egress to Cloud SQL (Postgres port 5432)
  // VPC Connector handles routing, but we allow egress for Cloud SQL access
  new gcp.compute.Firewall(
    resourceName(config, 'allow-cloudsql-egress'),
    {
      name: resourceName(config, 'allow-cloudsql-egress'),
      network: vpc.name,
      description: 'Allow egress to Cloud SQL Postgres from VPC',
      direction: 'EGRESS',
      priority: 1000,
      allows: [
        {
          protocol: 'tcp',
          ports: ['5432'],
        },
      ],
      destinationRanges: ['10.0.0.0/8'], // Private IP ranges for Cloud SQL
    },
    { provider, dependsOn: [vpc, subnet] },
  )

  return {
    vpc,
    subnet,
    vpcConnector,
    privateServiceRange,
    privateServiceConnection,
  }
}
