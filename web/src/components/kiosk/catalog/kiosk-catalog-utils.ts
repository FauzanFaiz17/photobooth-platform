const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function formatKioskCurrency(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`
}

export function formatKioskDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

export function getDaysUntilExpiration(value: string): number {
  const [year, month, day] = value.split("-").map(Number)
  const expirationDate = new Date(year, month - 1, day)
  const referenceDate = new Date(2026, 6, 17)
  const millisecondsPerDay = 86_400_000
  return Math.max(0, Math.ceil((expirationDate.getTime() - referenceDate.getTime()) / millisecondsPerDay))
}
