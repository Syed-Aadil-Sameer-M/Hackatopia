import { useEffect, useState } from 'react'
import { queryPatientHistory } from '../api/history'
import { isDemoMode, queryDemoPatientHistory } from '../services/demoMode'
import type {
  HistoryQueryRequest,
  HistoryResult,
  HistoryRecordType,
} from '../types/api'

const HISTORY_TYPES: HistoryRecordType[] = [
  'consultation_note',
  'allergy_record',
  'lab_result',
  'prescription',
]

const initialResults: HistoryResult[] = []

export function usePatientHistory(
  patientId: string | null,
  query: string | null,
) {
  const [records, setRecords] = useState<HistoryResult[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!patientId || !query) {
      return () => {
        cancelled = true
      }
    }

    const request: HistoryQueryRequest = {
      query,
      top_k: 5,
      filters: {
        types: HISTORY_TYPES,
        date_from: '2023-01-01',
        date_to: null,
      },
    }

    void Promise.resolve().then(async () => {
      if (cancelled) return
      setLoading(true)
      setError(null)

      try {
        const response = isDemoMode
          ? queryDemoPatientHistory(patientId, request)
          : await queryPatientHistory(patientId, request)
        if (!cancelled) {
          setRecords(response.results)
        }
      } catch (historyError) {
        if (!cancelled) {
          setError(
            historyError instanceof Error
              ? historyError.message
              : 'Unable to retrieve patient history.',
          )
          setRecords([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [patientId, query])

  return { records, loading, error }
}
