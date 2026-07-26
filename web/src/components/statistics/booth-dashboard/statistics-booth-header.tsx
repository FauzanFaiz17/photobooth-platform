import { CalendarDays } from "lucide-react"
import type { ChangeEvent, ReactElement } from "react"

import { Card } from "@/components/ui/card"

const displayDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

interface StatisticsBoothHeaderProps {
  readonly date: string
  readonly activeBooths: number
  readonly totalBooths: number
  readonly onDateChange: (value: string) => void
}

export function StatisticsBoothHeader({
  date,
  activeBooths,
  totalBooths,
  onDateChange,
}: StatisticsBoothHeaderProps): ReactElement {
  const handleDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.value) onDateChange(event.target.value)
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Statistik Booth</h1>
        <p className="mt-1 text-sm opacity-70">
          {activeBooths} booth aktif dari {totalBooths} total booth
        </p>
      </div>

      <Card className="relative w-full gap-0 px-4 py-3 shadow-none sm:w-auto">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 opacity-60" aria-hidden="true" />
          <div>
            <p className="text-xs opacity-60">Tanggal Dipilih</p>
            <p className="font-semibold tabular-nums">
              {displayDateFormatter.format(new Date(`${date}T00:00:00+07:00`))}
            </p>
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Pilih tanggal statistik"
        />
      </Card>
    </header>
  )
}
