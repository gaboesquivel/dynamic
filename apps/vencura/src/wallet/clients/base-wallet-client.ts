export interface CreateWalletResult {
  accountAddress: string
  externalServerKeyShares: string[]
}

export interface BalanceResult {
  balance: number
}

export interface SignMessageResult {
  signedMessage: string
}

export interface SendTransactionResult {
  transactionHash: string
}

export interface SendTransactionParams {
  to: string
  amount: number
  data?: string
}

/**
 * Base interface for chain-specific wallet clients
 */
export abstract class BaseWalletClient {
  abstract createWallet(): Promise<CreateWalletResult>
  abstract getBalance(address: string): Promise<BalanceResult>
  abstract signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult>
  abstract sendTransaction(
    address: string,
    externalServerKeyShares: string[],
    params: SendTransactionParams,
  ): Promise<SendTransactionResult>
}
