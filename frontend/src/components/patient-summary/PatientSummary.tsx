import { useState } from 'react'
import type {
  ClinicalNoteContent,
  SummaryDispatchResponse,
} from '../../types/api'

interface PatientSummaryProps {
  noteId: string
  noteContent: ClinicalNoteContent
  summary: SummaryDispatchResponse | null
  summaryText: string | null
  pending: boolean
  error: string | null
  onDispatch: (language: 'en' | 'kn') => Promise<void>
}

export function PatientSummary({
  noteId,
  noteContent,
  summary,
  summaryText,
  pending,
  error,
  onDispatch,
}: PatientSummaryProps) {
  const [language, setLanguage] = useState<'en' | 'kn'>('en')

  return (
    <section className="panel summary-panel" aria-labelledby="patient-summary-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PATIENT COMMUNICATION</p>
          <h2 id="patient-summary-heading">Patient-friendly summary</h2>
        </div>
        <span className="note-status approved">approved note</span>
      </div>
      <p className="summary-source">
        Generated from approved clinical note <strong>{noteId}</strong>
      </p>

      <div className="summary-facts">
        <div>
          <span>Diagnosis</span>
          {noteContent.diagnosis.length === 0 ? (
            <strong>Not recorded</strong>
          ) : (
            noteContent.diagnosis.map((diagnosis) => (
              <strong key={`${diagnosis.code}-${diagnosis.label}`}>
                {diagnosis.label} ({diagnosis.code})
              </strong>
            ))
          )}
        </div>
        <div>
          <span>Medication</span>
          {noteContent.prescription.length === 0 ? (
            <strong>Not recorded</strong>
          ) : (
            noteContent.prescription.map((prescription) => (
              <div key={`${prescription.drug}-${prescription.dose}`}>
                <strong>{prescription.drug}</strong>
                <small>
                  {prescription.dose} · {prescription.frequency}
                </small>
              </div>
            ))
          )}
        </div>
        <div>
          <span>Follow-up</span>
          <strong>{noteContent.follow_up || 'Not recorded'}</strong>
        </div>
        <div>
          <span>Important instructions</span>
          <strong>{noteContent.doctor_notes || 'No additional instructions recorded.'}</strong>
        </div>
      </div>

      {summaryText && (
        <div className="summary-message">
          <span className="fact-label">
            {summary?.language === 'kn' ? 'KANNADA SUMMARY' : 'ENGLISH SUMMARY'}
          </span>
          <p>{summaryText}</p>
        </div>
      )}

      {!summary && (
        <div className="summary-dispatch">
          <label>
            Summary language
            <select
              onChange={(event) =>
                setLanguage(event.target.value === 'kn' ? 'kn' : 'en')
              }
              value={language}
            >
              <option value="en">English</option>
              <option value="kn">Kannada</option>
            </select>
          </label>
          <button
            className="button button-primary"
            disabled={pending}
            onClick={() => void onDispatch(language)}
            type="button"
          >
            {pending ? 'Generating summary...' : 'Generate patient summary'}
          </button>
        </div>
      )}
      {summary && (
        <p className="summary-dispatched" role="status">
          Patient summary generated in {summary.language === 'kn' ? 'Kannada' : 'English'}.
        </p>
      )}
      {error && <p className="error-banner" role="alert">{error}</p>}
    </section>
  )
}