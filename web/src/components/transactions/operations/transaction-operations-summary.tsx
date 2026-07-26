import type { ReactElement } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PhotoboothTransactionSummary } from "./transaction-operations.types"
import { formatTransactionCurrency } from "./transaction-operations.utils"

export function TransactionOperationsSummary({
  summary,
}: {
  readonly summary: PhotoboothTransactionSummary
}): ReactElement {
  const cards = [
    { id: "revenue", label: "Total Pendapatan", value: formatTransactionCurrency(summary.revenue), description: "transaksi berhasil" },
    { id: "success", label: "Transaksi Berhasil", value: summary.successful.toLocaleString("id-ID"), description: "pembayaran selesai" },
    { id: "pending", label: "Transaksi Pending", value: summary.pending.toLocaleString("id-ID"), description: "menunggu pembayaran" },
    { id: "failed", label: "Transaksi Gagal", value: summary.failed.toLocaleString("id-ID"), description: "gagal atau kedaluwarsa" },
    { id: "voucher", label: "Sesi Voucher", value: summary.voucherSessions.toLocaleString("id-ID"), description: "voucher digunakan" },
  ] as const

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Ringkasan transaksi">
      {cards.map((card) => (
        <Card key={card.id} className="min-h-36 shadow-none">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide opacity-60">
              <h2>{card.label}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            <p className="mt-2 text-xs opacity-60">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
