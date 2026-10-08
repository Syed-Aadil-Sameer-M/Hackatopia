import type {
  ExtractionCompleteEvent,
  NoteApprovedEvent,
  NoteReadyEvent,
  TranscriptChunkEvent,
  WarningCode,
  WarningFiredEvent,
  WarningLevel,
  WebSocketEvent,
} from '../types/api'

export type SessionStreamStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'reconnecting'

const warningLevels: WarningLevel[] = ['critical', 'advisory', 'info']
const warningCodes: WarningCode[] = [
  'ALLERGY_CONFLICT',
  'DRUG_INTERACTION',
  'DOSAGE_EXCEEDS_MAX',
  'DOSAGE_WATCH',
  'DUPLICATE_DRUG',
  'LAB_VALUE_FLAG',
  'FOLLOW_UP_OVERDUE',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isTranscriptChunkEvent(
  value: Record<string, unknown>,
): value is Record<string, unknown> & TranscriptChunkEvent {
  return (
    value.type === 'transcript.chunk' &&
    isNumber(value.chunk_index) &&
    isString(value.language_detected) &&
    Array.isArray(value.transcript) &&
    value.transcript.every(
      (line) =>
        isRecord(line) &&
        (line.speaker === 'DOCTOR' ||
          line.speaker === 'PATIENT' ||
          line.speaker === 'OTHER') &&
        isString(line.text) &&
        isNumber(line.start_ms) &&
        isNumber(line.end_ms) &&
        isNumber(line.confidence),
    ) &&
    typeof value.extraction_triggered === 'boolean'
  )
}

function isWarningFiredEvent(
  value: Record<string, unknown>,
): value is Record<string, unknown> & WarningFiredEvent {
  return (
    value.type === 'warning.fired' &&
    isString(value.warning_id) &&
    warningLevels.includes(value.level as WarningLevel) &&
    warningCodes.includes(value.code as WarningCode) &&
    isString(value.drug) &&
    isString(value.message) &&
    isString(value.source_record_id) &&
    typeof value.requires_acknowledgement === 'boolean'
  )
}

function isExtractionCompleteEvent(
  value: Record<string, unknown>,
): value is Record<string, unknown> & ExtractionCompleteEvent {
  return (
    value.type === 'extraction.complete' &&
    isString(value.extraction_id) &&
    isString(value.session_id) &&
    isRecord(value.extracted) &&
    typeof value.rag_triggered === 'boolean' &&
    Array.isArray(value.rag_results) &&
    Array.isArray(value.warnings) &&
    isString(value.created_at)
  )
}

function isNoteReadyEvent(
  value: Record<string, unknown>,
): value is Record<string, unknown> & NoteReadyEvent {
  return (
    value.type === 'note.ready' &&
    isString(value.note_id) &&
    isString(value.session_id) &&
    value.status === 'draft' &&
    isString(value.generated_at) &&
    isNumber(value.warnings_unresolved) &&
    isRecord(value.content)
  )
}

function isNoteApprovedEvent(
  value: Record<string, unknown>,
): value is Record<string, unknown> & NoteApprovedEvent {
  return (
    value.type === 'note.approved' &&
    isString(value.note_id) &&
    value.status === 'approved' &&
    isString(value.approved_by) &&
    isString(value.approved_at) &&
    isRecord(value.email_dispatch) &&
    typeof value.email_dispatch.queued === 'boolean' &&
    isString(value.email_dispatch.recipient)
  )
}

export function parseWebSocketEvent(data: string): WebSocketEvent | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return null
  }

  if (!isRecord(parsed)) {
    return null
  }

  if (isTranscriptChunkEvent(parsed)) return parsed
  if (isWarningFiredEvent(parsed)) return parsed
  if (isExtractionCompleteEvent(parsed)) return parsed
  if (isNoteReadyEvent(parsed)) return parsed
  if (isNoteApprovedEvent(parsed)) return parsed
  return null
}

export function createSessionWebSocket(sessionId: string): WebSocket {
  const configuredBase =
    import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/v1'
  const base = configuredBase.replace(/\/+$/, '')
  const url = `${base}/sessions/${encodeURIComponent(sessionId)}/stream`
  return new WebSocket(url)
}