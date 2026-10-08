import type { DemoAuditEvent } from '../../mocks/demoData'

interface AuditTimelineProps {
  events: DemoAuditEvent[]
}

const eventLabels: Record<string, string> = {
  'session.created': 'Session created',
  'consent.confirmed': 'Consent confirmed',
  'recording.started': 'Recording started',
  'recording.stopped': 'Recording stopped',
  'transcript.chunk': 'Transcript received',
  'medication.detected': 'Medication detected',
  'history.retrieved': 'Patient history retrieved',
  'warning.generated': 'Safety warning generated',
  'warning.acknowledged': 'Warning acknowledged',
  'note.ready': 'Clinical note generated',
  'note.edited': 'Doctor edited note',
  'note.approved': 'Note approved',
  'summary.dispatched': 'Patient summary dispatched',
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <section className="panel audit-panel" aria-labelledby="audit-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SESSION RECORD</p>
          <h2 id="audit-heading">Audit timeline</h2>
        </div>
        <span className="audit-count">{events.length}</span>
      </div>
      <p className="audit-disclaimer">
        Frontend activity timeline for this consultation; not the authoritative
        backend audit log.
      </p>
      {events.length === 0 ? (
        <p className="empty-state">Events appear as the consultation proceeds.</p>
      ) : (
        <ol className="audit-list">
          {[...events].reverse().map((event) => (
            <li key={event.id}>
              <div className="audit-event-row">
                <span className="audit-event">
                  {eventLabels[event.type] ?? event.type}
                </span>
                <span className="audit-status">completed</span>
              </div>
              <p>{event.description}</p>
              <time dateTime={event.timestamp}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
