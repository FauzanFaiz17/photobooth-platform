import type { UserRecord } from "@/features/users/user.types"

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function createUserInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

export function formatUserDate(
  value: string | null,
  fallback = "—"
): string {
  if (!value) return fallback

  const normalizedValue =
    value.includes(" ") && !value.includes("T")
      ? value.replace(" ", "T")
      : value
  const date = new Date(normalizedValue)

  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export function getUserPartnerName(user: UserRecord): string {
  if (!user.partner) return "System"
  return user.partner.brand_name || user.partner.company_name
}
