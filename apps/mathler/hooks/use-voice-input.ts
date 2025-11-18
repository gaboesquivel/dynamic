'use client'

import { useState } from 'react'
import { parseVoiceInput } from '@/lib/voice-input-parser'
import { useSpeechRecognition } from './use-speech-recognition'

interface UseVoiceInputOptions {
  onResult?: (text: string) => void
  onCommand?: (command: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear') => void
  enabled?: boolean
}

interface UseVoiceInputReturn {
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
}

export function useVoiceInput({
  onResult,
  onCommand,
  enabled = true,
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [error, setError] = useState<string | null>(null)

  const { supported, listening, start, stop } = useSpeechRecognition({
    onResult: (text: string) => {
      const parsed = parseVoiceInput(text)
      if (parsed.command) onCommand?.(parsed.command)
      else if (parsed.result) onResult?.(parsed.result)
    },
    onError: (err: string) => {
      setError(err)
    },
    lang: 'en-US',
  })

  const startListening = () => {
    if (enabled) start()
  }

  const stopListening = () => {
    if (listening) stop()
  }

  const toggleListening = () => {
    if (listening) stopListening()
    else startListening()
  }

  return {
    isListening: listening,
    isSupported: supported,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}
