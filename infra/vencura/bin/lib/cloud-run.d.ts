import * as gcp from '@pulumi/gcp';
import type { Config } from './config';
import type { NetworkResources } from './network';
import type { DatabaseResources } from './database';
import type { SecretResources } from './secrets';
import type { ServiceAccountResources } from './service-accounts';
import type { ArtifactRegistryResources } from './artifact-registry';
import type { DockerBuildResources } from './docker-build';
export interface CloudRunResources {
    service: gcp.cloudrun.Service;
}
export declare function createCloudRun(config: Config, network: NetworkResources, database: DatabaseResources, secrets: SecretResources, serviceAccounts: ServiceAccountResources, artifactRegistry: ArtifactRegistryResources, dockerBuild: DockerBuildResources, provider: gcp.Provider): CloudRunResources;
//# sourceMappingURL=cloud-run.d.ts.map