import type { ReactElement } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { formatRupiah } from "../formatters"
import type { BoothListItem } from "./overview-types"

interface TopBoothCardProps {
  readonly booths: ReadonlyArray<BoothListItem>
}

export function TopBoothCard({ booths }: TopBoothCardProps): ReactElement {
  const rankedBooths = [...booths]
    .sort((first, second) => second.revenue - first.revenue)
    .slice(0, 5)
  const totalRevenue = rankedBooths.reduce((sum, booth) => sum + booth.revenue, 0)

  return (
    <Card className="min-h-96 shadow-none">
      <CardHeader>
        <CardTitle><h2>Top Booth Penghasilan</h2></CardTitle>
        <CardDescription>
          Porsi pendapatan per booth hari ini
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        {rankedBooths.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        ) : (
          <ol className="w-full space-y-5">
            {rankedBooths.map((booth, index) => {
              const sharePercentage =
                totalRevenue === 0
                  ? 0
                  : Math.round((booth.revenue / totalRevenue) * 100)

              return (
                <li key={booth.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground tabular-nums"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <span className="truncate">{booth.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatRupiah(booth.revenue)}
                      <span className="ml-2 text-xs">({sharePercentage}%)</span>
                    </span>
                  </div>
                  <Progress
                    value={sharePercentage}
                    aria-label={`${booth.name}: ${sharePercentage}% dari total pendapatan`}
                  />
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
