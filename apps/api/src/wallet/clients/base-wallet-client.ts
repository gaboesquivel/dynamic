import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  BadGatewayException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common'
import { getErrorMessage } from '@vencura/lib'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import isEmpty from 'lodash/isEmpty'
import { z } from 'zod'

/**
 * Safe check if error is an HttpException.
 * Uses HttpException base class instead of specific exception types to avoid
 * "Right-hand side of 'instanceof' is not an object" errors when classes aren't loaded.
 */
export function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException
}

/**
 * Error details schema for enhanced error responses.
 * Optional fields provide context for debugging and user guidance.
 */
export const ErrorDetailsSchema = z.object({
  existingWalletAddress: z.string().optional(),
  chainId: z.union([z.number(), z.string()]).optional(),
  dynamicNetworkId: z.string().optional(),
  transactionHash: z.string().optional(),
})

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>

/**
 * Extracts error message from Dynamic SDK error structures.
 * Checks nested error structures: error.error, error.cause, error.message, error stack
 * Always preserves the original Dynamic SDK error message.
 *
 * @param error - Error from Dynamic SDK
 * @returns Exact error message from Dynamic SDK, or null if no error
 */
export function extractDynamicSDKErrorMessage(error: unknown): string | null {
  if (!error) return null

  // FIRST: Check error stack for specific error messages (most reliable for Dynamic SDK wrapped errors)
  // This is critical because Dynamic SDK wraps errors and the actual message is often in the stack
  // Check stack FIRST before checking other properties to catch nested errors
  if (error instanceof Error && error.stack) {
    const stack = error.stack
    // Look for "Multiple wallets per chain not allowed" in stack (case-insensitive for robustness)
    const stackLower = stack.toLowerCase()
    if (stackLower.includes('multiple wallets per chain not allowed')) {
      return 'Multiple wallets per chain not allowed'
    }
    if (stackLower.includes('wallet already exists')) {
      return 'Wallet already exists'
    }
    if (stackLower.includes('you cannot create multiple wallets')) {
      return 'You cannot create multiple wallets'
    }
    // Also check original case-sensitive for exact matches
    if (stack.includes('Multiple wallets per chain not allowed')) {
      return 'Multiple wallets per chain not allowed'
    }
    // Look for other common Dynamic SDK errors in stack
    const commonErrors = [
      'Multiple wallets per chain not allowed',
      'Wallet already exists',
      'You cannot create multiple wallets',
    ]
    for (const errMsg of commonErrors) {
      if (stack.includes(errMsg)) {
        return errMsg
      }
    }
  }

  // SECOND: Check error.error property (works for both Error objects and plain objects)
  // Dynamic SDK wraps errors but keeps the actual error in error.error
  // Use lodash isPlainObject and isString for type checking
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>

    // Check error.error as string (Dynamic SDK's actual error message)
    // This works for both Error instances and plain objects
    if (errorObj.error) {
      // Use lodash isString for type checking
      if (isString(errorObj.error)) {
        // This is the actual Dynamic SDK error message
        return errorObj.error
      }
      // Check nested error.error (object with error property)
      // Use lodash isPlainObject for type checking
      if (isPlainObject(errorObj.error)) {
        const nestedError = errorObj.error as Record<string, unknown>
        // Check nested error.error (string) - Dynamic SDK's actual error
        if (nestedError.error && isString(nestedError.error)) {
          return nestedError.error
        }
        // Check nested error.message
        if (isString(nestedError.message)) {
          return nestedError.message
        }
      }
    }
  }

  // THIRD: Check nested error structures (for plain objects)
  // Use lodash isPlainObject for type checking
  if (isPlainObject(error)) {
    const obj = error as Record<string, unknown>

    // Check error.cause.message (Node.js error chaining)
    if (obj.cause && isPlainObject(obj.cause)) {
      const cause = obj.cause as Record<string, unknown>
      // Check cause.error (string) - Dynamic SDK error in cause
      // Use lodash isString for type checking
      if (cause.error && isString(cause.error)) {
        return cause.error
      }
      if (isString(cause.message)) {
        return cause.message
      }
    }

    // Check error.message
    // Use lodash isString for type checking
    if (isString(obj.message)) {
      // If message is generic wrapper, try to find more specific error
      const message = obj.message
      if (
        message.includes('Error creating') ||
        message.includes('Error in') ||
        message.includes('Failed to')
      ) {
        // FIRST: Check error stack for specific error messages (Dynamic SDK wraps errors)
        // This is critical - check stack BEFORE checking nested structures
        if (error instanceof Error && error.stack) {
          const stack = error.stack
          const stackLower = stack.toLowerCase()
          // Check case-insensitive first for robustness
          if (stackLower.includes('multiple wallets per chain not allowed')) {
            return 'Multiple wallets per chain not allowed'
          }
          if (stackLower.includes('wallet already exists')) {
            return 'Wallet already exists'
          }
          if (stackLower.includes('you cannot create multiple wallets')) {
            return 'You cannot create multiple wallets'
          }
          // Also check case-sensitive for exact matches
          if (stack.includes('Multiple wallets per chain not allowed')) {
            return 'Multiple wallets per chain not allowed'
          }
          if (stack.includes('Wallet already exists')) {
            return 'Wallet already exists'
          }
        }
        // SECOND: Try to find more specific error in nested structures (recursive)
        if (obj.error) {
          const nestedMsg = extractDynamicSDKErrorMessage(obj.error)
          if (nestedMsg && nestedMsg !== message) {
            return nestedMsg
          }
        }
        if (obj.cause) {
          const causeMsg = extractDynamicSDKErrorMessage(obj.cause)
          if (causeMsg && causeMsg !== message) {
            return causeMsg
          }
        }
      }
      return message
    }
  }

  // FOURTH: Use @vencura/lib's getErrorMessage as fallback
  const baseMessage = getErrorMessage(error)
  if (baseMessage && !isEmpty(baseMessage)) {
    return baseMessage
  }

  // Fallback to string conversion
  return String(error)
}

/**
 * Extracts existing wallet address from Dynamic SDK error structure.
 * Dynamic SDK may include wallet address in error.response.data or error.data
 */
export function extractExistingWalletAddress(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  const obj = error as Record<string, unknown>

  // Use lodash isPlainObject and isString for type checking
  // Check error.response.data.address (AxiosError structure)
  if (obj.response && isPlainObject(obj.response)) {
    const response = obj.response as Record<string, unknown>
    if (response.data && isPlainObject(response.data)) {
      const data = response.data as Record<string, unknown>
      if (isString(data.address)) {
        return data.address
      }
    }
  }

  // Check error.data.address
  if (obj.data && isPlainObject(obj.data)) {
    const data = obj.data as Record<string, unknown>
    if (isString(data.address)) {
      return data.address
    }
  }

  // Check error.walletAddress or error.wallet
  if (isString(obj.walletAddress)) {
    return obj.walletAddress
  }
  if (obj.wallet && isPlainObject(obj.wallet)) {
    const wallet = obj.wallet as Record<string, unknown>
    if (isString(wallet.address)) {
      return wallet.address
    }
  }

  return null
}

/**
 * Creates error details object with zod validation.
 * Supports optional fields: existingWalletAddress, chainId, dynamicNetworkId, transactionHash
 *
 * @param details - Error details object
 * @returns Validated error details object
 */
export function createErrorDetails(details: ErrorDetails): ErrorDetails {
  return ErrorDetailsSchema.parse(details)
}

/**
 * Error classification result for Dynamic SDK errors.
 */
export interface DynamicSDKErrorClassification {
  type:
    | 'multiple_wallets'
    | 'authentication'
    | 'rate_limit'
    | 'network'
    | 'not_found'
    | 'forbidden'
    | 'unknown'
  statusCode: number
}

/**
 * Classifies Dynamic SDK errors into appropriate HTTP exception types.
 * Centralizes error classification logic to reduce code duplication.
 *
 * @param error - Error from Dynamic SDK
 * @param errorMessage - Extracted error message
 * @returns Error classification with type and status code
 */
export function classifyDynamicSDKError(
  error: unknown,
  errorMessage: string,
): DynamicSDKErrorClassification {
  // Use lodash isEmpty to check if errorMessage is empty
  const lowerMessage = isEmpty(errorMessage) ? '' : errorMessage.toLowerCase()
  const errorStack = error instanceof Error ? error.stack : ''
  const stackLower = isEmpty(errorStack) ? '' : errorStack.toLowerCase()

  // Check error status code if available (Dynamic SDK error structure)
  // Use lodash utilities for type checking
  const errorStatus =
    (error as any)?.status ||
    (error as any)?.error?.status ||
    ((error as any)?.error && isPlainObject((error as any).error) && (error as any).error.status)

  // Check nested error message (Dynamic SDK wraps errors)
  // Use lodash isPlainObject and isString for type checking
  const nestedError = (error as any)?.error
  let nestedErrorMessage = ''
  if (nestedError) {
    if (isString(nestedError)) {
      nestedErrorMessage = nestedError.toLowerCase()
    } else if (isPlainObject(nestedError)) {
      // Check nestedError.error (string) - Dynamic SDK's actual error
      if (nestedError.error && isString(nestedError.error)) {
        nestedErrorMessage = nestedError.error.toLowerCase()
      } else if (isString(nestedError.message)) {
        nestedErrorMessage = nestedError.message.toLowerCase()
      } else {
        nestedErrorMessage = String(nestedError).toLowerCase()
      }
    } else {
      nestedErrorMessage = String(nestedError).toLowerCase()
    }
  }

  // Check error.cause for Node.js error chaining
  // Use lodash utilities for type checking
  let causeMessage = ''
  const cause = (error as any)?.cause
  if (cause) {
    if (isString(cause.error)) {
      causeMessage = cause.error.toLowerCase()
    } else if (isString(cause.message)) {
      causeMessage = cause.message.toLowerCase()
    } else if (isPlainObject(cause) && cause.error && isString(cause.error)) {
      causeMessage = cause.error.toLowerCase()
    }
  }

  // Check if nested error is an object with message or error property
  // Use lodash utilities for type checking
  let nestedErrorObjMessage = ''
  if (nestedError && isPlainObject(nestedError)) {
    if (isString(nestedError.error)) {
      nestedErrorObjMessage = nestedError.error.toLowerCase()
    } else if (isString(nestedError.message)) {
      nestedErrorObjMessage = nestedError.message.toLowerCase()
    }
  }

  // Check entire error object string representation
  let errorString = ''
  try {
    errorString = JSON.stringify(error).toLowerCase()
  } catch {
    errorString = ''
  }

  // Multiple wallets per chain not allowed (400) - Check FIRST before other error types
  // Check stack FIRST (most reliable for Dynamic SDK wrapped errors)
  const isMultipleWalletsError =
    stackLower.includes('multiple wallets per chain') ||
    stackLower.includes('wallet already exists') ||
    stackLower.includes('you cannot create multiple wallets') ||
    // Then check error status
    errorStatus === 400 ||
    // Then check error messages
    lowerMessage.includes('multiple wallets per chain') ||
    lowerMessage.includes('wallet already exists') ||
    lowerMessage.includes('you cannot create multiple wallets') ||
    nestedErrorMessage.includes('multiple wallets per chain') ||
    nestedErrorMessage.includes('wallet already exists') ||
    nestedErrorMessage.includes('you cannot create multiple wallets') ||
    causeMessage.includes('multiple wallets per chain') ||
    causeMessage.includes('wallet already exists') ||
    causeMessage.includes('you cannot create multiple wallets') ||
    nestedErrorObjMessage.includes('multiple wallets per chain') ||
    nestedErrorObjMessage.includes('wallet already exists') ||
    nestedErrorObjMessage.includes('you cannot create multiple wallets') ||
    errorString.includes('multiple wallets per chain') ||
    errorString.includes('wallet already exists') ||
    errorString.includes('you cannot create multiple wallets') ||
    // Check if error message indicates wallet creation failure that might be due to existing wallet
    (lowerMessage.includes('error creating') &&
      lowerMessage.includes('wallet') &&
      (lowerMessage.includes('account') ||
        lowerMessage.includes('evm') ||
        lowerMessage.includes('svm') ||
        lowerMessage.includes('solana')))

  if (isMultipleWalletsError) {
    return { type: 'multiple_wallets', statusCode: HttpStatus.BAD_REQUEST }
  }

  // Authentication errors (401)
  if (
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('token') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('credential') ||
    lowerMessage.includes('permission denied')
  ) {
    return { type: 'authentication', statusCode: HttpStatus.UNAUTHORIZED }
  }

  // Rate limit errors (429) - Check status code FIRST, then message strings
  if (
    errorStatus === 429 ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('throttle') ||
    lowerMessage.includes('too many') ||
    lowerMessage.includes('quota') ||
    lowerMessage.includes('limit exceeded')
  ) {
    return { type: 'rate_limit', statusCode: HttpStatus.TOO_MANY_REQUESTS }
  }

  // Network errors (502)
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('econnreset') ||
    lowerMessage.includes('socket') ||
    lowerMessage.includes('dns')
  ) {
    return { type: 'network', statusCode: HttpStatus.BAD_GATEWAY }
  }

  // Not found errors (404)
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('does not exist') ||
    lowerMessage.includes('missing') ||
    lowerMessage.includes('not available')
  ) {
    return { type: 'not_found', statusCode: HttpStatus.BAD_REQUEST }
  }

  // Forbidden errors (403)
  if (
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('not allowed')
  ) {
    return { type: 'forbidden', statusCode: HttpStatus.UNAUTHORIZED }
  }

  return { type: 'unknown', statusCode: HttpStatus.INTERNAL_SERVER_ERROR }
}

/**
 * Handles Dynamic SDK errors by classifying and throwing appropriate HTTP exceptions.
 * Returns appropriate HTTP exception with error message and optional details.
 * Reduces code duplication across wallet clients.
 *
 * @param error - Error from Dynamic SDK
 * @param context - Context for error (e.g., 'create wallet', 'sign message')
 * @param details - Optional error details object
 * @returns Never returns (always throws)
 */
export function handleDynamicSDKError(
  error: unknown,
  context: string,
  details?: ErrorDetails,
): never {
  // Re-throw HTTP exceptions as-is
  if (isHttpException(error)) {
    throw error
  }

  // Extract error message
  let errorMessage = extractDynamicSDKErrorMessage(error) || 'Unknown error'

  // Classify error
  const classification = classifyDynamicSDKError(error, errorMessage)

  // Override error message for multiple wallets errors if we detected it via classification
  // but the extracted message is a generic wrapper (e.g., "Error creating evm wallet account")
  if (
    classification.type === 'multiple_wallets' &&
    (errorMessage.toLowerCase().includes('error creating') ||
      errorMessage.toLowerCase().includes('error in') ||
      errorMessage.toLowerCase().includes('failed to'))
  ) {
    // Use the more specific error message
    errorMessage = 'Multiple wallets per chain not allowed'
  }

  // Build error response object
  const errorResponse: { message: string; details?: ErrorDetails } = {
    message: errorMessage,
  }

  if (details) {
    errorResponse.details = createErrorDetails(details)
  }

  // Throw appropriate exception based on classification
  switch (classification.type) {
    case 'multiple_wallets':
      throw new BadRequestException(errorResponse)
    case 'authentication':
      throw new UnauthorizedException(errorResponse)
    case 'rate_limit':
      throw new HttpException(errorResponse, HttpStatus.TOO_MANY_REQUESTS)
    case 'network':
      throw new BadGatewayException(errorResponse)
    case 'not_found':
      throw new BadRequestException(errorResponse)
    case 'forbidden':
      throw new UnauthorizedException(errorResponse)
    default:
      throw new InternalServerErrorException(errorResponse)
  }
}

/**
 * Result type from Dynamic SDK's createWalletAccount().
 * Aligned with Dynamic SDK return type: { accountAddress: string, externalServerKeyShares: string[] }
 * This matches the return type from both DynamicEvmWalletClient and DynamicSvmWalletClient.
 */
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
 * Parameters for createWallet method (RORO pattern)
 */
export interface CreateWalletParams {
  userId: string
  chainId: number | string
  existingWalletAddress?: string | null
}

/**
 * Base interface for chain-specific wallet clients
 */
export abstract class BaseWalletClient {
  abstract createWallet(params: CreateWalletParams): Promise<CreateWalletResult>
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
