import { z } from 'zod'

/**
 * Hello response schema.
 */
export const HelloResponseSchema = z.object({
  message: z.string(),
})

export type HelloResponse = z.infer<typeof HelloResponseSchema>
