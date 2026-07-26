import {
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { formatTrendPercentage } from "./formatters"
import type { TrendDirection } from "./types"

interface TrendBadgeProps {
  readonly direction: TrendDirection
  readonly percentage: number
  readonly className?: string
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} satisfies Record<TrendDirection, LucideIcon>

const trendClassNames = {
  up: "bg-primary/10 text-primary",
  down: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
} satisfies Record<TrendDirection, string>

export function TrendBadge({
  direction,
  percentage,
  className,
}: TrendBadgeProps) {
  const TrendIcon = trendIcons[direction]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        trendClassNames[direction],
        className
      )}
    >
      <TrendIcon className="size-3" aria-hidden="true" />
      {formatTrendPercentage(direction, percentage)}
    </span>
  )
}
