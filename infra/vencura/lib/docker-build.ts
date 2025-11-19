import * as docker from '@pulumi/docker'
import * as pulumi from '@pulumi/pulumi'
import type { Config } from './config'
import type { ArtifactRegistryResources } from './artifact-registry'
import { shouldBuildInCi, getGcpAccessToken } from './utils/docker'

export interface DockerBuildResources {
  image: docker.Image | null
  imageName: pulumi.Output<string>
}

export function createDockerBuild(
  config: Config,
  artifactRegistry: ArtifactRegistryResources,
): DockerBuildResources {
  // Construct the image name
  const imageName = pulumi.interpolate`${config.region}-docker.pkg.dev/${config.projectId}/${artifactRegistry.repository.repositoryId}/vencura:${config.imageTag}`

  const server = pulumi.interpolate`${config.region}-docker.pkg.dev`
  const token = getGcpAccessToken()

  // Enable Docker builds when:
  // - Not in CI (local development), OR
  // - In CI with imageTag set (persistent deployments via Pulumi)
  // Disable builds for ephemeral PR deployments (they use gcloud directly)
  const enableBuild = shouldBuildInCi()

  const image = new docker.Image(
    'vencura-image',
    {
      imageName,
      build: enableBuild
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
  )

  return {
    image: enableBuild ? image : null,
    imageName: enableBuild ? image.imageName : imageName,
  }
}
