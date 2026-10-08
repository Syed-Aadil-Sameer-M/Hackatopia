import { apiClient } from './client'
import type {
  HistoryEmbedRequest,
  HistoryEmbedResponse,
  HistoryQueryRequest,
  HistoryQueryResponse,
} from '../types/api'

export async function embedPatientHistory(
  patientId: string,
  request: HistoryEmbedRequest,
): Promise<HistoryEmbedResponse> {
  const response = await apiClient.post<HistoryEmbedResponse>(
    `/patients/${encodeURIComponent(patientId)}/history/embed`,
    request,
  )
  return response.data
}

export async function queryPatientHistory(
  patientId: string,
  request: HistoryQueryRequest,
): Promise<HistoryQueryResponse> {
  const response = await apiClient.post<HistoryQueryResponse>(
    `/patients/${encodeURIComponent(patientId)}/history/query`,
    request,
  )
  return response.data
}