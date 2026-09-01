export const COUNTDOWN_SETTINGS_KEY = 'desktop.camera-countdown-seconds'
export const PRINTER_SETTINGS_KEY = 'desktop.printer-settings'

export const COUNTDOWN_OPTIONS = [2, 3, 5] as const

export type CountdownSeconds = (typeof COUNTDOWN_OPTIONS)[number]

export function isCountdownSeconds(value: unknown): value is CountdownSeconds {
  return COUNTDOWN_OPTIONS.includes(value as CountdownSeconds)
}

export async function getCountdownSeconds(fallback: number): Promise<number> {
  const stored = await window.storage.get(COUNTDOWN_SETTINGS_KEY)

  return isCountdownSeconds(stored) ? stored : fallback
}

export async function saveCountdownSeconds(value: CountdownSeconds): Promise<void> {
  await window.storage.set(COUNTDOWN_SETTINGS_KEY, value)
}

export interface PrinterSettings {
  deviceName: string
  displayName: string
}

export async function getPrinterSettings(): Promise<PrinterSettings | null> {
  const stored = await window.storage.get(PRINTER_SETTINGS_KEY)

  if (!stored || typeof stored !== 'object') return null

  const candidate = stored as Partial<PrinterSettings>
  if (typeof candidate.deviceName !== 'string' || !candidate.deviceName) return null

  return {
    deviceName: candidate.deviceName,
    displayName:
      typeof candidate.displayName === 'string' && candidate.displayName
        ? candidate.displayName
        : candidate.deviceName
  }
}

export async function savePrinterSettings(value: PrinterSettings): Promise<void> {
  await window.storage.set(PRINTER_SETTINGS_KEY, value)
}
