import { useState, type FormEvent, type ReactElement } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { KioskSettingRow } from "../shared/kiosk-setting-row"
import { KioskStatusBadge } from "../shared/kiosk-status-badge"
import type {
  FieldErrors,
  KioskPrintSettings as KioskPrintSettingsData,
  PrintSize,
} from "../types/kiosk.types"
import { parseNumericInput } from "../utils/kiosk-formatters"
import { getPrinterStatusMeta } from "../utils/kiosk-status-mapper"
import {
  hasFieldErrors,
  validatePrintSettings,
} from "../utils/kiosk-validation"

interface KioskPrintSettingsProps {
  readonly initialSettings: KioskPrintSettingsData
}

const printSizeOptions = [
  { value: "2x6", label: "2 × 6 inch" },
  { value: "4x6", label: "4 × 6 inch" },
  { value: "5x7", label: "5 × 7 inch" },
] satisfies ReadonlyArray<{ value: PrintSize; label: string }>

const paperStatusLabels = {
  available: "Available",
  low: "Low",
  empty: "Empty",
} satisfies Record<KioskPrintSettingsData["paperStatus"], string>

export function KioskPrintSettings({
  initialSettings,
}: KioskPrintSettingsProps): ReactElement {
  const [settings, setSettings] =
    useState<KioskPrintSettingsData>(initialSettings)
  const [errors, setErrors] = useState<FieldErrors<KioskPrintSettingsData>>({})
  const printerMeta = getPrinterStatusMeta(settings.printerStatus)

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validatePrintSettings(settings)
    setErrors(nextErrors)

    if (hasFieldErrors(nextErrors)) {
      toast.error("Print settings belum tersimpan", {
        description: "Periksa printer name dan jumlah copy.",
      })
      return
    }

    toast.success("Print settings saved", {
      description: "Pengaturan printer akan digunakan pada sesi berikutnya.",
    })
  }

  const handleTestPrint = (): void => {
    toast.success("Test print sent", {
      description: `${settings.printerName} menerima satu test page ${settings.defaultPrintSize}.`,
    })
  }

  const handleClearQueue = (): void => {
    setSettings((current) => ({ ...current, queueCount: 0 }))
    toast.success("Printer queue cleared", {
      description: "Tidak ada print job yang tertunda.",
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>
              <h2>Print settings</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              Default printer behavior and output format.
            </CardDescription>
          </div>
          <KioskStatusBadge meta={printerMeta} />
        </div>
      </CardHeader>
      <CardContent>
        {(settings.printerStatus === "offline" ||
          settings.printerStatus === "error") && (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Printer unavailable</AlertTitle>
            <AlertDescription>
              Printing controls are limited until the device reconnects.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="print-size">Default print size</Label>
              <Select<PrintSize>
                value={settings.defaultPrintSize}
                items={printSizeOptions}
                onValueChange={(value) => {
                  if (value !== null) {
                    setSettings((current) => ({ ...current, defaultPrintSize: value }))
                  }
                }}
              >
                <SelectTrigger id="print-size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {printSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="print-copies">Number of copies</Label>
              <Input
                id="print-copies"
                type="number"
                min={1}
                max={10}
                value={settings.numberOfCopies}
                onChange={(event) => {
                  const value = parseNumericInput(event.target.value)
                  if (value !== null) {
                    setSettings((current) => ({ ...current, numberOfCopies: value }))
                    setErrors((current) => ({ ...current, numberOfCopies: undefined }))
                  }
                }}
                aria-invalid={Boolean(errors.numberOfCopies)}
                aria-describedby={
                  errors.numberOfCopies ? "print-copies-error" : undefined
                }
              />
              {errors.numberOfCopies && (
                <p id="print-copies-error" className="text-xs text-destructive">
                  {errors.numberOfCopies}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="printer-name">Printer name</Label>
              <Input
                id="printer-name"
                value={settings.printerName}
                onChange={(event) => {
                  setSettings((current) => ({
                    ...current,
                    printerName: event.target.value,
                  }))
                  setErrors((current) => ({ ...current, printerName: undefined }))
                }}
                aria-invalid={Boolean(errors.printerName)}
                aria-describedby={errors.printerName ? "printer-name-error" : undefined}
              />
              {errors.printerName && (
                <p id="printer-name-error" className="text-xs text-destructive">
                  {errors.printerName}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Paper status</dt>
              <dd className="font-medium text-foreground">
                {paperStatusLabels[settings.paperStatus]}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Printer queue</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {settings.queueCount} jobs
              </dd>
            </div>
          </dl>

          <div className="mt-2">
            <KioskSettingRow id="print-automatic" label="Enable automatic printing" description="Print the selected layout after customer confirmation." checked={settings.automaticPrinting} onCheckedChange={(checked) => setSettings((current) => ({ ...current, automaticPrinting: checked }))} />
            <Separator />
            <KioskSettingRow id="print-extra" label="Enable extra print" description="Allow paid additional copies from the confirmation screen." checked={settings.extraPrintEnabled} onCheckedChange={(checked) => setSettings((current) => ({ ...current, extraPrintEnabled: checked }))} />
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleTestPrint}>
                Test Print
              </Button>
              <Button type="button" variant="outline" onClick={handleClearQueue}>
                Clear Queue
              </Button>
            </div>
            <Button type="submit">Save Print Settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
