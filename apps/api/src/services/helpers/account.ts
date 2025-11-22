import type { LocalAccount, Hex, TypedData, SignableMessage, TransactionSerializable } from 'viem'
import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm'

/**
 * Convert SignableMessage to string for Dynamic SDK.
 */
function messageToString(message: SignableMessage): string {
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

/**
 * Create a viem LocalAccount backed by Dynamic SDK signing methods.
 * Encapsulates Dynamic SDK integration and message conversion logic.
 */
export function createDynamicLocalAccount({
  address,
  externalServerKeyShares,
  dynamicEvmClient,
}: {
  address: string
  externalServerKeyShares: unknown
  dynamicEvmClient: DynamicEvmWalletClient
}): LocalAccount {
  return {
    address: address as `0x${string}`,
    type: 'local',
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
    ) =>
      (await dynamicEvmClient.signTypedData({
        accountAddress: address,
        externalServerKeyShares,
        typedData: parameters,
      })) as Hex,
    signTransaction: async <transaction extends TransactionSerializable = TransactionSerializable>(
      transaction: transaction,
    ) =>
      (await dynamicEvmClient.signTransaction({
        senderAddress: address,
        externalServerKeyShares,
        transaction,
      })) as Hex,
  }
}
