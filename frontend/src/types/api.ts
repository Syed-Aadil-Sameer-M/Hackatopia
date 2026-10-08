export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue }

export type SessionStatus = 'ready' | 'active' | 'pending_approval'

export interface CreateSessionRequest {
  doctor_id: string
  patient_id: string
  language_hint: string
}

export interface PatientSnapshot {
  name: string
  age: number
  chronic_conditions: string[]
  known_allergies: string[]
}

export interface CreateSessionResponse {
  session_id: string
  status: SessionStatus
  created_at: string
  patient_snapshot: PatientSnapshot
}

export interface SessionDetail {
  session_id: string
  status: SessionStatus
  doctor_id: string
  patient_id: string
  created_at: string
  duration_seconds: number
  transcript_lines: number
  warnings_fired: number
  note_id: string | null
}

export interface EndSessionResponse {
  session_id: string
  status: SessionStatus
  ended_at: string
  note_id: string
}

export type Speaker = 'DOCTOR' | 'PATIENT' | 'OTHER'
export type LanguageDetected = string

export interface AudioTranscriptLine {
  speaker: Speaker
  text: string
  start_ms: number
  end_ms: number
  confidence: number
}

export interface TranscriptLine extends AudioTranscriptLine {
  line_index: number
  chunk_index: number
}

export interface AudioUploadResponse {
  chunk_index: number
  language_detected: LanguageDetected
  transcript: AudioTranscriptLine[]
  extraction_triggered: boolean
}

export interface SpeakerCounts {
  DOCTOR: number
  PATIENT: number
  OTHER: number
}

export interface TranscriptResponse {
  session_id: string
  total_duration_ms: number
  speaker_counts: SpeakerCounts
  lines: TranscriptLine[]
}

export interface ExtractionRequest {
  trigger: string
  trigger_value: string
  transcript_window: string
}

export interface Diagnosis {
  label: string
  icd10: string
  confidence: number
}

export type MedicationMention = string

export interface VitalsMentioned {
  bp: string | null
  temp_c: number | null
  pulse: number | null
  spo2: number | null
}

export type HistoryRecordType =
  | 'consultation_note'
  | 'allergy_record'
  | 'lab_result'
  | 'prescription'

export interface HistoryResult {
  record_id: string
  type: HistoryRecordType
  date: string
  relevance_score: number
  summary: string
  content: JsonObject
}

export interface RagHistoryResult {
  record_id: string
  type: HistoryRecordType
  date: string
  relevance_score: number
  summary: string
}

export type WarningLevel = 'critical' | 'advisory' | 'info'

export type WarningCode =
  | 'ALLERGY_CONFLICT'
  | 'DRUG_INTERACTION'
  | 'DOSAGE_EXCEEDS_MAX'
  | 'DOSAGE_WATCH'
  | 'DUPLICATE_DRUG'
  | 'LAB_VALUE_FLAG'
  | 'FOLLOW_UP_OVERDUE'

export interface Warning {
  warning_id: string
  level: WarningLevel
  code: WarningCode
  drug: string
  message: string
  requires_acknowledgement: boolean
}

export interface RuleCheckWarning extends Warning {
  source_record_id: string
}

export interface ExtractedData {
  diagnoses: Diagnosis[]
  medications_mentioned: MedicationMention[]
  symptoms: string[]
  vitals_mentioned: VitalsMentioned
}

export interface ExtractionResponse {
  extraction_id: string
  session_id: string
  extracted: ExtractedData
  rag_triggered: boolean
  rag_results: RagHistoryResult[]
  warnings: Warning[]
  created_at: string
}

export type HistorySource = 'session' | 'manual' | 'import'

export interface HistoryEmbedRequest {
  type: HistoryRecordType
  date: string
  source: HistorySource
  source_id: string
  content: JsonObject
}

export interface HistoryEmbedResponse {
  record_id: string
  patient_id: string
  type: HistoryRecordType
  date: string
  embedded: boolean
  vector_id: string
  created_at: string
}

export interface HistoryQueryFilters {
  types: HistoryRecordType[]
  date_from: string
  date_to: string | null
}

export interface HistoryQueryRequest {
  query: string
  top_k: number
  filters: HistoryQueryFilters
}

export interface HistoryQueryResponse {
  patient_id: string
  query: string
  results: HistoryResult[]
  total_results: number
}

export interface RuleCheckMedication {
  drug: string
  dose: string
  frequency: string
  duration: string
}

export interface RuleCheckVitals {
  bp_systolic: number
  bp_diastolic: number
  temp_c: number | null
  pulse: number | null
  spo2: number | null
}

export interface RuleCheckRequest {
  patient_id: string
  session_id: string
  medications: RuleCheckMedication[]
  diagnoses: string[]
  vitals: RuleCheckVitals
}

export interface RuleCheckResponse {
  passed: boolean
  checked_at: string
  warnings: RuleCheckWarning[]
}

export interface GenerateNoteRequest {
  session_id: string
  mode: string
}

export interface DiagnosisEntry {
  code: string
  label: string
  primary: boolean
}

export interface Prescription {
  drug: string
  dose: string
  frequency: string
  duration: string
  route: string
  instructions: string
}

export interface VitalsRecorded {
  bp: string
  temp_c: number | null
  pulse: number | null
  spo2: number | null
}

export interface ClinicalNoteContent {
  chief_complaint: string
  history_of_present_illness: string
  diagnosis: DiagnosisEntry[]
  prescription: Prescription[]
  vitals_recorded: VitalsRecorded
  follow_up: string
  doctor_notes: string
}

export interface GenerateNoteResponse {
  note_id: string
  session_id: string
  status: 'draft'
  generated_at: string
  warnings_unresolved: number
  content: ClinicalNoteContent
}

export interface UpdateNoteRequest {
  content: {
    prescription: Prescription[]
    doctor_notes: string
    follow_up: string
    diagnosis: DiagnosisEntry[] | null
  }
  acknowledge_warning_ids: string[]
}

export interface ApproveNoteRequest {
  doctor_id: string
  signature_token: string
}

export interface ApproveNoteResponse {
  note_id: string
  status: 'approved'
  approved_by: string
  approved_at: string
  email_dispatch: {
    queued: boolean
    recipient: string
  }
}

export interface SummaryDispatchRequest {
  note_id: string
  language: string
  channel: string
  recipient_email: string
  recipient_name: string
}

export interface SummaryDispatchResponse {
  dispatch_id: string
  status: string
  channel: string
  resend_message_id: string
  recipient_email: string
  subject: string
  language: string
  message_preview: string
  sent_at: string
}

export interface VoiceEnrollmentResponse {
  doctor_id: string
  enrollment_status: string
  voice_profile_id: string
  quality_score: number
  duration_ms: number
  message: string
}

export interface ApiError {
  code: string
  message: string
  detail: JsonObject
  request_id: string
}

export interface ApiErrorResponse {
  error: ApiError
}

export type TranscriptChunkEvent = {
  type: 'transcript.chunk'
} & AudioUploadResponse

export type WarningFiredEvent = {
  type: 'warning.fired'
} & RuleCheckWarning

export type ExtractionCompleteEvent = {
  type: 'extraction.complete'
} & ExtractionResponse

export type NoteReadyEvent = {
  type: 'note.ready'
} & GenerateNoteResponse

export type NoteApprovedEvent = {
  type: 'note.approved'
} & ApproveNoteResponse

export type WebSocketEvent =
  | TranscriptChunkEvent
  | WarningFiredEvent
  | ExtractionCompleteEvent
  | NoteReadyEvent
  | NoteApprovedEvent
