'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Chatbot } from '@vencura/ai'
import { Button } from '@vencura/ui/components/button'
import { getEnv } from '@/lib/env'
import { cn } from '@vencura/ui/lib/utils'

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const env = getEnv()
  const baseUrl = env.NEXT_PUBLIC_API_URL || 'http://localhost:3077'

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l shadow-lg z-50 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chatbot */}
          <div className="flex-1 overflow-hidden">
            <Chatbot baseUrl={baseUrl} className="h-full" />
          </div>
        </div>
      </div>

      {/* Toggle Button (shown when sidebar is closed) */}
      {!isOpen ? (
        <Button
          className="fixed right-4 bottom-4 rounded-full shadow-lg z-40"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </Button>
      ) : null}
    </>
  )
}
