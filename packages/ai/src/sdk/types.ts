// Types are now exported from schemas.ts (Zod-based)
export type { ChatMessage, ChatOptions, ChatResponse, StreamChatDelta, Tool } from './schemas'

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  result: unknown
  error?: string
}
