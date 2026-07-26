const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatGalleryDate(value: string): string {
  return shortDateFormatter.format(new Date(value))
}

export function formatGalleryDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}
