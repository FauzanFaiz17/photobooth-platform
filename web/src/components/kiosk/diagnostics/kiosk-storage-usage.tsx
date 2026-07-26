import { Database, HardDrive } from "lucide-react"
import type { ReactElement } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import type { StorageUsage } from "../types/kiosk.types"
import {
  clampPercentage,
  formatInteger,
  formatRelativeTime,
  formatStorage,
} from "../utils/kiosk-formatters"

interface KioskStorageUsageProps {
  readonly storage: StorageUsage
  readonly referenceTime: string
}

export function KioskStorageUsage({
  storage,
  referenceTime,
}: KioskStorageUsageProps): ReactElement {
  const usagePercentage = clampPercentage(storage.usagePercentage)

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2>Storage usage</h2>
        </CardTitle>
        <CardDescription>Local session files on the assigned device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {usagePercentage}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">storage used</p>
          </div>
          <HardDrive className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>

        <Progress
          value={usagePercentage}
          className="mt-5"
          aria-label={`${usagePercentage}% storage digunakan`}
        />

        <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {formatStorage(storage.totalGb)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Used</dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {formatStorage(storage.usedGb)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Available</dt>
            <dd className="mt-1 font-medium text-foreground tabular-nums">
              {formatStorage(storage.availableGb)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Database className="size-4" aria-hidden="true" />
              Stored sessions
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {formatInteger(storage.storedSessions)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Last cleanup</span>
            <time dateTime={storage.lastCleanupAt} className="font-medium text-foreground">
              {formatRelativeTime(storage.lastCleanupAt, referenceTime)}
            </time>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
