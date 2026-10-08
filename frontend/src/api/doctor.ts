import { apiClient } from './client'
import type { VoiceEnrollmentResponse } from '../types/api'

export async function enrollDoctorVoice(
  doctorId: string,
  audio: File | Blob,
): Promise<VoiceEnrollmentResponse> {
  const formData = new FormData()
  formData.append('audio', audio, audio instanceof File ? audio.name : 'voice-enrollment.webm')

  const response = await apiClient.post<VoiceEnrollmentResponse>(
    `/doctors/${encodeURIComponent(doctorId)}/voice-enroll`,
    formData,
  )
  return response.data
}