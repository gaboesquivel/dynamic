import { execSync } from 'child_process';
import * as pulumi from '@pulumi/pulumi';

export const isCi = (): boolean =>
  Boolean(process.env.CI || process.env.GITHUB_ACTIONS);

/**
 * Determine if Docker builds should be enabled in CI
 * Builds are enabled when:
 * - Not in CI (local development), OR
 * - In CI and GCP_IMAGE_TAG or GITHUB_SHA is set (persistent deployments)
 * Builds are disabled when:
 * - In CI without imageTag (ephemeral PR deployments that use gcloud directly)
 */
export const shouldBuildInCi = (): boolean => {
  if (!isCi()) {
    return true; // Always build locally
  }
  // In CI, only build if imageTag is provided (persistent deployments)
  // Ephemeral PR deployments don't set imageTag and use gcloud directly
  return Boolean(
    process.env.GCP_IMAGE_TAG ||
      process.env.GITHUB_SHA ||
      process.env.GITHUB_EVENT_WORKFLOW_RUN_HEAD_SHA,
  );
};

export function getGcpAccessToken(): pulumi.Output<string> {
  // Synchronously fetch once at synth time, outside of any .apply
  try {
    const token = execSync('gcloud auth print-access-token', {
      encoding: 'utf-8',
    })
      .toString()
      .trim();
    return pulumi.output(token);
  } catch {
    throw new Error(
      'Failed to get GCP access token. Make sure gcloud is installed and authenticated. Run: gcloud auth application-default login',
    );
  }
}
