import type { ClinicalNoteContent, DiagnosisEntry } from '../../types/api'
import { PrescriptionEditor } from './PrescriptionEditor'

interface ClinicalNoteProps {
  content: ClinicalNoteContent
  disabled: boolean
  onChange: (content: ClinicalNoteContent) => void
}

export function ClinicalNote({
  content,
  disabled,
  onChange,
}: ClinicalNoteProps) {
  function updateDiagnosis(
    index: number,
    field: keyof DiagnosisEntry,
    value: string | boolean,
  ): void {
    onChange({
      ...content,
      diagnosis: content.diagnosis.map((diagnosis, diagnosisIndex) =>
        diagnosisIndex === index
          ? { ...diagnosis, [field]: value }
          : diagnosis,
      ),
    })
  }

  return (
    <section className="panel clinical-note" aria-labelledby="clinical-note-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CLINICAL NOTE</p>
          <h2 id="clinical-note-heading">Note editor</h2>
        </div>
      </div>
      <p className="ai-draft-label">AI draft — verify</p>

      <section className="note-section">
        <h3>Chief complaint</h3>
        <p className="note-readonly">{content.chief_complaint || 'Not provided.'}</p>
      </section>
      <section className="note-section">
        <h3>History of present illness</h3>
        <p className="note-readonly">
          {content.history_of_present_illness || 'Not provided.'}
        </p>
      </section>

      <section className="note-section">
        <h3>Diagnosis</h3>
        {content.diagnosis.map((diagnosis, index) => (
          <fieldset className="diagnosis-fields" disabled={disabled} key={index}>
            <label>
              Code
              <input
                onChange={(event) =>
                  updateDiagnosis(index, 'code', event.target.value)
                }
                value={diagnosis.code}
              />
            </label>
            <label>
              Diagnosis
              <input
                onChange={(event) =>
                  updateDiagnosis(index, 'label', event.target.value)
                }
                value={diagnosis.label}
              />
            </label>
            <label className="checkbox-label">
              <input
                checked={diagnosis.primary}
                onChange={(event) =>
                  updateDiagnosis(index, 'primary', event.target.checked)
                }
                type="checkbox"
              />
              Primary diagnosis
            </label>
            <button
              className="button button-secondary"
              onClick={() =>
                onChange({
                  ...content,
                  diagnosis: content.diagnosis.filter(
                    (_, diagnosisIndex) => diagnosisIndex !== index,
                  ),
                })
              }
              type="button"
            >
              Remove diagnosis
            </button>
          </fieldset>
        ))}
        <button
          className="button button-secondary"
          disabled={disabled}
          onClick={() =>
            onChange({
              ...content,
              diagnosis: [
                ...content.diagnosis,
                { code: '', label: '', primary: content.diagnosis.length === 0 },
              ],
            })
          }
          type="button"
        >
          Add diagnosis
        </button>
      </section>

      <section className="note-section">
        <h3>Vitals</h3>
        <dl className="note-vitals">
          <div><dt>Blood pressure</dt><dd>{content.vitals_recorded.bp || 'Not recorded'}</dd></div>
          <div><dt>Temperature</dt><dd>{content.vitals_recorded.temp_c ?? 'Not recorded'}</dd></div>
          <div><dt>Pulse</dt><dd>{content.vitals_recorded.pulse ?? 'Not recorded'}</dd></div>
          <div><dt>SpO₂</dt><dd>{content.vitals_recorded.spo2 ?? 'Not recorded'}</dd></div>
        </dl>
      </section>

      <PrescriptionEditor
        disabled={disabled}
        onChange={(prescription) => onChange({ ...content, prescription })}
        prescriptions={content.prescription}
      />

      <label className="note-section note-field">
        <span>Follow-up</span>
        <textarea
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...content, follow_up: event.target.value })
          }
          value={content.follow_up}
        />
      </label>
      <label className="note-section note-field">
        <span>Doctor notes</span>
        <textarea
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...content, doctor_notes: event.target.value })
          }
          value={content.doctor_notes}
        />
      </label>
    </section>
  )
}