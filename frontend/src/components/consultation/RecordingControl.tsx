import { isDemoMode } from '../../services/demoMode'
import {
  useAudioRecorder,
  type PreparedAudioChunk,
} from '../../hooks/useAudioRecorder'
import { useState } from 'react'

interface RecordingControlProps {
  onChunkReady: (chunk: PreparedAudioChunk) => Promise<void>
  consentConfirmed: boolean
}

function formatElapsedTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`
}

export function RecordingControl({
  onChunkReady,
  consentConfirmed,
}: RecordingControlProps) {
  const {
    state,
    paused,
    elapsedMs,
    error,
    preparedChunks,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearError,
  } = useAudioRecorder()
  const [uploadedChunkIndexes, setUploadedChunkIndexes] = useState<number[]>([])
  const [uploadingChunkIndex, setUploadingChunkIndex] = useState<number | null>(
    null,
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const isRecording = state === 'recording'
  const isBusy =
    state === 'requesting_permission' ||
    state === 'stopping' ||
    state === 'processing'

  async function uploadChunk(chunk: PreparedAudioChunk): Promise<void> {
    setUploadingChunkIndex(chunk.chunkIndex)
    setUploadError(null)
    try {
      await onChunkReady(chunk)
      setUploadedChunkIndexes((indexes) => [...indexes, chunk.chunkIndex])
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Audio upload failed.',
      )
    } finally {
      setUploadingChunkIndex(null)
    }
  }

  return (
    <section className="recording-control" aria-label="Audio recording">
      <div className="recording-status">
        <span
          className={`recording-indicator${isRecording ? ' recording' : ''}`}
          aria-hidden="true"
        />
        <div>
          <strong>
            {isDemoMode
              ? 'Demo mode'
              : isRecording
                ? 'Recording'
                : state === 'requesting_permission'
                  ? 'Requesting microphone permission'
                  : state === 'stopping'
                    ? 'Stopping recording'
                    : state === 'processing'
                      ? 'Preparing audio'
                      : state === 'error'
                        ? 'Recording unavailable'
                        : 'Ready to record'}
          </strong>
          <span className="recording-time">
            {isRecording ? formatElapsedTime(elapsedMs) : 'Maximum 00:30'}
          </span>
        </div>
      </div>

      {isDemoMode ? (
        <p className="recording-message">
          Microphone access is disabled in demo mode.
        </p>
      ) : (
        <div className="recording-actions">
          {isRecording ? (
            <>
              <button
                className="button button-secondary"
                onClick={paused ? resumeRecording : pauseRecording}
                type="button"
              >
                {paused ? 'Resume recording' : 'Pause recording'}
              </button>
              <button
                className="button button-danger"
                onClick={stopRecording}
                type="button"
              >
                Stop recording
              </button>
            </>
          ) : (
            <button
              className="button button-primary"
              disabled={isBusy || !consentConfirmed}
              onClick={() => void startRecording()}
              type="button"
            >
              {state === 'requesting_permission'
                ? 'Waiting for permission...'
                : 'Start recording'}
            </button>
          )}
          {!isDemoMode && !consentConfirmed && (
            <p className="recording-message">
              Confirm patient consent before starting recording.
            </p>
          )}
          {state === 'error' && (
            <button
              className="button button-secondary"
              onClick={clearError}
              type="button"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="recording-message recording-error" role="alert">
          {error}
        </p>
      )}

      {preparedChunks.length > 0 && (
        <div className="prepared-audio" role="status">
          <strong>
            {preparedChunks.length} audio chunk
            {preparedChunks.length === 1 ? '' : 's'} ready for multipart upload
          </strong>
          <ul>
            {preparedChunks.map((chunk) => (
              <li className="prepared-audio-item" key={chunk.chunkIndex}>
                <span>
                  {chunk.filename} · chunk {chunk.chunkIndex}
                </span>
                {uploadedChunkIndexes.includes(chunk.chunkIndex) ? (
                  <span className="upload-complete">Transcribed</span>
                ) : (
                  <button
                    className="button button-secondary"
                    disabled={uploadingChunkIndex !== null}
                    onClick={() => void uploadChunk(chunk)}
                    type="button"
                  >
                    {uploadingChunkIndex === chunk.chunkIndex
                      ? 'Uploading...'
                      : 'Upload & transcribe'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {uploadError && (
            <p className="recording-message recording-error" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      )}
    </section>
  )
}