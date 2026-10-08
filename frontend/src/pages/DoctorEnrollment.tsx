import { useEffect, useRef, useState } from 'react'
import { enrollDoctorVoice } from '../api/doctor'
import { ApiError } from '../api/client'
import type { VoiceEnrollmentResponse } from '../types/api'

const isDemoMode =
  import.meta.env.VITE_DEMO_MODE?.toLowerCase() === 'true'

const demoEnrollment: VoiceEnrollmentResponse = {
  doctor_id: 'd_001',
  enrollment_status: 'complete',
  voice_profile_id: 'vp_d001_demo',
  quality_score: 0.94,
  duration_ms: 30000,
  message: 'Demo voice profile created. Speaker identification is now active.',
}

type EnrollmentState = 'idle' | 'recording' | 'uploading' | 'complete' | 'error'

export default function DoctorEnrollment() {
  const [state, setState] = useState<EnrollmentState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<VoiceEnrollmentResponse | null>(null)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  async function startRecording(): Promise<void> {
    if (isDemoMode) {
      setError('Demo mode uses deterministic enrollment data and does not access the microphone.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Voice recording is not supported in this browser. Upload an audio file instead.')
      setState('error')
      return
    }

    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      streamRef.current = stream
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const recording = new File(chunksRef.current, 'voice-enrollment.webm', {
          type: recorder.mimeType || 'audio/webm',
        })
        setSelectedFile(recording)
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
        setState('idle')
      }
      recorder.start()
      setState('recording')
    } catch {
      setError('Microphone permission was denied or unavailable.')
      setState('error')
    }
  }

  function stopRecording(): void {
    mediaRecorderRef.current?.stop()
  }

  async function submitEnrollment(): Promise<void> {
    setError('')
    setResult(null)

    if (isDemoMode) {
      setState('uploading')
      setResult(demoEnrollment)
      setState('complete')
      return
    }

    if (!selectedFile) {
      setError('Record or choose an audio file before enrolling the voice profile.')
      setState('error')
      return
    }

    try {
      setState('uploading')
      const response = await enrollDoctorVoice('d_001', selectedFile)
      setResult(response)
      setState('complete')
    } catch (requestError) {
      const unavailable =
        requestError instanceof ApiError &&
        (requestError.status === null || requestError.status === 404)
      setError(
        unavailable
          ? 'Voice enrollment service unavailable'
          : requestError instanceof Error
            ? requestError.message
            : 'Voice enrollment failed.',
      )
      setState('error')
    }
  }

  return (
    <main className="care-app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>CareScribe</span>
        </div>
        <span className="demo-badge">{isDemoMode ? 'OFFLINE DEMO' : 'LIVE BACKEND'}</span>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">DOCTOR PROFILE</p>
          <h1>Voice enrollment</h1>
          <p className="subheading">Enroll Dr. Sharma&apos;s voice for speaker identification.</p>
        </div>
      </section>

      <section className="panel" aria-labelledby="enrollment-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">VOICE PROFILE · d_001</p>
            <h2 id="enrollment-heading">Recording and upload</h2>
          </div>
          <strong>{state === 'recording' ? 'Recording' : state === 'uploading' ? 'Uploading' : state}</strong>
        </div>

        <p>Provide a clear voice sample. The backend evaluates quality and creates the profile.</p>
        <div className="panel-actions">
          {!isDemoMode && state !== 'recording' && (
            <button className="button button-secondary" onClick={() => void startRecording()} type="button">
              Record voice sample
            </button>
          )}
          {!isDemoMode && state === 'recording' && (
            <button className="button button-secondary" onClick={stopRecording} type="button">
              Stop recording
            </button>
          )}
          {!isDemoMode && (
            <label className="button button-secondary">
              Choose audio file
              <input
                accept="audio/wav,audio/webm"
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null)
                  setError('')
                  setState('idle')
                }}
                type="file"
                hidden
              />
            </label>
          )}
          <button
            className="button button-primary"
            disabled={state === 'recording' || state === 'uploading'}
            onClick={() => void submitEnrollment()}
            type="button"
          >
            {state === 'uploading' ? 'Uploading...' : 'Enroll voice'}
          </button>
        </div>
        <p className="hint">
          {selectedFile ? `Selected: ${selectedFile.name}` : isDemoMode ? 'Demo data is ready for deterministic enrollment.' : 'No audio selected.'}
        </p>

        {error && <p className="error-banner" role="alert">{error}</p>}
      </section>

      {result && (
        <section className="panel" aria-labelledby="result-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ENROLLMENT RESULT</p>
              <h2 id="result-heading">Voice profile status</h2>
            </div>
            <strong>{result.enrollment_status}</strong>
          </div>
          <dl className="detail-list">
            <div><dt>Quality score</dt><dd>{result.quality_score.toFixed(2)}</dd></div>
            <div><dt>Voice profile ID</dt><dd>{result.voice_profile_id}</dd></div>
            <div><dt>Duration</dt><dd>{Math.round(result.duration_ms / 1000)} seconds</dd></div>
          </dl>
          <p className="live-success" role="status">{result.message}</p>
        </section>
      )}
    </main>
  )
}