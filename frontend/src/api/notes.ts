import { apiClient } from './client'
import type {
  ApproveNoteRequest,
  ApproveNoteResponse,
  GenerateNoteRequest,
  GenerateNoteResponse,
  UpdateNoteRequest,
} from '../types/api'

export async function generateNote(
  request: GenerateNoteRequest,
): Promise<GenerateNoteResponse> {
  const response = await apiClient.post<GenerateNoteResponse>(
    '/notes/generate',
    request,
  )
  return response.data
}

export async function updateNote(
  noteId: string,
  request: UpdateNoteRequest,
): Promise<void> {
  await apiClient.patch(`/notes/${encodeURIComponent(noteId)}`, request)
}

export async function approveNote(
  noteId: string,
  request: ApproveNoteRequest,
): Promise<ApproveNoteResponse> {
  const response = await apiClient.post<ApproveNoteResponse>(
    `/notes/${encodeURIComponent(noteId)}/approve`,
    request,
  )
  return response.data
}