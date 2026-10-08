import type { HistoryResult } from '../../types/api'

interface AllergyCardProps {
  knownAllergies: string[]
  aiRetrievedHistory: HistoryResult[]
  source: 'demo' | 'backend'
  loading?: boolean
  error?: string | null
}

function getHistoryField(
  record: HistoryResult,
  key: string,
): string | null {
  const value = record.content[key]
  return typeof value === 'string' ? value : null
}

export function AllergyCard({
  knownAllergies,
  aiRetrievedHistory,
  source,
  loading = false,
  error = null,
}: AllergyCardProps) {
  return (
    <section className="panel allergy-card" aria-label="Allergy information">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PATIENT INFORMATION</p>
          <h2>Known allergies</h2>
        </div>
        <span className={`data-source data-source-${source}`}>
          {source === 'demo' ? 'DEMO DATA' : 'BACKEND DATA'}
        </span>
      </div>
      {knownAllergies.length === 0 ? (
        <p className="empty-state">
          {source === 'demo'
            ? 'No known allergies in the demo patient record.'
            : 'No known allergies were supplied by the backend.'}
        </p>
      ) : (
        <ul className="known-allergies">
          {knownAllergies.map((allergy) => (
            <li key={allergy}>{allergy}</li>
          ))}
        </ul>
      )}

      <div className="ai-history-block">
        <p className="fact-label">AI-RETRIEVED INFORMATION</p>
        {loading && (
          <p className="empty-state">Retrieving AI-matched history...</p>
        )}
        {error && (
          <p className="error-banner" role="alert">
            History lookup failed: {error}
          </p>
        )}
        {aiRetrievedHistory.length === 0 ? (
          <p className="empty-state">
            {loading
              ? 'AI-retrieved allergy details will appear when lookup completes.'
              : source === 'demo'
              ? 'AI-retrieved allergy history will appear after a history lookup.'
              : 'No AI-retrieved allergy history has been returned by the backend.'}
          </p>
        ) : (
          <ul className="ai-allergy-results">
            {aiRetrievedHistory.map((record) => (
              <li key={record.record_id}>
                <strong>{record.summary}</strong>
                <span>
                  {[
                    getHistoryField(record, 'drug'),
                    getHistoryField(record, 'reaction'),
                    getHistoryField(record, 'severity'),
                    getHistoryField(record, 'notes'),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                <time dateTime={record.date}>{record.date}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
