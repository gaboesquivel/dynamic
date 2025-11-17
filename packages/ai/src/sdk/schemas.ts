import { z } from 'zod'

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  id: z.string().optional(),
})

export const chatOptionsSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
})

export const chatResponseSchema = z.object({
  message: chatMessageSchema,
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'error']).optional(),
  usage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number(),
    })
    .optional(),
})

export const streamChatDeltaSchema = z.object({
  content: z.string().optional(),
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'error']).optional(),
})

export const toolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
})

export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatOptions = z.infer<typeof chatOptionsSchema>
export type ChatResponse = z.infer<typeof chatResponseSchema>
export type StreamChatDelta = z.infer<typeof streamChatDeltaSchema>
export type Tool = z.infer<typeof toolSchema>
