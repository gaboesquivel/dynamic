import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { getDefaultRpcUrl, type ChainMetadata } from '../../common/chains';
import {
  BaseWalletClient,
  type CreateWalletResult,
  type BalanceResult,
  type SignMessageResult,
  type SendTransactionResult,
  type SendTransactionParams,
} from './base-wallet-client';

type DynamicSvmWalletClient = {
  authenticateApiToken: (token: string) => Promise<void>;
  createWalletAccount: (options: {
    thresholdSignatureScheme: unknown;
    backUpToClientShareService: boolean;
  }) => Promise<{
    accountAddress: string;
    externalServerKeyShares: string[];
  }>;
  signMessage: (options: {
    accountAddress: string;
    externalServerKeyShares: string[];
    message: string;
  }) => Promise<string>;
  signTransaction: (options: {
    accountAddress: string;
    externalServerKeyShares: string[];
    transaction: Transaction;
  }) => Promise<Transaction | Buffer>;
};

@Injectable()
export class SolanaWalletClient extends BaseWalletClient {
  private dynamicSvmClient: DynamicSvmWalletClient | null = null;
  private connection: Connection | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly chainMetadata: ChainMetadata,
  ) {
    super();
  }

  private async getDynamicSvmClient(): Promise<DynamicSvmWalletClient> {
    if (this.dynamicSvmClient) {
      return this.dynamicSvmClient;
    }

    const environmentId = this.configService.get<string>(
      'dynamic.environmentId',
    );
    const apiToken = this.configService.get<string>('dynamic.apiToken');

    if (!environmentId || !apiToken) {
      throw new Error('Dynamic configuration is not set');
    }

    const { DynamicSvmWalletClient: DynamicSvmWalletClientClass } =
      await import('@dynamic-labs-wallet/node-svm');

    this.dynamicSvmClient = new DynamicSvmWalletClientClass({
      environmentId,
    }) as DynamicSvmWalletClient;
    await this.dynamicSvmClient.authenticateApiToken(apiToken);

    return this.dynamicSvmClient;
  }

  private getConnection(): Connection {
    if (this.connection) {
      return this.connection;
    }

    // Get RPC URL with priority: custom env var > Dynamic default > Solana default
    const customRpcUrl = this.configService.get<string>(
      `rpc.${this.chainMetadata.dynamicNetworkId}`,
    );
    const rpcUrl =
      getDefaultRpcUrl(this.chainMetadata.chainId, customRpcUrl) ||
      this.chainMetadata.defaultRpcUrl ||
      'https://api.mainnet-beta.solana.com';

    this.connection = new Connection(rpcUrl, 'confirmed');
    return this.connection;
  }

  async createWallet(): Promise<CreateWalletResult> {
    const dynamicSvmClient = await this.getDynamicSvmClient();

    const { ThresholdSignatureScheme } = await import(
      '@dynamic-labs-wallet/node'
    );

    const wallet = await dynamicSvmClient.createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      backUpToClientShareService: false,
    });

    return {
      accountAddress: wallet.accountAddress,
      externalServerKeyShares: wallet.externalServerKeyShares,
    };
  }

  async getBalance(address: string): Promise<BalanceResult> {
    const connection = this.getConnection();
    const publicKey = new PublicKey(address);

    const balance = await connection.getBalance(publicKey);

    return {
      balance: balance / LAMPORTS_PER_SOL,
    };
  }

  async signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult> {
    const dynamicSvmClient = await this.getDynamicSvmClient();

    const signature = await dynamicSvmClient.signMessage({
      accountAddress: address,
      externalServerKeyShares,
      message,
    });

    return {
      signedMessage: signature,
    };
  }

  async sendTransaction(
    address: string,
    externalServerKeyShares: string[],
    params: SendTransactionParams,
  ): Promise<SendTransactionResult> {
    const dynamicSvmClient = await this.getDynamicSvmClient();
    const connection = this.getConnection();

    const fromPublicKey = new PublicKey(address);
    const toPublicKey = new PublicKey(params.to);

    // Create a transfer transaction using SystemProgram
    const lamports = BigInt(Math.floor(params.amount * LAMPORTS_PER_SOL));
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: Number(lamports),
      }),
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Sign transaction using Dynamic SDK
    const signedTransaction = await dynamicSvmClient.signTransaction({
      accountAddress: address,
      externalServerKeyShares,
      transaction,
    });

    // Send transaction - Dynamic SDK may return Transaction object or serialized Buffer
    let signature: string;
    if (signedTransaction instanceof Transaction) {
      // Serialize the transaction and send as raw transaction
      signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
      );
    } else if (Buffer.isBuffer(signedTransaction)) {
      signature = await connection.sendRawTransaction(signedTransaction);
    } else {
      // Try to serialize if it's a Transaction-like object
      const tx = signedTransaction as Transaction;
      signature = await connection.sendRawTransaction(tx.serialize());
    }

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    return {
      transactionHash: signature,
    };
  }
}
