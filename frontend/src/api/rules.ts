import { apiClient } from './client'
import type { RuleCheckRequest, RuleCheckResponse } from '../types/api'

export async function checkRules(
  request: RuleCheckRequest,
): Promise<RuleCheckResponse> {
  const response = await apiClient.post<RuleCheckResponse>(
    '/rules/check',
    request,
  )
  return response.data
}