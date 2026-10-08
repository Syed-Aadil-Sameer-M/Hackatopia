import { useCallback, useEffect, useState } from 'react'
import {
  getTranscript as getApiTranscript,
  uploadAudioChunk as uploadApiAudioChunk,
} from '../api/transcription'
import {
  getDemoAudioUploadResponse,
  getDemoTranscript,
  isDemoMode,
} from '../services/demoMode'
import type {
  AudioUploadResponse,
  LanguageDetected,
  TranscriptLine,
  TranscriptResponse,
} from '../types/api'

export function useTranscript(
  sessionId: string | null,
  refreshKey?: number,
) {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null)
  const [languageDetected, setLanguageDetected] =
    useState<LanguageDetected | null>(isDemoMode ? 'kn-en' : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<TranscriptResponse | null> => {
    if (!sessionId) {
      setTranscript(null)
      setError(null)
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const result = isDemoMode
        ? getDemoTranscript(sessionId)
        : await getApiTranscript(sessionId)
      setTranscript(result)
      return result
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : 'Unable to load the transcript.'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const uploadAudio = useCallback(
    async (audioFormData: FormData): Promise<AudioUploadResponse> => {
      if (!sessionId) {
        const missingSessionError = new Error(
          'Create or select a session before uploading audio.',
        )
        setError(missingSessionError.message)
        throw missingSessionError
      }

      setLoading(true)
      setError(null)
      try {
        const response = isDemoMode
          ? getDemoAudioUploadResponse(
              sessionId,
              Number(audioFormData.get('chunk_index')),
            )
          : await uploadApiAudioChunk(sessionId, audioFormData)
        setLanguageDetected(response.language_detected)

        if (isDemoMode) {
          setTranscript(getDemoTranscript(sessionId))
        } else {
          setTranscript((current) => {
            if (!current) {
              return current
            }

            const newLines: TranscriptLine[] = response.transcript.map(
              (line, index) => ({
                ...line,
                line_index: current.lines.length + index,
                chunk_index: response.chunk_index,
              }),
            )
            const lines = [...current.lines, ...newLines]
            return {
              ...current,
              total_duration_ms: Math.max(
                current.total_duration_ms,
                ...newLines.map((line) => line.end_ms),
              ),
              speaker_counts: {
                DOCTOR:
                  current.speaker_counts.DOCTOR +
                  newLines.filter((line) => line.speaker === 'DOCTOR').length,
                PATIENT:
                  current.speaker_counts.PATIENT +
                  newLines.filter((line) => line.speaker === 'PATIENT').length,
                OTHER:
                  current.speaker_counts.OTHER +
                  newLines.filter((line) => line.speaker === 'OTHER').length,
              },
              lines,
            }
          })
        }

        return response
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : 'Unable to upload the audio chunk.'
        setError(message)
        throw uploadError
      } finally {
        setLoading(false)
      }
    },
    [sessionId],
  )

  useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [refresh, refreshKey])

  return {
    transcript,
    lines: transcript?.lines ?? [],
    languageDetected,
    loading,
    error,
    refresh,
    uploadAudio,
  }
}