# CareScribe HC-02 API Contract

This document is the single source of truth for the frontend/backend API
boundary. Frontend API clients, types, mocks, and integrations must follow the
methods, paths, and JSON field names below. Do not add or rename endpoints or
fields without updating the authoritative backend contract.

## Base URLs

Local development HTTP API:

```text
http://localhost:8000/v1
```

HTTP endpoint paths in this document are relative to that base URL. Do not use
a production-looking URL during local development.

Local development WebSocket base:

```text
ws://localhost:8000/v1
```

## Sessions

### `POST /sessions`

Request:

```json
{
  "doctor_id": "d_001",
  "patient_id": "p_092",
  "language_hint": "kn-en"
}
```

Response:

```json
{
  "session_id": "sess_7x9f2k",
  "status": "ready",
  "created_at": "2026-10-08T09:00:00Z",
  "patient_snapshot": {
    "name": "Ravi Kumar",
    "age": 52,
    "chronic_conditions": ["hypertension", "type2_diabetes"],
    "known_allergies": ["penicillin"]
  }
}
```

### `GET /sessions/{session_id}`

Response:

```json
{
  "session_id": "sess_7x9f2k",
  "status": "active",
  "doctor_id": "d_001",
  "patient_id": "p_092",
  "created_at": "2026-10-08T09:00:00Z",
  "duration_seconds": 340,
  "transcript_lines": 28,
  "warnings_fired": 1,
  "note_id": null
}
```

### `PATCH /sessions/{session_id}/end`

Response:

```json
{
  "session_id": "sess_7x9f2k",
  "status": "pending_approval",
  "ended_at": "2026-10-08T09:28:00Z",
  "note_id": "note_3m1pq8"
}
```

Session status values shown by the contract: `ready`, `active`, and
`pending_approval`.

## Audio and transcription

### `POST /sessions/{session_id}/audio`

Request content type: `multipart/form-data`.

| Field | Type / constraint |
| --- | --- |
| `audio` | `.wav` or `.webm` audio file, maximum 30 seconds |
| `chunk_index` | Integer |
| `is_final` | Boolean |

Response:

```json
{
  "chunk_index": 4,
  "language_detected": "kn-en",
  "transcript": [
    {
      "speaker": "DOCTOR",
      "text": "BP kaisa hai?",
      "start_ms": 0,
      "end_ms": 1200,
      "confidence": 0.94
    },
    {
      "speaker": "PATIENT",
      "text": "Bahut zyada hai sir, 3 din se",
      "start_ms": 1400,
      "end_ms": 3600,
      "confidence": 0.89
    }
  ],
  "extraction_triggered": false
}
```

### `GET /sessions/{session_id}/transcript`

Response:

```json
{
  "session_id": "sess_7x9f2k",
  "total_duration_ms": 18400,
  "speaker_counts": {
    "DOCTOR": 14,
    "PATIENT": 12,
    "OTHER": 2
  },
  "lines": [
    {
      "line_index": 0,
      "chunk_index": 0,
      "speaker": "DOCTOR",
      "text": "BP kaisa hai?",
      "start_ms": 0,
      "end_ms": 1200,
      "confidence": 0.94
    }
  ]
}
```

Speaker values shown by the contract: `DOCTOR`, `PATIENT`, `OTHER`.

## Extraction

### `POST /sessions/{session_id}/extract`

Request:

```json
{
  "trigger": "drug_mention",
  "trigger_value": "amoxicillin",
  "transcript_window": "last_60s"
}
```

Response:

```json
{
  "extraction_id": "ext_8a2c",
  "session_id": "sess_7x9f2k",
  "extracted": {
    "diagnoses": [
      {
        "label": "acute_tonsillitis",
        "icd10": "J03.90",
        "confidence": 0.91
      }
    ],
    "medications_mentioned": ["amoxicillin"],
    "symptoms": ["sore throat", "fever for 3 days"],
    "vitals_mentioned": {
      "bp": "150/90",
      "temp_c": null,
      "pulse": null,
      "spo2": null
    }
  },
  "rag_triggered": true,
  "rag_results": [
    {
      "record_id": "rec_44ab",
      "type": "allergy_record",
      "date": "2025-06-14",
      "relevance_score": 0.97,
      "summary": "Rash after amoxicillin — suspected allergy"
    }
  ],
  "warnings": [
    {
      "warning_id": "warn_001",
      "level": "critical",
      "code": "ALLERGY_CONFLICT",
      "drug": "amoxicillin",
      "message": "Patient had adverse reaction to amoxicillin on 2025-06-14. Prescribing is contraindicated.",
      "requires_acknowledgement": true
    }
  ],
  "created_at": "2026-10-08T09:14:22Z"
}
```

## Patient history and RAG

### `POST /patients/{patient_id}/history/embed`

Request fields:

| Field | Type / allowed values |
| --- | --- |
| `type` | `consultation_note`, `allergy_record`, `lab_result`, `prescription` |
| `date` | String/date |
| `source` | `session`, `manual`, `import` |
| `source_id` | String |
| `content` | Structured history content |

Response fields: `record_id`, `patient_id`, `type`, `date`, `embedded`,
`vector_id`, `created_at`.

### `POST /patients/{patient_id}/history/query`

Request:

```json
{
  "query": "amoxicillin allergy drug reaction",
  "top_k": 5,
  "filters": {
    "types": [
      "consultation_note",
      "allergy_record",
      "lab_result",
      "prescription"
    ],
    "date_from": "2023-01-01",
    "date_to": null
  }
}
```

Response:

```json
{
  "patient_id": "p_092",
  "query": "amoxicillin allergy drug reaction",
  "results": [
    {
      "record_id": "rec_44ab",
      "type": "allergy_record",
      "date": "2025-06-14",
      "relevance_score": 0.97,
      "summary": "Rash after amoxicillin — suspected allergy",
      "content": {
        "drug": "amoxicillin",
        "reaction": "rash",
        "severity": "moderate",
        "notes": "Advised to avoid penicillin-class antibiotics."
      }
    }
  ],
  "total_results": 1
}
```

## Rules

### `POST /rules/check`

Request:

```json
{
  "patient_id": "p_092",
  "session_id": "sess_7x9f2k",
  "medications": [
    {
      "drug": "amoxicillin",
      "dose": "500mg",
      "frequency": "3x daily",
      "duration": "7 days"
    }
  ],
  "diagnoses": ["acute_tonsillitis"],
  "vitals": {
    "bp_systolic": 150,
    "bp_diastolic": 90,
    "temp_c": null,
    "pulse": null,
    "spo2": null
  }
}
```

Response:

```json
{
  "passed": false,
  "checked_at": "2026-10-08T09:14:25Z",
  "warnings": [
    {
      "warning_id": "warn_001",
      "level": "critical",
      "code": "ALLERGY_CONFLICT",
      "drug": "amoxicillin",
      "message": "Allergy record on file. Do not prescribe.",
      "source_record_id": "rec_44ab",
      "requires_acknowledgement": true
    }
  ]
}
```

Warning levels: `critical`, `advisory`, `info`.

Warning codes: `ALLERGY_CONFLICT`, `DRUG_INTERACTION`, `DOSAGE_EXCEEDS_MAX`,
`DOSAGE_WATCH`, `DUPLICATE_DRUG`, `LAB_VALUE_FLAG`, `FOLLOW_UP_OVERDUE`.

## Clinical notes

### `POST /notes/generate`

Request:

```json
{
  "session_id": "sess_7x9f2k",
  "mode": "full"
}
```

Response:

```json
{
  "note_id": "note_3m1pq8",
  "session_id": "sess_7x9f2k",
  "status": "draft",
  "generated_at": "2026-10-08T09:27:00Z",
  "warnings_unresolved": 0,
  "content": {
    "chief_complaint": "High BP and sore throat for 3 days",
    "history_of_present_illness": "...",
    "diagnosis": [
      {
        "code": "I10",
        "label": "Essential hypertension",
        "primary": true
      }
    ],
    "prescription": [
      {
        "drug": "Azithromycin",
        "dose": "500mg",
        "frequency": "once daily",
        "duration": "5 days",
        "route": "oral",
        "instructions": "Take after food"
      }
    ],
    "vitals_recorded": {
      "bp": "150/90",
      "temp_c": null,
      "pulse": null,
      "spo2": null
    },
    "follow_up": "Review in 7 days or earlier if symptoms worsen.",
    "doctor_notes": ""
  }
}
```

### `PATCH /notes/{note_id}`

Request:

```json
{
  "content": {
    "prescription": [],
    "doctor_notes": "Patient counselled on salt restriction.",
    "follow_up": "Review in 7 days.",
    "diagnosis": null
  },
  "acknowledge_warning_ids": ["warn_001"]
}
```

The response body was not supplied.

### `POST /notes/{note_id}/approve`

Request:

```json
{
  "doctor_id": "d_001",
  "signature_token": "eyJhb..."
}
```

Response:

```json
{
  "note_id": "note_3m1pq8",
  "status": "approved",
  "approved_by": "d_001",
  "approved_at": "2026-10-08T09:28:00Z",
  "email_dispatch": {
    "queued": true,
    "recipient": "patient@example.com"
  }
}
```

## Patient summary

### `POST /summaries/dispatch`

Request:

```json
{
  "note_id": "note_3m1pq8",
  "language": "kn",
  "channel": "email",
  "recipient_email": "patient@example.com",
  "recipient_name": "Ravi Kumar"
}
```

Response:

```json
{
  "dispatch_id": "disp_6t3w",
  "status": "sent",
  "channel": "email",
  "resend_message_id": "msg_ABC123xyz",
  "recipient_email": "patient@example.com",
  "subject": "Your consultation summary — Dr. Sharma, 8 Oct 2026",
  "language": "kn",
  "message_preview": "ನಿಮ್ಮ ಇಂದಿನ ಸಂಪರ್ಕದ ಸಾರಾಂಶ...",
  "sent_at": "2026-10-08T09:28:05Z"
}
```

## Doctor voice enrollment

### `POST /doctors/{doctor_id}/voice-enroll`

Request content type: `multipart/form-data`; field: audio file.

Response:

```json
{
  "doctor_id": "d_001",
  "enrollment_status": "complete",
  "voice_profile_id": "vp_d001_v2",
  "quality_score": 0.91,
  "duration_ms": 31400,
  "message": "Voice profile created. Speaker identification is now active."
}
```

## Authentication

The supplied contract does not specify an authentication mechanism or
credential transport. Do not infer one from this document.

## Errors

All API errors use this response shape:

```json
{
  "error": {
    "code": "ALLERGY_CONFLICT",
    "message": "Human-readable explanation.",
    "detail": {},
    "request_id": "req_abc123"
  }
}
```

HTTP status mapping:

| Status | Meaning |
| --- | --- |
| `400` | Malformed request |
| `401` | Unauthenticated |
| `403` | Forbidden |
| `404` | Not found |
| `409` | Conflict |
| `422` | Business rule failure |
| `500` | Server error |

## WebSocket

Endpoint: `/sessions/{session_id}/stream` over WebSocket, relative to the
configured WebSocket base URL.

Event types: `transcript.chunk`, `warning.fired`, `extraction.complete`,
`note.ready`, `note.approved`. Event payload fields follow the corresponding
audio upload, warning, extraction, note generation, or note approval response
shape, respectively, with `type` as the event discriminator.
