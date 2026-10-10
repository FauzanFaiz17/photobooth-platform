import { useEffect, useRef, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { OverviewChartRow } from "@/features/reports/report-overview"

import type { PartnerSeries } from "./hooks/use-overview-charts"
import { formatCompactNumber, formatRevenue } from "./overview-formatters"

function buildConfig(series: ReadonlyArray<PartnerSeries>): ChartConfig {
  return series.reduce<ChartConfig>((config, item) => {
    config[item.key] = { label: item.label, color: item.color }
    return config
  }, {})
}

function readActiveLabel(state: unknown): string | null {
  if (typeof state !== "object" || state === null) return null
  const label = (state as { activeLabel?: unknown }).activeLabel
  return typeof label === "string" ? label : null
}

function clampIndexRange(
  start: number,
  end: number,
  lastIndex: number
): { start: number; end: number } {
  let nextStart = Math.max(0, start)
  let nextEnd = Math.min(lastIndex, end)
  if (nextEnd - nextStart < 1) {
    nextEnd = Math.min(lastIndex, nextStart + 1)
    nextStart = Math.max(0, nextEnd - 1)
  }
  return { start: nextStart, end: nextEnd }
}

export function RevenueTrendChart({
  rows,
  series,
}: {
  readonly rows: ReadonlyArray<OverviewChartRow>
  readonly series: ReadonlyArray<PartnerSeries>
}) {
  const [zoom, setZoom] = useState<{ start: number; end: number } | null>(null)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const hoverIndexRef = useRef<number | null>(null)

  const lastIndex = Math.max(0, rows.length - 1)
  const indexByLabel = new Map(rows.map((row, index) => [String(row.period), index]))
  const visibleRows = zoom ? rows.slice(zoom.start, zoom.end + 1) : rows
  const dragging = dragStart !== null && dragEnd !== null
  const areaFrom = dragging ? rows[Math.min(dragStart, dragEnd)]?.period : undefined
  const areaTo = dragging ? rows[Math.max(dragStart, dragEnd)]?.period : undefined

  const range = zoom ?? { start: 0, end: lastIndex }

  function indexOf(label: string | null): number | null {
    if (label === null) return null
    const index = indexByLabel.get(label)
    return index === undefined ? null : index
  }

  useEffect(() => {
    const element = wrapperRef.current
    if (!element || rows.length === 0) return

    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      const span = range.end - range.start
      const anchor = hoverIndexRef.current ?? Math.round((range.start + range.end) / 2)
      const ratio = span > 0 ? (anchor - range.start) / span : 0.5
      const nextSpan = Math.min(
        lastIndex,
        event.deltaY < 0
          ? Math.max(1, Math.round(span * 0.6))
          : Math.round(span / 0.6) + 1
      )
      const next = clampIndexRange(
        Math.round(anchor - ratio * nextSpan),
        Math.round(anchor - ratio * nextSpan) + nextSpan,
        lastIndex
      )
      if (next.start === 0 && next.end === lastIndex) setZoom(null)
      else setZoom(next)
    }

    element.addEventListener("wheel", handleWheel, { passive: false })
    return () => element.removeEventListener("wheel", handleWheel)
  }, [lastIndex, range.end, range.start, rows.length])

  function handleMouseDown(state: unknown) {
    const index = indexOf(readActiveLabel(state))
    if (index === null) return
    setDragStart(index)
    setDragEnd(index)
  }

  function handleMouseMove(state: unknown) {
    const index = indexOf(readActiveLabel(state))
    if (index !== null) hoverIndexRef.current = index
    if (dragStart === null || index === null) return
    setDragEnd(index)
  }

  function handleMouseUp() {
    if (dragStart !== null && dragEnd !== null && dragStart !== dragEnd) {
      setZoom(
        clampIndexRange(Math.min(dragStart, dragEnd), Math.max(dragStart, dragEnd), lastIndex)
      )
    }
    setDragStart(null)
    setDragEnd(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-5 justify-end">
        {zoom && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setZoom(null)}
          >
            Tampilkan semua
          </button>
        )}
      </div>
      <div
        ref={wrapperRef}
        className="select-none [&_.recharts-surface]:cursor-crosshair"
      >
        <ChartContainer config={buildConfig(series)} className="h-64 w-full">
          <LineChart
            data={[...visibleRows]}
            margin={{ left: 4, right: 8, top: 8 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={formatCompactNumber}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatRevenue(Number(value))}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {series.map((item) => (
              <Line
                key={item.key}
                dataKey={item.key}
                type="monotone"
                stroke={`var(--color-${item.key})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
            {dragging && areaFrom !== undefined && areaTo !== undefined && (
              <ReferenceArea
                x1={areaFrom}
                x2={areaTo}
                stroke="var(--chart-1)"
                strokeOpacity={0.4}
                fill="var(--chart-1)"
                fillOpacity={0.15}
              />
            )}
          </LineChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Scroll / pinch di chart untuk zoom (berpusat di kursor), atau tarik
        (highlight) untuk zoom ke rentang. Klik "Tampilkan semua" untuk reset.
      </p>
    </div>
  )
}
