import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContext {
  requestId?: string
  userId?: string
  chainId?: number | string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()
