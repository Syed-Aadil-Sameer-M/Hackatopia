import { useState } from 'react'
import {
  createSession as createApiSession,
  endSession as endApiSession,
  getSession as getApiSession,
} from '../api/sessions'
import {
  createDemoSession,
  endDemoSession,
  getDemoSession,
  isDemoMode,
} from '../services/demoMode'
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  EndSessionResponse,
  PatientSnapshot,
  SessionDetail,
  SessionStatus,
} from '../types/api'

export interface UseSessionOptions {
  patientId?: string
  doctorId?: string
  languageHint?: string
}

export function useSession(options: UseSessionOptions = {}) {
  const [patientId, setPatientId] = useState(options.patientId ?? 'p_092')
  const [doctorId, setDoctorId] = useState(options.doctorId ?? 'd_001')
  const [languageHint, setLanguageHint] = useState(
    options.languageHint ?? 'kn-en',
  )
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null,
  )
  const [patientSnapshot, setPatientSnapshot] =
    useState<PatientSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createSession(): Promise<CreateSessionResponse> {
    setLoading(true)
    setError(null)
    const request: CreateSessionRequest = {
      patient_id: patientId,
      doctor_id: doctorId,
      language_hint: languageHint,
    }

    try {
      const result = isDemoMode
        ? createDemoSession(request)
        : await createApiSession(request)
      setSessionId(result.session_id)
      setSessionStatus(result.status)
      setPatientSnapshot(result.patient_snapshot)
      return result
    } catch (operationError) {
      const message =
        operationError instanceof Error
          ? operationError.message
          : 'Unable to create the session.'
      setError(message)
      throw operationError
    } finally {
      setLoading(false)
    }
  }

  async function getSession(): Promise<SessionDetail> {
    if (!sessionId) {
      const missingSessionError = new Error('Create a session first.')
      setError(missingSessionError.message)
      throw missingSessionError
    }

    setLoading(true)
    setError(null)

    try {
      const result = isDemoMode
        ? getDemoSession(sessionId)
        : await getApiSession(sessionId)
      setSessionStatus(result.status)
      return result
    } catch (operationError) {
      const message =
        operationError instanceof Error
          ? operationError.message
          : 'Unable to load the session.'
      setError(message)
      throw operationError
    } finally {
      setLoading(false)
    }
  }

  async function endSession(): Promise<EndSessionResponse> {
    if (!sessionId) {
      const missingSessionError = new Error('Create a session first.')
      setError(missingSessionError.message)
      throw missingSessionError
    }

    setLoading(true)
    setError(null)

    try {
      const result = isDemoMode
        ? endDemoSession(sessionId)
        : await endApiSession(sessionId)
      setSessionStatus(result.status)
      return result
    } catch (operationError) {
      const message =
        operationError instanceof Error
          ? operationError.message
          : 'Unable to end the session.'
      setError(message)
      throw operationError
    } finally {
      setLoading(false)
    }
  }

  return {
    patientId,
    setPatientId,
    doctorId,
    setDoctorId,
    languageHint,
    setLanguageHint,
    sessionId,
    sessionStatus,
    patientSnapshot,
    loading,
    error,
    createSession,
    getSession,
    endSession,
  }
}