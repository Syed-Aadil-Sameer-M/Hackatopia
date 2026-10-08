import type { ExtractionResponse } from '../../types/api'

interface ExtractionResultsProps {
  extraction: ExtractionResponse | null
  loading: boolean
  error: string | null
  disabled: boolean
  onExtract: () => void
}

function displayVital(value: string | number | null): string {
  return value === null ? 'Not mentioned' : String(value)
}

export function ExtractionResults({
  extraction,
  loading,
  error,
  disabled,
  onExtract,
}: ExtractionResultsProps) {
  return (
    <section className="panel extraction-panel" aria-label="AI extraction">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AI EXTRACTION</p>
          <h2>Clinical details</h2>
        </div>
        {extraction && <span className="ai-draft-badge">AI draft — verify</span>}
      </div>

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      {!extraction ? (
        <>
          <p className="empty-state">
            Extract symptoms, diagnoses, medications, and mentioned vitals from
            the consultation transcript.
          </p>
          <button
            className="button button-primary full-width"
            disabled={disabled || loading}
            onClick={onExtract}
            type="button"
          >
            {loading ? 'Extracting...' : 'Run AI extraction'}
          </button>
        </>
      ) : (
        <>
          <p className="ai-draft-note">
            AI draft — verify all generated details before using them in the
            clinical note.
          </p>
          <div className="extraction-section">
            <h3>Symptoms</h3>
            {extraction.extracted.symptoms.length > 0 ? (
              <ul>
                {extraction.extracted.symptoms.map((symptom) => (
                  <li key={symptom}>{symptom}</li>
                ))}
              </ul>
            ) : (
              <p>None extracted</p>
            )}
          </div>

          <div className="extraction-section">
            <h3>Diagnoses</h3>
            {extraction.extracted.diagnoses.length > 0 ? (
              <ul>
                {extraction.extracted.diagnoses.map((diagnosis) => (
                  <li key={diagnosis.icd10}>
                    <strong>{diagnosis.label}</strong>
                    <span>
                      {diagnosis.icd10} ·{' '}
                      {Math.round(diagnosis.confidence * 100)}% confidence
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>None extracted</p>
            )}
          </div>

          <div className="extraction-section">
            <h3>Medications</h3>
            {extraction.extracted.medications_mentioned.length > 0 ? (
              <ul>
                {extraction.extracted.medications_mentioned.map((medication) => (
                  <li key={medication}>{medication}</li>
                ))}
              </ul>
            ) : (
              <p>None extracted</p>
            )}
          </div>

          <div className="extraction-section">
            <h3>Vitals mentioned</h3>
            <dl>
              <div>
                <dt>Blood pressure</dt>
                <dd>{displayVital(extraction.extracted.vitals_mentioned.bp)}</dd>
              </div>
              <div>
                <dt>Temperature</dt>
                <dd>
                  {displayVital(extraction.extracted.vitals_mentioned.temp_c)}
                  {extraction.extracted.vitals_mentioned.temp_c !== null &&
                    ' °C'}
                </dd>
              </div>
              <div>
                <dt>Pulse</dt>
                <dd>{displayVital(extraction.extracted.vitals_mentioned.pulse)}</dd>
              </div>
              <div>
                <dt>SpO₂</dt>
                <dd>{displayVital(extraction.extracted.vitals_mentioned.spo2)}</dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </section>
  )
}
