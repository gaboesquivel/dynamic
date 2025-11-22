import { Elysia } from 'elysia'
import {
  createWalletContract,
  sendTransactionContract,
  WalletSchema,
  CreateWalletInputSchema,
  SendTransactionInputSchema,
  SendTransactionResultSchema,
  type ChainType,
} from '@vencura/types'
import { formatZodError, getErrorMessage, isZodError } from '@vencura/lib'
import { createWalletService } from '../services/wallet.service'
import { sendTransactionService } from '../services/transaction.service'
import { getUserId } from '../middleware/auth'

export const walletRoute = new Elysia()
  .derive(({ request }) => ({
    userId: getUserId(request),
  }))
  .post(
    createWalletContract.path,
    async ({ body, userId }) => {
      // Validate body with Zod schema (400 if invalid)
      // ChainType validation is handled by Zod schema
      let chainType: ChainType
      try {
        const validatedBody = CreateWalletInputSchema.parse(body)
        chainType = validatedBody.chainType
      } catch (err) {
        // Zod validation error - return 400
        const message = isZodError(err)
          ? formatZodError({ error: err })
          : (getErrorMessage(err) ?? 'Invalid request body')
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      try {
        const result = await createWalletService({ userId, chainType })

        // Validate response matches contract
        const wallet = WalletSchema.parse({
          id: result.id,
          address: result.address,
          chainType: result.chainType,
        })

        // Return 201 for new wallets, 200 for existing (idempotent)
        if (result.isNew) {
          return new Response(JSON.stringify(wallet), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return wallet
      } catch (err) {
        // Handle errors - check for specific error types
        const errorMessage = getErrorMessage(err) ?? String(err)
        const lowerMessage = errorMessage.toLowerCase()

        // Check if this is a "wallet already exists" error (400 Bad Request)
        if (
          lowerMessage.includes('wallet already exists') ||
          lowerMessage.includes('multiple wallets per chaintype') ||
          lowerMessage.includes('multiple wallets are not allowed')
        ) {
          return new Response(
            JSON.stringify({
              error: 'Wallet already exists',
              message: errorMessage,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // All other errors are 500 Internal Server Error
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: errorMessage,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    },
    {
      detail: {
        summary: 'Create a new custodial wallet',
        description:
          'Create a wallet for a chain type. Returns 201 for new wallets, 200 for existing wallets (idempotent). One wallet per chainType.',
      },
    },
  )
  .post(
    sendTransactionContract.path,
    async ({ params, body, userId }) => {
      // Validate body with Zod schema (400 if invalid)
      let validatedBody: { to: string; amount: number; data?: string | null }
      try {
        validatedBody = SendTransactionInputSchema.parse(body)
      } catch (err) {
        // Zod validation error - return 400
        const message = isZodError(err)
          ? formatZodError({ error: err })
          : (getErrorMessage(err) ?? 'Invalid request body')
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      try {
        const result = await sendTransactionService({
          userId,
          walletId: params.id,
          to: validatedBody.to,
          amount: validatedBody.amount,
          data: validatedBody.data ?? undefined,
        })

        // Validate response matches contract
        const response = SendTransactionResultSchema.parse({
          transactionHash: result.transactionHash,
        })

        return response
      } catch (err) {
        // Handle errors - check for specific error types
        const errorMessage = getErrorMessage(err) ?? String(err)
        const lowerMessage = errorMessage.toLowerCase()

        // Check if this is a "wallet not found" error (404 Not Found)
        if (lowerMessage.includes('wallet not found')) {
          return new Response(
            JSON.stringify({
              error: 'Wallet not found',
              message: errorMessage,
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Check if this is an "unsupported chain type" error (400 Bad Request)
        if (lowerMessage.includes('unsupported chain type')) {
          return new Response(
            JSON.stringify({
              error: 'Unsupported chain type',
              message: errorMessage,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // All other errors are 500 Internal Server Error
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            message: errorMessage,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    },
    {
      detail: {
        summary: 'Send a transaction from a wallet',
        description:
          'Send a transaction from a custodial wallet. Only EVM chains are currently supported.',
      },
    },
  )
