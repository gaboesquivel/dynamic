import { Elysia } from 'elysia'
import { balanceContract, BalanceSchema, BalanceInputSchema, type ChainType } from '@vencura/types'
import { formatZodError, getErrorMessage, isZodError } from '@vencura/lib'
import { getBalanceService } from '../services/balance.service'
import { getUserId } from '../middleware/auth'

export const balanceRoute = new Elysia()
  .derive(({ request }) => ({
    userId: getUserId(request),
  }))
  .post(
    balanceContract.path,
    async ({ body, userId }) => {
      // Validate body with Zod schema (400 if invalid)
      let validatedBody: {
        chainId: number
        chainType: ChainType
        tokenAddress?: string
      }
      try {
        validatedBody = BalanceInputSchema.parse(body)
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
        const result = await getBalanceService({
          userId,
          chainId: validatedBody.chainId,
          chainType: validatedBody.chainType,
          tokenAddress: validatedBody.tokenAddress,
        })

        // Validate response matches contract
        const balance = BalanceSchema.parse(result)

        return balance
      } catch (err) {
        // Handle errors - check for specific error types
        const errorMessage = getErrorMessage(err) ?? String(err)
        const lowerMessage = errorMessage.toLowerCase()

        // Check if this is a "wallet not found" error (404 Not Found)
        if (
          lowerMessage.includes('wallet not found') ||
          lowerMessage.includes('wallet does not exist')
        ) {
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

        // Check if this is an unsupported chain error (400 Bad Request)
        if (
          lowerMessage.includes('unsupported chain') ||
          lowerMessage.includes('chain id') ||
          lowerMessage.includes('chain type')
        ) {
          return new Response(
            JSON.stringify({
              error: 'Invalid chain',
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
        summary: 'Get wallet balance',
        description:
          "Get balance for a user's wallet. Supports native token balance and ERC20 token balances. Requires chainId, chainType, and authentication. Optionally provide tokenAddress for ERC20 token balance.",
      },
    },
  )
