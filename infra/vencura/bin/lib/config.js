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
exports.getConfig = getConfig;
exports.resourceName = resourceName;
exports.secretName = secretName;
const pulumi = __importStar(require("@pulumi/pulumi"));
function getConfig() {
    const config = new pulumi.Config();
    const gcpConfig = new pulumi.Config('gcp');
    // Read from environment variables first (for CI/CD), then Pulumi config, then defaults
    const projectId = process.env.GCP_PROJECT_ID ||
        gcpConfig.get('project') ||
        gcpConfig.require('project');
    const region = process.env.GCP_REGION || gcpConfig.get('region') || 'us-central1';
    const zone = gcpConfig.get('zone') || `${region}-a`;
    const environment = config.get('environment') || 'dev';
    const appName = 'vencura';
    const cloudflareBaseDomain = process.env.CLOUDFLARE_BASE_DOMAIN ||
        config.get('cloudflareBaseDomain') ||
        'gaboesquivel.com';
    return {
        projectId,
        region,
        zone,
        environment,
        appName,
        cloudSqlTier: config.get('cloudSqlTier') || 'db-f1-micro',
        cloudRunCpu: config.get('cloudRunCpu') || '1',
        cloudRunMemory: config.get('cloudRunMemory') || '512Mi',
        cloudRunMinInstances: config.getNumber('cloudRunMinInstances') ??
            (environment === 'dev' ? 1 : 0),
        cloudRunMaxInstances: config.getNumber('cloudRunMaxInstances') ?? 2,
        cloudSqlBackupEnabled: config.getBoolean('cloudSqlBackupEnabled') || false,
        cloudSqlHaEnabled: config.getBoolean('cloudSqlHaEnabled') || false,
        imageTag: config.get('imageTag') || 'latest',
        cloudflareBaseDomain,
    };
}
function resourceName(config, resource) {
    return `${config.appName}-${config.environment}-${resource}`;
}
function secretName(config, secret) {
    return resourceName(config, secret);
}
