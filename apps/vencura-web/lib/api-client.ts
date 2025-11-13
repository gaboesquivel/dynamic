'use client'

import { getAuthToken } from '@dynamic-labs/sdk-react-core'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export type Wallet = {
  id: string
  address: string
  network: string // Dynamic network ID
  chainType?: string // 'evm', 'solana', etc.
}

type BalanceResponse = {
  balance: number
}

type SignMessageResponse = {
  signedMessage: string
}

type SendTransactionResponse = {
  transactionHash: string
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()

  if (!token) {
    throw new Error('No authentication token available. Please log in first.')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (response.status === 404) {
    throw new Error('Resource not found.')
  }

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`API error: ${error}`)
  }

  return response.json()
}

export async function getWallets(): Promise<Wallet[]> {
  return apiRequest<Wallet[]>('/wallets', {
    method: 'GET',
  })
}

export async function createWallet(chainId: number | string = 421614): Promise<Wallet> {
  return apiRequest<Wallet>('/wallets', {
    method: 'POST',
    body: JSON.stringify({ chainId }),
  })
}

export async function getBalance(walletId: string): Promise<BalanceResponse> {
  return apiRequest<BalanceResponse>(`/wallets/${walletId}/balance`, {
    method: 'GET',
  })
}

export async function signMessage(walletId: string, message: string): Promise<SignMessageResponse> {
  return apiRequest<SignMessageResponse>(`/wallets/${walletId}/sign`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function sendTransaction(
  walletId: string,
  to: string,
  amount: number,
): Promise<SendTransactionResponse> {
  return apiRequest<SendTransactionResponse>(`/wallets/${walletId}/send`, {
    method: 'POST',
    body: JSON.stringify({ to, amount }),
  })
}
