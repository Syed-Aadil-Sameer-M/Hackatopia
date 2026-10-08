import { useState, type FormEvent } from 'react'
import type {
  ApproveNoteResponse,
  Warning,
} from '../../types/api'

interface ApprovalPanelProps {
  warnings: Warning[]
  acknowledgedWarningIds: string[]
  approval: ApproveNoteResponse | null
  pending: boolean
  error: string | null
  onApprove: (signatureToken: string) => Promise<void>
}

export function ApprovalPanel({
  warnings,
  acknowledgedWarningIds,
  approval,
  pending,
  error,
  onApprove,
}: ApprovalPanelProps) {
  const [signatureToken, setSignatureToken] = useState('')
  const hasUnacknowledgedWarning = warnings.some(
    (warning) =>
      warning.level !== 'info' &&
      !acknowledgedWarningIds.includes(warning.warning_id),
  )
  const hasUnresolvedCritical = warnings.some(
    (warning) =>
      warning.level === 'critical' &&
      !acknowledgedWarningIds.includes(warning.warning_id),
  )

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    await onApprove(signatureToken)
  }

  return (
    <section className="panel approval-panel" aria-labelledby="approval-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">DOCTOR REVIEW</p>
          <h2 id="approval-heading">Approval</h2>
        </div>
      </div>
      {approval ? (
        <p className="approval-success" role="status">
          Note approved by {approval.approved_by} at{' '}
          {new Date(approval.approved_at).toLocaleString()}.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          {hasUnresolvedCritical && (
            <p className="warning-blocking" role="alert">
              Approval is blocked while a critical warning is unresolved.
            </p>
          )}
          {hasUnacknowledgedWarning && (
            <p className="warning-acknowledgement-required" role="status">
              Acknowledge critical and advisory warnings before approval.
            </p>
          )}
          <label className="note-field">
            Signature token
            <input
              autoComplete="off"
              onChange={(event) => setSignatureToken(event.target.value)}
              required
              type="password"
              value={signatureToken}
            />
          </label>
          {error && <p className="error-banner" role="alert">{error}</p>}
          <button
            className="button button-primary full-width"
            disabled={
              pending ||
              hasUnacknowledgedWarning ||
              !signatureToken.trim()
            }
            type="submit"
          >
            {pending ? 'Approving...' : 'Approve note'}
          </button>
        </form>
      )}
    </section>
  )
}