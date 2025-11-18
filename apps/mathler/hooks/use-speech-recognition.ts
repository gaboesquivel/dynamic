'use client'

import { useRef, useEffect } from 'react'
import { useSetState } from 'react-use'

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

interface SpeechRecognitionState {
  listening: boolean
  supported: boolean
}

export function useSpeechRecognition({
  onResult,
  onError,
  lang = 'en-US',
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const ref = useRef<SpeechRecognition | null>(null)
  const [state, setState] = useSetState<SpeechRecognitionState>({
    listening: false,
    supported: false,
  })

  useEffect(() => {
    // Type-safe access to SpeechRecognition API
    const SpeechRecognition =
      (window as Window & { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition })
        .webkitSpeechRecognition
    if (!SpeechRecognition) {
      onError('Speech recognition is not supported in this browser')
      return
    }

    setState({ supported: true })

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = lang

    recognition.onstart = () => {
      setState({ listening: true })
    }

    recognition.onend = () => {
      setState({ listening: false })
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState({ listening: false })
      if (event.error === 'no-speech') onError('No speech detected')
      else if (event.error === 'not-allowed') onError('Microphone permission denied')
      else onError(`Speech recognition error: ${event.error}`)
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
      if (ref.current) ref.current.stop()
    }
  }, [lang, onResult, onError, setState])

  const start = () => {
    if (ref.current && !state.listening) {
      try {
        ref.current.start()
      } catch {
        onError('Failed to start speech recognition')
      }
    }
  }

  const stop = () => {
    if (ref.current && state.listening) ref.current.stop()
  }

  return {
    supported: state.supported,
    listening: state.listening,
    start,
    stop,
  }
}
