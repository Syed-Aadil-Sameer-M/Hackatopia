import { useCallback, useEffect, useRef, useState } from 'react'
import { isDemoMode } from '../services/demoMode'

export type AudioRecorderState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'processing'
  | 'error'

export interface PreparedAudioChunk {
  blob: Blob
  chunkIndex: number
  formData: FormData
  filename: string
  isFinal: boolean
}

const MAX_RECORDING_MS = 30_000
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/wav']

function getSupportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') {
    return null
  }

  return (
    MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ??
    null
  )
}

function getPermissionError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Microphone permission was denied. Allow microphone access in your browser settings and try again.'
    }
    if (error.name === 'NotFoundError') {
      return 'No microphone was found. Connect a microphone and try again.'
    }
    if (error.name === 'NotReadableError') {
      return 'The microphone is unavailable or being used by another application.'
    }
  }

  return 'Unable to access the microphone. Check your browser permissions and try again.'
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preparedChunks, setPreparedChunks] = useState<PreparedAudioChunk[]>(
    [],
  )
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordedPartsRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const nextChunkIndexRef = useRef(0)
  const mountedRef = useRef(true)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      return
    }

    setState('stopping')
    setPaused(false)
    recorder.stop()
  }, [])

  const pauseRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause()
      setPaused(true)
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume()
      setPaused(false)
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setElapsedMs(0)
    setPaused(false)

    if (isDemoMode) {
      setError('Recording is disabled in demo mode. The microphone was not accessed.')
      setState('error')
      return
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError('This browser does not support microphone recording.')
      setState('error')
      return
    }

    const mimeType = getSupportedMimeType()
    if (!mimeType) {
      setError('This browser cannot record supported .webm or .wav audio.')
      setState('error')
      return
    }

    setState('requesting_permission')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      recordedPartsRef.current = []

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordedPartsRef.current.push(event.data)
        }
      })

      recorder.addEventListener(
        'error',
        () => {
          clearTimer()
          stopTracks()
          recorderRef.current = null
          setError('Recording failed. Check your microphone and try again.')
          setState('error')
        },
        { once: true },
      )

      recorder.addEventListener(
        'stop',
        () => {
          clearTimer()
          if (!mountedRef.current) {
            stopTracks()
            recorderRef.current = null
            return
          }
          setState('processing')
          setPaused(false)

          const blob = new Blob(recordedPartsRef.current, { type: mimeType })
          recordedPartsRef.current = []
          stopTracks()
          recorderRef.current = null

          if (blob.size === 0) {
            setError('No audio was recorded. Start a new recording and try again.')
            setState('error')
            return
          }

          const chunkIndex = nextChunkIndexRef.current++
          const extension = mimeType.includes('wav') ? 'wav' : 'webm'
          const filename = `audio-${chunkIndex}.${extension}`
          const formData = new FormData()
          formData.append('audio', blob, filename)
          formData.append('chunk_index', String(chunkIndex))
          formData.append('is_final', 'true')

          setPreparedChunks((chunks) => [
            ...chunks,
            { blob, chunkIndex, formData, filename, isFinal: true },
          ])
          setState('idle')
        },
        { once: true },
      )

      startedAtRef.current = Date.now()
      recorder.start()
      setState('recording')
      timerRef.current = setInterval(() => {
        const startedAt = startedAtRef.current
        if (startedAt === null) {
          return
        }
        const elapsed = Date.now() - startedAt
        setElapsedMs(Math.min(elapsed, MAX_RECORDING_MS))
        if (elapsed >= MAX_RECORDING_MS) {
          stopRecording()
        }
      }, 200)
    } catch (permissionError) {
      stopTracks()
      if (!mountedRef.current) {
        return
      }
      setError(getPermissionError(permissionError))
      setState('error')
    }
  }, [clearTimer, stopRecording, stopTracks])

  const clearError = useCallback(() => {
    setError(null)
    setState('idle')
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimer()
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
      recorderRef.current = null
      stopTracks()
    }
  }, [clearTimer, stopTracks])

  return {
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
  }
}