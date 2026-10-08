import { apiClient } from './client'
import type { AudioUploadResponse, TranscriptResponse } from '../types/api'

export async function uploadAudioChunk(
  sessionId: string,
  audioFormData: FormData,
): Promise<AudioUploadResponse> {
  const response = await apiClient.post<AudioUploadResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/audio`,
    audioFormData,
  )
  return response.data
}

export async function getTranscript(
  sessionId: string,
): Promise<TranscriptResponse> {
  const response = await apiClient.get<TranscriptResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/transcript`,
  )
  return response.data
}