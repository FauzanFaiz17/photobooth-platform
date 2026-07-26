import type {
  FieldErrors,
  KioskGeneralSettings,
  KioskPrintSettings,
  KioskSessionSettings,
  KioskTab,
} from "../types/kiosk.types"

const kioskTabs = [
  "overview",
  "configuration",
  "device-health",
  "activity",
  "maintenance",
] satisfies ReadonlyArray<KioskTab>

export const isKioskTab = (value: string): value is KioskTab =>
  kioskTabs.some((tab) => tab === value)

const validateRequiredText = (
  value: string,
  label: string,
  minimumLength = 2
): string | undefined => {
  const normalizedValue = value.trim()
  if (normalizedValue.length === 0) return `${label} wajib diisi.`
  if (normalizedValue.length < minimumLength) {
    return `${label} minimal ${minimumLength} karakter.`
  }
  return undefined
}

export const validateGeneralSettings = (
  values: KioskGeneralSettings
): FieldErrors<KioskGeneralSettings> => {
  const errors: FieldErrors<KioskGeneralSettings> = {}
  const kioskNameError = validateRequiredText(values.kioskName, "Kiosk name")
  const locationError = validateRequiredText(values.location, "Location")
  const serviceNameError = validateRequiredText(values.serviceName, "Service name")

  if (kioskNameError) errors.kioskName = kioskNameError
  if (locationError) errors.location = locationError
  if (serviceNameError) errors.serviceName = serviceNameError
  return errors
}

export const validateSessionSettings = (
  values: KioskSessionSettings
): FieldErrors<KioskSessionSettings> => {
  const errors: FieldErrors<KioskSessionSettings> = {}

  if (values.sessionDurationMinutes < 1 || values.sessionDurationMinutes > 30) {
    errors.sessionDurationMinutes = "Session duration harus antara 1–30 menit."
  }
  if (values.countdownSeconds < 3 || values.countdownSeconds > 10) {
    errors.countdownSeconds = "Countdown harus antara 3–10 detik."
  }
  if (values.captureCount < 1 || values.captureCount > 10) {
    errors.captureCount = "Capture count harus antara 1–10."
  }
  if (values.idleTimeoutSeconds < 30 || values.idleTimeoutSeconds > 600) {
    errors.idleTimeoutSeconds = "Idle timeout harus antara 30–600 detik."
  }
  return errors
}

export const validatePrintSettings = (
  values: KioskPrintSettings
): FieldErrors<KioskPrintSettings> => {
  const errors: FieldErrors<KioskPrintSettings> = {}
  const printerNameError = validateRequiredText(values.printerName, "Printer name")

  if (values.numberOfCopies < 1 || values.numberOfCopies > 10) {
    errors.numberOfCopies = "Number of copies harus antara 1–10."
  }
  if (printerNameError) errors.printerName = printerNameError
  return errors
}

export const hasFieldErrors = <T extends object>(
  errors: FieldErrors<T>
): boolean => Object.keys(errors).length > 0
