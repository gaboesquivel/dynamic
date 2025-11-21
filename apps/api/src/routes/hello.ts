import { Elysia } from 'elysia'
import { helloContract, HelloResponseSchema } from '@vencura/types'

export const helloRoute = new Elysia().get(
  helloContract.path,
  () => HelloResponseSchema.parse({ message: 'Hello, World!' }),
  {
    detail: {
      summary: 'Hello World endpoint',
      description: 'Returns a simple hello message',
    },
  },
)
