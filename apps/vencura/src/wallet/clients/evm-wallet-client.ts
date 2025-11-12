import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  createWalletClient,
  createPublicClient,
  http,
  formatEther,
  parseEther,
  type LocalAccount,
  type Hex,
  type TypedData,
  type SignableMessage,
  type TransactionSerializable,
} from 'viem'
import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm'
import { getViemChain, getDefaultRpcUrl, type ChainMetadata } from '../../common/chains'
import {
  BaseWalletClient,
  type CreateWalletResult,
  type BalanceResult,
  type SignMessageResult,
  type SendTransactionResult,
  type SendTransactionParams,
} from './base-wallet-client'

@Injectable()
export class EvmWalletClient extends BaseWalletClient {
  private dynamicEvmClient: DynamicEvmWalletClient | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly chainMetadata: ChainMetadata,
  ) {
    super()
  }

  private async getDynamicEvmClient(): Promise<DynamicEvmWalletClient> {
    if (this.dynamicEvmClient) {
      return this.dynamicEvmClient
    }

    const environmentId = this.configService.get<string>('dynamic.environmentId')
    const apiToken = this.configService.get<string>('dynamic.apiToken')

    if (!environmentId || !apiToken) {
      throw new Error('Dynamic configuration is not set')
    }

    const { DynamicEvmWalletClient: DynamicEvmWalletClientClass } = await import(
      '@dynamic-labs-wallet/node-evm'
    )
    this.dynamicEvmClient = new DynamicEvmWalletClientClass({ environmentId })
    await this.dynamicEvmClient.authenticateApiToken(apiToken)

    return this.dynamicEvmClient
  }

  async createWallet(): Promise<CreateWalletResult> {
    const dynamicEvmClient = await this.getDynamicEvmClient()

    const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')

    const wallet = await dynamicEvmClient.createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      backUpToClientShareService: false,
    })

    return {
      accountAddress: wallet.accountAddress,
      externalServerKeyShares: wallet.externalServerKeyShares,
    }
  }

  async getBalance(address: string): Promise<BalanceResult> {
    const viemChain = getViemChain(this.chainMetadata.chainId)
    if (!viemChain) {
      throw new Error(`Unsupported EVM chain: ${this.chainMetadata.chainId}`)
    }

    // Get RPC URL with priority: custom env var > Dynamic default > viem default
    const customRpcUrl = this.configService.get<string>(
      `rpc.${this.chainMetadata.dynamicNetworkId}`,
    )
    const rpcUrl =
      getDefaultRpcUrl(this.chainMetadata.chainId, customRpcUrl) ||
      viemChain.rpcUrls.default.http[0]

    const client = createPublicClient({
      chain: viemChain,
      transport: http(rpcUrl),
    })

    const balance = await client.getBalance({
      address: address as `0x${string}`,
    })

    return {
      balance: parseFloat(formatEther(balance)),
    }
  }

  async signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult> {
    const dynamicEvmClient = await this.getDynamicEvmClient()

    const signature = await dynamicEvmClient.signMessage({
      accountAddress: address,
      externalServerKeyShares,
      message,
    })

    return {
      signedMessage: signature,
    }
  }

  async sendTransaction(
    address: string,
    externalServerKeyShares: string[],
    params: SendTransactionParams,
  ): Promise<SendTransactionResult> {
    const viemChain = getViemChain(this.chainMetadata.chainId)
    if (!viemChain) {
      throw new Error(`Unsupported EVM chain: ${this.chainMetadata.chainId}`)
    }

    const dynamicEvmClient = await this.getDynamicEvmClient()

    // Get RPC URL with priority: custom env var > Dynamic default > viem default
    const customRpcUrl = this.configService.get<string>(
      `rpc.${this.chainMetadata.dynamicNetworkId}`,
    )
    const rpcUrl =
      getDefaultRpcUrl(this.chainMetadata.chainId, customRpcUrl) ||
      viemChain.rpcUrls.default.http[0]

    // Helper to convert SignableMessage to string for Dynamic SDK
    const messageToString = (message: SignableMessage): string => {
      if (typeof message === 'string') return message
      if (message instanceof Uint8Array) {
        return new TextDecoder().decode(message)
      }
      if ('raw' in message) {
        if (typeof message.raw === 'string') return message.raw
        return new TextDecoder().decode(message.raw)
      }
      return String(message)
    }

    // Create a wallet account that can sign transactions
    const account = {
      address: address as `0x${string}`,
      type: 'local' as const,
      signMessage: async ({ message }: { message: SignableMessage }) => {
        const messageStr = messageToString(message)
        return (await dynamicEvmClient.signMessage({
          accountAddress: address,
          externalServerKeyShares,
          message: messageStr,
        })) as Hex
      },
      signTypedData: async <const TTypedData extends TypedData | { [key: string]: unknown }>(
        parameters: TTypedData,
      ) => {
        return (await dynamicEvmClient.signTypedData({
          accountAddress: address,
          externalServerKeyShares,
          typedData: parameters,
        })) as Hex
      },
      signTransaction: async <
        transaction extends TransactionSerializable = TransactionSerializable,
      >(
        transaction: transaction,
      ) => {
        return (await dynamicEvmClient.signTransaction({
          senderAddress: address,
          externalServerKeyShares,
          transaction,
        })) as Hex
      },
    } as LocalAccount

    const walletClient = createWalletClient({
      account,
      chain: viemChain,
      transport: http(rpcUrl),
    })

    const hash = await walletClient.sendTransaction({
      to: params.to as `0x${string}`,
      value: parseEther(params.amount.toString()),
      ...(params.data && { data: params.data as Hex }),
    })

    return {
      transactionHash: hash,
    }
  }
}
