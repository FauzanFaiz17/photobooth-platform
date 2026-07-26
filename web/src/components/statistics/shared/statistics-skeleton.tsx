import type { ReactElement } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StatisticsSkeleton(): ReactElement {
  return (
    <div className="min-w-0 space-y-7 p-4 sm:p-6 lg:p-8" aria-label="Loading Statistics">
      <div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full max-w-xl" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={`statistics-metric-${index + 1}`} className="h-36 w-full" />)}
      </div>
      <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
    </div>
  )
}

