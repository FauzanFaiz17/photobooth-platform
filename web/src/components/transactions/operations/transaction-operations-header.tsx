import { CalendarDays, Download } from "lucide-react"
import type { ChangeEvent, ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const selectedDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

interface TransactionOperationsHeaderProps {
  readonly selectedDate: string
  readonly onDateChange: (value: string) => void
  readonly onExport: () => void
}

export function TransactionOperationsHeader({
  selectedDate,
  onDateChange,
  onExport,
}: TransactionOperationsHeaderProps): ReactElement {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.value) onDateChange(event.target.value)
  }

  return (
    <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Transaksi</h1>
        <p className="mt-2 max-w-2xl text-sm opacity-70 sm:text-base">
          Pantau transaksi kiosk, sesi voucher, pembayaran, dan sesi gratis Kolase Photobooth.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Card className="relative min-w-52 gap-0 px-4 py-2 shadow-none">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 opacity-60" aria-hidden="true" />
            <div>
              <p className="text-xs opacity-60">Tanggal Dipilih</p>
              <p className="font-semibold tabular-nums">
                {selectedDateFormatter.format(new Date(`${selectedDate}T00:00:00+07:00`))}
              </p>
            </div>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={handleChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Pilih tanggal transaksi"
          />
        </Card>
        <Button onClick={onExport} size="lg">
          <Download aria-hidden="true" />
          Export Data
        </Button>
      </div>
    </header>
  )
}
