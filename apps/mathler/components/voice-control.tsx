'use client'

import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '@/hooks/use-voice-input'

interface VoiceControlProps {
  onResult: (text: string) => void
  onCommand?: (command: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear') => void
  enabled?: boolean
}

export function VoiceControl({ onResult, onCommand, enabled = true }: VoiceControlProps) {
  const { isListening, isSupported, error, toggleListening } = useVoiceInput({
    onResult,
    onCommand,
    enabled,
  })

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground text-center">
        Voice input not supported in this browser
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggleListening}
        disabled={!enabled}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${
            isListening
              ? 'bg-destructive text-destructive-foreground animate-pulse'
              : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'
          }
          ${!enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
      {isListening ? (
        <div className="text-sm text-primary font-semibold animate-pulse">Listening...</div>
      ) : null}
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
    </div>
  )
}
