import type {
  HistoryResult,
  ApproveNoteResponse,
  ClinicalNoteContent,
  ExtractionResponse,
  GenerateNoteResponse,
  PatientSnapshot,
  RuleCheckRequest,
  RuleCheckResponse,
  SessionStatus,
  Speaker,
  SummaryDispatchResponse,
  Warning,
} from '../types/api'

export type DemoTranscriptLine = {
  id: string
  speaker: Speaker
  text: string
  language: 'kn-en'
  timestamp: string
  start_ms: number
  end_ms: number
  confidence: number
  chunk_index: number
}

export type DemoAuditEvent = {
  id: string
  type: string
  description: string
  timestamp: string
  status: 'completed'
}

export type DemoScenario = {
  sessionId: string
  sessionStatus: SessionStatus
  doctor: string
  language: 'kn-en'
  patient: {
    patientId: 'p_092'
    name: 'Ravi Kumar'
    age: 52
    conditions: string[]
    allergies: string[]
  }
  transcript: DemoTranscriptLine[]
  extractedMedication: string | null
  extraction: ExtractionResponse | null
  historyResults: HistoryResult[]
  warnings: Warning[]
  acknowledgedWarningIds: string[]
  ruleCheck: RuleCheckResponse | null
  doctorAcknowledgement: string | null
  note: {
    status: 'not_started' | 'draft' | 'approved'
    noteId: string | null
    content: ClinicalNoteContent | null
    approval: ApproveNoteResponse | null
  }
  summary: string | null
  summaryResponse: SummaryDispatchResponse | null
  auditEvents: DemoAuditEvent[]
}

export const initialDemoTranscript: DemoTranscriptLine[] = [
  {
    id: 'line-1',
    speaker: 'DOCTOR',
    text: 'BP hegide?',
    language: 'kn-en',
    timestamp: '00:00',
    start_ms: 0,
    end_ms: 1200,
    confidence: 0.96,
    chunk_index: 0,
  },
  {
    id: 'line-2',
    speaker: 'PATIENT',
    text: 'Sir BP swalpa jaasti ide, mooru dinadinda.',
    language: 'kn-en',
    timestamp: '00:04',
    start_ms: 4000,
    end_ms: 7600,
    confidence: 0.91,
    chunk_index: 0,
  },
  {
    id: 'line-3',
    speaker: 'DOCTOR',
    text: 'Sore throat ideya?',
    language: 'kn-en',
    timestamp: '00:10',
    start_ms: 10000,
    end_ms: 12200,
    confidence: 0.95,
    chunk_index: 0,
  },
  {
    id: 'line-4',
    speaker: 'PATIENT',
    text: 'Howdu sir, fever kooda ide.',
    language: 'kn-en',
    timestamp: '00:14',
    start_ms: 14000,
    end_ms: 17800,
    confidence: 0.9,
    chunk_index: 0,
  },
]

export const medicationTranscriptLine: DemoTranscriptLine = {
  id: 'line-5',
  speaker: 'DOCTOR',
  text: 'Amoxicillin 500 mg three times daily.',
  language: 'kn-en',
  timestamp: '00:31',
  start_ms: 31000,
  end_ms: 35200,
  confidence: 0.93,
  chunk_index: 1,
}

export const demoPatientSnapshot: PatientSnapshot = {
  name: 'Ravi Kumar',
  age: 52,
  chronic_conditions: ['hypertension', 'type2_diabetes'],
  known_allergies: ['penicillin'],
}

export const demoAllergyHistory: HistoryResult = {
  record_id: 'rec_44ab',
  type: 'allergy_record',
  date: '2025-06-14',
  relevance_score: 0.97,
  summary: 'Rash after amoxicillin — suspected allergy',
  content: {
    drug: 'amoxicillin',
    reaction: 'rash',
    severity: 'moderate',
    notes: 'Advised to avoid penicillin-class antibiotics.',
  },
}

export const demoExtractionResponse: ExtractionResponse = {
  extraction_id: 'ext_8a2c',
  session_id: 'demo-session-p_092',
  extracted: {
    diagnoses: [
      {
        label: 'acute_tonsillitis',
        icd10: 'J03.90',
        confidence: 0.91,
      },
    ],
    medications_mentioned: ['amoxicillin'],
    symptoms: ['sore throat', 'fever for 3 days'],
    vitals_mentioned: {
      bp: '150/90',
      temp_c: null,
      pulse: null,
      spo2: null,
    },
  },
  rag_triggered: true,
  rag_results: [
    {
      record_id: 'rec_44ab',
      type: 'allergy_record',
      date: '2025-06-14',
      relevance_score: 0.97,
      summary: 'Rash after amoxicillin — suspected allergy',
    },
  ],
  warnings: [
    {
      warning_id: 'warn_001',
      level: 'critical',
      code: 'ALLERGY_CONFLICT',
      drug: 'amoxicillin',
      message:
        'Patient had adverse reaction to amoxicillin on 2025-06-14. Prescribing is contraindicated.',
      requires_acknowledgement: true,
    },
  ],
  created_at: '2026-10-08T09:14:22Z',
}

export const demoRuleCheckRequest: RuleCheckRequest = {
  patient_id: 'p_092',
  session_id: 'demo-session-p_092',
  medications: [
    {
      drug: 'amoxicillin',
      dose: '500mg',
      frequency: '3x daily',
      duration: '',
    },
  ],
  diagnoses: ['acute_tonsillitis'],
  vitals: {
    bp_systolic: 150,
    bp_diastolic: 90,
    temp_c: null,
    pulse: null,
    spo2: null,
  },
}

export const demoRuleCheckResponse: RuleCheckResponse = {
  passed: false,
  checked_at: '2026-10-08T09:14:25Z',
  warnings: [
    {
      warning_id: 'warn_001',
      level: 'critical',
      code: 'ALLERGY_CONFLICT',
      drug: 'amoxicillin',
      message: 'Allergy record on file. Do not prescribe.',
      source_record_id: 'rec_44ab',
      requires_acknowledgement: true,
    },
  ],
}

export const demoGeneratedNote: GenerateNoteResponse = {
  note_id: 'note_demo_001',
  session_id: 'demo-session-p_092',
  status: 'draft',
  generated_at: '2026-10-08T09:27:00Z',
  warnings_unresolved: 0,
  content: {
    chief_complaint: 'Elevated blood pressure, sore throat, and fever.',
    history_of_present_illness:
      'Patient reports higher-than-usual blood pressure for three days with sore throat and fever.',
    diagnosis: [
      {
        code: 'J03.90',
        label: 'Acute tonsillitis, unspecified',
        primary: true,
      },
    ],
    prescription: [
      {
        drug: 'amoxicillin',
        dose: '500 mg',
        frequency: 'three times daily',
        duration: '',
        route: 'oral',
        instructions: 'Review allergy warning before prescribing.',
      },
    ],
    vitals_recorded: {
      bp: '150/90',
      temp_c: null,
      pulse: null,
      spo2: null,
    },
    follow_up: 'Review in 7 days or earlier if symptoms worsen.',
    doctor_notes:
      'Review the documented penicillin allergy and confirm an appropriate antibiotic before prescribing.',
  },
}

export const initialDemoScenario: DemoScenario = {
  sessionId: 'demo-session-p_092',
  sessionStatus: 'ready',
  doctor: 'Dr. Sharma',
  language: 'kn-en',
  patient: {
    patientId: 'p_092',
    name: 'Ravi Kumar',
    age: 52,
    conditions: ['Hypertension', 'Type 2 diabetes'],
    allergies: ['Penicillin'],
  },
  transcript: initialDemoTranscript,
  extractedMedication: null,
  extraction: null,
  historyResults: [],
  warnings: [],
  acknowledgedWarningIds: [],
  ruleCheck: null,
  doctorAcknowledgement: null,
  note: {
    status: 'not_started',
    noteId: null,
    content: null,
    approval: null,
  },
  summary: null,
  summaryResponse: null,
  auditEvents: [],
}
