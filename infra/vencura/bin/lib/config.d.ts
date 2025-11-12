export interface Config {
    projectId: string;
    region: string;
    zone: string;
    environment: string;
    appName: string;
    cloudSqlTier: string;
    cloudRunCpu: string;
    cloudRunMemory: string;
    cloudRunMinInstances: number;
    cloudRunMaxInstances: number;
    cloudSqlBackupEnabled: boolean;
    cloudSqlHaEnabled: boolean;
    imageTag: string;
    cloudflareBaseDomain: string;
}
export declare function getConfig(): Config;
export declare function resourceName(config: Config, resource: string): string;
export declare function secretName(config: Config, secret: string): string;
//# sourceMappingURL=config.d.ts.map