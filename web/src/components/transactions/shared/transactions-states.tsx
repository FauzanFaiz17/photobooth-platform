import { CircleAlert, ReceiptText } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TransactionsEmptyState({
  filtered,
  onReset,
  onCreate,
}: {
  readonly filtered: boolean
  readonly onReset: () => void
  readonly onCreate: () => void
}): ReactElement {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border-y border-border px-6 text-center">
      <ReceiptText className="size-9 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-3 font-medium text-foreground">No transactions found</h3>
      <p className="mt-1 text-sm text-muted-foreground">{filtered ? "Try adjusting your search or filters." : "Create the first transaction to begin tracking kiosk sales."}</p>
      <Button className="mt-4" variant={filtered ? "outline" : "default"} onClick={filtered ? onReset : onCreate}>{filtered ? "Reset filters" : "Create Transaction"}</Button>
    </div>
  )
}

export function TransactionsErrorState({ onRetry }: { readonly onRetry: () => void }): ReactElement {
  return <div className="flex min-h-72 flex-col items-center justify-center border-y border-border px-6 text-center"><CircleAlert className="size-9 text-destructive" aria-hidden="true" /><h3 className="mt-3 font-medium text-foreground">Transactions unavailable</h3><p className="mt-1 text-sm text-muted-foreground">The transaction list could not be prepared.</p><Button className="mt-4" variant="outline" onClick={onRetry}>Retry</Button></div>
}

export function TransactionsSkeleton(): ReactElement {
  return <div className="min-w-0 space-y-7 p-4 sm:p-6 lg:p-8" aria-label="Loading Transactions"><div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full max-w-xl" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={`transaction-summary-${index + 1}`} className="h-36" />)}</div><Card><CardHeader><Skeleton className="h-10 w-full" /></CardHeader><CardContent className="space-y-3">{Array.from({ length: 8 }, (_, index) => <Skeleton key={`transaction-row-${index + 1}`} className="h-14 w-full" />)}</CardContent></Card></div>
}

