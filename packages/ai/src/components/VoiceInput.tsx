'use client'

import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { Button } from '@vencura/ui/components/button'
import { cn } from '@vencura/ui/lib/utils'

export interface VoiceInputProps {
  onTranscript?: (text: string) => void
  className?: string
  disabled?: boolean
}

export function VoiceInput({ onTranscript, className, disabled }: VoiceInputProps) {
  const { isListening, error, toggleListening, supported } = useVoiceInput({
    onTranscript,
    continuous: false,
  })

  if (!supported) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      <Button
        type="button"
        variant={isListening ? 'destructive' : 'outline'}
        size="icon"
        onClick={toggleListening}
        disabled={disabled}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  )
}
