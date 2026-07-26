import { PanelsTopLeft } from "lucide-react"
import type { ReactElement } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TemplatePerformance } from "../types/statistics.types"
import { formatInteger, formatPercentage } from "../utils/statistics-formatters"

export function StatisticsTemplatePerformance({
  templates,
}: {
  readonly templates: ReadonlyArray<TemplatePerformance>
}): ReactElement {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle><h2>Top Performing Templates</h2></CardTitle>
        <CardDescription>Most frequently selected photo layouts.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {templates.map((template) => (
            <li key={template.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted" aria-hidden="true">
                <PanelsTopLeft className="size-5 text-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-medium text-foreground">{template.name}</p><p className="text-xs text-muted-foreground">{template.category}</p></div>
                  <span className="text-xs text-muted-foreground sm:hidden">{formatPercentage(template.usagePercentage, 0)}</span>
                </div>
                <Progress className="mt-2" value={template.usagePercentage} aria-label={`${template.name} usage ${formatPercentage(template.usagePercentage, 0)}`} />
              </div>
              <div className="text-left sm:text-right">
                <p className="font-medium text-foreground tabular-nums">{formatInteger(template.usageCount)}</p>
                <p className="text-xs text-muted-foreground">{formatPercentage(template.usagePercentage, 0)} of uses</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

