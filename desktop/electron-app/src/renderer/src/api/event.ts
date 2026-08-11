import api from './axios'

import type { EventConfiguration } from '@/features/event/types'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export async function getEventConfiguration(eventCode: string): Promise<EventConfiguration> {
  const response = await api.get<ApiEnvelope<EventConfiguration>>(
    `/v1/desktop/events/${encodeURIComponent(eventCode)}/configuration`
  )

  return response.data.data
}
