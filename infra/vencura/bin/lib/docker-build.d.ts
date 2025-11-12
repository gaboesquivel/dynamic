import * as docker from '@pulumi/docker';
import * as pulumi from '@pulumi/pulumi';
import type { Config } from './config';
import type { ArtifactRegistryResources } from './artifact-registry';
export interface DockerBuildResources {
    image: docker.Image | null;
    imageName: pulumi.Output<string>;
}
export declare function createDockerBuild(config: Config, artifactRegistry: ArtifactRegistryResources): DockerBuildResources;
//# sourceMappingURL=docker-build.d.ts.map