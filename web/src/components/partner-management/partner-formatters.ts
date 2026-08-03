import type { PartnerRecord } from "@/features/partners/partner.types"

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
})

function normalizeDateValue(value: string): string {
  return value.includes(" ") && !value.includes("T")
    ? value.replace(" ", "T")
    : value
}

export function formatPartnerDateTime(
  value: string | null,
  fallback = "—"
): string {
  if (!value) return fallback

  const date = new Date(normalizeDateValue(value))

  return Number.isNaN(date.getTime())
    ? value
    : dateTimeFormatter.format(date)
}

export function formatPartnerDate(
  value: string | null,
  fallback = "—"
): string {
  if (!value) return fallback

  const date = new Date(normalizeDateValue(value))

  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export function createPartnerInitials(companyName: string): string {
  return companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

export function getPartnerDisplayName(partner: PartnerRecord): string {
  return partner.brand_name || partner.company_name
}

export function getPartnerPlanName(partner: PartnerRecord): string {
  return partner.subscription?.plan.name ?? "Tanpa langganan aktif"
}

export function getPartnerPlanPeriod(partner: PartnerRecord): string | null {
  if (!partner.subscription) return null

  return `Berakhir ${formatPartnerDate(partner.subscription.ends_at)}`
}
