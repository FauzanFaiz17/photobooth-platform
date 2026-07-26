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
  KioskPaymentSettings as KioskPaymentSettingsData,
  PaymentProvider,
} from "../types/kiosk.types"
import {
  formatDateTime,
  formatPercentage,
} from "../utils/kiosk-formatters"
import { getPaymentStatusMeta } from "../utils/kiosk-status-mapper"

interface KioskPaymentSettingsProps {
  readonly initialSettings: KioskPaymentSettingsData
}

const providerOptions = [
  { value: "midtrans", label: "Midtrans" },
  { value: "xendit", label: "Xendit" },
  { value: "doku", label: "DOKU" },
  { value: "manual", label: "Manual" },
] satisfies ReadonlyArray<{ value: PaymentProvider; label: string }>

export function KioskPaymentSettings({
  initialSettings,
}: KioskPaymentSettingsProps): ReactElement {
  const [settings, setSettings] =
    useState<KioskPaymentSettingsData>(initialSettings)
  const paymentMeta = getPaymentStatusMeta(settings.connectionStatus)

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    toast.success("Payment settings saved", {
      description: "Payment methods and provider preferences have been updated.",
    })
  }

  const handleConnectionCheck = (): void => {
    toast.success("Payment connection active", {
      description: "Provider health check berhasil tanpa membuka credential.",
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>
              <h2>Payment settings</h2>
            </CardTitle>
            <CardDescription className="mt-1">
              Customer payment methods and provider connection.
            </CardDescription>
          </div>
          <KioskStatusBadge meta={paymentMeta} />
        </div>
      </CardHeader>
      <CardContent>
        {settings.connectionStatus === "inactive" && (
          <Alert className="mb-5">
            <AlertTitle>Payment provider inactive</AlertTitle>
            <AlertDescription>
              Online and QR payments are unavailable until a provider reconnects.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="payment-provider">Payment provider</Label>
            <Select<PaymentProvider>
              value={settings.provider}
              items={providerOptions}
              onValueChange={(value) => {
                if (value !== null) {
                  setSettings((current) => ({ ...current, provider: value }))
                }
              }}
            >
              <SelectTrigger id="payment-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <dl className="mt-5 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Last successful transaction</dt>
              <dd className="mt-1 font-medium text-foreground">
                <time dateTime={settings.lastSuccessfulTransactionAt}>
                  {formatDateTime(settings.lastSuccessfulTransactionAt)}
                </time>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment success rate</dt>
              <dd className="mt-1 font-medium text-foreground tabular-nums">
                {formatPercentage(settings.successRate)}
              </dd>
            </div>
          </dl>

          <div className="mt-2">
            <KioskSettingRow id="payment-online" label="Online payment" description="Accept payments through the configured provider." checked={settings.onlinePaymentEnabled} onCheckedChange={(checked) => setSettings((current) => ({ ...current, onlinePaymentEnabled: checked }))} />
            <Separator />
            <KioskSettingRow id="payment-offline" label="Offline payment" description="Allow manual payment confirmation when internet is unavailable." checked={settings.offlinePaymentEnabled} onCheckedChange={(checked) => setSettings((current) => ({ ...current, offlinePaymentEnabled: checked }))} />
            <Separator />
            <KioskSettingRow id="payment-qr" label="QR payment" description="Show a dynamic QR code before starting a paid session." checked={settings.qrPaymentEnabled} onCheckedChange={(checked) => setSettings((current) => ({ ...current, qrPaymentEnabled: checked }))} />
            <Separator />
            <KioskSettingRow id="payment-cash" label="Cash payment" description="Allow staff-assisted cash confirmation." checked={settings.cashPaymentEnabled} onCheckedChange={(checked) => setSettings((current) => ({ ...current, cashPaymentEnabled: checked }))} />
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={handleConnectionCheck}>
              Check Connection
            </Button>
            <Button type="submit">Save Payment Settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
