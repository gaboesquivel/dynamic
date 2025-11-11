import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createWalletClient,
  createPublicClient,
  http,
  formatEther,
  parseEther,
  type LocalAccount,
  type Hex,
  type TypedData,
  type TransactionRequest,
} from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';
import { EncryptionService } from '../common/encryption.service';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class WalletService {
  private dynamicEvmClient: DynamicEvmWalletClient | null = null;

  constructor(
    @Inject('DATABASE')
    private readonly db: ReturnType<
      typeof import('drizzle-orm/pglite').drizzle
    >,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
  ) {}

  private async getDynamicEvmClient(): Promise<DynamicEvmWalletClient> {
    if (this.dynamicEvmClient) {
      return this.dynamicEvmClient;
    }

    const environmentId = this.configService.get<string>(
      'dynamic.environmentId',
    );
    const apiToken = this.configService.get<string>('dynamic.apiToken');

    if (!environmentId || !apiToken) {
      throw new Error('Dynamic configuration is not set');
    }

    // Use dynamic import for CommonJS module
    const { DynamicEvmWalletClient: DynamicEvmWalletClientClass } =
      await import('@dynamic-labs-wallet/node-evm');
    this.dynamicEvmClient = new DynamicEvmWalletClientClass({ environmentId });
    await this.dynamicEvmClient.authenticateApiToken(apiToken);

    return this.dynamicEvmClient;
  }

  async createWallet(userId: string, network = 'arbitrum-sepolia') {
    const dynamicEvmClient = await this.getDynamicEvmClient();

    // Use dynamic import for CommonJS module
    const { ThresholdSignatureScheme } = await import(
      '@dynamic-labs-wallet/node'
    );

    // Create a new server-side wallet using Dynamic
    const wallet = await dynamicEvmClient.createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      backUpToClientShareService: false,
    });

    // Encrypt and store the key shares
    const keySharesEncrypted = await this.encryptionService.encrypt(
      JSON.stringify(wallet.externalServerKeyShares),
    );

    const walletId = crypto.randomUUID();

    await this.db.insert(schema.wallets).values({
      id: walletId,
      userId,
      address: wallet.accountAddress,
      privateKeyEncrypted: keySharesEncrypted,
      network,
    });

    return {
      id: walletId,
      address: wallet.accountAddress,
      network,
    };
  }

  async getBalance(walletId: string, userId: string) {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(
        and(eq(schema.wallets.id, walletId), eq(schema.wallets.userId, userId)),
      )
      .limit(1);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const rpcUrl = this.configService.get<string>('blockchain.rpcUrl');
    if (!rpcUrl) {
      throw new Error('ARBITRUM_SEPOLIA_RPC_URL is not set');
    }

    const client = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(rpcUrl),
    });

    const balance = await client.getBalance({
      address: wallet.address as `0x${string}`,
    });

    return {
      balance: parseFloat(formatEther(balance)),
    };
  }

  async signMessage(walletId: string, userId: string, message: string) {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(
        and(eq(schema.wallets.id, walletId), eq(schema.wallets.userId, userId)),
      )
      .limit(1);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const keySharesEncrypted = await this.encryptionService.decrypt(
      wallet.privateKeyEncrypted,
    );
    const externalServerKeyShares = JSON.parse(keySharesEncrypted) as string[];

    const dynamicEvmClient = await this.getDynamicEvmClient();

    const signature = await dynamicEvmClient.signMessage({
      accountAddress: wallet.address,
      externalServerKeyShares,
      message,
    });

    return {
      signedMessage: signature,
    };
  }

  async sendTransaction(
    walletId: string,
    userId: string,
    to: string,
    amount: number,
  ) {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(
        and(eq(schema.wallets.id, walletId), eq(schema.wallets.userId, userId)),
      )
      .limit(1);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const keySharesEncrypted = await this.encryptionService.decrypt(
      wallet.privateKeyEncrypted,
    );
    const externalServerKeyShares = JSON.parse(keySharesEncrypted) as string[];

    const rpcUrl = this.configService.get<string>('blockchain.rpcUrl');
    if (!rpcUrl) {
      throw new Error('ARBITRUM_SEPOLIA_RPC_URL is not set');
    }

    const dynamicEvmClient = await this.getDynamicEvmClient();

    // Create a wallet account that can sign transactions
    const account = {
      address: wallet.address as `0x${string}`,
      source: 'mpc' as const,
      type: 'local' as const,
      publicKey: '0x' as `0x${string}`,
      signMessage: async ({ message }: { message: string | Uint8Array }) => {
        return (await dynamicEvmClient.signMessage({
          accountAddress: wallet.address,
          externalServerKeyShares,
          message,
        })) as Hex;
      },
      signTypedData: async <
        const TTypedData extends TypedData | { [key: string]: unknown },
      >(
        parameters: TTypedData,
      ) => {
        return (await dynamicEvmClient.signTypedData({
          accountAddress: wallet.address,
          externalServerKeyShares,
          typedData: parameters,
        })) as Hex;
      },
      signTransaction: async (transaction: TransactionRequest) => {
        return (await dynamicEvmClient.signTransaction({
          senderAddress: wallet.address,
          externalServerKeyShares,
          transaction,
        })) as Hex;
      },
    } satisfies LocalAccount;

    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(rpcUrl),
    });

    const hash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount.toString()),
    });

    return {
      transactionHash: hash,
    };
  }
}
