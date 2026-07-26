import { Banknote, Clock3, ReceiptText, RotateCcw, TrendingDown, TrendingUp } from "lucide-react"
import type { ReactElement } from "react"

import { Card, CardContent } from "@/components/ui/card"
import type { TransactionSummary } from "../types/transaction.types"
import { formatInteger, formatRupiah } from "../utils/transaction-formatters"

export function TransactionsSummaryCards({ summary }: { readonly summary: TransactionSummary }): ReactElement {
  const metrics = [
    { id: "gross", label: "Gross Revenue", value: formatRupiah(summary.grossRevenue), change: summary.grossRevenueChange, supporting: "compared with previous period", icon: Banknote },
    { id: "successful", label: "Successful Transactions", value: formatInteger(summary.successfulTransactions), change: summary.successfulTransactionsChange, supporting: "compared with previous period", icon: ReceiptText },
    { id: "pending", label: "Pending Payments", value: formatInteger(summary.pendingPayments), change: summary.pendingPaymentsChange, supporting: "compared with previous period", icon: Clock3 },
    { id: "refunded", label: "Refunded Amount", value: formatRupiah(summary.refundedAmount), change: null, supporting: `${formatInteger(summary.refundCount)} refunded transactions`, icon: RotateCcw },
  ] as const

  return (
    <section aria-labelledby="transactions-summary-heading">
      <h2 id="transactions-summary-heading" className="sr-only">Transaction summary</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon
          const TrendIcon = metric.change !== null && metric.change < 0 ? TrendingDown : TrendingUp
          return (
            <Card key={metric.id} className="shadow-none">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-medium text-muted-foreground">{metric.label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{metric.value}</p></div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted"><MetricIcon className="size-4 text-foreground" aria-hidden="true" /></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                  {metric.change !== null && (
                    <span className={`inline-flex items-center gap-1 font-medium ${metric.change < 0 ? "text-destructive" : "text-primary"}`}>
                      <TrendIcon className="size-3.5" aria-hidden="true" />{metric.change > 0 ? "+" : ""}{metric.change.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-muted-foreground">{metric.supporting}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

