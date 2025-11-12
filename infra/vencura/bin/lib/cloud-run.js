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
exports.createCloudRun = createCloudRun;
const gcp = __importStar(require("@pulumi/gcp"));
const config_1 = require("./config");
function createCloudRun(config, network, database, secrets, serviceAccounts, artifactRegistry, dockerBuild, provider) {
    const serviceName = (0, config_1.resourceName)(config, 'api');
    // Cloud Run service
    const service = new gcp.cloudrun.Service(serviceName, {
        name: serviceName,
        location: config.region,
        template: {
            metadata: {
                annotations: {
                    'autoscaling.knative.dev/minScale': config.cloudRunMinInstances.toString(),
                    'autoscaling.knative.dev/maxScale': config.cloudRunMaxInstances.toString(),
                    'run.googleapis.com/cloudsql-instances': database.connectionName,
                    'run.googleapis.com/vpc-access-connector': network.vpcConnector.name,
                    'run.googleapis.com/vpc-access-egress': 'private-ranges-only',
                },
                labels: {
                    environment: config.environment,
                    app: config.appName,
                },
            },
            spec: {
                serviceAccountName: serviceAccounts.cloudRunServiceAccount.email,
                containers: [
                    {
                        image: dockerBuild.imageName,
                        ports: [
                            {
                                containerPort: 3077,
                                name: 'http1',
                            },
                        ],
                        envs: [
                            {
                                name: 'USE_PGLITE',
                                value: 'false',
                            },
                            {
                                name: 'NODE_ENV',
                                value: config.environment === 'prod'
                                    ? 'production'
                                    : 'development',
                            },
                            {
                                name: 'DYNAMIC_ENVIRONMENT_ID',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: secrets.secrets.dynamicEnvironmentId.secretId,
                                        key: 'latest',
                                    },
                                },
                            },
                            {
                                name: 'DYNAMIC_API_TOKEN',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: secrets.secrets.dynamicApiToken.secretId,
                                        key: 'latest',
                                    },
                                },
                            },
                            {
                                name: 'ARBITRUM_SEPOLIA_RPC_URL',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: secrets.secrets.arbitrumSepoliaRpcUrl.secretId,
                                        key: 'latest',
                                    },
                                },
                            },
                            {
                                name: 'ENCRYPTION_KEY',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: secrets.secrets.encryptionKey.secretId,
                                        key: 'latest',
                                    },
                                },
                            },
                            {
                                name: 'DATABASE_URL',
                                valueFrom: {
                                    secretKeyRef: {
                                        name: database.dbConnectionStringSecret.secretId,
                                        key: 'latest',
                                    },
                                },
                            },
                        ],
                        resources: {
                            limits: {
                                cpu: config.cloudRunCpu,
                                memory: config.cloudRunMemory,
                            },
                        },
                        livenessProbe: {
                            httpGet: {
                                path: '/api',
                                port: 3077,
                            },
                            initialDelaySeconds: 30,
                            periodSeconds: 10,
                            timeoutSeconds: 5,
                            failureThreshold: 3,
                        },
                        startupProbe: {
                            httpGet: {
                                path: '/api',
                                port: 3077,
                            },
                            initialDelaySeconds: 0,
                            periodSeconds: 10,
                            timeoutSeconds: 5,
                            failureThreshold: 3,
                        },
                    },
                ],
                timeoutSeconds: 300,
                containerConcurrency: 80,
            },
        },
        traffics: [
            {
                percent: 100,
                latestRevision: true,
            },
        ],
    }, {
        provider,
        dependsOn: [
            network.vpcConnector,
            database.instance,
            serviceAccounts.cloudRunServiceAccount,
            artifactRegistry.repository,
            ...(dockerBuild.image ? [dockerBuild.image] : []),
        ],
    });
    // Allow unauthenticated access (can be restricted later with IAM)
    new gcp.cloudrun.IamMember(`${serviceName}-public-access`, {
        service: service.name,
        location: service.location,
        role: 'roles/run.invoker',
        member: 'allUsers',
    }, { provider, dependsOn: [service] });
    return {
        service,
    };
}
