import {
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useState, type ReactElement } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type {
  MaintenanceAction,
  MaintenanceActionId,
} from "../types/kiosk.types"

interface KioskMaintenanceActionsProps {
  readonly actions: ReadonlyArray<MaintenanceAction>
  readonly onOpenDiagnostics: () => void
}

const maintenanceIcons = {
  "restart-application": RotateCcw,
  "sync-data": RefreshCcw,
  "clear-temporary-files": Trash2,
  "run-diagnostics": Stethoscope,
  "maintenance-mode": ShieldAlert,
} satisfies Record<MaintenanceActionId, LucideIcon>

const maintenanceFeedback = {
  "restart-application": "Application restart command telah disiapkan untuk Main Studio Booth.",
  "sync-data": "Transaksi, frame, dan configuration berhasil disinkronkan.",
  "clear-temporary-files": "Temporary preview dan session cache berhasil dibersihkan.",
  "run-diagnostics": "Membuka panel diagnostics untuk menjalankan pemeriksaan.",
  "maintenance-mode": "Kiosk masuk maintenance mode dan tidak menerima sesi baru.",
} satisfies Record<MaintenanceActionId, string>

function MaintenanceActionRow({
  action,
  onRun,
}: {
  readonly action: MaintenanceAction
  readonly onRun: (actionId: MaintenanceActionId) => void
}): ReactElement {
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const ActionIcon = maintenanceIcons[action.id]

  if (action.risk === "safe") {
    return (
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <ActionIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">{action.label}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{action.description}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onRun(action.id)}>
          {action.label}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <ActionIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="font-medium text-foreground">{action.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{action.description}</p>
        </div>
      </div>
      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
          {action.label}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ShieldAlert aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Confirm {action.label.toLowerCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              {action.description} Pastikan tidak ada sesi pelanggan yang sedang berjalan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onRun(action.id)
                setConfirmationOpen(false)
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function KioskMaintenanceActions({
  actions,
  onOpenDiagnostics,
}: KioskMaintenanceActionsProps): ReactElement {
  const handleAction = (actionId: MaintenanceActionId): void => {
    if (actionId === "run-diagnostics") onOpenDiagnostics()
    toast.success("Action completed", { description: maintenanceFeedback[actionId] })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2>Maintenance actions</h2>
        </CardTitle>
        <CardDescription>
          Operational controls for the assigned kiosk device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-5">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Check active sessions first</AlertTitle>
          <AlertDescription>
            Restart, cleanup, and maintenance mode can interrupt an active customer session.
          </AlertDescription>
        </Alert>

        <ul>
          {actions.map((action, index) => (
            <li key={action.id}>
              <MaintenanceActionRow action={action} onRun={handleAction} />
              {index < actions.length - 1 && <Separator />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
