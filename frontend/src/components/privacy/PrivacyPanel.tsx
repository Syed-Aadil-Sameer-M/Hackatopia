interface PrivacyPanelProps {
  consentConfirmed: boolean
  recordingActive: boolean
  audioStatus: string
  rawAudioStatus: string
  auditStatus: string
}

export function PrivacyPanel({
  consentConfirmed,
  recordingActive,
  audioStatus,
  rawAudioStatus,
  auditStatus,
}: PrivacyPanelProps) {
  return (
    <section className="panel privacy-panel" aria-labelledby="privacy-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PRIVACY</p>
          <h2 id="privacy-heading">Privacy status</h2>
        </div>
        <span className="privacy-indicator">Doctor controlled</span>
      </div>
      <dl className="privacy-list">
        <div>
          <dt>Patient consent</dt>
          <dd>{consentConfirmed ? 'Confirmed' : 'Awaiting confirmation'}</dd>
        </div>
        <div>
          <dt>Recording</dt>
          <dd>{recordingActive ? 'Active — patient consent confirmed' : 'Not active'}</dd>
        </div>
        <div>
          <dt>Audio processing</dt>
          <dd>{audioStatus}</dd>
        </div>
        <div>
          <dt>Raw audio</dt>
          <dd>{rawAudioStatus}</dd>
        </div>
        <div>
          <dt>Audit trail</dt>
          <dd>{auditStatus}</dd>
        </div>
      </dl>
    </section>
  )
}
