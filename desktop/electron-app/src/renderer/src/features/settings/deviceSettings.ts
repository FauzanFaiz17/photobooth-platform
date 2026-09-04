export const COUNTDOWN_SETTINGS_KEY = 'desktop.camera-countdown-seconds'
export const PRINTER_SETTINGS_KEY = 'desktop.printer-settings'
export const APP_SETTINGS_KEY = 'desktop.app-settings'
export const CAMERA_SETTINGS_KEY = 'desktop.camera-settings'

export interface CameraDeviceSettings {
  source: 'canon' | 'webcam'
  deviceId: string | null
  deviceLabel: string | null
  orientation: 'portrait' | 'landscape'
  mirror: boolean
  iso: { value: number; name: string } | null
  aperture: { value: number; name: string } | null
  shutter: { value: number; name: string } | null
}

export const DEFAULT_CAMERA_SETTINGS: CameraDeviceSettings = {
  source: 'webcam',
  deviceId: null,
  deviceLabel: null,
  orientation: 'portrait',
  mirror: true,
  iso: null,
  aperture: null,
  shutter: null
}

export async function getCameraSettings(): Promise<CameraDeviceSettings> {
  const stored = await window.storage.get(CAMERA_SETTINGS_KEY)
  if (!stored || typeof stored !== 'object') return DEFAULT_CAMERA_SETTINGS
  const candidate = stored as Partial<CameraDeviceSettings>

  return {
    source: candidate.source === 'canon' ? 'canon' : 'webcam',
    deviceId: typeof candidate.deviceId === 'string' ? candidate.deviceId : null,
    deviceLabel: typeof candidate.deviceLabel === 'string' ? candidate.deviceLabel : null,
    orientation: candidate.orientation === 'landscape' ? 'landscape' : 'portrait',
    mirror: typeof candidate.mirror === 'boolean' ? candidate.mirror : true,
    iso: candidate.iso ?? null,
    aperture: candidate.aperture ?? null,
    shutter: candidate.shutter ?? null
  }
}

export async function saveCameraSettings(value: CameraDeviceSettings): Promise<void> {
  await window.storage.set(CAMERA_SETTINGS_KEY, value)
}

export interface AppSettings {
  countdownSeconds: number
  sessionTimerMinutes: number
  qrTimerSeconds: number
  storageDirectory: string | null
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  countdownSeconds: 3,
  sessionTimerMinutes: 6,
  qrTimerSeconds: 30,
  storageDirectory: null
}

function boundedNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(minimum, Math.min(maximum, Math.round(value)))
}

export async function getAppSettings(): Promise<AppSettings> {
  const [stored, legacyCountdown] = await Promise.all([
    window.storage.get(APP_SETTINGS_KEY),
    window.storage.get(COUNTDOWN_SETTINGS_KEY)
  ])
  const candidate = stored && typeof stored === 'object' ? (stored as Partial<AppSettings>) : {}

  return {
    countdownSeconds: boundedNumber(
      candidate.countdownSeconds ?? legacyCountdown,
      DEFAULT_APP_SETTINGS.countdownSeconds,
      1,
      10
    ),
    sessionTimerMinutes: boundedNumber(
      candidate.sessionTimerMinutes,
      DEFAULT_APP_SETTINGS.sessionTimerMinutes,
      1,
      6
    ),
    qrTimerSeconds: boundedNumber(
      candidate.qrTimerSeconds,
      DEFAULT_APP_SETTINGS.qrTimerSeconds,
      5,
      120
    ),
    storageDirectory:
      typeof candidate.storageDirectory === 'string' && candidate.storageDirectory.trim()
        ? candidate.storageDirectory
        : null
  }
}

export async function saveAppSettings(value: AppSettings): Promise<void> {
  await Promise.all([
    window.storage.set(APP_SETTINGS_KEY, value),
    window.storage.set(COUNTDOWN_SETTINGS_KEY, value.countdownSeconds)
  ])
}

export async function getCountdownSeconds(fallback: number): Promise<number> {
  const settings = await getAppSettings()
  return settings.countdownSeconds || fallback
}

export interface PrinterSettings {
  deviceName: string
  displayName: string
  quality: 'standard' | 'high'
  scale: number
  horizontalPosition: number
  verticalPosition: number
  paperSize: '2r' | '4r'
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
        : candidate.deviceName,
    quality: candidate.quality === 'high' ? 'high' : 'standard',
    scale: typeof candidate.scale === 'number' ? Math.min(120, Math.max(80, candidate.scale)) : 100,
    horizontalPosition: typeof candidate.horizontalPosition === 'number' ? Math.min(100, Math.max(-100, candidate.horizontalPosition)) : 0,
    verticalPosition: typeof candidate.verticalPosition === 'number' ? Math.min(100, Math.max(-100, candidate.verticalPosition)) : 0,
    paperSize: candidate.paperSize === '2r' ? '2r' : '4r'
  }
}

export async function savePrinterSettings(value: PrinterSettings): Promise<void> {
  await window.storage.set(PRINTER_SETTINGS_KEY, value)
}
