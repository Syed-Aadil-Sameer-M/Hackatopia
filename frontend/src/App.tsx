import { useState, type FormEvent } from 'react'
import { getSession } from './api/sessions'
import { approveNote, generateNote, updateNote } from './api/notes'
import { dispatchSummary } from './api/summary'
import { LiveTranscript } from './components/consultation/LiveTranscript'
import { ExtractionResults } from './components/consultation/ExtractionResults'
import { ApprovalPanel } from './components/note/ApprovalPanel'
import { ClinicalNote } from './components/note/ClinicalNote'
import { PatientSummary } from './components/patient-summary/PatientSummary'
import { AllergyCard } from './components/patient/AllergyCard'
import { PatientHistory } from './components/patient/PatientHistory'
import { PatientSnapshot } from './components/patient/PatientSnapshot'
import { usePatientHistory } from './hooks/usePatientHistory'
import { useExtraction } from './hooks/useExtraction'
import {
  acknowledgeDemoWarning,
  addMedicationToTranscript,
  approveDemoNote,
  checkDemoRules,
  dispatchPatientSummary,
  editDemoNote,
  generateDemoNote,
  getDemoScenario,
  isDemoMode,
  resetDemoScenario,
  confirmDemoConsent,
  startDemoRecording,
  endDemoRecording,
} from './services/demoMode'
import type { DemoScenario } from './mocks/demoData'
import {
  demoPatientSnapshot,
  demoRuleCheckRequest,
} from './mocks/demoData'
import { WarningPanel } from './components/safety/WarningPanel'
import { AuditTimeline } from './components/audit/AuditTimeline'
import { PrivacyPanel } from './components/privacy/PrivacyPanel'
import type {
  ClinicalNoteContent,
  UpdateNoteRequest,
} from './types/api'
import './App.css'

function App() {
  const [scenario, setScenario] = useState<DemoScenario>(getDemoScenario)
  const [error, setError] = useState('')
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [currentDateTime] = useState(() => new Date().toLocaleString())
  const [summaryError, setSummaryError] = useState('')
  const [summaryPending, setSummaryPending] = useState(false)
  const hasMedicationLine = scenario.transcript.some((line) =>
    line.text.toLowerCase().includes('amoxicillin'),
  )
  const patientHistory = usePatientHistory(
    isDemoMode ? scenario.patient.patientId : null,
    isDemoMode && hasMedicationLine ? 'amoxicillin allergy drug reaction' : null,
  )
  const demoExtraction = useExtraction(
    isDemoMode ? scenario.sessionId : null,
  )

  if (!isDemoMode) {
    return (
      <LiveApiSession />
    )
  }

  const started = scenario.auditEvents.some(
    (event) => event.type === 'session.created',
  )
  const recordingStarted = scenario.auditEvents.some(
    (event) => event.type === 'recording.started',
  )
  const consultationEnded = scenario.sessionStatus === 'pending_approval'
  const hasWarning = scenario.warnings.length > 0
  const warningsPendingAcknowledgement = scenario.warnings.some(
    (warning) =>
      warning.level !== 'info' &&
      !scenario.acknowledgedWarningIds.includes(warning.warning_id),
  )

  function perform(action: () => DemoScenario): void {
    try {
      const nextScenario = action()
      setScenario(nextScenario)
      setError('')
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'The requested demo action failed.',
      )
    }
  }

  function saveNote(): void {
    const content = scenario.note.content
    if (!content) {
      setError('Generate a clinical note before saving edits.')
      return
    }
    perform(() =>
      editDemoNote(
        buildNoteUpdateRequest(content, scenario.acknowledgedWarningIds),
      ),
    )
  }

  function changeDemoNote(content: ClinicalNoteContent): void {
    setScenario((current) => ({
      ...current,
      note: { ...current.note, content },
    }))
  }

  async function approveDemo(signatureToken: string): Promise<void> {
    if (!scenario.note.content) {
      setError('Generate a clinical note before approval.')
      return
    }
    setError('')
    try {
      editDemoNote(
        buildNoteUpdateRequest(
          scenario.note.content,
          scenario.acknowledgedWarningIds,
        ),
      )
      setScenario(getDemoScenario())
      approveDemoNote({
        doctor_id: 'd_001',
        signature_token: signatureToken,
      })
      setScenario(getDemoScenario())
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : 'The demo note could not be approved.',
      )
    }
  }

  async function dispatchDemoSummary(language: 'en' | 'kn'): Promise<void> {
    if (scenario.note.status !== 'approved' || !scenario.note.content) {
      setError('Approve the clinical note before generating a patient summary.')
      return
    }
    setSummaryPending(true)
    setSummaryError('')
    try {
      setScenario(dispatchPatientSummary(language))
      setError('')
    } catch (dispatchError) {
      setSummaryError(
        dispatchError instanceof Error
          ? dispatchError.message
          : 'Unable to generate the patient summary.',
      )
    } finally {
      setSummaryPending(false)
    }
  }

  async function runDemoExtraction(): Promise<void> {
    try {
      await demoExtraction.runExtraction({
        trigger: 'drug_mention',
        trigger_value: 'amoxicillin',
        transcript_window: 'last_60s',
      })
      setScenario(getDemoScenario())
      setError('')
    } catch (extractionError) {
      setError(
        extractionError instanceof Error
          ? extractionError.message
          : 'Unable to extract clinical details.',
      )
    }
  }

  function runDemoRulesCheck(): void {
    try {
      checkDemoRules({
        ...demoRuleCheckRequest,
        session_id: scenario.sessionId,
        patient_id: scenario.patient.patientId,
      })
      setScenario(getDemoScenario())
      setError('')
    } catch (ruleError) {
      setError(
        ruleError instanceof Error
          ? ruleError.message
          : 'Unable to check medication safety.',
      )
    }
  }

  return (
    <main className="care-app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>CareScribe</span>
        </div>
        <div className="header-meta">
          <span>Doctor Console · Dr. Sharma</span>
          <span>{currentDateTime}</span>
          <span className="privacy-indicator">Privacy-first workspace</span>
          <span className="demo-badge">OFFLINE DEMO</span>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">CLINICAL WORKSPACE</p>
          <h1>Consultation</h1>
          <p className="subheading">
            Live transcription, clinical decision support, and note review
          </p>
          <div className="workspace-meta" aria-label="Workspace status">
            <span>Doctor: Dr. Sharma</span>
            <span>Patient: Ravi Kumar · p_092</span>
            <span className="privacy-indicator">Private clinical workspace</span>
            <span>Recording: doctor-controlled</span>
            <span>AI draft — verify</span>
          </div>
        </div>
        <button
          className="button button-primary"
          disabled={
            consultationEnded ||
            (!recordingStarted && !consentConfirmed)
          }
          onClick={() =>
            perform(
              recordingStarted
                ? endDemoRecording
                : () => {
                    resetDemoScenario()
                    confirmDemoConsent()
                    return startDemoRecording()
                  },
            )
          }
          type="button"
        >
          {consultationEnded
            ? 'Consultation ended'
            : recordingStarted
              ? 'End consultation'
              : 'Start Recording'}
        </button>
      </section>

      {!started && (
        <section className="consent-panel" aria-labelledby="consent-heading">
          <div>
            <p className="eyebrow">PATIENT CONSENT</p>
            <h2 id="consent-heading">Confirm before recording</h2>
            <p>
              Confirm that the patient has consented to clinical transcription
              and AI-assisted documentation.
            </p>
          </div>
          <label className="consent-check">
            <input
              checked={consentConfirmed}
              onChange={(event) => {
                setConsentConfirmed(event.target.checked)
                if (event.target.checked) {
                  perform(confirmDemoConsent)
                }
              }}
              type="checkbox"
            />
            Consent confirmed
          </label>
        </section>
      )}

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      <PatientSnapshot
        patientId={scenario.patient.patientId}
        snapshot={demoPatientSnapshot}
        source="demo"
      />
      <PrivacyPanel
        auditStatus={`${scenario.auditEvents.length} frontend events`}
        audioStatus={recordingStarted ? 'Demo transcript processing' : 'Idle'}
        consentConfirmed={consentConfirmed}
        rawAudioStatus="Not retained in demo mode"
        recordingActive={recordingStarted && !consultationEnded}
      />
      <div className="session-current-data">
        <div className="session-state">
          <span className={recordingStarted && !consultationEnded ? 'status-dot active' : 'status-dot'} />
          Current consultation · {
            !recordingStarted
              ? 'Not started'
              : consultationEnded
                ? 'Ended'
                : 'Recording'
          }
        </div>
      </div>

      <div className="workspace-grid">
        <div className="main-column">
          <div>
            <LiveTranscript
              sessionId={started ? scenario.sessionId : null}
              refreshKey={scenario.transcript.length}
            />
            <div className="panel-actions">
              <button
                className="button button-secondary"
                disabled={!recordingStarted || consultationEnded || hasMedicationLine}
                onClick={() => perform(addMedicationToTranscript)}
                type="button"
              >
                Add medication mention
              </button>
              <span className="hint">
                Adds the prescription line that starts the safety review
              </span>
            </div>
          </div>

          {scenario.note.content ? (
            <>
              <ClinicalNote
                content={scenario.note.content}
                disabled={scenario.note.status === 'approved'}
                onChange={changeDemoNote}
              />
              {scenario.note.status === 'draft' && (
                <button
                  className="button button-secondary"
                  onClick={saveNote}
                  type="button"
                >
                  Save note edits
                </button>
              )}
              <ApprovalPanel
                acknowledgedWarningIds={scenario.acknowledgedWarningIds}
                approval={scenario.note.approval}
                error={error || null}
                onApprove={approveDemo}
                pending={false}
                warnings={scenario.warnings}
              />
            </>
          ) : (
            <section className="panel">
              <p className="eyebrow">CLINICAL NOTE</p>
              <h2>Note editor</h2>
              <p className="empty-state">
                Review and acknowledge applicable warnings before generating
                the clinical note.
              </p>
            </section>
          )}

          {scenario.note.status === 'approved' && scenario.note.content && (
            <PatientSummary
              error={summaryError || null}
              noteContent={scenario.note.content}
              noteId={scenario.note.noteId ?? 'unknown'}
              onDispatch={dispatchDemoSummary}
              pending={summaryPending}
              summary={scenario.summaryResponse}
              summaryText={scenario.summary}
            />
          )}
        </div>

        <aside className="side-column">
          <AllergyCard
            aiRetrievedHistory={patientHistory.records}
            knownAllergies={demoPatientSnapshot.known_allergies}
            source="demo"
            loading={patientHistory.loading}
            error={patientHistory.error}
          />
          <PatientHistory
            records={patientHistory.records}
            source="demo"
            loading={patientHistory.loading}
            error={patientHistory.error}
          />
          <ExtractionResults
            extraction={demoExtraction.extraction}
            loading={demoExtraction.loading}
            error={demoExtraction.error}
            disabled={!recordingStarted || consultationEnded || !hasMedicationLine}
            onExtract={() => void runDemoExtraction()}
          />
          {hasWarning && (
            <div className="medication-card">
              <span className="fact-label">EXTRACTED MEDICATION</span>
              <strong>{scenario.extractedMedication}</strong>
            </div>
          )}
          <div className="panel-actions">
            <button
              className="button button-secondary full-width"
              disabled={!scenario.extraction || scenario.ruleCheck !== null}
              onClick={runDemoRulesCheck}
              type="button"
            >
              {scenario.ruleCheck ? 'Safety check complete' : 'Check medication safety'}
            </button>
          </div>
          <WarningPanel
            acknowledgedWarningIds={scenario.acknowledgedWarningIds}
            onAcknowledge={(warningId) =>
              perform(() => acknowledgeDemoWarning(warningId))
            }
            warnings={scenario.warnings}
          />
          {scenario.ruleCheck &&
            scenario.note.status === 'not_started' &&
            consultationEnded &&
            !warningsPendingAcknowledgement &&
            (
              <button
                className="button button-primary full-width"
                onClick={() => perform(generateDemoNote)}
                type="button"
              >
                Generate clinical note
              </button>
            )}

          <AuditTimeline events={scenario.auditEvents} />
        </aside>
      </div>
    </main>
  )
}

function LiveApiSession() {
  const [sessionId, setSessionId] = useState('')
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null)
  const [loadedPatientId, setLoadedPatientId] = useState<string | null>(null)
  const [loadedDoctorId, setLoadedDoctorId] = useState<string | null>(null)
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyQuery, setHistoryQuery] = useState<string | null>(null)
  const [amoxicillinDetected, setAmoxicillinDetected] = useState(false)
  const [acknowledgedWarningIds, setAcknowledgedWarningIds] = useState<
    string[]
  >([])
  const [generatedNote, setGeneratedNote] = useState<Awaited<
    ReturnType<typeof generateNote>
  > | null>(null)
  const [noteContent, setNoteContent] = useState<ClinicalNoteContent | null>(
    null,
  )
  const [approval, setApproval] = useState<
    Awaited<ReturnType<typeof approveNote>> | null
  >(null)
  const [noteBusy, setNoteBusy] = useState(false)
  const [noteError, setNoteError] = useState('')
  const [summary, setSummary] = useState<
    Awaited<ReturnType<typeof dispatchSummary>> | null
  >(null)
  const [summaryPending, setSummaryPending] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const patientHistory = usePatientHistory(loadedPatientId, historyQuery)
  const extraction = useExtraction(loadedSessionId)

  async function runLiveExtraction(): Promise<void> {
    try {
      await extraction.runExtraction({
        trigger: 'drug_mention',
        trigger_value: 'amoxicillin',
        transcript_window: 'last_60s',
      })
    } catch {
      // The hook exposes the request error for the extraction panel.
    }
  }

  async function loadSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setError('')
    setLoading(true)

    try {
      const session = await getSession(sessionId.trim())
      setLoadedSessionId(session.session_id)
      setLoadedPatientId(session.patient_id)
      setLoadedDoctorId(session.doctor_id)
      setConsentConfirmed(false)
      setAcknowledgedWarningIds([])
      setGeneratedNote(null)
      setNoteContent(null)
      setApproval(null)
      setNoteError('')
      setSummary(null)
      setSummaryError('')
      setStatus('Session loaded from the configured API.')
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the session.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function generateClinicalNote(): Promise<void> {
      if (!loadedSessionId) return
      setNoteBusy(true)
      setNoteError('')
      try {
        const generated = await generateNote({
          session_id: loadedSessionId,
          mode: 'full',
        })
        setGeneratedNote(generated)
        setNoteContent(generated.content)
        setApproval(null)
      } catch (generationError) {
        setNoteError(
          generationError instanceof Error
            ? generationError.message
            : 'Unable to generate the clinical note.',
        )
      } finally {
        setNoteBusy(false)
      }
    }

  async function saveClinicalNote(): Promise<void> {
      if (!generatedNote || !noteContent) return
      setNoteBusy(true)
      setNoteError('')
      try {
        await updateNote(
          generatedNote.note_id,
          buildNoteUpdateRequest(noteContent, acknowledgedWarningIds),
        )
      } catch (saveError) {
        setNoteError(
          saveError instanceof Error
            ? saveError.message
            : 'Unable to save the clinical note.',
        )
      } finally {
        setNoteBusy(false)
      }
    }

  async function approveClinicalNote(signatureToken: string): Promise<void> {
    if (!generatedNote || !noteContent || !loadedDoctorId) {
      setNoteError('Load a session and generate a note before approval.')
      return
    }
    setNoteBusy(true)
    setNoteError('')
    setApproval(null)
    try {
      await updateNote(
        generatedNote.note_id,
        buildNoteUpdateRequest(noteContent, acknowledgedWarningIds),
      )
      const result = await approveNote(generatedNote.note_id, {
        doctor_id: loadedDoctorId,
        signature_token: signatureToken,
      })
      setApproval(result)
    } catch (approvalError) {
      setNoteError(
        approvalError instanceof Error
          ? approvalError.message
          : 'The backend did not approve the note.',
      )
    } finally {
      setNoteBusy(false)
    }
  }

  async function dispatchClinicalSummary(language: 'en' | 'kn'): Promise<void> {
    if (!approval || !generatedNote) {
      setSummaryError('Approve the clinical note before generating a summary.')
      return
    }
    setSummaryPending(true)
    setSummaryError('')
    try {
      const response = await dispatchSummary({
        note_id: generatedNote.note_id,
        language,
        channel: 'in_app',
        recipient_email: '',
        recipient_name: 'Patient',
      })
      setSummary(response)
    } catch (dispatchError) {
      setSummaryError(
        dispatchError instanceof Error
          ? dispatchError.message
          : 'Unable to generate the patient summary.',
      )
    } finally {
      setSummaryPending(false)
    }
  }

  return (
    <main className="mode-notice">
      <h1>CareScribe · Doctor Console</h1>
      <p>
        Live API mode is selected. Session data is requested from the configured
        backend; demo data is not loaded.
      </p>
      <form className="live-session-form" onSubmit={loadSession}>
        <label htmlFor="session-id">Session ID</label>
        <input
          autoComplete="off"
          id="session-id"
          onChange={(event) => setSessionId(event.target.value)}
          required
          value={sessionId}
        />
        <button
          className="button button-primary"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Loading...' : 'Load session'}
        </button>
      </form>
      {status && <p className="live-success" role="status">{status}</p>}
      {error && <p className="error-banner" role="alert">{error}</p>}
      {loadedSessionId && loadedPatientId && (
        <>
          <section className="workspace-meta" aria-label="Workspace status">
            <span>Doctor: {loadedDoctorId ?? 'Assigned doctor'}</span>
            <span>Patient: {loadedPatientId}</span>
            <span className="privacy-indicator">
              Privacy indicator: session data stays in the configured workspace
            </span>
            <span>Doctor-controlled recording</span>
            <span>AI draft — verify</span>
          </section>
          <section className="consent-panel" aria-labelledby="live-consent-heading">
            <div>
              <p className="eyebrow">PATIENT CONSENT</p>
              <h2 id="live-consent-heading">Confirm before recording</h2>
              <p>
                Confirm that the patient has consented to clinical transcription
                and AI-assisted documentation.
              </p>
            </div>
            <label className="consent-check">
              <input
                checked={consentConfirmed}
                onChange={(event) => setConsentConfirmed(event.target.checked)}
                type="checkbox"
              />
              Consent confirmed
            </label>
          </section>
          <PatientSnapshot
            patientId={loadedPatientId}
            snapshot={null}
            source="backend"
          />
          <PrivacyPanel
            auditStatus="Frontend activity only"
            audioStatus="Configured backend processing"
            consentConfirmed={consentConfirmed}
            rawAudioStatus="Backend retention policy not provided"
            recordingActive={false}
          />
          <div className="workspace-grid">
            <div className="main-column">
              <LiveTranscript
                sessionId={loadedSessionId}
                consentConfirmed={consentConfirmed}
                onMedicationDetected={() => {
                  setAmoxicillinDetected(true)
                  setHistoryQuery('amoxicillin allergy drug reaction')
                }}
              />
              <ExtractionResults
                extraction={extraction.extraction}
                loading={extraction.loading}
                error={extraction.error}
                disabled={!amoxicillinDetected}
                onExtract={() => void runLiveExtraction()}
              />
              <WarningPanel
                acknowledgedWarningIds={acknowledgedWarningIds}
                onAcknowledge={(warningId) =>
                  setAcknowledgedWarningIds((current) =>
                    current.includes(warningId)
                      ? current
                      : [...current, warningId],
                  )
                }
                warnings={extraction.extraction?.warnings ?? []}
              />
              {!generatedNote ? (
                <section className="panel">
                  <p className="eyebrow">CLINICAL NOTE</p>
                  <h2>Note editor</h2>
                  <p className="empty-state">
                    Generate a clinical note draft for this session.
                  </p>
                  <button
                    className="button button-primary full-width"
                    disabled={noteBusy}
                    onClick={() => void generateClinicalNote()}
                    type="button"
                  >
                    {noteBusy ? 'Generating...' : 'Generate clinical note'}
                  </button>
                  {noteError && <p className="error-banner" role="alert">{noteError}</p>}
                </section>
              ) : noteContent && (
                <>
                  <ClinicalNote
                    content={noteContent}
                    disabled={approval !== null || noteBusy}
                    onChange={setNoteContent}
                  />
                  {!approval && (
                    <button
                      className="button button-secondary"
                      disabled={noteBusy}
                      onClick={() => void saveClinicalNote()}
                      type="button"
                    >
                      {noteBusy ? 'Saving...' : 'Save note edits'}
                    </button>
                  )}
                  <ApprovalPanel
                    acknowledgedWarningIds={acknowledgedWarningIds}
                    approval={approval}
                    error={noteError || null}
                    onApprove={approveClinicalNote}
                    pending={noteBusy}
                    warnings={extraction.extraction?.warnings ?? []}
                  />
                  {approval && noteContent && (
                    <PatientSummary
                      error={summaryError || null}
                      noteContent={noteContent}
                      noteId={generatedNote.note_id}
                      onDispatch={dispatchClinicalSummary}
                      pending={summaryPending}
                      summary={summary}
                      summaryText={summary?.message_preview ?? null}
                    />
                  )}
                </>
              )}
            </div>
            <aside className="side-column">
              <AllergyCard
                aiRetrievedHistory={patientHistory.records}
                knownAllergies={[]}
                source="backend"
                loading={patientHistory.loading}
                error={patientHistory.error}
              />
              <PatientHistory
                records={patientHistory.records}
                source="backend"
                loading={patientHistory.loading}
                error={patientHistory.error}
              />
            </aside>
          </div>
        </>
      )}
    </main>
  )
}

function buildNoteUpdateRequest(
  content: ClinicalNoteContent,
  acknowledgedWarningIds: string[],
): UpdateNoteRequest {
  return {
    content: {
      prescription: content.prescription,
      doctor_notes: content.doctor_notes,
      follow_up: content.follow_up,
      diagnosis: content.diagnosis.length > 0 ? content.diagnosis : null,
    },
    acknowledge_warning_ids: acknowledgedWarningIds,
  }
}

export default App
