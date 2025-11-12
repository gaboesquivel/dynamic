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
exports.createDockerBuild = createDockerBuild;
const docker = __importStar(require("@pulumi/docker"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const child_process_1 = require("child_process");
function createDockerBuild(config, artifactRegistry) {
    // Check if we're in CI/CD - if so, skip building (workflow already built it)
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    // Construct the image name
    const imageName = pulumi.interpolate `${config.region}-docker.pkg.dev/${config.projectId}/${artifactRegistry.repository.repositoryId}/vencura:${config.imageTag}`;
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
    const image = new docker.Image('vencura-image', {
        imageName,
        build: {
            context: '../..', // Monorepo root (from infra/vencura/lib/)
            dockerfile: 'apps/vencura/Dockerfile',
        },
        registry: {
            server: pulumi.interpolate `${config.region}-docker.pkg.dev`,
            username: 'oauth2accesstoken',
            password: pulumi.all([config.projectId]).apply(() => {
                // Use gcloud to get access token for Artifact Registry
                // This requires gcloud to be installed and authenticated
                try {
                    const token = (0, child_process_1.execSync)('gcloud auth print-access-token', {
                        encoding: 'utf-8',
                    });
                    return token.trim();
                }
                catch {
                    throw new Error('Failed to get GCP access token. Make sure gcloud is installed and authenticated. Run: gcloud auth application-default login');
                }
            }),
        },
    }, {
        // Only build if not in CI/CD
        retainOnDelete: false,
    });
    return {
        image,
        imageName: image.imageName,
    };
}
