import type { Warning } from '../../types/api'

interface WarningCardProps {
  warning: Warning
  acknowledged: boolean
  onAcknowledge: (warningId: string) => void
}

export function WarningCard({
  warning,
  acknowledged,
  onAcknowledge,
}: WarningCardProps) {
  const requiresAcknowledgement = warning.level !== 'info'

  return (
    <article
      aria-label={`${warning.level} warning: ${warning.code}`}
      className={`warning-card warning-card-${warning.level}`}
    >
      <div className="warning-title">
        <span className="warning-icon" aria-hidden="true">
          !
        </span>
        <div>
          <span className="warning-severity">
            {warning.level.toUpperCase()} · {warning.code}
          </span>
          <strong>{warning.message}</strong>
        </div>
      </div>
      {warning.drug && <p>Medication: {warning.drug}</p>}
      {requiresAcknowledgement &&
        (acknowledged ? (
          <p className="acknowledged">Acknowledged by doctor</p>
        ) : (
          <button
            className="button button-danger"
            onClick={() => onAcknowledge(warning.warning_id)}
            type="button"
          >
            Acknowledge warning
          </button>
        ))}
    </article>
  )
}