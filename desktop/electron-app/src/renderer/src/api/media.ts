import api from './axios'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface RemotePhotoSession {
  id: number
  event_id: number | null
  status: 'started' | 'completed'
}

export interface UploadedMedia {
  id: number
  photo_session_id: number
  filename: string
  size_bytes: number
}

export async function createPhotoSession(eventId: number): Promise<RemotePhotoSession> {
  const response = await api.post<ApiEnvelope<RemotePhotoSession>>('/v1/desktop/photo-sessions', {
    event_id: eventId
  })

  return response.data.data
}

export async function uploadSessionMedia(
  sessionId: number,
  payload: {
    type: 'original' | 'edited' | 'template' | 'thumbnail'
    filename: string
    mime_type: 'image/png' | 'image/jpeg'
    data_url: string
    width?: number
    height?: number
  }
): Promise<UploadedMedia> {
  const response = await api.post<ApiEnvelope<UploadedMedia>>(
    `/v1/desktop/photo-sessions/${sessionId}/media`,
    payload
  )

  return response.data.data
}

export async function completePhotoSession(sessionId: number): Promise<RemotePhotoSession> {
  const response = await api.post<ApiEnvelope<RemotePhotoSession>>(
    `/v1/desktop/photo-sessions/${sessionId}/complete`
  )

  return response.data.data
}
