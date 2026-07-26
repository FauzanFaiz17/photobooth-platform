import { CalendarClock, CircleDollarSign, KeyRound, TicketCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { VoucherSummary } from "../types/voucher.types"
import { formatVoucherCurrency, formatVoucherNumber } from "../utils/voucher-utils"

interface VoucherSummaryCardsProps { readonly summary: VoucherSummary }

export function VoucherSummaryCards({ summary }: VoucherSummaryCardsProps) {
  const items = [
    { label: "Active Vouchers", value: formatVoucherNumber(summary.activeVouchers), note: `${summary.generatedThisMonth} generated this month`, icon: KeyRound },
    { label: "Redeemed Vouchers", value: formatVoucherNumber(summary.redeemedVouchers), note: `${summary.redemptionRate}% redemption rate`, icon: TicketCheck },
    { label: "Expiring Soon", value: formatVoucherNumber(summary.expiringSoon), note: "Expire within 7 days", icon: CalendarClock },
    { label: "Sessions from Vouchers", value: formatVoucherNumber(summary.voucherSessions), note: `${formatVoucherCurrency(summary.equivalentValue)} equivalent value`, icon: CircleDollarSign },
  ] as const
  return <section aria-label="Voucher summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <Card key={item.label}><CardContent className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div><div className="rounded-md bg-muted p-2 text-muted-foreground"><item.icon className="size-4" aria-hidden="true" /></div></CardContent></Card>)}</section>
}
