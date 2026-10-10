const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const compactFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatRevenue(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatCompactNumber(value: number): string {
  return compactFormatter.format(Number.isFinite(value) ? value : 0)
}
