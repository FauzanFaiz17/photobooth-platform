import { Search } from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { PopularFrameRow } from "./statistics-booth.types"

export function StatisticsPopularFrames({
  frames,
}: {
  readonly frames: ReadonlyArray<PopularFrameRow>
}): ReactElement {
  const [query, setQuery] = useState("")
  const visibleFrames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
    if (!normalizedQuery) return frames
    return frames.filter((frame) =>
      frame.name.toLocaleLowerCase("id-ID").includes(normalizedQuery)
    )
  }, [frames, query])

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle><h2>Frame Terpopuler</h2></CardTitle>
        <CardDescription>Frame yang paling sering dipakai bulan ini</CardDescription>
        <CardAction className="text-sm opacity-70">{frames.length} frame</CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 pl-9"
            placeholder="Cari nama frame"
            aria-label="Cari nama frame"
          />
        </div>

        {visibleFrames.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleFrames.map((frame, index) => (
              <div key={frame.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{index + 1}. {frame.name}</p>
                    <p className="mt-1 text-xs opacity-60">{frame.category}</p>
                  </div>
                  <p className="text-sm tabular-nums opacity-70">{frame.usageCount} kali</p>
                </div>
                <Progress value={frame.usagePercentage} aria-label={`${frame.name} ${frame.usagePercentage}%`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-32 items-center justify-center text-sm opacity-70">
            Belum ada data penggunaan frame
          </div>
        )}
      </CardContent>
    </Card>
  )
}
