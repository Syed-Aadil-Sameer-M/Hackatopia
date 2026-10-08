import { useCallback, useEffect } from 'react'
import { useTranscript } from '../../hooks/useTranscript'
import { useSessionStream } from '../../hooks/useSessionStream'
import { isDemoMode } from '../../services/demoMode'
import { LanguageIndicator } from './LanguageIndicator'
import { RecordingControl } from './RecordingControl'
import { SpeakerLine } from './SpeakerLine'
import type { WebSocketEvent } from '../../types/api'

interface LiveTranscriptProps {
  sessionId: string | null
  refreshKey?: number
  onMedicationDetected?: () => void
  consentConfirmed?: boolean
}

export function LiveTranscript({
  sessionId,
  refreshKey,
  onMedicationDetected,
  consentConfirmed = false,
}: LiveTranscriptProps) {
  const {
    lines,
    languageDetected,
    loading,
    error,
    refresh,
    uploadAudio,
  } = useTranscript(
    sessionId,
    refreshKey,
  )

  const handleStreamEvent = useCallback(
    (event: WebSocketEvent) => {
      if (event.type === 'transcript.chunk') {
        void refresh()
      }
    },
    [refresh],
  )
  const pollRest = useCallback(async () => {
    await refresh()
  }, [refresh])
  const stream = useSessionStream({
    sessionId,
    pollRest,
    onEvent: handleStreamEvent,
  })

  useEffect(() => {
    if (
      onMedicationDetected &&
      lines.some((line) => line.text.toLowerCase().includes('amoxicillin'))
    ) {
      onMedicationDetected()
    }
  }, [lines, onMedicationDetected])

  async function uploadRecordedChunk(formData: FormData): Promise<void> {
    await uploadAudio(formData)
    await refresh()
  }

  return (
    <section className="panel" aria-label="Live transcript">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CONSULTATION</p>
          <h2>Live transcript</h2>
        </div>
        <LanguageIndicator language={languageDetected} />
      </div>
      {!isDemoMode && sessionId && (
        <>
          <div className={`stream-state stream-${stream.status}`} role="status">
            <span>{stream.status}</span>
            {stream.fallbackActive && <span>REST polling fallback active</span>}
            {stream.error && <span>{stream.error}</span>}
          </div>
          <RecordingControl
            consentConfirmed={consentConfirmed}
            onChunkReady={(chunk) => uploadRecordedChunk(chunk.formData)}
          />
        </>
      )}
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {lines.length > 0 ? (
        <div className="transcript" aria-live="polite" aria-busy={loading}>
          {lines.map((line) => (
            <SpeakerLine
              key={`${line.chunk_index}-${line.line_index}`}
              line={line}
            />
          ))}
        </div>
      ) : (
        <p className="empty-state" role="status">
          {loading
            ? 'Loading transcript...'
            : 'Transcript lines will appear here after audio is processed.'}
        </p>
      )}
    </section>
  )
}