import { ChevronDown, Download, FileSpreadsheet, FileText, Plus } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export type TransactionExportFormat = "csv" | "excel" | "pdf"

export function TransactionsHeader({
  onExport,
  onCreate,
}: {
  readonly onExport: (format: TransactionExportFormat) => void
  readonly onCreate: () => void
}): ReactElement {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Sales operations</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Transactions</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">Review payments, transaction statuses, refunds, and kiosk sales.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}><Download aria-hidden="true" /> Export <ChevronDown aria-hidden="true" /></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport("csv")}><FileText aria-hidden="true" /> Export CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("excel")}><FileSpreadsheet aria-hidden="true" /> Export Excel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("pdf")}><FileText aria-hidden="true" /> Export PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={onCreate}><Plus aria-hidden="true" /> Create Transaction</Button>
      </div>
    </header>
  )
}

