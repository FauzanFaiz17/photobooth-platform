import type { ReactElement } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { BoothStatisticsRow } from "./statistics-booth.types"

export function StatisticsTopBooths({
  booths,
}: {
  readonly booths: ReadonlyArray<BoothStatisticsRow>
}): ReactElement {
  const rankedBooths = [...booths]
    .sort((first, second) => second.revenue - first.revenue)
    .slice(0, 5)
  const highestRevenue = rankedBooths[0]?.revenue ?? 1

  return (
    <Card className="min-h-[28rem] shadow-none">
      <CardHeader>
        <CardTitle><h2>Top Booth Penghasilan</h2></CardTitle>
        <CardDescription>Porsi pendapatan per booth</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {rankedBooths.length > 0 ? (
          rankedBooths.map((booth, index) => (
            <div key={booth.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-medium">{index + 1}. {booth.name}</p>
                <p className="shrink-0 text-sm tabular-nums opacity-70">
                  Rp {booth.revenue.toLocaleString("id-ID")}
                </p>
              </div>
              <Progress
                value={(booth.revenue / highestRevenue) * 100}
                aria-label={`Pendapatan ${booth.name}`}
              />
            </div>
          ))
        ) : (
          <div className="flex min-h-72 items-center justify-center text-sm opacity-70">
            Belum ada data
          </div>
        )}
      </CardContent>
    </Card>
  )
}
