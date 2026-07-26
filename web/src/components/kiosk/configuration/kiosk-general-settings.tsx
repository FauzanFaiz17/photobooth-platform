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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { KioskSettingRow } from "../shared/kiosk-setting-row"
import type {
  FieldErrors,
  KioskGeneralSettings as KioskGeneralSettingsData,
  SessionMode,
  SupportedLanguage,
  SupportedTimezone,
} from "../types/kiosk.types"
import {
  hasFieldErrors,
  validateGeneralSettings,
} from "../utils/kiosk-validation"

interface KioskGeneralSettingsProps {
  readonly initialSettings: KioskGeneralSettingsData
  readonly onSaved: (settings: KioskGeneralSettingsData) => void
}

type GeneralTextField = "kioskName" | "location" | "serviceName"

const languageOptions = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
] satisfies ReadonlyArray<{ value: SupportedLanguage; label: string }>

const timezoneOptions = [
  { value: "Asia/Jakarta", label: "WIB · Asia/Jakarta" },
  { value: "Asia/Makassar", label: "WITA · Asia/Makassar" },
  { value: "Asia/Jayapura", label: "WIT · Asia/Jayapura" },
] satisfies ReadonlyArray<{ value: SupportedTimezone; label: string }>

const sessionModeOptions = [
  { value: "standard", label: "Standard" },
  { value: "live", label: "Live" },
  { value: "event", label: "Event" },
] satisfies ReadonlyArray<{ value: SessionMode; label: string }>

function FieldError({
  id,
  message,
}: {
  readonly id: string
  readonly message?: string
}): ReactElement | null {
  if (!message) return null
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  )
}

export function KioskGeneralSettings({
  initialSettings,
  onSaved,
}: KioskGeneralSettingsProps): ReactElement {
  const [settings, setSettings] =
    useState<KioskGeneralSettingsData>(initialSettings)
  const [errors, setErrors] =
    useState<FieldErrors<KioskGeneralSettingsData>>({})

  const updateTextField = (field: GeneralTextField, value: string): void => {
    setSettings((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateGeneralSettings(settings)
    setErrors(nextErrors)

    if (hasFieldErrors(nextErrors)) {
      toast.error("Configuration belum tersimpan", {
        description: "Periksa kembali field yang memiliki error.",
      })
      return
    }

    onSaved(settings)
    toast.success("General configuration saved", {
      description: "Kiosk identity dan operating preferences telah diperbarui.",
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <h2>General configuration</h2>
        </CardTitle>
        <CardDescription>Identity and operating defaults for this kiosk.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="general-kiosk-name">Kiosk name</Label>
              <Input
                id="general-kiosk-name"
                value={settings.kioskName}
                onChange={(event) => updateTextField("kioskName", event.target.value)}
                aria-invalid={Boolean(errors.kioskName)}
                aria-describedby={errors.kioskName ? "general-kiosk-name-error" : undefined}
              />
              <FieldError id="general-kiosk-name-error" message={errors.kioskName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="general-location">Location</Label>
              <Input
                id="general-location"
                value={settings.location}
                onChange={(event) => updateTextField("location", event.target.value)}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? "general-location-error" : undefined}
              />
              <FieldError id="general-location-error" message={errors.location} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="general-service-name">Service name</Label>
              <Input
                id="general-service-name"
                value={settings.serviceName}
                onChange={(event) => updateTextField("serviceName", event.target.value)}
                aria-invalid={Boolean(errors.serviceName)}
                aria-describedby={errors.serviceName ? "general-service-name-error" : undefined}
              />
              <FieldError id="general-service-name-error" message={errors.serviceName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="general-language">Default language</Label>
              <Select<SupportedLanguage>
                value={settings.defaultLanguage}
                items={languageOptions}
                onValueChange={(value) => {
                  if (value !== null) {
                    setSettings((current) => ({ ...current, defaultLanguage: value }))
                  }
                }}
              >
                <SelectTrigger id="general-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="general-timezone">Timezone</Label>
              <Select<SupportedTimezone>
                value={settings.timezone}
                items={timezoneOptions}
                onValueChange={(value) => {
                  if (value !== null) {
                    setSettings((current) => ({ ...current, timezone: value }))
                  }
                }}
              >
                <SelectTrigger id="general-timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="general-session-mode">Session mode</Label>
              <Select<SessionMode>
                value={settings.sessionMode}
                items={sessionModeOptions}
                onValueChange={(value) => {
                  if (value !== null) {
                    setSettings((current) => ({ ...current, sessionMode: value }))
                  }
                }}
              >
                <SelectTrigger id="general-session-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sessionModeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-5" />

          <div>
            <KioskSettingRow
              id="general-auto-update"
              label="Auto update device"
              description="Install stable application updates automatically."
              checked={settings.autoUpdateDevice}
              onCheckedChange={(checked) =>
                setSettings((current) => ({ ...current, autoUpdateDevice: checked }))
              }
            />
            <Separator />
            <KioskSettingRow
              id="general-live-mode"
              label="Enable live mode"
              description="Allow customers to start sessions from the kiosk home screen."
              checked={settings.enableLiveMode}
              onCheckedChange={(checked) =>
                setSettings((current) => ({ ...current, enableLiveMode: checked }))
              }
            />
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit">Save General Settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
