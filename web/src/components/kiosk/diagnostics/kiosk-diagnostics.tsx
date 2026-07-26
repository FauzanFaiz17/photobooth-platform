import { Activity, CircleDotDashed } from "lucide-react"
import { useState, type ReactElement } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { KioskStatusBadge } from "../shared/kiosk-status-badge"
import type { KioskDiagnostics as KioskDiagnosticsData } from "../types/kiosk.types"
import { formatDateTime } from "../utils/kiosk-formatters"
import { getDiagnosticResultMeta } from "../utils/kiosk-status-mapper"

interface KioskDiagnosticsProps {
  readonly initialDiagnostics: KioskDiagnosticsData
  readonly completedDiagnostics: KioskDiagnosticsData
}

export function KioskDiagnostics({
  initialDiagnostics,
  completedDiagnostics,
}: KioskDiagnosticsProps): ReactElement {
  const [diagnostics, setDiagnostics] =
    useState<KioskDiagnosticsData>(initialDiagnostics)

  const handleRunDiagnostics = (): void => {
    setDiagnostics(completedDiagnostics)
    toast.success("Diagnostics completed", {
      description: "Camera, printer, internet, payment, dan local service lulus pemeriksaan.",
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>
              <h2>Kiosk diagnostics</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              Run an immediate local check without interrupting sessions.
            </CardDescription>
          </div>
          <Button onClick={handleRunDiagnostics}>
            <Activity aria-hidden="true" />
            Run Diagnostics
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {diagnostics.lastRunAt === null ? (
          <Alert className="mb-5">
            <CircleDotDashed aria-hidden="true" />
            <AlertTitle>Diagnostic belum dijalankan</AlertTitle>
            <AlertDescription>
              Jalankan diagnostics untuk melihat hasil terbaru dari seluruh perangkat.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="mb-5 text-sm text-muted-foreground">
            Last diagnostic run:{" "}
            <time dateTime={diagnostics.lastRunAt}>
              {formatDateTime(diagnostics.lastRunAt)}
            </time>
          </p>
        )}

        <ul>
          {diagnostics.items.map((item, index) => {
            const resultMeta = getDiagnosticResultMeta(item.result)

            return (
              <li key={item.id}>
                <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <KioskStatusBadge meta={resultMeta} />
                    <span className="text-xs font-medium text-foreground tabular-nums">
                      {item.value}
                    </span>
                  </div>
                </div>
                {index < diagnostics.items.length - 1 && <Separator />}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
