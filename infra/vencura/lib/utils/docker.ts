import { execSync } from 'child_process';
import { GoogleAuth } from 'google-auth-library';
import { isString, isPlainObject } from 'lodash';
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
  if (isCi()) {
    // In CI: Use Application Default Credentials (ADC) from WIF
    // The google-github-actions/auth@v2 action sets up ADC automatically
    // getAccessToken() returns a Promise, which Pulumi can handle via Output
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    // Return a Pulumi Output that resolves the async token
    // Pulumi will handle the async nature when the token is actually needed
    return pulumi.output(
      auth.getAccessToken().then(
        (token): string => {
          // getAccessToken() returns string | null | AccessTokenResponse
          if (isString(token)) {
            return token;
          }
          if (token === null || token === undefined) {
            throw new Error(
              'Failed to get GCP access token: received null token from Application Default Credentials.',
            );
          }
          // Handle AccessTokenResponse type (has .token property)
          if (isPlainObject(token) && 'token' in token) {
            const tokenValue = (token as { token: unknown }).token;
            if (isString(tokenValue)) {
              return tokenValue;
            }
          }
          // Fallback: convert to string
          return String(token);
        },
        (error): never => {
          throw new Error(
            `Failed to get GCP access token from Application Default Credentials: ${error instanceof Error ? error.message : String(error)}. Ensure google-github-actions/auth@v2 is configured correctly.`,
          );
        },
      ),
    );
  } else {
    // In local dev: Use gcloud CLI (requires gcloud auth application-default login)
    // This is synchronous and works at synth time
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
}
