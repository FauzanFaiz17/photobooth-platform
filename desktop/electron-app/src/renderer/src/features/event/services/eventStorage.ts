import type { EventConfiguration } from '../types'

const EVENT_CONFIGURATION_KEY = 'desktop.event-configuration'

function isEventConfiguration(value: unknown): value is EventConfiguration {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<EventConfiguration>

  return Boolean(
    candidate.event?.event_code &&
    candidate.template?.id &&
    candidate.filter?.id &&
    candidate.camera?.id &&
    candidate.printer?.id
  )
}

export const eventStorage = {
  async save(configuration: EventConfiguration): Promise<void> {
    await window.storage.set(EVENT_CONFIGURATION_KEY, configuration)
  },

  async get(eventCode: string): Promise<EventConfiguration | null> {
    const value = await window.storage.get(EVENT_CONFIGURATION_KEY)

    if (!isEventConfiguration(value)) return null

    return value.event.event_code.toUpperCase() === eventCode.toUpperCase() ? value : null
  },

  async getSaved(): Promise<EventConfiguration | null> {
    const value = await window.storage.get(EVENT_CONFIGURATION_KEY)
    return isEventConfiguration(value) ? value : null
  },

  async clear(): Promise<void> {
    await window.storage.delete(EVENT_CONFIGURATION_KEY)
  }
}
