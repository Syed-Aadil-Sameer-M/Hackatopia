import {
  initialDemoScenario,
  demoAllergyHistory,
  demoPatientSnapshot,
  demoExtractionResponse,
  demoGeneratedNote,
  demoRuleCheckResponse,
  medicationTranscriptLine,
  type DemoAuditEvent,
  type DemoScenario,
  type DemoTranscriptLine,
} from '../mocks/demoData'
import type {
  ApproveNoteRequest,
  ApproveNoteResponse,
  AudioUploadResponse,
  ExtractionRequest,
  ExtractionResponse,
  HistoryEmbedRequest,
  HistoryEmbedResponse,
  HistoryQueryRequest,
  HistoryQueryResponse,
  RuleCheckRequest,
  RuleCheckResponse,
  SummaryDispatchResponse,
  UpdateNoteRequest,
  TranscriptLine,
  TranscriptResponse,
} from '../types/api'
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  EndSessionResponse,
  PatientSnapshot,
  SessionDetail,
  SessionStatus,
} from '../types/api'

export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE?.toLowerCase() === 'true'

let scenario: DemoScenario = structuredClone(initialDemoScenario)
let nextEventId = 1
let demoPatientId: string = initialDemoScenario.patient.patientId
let demoDoctorId = 'd_001'
let demoCreatedAt = ''
let demoSessionStatus: SessionStatus = 'ready'

export function getDemoScenario(): DemoScenario {
  return structuredClone(scenario)
}

function toTranscriptLine(
  line: DemoTranscriptLine,
  lineIndex: number,
): TranscriptLine {
  return {
    line_index: lineIndex,
    chunk_index: line.chunk_index,
    speaker: line.speaker,
    text: line.text,
    start_ms: line.start_ms,
    end_ms: line.end_ms,
    confidence: line.confidence,
  }
}

export function getDemoTranscript(sessionId: string): TranscriptResponse {
  requireStage(
    sessionId === scenario.sessionId,
    'The requested demo transcript was not found.',
  )
  const lines = scenario.transcript.map(toTranscriptLine)

  return {
    session_id: scenario.sessionId,
    total_duration_ms: Math.max(0, ...lines.map((line) => line.end_ms)),
    speaker_counts: {
      DOCTOR: lines.filter((line) => line.speaker === 'DOCTOR').length,
      PATIENT: lines.filter((line) => line.speaker === 'PATIENT').length,
      OTHER: lines.filter((line) => line.speaker === 'OTHER').length,
    },
    lines,
  }
}

export function getDemoAudioUploadResponse(
  sessionId: string,
  chunkIndex: number,
): AudioUploadResponse {
  requireStage(
    sessionId === scenario.sessionId,
    'The requested demo session was not found.',
  )
  const lines = scenario.transcript.filter(
    (line) => line.chunk_index === chunkIndex,
  )

  return {
    chunk_index: chunkIndex,
    language_detected: scenario.language,
    transcript: lines.map(({ speaker, text, start_ms, end_ms, confidence }) => ({
      speaker,
      text,
      start_ms,
      end_ms,
      confidence,
    })),
    extraction_triggered: false,
  }
}

export function embedDemoPatientHistory(
  patientId: string,
  request: HistoryEmbedRequest,
): HistoryEmbedResponse {
  return {
    record_id: `demo-${request.source_id}`,
    patient_id: patientId,
    type: request.type,
    date: request.date,
    embedded: true,
    vector_id: `demo-vector-${request.source_id}`,
    created_at: new Date().toISOString(),
  }
}

export function queryDemoPatientHistory(
  patientId: string,
  request: HistoryQueryRequest,
): HistoryQueryResponse {
  const matchedRecords = request.query.toLowerCase().includes('amoxicillin')
    ? [structuredClone(demoAllergyHistory)]
    : []

  return {
    patient_id: patientId,
    query: request.query,
    results: matchedRecords.slice(0, request.top_k),
    total_results: matchedRecords.length,
  }
}

function recordEvent(type: string, description: string): void {
  const event: DemoAuditEvent = {
    id: `audit-${nextEventId++}`,
    type,
    description,
    timestamp: new Date().toISOString(),
    status: 'completed',
  }

  scenario = {
    ...scenario,
    auditEvents: [...scenario.auditEvents, event],
  }
}

function requireStage(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

export function resetDemoScenario(): DemoScenario {
  scenario = structuredClone(initialDemoScenario)
  scenario.sessionStatus = 'active'
  nextEventId = 1
  demoPatientId = initialDemoScenario.patient.patientId
  demoDoctorId = 'd_001'
  demoCreatedAt = new Date().toISOString()
  demoSessionStatus = 'active'
  recordEvent('session.created', 'Demo consultation started.')
  return getDemoScenario()
}

export function startDemoRecording(): DemoScenario {
  requireStage(
    !scenario.auditEvents.some((event) => event.type === 'recording.started'),
    'The demo recording has already started.',
  )
  recordEvent('recording.started', 'Doctor-controlled demo recording started.')
  return getDemoScenario()
}

export function endDemoRecording(): DemoScenario {
  requireStage(
    scenario.auditEvents.some((event) => event.type === 'recording.started'),
    'Start the demo recording before ending the consultation.',
  )
  requireStage(
    !scenario.auditEvents.some((event) => event.type === 'session.ended'),
    'The demo consultation has already ended.',
  )
  recordEvent('recording.stopped', 'Doctor-controlled demo recording stopped.')
  demoSessionStatus = 'pending_approval'
  scenario.sessionStatus = demoSessionStatus
  recordEvent('session.ended', 'Demo consultation ended.')
  return getDemoScenario()
}

export function confirmDemoConsent(): DemoScenario {
  if (!scenario.auditEvents.some((event) => event.type === 'consent.confirmed')) {
    recordEvent('consent.confirmed', 'Patient consent confirmed before recording.')
  }
  return getDemoScenario()
}

function getDemoPatientSnapshot(): PatientSnapshot {
  return structuredClone(demoPatientSnapshot)
}

export function createDemoSession(
  request: CreateSessionRequest,
): CreateSessionResponse {
  scenario = structuredClone(initialDemoScenario)
  nextEventId = 1
  demoPatientId = request.patient_id
  demoDoctorId = request.doctor_id
  demoCreatedAt = new Date().toISOString()
  demoSessionStatus = 'ready'
  recordEvent('session.created', 'Demo consultation created.')

  return {
    session_id: scenario.sessionId,
    status: 'ready',
    created_at: demoCreatedAt,
    patient_snapshot: getDemoPatientSnapshot(),
  }
}

export function getDemoSession(sessionId: string): SessionDetail {
  requireStage(
    sessionId === scenario.sessionId && demoCreatedAt.length > 0,
    'The demo session has not been created.',
  )

  demoSessionStatus =
    demoSessionStatus === 'pending_approval' ? 'pending_approval' : 'active'
  scenario.sessionStatus = demoSessionStatus

  return {
    session_id: scenario.sessionId,
    status: demoSessionStatus,
    doctor_id: demoDoctorId,
    patient_id: demoPatientId,
    created_at: demoCreatedAt,
    duration_seconds: 0,
    transcript_lines: scenario.transcript.length,
    warnings_fired: scenario.warnings.length,
    note_id: scenario.note.status === 'not_started' ? null : 'note_3m1pq8',
  }
}

export function endDemoSession(sessionId: string): EndSessionResponse {
  requireStage(
    sessionId === scenario.sessionId && demoCreatedAt.length > 0,
    'The demo session has not been created.',
  )

  demoSessionStatus = 'pending_approval'
  scenario.sessionStatus = demoSessionStatus
  recordEvent('session.ended', 'Demo consultation ended.')

  return {
    session_id: scenario.sessionId,
    status: demoSessionStatus,
    ended_at: new Date().toISOString(),
    note_id: 'note_3m1pq8',
  }
}

export function addMedicationToTranscript(): DemoScenario {
  requireStage(
    !scenario.transcript.some(
      (line) => line.id === medicationTranscriptLine.id,
    ),
    'The medication line is already in the transcript.',
  )

  const line: DemoTranscriptLine = {
    ...medicationTranscriptLine,
    timestamp: '00:31',
  }
  scenario = { ...scenario, transcript: [...scenario.transcript, line] }
  recordEvent('transcript.chunk', 'Doctor mentioned amoxicillin.')
  recordEvent('medication.detected', 'Amoxicillin mention detected in the transcript.')
  return getDemoScenario()
}

export function extractMedicationAndCheckSafety(): DemoScenario {
  requireStage(
    scenario.transcript.some((line) =>
      line.text.toLowerCase().includes('amoxicillin'),
    ),
    'Add the medication to the transcript before running extraction.',
  )

  scenario = {
    ...scenario,
    extractedMedication: 'Amoxicillin 500 mg, three times daily',
    extraction: structuredClone(demoExtractionResponse),
    historyResults: [structuredClone(demoAllergyHistory)],
    warnings: [],
    acknowledgedWarningIds: [],
    ruleCheck: null,
  }
  recordEvent(
    'extraction.complete',
    'Medication extracted and patient history retrieved; backend rules check pending.',
  )
  recordEvent('transcript.chunk', 'Transcript received from the consultation.')
  recordEvent('history.retrieved', 'Relevant patient allergy history retrieved.')
  return getDemoScenario()
}

export function extractDemoSession(
  sessionId: string,
  request: ExtractionRequest,
): ExtractionResponse {
  requireStage(
    sessionId === scenario.sessionId,
    'The requested demo session was not found.',
  )
  requireStage(
    request.trigger_value.toLowerCase() === 'amoxicillin' &&
      scenario.transcript.some((line) =>
        line.text.toLowerCase().includes(request.trigger_value.toLowerCase()),
      ),
    'The transcript does not contain the requested medication mention.',
  )

  const response: ExtractionResponse = {
    ...structuredClone(demoExtractionResponse),
    session_id: sessionId,
    created_at: new Date().toISOString(),
  }
  scenario = {
    ...scenario,
    extraction: response,
    extractedMedication: 'Amoxicillin 500 mg, three times daily',
    historyResults: [structuredClone(demoAllergyHistory)],
    warnings: [],
    acknowledgedWarningIds: [],
    ruleCheck: null,
  }
  recordEvent('extraction.complete', 'AI extraction draft created.')
  recordEvent('transcript.chunk', 'Transcript received from the consultation.')
  recordEvent('history.retrieved', 'Relevant patient allergy history retrieved.')
  return structuredClone(response)
}

export function checkDemoRules(request: RuleCheckRequest): RuleCheckResponse {
  requireStage(
    request.session_id === scenario.sessionId &&
      request.patient_id === scenario.patient.patientId,
    'The rule check does not match the active demo consultation.',
  )

  const response = structuredClone(demoRuleCheckResponse)
  scenario = {
    ...scenario,
    warnings: response.warnings,
    acknowledgedWarningIds: [],
    ruleCheck: response,
  }
  recordEvent('rules.checked', 'Backend-shaped demo medication rule check completed.')
  recordEvent('warning.generated', 'Critical amoxicillin allergy warning generated.')
  return structuredClone(response)
}

export function acknowledgeDemoWarning(warningId: string): DemoScenario {
  const warning = scenario.warnings.find(
    (candidate) => candidate.warning_id === warningId,
  )
  if (!warning) {
    throw new Error('The warning to acknowledge was not found.')
  }
  requireStage(
    warning.level !== 'info',
    'Informational warnings do not require acknowledgement.',
  )

  scenario = {
    ...scenario,
    acknowledgedWarningIds: scenario.acknowledgedWarningIds.includes(warningId)
      ? scenario.acknowledgedWarningIds
      : [...scenario.acknowledgedWarningIds, warningId],
    doctorAcknowledgement:
      'Dr. Sharma acknowledged the warning and will review the clinical context.',
  }
  recordEvent('warning.acknowledged', `Dr. Sharma acknowledged ${warning.code}.`)
  return getDemoScenario()
}

export function generateDemoNote(): DemoScenario {
  requireStage(
    scenario.warnings.every(
      (warning) =>
        warning.level === 'info' ||
        scenario.acknowledgedWarningIds.includes(warning.warning_id),
    ),
    'Acknowledge all critical and advisory warnings before generating the note.',
  )

  scenario = {
    ...scenario,
    note: {
      status: 'draft',
      noteId: demoGeneratedNote.note_id,
      content: structuredClone(demoGeneratedNote.content),
      approval: null,
    },
  }
  recordEvent('note.ready', 'Clinical note draft generated.')
  return getDemoScenario()
}

export function editDemoNote(request: UpdateNoteRequest): DemoScenario {
  requireStage(
    scenario.note.status === 'draft',
    'Generate a note draft before editing it.',
  )
  if (scenario.note.content === null) {
    throw new Error('The note draft is unavailable.')
  }
  const existingContent = scenario.note.content

  scenario = {
    ...scenario,
    note: {
      ...scenario.note,
      content: {
        ...existingContent,
        prescription: structuredClone(request.content.prescription),
        doctor_notes: request.content.doctor_notes,
        follow_up: request.content.follow_up,
        diagnosis:
          request.content.diagnosis === null
            ? existingContent.diagnosis
            : structuredClone(request.content.diagnosis),
      },
    },
    acknowledgedWarningIds: [
      ...new Set([
        ...scenario.acknowledgedWarningIds,
        ...request.acknowledge_warning_ids,
      ]),
    ],
  }
  recordEvent('note.edited', 'Dr. Sharma edited the clinical note.')
  return getDemoScenario()
}

export function approveDemoNote(
  request: ApproveNoteRequest,
): ApproveNoteResponse {
  requireStage(
    scenario.note.status === 'draft',
    'Generate and review the note before approving it.',
  )
  requireStage(
    scenario.warnings.every(
      (warning) =>
        warning.level === 'info' ||
        scenario.acknowledgedWarningIds.includes(warning.warning_id),
    ),
    'Acknowledge all critical and advisory warnings before approving the note.',
  )
  requireStage(
    request.doctor_id === 'd_001' && request.signature_token.trim().length > 0,
    'A valid doctor signature is required to approve the demo note.',
  )

  const response: ApproveNoteResponse = {
    note_id: scenario.note.noteId ?? demoGeneratedNote.note_id,
    status: 'approved',
    approved_by: request.doctor_id,
    approved_at: new Date().toISOString(),
    email_dispatch: {
      queued: false,
      recipient: 'demo@example.test',
    },
  }

  scenario = {
    ...scenario,
    note: { ...scenario.note, status: 'approved', approval: response },
  }
  recordEvent('note.approved', 'Dr. Sharma approved the clinical note.')
  return structuredClone(response)
}

export function dispatchPatientSummary(language: 'en' | 'kn'): DemoScenario {
  requireStage(
    scenario.note.status === 'approved',
    'Approve the clinical note before dispatching the patient summary.',
  )

  const messagePreview =
    language === 'kn'
      ? 'ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ಕಳೆದ ಮೂರು ದಿನಗಳಿಂದ ಹೆಚ್ಚಾಗಿದೆ. ನಿಮಗೆ ಗಂಟಲು ನೋವು ಮತ್ತು ಜ್ವರವೂ ಇದೆ. ನಿಮ್ಮ ವೈದ್ಯರು ಪರಿಶೀಲಿಸಿದ ಅನುಮೋದಿತ ಚಿಕಿತ್ಸಾ ಟಿಪ್ಪಣಿಯಲ್ಲಿರುವ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ ಮತ್ತು ಮುಂದಿನ ಭೇಟಿಯನ್ನು ನಿಗದಿತ ಸಮಯದಲ್ಲಿ ಮಾಡಿ.'
      : 'Your blood pressure has been higher than usual for the last three days. You also reported a sore throat and fever. Please follow the instructions in your approved clinical note and attend the recommended follow-up.'
  const response: SummaryDispatchResponse = {
    dispatch_id: `demo-dispatch-${language}`,
    status: 'generated',
    channel: 'in_app',
    resend_message_id: '',
    recipient_email: '',
    subject: 'Your CareScribe consultation summary',
    language,
    message_preview: messagePreview,
    sent_at: new Date().toISOString(),
  }

  scenario = {
    ...scenario,
    summary: messagePreview,
    summaryResponse: response,
  }
  recordEvent(
    'summary.dispatched',
    `Patient-friendly ${language === 'kn' ? 'Kannada' : 'English'} summary generated from the approved note.`,
  )
  return getDemoScenario()
}
