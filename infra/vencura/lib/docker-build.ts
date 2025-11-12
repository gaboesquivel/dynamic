import * as docker from '@pulumi/docker';
import * as pulumi from '@pulumi/pulumi';
import type { Config } from './config';
import type { ArtifactRegistryResources } from './artifact-registry';

export interface DockerBuildResources {
  image: docker.Image | null;
  imageName: pulumi.Output<string>;
}

export function createDockerBuild(
  config: Config,
  artifactRegistry: ArtifactRegistryResources,
): DockerBuildResources {
  // Check if we're in CI/CD - if so, skip building (workflow already built it)
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  // Construct the image name
  const imageName = pulumi.interpolate`${config.region}-docker.pkg.dev/${config.projectId}/${artifactRegistry.repository.repositoryId}/vencura:${config.imageTag}`;

  // If in CI/CD, don't build - just return the image name
  // The workflow already built and pushed the image
  if (isCI) {
    return {
      image: null,
      imageName,
    };
  }

  // For local development, build and push the image
  // Dockerfile is at apps/vencura/Dockerfile, but build context is monorepo root
  // Note: User must run `gcloud auth configure-docker REGION-docker.pkg.dev` first
  // to authenticate Docker with Artifact Registry
  const image = new docker.Image(
    'vencura-image',
    {
      imageName,
      build: {
        context: '../..', // Monorepo root (from infra/vencura/lib/)
        dockerfile: 'apps/vencura/Dockerfile',
      },
      registry: {
        server: pulumi.interpolate`${config.region}-docker.pkg.dev`,
        username: 'oauth2accesstoken',
        password: pulumi
          .all([config.projectId])
          .apply(() => {
            // Use gcloud to get access token for Artifact Registry
            // This requires gcloud to be installed and authenticated
            const { execSync } = require('child_process');
            try {
              return execSync('gcloud auth print-access-token', {
                encoding: 'utf-8',
              }).trim();
            } catch (error) {
              throw new Error(
                'Failed to get GCP access token. Make sure gcloud is installed and authenticated. Run: gcloud auth application-default login',
              );
            }
          }),
      },
    },
    {
      // Only build if not in CI/CD
      retainOnDelete: false,
    },
  );

  return {
    image,
    imageName: image.imageName,
  };
}

