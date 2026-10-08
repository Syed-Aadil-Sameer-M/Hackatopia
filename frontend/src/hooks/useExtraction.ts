import { useState } from 'react'
import { extractSession } from '../api/extraction'
import { extractDemoSession, isDemoMode } from '../services/demoMode'
import type { ExtractionRequest, ExtractionResponse } from '../types/api'

export function useExtraction(sessionId: string | null) {
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runExtraction(
    request: ExtractionRequest,
  ): Promise<ExtractionResponse> {
    if (!sessionId) {
      const missingSessionError = new Error(
        'Create or select a session before extracting clinical data.',
      )
      setError(missingSessionError.message)
      throw missingSessionError
    }

    setLoading(true)
    setError(null)
    try {
      const response = isDemoMode
        ? extractDemoSession(sessionId, request)
        : await extractSession(sessionId, request)
      setExtraction(response)
      return response
    } catch (extractionError) {
      const message =
        extractionError instanceof Error
          ? extractionError.message
          : 'Unable to extract clinical data.'
      setError(message)
      throw extractionError
    } finally {
      setLoading(false)
    }
  }

  return { extraction, loading, error, runExtraction }
}
