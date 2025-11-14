'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface UseSpeechRecognitionOptions {
  onResult: (text: string) => void
  onError: (error: string) => void
  lang?: string
}

interface UseSpeechRecognitionReturn {
  supported: boolean
  listening: boolean
  start: () => void
  stop: () => void
}

export function useSpeechRecognition({
  onResult,
  onError,
  lang = 'en-US',
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const ref = useRef<SpeechRecognition | null>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      onError('Speech recognition is not supported in this browser')
      return
    }

    setSupported(true)

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = lang

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false)
      if (event.error === 'no-speech') {
        onError('No speech detected')
      } else if (event.error === 'not-allowed') {
        onError('Microphone permission denied')
      } else {
        onError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1]
      if (!lastResult || lastResult.length === 0) return

      const firstAlternative = lastResult[0]
      if (!firstAlternative) return

      const { transcript } = firstAlternative
      onResult(transcript)
    }

    ref.current = recognition

    return () => {
      if (ref.current) {
        ref.current.stop()
      }
    }
  }, [lang, onResult, onError])

  const start = useCallback(() => {
    if (ref.current && !listening) {
      try {
        ref.current.start()
      } catch {
        onError('Failed to start speech recognition')
      }
    }
  }, [listening, onError])

  const stop = useCallback(() => {
    if (ref.current && listening) {
      ref.current.stop()
    }
  }, [listening])

  return {
    supported,
    listening,
    start,
    stop,
  }
}
