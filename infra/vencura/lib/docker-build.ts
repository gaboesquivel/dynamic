import * as docker from '@pulumi/docker';
import * as pulumi from '@pulumi/pulumi';
import type { Config } from './config';
import type { ArtifactRegistryResources } from './artifact-registry';
import { isCi, getGcpAccessToken } from './utils/docker';

export interface DockerBuildResources {
  image: docker.Image | null;
  imageName: pulumi.Output<string>;
}

export function createDockerBuild(
  config: Config,
  artifactRegistry: ArtifactRegistryResources,
): DockerBuildResources {
  // Construct the image name
  const imageName = pulumi.interpolate`${config.region}-docker.pkg.dev/${config.projectId}/${artifactRegistry.repository.repositoryId}/vencura:${config.imageTag}`;

  const server = pulumi.interpolate`${config.region}-docker.pkg.dev`;
  const token = getGcpAccessToken();

  const image = new docker.Image(
    'vencura-image',
    {
      imageName,
      // omit build entirely in CI so Pulumi won't rebuild/push
      build: !isCi()
        ? {
            context: '../..', // Monorepo root (from infra/vencura/lib/)
            dockerfile: 'apps/vencura/Dockerfile',
          }
        : undefined,
      registry: {
        server,
        username: 'oauth2accesstoken',
        password: token,
      },
    },
    {
      retainOnDelete: false,
    },
  );

  return {
    image: isCi() ? null : image,
    imageName: isCi() ? imageName : image.imageName,
  };
}
