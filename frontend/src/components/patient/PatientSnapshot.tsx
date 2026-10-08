import type { PatientSnapshot as PatientSnapshotData } from '../../types/api'

interface PatientSnapshotProps {
  patientId: string
  snapshot: PatientSnapshotData | null
  source: 'demo' | 'backend'
}

export function PatientSnapshot({
  patientId,
  snapshot,
  source,
}: PatientSnapshotProps) {
  return (
    <section className="patient-banner" aria-label="Patient information">
      <div className="patient-avatar" aria-hidden="true">
        {snapshot?.name
          .split(/\s+/)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() ?? '--'}
      </div>
      <div className="patient-ident">
        <p className="fact-label">PATIENT INFORMATION · {source.toUpperCase()}</p>
        <h2>{snapshot?.name ?? 'Patient details unavailable'}</h2>
        <p>
          {snapshot ? `${snapshot.age} years` : 'Age unavailable'}
          <span>·</span>
          {patientId}
        </p>
      </div>
      <div className="patient-facts">
        <span className="fact-label">RELEVANT HISTORY</span>
        <span>
          {snapshot
            ? snapshot.chronic_conditions
                .map((condition) =>
                  condition
                    .split('_')
                    .map((word) => word[0]?.toUpperCase() + word.slice(1))
                    .join(' '),
                )
                .join(' · ')
            : 'Not supplied by backend'}
        </span>
      </div>
    </section>
  )
}
