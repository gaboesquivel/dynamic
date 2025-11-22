import { Elysia } from 'elysia'
import {
  createWalletContract,
  WalletSchema,
  CreateWalletInputSchema,
  type ChainType,
} from '@vencura/types'
import { createWalletService } from '../services/wallet.service'
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
        return new Response(
          JSON.stringify({
            error: 'Validation error',
            message: err instanceof Error ? err.message : 'Invalid request body',
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
        const errorMessage = err instanceof Error ? err.message : String(err)
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
