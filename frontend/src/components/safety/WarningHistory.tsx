import type { Warning } from '../../types/api'

interface WarningHistoryProps {
  warnings: Warning[]
  acknowledgedWarningIds: string[]
}

export function WarningHistory({
  warnings,
  acknowledgedWarningIds,
}: WarningHistoryProps) {
  if (warnings.length === 0) {
    return <p className="empty-state">No warnings have been returned.</p>
  }

  return (
    <ol className="warning-history">
      {warnings.map((warning) => {
        const acknowledged = acknowledgedWarningIds.includes(
          warning.warning_id,
        )
        return (
          <li key={warning.warning_id}>
            <span className={`warning-history-level ${warning.level}`}>
              {warning.level}
            </span>
            <span>{warning.code}</span>
            <span>
              {warning.level === 'info'
                ? 'No acknowledgement required'
                : acknowledged
                  ? 'Acknowledged'
                  : 'Acknowledgement required'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}