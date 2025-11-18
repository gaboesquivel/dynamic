'use client'

import { useChatbot } from '../hooks/useChatbot'
import { VoiceInput } from './VoiceInput'
// Note: ai-elements components will be imported when package is available
// For now, using basic div structure
import { cn } from '@vencura/ui/lib/utils'

export interface ChatbotProps {
  className?: string
  baseUrl?: string
  defaultModel?: string
  showVoiceInput?: boolean
  maxHeight?: string
}

export function Chatbot({
  className,
  baseUrl,
  defaultModel = 'gpt-4o-mini',
  showVoiceInput = true,
  maxHeight = '100vh',
}: ChatbotProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, isAuthenticated } =
    useChatbot({
      baseUrl,
      model: defaultModel,
    })

  if (!isAuthenticated) {
    return (
      <div className={cn('flex items-center justify-center h-full p-4', className)}>
        <p className="text-muted-foreground text-center">
          Please sign in with Dynamic to use the chatbot.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)} style={{ maxHeight }}>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {!messages.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              Ask me anything about your wallets or blockchain operations!
            </p>
          </div>
        ) : null}
        {messages.map(message => (
          <div
            key={message.id}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'rounded-lg px-4 py-2 max-w-[80%]',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading ? (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-muted">Thinking...</div>
          </div>
        ) : null}
        {error ? (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-destructive text-destructive-foreground">
              Error: {error.message || 'An error occurred'}
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your wallets..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {showVoiceInput ? (
              <VoiceInput
                onTranscript={text => {
                  handleInputChange({
                    target: { value: text },
                  } as React.ChangeEvent<HTMLInputElement>)
                }}
              />
            ) : null}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
