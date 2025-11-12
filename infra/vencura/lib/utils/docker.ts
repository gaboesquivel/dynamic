import { execSync } from 'child_process';
import * as pulumi from '@pulumi/pulumi';

export const isCi = (): boolean =>
  Boolean(process.env.CI || process.env.GITHUB_ACTIONS);

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
