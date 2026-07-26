import { ChartNoAxesCombined } from "lucide-react"
import type { ReactElement } from "react"

export function StatisticsEmptyState({
  title = "No statistics available",
  description = "Try another period or clear the active filters.",
}: {
  readonly title?: string
  readonly description?: string
}): ReactElement {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border-y border-border px-6 text-center">
      <ChartNoAxesCombined className="size-8 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-3 font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

