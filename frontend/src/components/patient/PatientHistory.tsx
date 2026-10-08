import type { HistoryResult } from '../../types/api'

interface PatientHistoryProps {
  records: HistoryResult[]
  source: 'demo' | 'backend'
  loading?: boolean
  error?: string | null
}

function formatContent(value: HistoryResult['content'][string]): string {
  if (typeof value === 'string') return value
  if (value === null) return 'Not recorded'
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

export function PatientHistory({
  records,
  source,
  loading = false,
  error = null,
}: PatientHistoryProps) {
  return (
    <section className="panel patient-history" aria-label="Relevant history">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RELEVANT HISTORY</p>
          <h2>Patient history</h2>
        </div>
        <span className={`data-source data-source-${source}`}>
          {source === 'demo' ? 'DEMO DATA' : 'BACKEND DATA'}
        </span>
      </div>
      {loading && <p className="empty-state">Retrieving relevant history...</p>}
      {error && (
        <p className="error-banner" role="alert">
          Patient history could not be retrieved: {error}
        </p>
      )}
      {records.length === 0 ? (
        <p className="empty-state">
          {loading
            ? 'History results will appear when retrieval completes.'
            : source === 'demo'
            ? 'No history records retrieved yet.'
            : 'No history records have been returned by the backend.'}
        </p>
      ) : (
        <ul className="history-results">
          {records.map((record) => (
            <li key={record.record_id}>
              <div className="history-result-heading">
                <strong>{record.summary}</strong>
                <span>{record.type.replaceAll('_', ' ')}</span>
              </div>
              <p>
                Record date: <time dateTime={record.date}>{record.date}</time>
                {' · '}Relevance: {Math.round(record.relevance_score * 100)}%
              </p>
              <dl className="history-content">
                {Object.entries(record.content).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key.replaceAll('_', ' ')}</dt>
                    <dd>{formatContent(value)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
