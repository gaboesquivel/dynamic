"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.region = exports.projectId = exports.environment = exports.artifactRegistryUrl = exports.vpcConnectorName = exports.secretNames = exports.cicdServiceAccountEmail = exports.cloudRunServiceAccountEmail = exports.databaseConnectionName = exports.cloudRunUrl = void 0;
// Load environment variables from .env file (for local development)
// In CI/CD, these are set via GitHub secrets
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Set GCP provider environment variables from .env BEFORE importing GCP
// The GCP provider reads from GOOGLE_PROJECT, GCLOUD_PROJECT, or GOOGLE_CLOUD_PROJECT
// Priority: GCP_PROJECT_ID env var > gcp:project Pulumi config
if (process.env.GCP_PROJECT_ID) {
    if (!process.env.GOOGLE_PROJECT) {
        process.env.GOOGLE_PROJECT = process.env.GCP_PROJECT_ID;
    }
    if (!process.env.GCLOUD_PROJECT) {
        process.env.GCLOUD_PROJECT = process.env.GCP_PROJECT_ID;
    }
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
        process.env.GOOGLE_CLOUD_PROJECT = process.env.GCP_PROJECT_ID;
    }
}
if (process.env.GCP_REGION && !process.env.GOOGLE_REGION) {
    process.env.GOOGLE_REGION = process.env.GCP_REGION;
}
const gcp = __importStar(require("@pulumi/gcp"));
const config_1 = require("./lib/config");
// Get configuration (will use env vars or Pulumi config)
const config = (0, config_1.getConfig)();
// Ensure GCP provider env vars are set from config if not already set
// The Pulumi GCP provider reads from GOOGLE_PROJECT, GCLOUD_PROJECT, or GOOGLE_CLOUD_PROJECT
if (!process.env.GOOGLE_PROJECT &&
    !process.env.GCLOUD_PROJECT &&
    !process.env.GOOGLE_CLOUD_PROJECT) {
    process.env.GOOGLE_PROJECT = config.projectId;
    process.env.GCLOUD_PROJECT = config.projectId;
    process.env.GOOGLE_CLOUD_PROJECT = config.projectId;
}
if (!process.env.GOOGLE_REGION) {
    process.env.GOOGLE_REGION = config.region;
}
// Create explicit GCP Provider instance with project and region
// This ensures the project is always set, even if environment variables aren't available
const gcpProvider = new gcp.Provider('gcp-provider', {
    project: config.projectId,
    region: config.region,
});
const network_1 = require("./lib/network");
const database_1 = require("./lib/database");
const secrets_1 = require("./lib/secrets");
const service_accounts_1 = require("./lib/service-accounts");
const artifact_registry_1 = require("./lib/artifact-registry");
const docker_build_1 = require("./lib/docker-build");
const cloud_run_1 = require("./lib/cloud-run");
const outputs_1 = require("./lib/outputs");
// Create network resources
const network = (0, network_1.createNetwork)(config, gcpProvider);
// Create secrets (including auto-generated DB password)
const secrets = (0, secrets_1.createSecrets)(config, gcpProvider);
// Create service accounts
const serviceAccounts = (0, service_accounts_1.createServiceAccounts)(config, secrets, gcpProvider);
// Create Artifact Registry
const artifactRegistry = (0, artifact_registry_1.createArtifactRegistry)(config, serviceAccounts, gcpProvider);
// Build Docker image (conditionally - skips in CI/CD)
const dockerBuild = (0, docker_build_1.createDockerBuild)(config, artifactRegistry);
// Create database (depends on network and secrets)
const database = (0, database_1.createDatabase)(config, network, secrets.dbPassword, gcpProvider);
// Grant service accounts access to database connection string secret
// (This must happen after database is created)
const dbConnSecretId = database.dbConnectionStringSecret.secretId;
const cloudRunSaName = `${config.appName}-${config.environment}-cloud-run-sa`;
const cicdSaName = `${config.appName}-${config.environment}-cicd-sa`;
new gcp.secretmanager.SecretIamMember(`${cloudRunSaName}-db-conn-secret-access`, {
    secretId: dbConnSecretId,
    role: 'roles/secretmanager.secretAccessor',
    member: serviceAccounts.cloudRunServiceAccount.email.apply((email) => `serviceAccount:${email}`),
}, {
    provider: gcpProvider,
    dependsOn: [
        serviceAccounts.cloudRunServiceAccount,
        database.dbConnectionStringSecret,
    ],
});
new gcp.secretmanager.SecretIamMember(`${cicdSaName}-db-conn-secret-access`, {
    secretId: dbConnSecretId,
    role: 'roles/secretmanager.secretAccessor',
    member: serviceAccounts.cicdServiceAccount.email.apply((email) => `serviceAccount:${email}`),
}, {
    provider: gcpProvider,
    dependsOn: [
        serviceAccounts.cicdServiceAccount,
        database.dbConnectionStringSecret,
    ],
});
// Create Cloud Run service (depends on all other resources and Docker image)
const cloudRun = (0, cloud_run_1.createCloudRun)(config, network, database, secrets, serviceAccounts, artifactRegistry, dockerBuild, gcpProvider);
// Export outputs
const outputs = (0, outputs_1.createOutputs)(config, cloudRun, database, serviceAccounts, secrets, network, artifactRegistry);
exports.cloudRunUrl = outputs.cloudRunUrl;
exports.databaseConnectionName = outputs.databaseConnectionName;
exports.cloudRunServiceAccountEmail = outputs.cloudRunServiceAccountEmail;
exports.cicdServiceAccountEmail = outputs.cicdServiceAccountEmail;
exports.secretNames = outputs.secretNames;
exports.vpcConnectorName = outputs.vpcConnectorName;
exports.artifactRegistryUrl = outputs.artifactRegistryUrl;
exports.environment = outputs.environment;
exports.projectId = outputs.projectId;
exports.region = outputs.region;
