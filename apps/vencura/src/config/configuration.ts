export default () => {
  const dynamicEnvironmentId = process.env.DYNAMIC_ENVIRONMENT_ID;
  const dynamicApiToken = process.env.DYNAMIC_API_TOKEN;
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!dynamicEnvironmentId) {
    throw new Error('DYNAMIC_ENVIRONMENT_ID environment variable is required');
  }

  if (!dynamicApiToken) {
    throw new Error('DYNAMIC_API_TOKEN environment variable is required');
  }

  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required and must be at least 32 characters',
    );
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    dynamic: {
      environmentId: dynamicEnvironmentId,
      apiToken: dynamicApiToken,
    },
    blockchain: {
      rpcUrl:
        process.env.ARBITRUM_SEPOLIA_RPC_URL ||
        'https://arbitrum-sepolia.infura.io/v3/91de7ed3c17344cc95f8ea31bf6b3adf',
      network: 'arbitrum-sepolia',
    },
    encryption: {
      key: encryptionKey,
    },
  };
};
