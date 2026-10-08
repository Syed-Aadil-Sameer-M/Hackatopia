import type { Warning } from '../../types/api'
import { WarningCard } from './WarningCard'
import { WarningHistory } from './WarningHistory'

interface WarningPanelProps {
  warnings: Warning[]
  acknowledgedWarningIds: string[]
  onAcknowledge: (warningId: string) => void
}

function hasUnacknowledgedWarnings(
  warnings: Warning[],
  acknowledgedIds: string[],
): boolean {
  return warnings.some(
    (warning) =>
      warning.level !== 'info' &&
      !acknowledgedIds.includes(warning.warning_id),
  )
}

export function WarningPanel({
  warnings,
  acknowledgedWarningIds,
  onAcknowledge,
}: WarningPanelProps) {
  const blocking = warnings.some(
    (warning) =>
      warning.level === 'critical' &&
      !acknowledgedWarningIds.includes(warning.warning_id),
  )
  const awaitingAcknowledgement = hasUnacknowledgedWarnings(
    warnings,
    acknowledgedWarningIds,
  )

  return (
    <section aria-labelledby="safety-review-heading" className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SAFETY REVIEW</p>
          <h2 id="safety-review-heading">Medication check</h2>
        </div>
      </div>
      {warnings.length === 0 ? (
        <p className="empty-state">
          Run a backend rules check to review safety warnings.
        </p>
      ) : (
        <>
          {blocking && (
            <p className="warning-blocking" role="alert">
              Note approval is blocked until every critical warning is
              acknowledged.
            </p>
          )}
          {warnings.map((warning) => (
            <WarningCard
              acknowledged={acknowledgedWarningIds.includes(
                warning.warning_id,
              )}
              key={warning.warning_id}
              onAcknowledge={onAcknowledge}
              warning={warning}
            />
          ))}
          <details className="warning-history-details">
            <summary>Warning history</summary>
            <WarningHistory
              acknowledgedWarningIds={acknowledgedWarningIds}
              warnings={warnings}
            />
          </details>
          {awaitingAcknowledgement && (
            <p className="warning-acknowledgement-required" role="status">
              Critical and advisory warnings require doctor acknowledgement.
            </p>
          )}
        </>
      )}
    </section>
  )
}