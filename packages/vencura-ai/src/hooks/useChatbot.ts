import { useChat } from '@ai-sdk/react'
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core'
import { useMemo } from 'react'

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
}: UseChatbotOptions = {}) {
  const { user } = useDynamicContext()

  const finalBaseUrl = useMemo(
    () => baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
    [baseUrl],
  )

  const headers = useMemo(() => {
    const token = getAuthToken()
    if (!token || !user) return undefined
    return { Authorization: `Bearer ${token}` }
  }, [user])

  const mappedInitialMessages = useMemo(() => {
    if (!initialMessages) return undefined
    return initialMessages.map(msg => ({
      ...msg,
      id: msg.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }))
  }, [initialMessages])

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
