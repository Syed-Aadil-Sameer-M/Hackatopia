import { apiClient } from './client'
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  EndSessionResponse,
  SessionDetail,
} from '../types/api'

export async function createSession(
  request: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const response = await apiClient.post<CreateSessionResponse>(
    '/sessions',
    request,
  )
  return response.data
}

export async function getSession(
  sessionId: string,
): Promise<SessionDetail> {
  const response = await apiClient.get<SessionDetail>(
    `/sessions/${encodeURIComponent(sessionId)}`,
  )
  return response.data
}

export async function endSession(
  sessionId: string,
): Promise<EndSessionResponse> {
  const response = await apiClient.patch<EndSessionResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/end`,
  )
  return response.data
}