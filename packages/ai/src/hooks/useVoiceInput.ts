import { useState, useCallback, useEffect } from 'react'

export interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void
  continuous?: boolean
  lang?: string
}

export interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  supported: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any

export function useVoiceInput({
  onTranscript,
  continuous = false,
  lang = 'en-US',
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<SpeechRecognitionType | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionType }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType })
        .webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    const recognitionInstance = new SpeechRecognition()
    recognitionInstance.continuous = continuous
    recognitionInstance.interimResults = true
    recognitionInstance.lang = lang

    recognitionInstance.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognitionInstance.onresult = (event: {
      resultIndex: number
      results: {
        length: number
        [index: number]: {
          isFinal: boolean
          [index: number]: { transcript: string }
          0: { transcript: string }
        }
      }
    }) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result) continue
        const transcript = result[0]?.transcript || ''
        if (result.isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript || interimTranscript
      setTranscript(fullTranscript.trim())

      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript.trim())
      }
    }

    recognitionInstance.onerror = (event: { error: string }) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognitionInstance.onend = () => {
      setIsListening(false)
    }

    setRecognition(recognitionInstance)

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop()
      }
    }
  }, [continuous, lang, onTranscript])

  const startListening = useCallback(() => {
    if (!recognition || isListening) return
    try {
      recognition.start()
    } catch {
      setError('Failed to start speech recognition')
    }
  }, [recognition, isListening])

  const stopListening = useCallback(() => {
    if (recognition && isListening) recognition.stop()
  }, [recognition, isListening])

  const toggleListening = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    supported,
  }
}
