import { apiClient } from './client'
import type { ExtractionRequest, ExtractionResponse } from '../types/api'

export async function extractSession(
  sessionId: string,
  request: ExtractionRequest,
): Promise<ExtractionResponse> {
  const response = await apiClient.post<ExtractionResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/extract`,
    request,
  )
  return response.data
}