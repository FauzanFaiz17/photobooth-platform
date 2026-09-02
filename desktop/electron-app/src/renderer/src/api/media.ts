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
  folder_slug?: string | null
  gallery?: {
    url: string
    expires_at: string
  } | null
}

export interface UploadedMedia {
  id: number
  photo_session_id: number
  filename: string
  size_bytes: number
}

export async function createPhotoSession(
  eventId: number,
  paymentId?: number,
  customerId?: number
): Promise<RemotePhotoSession> {
  const response = await api.post<ApiEnvelope<RemotePhotoSession>>('/v1/desktop/photo-sessions', {
    event_id: eventId,
    payment_id: paymentId,
    customer_id: customerId
  })

  return response.data.data
}

export async function uploadSessionMedia(
  sessionId: number,
  payload: {
    type: 'original' | 'edited' | 'template' | 'gif' | 'thumbnail'
    filename: string
    mime_type: 'image/png' | 'image/jpeg' | 'image/gif'
    data_url: string
    width?: number
    height?: number
    duration_seconds?: number
  }
): Promise<UploadedMedia> {
  const response = await api.post<ApiEnvelope<UploadedMedia>>(
    `/v1/desktop/photo-sessions/${sessionId}/media`,
    payload
  )

  return response.data.data
}

export function extractGalleryUrl(session: RemotePhotoSession | null): string | null {
  return session?.gallery?.url ?? null
}

export async function completePhotoSession(
  sessionId: number,
  printedLocally = false
): Promise<RemotePhotoSession> {
  const response = await api.post<ApiEnvelope<RemotePhotoSession>>(
    `/v1/desktop/photo-sessions/${sessionId}/complete`,
    { printed_locally: printedLocally }
  )

  return response.data.data
}
