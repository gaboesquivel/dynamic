export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  dynamic: {
    environmentId: process.env.DYNAMIC_ENVIRONMENT_ID || '',
    apiToken: process.env.DYNAMIC_API_TOKEN || '',
  },
  blockchain: {
    rpcUrl:
      process.env.ARBITRUM_SEPOLIA_RPC_URL ||
      'https://arbitrum-sepolia.infura.io/v3/91de7ed3c17344cc95f8ea31bf6b3adf',
    network: 'arbitrum-sepolia',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
});
