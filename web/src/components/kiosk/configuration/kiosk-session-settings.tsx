import { useState, type FormEvent, type ReactElement } from "react"
import { toast } from "sonner"

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
import { Separator } from "@/components/ui/separator"

import { KioskSettingRow } from "../shared/kiosk-setting-row"
import type {
  FieldErrors,
  KioskSessionSettings as KioskSessionSettingsData,
} from "../types/kiosk.types"
import { parseNumericInput } from "../utils/kiosk-formatters"
import {
  hasFieldErrors,
  validateSessionSettings,
} from "../utils/kiosk-validation"

interface KioskSessionSettingsProps {
  readonly initialSettings: KioskSessionSettingsData
}

type NumericSessionField =
  | "sessionDurationMinutes"
  | "countdownSeconds"
  | "captureCount"
  | "idleTimeoutSeconds"

interface NumericFieldProps {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly minimum: number
  readonly maximum: number
  readonly error?: string
  readonly onChange: (value: string) => void
}

function NumericField({
  id,
  label,
  value,
  minimum,
  maximum,
  error,
  onChange,
}: NumericFieldProps): ReactElement {
  const errorId = `${id}-error`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={minimum}
        max={maximum}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function KioskSessionSettings({
  initialSettings,
}: KioskSessionSettingsProps): ReactElement {
  const [settings, setSettings] =
    useState<KioskSessionSettingsData>(initialSettings)
  const [errors, setErrors] =
    useState<FieldErrors<KioskSessionSettingsData>>({})

  const updateNumericField = (field: NumericSessionField, value: string): void => {
    const parsedValue = parseNumericInput(value)
    if (parsedValue === null) return
    setSettings((current) => ({ ...current, [field]: parsedValue }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateSessionSettings(settings)
    setErrors(nextErrors)

    if (hasFieldErrors(nextErrors)) {
      toast.error("Session settings belum tersimpan", {
        description: "Periksa batas nilai yang diizinkan.",
      })
      return
    }

    toast.success("Session settings saved", {
      description: "Pengaturan sesi akan digunakan pada sesi berikutnya.",
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2>Session settings</h2>
        </CardTitle>
        <CardDescription>Timing and customer flow for each photo session.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumericField id="session-duration" label="Session duration (minutes)" value={settings.sessionDurationMinutes} minimum={1} maximum={30} error={errors.sessionDurationMinutes} onChange={(value) => updateNumericField("sessionDurationMinutes", value)} />
            <NumericField id="session-countdown" label="Countdown duration (seconds)" value={settings.countdownSeconds} minimum={3} maximum={10} error={errors.countdownSeconds} onChange={(value) => updateNumericField("countdownSeconds", value)} />
            <NumericField id="session-captures" label="Number of captures" value={settings.captureCount} minimum={1} maximum={10} error={errors.captureCount} onChange={(value) => updateNumericField("captureCount", value)} />
            <NumericField id="session-idle-timeout" label="Idle timeout (seconds)" value={settings.idleTimeoutSeconds} minimum={30} maximum={600} error={errors.idleTimeoutSeconds} onChange={(value) => updateNumericField("idleTimeoutSeconds", value)} />
          </div>

          <Separator className="my-5" />

          <div>
            <KioskSettingRow id="session-retake" label="Retake permission" description="Allow one retake before confirming the session." checked={settings.allowRetake} onCheckedChange={(checked) => setSettings((current) => ({ ...current, allowRetake: checked }))} />
            <Separator />
            <KioskSettingRow id="session-extra-print" label="Extra print permission" description="Let customers purchase additional copies." checked={settings.allowExtraPrint} onCheckedChange={(checked) => setSettings((current) => ({ ...current, allowExtraPrint: checked }))} />
            <Separator />
            <KioskSettingRow id="session-auto-home" label="Auto return to home" description="Return to the welcome screen after session completion." checked={settings.autoReturnToHome} onCheckedChange={(checked) => setSettings((current) => ({ ...current, autoReturnToHome: checked }))} />
            <Separator />
            <KioskSettingRow id="session-confirmation" label="Show confirmation screen" description="Ask customers to confirm photos before printing." checked={settings.showConfirmationScreen} onCheckedChange={(checked) => setSettings((current) => ({ ...current, showConfirmationScreen: checked }))} />
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit">Save Session Settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
