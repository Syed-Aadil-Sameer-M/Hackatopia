import { useEffect, useRef, useState } from 'react'
import {
  createSessionWebSocket,
  parseWebSocketEvent,
  type SessionStreamStatus,
} from '../api/websocket'
import { isDemoMode } from '../services/demoMode'
import type { WebSocketEvent } from '../types/api'

const MAX_RECONNECT_ATTEMPTS = 5
const REST_POLL_INTERVAL_MS = 5_000

export interface UseSessionStreamOptions {
  sessionId: string | null
  pollRest?: () => Promise<void>
  onEvent?: (event: WebSocketEvent) => void
}

export function useSessionStream({
  sessionId,
  pollRest,
  onEvent,
}: UseSessionStreamOptions) {
  const [status, setStatus] =
    useState<SessionStreamStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [fallbackActive, setFallbackActive] = useState(false)
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null)
  const onEventRef = useRef(onEvent)
  const pollRestRef = useRef(pollRest)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    pollRestRef.current = pollRest
  }, [pollRest])

  useEffect(() => {
    if (!sessionId || isDemoMode) {
      return
    }

    let disposed = false
    let reconnectAttempts = 0
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const stopPolling = () => {
      if (pollTimer !== null) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      if (!disposed) {
        setFallbackActive(false)
      }
    }

    const startPolling = () => {
      if (pollTimer !== null || !pollRestRef.current) {
        return
      }
      setFallbackActive(true)
      pollTimer = setInterval(() => {
        const poll = pollRestRef.current
        if (poll) {
          void poll().catch((pollError: unknown) => {
            if (!disposed) {
              setError(
                pollError instanceof Error
                  ? pollError.message
                  : 'REST transcript polling failed.',
              )
            }
          })
        }
      }, REST_POLL_INTERVAL_MS)
    }

    const connect = () => {
      if (disposed) return
      setStatus(reconnectAttempts === 0 ? 'connecting' : 'reconnecting')
      setError(null)

      try {
        socket = createSessionWebSocket(sessionId)
      } catch (connectionError) {
        setStatus('error')
        setError(
          connectionError instanceof Error
            ? connectionError.message
            : 'Unable to create the WebSocket connection.',
        )
        startPolling()
        return
      }

      socket.addEventListener('open', () => {
        if (disposed) return
        reconnectAttempts = 0
        setStatus('connected')
        setError(null)
        setLastEvent(null)
        stopPolling()
      })

      socket.addEventListener('message', (message: MessageEvent<unknown>) => {
        if (disposed || typeof message.data !== 'string') {
          return
        }
        const event = parseWebSocketEvent(message.data)
        if (!event) {
          setStatus('error')
          setError('Received an invalid WebSocket event payload.')
          startPolling()
          return
        }
        setLastEvent(event)
        onEventRef.current?.(event)
      })

      socket.addEventListener('error', () => {
        if (disposed) return
        setStatus('error')
        setError('WebSocket connection failed; REST polling is active.')
        startPolling()
      })

      socket.addEventListener('close', () => {
        if (disposed) return
        socket = null
        startPolling()
        reconnectAttempts += 1

        if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
          setStatus('disconnected')
          setError('WebSocket unavailable; continuing with REST polling.')
          return
        }

        setStatus('reconnecting')
        const delay = Math.min(1_000 * 2 ** (reconnectAttempts - 1), 15_000)
        reconnectTimer = setTimeout(connect, delay)
      })
    }

    connect()

    return () => {
      disposed = true
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
      }
      if (pollTimer !== null) {
        clearInterval(pollTimer)
      }
      socket?.close()
    }
  }, [sessionId])

  return {
    status: !sessionId || isDemoMode ? 'disconnected' : status,
    error: !sessionId || isDemoMode ? null : error,
    fallbackActive: Boolean(sessionId && !isDemoMode && fallbackActive),
    lastEvent,
  }
}