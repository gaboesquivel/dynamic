declare module '@dynamic-labs-wallet/node-evm' {
  export class DynamicEvmWalletClient {
    constructor(options: { environmentId: string });
    authenticateApiToken(token: string): Promise<void>;
    createWalletAccount(options: {
      thresholdSignatureScheme: any;
      backUpToClientShareService: boolean;
    }): Promise<{
      accountAddress: string;
      externalServerKeyShares: string[];
    }>;
    signMessage(options: {
      accountAddress: string;
      externalServerKeyShares: string[];
      message: string;
    }): Promise<string>;
    signTypedData(options: {
      accountAddress: string;
      externalServerKeyShares: string[];
      typedData: any;
    }): Promise<string>;
    signTransaction(options: {
      senderAddress: string;
      externalServerKeyShares: string[];
      transaction: any;
    }): Promise<string>;
  }
}

declare module '@dynamic-labs-wallet/node' {
  export enum ThresholdSignatureScheme {
    TWO_OF_TWO = 'TWO_OF_TWO',
  }
}
