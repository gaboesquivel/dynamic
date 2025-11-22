import { useChat } from '@ai-sdk/react'
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core'

export interface UseChatbotOptions {
  api?: string
  baseUrl?: string
  model?: string
  initialMessages?: Array<{
    id?: string
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
}

export function useChatbot({
  api = '/chat',
  baseUrl,
  model = 'gpt-4o-mini',
  initialMessages = [],
}: UseChatbotOptions = {}): ReturnType<typeof useChat> & { isAuthenticated: boolean } {
  const { user } = useDynamicContext()

  const finalBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')

  const token = getAuthToken()
  const headers = !token || !user ? undefined : { Authorization: `Bearer ${token}` }

  const mappedInitialMessages = initialMessages
    ? initialMessages.map(msg => ({
        ...msg,
        id: msg.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      }))
    : undefined

  const chat = useChat({
    api: `${finalBaseUrl}${api}`,
    headers,
    initialMessages: mappedInitialMessages,
    body: {
      model,
    },
  })

  return {
    ...chat,
    isAuthenticated: !!user,
  }
}
