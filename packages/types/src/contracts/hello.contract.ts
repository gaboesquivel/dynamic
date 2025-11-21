import { HelloResponseSchema } from '../schemas/hello.schema'

/**
 * Hello endpoint contract.
 * Defines the GET /hello endpoint structure.
 */
export const helloContract = {
  method: 'GET' as const,
  path: '/hello',
  response: HelloResponseSchema,
}

export type HelloContract = typeof helloContract
