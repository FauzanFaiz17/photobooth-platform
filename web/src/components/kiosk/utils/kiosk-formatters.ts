const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})

const integerFormatter = new Intl.NumberFormat("id-ID")

export const formatDateTime = (isoDate: string): string =>
  dateTimeFormatter.format(new Date(isoDate))

export const formatInteger = (value: number): string =>
  integerFormatter.format(value)

export const formatStorage = (valueGb: number): string => `${valueGb} GB`

export const clampPercentage = (value: number): number =>
  Math.min(100, Math.max(0, value))

export const formatPercentage = (value: number): string =>
  `${clampPercentage(value).toLocaleString("id-ID", {
    maximumFractionDigits: 1,
  })}%`

export const formatRelativeTime = (
  isoDate: string,
  referenceIsoDate: string
): string => {
  const elapsedMilliseconds = Math.max(
    0,
    new Date(referenceIsoDate).getTime() - new Date(isoDate).getTime()
  )
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000)

  if (elapsedMinutes < 1) return "baru saja"
  if (elapsedMinutes < 60) return `${elapsedMinutes} menit yang lalu`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours} jam yang lalu`

  const elapsedDays = Math.floor(elapsedHours / 24)
  return `${elapsedDays} hari yang lalu`
}

export const parseNumericInput = (value: string): number | null => {
  const normalizedValue = value.trim()
  if (normalizedValue.length === 0) return null

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : null
}
