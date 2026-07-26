import { CalendarDays } from "lucide-react"
import type { ChangeEvent, ReactElement } from "react"

import { Card } from "@/components/ui/card"
import { formatDisplayDate } from "./overview-data"

interface OverviewHeaderProps {
  readonly date: string
  readonly activeBooths: number
  readonly totalBooths: number
  readonly onDateChange: (value: string) => void
}

export function OverviewHeader({
  date,
  activeBooths,
  totalBooths,
  onDateChange,
}: OverviewHeaderProps): ReactElement {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.value) onDateChange(event.target.value)
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Beranda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeBooths} booth aktif dari {totalBooths} total booth
        </p>
      </div>

      <Card className="relative w-full gap-0 px-4 py-3 shadow-none transition-shadow focus-within:ring-2 focus-within:ring-ring/50 hover:bg-muted/40 sm:w-auto">
        <div className="flex items-center gap-3">
          <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">Tanggal Dipilih</p>
            <p className="font-semibold tabular-nums text-foreground">
              {formatDisplayDate(date)}
            </p>
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={handleChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Pilih tanggal overview"
        />
      </Card>
    </header>
  )
}
