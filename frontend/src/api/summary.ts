import { apiClient } from './client'
import type {
  SummaryDispatchRequest,
  SummaryDispatchResponse,
} from '../types/api'

export async function dispatchSummary(
  request: SummaryDispatchRequest,
): Promise<SummaryDispatchResponse> {
  const response = await apiClient.post<SummaryDispatchResponse>(
    '/summaries/dispatch',
    request,
  )
  return response.data
}